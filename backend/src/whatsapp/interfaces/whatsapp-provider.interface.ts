/**
 * Provider-agnostic WhatsApp interface
 * Supports Meta Cloud API, BSPs (360dialog, Sendchamp), and future providers
 */

export interface InboundMessage {
    messageId: string;
    from: string; // Phone number
    to: string; // Your WhatsApp number
    timestamp: Date;
    type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'interactive' | 'button' | 'unknown';
    text?: string;
    media?: {
        id?: string;
        url?: string;
        mimeType?: string;
        caption?: string;
    };
    interactive?: {
        type: 'button_reply' | 'list_reply';
        buttonReply?: { id: string; title: string };
        listReply?: { id: string; title: string; description?: string };
    };
    context?: {
        messageId: string; // ID of message being replied to
    };
}

export interface SendTextInput {
    to: string;
    body: string;
    previewUrl?: boolean;
}

export interface SendTextResult {
    providerMessageId: string;
    success: boolean;
    error?: string;
}

export interface SendMediaInput {
    to: string;
    type: 'image' | 'audio' | 'video' | 'document';
    url?: string;
    id?: string; // Media ID from provider
    caption?: string;
    filename?: string; // For documents
}

export interface SendTemplateInput {
    to: string;
    name: string; // Template name
    language: string; // e.g., 'en', 'en_US'
    components?: TemplateComponent[];
}

export interface TemplateComponent {
    type: 'header' | 'body' | 'button';
    parameters?: TemplateParameter[];
    sub_type?: 'quick_reply' | 'url'; // For buttons
    index?: number; // Button index
}

export interface TemplateParameter {
    type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
    text?: string;
    currency?: { fallback_value: string; code: string; amount_1000: number };
    date_time?: { fallback_value: string };
    image?: { link: string };
    document?: { link: string; filename?: string };
    video?: { link: string };
}

export interface SendInteractiveInput {
    to: string;
    type: 'button' | 'list';
    header?: {
        type: 'text' | 'image' | 'video' | 'document';
        text?: string;
        image?: { link: string };
        video?: { link: string };
        document?: { link: string; filename?: string };
    };
    body: string;
    footer?: string;
    action: InteractiveAction;
}

export interface InteractiveAction {
    buttons?: Array<{ id: string; title: string }>; // Max 3 buttons
    button?: string; // Button text for list
    sections?: Array<{
        title?: string;
        rows: Array<{ id: string; title: string; description?: string }>;
    }>;
}

export interface MarkAsReadInput {
    messageId: string;
}

export interface WebhookVerification {
    mode: string;
    token: string;
    challenge: string;
}

/**
 * Main WhatsApp Provider Interface
 * All providers must implement this
 */
export interface WhatsAppProvider {
    readonly name: string;

    // Outbound messaging
    sendText(input: SendTextInput): Promise<SendTextResult>;
    sendMedia(input: SendMediaInput): Promise<SendTextResult>;
    sendTemplate(input: SendTemplateInput): Promise<SendTextResult>;
    sendInteractive?(input: SendInteractiveInput): Promise<SendTextResult>;

    // Message management
    markAsRead(input: MarkAsReadInput): Promise<void>;

    // Inbound processing
    verifyWebhook?(verification: WebhookVerification): boolean | string;
    parseInbound(payload: any): InboundMessage[];

    // Health check
    healthCheck?(): Promise<{ healthy: boolean; message?: string }>;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
    provider: 'meta' | 'sendchamp' | '360dialog' | 'twilio';
    credentials: Record<string, string>;
}
