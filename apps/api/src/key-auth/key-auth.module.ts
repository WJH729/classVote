import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { KeyAuthController } from './key-auth.controller';
import { KeyAuthService } from './key-auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule, JwtModule.register({})],
  controllers: [KeyAuthController],
  providers: [KeyAuthService],
  exports: [KeyAuthService],
})
export class KeyAuthModule {}
