import { Controller, Get, Post, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { WallpaperService } from './wallpaper.service';

@Controller('wallpaper')
export class WallpaperController {
  constructor(private readonly wallpaperService: WallpaperService) {}

  @Get('current')
  getCurrentWallpaper() {
    return this.wallpaperService.getCurrentWallpaper();
  }

  @Post('set')
  async setWallpaper() {
    const sourcePath = 'F:\\pppp\\img\\1.png';
    const result = this.wallpaperService.setWallpaper(sourcePath);
    return { success: true, data: result };
  }

  @Get('image')
  getWallpaperImage(@Res() res: Response) {
    try {
      const image = this.wallpaperService.getWallpaperImage();
      const contentType = this.wallpaperService.getWallpaperContentType();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.status(HttpStatus.OK).send(image);
    } catch {
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Wallpaper not found' });
    }
  }
}
