import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSIONS_KEY } from './require-permissions.decorator';
import type { PermissionKey } from './permissions';

type JwtUser = {
  sub: string;
  email: string;
  perms: string[];
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<PermissionKey[]>(
        REQUIRE_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as JwtUser | undefined;

    if (!user) throw new ForbiddenException('Not authenticated');

    const have = new Set(user.perms ?? []);
    const missing = required.filter((p) => !have.has(p));
    if (missing.length > 0) {
      throw new ForbiddenException('Missing permissions');
    }
    return true;
  }
}

