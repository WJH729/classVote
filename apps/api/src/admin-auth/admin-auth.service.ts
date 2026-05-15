import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { AuditService, type AuditContext } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type { AdminAccessJwtPayload } from './admin-jwt.strategy';

function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex');
}

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  private accessTtlSeconds() {
    return Number(process.env.ADMIN_JWT_ACCESS_TTL_SECONDS ?? 900);
  }

  private refreshTtlSeconds() {
    return Number(process.env.ADMIN_JWT_REFRESH_TTL_SECONDS ?? 60 * 60 * 24 * 14);
  }

  private refreshSecret() {
    return process.env.ADMIN_JWT_REFRESH_SECRET ?? '';
  }

  private async getAdminPermissions(adminUserId: string): Promise<string[]> {
    const rows = await this.prisma.rolePermission.findMany({
      where: {
        role: { users: { some: { adminUserId } } },
      },
      select: { permission: { select: { key: true } } },
    });
    return Array.from(new Set(rows.map((r) => r.permission.key)));
  }

  private async signAccessToken(payload: AdminAccessJwtPayload) {
    return this.jwt.signAsync(payload, {
      expiresIn: this.accessTtlSeconds(),
    });
  }

  private async signRefreshToken(adminUserId: string) {
    const jti = randomBytes(16).toString('hex');
    return this.jwt.signAsync(
      { sub: adminUserId, jti },
      {
        secret: this.refreshSecret(),
        expiresIn: this.refreshTtlSeconds(),
      },
    );
  }

  async login(email: string, password: string, ctx?: AuditContext) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin || !admin.isActive) throw new ForbiddenException('Invalid login');

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) throw new ForbiddenException('Invalid login');

    const perms = await this.getAdminPermissions(admin.id);
    const accessToken = await this.signAccessToken({
      sub: admin.id,
      email: admin.email,
      perms,
    });
    const refreshToken = await this.signRefreshToken(admin.id);

    await this.prisma.adminRefreshToken.create({
      data: {
        adminUserId: admin.id,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshTtlSeconds() * 1000),
      },
    });

    await this.audit.adminAction({
      adminUserId: admin.id,
      action: 'admin.login',
      entityType: 'AdminUser',
      entityId: admin.id,
      detailJson: { email: admin.email },
      ctx,
    });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string, ctx?: AuditContext) {
    const tokenHash = sha256(refreshToken);

    const stored = await this.prisma.adminRefreshToken.findUnique({
      where: { tokenHash },
      include: { adminUser: true },
    });

    if (!stored || stored.revokedAt) throw new ForbiddenException('Invalid refresh token');
    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new ForbiddenException('Refresh token expired');
    }
    if (!stored.adminUser.isActive) throw new ForbiddenException('Account disabled');

    // Verify signature last (cheap DB reject first).
    try {
      await this.jwt.verifyAsync(refreshToken, { secret: this.refreshSecret() });
    } catch {
      throw new ForbiddenException('Invalid refresh token');
    }

    const perms = await this.getAdminPermissions(stored.adminUserId);
    const accessToken = await this.signAccessToken({
      sub: stored.adminUserId,
      email: stored.adminUser.email,
      perms,
    });

    // Rotate refresh token: revoke old, issue new.
    await this.prisma.adminRefreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });

    const newRefreshToken = await this.signRefreshToken(stored.adminUserId);
    await this.prisma.adminRefreshToken.create({
      data: {
        adminUserId: stored.adminUserId,
        tokenHash: sha256(newRefreshToken),
        expiresAt: new Date(Date.now() + this.refreshTtlSeconds() * 1000),
      },
    });

    await this.audit.adminAction({
      adminUserId: stored.adminUserId,
      action: 'admin.refresh',
      entityType: 'AdminUser',
      entityId: stored.adminUserId,
      ctx,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string, ctx?: AuditContext) {
    const tokenHash = sha256(refreshToken);
    const res = await this.prisma.adminRefreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (res.count > 0) {
      await this.audit.adminAction({
        action: 'admin.logout',
        entityType: 'AdminRefreshToken',
        ctx,
      });
    }
  }
}

