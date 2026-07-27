import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EstateRulesController } from './estate-rules.controller';
import { EstateRulesService } from './estate-rules.service';
import { EstatesController } from './estates.controller';
import { EstatesService } from './estates.service';

@Module({
  imports: [PrismaModule],
  controllers: [EstatesController, EstateRulesController],
  providers: [EstatesService, EstateRulesService],
  exports: [EstatesService, EstateRulesService],
})
export class EstatesModule { }