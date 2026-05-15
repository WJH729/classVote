import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ClassAuthController } from './class-auth.controller';
import { ClassAuthService } from './class-auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule, JwtModule.register({})],
  controllers: [ClassAuthController],
  providers: [ClassAuthService],
  exports: [ClassAuthService],
})
export class ClassAuthModule {}
