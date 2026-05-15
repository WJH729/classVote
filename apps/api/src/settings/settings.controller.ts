import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../admin-auth/admin-jwt.guard';
import { SettingsService, type SiteSettingsData } from './settings.service';

@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @UseGuards(AdminJwtAuthGuard)
  async get(): Promise<SiteSettingsData> {
    return this.settings.get();
  }

  @Patch()
  @UseGuards(AdminJwtAuthGuard)
  async update(@Body() body: SiteSettingsData): Promise<SiteSettingsData> {
    return this.settings.update(body);
  }
}

@Controller('settings')
export class PublicSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('public')
  async get(): Promise<SiteSettingsData> {
    return this.settings.get();
  }
}