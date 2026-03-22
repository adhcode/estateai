import { Body, Controller, Get, Logger, Post, Query, Req, Res } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ConversationService } from '../conversation/conversation.service';
import { MessengerService } from '../outbound/messenger.service';
import { WhatsAppProviderFactory } from '../providers/provider.factory';
import { InboundParser } from './inbound.parser';

/**
 * WhatsApp Webhook Controller
 * Handles inbound messages from WhatsApp providers
 */
@Controller('whatsapp/webhook')
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);

    constructor(
        private readonly providerFactory: WhatsAppProviderFactory,
        private readonly inboundParser: InboundParser,
        private readonly conversationService: ConversationService,
        private readonly messengerService: MessengerService,
    ) { }

    /**
     * Webhook verification (GET)
     * Used by Meta and other providers to verify webhook URL
     */
    @Public()
    @Get()
    verifyWebhook(@Query() query: any, @Res() res: any) {
        this.logger.log('Webhook verification request received');

        const provider = this.providerFactory.getProvider();

        if (provider.verifyWebhook) {
            const result = provider.verifyWebhook({
                mode: query['hub.mode'],
                token: query['hub.verify_token'],
                challenge: query['hub.challenge'],
            });

            if (result) {
                this.logger.log('✅ Webhook verified successfully');
                return res.status(200).send(result);
            }
        }

        this.logger.warn('❌ Webhook verification failed');
        return res.status(403).send('Forbidden');
    }

    /**
     * Webhook endpoint (POST)
     * Receives inbound messages from WhatsApp
     */
    @Public()
    @Post()
    async handleWebhook(@Body() payload: any, @Req() req: any, @Res() res: any) {
        try {
            this.logger.log('📨 Webhook payload received');
            this.logger.debug(JSON.stringify(payload, null, 2));

            // Immediately respond 200 OK (required by Meta)
            res.status(200).send('OK');

            // Process asynchronously
            this.processWebhookAsync(payload).catch((error) => {
                this.logger.error(`Async processing error: ${error.message}`);
            });
        } catch (error) {
            this.logger.error(`Webhook error: ${error.message}`);
            res.status(500).send('Internal Server Error');
        }
    }

    /**
     * Process webhook payload asynchronously
     */
    private async processWebhookAsync(payload: any): Promise<void> {
        try {
            // Parse inbound messages
            const messages = this.inboundParser.parse(payload);

            if (messages.length === 0) {
                this.logger.debug('No messages to process (likely a status update)');
                return;
            }

            this.logger.log(`Processing ${messages.length} message(s)`);

            // Process each message
            for (const message of messages) {
                try {
                    // Mark as read with typing indicator
                    await this.messengerService.markAsReadWithTyping(message.messageId, true);

                    // Handle conversation
                    const responses = await this.conversationService.handleIncoming(message);

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
                            await this.messengerService.sendInteractive(response.interactive);
                        }
                    }

                    this.logger.log(`✅ Message processed: ${message.messageId}`);
                } catch (error) {
                    this.logger.error(`Error processing message ${message.messageId}: ${error.message}`);
                }
            }
        } catch (error) {
            this.logger.error(`Async processing failed: ${error.message}`);
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
        };
    }
}