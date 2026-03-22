import { Module, forwardRef } from '@nestjs/common';

// Providers
import { MetaWhatsAppProvider } from './providers/meta.provider';
import { WhatsAppProviderFactory } from './providers/provider.factory';
import { TwilioWhatsAppProvider } from './providers/twilio.provider';

// Inbound
import { InboundParser } from './inbound/inbound.parser';
import { MetaWhatsAppWebhookController } from './inbound/meta-webhook-test.controller';
import { WebhookController } from './inbound/webhook.controller';

// Health
import { WhatsAppHealthController } from './whatsapp-health.controller';

// Outbound
import { MessengerService } from './outbound/messenger.service';

// Conversation
import { ConversationService } from './conversation/conversation.service';
import { IntentService } from './conversation/intent.service';
import { StateStore } from './conversation/state.store';

// Domain
import { EstateWhatsAppService } from './domain/estate-whatsapp.service';

// Domain imports (will be added)
import { OccupantsModule } from '../occupants/occupants.module';
import { VisitorCodeModule } from '../visitor-code/visitor-code.module';

/**
 * WhatsApp Module
 * Centralized WhatsApp integration with provider abstraction
 */
@Module({
    imports: [
        forwardRef(() => VisitorCodeModule),
        forwardRef(() => OccupantsModule),
    ],
    controllers: [
        WebhookController,
        MetaWhatsAppWebhookController,
        WhatsAppHealthController,
    ],
    providers: [
        // Provider layer
        MetaWhatsAppProvider,
        TwilioWhatsAppProvider,
        WhatsAppProviderFactory,

        // Inbound layer
        InboundParser,

        // Outbound layer
        MessengerService,

        // Conversation layer
        ConversationService,
        IntentService,
        StateStore,

        // Domain layer
        EstateWhatsAppService,
    ],
    exports: [
        MessengerService,
        ConversationService,
        IntentService,
        WhatsAppProviderFactory,
    ],
})
export class WhatsAppModule { }
