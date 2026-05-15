import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { CreatePollRequest, UpdatePollRequest, VoteRequest } from './dto';

function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex');
}

@Injectable()
export class PollsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished() {
    const polls = await this.prisma.poll.findMany({
      where: { status: 'published' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, status: true, startsAt: true, endsAt: true, createdAt: true },
    });
    return polls.map((p) => ({
      ...p,
      startsAt: p.startsAt?.toISOString() ?? null,
      endsAt: p.endsAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async getPublished(pollId: string) {
    const poll = await this.prisma.poll.findFirst({
      where: { id: pollId, status: 'published' },
      include: { options: { orderBy: { sortOrder: 'asc' }, select: { id: true, text: true } } },
    });
    if (!poll) throw new NotFoundException('Poll not found');
    return {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      status: poll.status,
      type: poll.type,
      maxSelections: poll.maxSelections,
      isAnonymous: poll.isAnonymous,
      startsAt: poll.startsAt?.toISOString() ?? null,
      endsAt: poll.endsAt?.toISOString() ?? null,
      createdAt: poll.createdAt.toISOString(),
      options: poll.options,
    };
  }

  getVoterKey(req: Request) {
    const header = req.header('x-voter-key')?.trim();
    if (header) return header;
    const ip = req.ip ?? '';
    const ua = req.header('user-agent') ?? '';
    return sha256(`${ip}::${ua}`);
  }

  async vote(pollId: string, body: VoteRequest, req: Request) {
    const voterKey = this.getVoterKey(req);
    const optionIds = Array.from(new Set(body.optionIds ?? []));
    if (optionIds.length === 0) throw new BadRequestException('No option selected');

    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: { select: { id: true } } },
    });
    if (!poll || poll.status !== 'published') throw new NotFoundException('Poll not found');

    const valid = new Set(poll.options.map((o) => o.id));
    const invalid = optionIds.filter((id) => !valid.has(id));
    if (invalid.length > 0) throw new BadRequestException('Invalid option');

    if (poll.type === 'single' && optionIds.length !== 1) {
      throw new BadRequestException('Single choice poll');
    }
    const max = Math.max(1, poll.maxSelections);
    if (poll.type === 'multiple' && optionIds.length > max) {
      throw new BadRequestException('Too many selections');
    }

    const ipHash = req.ip ? sha256(req.ip) : null;
    const uaHash = req.header('user-agent') ? sha256(req.header('user-agent') as string) : null;

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.vote.findFirst({
        where: { pollId, voterKey },
        select: { id: true },
      });
      if (existing) throw new ConflictException('Already voted');

      await tx.vote.createMany({
        data: optionIds.map((optionId) => ({
          pollId,
          optionId,
          voterKey,
          ipHash,
          uaHash,
        })),
      });
    });

    return { ok: true };
  }

  async results(pollId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: { orderBy: { sortOrder: 'asc' }, select: { id: true, text: true } } },
    });
    if (!poll) throw new NotFoundException('Poll not found');

    const counts = await this.prisma.vote.groupBy({
      by: ['optionId'],
      where: { pollId },
      _count: { optionId: true },
    });
    const map = new Map(counts.map((c) => [c.optionId, c._count.optionId]));
    const options = poll.options.map((o) => ({
      optionId: o.id,
      text: o.text,
      votes: map.get(o.id) ?? 0,
    }));
    const totalVotes = options.reduce((acc, o) => acc + o.votes, 0);
    return {
      pollId,
      totalVotes,
      options,
      generatedAt: new Date().toISOString(),
    };
  }

  // Admin
  async adminListAll() {
    const polls = await this.prisma.poll.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, status: true, startsAt: true, endsAt: true, createdAt: true },
    });
    return polls.map((p) => ({
      ...p,
      startsAt: p.startsAt?.toISOString() ?? null,
      endsAt: p.endsAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async adminGet(pollId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!poll) throw new NotFoundException('Poll not found');
    return {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      status: poll.status,
      type: poll.type,
      maxSelections: poll.maxSelections,
      isAnonymous: poll.isAnonymous,
      startsAt: poll.startsAt?.toISOString() ?? null,
      endsAt: poll.endsAt?.toISOString() ?? null,
      createdAt: poll.createdAt.toISOString(),
      options: poll.options.map((o) => ({ id: o.id, text: o.text, sortOrder: o.sortOrder })),
    };
  }

  async adminCreate(body: CreatePollRequest) {
    if (!body.title?.trim()) throw new BadRequestException('title required');
    if (!body.options?.length || body.options.length < 2) {
      throw new BadRequestException('at least 2 options');
    }
    const maxSelections =
      body.type === 'single' ? 1 : Math.max(1, body.maxSelections ?? 2);

    const poll = await this.prisma.poll.create({
      data: {
        title: body.title.trim(),
        description: body.description ?? null,
        type: body.type,
        maxSelections,
        isAnonymous: body.isAnonymous ?? true,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        options: {
          create: body.options.map((o, idx) => ({
            text: o.text,
            sortOrder: idx,
          })),
        },
      },
    });
    return { id: poll.id };
  }

  async adminUpdate(pollId: string, body: UpdatePollRequest) {
    const poll = await this.prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll) throw new NotFoundException('Poll not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.poll.update({
        where: { id: pollId },
        data: {
          title: body.title?.trim() ?? undefined,
          description: body.description ?? undefined,
          type: body.type ?? undefined,
          maxSelections: body.maxSelections ?? undefined,
          isAnonymous: body.isAnonymous ?? undefined,
          startsAt: body.startsAt === undefined ? undefined : body.startsAt ? new Date(body.startsAt) : null,
          endsAt: body.endsAt === undefined ? undefined : body.endsAt ? new Date(body.endsAt) : null,
        },
      });

      if (body.options) {
        for (const opt of body.options) {
          if (opt.id) {
            await tx.pollOption.update({
              where: { id: opt.id },
              data: {
                text: opt.text,
                sortOrder: opt.sortOrder ?? undefined,
              },
            });
          } else {
            await tx.pollOption.create({
              data: {
                pollId,
                text: opt.text,
                sortOrder: opt.sortOrder ?? 0,
              },
            });
          }
        }
      }
    });

    return { ok: true };
  }

  async adminPublish(pollId: string) {
    await this.prisma.poll.update({
      where: { id: pollId },
      data: { status: 'published' },
    });
    return { ok: true };
  }

  async adminClose(pollId: string) {
    await this.prisma.poll.update({
      where: { id: pollId },
      data: { status: 'closed' },
    });
    return { ok: true };
  }

  async adminExportCsv(pollId: string) {
    const res = await this.results(pollId);
    const lines = ['optionId,text,votes'];
    for (const o of res.options) {
      const safeText = JSON.stringify(o.text);
      lines.push(`${o.optionId},${safeText},${o.votes}`);
    }
    return lines.join('\n');
  }
}

