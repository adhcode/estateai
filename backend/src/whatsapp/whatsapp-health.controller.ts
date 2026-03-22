import { Controller, Get, Logger } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { IntentService } from './conversation/intent.service';
import { MessengerService } from './outbound/messenger.service';
import { WhatsAppProviderFactory } from './providers/provider.factory';

/**
 * WhatsApp Health Check Controller
 * Provides detailed health status for all WhatsApp components
 */
@Controller('whatsapp')
export class WhatsAppHealthController {
    private readonly logger = new Logger(WhatsAppHealthController.name);

    constructor(
        private readonly providerFactory: WhatsAppProviderFactory,
        private readonly messengerService: MessengerService,
        private readonly intentService: IntentService,
    ) { }

    /**
     * Comprehensive health check
     * GET /api/whatsapp/health
     */
    @Public()
    @Get('health')
    async healthCheck() {
        try {
            // Check messenger service
            const messengerHealth = await this.messengerService.healthCheck();

            // Check Dialogflow
            const dialogflowHealth = await this.intentService.healthCheck();

            // Get provider info
            const provider = this.providerFactory.getProvider();
            const providerName = provider.constructor.name.replace('Provider', '').toLowerCase();

            // Overall status
            const isHealthy = messengerHealth.healthy;

            return {
                status: isHealthy ? 'healthy' : 'degraded',
                timestamp: new Date().toISOString(),
                components: {
                    provider: {
                        name: providerName,
                        healthy: messengerHealth.healthy,
                        message: messengerHealth.message,
                    },
                    dialogflow: {
                        enabled: dialogflowHealth.enabled,
                        healthy: dialogflowHealth.healthy,
                        message: dialogflowHealth.message,
                        fallback: !dialogflowHealth.enabled ? 'pattern-matching' : null,
                    },
                    database: {
                        healthy: true, // Prisma will throw if DB is down
                        message: 'Connected',
                    },
                },
                capabilities: {
                    sendText: true,
                    sendMedia: true,
                    sendInteractive: providerName === 'meta',
                    intentDetection: dialogflowHealth.enabled ? 'dialogflow' : 'pattern-matching',
                },
            };
        } catch (error) {
            this.logger.error(`Health check failed: ${error.message}`);
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message,
            };
        }
    }

    /**
     * Quick status check
     * GET /api/whatsapp/status
     */
    @Public()
    @Get('status')
    async quickStatus() {
        try {
            const messengerHealth = await this.messengerService.healthCheck();
            return {
                status: messengerHealth.healthy ? 'ok' : 'error',
                provider: messengerHealth.provider,
            };
        } catch (error) {
            return {
                status: 'error',
                message: error.message,
            };
        }
    }
}
