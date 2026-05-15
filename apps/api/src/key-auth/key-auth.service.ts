import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuditService, type AuditContext } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type { AdminAccessJwtPayload } from '../admin-auth/admin-jwt.strategy';

function sha256(input: string) {
  const { createHash } = require('crypto');
  return createHash('sha256').update(input).digest('hex');
}

function generateSecretKey(): string {
  return `admin-${require('crypto').randomBytes(24).toString('hex')}`;
}

@Injectable()
export class KeyAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  private accessSecret() {
    return process.env.ADMIN_JWT_ACCESS_SECRET ?? '';
  }

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
      where: { role: { users: { some: { adminUserId } } } },
      select: { permission: { select: { key: true } } },
    });
    return Array.from(new Set(rows.map((r) => r.permission.key)));
  }

  private async signAccessToken(payload: AdminAccessJwtPayload) {
    return this.jwt.signAsync(payload, { secret: this.accessSecret(), expiresIn: this.accessTtlSeconds() });
  }

  private async signRefreshToken(adminUserId: string) {
    const { randomBytes } = require('crypto');
    const jti = randomBytes(16).toString('hex');
    return this.jwt.signAsync({ sub: adminUserId, jti }, { secret: this.refreshSecret(), expiresIn: this.refreshTtlSeconds() });
  }

  async login(secretKey: string, ctx?: AuditContext) {
    const admin = await this.prisma.adminUser.findFirst({ where: { secretKey } });
    if (!admin || !admin.isActive) throw new ForbiddenException('密钥无效或账号已禁用');

    const perms = await this.getAdminPermissions(admin.id);
    const accessToken = await this.signAccessToken({ sub: admin.id, email: admin.email, perms });
    const refreshToken = await this.signRefreshToken(admin.id);

    await this.prisma.adminRefreshToken.create({
      data: { adminUserId: admin.id, tokenHash: sha256(refreshToken), expiresAt: new Date(Date.now() + this.refreshTtlSeconds() * 1000) },
    });

    await this.audit.adminAction({ adminUserId: admin.id, action: 'key.login', entityType: 'AdminUser', entityId: admin.id, detailJson: { email: admin.email }, ctx });

    return { accessToken, refreshToken, displayName: admin.displayName || admin.email, email: admin.email };
  }

  async refresh(refreshToken: string, ctx?: AuditContext) {
    const tokenHash = sha256(refreshToken);
    const stored = await this.prisma.adminRefreshToken.findUnique({ where: { tokenHash }, include: { adminUser: true } });

    if (!stored || stored.revokedAt) throw new ForbiddenException('无效的刷新令牌');
    if (stored.expiresAt.getTime() <= Date.now()) throw new ForbiddenException('刷新令牌已过期');
    if (!stored.adminUser.isActive) throw new ForbiddenException('账号已禁用');

    try { await this.jwt.verifyAsync(refreshToken, { secret: this.refreshSecret() }); }
    catch { throw new ForbiddenException('无效的刷新令牌'); }

    const perms = await this.getAdminPermissions(stored.adminUserId);
    const accessToken = await this.signAccessToken({ sub: stored.adminUserId, email: stored.adminUser.email, perms });

    await this.prisma.adminRefreshToken.update({ where: { tokenHash }, data: { revokedAt: new Date() } });

    const newRefreshToken = await this.signRefreshToken(stored.adminUserId);
    await this.prisma.adminRefreshToken.create({
      data: { adminUserId: stored.adminUserId, tokenHash: sha256(newRefreshToken), expiresAt: new Date(Date.now() + this.refreshTtlSeconds() * 1000) },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string, ctx?: AuditContext) {
    const tokenHash = sha256(refreshToken);
    const res = await this.prisma.adminRefreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
    if (res.count > 0) {
      await this.audit.adminAction({ action: 'key.logout', entityType: 'AdminRefreshToken', ctx });
    }
  }

  async changePassword(adminUserId: string, data: { newSecretKey: string }) {
    if (!data.newSecretKey || data.newSecretKey.length < 10) {
      throw new ForbiddenException('新密钥长度至少为10个字符');
    }
    if (data.newSecretKey.startsWith('admin-') === false) {
      throw new ForbiddenException('新密钥必须以 admin- 开头');
    }
    await this.prisma.adminUser.update({
      where: { id: adminUserId },
      data: { secretKey: data.newSecretKey },
    });
    return { message: '密钥修改成功' };
  }
}
