import { Module } from '@nestjs/common';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { AdminPollsController } from './admin-polls.controller';

@Module({
  controllers: [PollsController, AdminPollsController],
  providers: [PollsService],
})
export class PollsModule {}

