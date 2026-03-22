import { Injectable, Logger } from '@nestjs/common';
import { InboundMessage } from '../interfaces/whatsapp-provider.interface';
import { WhatsAppProviderFactory } from '../providers/provider.factory';

/**
 * Inbound Parser
 * Normalizes inbound messages from different providers
 */
@Injectable()
export class InboundParser {
    private readonly logger = new Logger(InboundParser.name);

    constructor(private readonly providerFactory: WhatsAppProviderFactory) { }

    /**
     * Parse inbound webhook payload
     * Returns normalized InboundMessage array
     */
    parse(payload: any): InboundMessage[] {
        try {
            const provider = this.providerFactory.getProvider();
            const messages = provider.parseInbound(payload);

            this.logger.log(`Parsed ${messages.length} message(s) from ${provider.name}`);

            // Additional normalization if needed
            return messages.map((msg) => this.normalizeMessage(msg));
        } catch (error) {
            this.logger.error(`Failed to parse inbound messages: ${error.message}`);
            return [];
        }
    }

    /**
     * Normalize message format
     * Ensures consistent structure across providers
     */
    private normalizeMessage(message: InboundMessage): InboundMessage {
        // Clean phone numbers (remove whatsapp: prefix if present)
        if (message.from.startsWith('whatsapp:')) {
            message.from = message.from.replace('whatsapp:', '');
        }

        if (message.to.startsWith('whatsapp:')) {
            message.to = message.to.replace('whatsapp:', '');
        }

        // Ensure timestamp is a Date object
        if (!(message.timestamp instanceof Date)) {
            message.timestamp = new Date(message.timestamp);
        }

        // Trim text
        if (message.text) {
            message.text = message.text.trim();
        }

        return message;
    }

    /**
     * Extract text from message (handles different message types)
     */
    extractText(message: InboundMessage): string {
        if (message.text) {
            return message.text;
        }

        if (message.interactive?.buttonReply) {
            return message.interactive.buttonReply.title;
        }

        if (message.interactive?.listReply) {
            return message.interactive.listReply.title;
        }

        if (message.media?.caption) {
            return message.media.caption;
        }

        return '';
    }
}
