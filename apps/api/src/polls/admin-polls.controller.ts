import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminJwtAuthGuard } from '../admin-auth/admin-jwt.guard';
import { AuditService } from '../audit/audit.service';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { Permissions } from '../rbac/permissions';
import { RequirePermissions } from '../rbac/require-permissions.decorator';
import type { CreatePollRequest, UpdatePollRequest } from './dto';
import { PollsService } from './polls.service';

@Controller('admin/polls')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class AdminPollsController {
  constructor(
    private readonly polls: PollsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions(Permissions.PollRead)
  async list() {
    return this.polls.adminListAll();
  }

  @Get(':id')
  @RequirePermissions(Permissions.PollRead)
  async get(@Param('id') id: string) {
    return this.polls.adminGet(id);
  }

  @Post()
  @RequirePermissions(Permissions.PollWrite)
  async create(@Req() req: Request, @Body() body: CreatePollRequest) {
    const created = await this.polls.adminCreate(body);
    await this.audit.adminAction({
      adminUserId: (req.user as any)?.sub,
      action: 'poll.create',
      entityType: 'Poll',
      entityId: created.id,
      detailJson: { title: body.title },
      ctx: { ip: req.ip, userAgent: req.headers['user-agent'] },
    });
    return created;
  }

  @Patch(':id')
  @RequirePermissions(Permissions.PollWrite)
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: UpdatePollRequest,
  ) {
    const res = await this.polls.adminUpdate(id, body);
    await this.audit.adminAction({
      adminUserId: (req.user as any)?.sub,
      action: 'poll.update',
      entityType: 'Poll',
      entityId: id,
      detailJson: body,
      ctx: { ip: req.ip, userAgent: req.headers['user-agent'] },
    });
    return res;
  }

  @Post(':id/publish')
  @RequirePermissions(Permissions.PollWrite)
  async publish(@Req() req: Request, @Param('id') id: string) {
    const res = await this.polls.adminPublish(id);
    await this.audit.adminAction({
      adminUserId: (req.user as any)?.sub,
      action: 'poll.publish',
      entityType: 'Poll',
      entityId: id,
      ctx: { ip: req.ip, userAgent: req.headers['user-agent'] },
    });
    return res;
  }

  @Post(':id/close')
  @RequirePermissions(Permissions.PollWrite)
  async close(@Req() req: Request, @Param('id') id: string) {
    const res = await this.polls.adminClose(id);
    await this.audit.adminAction({
      adminUserId: (req.user as any)?.sub,
      action: 'poll.close',
      entityType: 'Poll',
      entityId: id,
      ctx: { ip: req.ip, userAgent: req.headers['user-agent'] },
    });
    return res;
  }

  @Get(':id/results')
  @RequirePermissions(Permissions.PollRead)
  async results(@Param('id') id: string) {
    return this.polls.results(id);
  }

  @Get(':id/export')
  @RequirePermissions(Permissions.PollRead)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async export(@Param('id') id: string) {
    return this.polls.adminExportCsv(id);
  }
}

