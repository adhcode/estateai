import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
    InboundMessage,
    MarkAsReadInput,
    SendInteractiveInput,
    SendMediaInput,
    SendTemplateInput,
    SendTextInput,
    SendTextResult,
    WebhookVerification,
    WhatsAppProvider,
} from '../interfaces/whatsapp-provider.interface';

/**
 * Meta Cloud API Provider
 * Official WhatsApp Business Platform
 */
@Injectable()
export class MetaWhatsAppProvider implements WhatsAppProvider {
    readonly name = 'meta';
    private readonly logger = new Logger(MetaWhatsAppProvider.name);
    private readonly client: AxiosInstance;
    private readonly phoneNumberId: string;
    private readonly accessToken: string;
    private readonly verifyToken: string;

    constructor() {
        this.phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID || '';
        this.accessToken = process.env.META_WA_TOKEN || '';
        this.verifyToken = process.env.META_WA_VERIFY_TOKEN || 'estate_verify_token';

        this.client = axios.create({
            baseURL: `https://graph.facebook.com/v18.0/${this.phoneNumberId}`,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });

        if (!this.phoneNumberId || !this.accessToken) {
            this.logger.warn('Meta WhatsApp credentials not configured');
        }
    }

    async sendText(input: SendTextInput): Promise<SendTextResult> {
        try {
            this.logger.log(`Sending text to ${input.to}`);

            const response = await this.client.post('/messages', {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: input.to,
                type: 'text',
                text: {
                    preview_url: input.previewUrl ?? false,
                    body: input.body,
                },
            });

            this.logger.log(`Message sent: ${response.data.messages[0].id}`);

            return {
                providerMessageId: response.data.messages[0].id,
                success: true,
            };
        } catch (error) {
            this.logger.error(`Failed to send text: ${error.message}`, error.response?.data);
            return {
                providerMessageId: '',
                success: false,
                error: error.response?.data?.error?.message || error.message,
            };
        }
    }

    async sendMedia(input: SendMediaInput): Promise<SendTextResult> {
        try {
            this.logger.log(`Sending ${input.type} to ${input.to}`);

            const mediaObject: any = {};
            if (input.id) {
                mediaObject.id = input.id;
            } else if (input.url) {
                mediaObject.link = input.url;
            }

            if (input.caption) {
                mediaObject.caption = input.caption;
            }

            if (input.type === 'document' && input.filename) {
                mediaObject.filename = input.filename;
            }

            const response = await this.client.post('/messages', {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: input.to,
                type: input.type,
                [input.type]: mediaObject,
            });

            this.logger.log(`Media sent: ${response.data.messages[0].id}`);

            return {
                providerMessageId: response.data.messages[0].id,
                success: true,
            };
        } catch (error) {
            this.logger.error(`Failed to send media: ${error.message}`, error.response?.data);
            return {
                providerMessageId: '',
                success: false,
                error: error.response?.data?.error?.message || error.message,
            };
        }
    }

    async sendTemplate(input: SendTemplateInput): Promise<SendTextResult> {
        try {
            this.logger.log(`Sending template ${input.name} to ${input.to}`);

            const response = await this.client.post('/messages', {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: input.to,
                type: 'template',
                template: {
                    name: input.name,
                    language: {
                        code: input.language,
                    },
                    components: input.components || [],
                },
            });

            this.logger.log(`Template sent: ${response.data.messages[0].id}`);

            return {
                providerMessageId: response.data.messages[0].id,
                success: true,
            };
        } catch (error) {
            this.logger.error(`Failed to send template: ${error.message}`, error.response?.data);
            return {
                providerMessageId: '',
                success: false,
                error: error.response?.data?.error?.message || error.message,
            };
        }
    }

    async sendInteractive(input: SendInteractiveInput): Promise<SendTextResult> {
        try {
            this.logger.log(`Sending interactive ${input.type} to ${input.to}`);

            const interactive: any = {
                type: input.type,
                body: { text: input.body },
                action: input.action,
            };

            if (input.header) {
                interactive.header = input.header;
            }

            if (input.footer) {
                interactive.footer = { text: input.footer };
            }

            const response = await this.client.post('/messages', {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: input.to,
                type: 'interactive',
                interactive,
            });

            this.logger.log(`Interactive sent: ${response.data.messages[0].id}`);

            return {
                providerMessageId: response.data.messages[0].id,
                success: true,
            };
        } catch (error) {
            this.logger.error(`Failed to send interactive: ${error.message}`, error.response?.data);
            return {
                providerMessageId: '',
                success: false,
                error: error.response?.data?.error?.message || error.message,
            };
        }
    }

    async markAsRead(input: MarkAsReadInput): Promise<void> {
        try {
            await this.client.post('/messages', {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: input.messageId,
            });

            this.logger.log(`Marked message as read: ${input.messageId}`);
        } catch (error) {
            this.logger.error(`Failed to mark as read: ${error.message}`);
        }
    }

