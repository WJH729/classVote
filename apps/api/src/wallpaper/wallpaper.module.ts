import { Module } from '@nestjs/common';
import { WallpaperService } from './wallpaper.service';
import { WallpaperController } from './wallpaper.controller';

@Module({
  providers: [WallpaperService],
  controllers: [WallpaperController]
})
export class WallpaperModule {}
