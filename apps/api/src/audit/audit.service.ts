import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AuditContext = {
  ip?: string;
  userAgent?: string;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async adminAction(params: {
    adminUserId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    detailJson?: unknown;
    ctx?: AuditContext;
  }) {
    await this.prisma.auditLog.create({
      data: {
        adminUserId: params.adminUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        detailJson: params.detailJson as any,
        ip: params.ctx?.ip,
        userAgent: params.ctx?.userAgent,
      },
    });
  }
}

