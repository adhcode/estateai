import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppProvider } from '../interfaces/whatsapp-provider.interface';
import { MetaWhatsAppProvider } from './meta.provider';
import { TwilioWhatsAppProvider } from './twilio.provider';

/**
 * Factory to create the appropriate WhatsApp provider
 * Based on environment configuration
 */
@Injectable()
export class WhatsAppProviderFactory {
    private readonly logger = new Logger(WhatsAppProviderFactory.name);
    private provider: WhatsAppProvider;

    constructor(
        private readonly metaProvider: MetaWhatsAppProvider,
        private readonly twilioProvider: TwilioWhatsAppProvider,
    ) {
        this.provider = this.createProvider();
    }

    private createProvider(): WhatsAppProvider {
        const providerType = (process.env.WHATSAPP_PROVIDER || 'meta').toLowerCase();

        this.logger.log(`Initializing WhatsApp provider: ${providerType}`);

        switch (providerType) {
            case 'meta':
                return this.metaProvider;

            case 'twilio':
                return this.twilioProvider;

            case 'sendchamp':
                // TODO: Implement SendchampWhatsAppProvider
                this.logger.warn('Sendchamp provider not yet implemented, falling back to Meta');
                return this.metaProvider;

            case '360dialog':
                // TODO: Implement 360DialogWhatsAppProvider
                this.logger.warn('360Dialog provider not yet implemented, falling back to Meta');
                return this.metaProvider;

            default:
                this.logger.warn(`Unknown provider: ${providerType}, falling back to Meta`);
                return this.metaProvider;
        }
    }

    getProvider(): WhatsAppProvider {
        return this.provider;
    }

    async switchProvider(providerType: string): Promise<void> {
        this.logger.log(`Switching to provider: ${providerType}`);
        process.env.WHATSAPP_PROVIDER = providerType;
        this.provider = this.createProvider();
    }
}
