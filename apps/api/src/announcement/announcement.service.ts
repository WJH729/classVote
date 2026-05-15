import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AnnouncementCreateDto = {
  title: string;
  content: string;
  priority?: number;
  startsAt?: string;
  endsAt?: string;
};

export type AnnouncementUpdateDto = {
  title?: string;
  content?: string;
  isActive?: boolean;
  priority?: number;
  startsAt?: string;
  endsAt?: string;
};

@Injectable()
export class AnnouncementService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(activeOnly = false) {
    const where: any = {};
    if (activeOnly) where.isActive = true;
    return this.prisma.announcement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findById(id: string) {
    return this.prisma.announcement.findUnique({ where: { id } });
  }

  create(data: AnnouncementCreateDto) {
    return this.prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        priority: data.priority ?? 0,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      },
    });
  }

  async update(id: string, data: AnnouncementUpdateDto) {
    const existing = await this.findById(id);
    if (!existing) throw new Error('公告不存在');
    return this.prisma.announcement.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        isActive: data.isActive,
        priority: data.priority,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.findById(id);
    if (!existing) throw new Error('公告不存在');
    return this.prisma.announcement.delete({ where: { id } });
  }

  findActive() {
    return this.prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }
}
