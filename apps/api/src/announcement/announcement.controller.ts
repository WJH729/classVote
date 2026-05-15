import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';

@Controller('announcement')
export class AnnouncementController {
  constructor(private readonly service: AnnouncementService) {}

  @Get()
  findAll(@Query('active') active?: string) {
    return this.service.findAll(active === 'true');
  }

  @Get('active')
  findActive() {
    return this.service.findActive();
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
