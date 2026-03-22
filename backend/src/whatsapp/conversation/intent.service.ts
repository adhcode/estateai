import { Injectable, Logger } from '@nestjs/common';

/**
 * Intent Service - Dialogflow Integration
 * Handles natural language understanding and intent detection
 */

export interface DetectedIntent {
    name: string;
    displayName: string;
    confidence: number;
    parameters: Record<string, any>;
    fulfillmentText?: string;
    isFallback: boolean;
}

export interface IntentDetectionInput {
    text: string;
    sessionId: string;
    languageCode?: string;
}

@Injectable()
export class IntentService {
    private readonly logger = new Logger(IntentService.name);
    private dialogflowClient: any;
    private readonly projectId: string;
    private enabled: boolean;

    constructor() {
        this.projectId = process.env.DIALOGFLOW_PROJECT_ID || '';
        this.enabled = !!this.projectId && !!process.env.DIALOGFLOW_CREDENTIALS;

        if (this.enabled) {
            this.initializeDialogflow();
        } else {
            this.logger.warn('Dialogflow not configured, using fallback pattern matching');
        }
    }

    private initializeDialogflow(): void {
        try {
            // Initialize Dialogflow client
            const dialogflow = require('@google-cloud/dialogflow');

            // Parse credentials from env
            const credentials = JSON.parse(process.env.DIALOGFLOW_CREDENTIALS || '{}');

            this.dialogflowClient = new dialogflow.SessionsClient({
                credentials,
            });

            this.logger.log('Dialogflow initialized successfully');
        } catch (error) {
            this.logger.error(`Failed to initialize Dialogflow: ${error.message}`);
            this.enabled = false;
        }
    }

    /**
     * Detect intent from user message using Dialogflow
     */
    async detectIntent(input: IntentDetectionInput): Promise<DetectedIntent> {
        if (!this.enabled || !this.dialogflowClient) {
            return this.fallbackIntentDetection(input.text);
        }

        try {
            const sessionPath = this.dialogflowClient.projectAgentSessionPath(
                this.projectId,
                input.sessionId,
            );

            const request = {
                session: sessionPath,
                queryInput: {
                    text: {
                        text: input.text,
                        languageCode: input.languageCode || 'en',
                    },
                },
            };

            this.logger.log(`Detecting intent for: "${input.text}"`);

            const [response] = await this.dialogflowClient.detectIntent(request);
            const result = response.queryResult;

            this.logger.log(`Intent detected: ${result.intent?.displayName} (${result.intentDetectionConfidence})`);

            return {
                name: result.intent?.name || 'unknown',
                displayName: result.intent?.displayName || 'Unknown',
                confidence: result.intentDetectionConfidence || 0,
                parameters: result.parameters?.fields || {},
                fulfillmentText: result.fulfillmentText,
                isFallback: result.intent?.isFallback || false,
            };
        } catch (error) {
            this.logger.error(`Dialogflow error: ${error.message}`);
            return this.fallbackIntentDetection(input.text);
        }
    }

