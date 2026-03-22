import { Module } from '@nestjs/common';
import { OccupantsController } from './occupants.controller';
import { OccupantsService } from './occupants.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OccupantsController],
  providers: [OccupantsService],
  exports: [OccupantsService],
})
export class OccupantsModule {}