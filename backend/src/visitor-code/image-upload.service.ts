import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';
import * as fs from 'fs';

/**
 * Image Upload Service
 * Uploads visitor cards to publicly accessible image hosting
 */
@Injectable()
export class ImageUploadService {
    private readonly logger = new Logger(ImageUploadService.name);

    /**
     * Upload image to ImgBB (free image hosting)
     * Get API key from: https://api.imgbb.com/
     */
    async uploadToImgBB(imagePath: string): Promise<string> {
        try {
            const apiKey = process.env.IMGBB_API_KEY;

            if (!apiKey) {
                this.logger.warn('IMGBB_API_KEY not set, falling back to base64 upload');
                return this.uploadToImgBBBase64(imagePath);
            }

            const imageBuffer = fs.readFileSync(imagePath);
            const form = new FormData();
            form.append('image', imageBuffer.toString('base64'));

            const response = await axios.post(
                `https://api.imgbb.com/1/upload?key=${apiKey}`,
                form,
                {
                    headers: form.getHeaders(),
                    timeout: 30000,
                }
            );

            if (response.data?.data?.url) {
                this.logger.log(`✅ Image uploaded to ImgBB: ${response.data.data.url}`);
                return response.data.data.url;
            }

            throw new Error('Invalid response from ImgBB');
        } catch (error) {
            this.logger.error(`Failed to upload to ImgBB: ${error.message}`);
            throw error;
        }
    }

    /**
     * Upload using base64 (no API key required, but has limits)
     */
    private async uploadToImgBBBase64(imagePath: string): Promise<string> {
        try {
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString('base64');

            const response = await axios.post(
                'https://api.imgbb.com/1/upload',
                new URLSearchParams({
                    key: '2d3e9c4f8a1b6d7e9f0a1b2c3d4e5f6g', // Public demo key (limited)
                    image: base64Image,
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    timeout: 30000,
                }
            );

            if (response.data?.data?.url) {
                this.logger.log(`✅ Image uploaded (demo key): ${response.data.data.url}`);
                return response.data.data.url;
            }

            throw new Error('Failed to upload with demo key');
        } catch (error) {
            this.logger.error(`Base64 upload failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Upload to Cloudinary (alternative)
     */
    async uploadToCloudinary(imagePath: string): Promise<string> {
        try {
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
            const apiKey = process.env.CLOUDINARY_API_KEY;
            const apiSecret = process.env.CLOUDINARY_API_SECRET;

            if (!cloudName || !apiKey || !apiSecret) {
                throw new Error('Cloudinary credentials not configured');
            }

            const imageBuffer = fs.readFileSync(imagePath);
            const form = new FormData();
            form.append('file', imageBuffer, { filename: 'visitor-card.png' });
            form.append('upload_preset', 'visitor_cards');

            const response = await axios.post(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                form,
                {
                    headers: form.getHeaders(),
                    timeout: 30000,
                }
            );

            if (response.data?.secure_url) {
                this.logger.log(`✅ Image uploaded to Cloudinary: ${response.data.secure_url}`);
                return response.data.secure_url;
            }

            throw new Error('Invalid response from Cloudinary');
        } catch (error) {
            this.logger.error(`Failed to upload to Cloudinary: ${error.message}`);
            throw error;
        }
    }

    /**
     * Upload to Imgur (free, anonymous uploads)
     */
    async uploadToImgur(imagePath: string): Promise<string> {
        try {
            this.logger.log(`Uploading to Imgur...`);
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString('base64');

            const form = new FormData();
            form.append('image', base64Image);

            const response = await axios.post(
                'https://api.imgur.com/3/image',
                form,
                {
                    headers: {
                        ...form.getHeaders(),
                        'Authorization': 'Client-ID 546c25a59c58ad7', // Public anonymous client ID
                    },
                    timeout: 30000,
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                }
            );

            this.logger.log(`Imgur response: ${JSON.stringify(response.data)}`);

            if (response.data?.data?.link) {
                const imageUrl = response.data.data.link;
                this.logger.log(`✅ Image uploaded to Imgur: ${imageUrl}`);
                return imageUrl;
            }

            throw new Error('Invalid response from Imgur');
        } catch (error) {
            this.logger.error(`Failed to upload to Imgur: ${error.message}`);
            if (error.response) {
                this.logger.error(`Imgur error response: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    /**
     * Upload to Telegraph (free, no API key required)
     */
    async uploadToTelegraph(imagePath: string): Promise<string> {
        try {
            this.logger.log(`Uploading to Telegraph...`);
            const imageBuffer = fs.readFileSync(imagePath);
            const form = new FormData();
            form.append('file', imageBuffer, { filename: 'visitor-card.png' });

            const response = await axios.post(
                'https://telegra.ph/upload',
                form,
                {
                    headers: form.getHeaders(),
                    timeout: 30000,
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                }
            );

            this.logger.log(`Telegraph response: ${JSON.stringify(response.data)}`);

            if (response.data && response.data[0]?.src) {
                const imageUrl = `https://telegra.ph${response.data[0].src}`;
                this.logger.log(`✅ Image uploaded to Telegraph: ${imageUrl}`);
                return imageUrl;
            }

            throw new Error('Invalid response from Telegraph');
        } catch (error) {
            this.logger.error(`Failed to upload to Telegraph: ${error.message}`);
            if (error.response) {
                this.logger.error(`Telegraph error response: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    /**
     * Smart upload - tries multiple services with fallback
     */
    /**
         * Smart upload - tries multiple services with fallback
         */
    async uploadImage(imagePath: string): Promise<string> {
        this.logger.log(`Starting image upload for: ${imagePath}`);

        // Try ImgBB if API key is configured (most reliable)
        if (process.env.IMGBB_API_KEY) {
            try {
                const url = await this.uploadToImgBB(imagePath);
                this.logger.log(`✅ Successfully uploaded to ImgBB`);
                return url;
            } catch (error) {
                this.logger.warn(`ImgBB upload failed: ${error.message}`);
            }
        }

        // Try Imgur as fallback (free, but has rate limits)
        try {
            const url = await this.uploadToImgur(imagePath);
            this.logger.log(`✅ Successfully uploaded to Imgur`);
            return url;
        } catch (error) {
            this.logger.warn(`Imgur upload failed: ${error.message}`);
        }

        // Try Telegraph as fallback
        try {
            const url = await this.uploadToTelegraph(imagePath);
            this.logger.log(`✅ Successfully uploaded to Telegraph`);
            return url;
        } catch (error) {
            this.logger.warn(`Telegraph upload failed: ${error.message}`);
        }

        // Try Cloudinary if credentials are configured
        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
            try {
                const url = await this.uploadToCloudinary(imagePath);
                this.logger.log(`✅ Successfully uploaded to Cloudinary`);
                return url;
            } catch (error) {
                this.logger.warn(`Cloudinary upload failed: ${error.message}`);
            }
        }

        // All cloud services failed
        this.logger.error(`❌ All cloud upload services failed`);

        // Fallback: return local URL (won't work with WhatsApp)
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        const filename = imagePath.split('/').pop();
        const localUrl = `${baseUrl}/uploads/visitor-cards/${filename}`;

        this.logger.error(`⚠️ FALLBACK: Using local URL (will NOT work with WhatsApp): ${localUrl}`);
        this.logger.error(`💡 FIX: Configure IMGBB_API_KEY or check network connectivity`);
        this.logger.error(`💡 Get ImgBB API key from: https://api.imgbb.com/`);

        throw new Error('Failed to upload image to any cloud service. WhatsApp requires publicly accessible URLs.');
    }
}
