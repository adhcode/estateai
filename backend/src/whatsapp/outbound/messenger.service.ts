import { Injectable, Logger } from '@nestjs/common';
import {
    SendInteractiveInput,
    SendMediaInput,
    SendTemplateInput,
    SendTextInput,
} from '../interfaces/whatsapp-provider.interface';
import { WhatsAppProviderFactory } from '../providers/provider.factory';

/**
 * Messaging Orchestrator
 * Handles retries, rate limiting, human-feel delays, and logging
 */
@Injectable()
export class MessengerService {
    private readonly logger = new Logger(MessengerService.name);
    private readonly humanDelayMs = parseInt(process.env.WHATSAPP_HUMAN_DELAY_MS || '1000');
    private readonly maxRetries = parseInt(process.env.WHATSAPP_MAX_RETRIES || '3');

    constructor(private readonly providerFactory: WhatsAppProviderFactory) { }

    /**
     * Send text message with retry logic
     */
    async sendText(input: SendTextInput, options?: { skipDelay?: boolean; retries?: number; showTyping?: boolean }): Promise<string | null> {
        const retries = options?.retries ?? this.maxRetries;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                this.logger.log(`Sending text to ${input.to} (attempt ${attempt}/${retries})`);

                const provider = this.providerFactory.getProvider();
                const result = await provider.sendText(input);

                if (result.success) {
                    this.logger.log(`✅ Message sent successfully: ${result.providerMessageId}`);
                    return result.providerMessageId;
                }

                // If not successful but not last attempt, retry
                if (attempt < retries) {
                    this.logger.warn(`Attempt ${attempt} failed, retrying...`);
                    await this.exponentialBackoff(attempt);
                    continue;
                }

                this.logger.error(`❌ Failed to send message after ${retries} attempts: ${result.error}`);
                return null;
            } catch (error) {
                this.logger.error(`Error on attempt ${attempt}: ${error.message}`);

                if (attempt < retries) {
                    await this.exponentialBackoff(attempt);
                    continue;
                }

                return null;
            }
        }

        return null;
    }

    /**
     * Send media message
     */
    async sendMedia(input: SendMediaInput, options?: { skipDelay?: boolean }): Promise<string | null> {
        if (!options?.skipDelay) {
            await this.addHumanDelay();
        }

        try {
            this.logger.log(`Sending ${input.type} to ${input.to}`);

            const provider = this.providerFactory.getProvider();
            const result = await provider.sendMedia(input);

            if (result.success) {
                this.logger.log(`✅ Media sent successfully: ${result.providerMessageId}`);
                return result.providerMessageId;
            }

            this.logger.error(`❌ Failed to send media: ${result.error}`);
            return null;
        } catch (error) {
            this.logger.error(`Error sending media: ${error.message}`);
            return null;
        }
    }

    /**
     * Send template message
     */
    async sendTemplate(input: SendTemplateInput, options?: { skipDelay?: boolean }): Promise<string | null> {
        if (!options?.skipDelay) {
            await this.addHumanDelay();
        }

        try {
            this.logger.log(`Sending template ${input.name} to ${input.to}`);

            const provider = this.providerFactory.getProvider();
            const result = await provider.sendTemplate(input);

            if (result.success) {
                this.logger.log(`✅ Template sent successfully: ${result.providerMessageId}`);
                return result.providerMessageId;
            }

            this.logger.error(`❌ Failed to send template: ${result.error}`);
            return null;
        } catch (error) {
            this.logger.error(`Error sending template: ${error.message}`);
            return null;
        }
    }

    /**
     * Send interactive message (buttons/lists)
     */
    async sendInteractive(input: SendInteractiveInput, options?: { skipDelay?: boolean }): Promise<string | null> {
        if (!options?.skipDelay) {
            await this.addHumanDelay();
        }

        try {
            this.logger.log(`Sending interactive ${input.type} to ${input.to}`);

            const provider = this.providerFactory.getProvider();

            if (!provider.sendInteractive) {
                this.logger.warn('Provider does not support interactive messages');
                return null;
            }

            const result = await provider.sendInteractive(input);

            if (result.success) {
                this.logger.log(`✅ Interactive sent successfully: ${result.providerMessageId}`);
                return result.providerMessageId;
            }

            this.logger.error(`❌ Failed to send interactive: ${result.error}`);
            return null;
        } catch (error) {
            this.logger.error(`Error sending interactive: ${error.message}`);
            return null;
        }
    }

    /**
     * Send multiple messages in sequence with delays
     */
    async sendBatch(messages: Array<{ type: 'text'; data: SendTextInput } | { type: 'media'; data: SendMediaInput }>): Promise<string[]> {
        const messageIds: string[] = [];

        for (const msg of messages) {
            let messageId: string | null = null;

            if (msg.type === 'text') {
                messageId = await this.sendText(msg.data);
            } else if (msg.type === 'media') {
                messageId = await this.sendMedia(msg.data);
            }

            if (messageId) {
                messageIds.push(messageId);
            }
        }

        return messageIds;
    }

    /**
     * Mark message as read
     */
    async markAsRead(messageId: string): Promise<void> {
        try {
            const provider = this.providerFactory.getProvider();
            await provider.markAsRead({ messageId });
            this.logger.log(`Marked message as read: ${messageId}`);
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
    async markAsReadWithTyping(messageId: string, showTyping: boolean = true): Promise<void> {
        try {
            const provider = this.providerFactory.getProvider() as any;

            // Check if provider supports the new method
            if (typeof provider.markAsReadWithTyping === 'function') {
                await provider.markAsReadWithTyping(messageId, showTyping);
                this.logger.log(`💬 Marked as read${showTyping ? ' with typing indicator' : ''}: ${messageId}`);
            } else {
                // Fallback to regular mark as read
                await provider.markAsRead({ messageId });
                this.logger.log(`Marked message as read (typing not supported): ${messageId}`);
            }
        } catch (error) {
            this.logger.error(`Failed to mark as read with typing: ${error.message}`);
        }
    }

    /**
     * Show typing indicator to user
     * Simulates "bot is typing..." effect
     */
    async showTypingIndicator(to: string): Promise<void> {
        try {
            const provider = this.providerFactory.getProvider();

            // Check if provider has typing indicator support
            if (typeof (provider as any).sendTypingIndicator === 'function') {
                await (provider as any).sendTypingIndicator(to);
                this.logger.debug(`💬 Typing indicator shown to ${to}`);
            }
        } catch (error) {
            this.logger.error(`Failed to show typing indicator: ${error.message}`);
        }
    }

    /**
     * Simulate realistic typing behavior
     * Calculates delay based on message length to feel natural
     * Average typing speed: ~40-60 characters per second
     */
    private async simulateTyping(to: string, message: string): Promise<void> {
        // Calculate realistic typing duration based on message length
        const baseDelay = 500; // Minimum delay (ms)
        const charsPerSecond = 50; // Average typing speed
        const messageLength = message.length;

        // Calculate typing duration: base + (chars / speed) * 1000
        const typingDuration = baseDelay + (messageLength / charsPerSecond) * 1000;

        // Cap at reasonable maximum (5 seconds)
        const cappedDuration = Math.min(typingDuration, 5000);

        // Add slight random variance (±20%) for naturalness
        const variance = cappedDuration * 0.2;
        const finalDelay = cappedDuration + (Math.random() * variance * 2 - variance);

        this.logger.debug(`💬 Simulating typing for ${to} (${Math.round(finalDelay)}ms for ${messageLength} chars)`);

        await this.sleep(finalDelay);
    }

    /**
     * Add human-feel delay (typing simulation)
     */
    private async addHumanDelay(): Promise<void> {
        // Add random variance (±30%)
        const variance = this.humanDelayMs * 0.3;
        const delay = this.humanDelayMs + (Math.random() * variance * 2 - variance);
        await this.sleep(delay);
    }

    /**
     * Exponential backoff for retries
     */
    private async exponentialBackoff(attempt: number): Promise<void> {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s
        this.logger.log(`Waiting ${delay}ms before retry...`);
        await this.sleep(delay);
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<{ healthy: boolean; provider: string; message?: string }> {
        try {
            const provider = this.providerFactory.getProvider();
            const health = provider.healthCheck ? await provider.healthCheck() : { healthy: true };

            return {
                healthy: health.healthy,
                provider: provider.name,
                message: health.message,
            };
        } catch (error) {
            return {
                healthy: false,
                provider: this.providerFactory.getProvider().name,
                message: error.message,
            };
        }
    }
}
