import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PollsService } from './polls.service';
import type { VoteRequest } from './dto';

@Controller('polls')
export class PollsController {
  constructor(private readonly polls: PollsService) {}

  @Get()
  async list() {
    return this.polls.listPublished();
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.polls.getPublished(id);
  }

  @Post(':id/votes')
  async vote(
    @Param('id') id: string,
    @Body() body: VoteRequest,
    @Req() req: Request,
  ) {
    return this.polls.vote(id, body, req);
  }

  @Get(':id/results')
  async results(@Param('id') id: string) {
    return this.polls.results(id);
  }
}

