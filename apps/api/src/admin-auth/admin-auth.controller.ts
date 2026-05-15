import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminAuthService } from './admin-auth.service';
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  AdminRefreshRequest,
} from './dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuth: AdminAuthService) {}

  @Post('login')
  async login(
    @Req() req: Request,
    @Body() body: AdminLoginRequest,
  ): Promise<AdminLoginResponse> {
    return this.adminAuth.login(body.email, body.password, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Body() body: AdminRefreshRequest,
  ): Promise<AdminLoginResponse> {
    return this.adminAuth.refresh(body.refreshToken, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Body() body: AdminRefreshRequest,
  ): Promise<{ ok: true }> {
    await this.adminAuth.logout(body.refreshToken, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return { ok: true };
  }
}

