import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { ImageUploadService } from '../visitor-code/image-upload.service';

@Injectable()
export class ResidentPhotoService {
    private readonly logger = new Logger(ResidentPhotoService.name);
    private readonly tempDir = path.join(process.cwd(), 'uploads', 'temp-photos');

    constructor(
        private readonly imageUploadService: ImageUploadService,
    ) {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Download photo from WhatsApp Media API
     * Works for both Meta and Twilio
     */
    async downloadPhotoFromWhatsApp(params: {
        mediaId?: string;      // Meta Cloud API
        mediaUrl?: string;     // Twilio
        provider: 'meta' | 'twilio';
    }): Promise<string> {
        try {
            let downloadUrl: string;
            let headers: any = {};

            if (params.provider === 'meta') {
                // Meta Cloud API
                const metaToken = process.env.META_WA_TOKEN;
                if (!metaToken) {
                    throw new Error('META_WA_TOKEN not configured');
                }

                downloadUrl = `https://graph.facebook.com/v17.0/${params.mediaId}`;
                headers = { Authorization: `Bearer ${metaToken}` };

                // First, get the media URL
                const mediaResponse = await axios.get(downloadUrl, { headers });
                downloadUrl = mediaResponse.data.url;
            } else {
                // Twilio
                downloadUrl = params.mediaUrl;
                const accountSid = process.env.TWILIO_ACCOUNT_SID;
                const authToken = process.env.TWILIO_AUTH_TOKEN;
                if (!accountSid || !authToken) {
                    throw new Error('Twilio credentials not configured');
                }
                const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
                headers = { Authorization: `Basic ${auth}` };
            }

            // Download the image
            const response = await axios.get(downloadUrl, {
                headers,
                responseType: 'arraybuffer',
                timeout: 30000,
            });

            // Save temporarily
            const filename = `photo-${Date.now()}.jpg`;
            const filepath = path.join(this.tempDir, filename);
            fs.writeFileSync(filepath, response.data);

            this.logger.log(`✅ Downloaded photo: ${filename}`);
            return filepath;
        } catch (error) {
            this.logger.error(`Failed to download photo: ${error.message}`);
            throw new Error('Failed to download photo from WhatsApp');
        }
    }

    /**
     * Process and upload photo
     * - Upload to cloud
     * - Return public URL
     */
    async processAndUploadPhoto(localPath: string): Promise<string> {
        try {
            // TODO: Optional - resize/compress image here using sharp
            // const sharp = require('sharp');
            // await sharp(localPath)
            //   .resize(800, 800, { fit: 'cover' })
            //   .jpeg({ quality: 85 })
            //   .toFile(processedPath);

            // Upload to cloud (ImgBB, Imgur, etc.)
            const publicUrl = await this.imageUploadService.uploadImage(localPath);

            // Cleanup local file
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
            }

            this.logger.log(`✅ Photo uploaded to cloud: ${publicUrl}`);
            return publicUrl;
        } catch (error) {
            this.logger.error(`Failed to process photo: ${error.message}`);
            // Cleanup on error
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
            }
            throw error;
        }
    }

    /**
     * Complete photo upload flow
     */
    async handlePhotoUpload(params: {
        mediaId?: string;
        mediaUrl?: string;
        provider: 'meta' | 'twilio';
    }): Promise<string> {
        // Download from WhatsApp
        const localPath = await this.downloadPhotoFromWhatsApp(params);

        // Process and upload to cloud
        const publicUrl = await this.processAndUploadPhoto(localPath);

        return publicUrl;
    }
}
