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

// WhatsApp Module (provider-agnostic, Dialogflow-powered)
import { WhatsAppModule } from './whatsapp/whatsapp.module';

/**
 * App Module - Production Version
 * 
 * This is the clean version with only the new WhatsApp system.
 * Use this after successful migration from the old ai-message module.
 * 
 * To activate:
 * 1. Backup current app.module.ts
 * 2. Rename this file to app.module.ts
 * 3. Restart the application
 * 
 * Features:
 * - Provider-agnostic WhatsApp (Meta, Twilio, etc.)
 * - Dialogflow NLU integration
 * - Clean 4-layer architecture
 * - Production-ready with retry logic and monitoring
 */
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
        WhatsAppModule,  // New WhatsApp system
        AdminModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
