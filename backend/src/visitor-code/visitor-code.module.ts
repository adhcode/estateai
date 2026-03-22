import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { ImageUploadService } from './image-upload.service';
import { QrCodeService } from './qr-code.service';
import { SecurityVerificationController } from './security-verification.controller';
import { VisitorCardPreviewController } from './visitor-card-preview.controller';
import { VisitorCardService } from './visitor-card.service';
import { VisitorCodeController } from './visitor-code.controller';
import { VisitorCodeService } from './visitor-code.service';

@Module({
  imports: [PrismaModule, forwardRef(() => WhatsAppModule)],
  controllers: [VisitorCodeController, SecurityVerificationController, VisitorCardPreviewController],
  providers: [VisitorCodeService, QrCodeService, VisitorCardService, ImageUploadService],
  exports: [VisitorCodeService, QrCodeService, VisitorCardService, ImageUploadService],
})
export class VisitorCodeModule { }