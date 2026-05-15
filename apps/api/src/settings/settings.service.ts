import 'dotenv/config';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

export interface SiteSettingsData {
  siteUrl: string;
  extraAllowedOrigins: string;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<SiteSettingsData> {
    let row = await this.prisma.siteSettings.findFirst();
    if (!row) {
      row = await this.prisma.siteSettings.create({
        data: { siteUrl: '', extraAllowedOrigins: '' },
      });
    }
    return {
      siteUrl: row.siteUrl ?? '',
      extraAllowedOrigins: row.extraAllowedOrigins ?? '',
    };
  }

  async update(data: SiteSettingsData): Promise<SiteSettingsData> {
    let row = await this.prisma.siteSettings.findFirst();
    if (!row) {
      row = await this.prisma.siteSettings.create({
        data: { siteUrl: data.siteUrl, extraAllowedOrigins: data.extraAllowedOrigins },
      });
    } else {
      row = await this.prisma.siteSettings.update({
        where: { id: row.id },
        data: { siteUrl: data.siteUrl, extraAllowedOrigins: data.extraAllowedOrigins },
      });
    }

    this.writeEnvFile(data);
    this.writeNextConfig(data);

    return {
      siteUrl: row.siteUrl ?? '',
      extraAllowedOrigins: row.extraAllowedOrigins ?? '',
    };
  }

  private writeEnvFile(data: SiteSettingsData) {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      let content = fs.readFileSync(envPath, 'utf-8');

      const origins = ['localhost', '127.0.0.1'];
      if (data.extraAllowedOrigins) {
        data.extraAllowedOrigins.split(',').forEach((o) => {
          const trimmed = o.trim();
          if (trimmed) origins.push(trimmed);
        });
      }

      const envOrigins = `SITE_ALLOWED_ORIGINS=${origins.join(',')}`;

      if (content.includes('SITE_ALLOWED_ORIGINS=')) {
        content = content.replace(/SITE_ALLOWED_ORIGINS=.*(\r?\n|$)/g, `${envOrigins}$1`);
      } else {
        content += `\n${envOrigins}\n`;
      }

      if (content.includes('SITE_URL=')) {
        content = content.replace(/SITE_URL=.*(\r?\n|$)/g, `SITE_URL=${data.siteUrl}$1`);
      } else {
        content += `SITE_URL=${data.siteUrl}\n`;
      }

      fs.writeFileSync(envPath, content, 'utf-8');
      console.log('[SettingsService] Updated .env with allowed origins and site URL');
    } catch (err) {
      console.error('[SettingsService] Failed to write .env:', err);
    }
  }

  private writeNextConfig(data: SiteSettingsData) {
    try {
      const configPath = path.resolve(process.cwd(), '..', 'web', 'next.config.ts');
      if (!fs.existsSync(configPath)) return;

      const origins = ['192.168.3.5', 'localhost'];
      if (data.extraAllowedOrigins) {
        data.extraAllowedOrigins.split(',').forEach((o) => {
          const trimmed = o.trim();
          if (!trimmed) return;
          if (!origins.includes(trimmed)) {
            origins.push(trimmed);
          }
          const bareHost = trimmed.split(':')[0];
          if (bareHost !== trimmed && !origins.includes(bareHost)) {
            origins.push(bareHost);
          }
        });
      }

      const originsStr = origins.map((o) => `'${o}'`).join(', ');

      const newContent = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:3001/:path*',
      },
      {
        source: '/wallpaper/image',
        destination: 'http://127.0.0.1:3001/wallpaper/image',
      },
    ];
  },
  allowedDevOrigins: [${originsStr}],
};

export default nextConfig;
`;

      fs.writeFileSync(configPath, newContent, 'utf-8');
      console.log('[SettingsService] Updated next.config.ts with allowedDevOrigins');
    } catch (err) {
      console.error('[SettingsService] Failed to write next.config.ts:', err);
    }
  }
}