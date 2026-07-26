import { Module, forwardRef } from '@nestjs/common';
import { OccupantsModule } from '../occupants/occupants.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ImageUploadService } from '../visitor-code/image-upload.service';
import { ResidentIdCardService } from './resident-id-card.service';
import { ResidentPhotoService } from './resident-photo.service';

@Module({
    imports: [
        forwardRef(() => OccupantsModule),
        PrismaModule,
    ],
    providers: [
        ResidentIdCardService,
        ResidentPhotoService,
        ImageUploadService, // Reuse from visitor-code
    ],
    exports: [ResidentIdCardService, ResidentPhotoService],
})
export class ResidentIdModule { }