    /**
     * Fallback pattern-based intent detection
     * Used when Dialogflow is not available
     */
    private fallbackIntentDetection(text: string): DetectedIntent {
        const lowerText = text.toLowerCase().trim();

        // Greeting
        if (/^(hi|hello|hey|good morning|good afternoon|good evening|greetings|howdy|how far|hafa|)[\s!.]*$/i.test(lowerText)) {
            return {
                name: 'greeting',
                displayName: 'Greeting',
                confidence: 0.95,
                parameters: {},
                isFallback: false,
            };
        }

        // Manage household - menu intent
        if (/manage|household|family/i.test(lowerText) && !/add|remove|list|show|delete/i.test(lowerText)) {
            return {
                name: 'manage_household',
                displayName: 'Manage Household',
                confidence: 0.9,
                parameters: {},
                isFallback: false,
            };
        }

        // Manage visitors - menu intent
        if (/manage|visitor/i.test(lowerText) && /visitor|access|code/i.test(lowerText) && !/generate|create|add|list|cancel|verify/i.test(lowerText)) {
            return {
                name: 'manage_visitors',
                displayName: 'Manage Visitors',
                confidence: 0.9,
                parameters: {},
                isFallback: false,
            };
        }

        // Add household member
        if (/add|register|create/i.test(lowerText) && /household|family\s+member/i.test(lowerText)) {
            // Extract name if provided: "Add John to household"
            const nameMatch = text.match(/(?:add|register)\s+([a-zA-Z][a-zA-Z\s]{1,50}?)\s+(?:to|as)/i);
            let memberName: string | undefined = undefined;
            if (nameMatch) {
                const name = nameMatch[1].trim();
                if (/^[a-zA-Z\s]+$/.test(name) && name.length >= 2 && name.length <= 50) {
                    memberName = name;
                }
            }

            return {
                name: 'add_household_member',
                displayName: 'Add Household Member',
                confidence: 0.9,
                parameters: {
                    memberName: memberName,
                },
                isFallback: false,
            };
        }

        // List household members
        if (/list|show|view|see/i.test(lowerText) && /household|family\s+member/i.test(lowerText)) {
            return {
                name: 'list_household_members',
                displayName: 'List Household Members',
                confidence: 0.9,
                parameters: {},
                isFallback: false,
            };
        }

        // Remove household member
        if (/remove|delete/i.test(lowerText) && /household|family\s+member/i.test(lowerText)) {
            // Extract name if provided
            const nameMatch = text.match(/(?:remove|delete)\s+([a-zA-Z][a-zA-Z\s]{1,50}?)(?:\s+from|\s*$)/i);
            let memberName: string | undefined = undefined;
            if (nameMatch) {
                const name = nameMatch[1].trim();
                if (/^[a-zA-Z\s]+$/.test(name) && name.length >= 2 && name.length <= 50) {
                    memberName = name;
                }
            }

            return {
                name: 'remove_household_member',
                displayName: 'Remove Household Member',
                confidence: 0.9,
                parameters: {
                    memberName: memberName,
                },
                isFallback: false,
            };
        }

        // Edit household member
        if (/edit|update|change/i.test(lowerText) && /household|family\s+member|phone|number/i.test(lowerText)) {
            const nameMatch = text.match(/(?:edit|update|change)\s+([a-zA-Z][a-zA-Z\s]{1,50}?)(?:'s|\s+phone|\s+number|\s*$)/i);
            let memberName: string | undefined = undefined;
            if (nameMatch) {
                const name = nameMatch[1].trim();
                if (/^[a-zA-Z\s]+$/.test(name) && name.length >= 2 && name.length <= 50) {
                    memberName = name;
                }
            }

            return {
                name: 'edit_household_member',
                displayName: 'Edit Household Member',
                confidence: 0.9,
                parameters: {
                    memberName: memberName,
                },
                isFallback: false,
            };
        }

        // Visitor at gate - CHECK THIS FIRST before generate code patterns
        if (/at\s+(?:the\s+)?gate|is\s+here|has\s+arrived|arrived/i.test(lowerText)) {
            // Extract visitor name - pattern: "[Name] is at the gate"
            const nameMatch = text.match(/^([a-zA-Z][a-zA-Z\s]{1,50}?)\s+(?:is\s+)?(?:at\s+(?:the\s+)?gate|is\s+here|has\s+arrived|arrived)/i);

            let visitorName: string | undefined = undefined;
            if (nameMatch) {
                const name = nameMatch[1].trim();
                // Make sure it's a valid name (not common words)
                if (/^[a-zA-Z\s]+$/.test(name) &&
                    name.length >= 2 &&
                    name.length <= 50 &&
                    !/(visitor|guest|someone|person|code)/i.test(name)) {
                    visitorName = name;
                }
            }

            return {
                name: 'visitor_at_gate',
                displayName: 'Visitor At Gate',
                confidence: 0.9,
                parameters: {
                    visitorName: visitorName,
                },
                isFallback: false,
            };
        }

        // Generate visitor code - improved patterns
        if (
            /generate|create|make|get|need|want/i.test(lowerText) &&
            /code|pass|access|entry/i.test(lowerText)
        ) {
            // Extract visitor name - only from explicit patterns
            // Match "for [name]" or "code for [name]" but NOT "visitor code" or "a visitor"
            let visitorName: string | undefined = undefined;

            // Pattern 1: "for [name]" or "code for [name]"
            const forMatch = text.match(/(?:code\s+)?for\s+([a-zA-Z][a-zA-Z\s]{1,50})(?:\s|$)/i);
            if (forMatch) {
                const name = forMatch[1].trim();
                // Exclude common false positives
                if (!/(visitor|guest|code|access|entry|pass)/i.test(name)) {
                    visitorName = name;
                }
            }

            // Pattern 2: "[name] is coming/visiting"
            if (!visitorName) {
                const comingMatch = text.match(/^(.+?)\s+(?:is\s+)?(?:coming|visiting|will\s+visit)/i);
                if (comingMatch) {
                    const name = comingMatch[1].trim();
                    // Make sure it's a valid name (letters and spaces only)
                    if (/^[a-zA-Z\s]+$/.test(name) && name.length >= 2 && name.length <= 50) {
                        visitorName = name;
                    }
                }
            }

            return {
                name: 'generate_visitor_code',
                displayName: 'Generate Visitor Code',
                confidence: 0.85,
                parameters: {
                    visitorName: visitorName,
                },
                isFallback: false,
            };
        }

        // Alternative generate code patterns (without "code" keyword)
        // NOTE: "at the gate" removed from here since it's handled above
        if (
            /([a-zA-Z\s]+)\s+(?:is coming|coming to visit|visiting|will visit)/i.test(lowerText) ||
            /(?:visitor|guest)\s+([a-zA-Z][a-zA-Z\s]{2,50})\s+(?:is|will|coming)/i.test(lowerText)
        ) {
            const nameMatch =
                text.match(/^(.+?)\s+(?:is\s+)?(?:coming|visiting|will\s+visit|coming\s+to\s+visit)/i) ||
                text.match(/(?:visitor|guest)\s+([a-zA-Z][a-zA-Z\s]{2,50})\s+(?:is|will|coming)/i);

            let visitorName: string | undefined = undefined;
            if (nameMatch) {
                const name = nameMatch[1].trim();
                // Make sure it's a valid name
                if (/^[a-zA-Z\s]+$/.test(name) && name.length >= 2 && name.length <= 50) {
                    visitorName = name;
                }
            }

            return {
                name: 'generate_visitor_code',
                displayName: 'Generate Visitor Code',
                confidence: 0.8,
                parameters: {
                    visitorName: visitorName,
                },
                isFallback: false,
            };
        }

        // Verify code
        if (
            /check|verify|validate|confirm|is.*valid/i.test(lowerText) &&
            /code|pass/i.test(lowerText)
        ) {
            const codeMatch = text.match(/\b([A-Z0-9]{6,8})\b/i);
            return {
                name: 'verify_visitor_code',
                displayName: 'Verify Visitor Code',
                confidence: 0.85,
                parameters: {
                    code: codeMatch ? codeMatch[1].toUpperCase() : undefined,
                },
                isFallback: false,
            };
        }

        // List visitors
        if (
            /list|show|view|see|display/i.test(lowerText) &&
            /visitor|guest|code/i.test(lowerText)
        ) {
            return {
                name: 'list_visitors',
                displayName: 'List Visitors',
                confidence: 0.85,
                parameters: {},
                isFallback: false,
            };
        }

        // Cancel code - support both code and visitor name
        if (
            /cancel|revoke|delete|remove|invalidate/i.test(lowerText) &&
            /code|pass|visitor/i.test(lowerText)
        ) {
            // Extract code - but exclude common words that look like codes
            const commonWords = /^(cancel|revoke|delete|remove|code|pass|visitor|guest|access|entry)$/i;
            const potentialCodeMatch = text.match(/\b([A-Z0-9]{6,8})\b/i);
            const codeMatch = potentialCodeMatch && !commonWords.test(potentialCodeMatch[1])
                ? potentialCodeMatch
                : null;

            // Try to extract visitor name if no valid code found
            let visitorName: string | undefined = undefined;
            if (!codeMatch) {
                // Pattern 1: "cancel [name]" - simple form
                const simpleMatch = text.match(/(?:cancel|revoke|delete|remove)\s+([a-zA-Z][a-zA-Z\s]{1,50})$/i);
                if (simpleMatch) {
                    const name = simpleMatch[1].trim();
                    // Exclude common words
                    if (!/(code|pass|visitor|guest|access|entry)/i.test(name)) {
                        visitorName = name;
                    }
                }

                // Pattern 2: "cancel code for [name]"
                if (!visitorName) {
                    const forMatch = text.match(/(?:cancel|revoke|delete|remove)\s+(?:code|pass)\s+(?:for\s+)?([a-zA-Z][a-zA-Z\s]{1,50})$/i);
                    if (forMatch) {
                        const name = forMatch[1].trim();
                        if (!/(code|pass|visitor|guest|access|entry)/i.test(name)) {
                            visitorName = name;
                        }
                    }
                }
            }

            return {
                name: 'cancel_visitor_code',
                displayName: 'Cancel Visitor Code',
                confidence: 0.85,
                parameters: {
                    code: codeMatch ? codeMatch[1].toUpperCase() : undefined,
                    visitorName: visitorName,
                },
                isFallback: false,
            };
        }

        // Visitor departure - improved patterns
        if (/leav|left|depart|gone|check.*out|going/i.test(lowerText)) {
            const codeMatch = text.match(/\b([A-Z0-9]{6,8})\b/i);
            // Match patterns like "Aleem is leaving", "John left", "Sarah has departed"
            const nameMatch = text.match(/([a-zA-Z\s]+?)\s+(?:is leaving|is going|has left|left|departed|gone|checked out)/i) ||
                text.match(/^([a-zA-Z\s]+?)\s+(?:leaving|going)/i);

            return {
                name: 'visitor_departure',
                displayName: 'Visitor Departure',
                confidence: 0.8,
                parameters: {
                    code: codeMatch ? codeMatch[1].toUpperCase() : undefined,
                    visitorName: nameMatch ? nameMatch[1].trim() : undefined,
                },
                isFallback: false,
            };
        }

        // Help
        if (/help|what can|how do|commands|options/i.test(lowerText)) {
            return {
                name: 'help',
                displayName: 'Help',
                confidence: 0.9,
                parameters: {},
                isFallback: false,
            };
        }

        // Unknown/Fallback
        return {
            name: 'fallback',
            displayName: 'Fallback',
            confidence: 0,
            parameters: {},
            fulfillmentText: "I didn't quite understand that. Try 'help' to see what I can do!",
            isFallback: true,
        };
    }

    /**
     * Check if Dialogflow is enabled and healthy
     */
    async healthCheck(): Promise<{ enabled: boolean; healthy: boolean; message?: string }> {
        if (!this.enabled) {
            return {
                enabled: false,
                healthy: false,
                message: 'Dialogflow not configured',
            };
        }

        try {
            // Try a simple intent detection
            const testResult = await this.detectIntent({
                text: 'hello',
                sessionId: 'health-check',
            });

            return {
                enabled: true,
                healthy: testResult.confidence > 0,
                message: 'Dialogflow operational',
            };
        } catch (error) {
            return {
                enabled: true,
                healthy: false,
                message: error.message,
            };
        }
    }
}
