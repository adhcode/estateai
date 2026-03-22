import { Injectable, Logger } from '@nestjs/common';
import {
    InboundMessage,
    MarkAsReadInput,
    SendMediaInput,
    SendTemplateInput,
    SendTextInput,
    SendTextResult,
    WebhookVerification,
    WhatsAppProvider,
} from '../interfaces/whatsapp-provider.interface';

/**
 * Twilio WhatsApp Provider (Sandbox & Production)
 * Fallback option for development and testing
 */
@Injectable()
export class TwilioWhatsAppProvider implements WhatsAppProvider {
    readonly name = 'twilio';
    private readonly logger = new Logger(TwilioWhatsAppProvider.name);
    private twilioClient: any;
    private readonly accountSid: string;
    private readonly authToken: string;
    private readonly fromNumber: string;

    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
        this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
        this.fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

        if (this.accountSid && this.authToken) {
            const twilio = require('twilio');
            this.twilioClient = twilio(this.accountSid, this.authToken);
        } else {
            this.logger.warn('Twilio credentials not configured');
        }
    }

    async sendText(input: SendTextInput): Promise<SendTextResult> {
        try {
            if (!this.twilioClient) {
                throw new Error('Twilio client not initialized');
            }

            this.logger.log(`Sending text to ${input.to}`);

            const toNumber = input.to.startsWith('whatsapp:') ? input.to : `whatsapp:${input.to}`;

            const message = await this.twilioClient.messages.create({
                body: input.body,
                from: this.fromNumber,
                to: toNumber,
            });

            this.logger.log(`Message sent: ${message.sid}`);

            return {
                providerMessageId: message.sid,
                success: true,
            };
        } catch (error) {
            this.logger.error(`Failed to send text: ${error.message}`);
            return {
                providerMessageId: '',
                success: false,
                error: error.message,
            };
        }
    }

    async sendMedia(input: SendMediaInput): Promise<SendTextResult> {
        try {
            if (!this.twilioClient) {
                throw new Error('Twilio client not initialized');
            }

            this.logger.log(`Sending ${input.type} to ${input.to}`);

            const toNumber = input.to.startsWith('whatsapp:') ? input.to : `whatsapp:${input.to}`;

            const messageData: any = {
                from: this.fromNumber,
                to: toNumber,
            };

            if (input.url) {
                messageData.mediaUrl = [input.url];
            }

            if (input.caption) {
                messageData.body = input.caption;
            }

            const message = await this.twilioClient.messages.create(messageData);

            this.logger.log(`Media sent: ${message.sid}`);

            return {
                providerMessageId: message.sid,
                success: true,
            };
        } catch (error) {
            this.logger.error(`Failed to send media: ${error.message}`);
            return {
                providerMessageId: '',
                success: false,
                error: error.message,
            };
        }
    }

    async sendTemplate(input: SendTemplateInput): Promise<SendTextResult> {
        // Twilio doesn't support templates in the same way
        // Fall back to text message
        this.logger.warn('Twilio does not support WhatsApp templates, sending as text');
        return this.sendText({
            to: input.to,
            body: `Template: ${input.name}`,
        });
    }

    async markAsRead(input: MarkAsReadInput): Promise<void> {
        // Twilio doesn't support marking messages as read
        this.logger.debug('Twilio does not support marking messages as read');
    }

    verifyWebhook(verification: WebhookVerification): boolean | string {
        // Twilio uses different verification method (X-Twilio-Signature header)
        // This is handled at controller level
        return true;
    }

    parseInbound(payload: any): InboundMessage[] {
        const messages: InboundMessage[] = [];

        try {
            // Twilio webhook structure is flat
            if (payload.MessageSid && payload.Body) {
                const msg: InboundMessage = {
                    messageId: payload.MessageSid,
                    from: payload.From?.replace('whatsapp:', '') || '',
                    to: payload.To?.replace('whatsapp:', '') || '',
                    timestamp: new Date(),
                    type: 'text',
                    text: payload.Body,
                };

                // Check for media
                const numMedia = parseInt(payload.NumMedia || '0');
                if (numMedia > 0) {
                    msg.type = 'image'; // Simplified
                    msg.media = {
                        url: payload.MediaUrl0,
                        mimeType: payload.MediaContentType0,
                    };
                }

                messages.push(msg);
            }
        } catch (error) {
            this.logger.error(`Failed to parse inbound messages: ${error.message}`);
        }

        return messages;
    }

    async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
        try {
            if (!this.twilioClient) {
                return { healthy: false, message: 'Twilio client not initialized' };
            }

            // Try to fetch account info
            const account = await this.twilioClient.api.accounts(this.accountSid).fetch();

            return {
                healthy: true,
                message: `Connected to Twilio account: ${account.friendlyName}`,
            };
        } catch (error) {
            return {
                healthy: false,
                message: error.message,
            };
        }
    }
}
