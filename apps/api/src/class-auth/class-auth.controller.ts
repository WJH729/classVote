import { Body, Controller, Post, Req, Get, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ClassAuthService } from './class-auth.service';
import { AdminJwtAuthGuard } from '../admin-auth/admin-jwt.guard';

export type ClassLoginRequest = {
  email: string;
  password: string;
  deviceId: string;
};

export type ClassLoginResponse = {
  accessToken: string;
  refreshToken: string;
  classId: string;
  deviceIdBound: boolean;
};

export type ClassRefreshRequest = {
  refreshToken: string;
};

export type PollResult = {
  pollId: string;
  title: string;
  options: { optionId: string; text: string; votes: number }[];
  totalVotes: number;
};

export type ClassStat = {
  pollId: string;
  pollTitle: string;
  classId: string;
  totalVotes: number;
};

@Controller('class/auth')
export class ClassAuthController {
  constructor(private readonly classAuth: ClassAuthService) {}

  @Post('login')
  async login(
    @Req() req: Request,
    @Body() body: ClassLoginRequest,
  ): Promise<ClassLoginResponse> {
    return this.classAuth.login(body.email, body.password, body.deviceId, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Body() body: ClassRefreshRequest,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.classAuth.refresh(body.refreshToken, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Body() body: ClassRefreshRequest,
  ): Promise<{ ok: true }> {
    await this.classAuth.logout(body.refreshToken, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return { ok: true };
  }

  @Get('polls')
  @UseGuards(AdminJwtAuthGuard)
  async getPolls(@Req() req: Request) {
    return this.classAuth.getPublishedPolls();
  }

  @Get('results')
  @UseGuards(AdminJwtAuthGuard)
  async getResults(): Promise<PollResult[]> {
    return this.classAuth.getPollResults();
  }

  @Get('class-stats')
  @UseGuards(AdminJwtAuthGuard)
  async getClassStats(): Promise<ClassStat[]> {
    return this.classAuth.getClassStats();
  }
}