    /**
     * Mark message as read AND show typing indicator
     * This triggers the native WhatsApp "typing..." animation (three dots)
     * The indicator lasts up to 25 seconds or until you send a message
     * 
     * @param messageId - The incoming message ID to mark as read
     * @param showTyping - Whether to show typing indicator (default: true)
     */
    /**
     * Mark message as read AND show typing indicator
     * This triggers the native WhatsApp "typing..." animation (three dots)
     * The indicator lasts up to 25 seconds or until you send a message
     * 
     * @param messageId - The incoming message ID to mark as read
     * @param showTyping - Whether to show typing indicator (default: true)
     */
    async markAsReadWithTyping(messageId: string, showTyping: boolean = true): Promise<void> {
        try {
            // Try with typing indicator first
            if (showTyping) {
                try {
                    const payloadWithTyping = {
                        messaging_product: 'whatsapp',
                        status: 'read',
                        message_id: messageId,
                        typing_indicator: {
                            type: 'text',
                        },
                    };

                    await this.client.post('/messages', payloadWithTyping);
                    this.logger.log(`✅ Marked as read with typing indicator: ${messageId}`);
                    return;
                } catch (typingError) {
                    // If typing indicator fails, fall back to just read receipt
                    this.logger.debug(`Typing indicator not supported, falling back to read-only`);
                }
            }

            // Fallback: Just mark as read without typing indicator
            const payload = {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId,
            };

            await this.client.post('/messages', payload);
            this.logger.log(`Marked message as read: ${messageId}`);
        } catch (error) {
            this.logger.error(`Failed to mark as read: ${error.message}`);
        }
    }

    /**
     * Simulate typing indicator
     * Meta WhatsApp API doesn't have a native typing indicator endpoint
     * We simulate it by adding a realistic delay before sending the actual message
     * This creates the perception of the bot "thinking" and typing
     */
    /**
     * Send typing indicator (not supported as standalone in Meta API)
     * Typing indicators must be sent with read receipts
     * Use markAsReadWithTyping() instead
     */
    async sendTypingIndicator(to: string, durationMs: number = 2000): Promise<void> {
        this.logger.debug(`💬 Typing indicator must be sent with read receipt (use markAsReadWithTyping)`);
    }

    /**
     * Mark typing status
     * Note: Meta WhatsApp Business API does not support typing indicators
     * The typing effect is achieved through strategic delays in message sending
     */
    async markTyping(to: string, isTyping: boolean = true): Promise<void> {
        // Meta API limitation: No native typing indicator support
        // Typing effect is simulated through delays in the messenger service
        this.logger.debug(`Typing simulation ${isTyping ? 'enabled' : 'disabled'} for ${to}`);
    }

    verifyWebhook(verification: WebhookVerification): boolean | string {
        if (verification.mode === 'subscribe' && verification.token === this.verifyToken) {
            this.logger.log('Webhook verified successfully');
            return verification.challenge;
        }
        this.logger.warn('Webhook verification failed');
        return false;
    }

    parseInbound(payload: any): InboundMessage[] {
        const messages: InboundMessage[] = [];

        try {
            // Meta webhook structure: entry[].changes[].value.messages[]
            if (!payload.entry) {
                return messages;
            }

            for (const entry of payload.entry) {
                for (const change of entry.changes || []) {
                    const value = change.value;

                    if (!value.messages) {
                        continue;
                    }

                    for (const msg of value.messages) {
                        const inboundMsg: InboundMessage = {
                            messageId: msg.id,
                            from: msg.from,
                            to: value.metadata?.phone_number_id || '',
                            timestamp: new Date(parseInt(msg.timestamp) * 1000),
                            type: msg.type || 'unknown',
                        };

                        // Parse text
                        if (msg.type === 'text') {
                            inboundMsg.text = msg.text?.body;
                        }

                        // Parse media
                        if (['image', 'audio', 'video', 'document'].includes(msg.type)) {
                            const mediaData = msg[msg.type];
                            inboundMsg.media = {
                                id: mediaData?.id,
                                mimeType: mediaData?.mime_type,
                                caption: mediaData?.caption,
                            };
                        }

                        // Parse interactive responses
                        if (msg.type === 'interactive') {
                            inboundMsg.interactive = {
                                type: msg.interactive?.type,
                                buttonReply: msg.interactive?.button_reply,
                                listReply: msg.interactive?.list_reply,
                            };
                        }

                        // Parse context (replies)
                        if (msg.context) {
                            inboundMsg.context = {
                                messageId: msg.context.id,
                            };
                        }

                        messages.push(inboundMsg);
                    }
                }
            }
        } catch (error) {
            this.logger.error(`Failed to parse inbound messages: ${error.message}`);
        }

        return messages;
    }

    async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
        try {
            // Try to get phone number info
            const response = await axios.get(
                `https://graph.facebook.com/v18.0/${this.phoneNumberId}`,
                {
                    headers: { Authorization: `Bearer ${this.accessToken}` },
                    params: { fields: 'verified_name,code_verification_status,quality_rating' },
                },
            );

            return {
                healthy: true,
                message: `Connected to ${response.data.verified_name}`,
            };
        } catch (error) {
            return {
                healthy: false,
                message: error.message,
            };
        }
    }
}
