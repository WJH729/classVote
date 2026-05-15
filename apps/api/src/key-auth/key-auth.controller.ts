import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { KeyAuthService } from './key-auth.service';

export type KeyLoginRequest = { secretKey: string };

export type KeyLoginResponse = { accessToken: string; refreshToken: string; displayName: string; email: string };

export type ChangePasswordDto = { newSecretKey: string };

@Controller('key/auth')
export class KeyAuthController {
  constructor(private readonly keyAuth: KeyAuthService) {}

  @Post('login')
  async login(@Req() req: Request, @Body() body: KeyLoginRequest): Promise<KeyLoginResponse> {
    return this.keyAuth.login(body.secretKey, { ip: req.ip, userAgent: req.headers['user-agent'] });
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Body() body: { refreshToken: string }) {
    return this.keyAuth.refresh(body.refreshToken, { ip: req.ip, userAgent: req.headers['user-agent'] });
  }

  @Post('logout')
  async logout(@Req() req: Request, @Body() body: { refreshToken: string }): Promise<{ ok: true }> {
    await this.keyAuth.logout(body.refreshToken, { ip: req.ip, userAgent: req.headers['user-agent'] });
    return { ok: true };
  }

  @Post('change-password')
  async changePassword(@Req() req: Request, @Body() body: ChangePasswordDto) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new Error('Unauthorized');
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return this.keyAuth.changePassword(payload.sub, body);
  }
}
