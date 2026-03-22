import { Injectable, Logger } from '@nestjs/common';
import { ConversationContext } from './conversation.service';

/**
 * State Store
 * Manages conversation state and context
 * Can be backed by Redis, Database, or In-Memory
 */
@Injectable()
export class StateStore {
    private readonly logger = new Logger(StateStore.name);
    private readonly store = new Map<string, ConversationContext>();
    private readonly sessionTimeout = 30 * 60 * 1000; // 30 minutes

    /**
     * Get conversation context for a user
     */
    async getContext(userId: string): Promise<ConversationContext> {
        let context = this.store.get(userId);

        if (!context) {
            context = this.createNewContext(userId);
            this.store.set(userId, context);
            this.logger.log(`Created new context for ${userId}`);
        } else {
            // Check if session expired
            const now = new Date();
            const timeSinceLastActivity = now.getTime() - context.lastActivity.getTime();

            if (timeSinceLastActivity > this.sessionTimeout) {
                this.logger.log(`Session expired for ${userId}, creating new context`);
                context = this.createNewContext(userId);
                this.store.set(userId, context);
            }
        }

        return context;
    }

    /**
     * Save conversation context
     */
    async saveContext(context: ConversationContext): Promise<void> {
        context.lastActivity = new Date();
        this.store.set(context.userId, context);
        this.logger.debug(`Saved context for ${context.userId}`);
    }

    /**
     * Clear conversation context
     */
    async clearContext(userId: string): Promise<void> {
        this.store.delete(userId);
        this.logger.log(`Cleared context for ${userId}`);
    }

    /**
     * Create new conversation context
     */
    private createNewContext(userId: string): ConversationContext {
        return {
            userId,
            sessionId: `${userId}-${Date.now()}`,
            state: 'idle',
            data: {},
            lastActivity: new Date(),
        };
    }

    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions(): Promise<number> {
        const now = new Date();
        let cleaned = 0;

        for (const [userId, context] of this.store.entries()) {
            const timeSinceLastActivity = now.getTime() - context.lastActivity.getTime();

            if (timeSinceLastActivity > this.sessionTimeout) {
                this.store.delete(userId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            this.logger.log(`Cleaned up ${cleaned} expired sessions`);
        }

        return cleaned;
    }

    /**
     * Get all active sessions count
     */
    getActiveSessionsCount(): number {
        return this.store.size;
    }
}
