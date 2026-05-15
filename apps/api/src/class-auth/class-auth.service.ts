import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuditService, type AuditContext } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type { AdminAccessJwtPayload } from '../admin-auth/admin-jwt.strategy';

function sha256(input: string) {
  const { createHash } = require('crypto');
  return createHash('sha256').update(input).digest('hex');
}

@Injectable()
export class ClassAuthService {
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
      where: {
        role: { users: { some: { adminUserId } } },
      },
      select: { permission: { select: { key: true } } },
    });
    return Array.from(new Set(rows.map((r) => r.permission.key)));
  }

  private async signAccessToken(payload: AdminAccessJwtPayload) {
    return this.jwt.signAsync(payload, {
      secret: this.accessSecret(),
      expiresIn: this.accessTtlSeconds(),
    });
  }

  private async signRefreshToken(adminUserId: string) {
    const { randomBytes } = require('crypto');
    const jti = randomBytes(16).toString('hex');
    return this.jwt.signAsync(
      { sub: adminUserId, jti },
      {
        secret: this.refreshSecret(),
        expiresIn: this.refreshTtlSeconds(),
      },
    );
  }

  async login(email: string, password: string, deviceId: string, ctx?: AuditContext) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin || !admin.isActive) throw new ForbiddenException('Invalid login');
    if (!admin.classId) throw new ForbiddenException('Not a class account');

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) throw new ForbiddenException('Invalid login');

    // Device binding check
    if (admin.deviceId && admin.deviceId !== deviceId) {
      throw new ForbiddenException('Device mismatch. This account is bound to another device.');
    }

    // Bind device on first login
    if (!admin.deviceId) {
      await this.prisma.adminUser.update({
        where: { id: admin.id },
        data: { deviceId },
      });
    }

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
      action: 'class.login',
      entityType: 'AdminUser',
      entityId: admin.id,
      detailJson: { email: admin.email, deviceId },
      ctx,
    });

    return {
      accessToken,
      refreshToken,
      classId: admin.classId,
      deviceIdBound: !!admin.deviceId,
    };
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
    if (!stored.adminUser.isActive || !stored.adminUser.classId) {
      throw new ForbiddenException('Account disabled or not a class account');
    }

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
        action: 'class.logout',
        entityType: 'AdminRefreshToken',
        ctx,
      });
    }
  }

  async getPublishedPolls() {
    return this.prisma.poll.findMany({
      where: { status: 'published' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, status: true, createdAt: true },
    });
  }

  async getPollResults() {
    const polls = await this.prisma.poll.findMany({
      where: { status: { in: ['published', 'closed'] } },
      include: { options: { include: { _count: { select: { votes: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    return polls.map((p) => ({
      pollId: p.id,
      title: p.title,
      totalVotes: p.options.reduce((sum, o) => sum + o._count.votes, 0),
      options: p.options.map((o) => ({
        optionId: o.id,
        text: o.text,
        votes: o._count.votes,
      })),
    }));
  }

  async getClassStats() {
    const polls = await this.prisma.poll.findMany({
      where: { status: { in: ['published', 'closed'] } },
      include: { options: { include: { votes: true } } },
    });

    const stats: any[] = [];
    for (const poll of polls) {
      const classMap: Record<string, number> = {};
      for (const opt of poll.options) {
        for (const vote of opt.votes) {
          // Extract classId from voterKey pattern: class_XX_device_...
          const match = vote.voterKey.match(/class_(\d+)/);
          if (match) {
            const classId = match[1];
            classMap[classId] = (classMap[classId] || 0) + 1;
          }
        }
      }
      for (const [classId, count] of Object.entries(classMap)) {
        stats.push({
          pollId: poll.id,
          pollTitle: poll.title,
          classId,
          totalVotes: count,
        });
      }
    }
    return stats;
  }
}
