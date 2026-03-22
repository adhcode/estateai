import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { EstatesModule } from './estates/estates.module';
import { OccupantsModule } from './occupants/occupants.module';
import { PrismaModule } from './prisma/prisma.module';
import { UnitsModule } from './units/units.module';
import { VisitorCodeModule } from './visitor-code/visitor-code.module';
import { VisitorsModule } from './visitors/visitors.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    CommonModule,
    PrismaModule,
    AuthModule,
    EstatesModule,
    OccupantsModule,
    VisitorsModule,
    UnitsModule,
    VisitorCodeModule,
    WhatsAppModule,       // Current WhatsApp system
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }