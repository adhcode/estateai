import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OccupantsModule } from '../occupants/occupants.module';
import { EstatesModule } from '../estates/estates.module';
import { UnitsModule } from '../units/units.module';

@Module({
  imports: [PrismaModule, OccupantsModule, EstatesModule, UnitsModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}