import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WallpaperService {
  private readonly wallpaperDir: string;
  private readonly wallpaperConfigPath: string;

  constructor() {
    this.wallpaperDir = path.join(process.cwd(), 'wallpapers');
    this.wallpaperConfigPath = path.join(this.wallpaperDir, 'current.json');
    if (!fs.existsSync(this.wallpaperDir)) {
      fs.mkdirSync(this.wallpaperDir, { recursive: true });
    }
  }

  getCurrentWallpaper(): { filename: string; url: string } | null {
    if (!fs.existsSync(this.wallpaperConfigPath)) {
      return null;
    }
    const config = JSON.parse(fs.readFileSync(this.wallpaperConfigPath, 'utf-8'));
    return {
      filename: config.filename,
      url: `/wallpapers/${config.filename}`,
    };
  }

  setWallpaper(sourcePath: string): { filename: string; url: string } {
    const ext = path.extname(sourcePath);
    const filename = `wallpaper${ext}`;
    const destPath = path.join(this.wallpaperDir, filename);
    
    fs.copyFileSync(sourcePath, destPath);
    
    const config = { filename, updatedAt: new Date().toISOString() };
    fs.writeFileSync(this.wallpaperConfigPath, JSON.stringify(config, null, 2));
    
    return {
      filename,
      url: `/wallpapers/${filename}`,
    };
  }

  getWallpaperImage(): Buffer {
    const current = this.getCurrentWallpaper();
    if (!current) {
      throw new NotFoundException('No wallpaper set');
    }
    const imagePath = path.join(this.wallpaperDir, current.filename);
    if (!fs.existsSync(imagePath)) {
      throw new NotFoundException('Wallpaper image not found');
    }
    return fs.readFileSync(imagePath);
  }

  getWallpaperContentType(): string {
    const current = this.getCurrentWallpaper();
    if (!current) {
      return 'image/png';
    }
    const ext = path.extname(current.filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return mimeTypes[ext] || 'image/png';
  }
}
