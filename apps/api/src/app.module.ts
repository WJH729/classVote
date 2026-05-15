import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { ClassAuthModule } from './class-auth/class-auth.module';
import { KeyAuthModule } from './key-auth/key-auth.module';
import { AuditModule } from './audit/audit.module';
import { PollsModule } from './polls/polls.module';
import { PrismaModule } from './prisma/prisma.module';
import { WallpaperModule } from './wallpaper/wallpaper.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    AuditModule,
    AdminAuthModule,
    ClassAuthModule,
    KeyAuthModule,
    PollsModule,
    WallpaperModule,
    AnnouncementModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
