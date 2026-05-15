import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type AdminAccessJwtPayload = {
  sub: string;
  email: string;
  perms: string[];
};

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.ADMIN_JWT_ACCESS_SECRET ?? '',
    });
  }

  async validate(payload: AdminAccessJwtPayload) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token');
    }
    return payload;
  }
}

