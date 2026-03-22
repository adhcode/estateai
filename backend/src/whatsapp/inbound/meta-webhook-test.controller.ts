import { Body, Controller, Get, Logger, Post, Query, Res } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ConversationService } from '../conversation/conversation.service';
import { MessengerService } from '../outbound/messenger.service';
import { InboundParser } from './inbound.parser';

/**
 * Meta WhatsApp Webhook Test Controller
 * Dedicated endpoint for testing Meta WhatsApp integration
 */
@Controller('webhooks/meta/whatsapp')
export class MetaWhatsAppWebhookController {
    private readonly logger = new Logger(MetaWhatsAppWebhookController.name);

    constructor(
        private readonly inboundParser: InboundParser,
        private readonly conversationService: ConversationService,
        private readonly messengerService: MessengerService,
    ) { }

    /**
     * Webhook verification (GET)
     * Meta sends this to verify your webhook URL
     * IMPORTANT: Must return raw challenge string, not JSON
     */
    @Public()
    @Get()
    verifyWebhook(
        @Query('hub.mode') mode: string,
        @Query('hub.verify_token') token: string,
        @Query('hub.challenge') challenge: string,
        @Res() res: any,
    ): void {
        this.logger.log('🔍 Meta webhook verification request received');
        this.logger.log(`Mode: ${mode}, Token: ${token ? '***' : 'missing'}, Challenge: ${challenge}`);

        const expectedToken = process.env.META_WA_VERIFY_TOKEN || 'estate_verify_token';

        if (mode === 'subscribe' && token === expectedToken) {
            this.logger.log('✅ Webhook verified successfully! Returning challenge: ' + challenge);
            // Return raw challenge string (not JSON) - CRITICAL for Meta verification
            res.status(200).send(challenge);
            return;
        }

        this.logger.error('❌ Webhook verification failed - token mismatch');
        this.logger.error(`Expected: ${expectedToken}, Got: ${token}`);
        res.status(403).send('Invalid verify token');
    }

    /**
     * Webhook endpoint (POST)
     * Receives messages from Meta WhatsApp
     */
    @Public()
    @Post()
    async receiveWebhook(@Body() body: any) {
        this.logger.log('📨 Meta webhook payload received');
        this.logger.log(JSON.stringify(body, null, 2));

        try {
            // Parse inbound messages
            const messages = this.inboundParser.parse(body);

            if (messages.length === 0) {
                this.logger.debug('No messages to process (status update or other event)');
                return { received: true, processed: 0 };
            }

            this.logger.log(`📬 Processing ${messages.length} message(s)`);

            // Process each message
            for (const message of messages) {
                try {
                    this.logger.log(`Processing message from ${message.from}: ${message.text}`);

                    // Mark as read WITH typing indicator (will fallback gracefully if not supported)
                    await this.messengerService.markAsReadWithTyping(message.messageId, true);

                    // Handle conversation (this may take time for code generation)
                    const responses = await this.conversationService.handleIncoming(message);

                    // Add a small delay before sending first response to simulate typing
                    // This creates a more natural conversation feel
                    if (responses.length > 0) {
                        await new Promise(resolve => setTimeout(resolve, 800));
                    }

                    // Send responses
                    for (const response of responses) {
                        if (response.kind === 'text') {
                            await this.messengerService.sendText({
                                to: response.to,
                                body: response.body || '',
                            });
                        } else if (response.kind === 'media') {
                            await this.messengerService.sendMedia({
                                to: response.to,
                                type: response.mediaType || 'image',
                                url: response.mediaUrl,
                            });
                        } else if (response.kind === 'interactive') {
                            await this.messengerService.sendInteractive({
                                to: response.to,
                                type: response.interactive.type,
                                body: response.interactive.body.text,
                                action: response.interactive.action,
                            });
                        }
                    }

                    this.logger.log(`✅ Message processed successfully: ${message.messageId}`);
                } catch (error) {
                    this.logger.error(`Error processing message ${message.messageId}: ${error.message}`);
                }
            }

            return { received: true, processed: messages.length };
        } catch (error) {
            this.logger.error(`Webhook processing error: ${error.message}`);
            return { received: true, error: error.message };
        }
    }

    /**
     * Health check endpoint
     */
    @Public()
    @Get('health')
    async healthCheck() {
        const messengerHealth = await this.messengerService.healthCheck();

        return {
            status: messengerHealth.healthy ? 'healthy' : 'unhealthy',
            provider: messengerHealth.provider,
            message: messengerHealth.message,
            timestamp: new Date().toISOString(),
            endpoint: '/webhooks/meta/whatsapp',
        };
    }
}
