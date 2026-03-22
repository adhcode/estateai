import { Injectable, Logger } from '@nestjs/common';
import { EstateWhatsAppService } from '../domain/estate-whatsapp.service';
import { InboundMessage } from '../interfaces/whatsapp-provider.interface';
import { MessengerService } from '../outbound/messenger.service';
import { DetectedIntent, IntentService } from './intent.service';
import { StateStore } from './state.store';

/**
 * Conversation Engine
 * Manages conversation state, routes intents, and orchestrates responses
 */

export interface ConversationContext {
    userId: string; // Phone number
    sessionId: string;
    state: string;
    data: Record<string, any>;
    lastActivity: Date;
}

export interface OutgoingMessage {
    kind: 'text' | 'media' | 'interactive' | 'template';
    to: string;
    body?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'audio' | 'video' | 'document';
    interactive?: any;
    template?: any;
}

@Injectable()
export class ConversationService {
    private readonly logger = new Logger(ConversationService.name);

    constructor(
        private readonly intentService: IntentService,
        private readonly stateStore: StateStore,
        private readonly estateWhatsAppService: EstateWhatsAppService,
        private readonly messengerService: MessengerService,
    ) { }

    /**
     * Handle incoming message
     * Main entry point for conversation processing
     */
    async handleIncoming(message: InboundMessage): Promise<OutgoingMessage[]> {
        try {
            this.logger.log(`Processing message from ${message.from}: ${message.text}`);

            // Get or create conversation context
            const context = await this.stateStore.getContext(message.from);
            this.logger.log(`Current context state: ${context.state}`);

            // Check if we're waiting for visitor name
            if (context.state === 'AWAITING_VISITOR_NAME') {
                this.logger.log(`User is in AWAITING_VISITOR_NAME state, treating message as visitor name`);
                const visitorName = message.text?.trim();

                if (visitorName && visitorName.length > 0) {
                    this.logger.log(`Visitor name received: "${visitorName}"`);
                    // Clear the state
                    context.state = 'idle';
                    await this.stateStore.saveContext(context);
                    this.logger.log(`State cleared, generating code for visitor: ${visitorName}`);

                    // Generate code with the provided name
                    return await this.handleGenerateCodeWithName(visitorName, message.from);
                } else {
                    // Invalid name, ask again
                    return [{
                        kind: 'text',
                        to: message.from,
                        body: 'Please provide a valid visitor name.',
                    }];
                }
            }

            // Check if we're waiting for household member name
            if (context.state === 'AWAITING_HOUSEHOLD_NAME') {
                this.logger.log(`User is in AWAITING_HOUSEHOLD_NAME state, treating message as member name`);
                const memberName = message.text?.trim();

                if (memberName && memberName.length > 0) {
                    this.logger.log(`Household member name received: "${memberName}"`);
                    // Store name and move to next state
                    context.data.pendingHouseholdMember = { name: memberName };
                    context.state = 'AWAITING_HOUSEHOLD_PHONE';
                    await this.stateStore.saveContext(context);

                    return [{
                        kind: 'text',
                        to: message.from,
                        body: `What's ${memberName}'s WhatsApp phone number?\n\nExample: +1234567890`,
                    }];
                } else {
                    return [{
                        kind: 'text',
                        to: message.from,
                        body: 'Please provide a valid name.',
                    }];
                }
            }

            // Check if we're waiting for household member phone
            if (context.state === 'AWAITING_HOUSEHOLD_PHONE') {
                this.logger.log(`User is in AWAITING_HOUSEHOLD_PHONE state, treating message as phone number`);
                const memberPhone = message.text?.trim();

                if (memberPhone && memberPhone.length > 0) {
                    this.logger.log(`Household member phone received: "${memberPhone}"`);
                    const memberName = context.data.pendingHouseholdMember?.name;

                    // Store phone and move to confirmation state
                    context.data.pendingHouseholdMember.phone = memberPhone;
                    context.state = 'AWAITING_HOUSEHOLD_CONFIRMATION';
                    await this.stateStore.saveContext(context);

                    // Ask for confirmation
                    return [{
                        kind: 'interactive',
                        to: message.from,
                        interactive: {
                            type: 'button',
                            body: {
                                text: `Please confirm:\n\nName: ${memberName}\nPhone: ${memberPhone}\n\nIs this correct?`,
                            },
                            action: {
                                buttons: [
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: 'confirm_household',
                                            title: 'Yes, Save',
                                        },
                                    },
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: 'edit_household_phone',
                                            title: 'Edit Phone',
                                        },
                                    },
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: 'cancel_household',
                                            title: 'Cancel',
                                        },
                                    },
                                ],
                            },
                        },
                    }];
                } else {
                    return [{
                        kind: 'text',
                        to: message.from,
                        body: 'Please provide a valid phone number.',
                    }];
                }
            }

            // Check if we're waiting for household member phone edit
            if (context.state === 'AWAITING_HOUSEHOLD_PHONE_EDIT') {
                this.logger.log(`User is editing household member phone`);
                const memberPhone = message.text?.trim();

                if (memberPhone && memberPhone.length > 0) {
                    this.logger.log(`New household member phone received: "${memberPhone}"`);
                    const memberName = context.data.pendingHouseholdMember?.name;

                    // Update phone and move back to confirmation state
                    context.data.pendingHouseholdMember.phone = memberPhone;
                    context.state = 'AWAITING_HOUSEHOLD_CONFIRMATION';
                    await this.stateStore.saveContext(context);

                    // Ask for confirmation again
                    return [{
                        kind: 'interactive',
                        to: message.from,
                        interactive: {
                            type: 'button',
                            body: {
                                text: `Please confirm:\n\nName: ${memberName}\nPhone: ${memberPhone}\n\nIs this correct?`,
                            },
                            action: {
                                buttons: [
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: 'confirm_household',
                                            title: 'Yes, Save',
                                        },
                                    },
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: 'edit_household_phone',
                                            title: 'Edit Phone',
                                        },
                                    },
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: 'cancel_household',
                                            title: 'Cancel',
                                        },
                                    },
                                ],
                            },
                        },
                    }];
                } else {
                    return [{
                        kind: 'text',
                        to: message.from,
                        body: 'Please provide a valid phone number.',
                    }];
                }
            }

            // Check if we're waiting for new phone number for existing member edit
            if (context.state === 'AWAITING_EDIT_MEMBER_PHONE') {
                this.logger.log(`User is providing new phone for existing household member`);
                const newPhone = message.text?.trim();

                if (newPhone && newPhone.length > 0) {
                    this.logger.log(`New phone received: "${newPhone}"`);
                    const memberName = context.data.editingMember?.name;

                    // Store new phone and move to confirmation
                    context.data.editingMember.newPhone = newPhone;
                    context.state = 'AWAITING_EDIT_CONFIRMATION';
                    await this.stateStore.saveContext(context);

                    // Ask for confirmation
                    return [{
                        kind: 'interactive',
                        to: message.from,
                        interactive: {
                            type: 'button',
                            body: {
                                text: `Update ${memberName}'s phone number to:\n\n${newPhone}\n\nIs this correct?`,
                            },
                            action: {
                                buttons: [
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: 'confirm_edit_member',
                                            title: 'Yes, Update',
                                        },
                                    },
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: 'retry_edit_phone',
                                            title: 'Re-enter Phone',
                                        },
                                    },
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: 'cancel_edit',
                                            title: 'Cancel',
                                        },
                                    },
                                ],
                            },
                        },
                    }];
                } else {
                    return [{
                        kind: 'text',
                        to: message.from,
                        body: 'Please provide a valid phone number.',
                    }];
                }
            }

            // Check if we're waiting for code/name to cancel
            if (context.state === 'AWAITING_CANCEL_INFO') {
                this.logger.log(`User is in AWAITING_CANCEL_INFO state, treating message as code or name`);
                const input = message.text?.trim();

                if (input && input.length > 0) {
                    this.logger.log(`Cancel info received: "${input}"`);
                    // Clear the state
                    context.state = 'idle';
                    await this.stateStore.saveContext(context);

                    // Try to determine if it's a code (alphanumeric, 6-8 chars) or a name
                    const isCode = /^[A-Z0-9]{6,8}$/i.test(input);

                    return await this.handleCancelWithInfo(
                        isCode ? input.toUpperCase() : undefined,
                        isCode ? undefined : input,
                        message.from
                    );
                } else {
                    return [{
                        kind: 'text',
                        to: message.from,
                        body: 'Please provide a visitor code or name to cancel.',
                    }];
                }
            }

            // Check if this is an interactive button response
            let messageText = message.text || '';
            if (message.interactive?.buttonReply) {
                // Map button ID to command
                const buttonId = message.interactive.buttonReply.id;

                // Handle special cancel last visitor button
                if (buttonId.startsWith('cancel_last_visitor_')) {
                    const code = buttonId.replace('cancel_last_visitor_', '');
                    this.logger.log(`Quick cancel for last visitor with code: ${code}`);

                    // Clear any pending state
                    context.state = 'idle';
                    await this.stateStore.saveContext(context);

                    const responses = await this.handleCancelWithInfo(code, undefined, message.from);
                    return responses;
                }

                // Handle cancel other visitor button - show all active visitors
                if (buttonId === 'cancel_other_visitor') {
                    this.logger.log(`User wants to cancel a different visitor - showing all active visitors`);

                    // Show typing indicator
                    await this.showTypingIndicator(message.from);

                    // Get all active visitors
                    const visitorList = await this.estateWhatsAppService.listVisitorCodes(message.from);

                    if (visitorList.success && visitorList.visitors && visitorList.visitors.length > 0) {
                        // WhatsApp allows max 3 buttons, so show 2 visitors + back button
                        const visitorsToShow = visitorList.visitors.slice(0, 2);
                        const buttons = visitorsToShow.map(visitor => ({
                            type: 'reply' as const,
                            reply: {
                                id: `cancel_visitor_${visitor.code}`,
                                title: visitor.visitorName.length > 20
                                    ? visitor.visitorName.substring(0, 17) + '...'
                                    : visitor.visitorName,
                            },
                        }));

                        // Add back button
                        buttons.push({
                            type: 'reply' as const,
                            reply: {
                                id: 'help',
                                title: 'Back',
                            },
                        });

                        const visitorListText = visitorList.visitors.map((v, i) =>
                            `${i + 1}. *${v.visitorName}* (Code: ${v.code})`
                        ).join('\n');

                        return [{
                            kind: 'interactive',
                            to: message.from,
                            interactive: {
                                type: 'button',
                                body: {
                                    text: `Select a visitor to cancel:\n\n${visitorListText}\n\n${visitorList.visitors.length > 2 ? `\n💡 Showing first 2 of ${visitorList.visitors.length} visitors. Type visitor name or code to cancel others.` : ''}`,
                                },
                                action: {
                                    buttons: buttons,
                                },
                            },
                        }];
                    } else {
                        return [{
                            kind: 'text',
                            to: message.from,
                            body: `You don't have any other active visitor codes.`,
                        }];
                    }
                }

                // Handle cancel visitor button (from list of all visitors)
                if (buttonId.startsWith('cancel_visitor_')) {
                    const code = buttonId.replace('cancel_visitor_', '');
                    this.logger.log(`Cancelling visitor with code: ${code}`);

                    // Show typing indicator
                    await this.showTypingIndicator(message.from);

                    // Clear any pending state
                    context.state = 'idle';
                    await this.stateStore.saveContext(context);

                    const responses = await this.handleCancelWithInfo(code, undefined, message.from);
                    return responses;
                }

                // Handle household member confirmation
                if (buttonId === 'confirm_household') {
                    this.logger.log(`User confirmed household member details`);
                    const memberName = context.data.pendingHouseholdMember?.name;
                    const memberPhone = context.data.pendingHouseholdMember?.phone;

                    // Clear the state
                    context.state = 'idle';
                    delete context.data.pendingHouseholdMember;
                    await this.stateStore.saveContext(context);

                    // Add the household member
                    return await this.completeAddHouseholdMember(memberName, memberPhone, message.from);
                }

                // Handle edit household phone
                if (buttonId === 'edit_household_phone') {
                    this.logger.log(`User wants to edit household member phone`);
                    await this.updateState(message.from, 'AWAITING_HOUSEHOLD_PHONE_EDIT');
                    return [{
                        kind: 'text',
                        to: message.from,
                        body: `Please enter the correct phone number:`,
                    }];
                }

                // Handle cancel household member addition
                if (buttonId === 'cancel_household') {
                    this.logger.log(`User cancelled household member addition`);
                    context.state = 'idle';
                    delete context.data.pendingHouseholdMember;
                    await this.stateStore.saveContext(context);
                    return [{
                        kind: 'text',
                        to: message.from,
                        body: `Household member addition cancelled.`,
                    }];
                }

                // Handle confirm edit member
                if (buttonId === 'confirm_edit_member') {
                    this.logger.log(`User confirmed member phone edit`);
                    const memberName = context.data.editingMember?.name;
                    const newPhone = context.data.editingMember?.newPhone;

                    // Clear the state
                    context.state = 'idle';
                    const editData = context.data.editingMember;
                    delete context.data.editingMember;
                    await this.stateStore.saveContext(context);

                    // Update the member
                    return await this.completeEditHouseholdMember(memberName, newPhone, message.from);
                }

                // Handle retry edit phone
                if (buttonId === 'retry_edit_phone') {
                    this.logger.log(`User wants to re-enter phone for edit`);
                    await this.updateState(message.from, 'AWAITING_EDIT_MEMBER_PHONE');
                    return [{
                        kind: 'text',
                        to: message.from,
                        body: `Please enter the correct phone number:`,
                    }];
                }

                // Handle cancel edit
                if (buttonId === 'cancel_edit') {
                    this.logger.log(`User cancelled member edit`);
                    context.state = 'idle';
                    delete context.data.editingMember;
                    await this.stateStore.saveContext(context);
                    return [{
                        kind: 'text',
                        to: message.from,
                        body: `Edit cancelled.`,
                    }];
                }

                // Handle edit member button (from list)
                if (buttonId.startsWith('edit_member_')) {
                    const memberName = buttonId.replace('edit_member_', '').replace(/_/g, ' ');
                    this.logger.log(`User wants to edit member: ${memberName}`);

                    context.data.editingMember = { name: memberName };
                    context.state = 'AWAITING_EDIT_MEMBER_PHONE';
                    await this.stateStore.saveContext(context);

                    return [{
                        kind: 'text',
                        to: message.from,
                        body: `What's the new phone number for ${memberName}?`,
                    }];
                }

                // Handle show edit member options button
                if (buttonId === 'show_edit_member_options') {
                    this.logger.log(`User wants to see edit member options`);
                    return await this.showEditMemberOptions(message.from);
                }

                messageText = this.mapButtonToCommand(buttonId);
                this.logger.log(`Button clicked: ${buttonId} → "${messageText}"`);
            }

            // Detect intent
            const intent = await this.intentService.detectIntent({
                text: messageText,
                sessionId: context.sessionId,
            });

            this.logger.log(`Intent: ${intent.displayName} (${intent.confidence}), Parameters: ${JSON.stringify(intent.parameters)}`);

            // Update context with intent
            context.data.lastIntent = intent.displayName;
            context.data.lastIntentParams = intent.parameters;
            context.lastActivity = new Date();

            // Route to appropriate handler based on intent
            const responses = await this.routeIntent(intent, context, message);

            // Save updated context
            await this.stateStore.saveContext(context);

            return responses;
        } catch (error) {
            this.logger.error(`Error handling message: ${error.message}`);

            // Check if error is due to occupant not found
            if (error.message && error.message.includes('Occupant not found')) {
                return [
                    {
                        kind: 'text',
                        to: message.from,
                        body: `Hello! 👋\n\nIt looks like your phone number isn't registered in our system yet.\n\nTo get started with visitor management, please contact your facility manager or estate administrator to add your details to the system.\n\nThey'll need to:\n• Register you as a resident\n• Link your phone number to your unit\n• Activate your account\n\nOnce registered, you'll be able to:\n✓ Generate visitor codes\n✓ Manage your visitors\n✓ Track visitor arrivals\n\nThank you!`,
                    },
                ];
            }

            return [
                {
                    kind: 'text',
                    to: message.from,
                    body: 'Sorry, I encountered an error. Please try again.',
                },
            ];
        }
    }

    /**
     * Map button ID to command text
     */
    private mapButtonToCommand(buttonId: string): string {
        const buttonMap: Record<string, string> = {
            'generate_code': 'I want to generate a visitor code',
            'list_visitors': 'list my visitors',
            'help': 'help',
            'verify_code': 'verify code',
            'cancel_code': 'cancel code',
            'add_household': 'add household member',
            'list_household': 'list household members',
            'remove_household': 'remove household member',
            'manage_household': 'manage household',
            'manage_visitors': 'manage visitors',
        };

        return buttonMap[buttonId] || buttonId;
    }

    /**
     * Route intent to appropriate handler
     */
    private async routeIntent(
        intent: DetectedIntent,
        context: ConversationContext,
        message: InboundMessage,
    ): Promise<OutgoingMessage[]> {
        const responses: OutgoingMessage[] = [];

        switch (intent.displayName.toLowerCase()) {
            case 'greeting':
                this.getGreetingWithButtons(message.from, responses);
                break;

            case 'help':
                this.getHelpWithButtons(message.from, responses);
                break;

            case 'manage household':
                this.getHouseholdMenuWithButtons(message.from, responses);
                break;

            case 'manage visitors':
                this.getVisitorsMenuWithButtons(message.from, responses);
                break;

            case 'generate visitor code':
                await this.handleGenerateCode(intent, message.from, responses);
                break;

            case 'verify visitor code':
                this.getVerifyCodeWithButtons(intent, message.from, responses);
                break;

            case 'list visitors':
                await this.getListVisitorsWithButtons(message.from, responses);
                break;

            case 'cancel visitor code':
                await this.getCancelCodeWithButtons(intent, message.from, responses);
                break;

            case 'visitor departure':
                await this.handleVisitorDeparture(intent, message.from, responses);
                break;

            case 'visitor at gate':
                await this.handleVisitorAtGate(intent, message.from, responses);
                break;

            case 'add household member':
                await this.handleAddHouseholdMember(intent, message.from, responses);
                break;

            case 'list household members':
                await this.handleListHouseholdMembers(message.from, responses);
                break;

            case 'remove household member':
                await this.handleRemoveHouseholdMember(intent, message.from, responses);
                break;

            case 'edit household member':
                await this.handleEditHouseholdMember(intent, message.from, responses);
                break;

            case 'fallback':
                this.getFallbackWithButtons(message.from, responses);
                break;

            default:
                this.getFallbackWithButtons(message.from, responses);
        }

        return responses;
    }

    /**
     * Handle generate visitor code intent
     * Integrates with domain service for actual code generation
     */
    private async handleGenerateCode(
        intent: DetectedIntent,
        phoneNumber: string,
        responses: OutgoingMessage[],
    ): Promise<void> {
        let visitorName = intent.parameters?.visitorName;

        // Check if there's a visitor at gate in context
        if (!visitorName) {
            const context = await this.stateStore.getContext(phoneNumber);
            if (context.data.visitorAtGate?.name) {
                visitorName = context.data.visitorAtGate.name;
                this.logger.log(`Using visitor from context: ${visitorName}`);

                // Clear the visitor at gate data after using it
                delete context.data.visitorAtGate;
                await this.stateStore.saveContext(context);
            }
        }

        if (!visitorName) {
            // Show typing indicator before asking for name
            await this.showTypingIndicator(phoneNumber);

            // Set state to await visitor name
            await this.updateState(phoneNumber, 'AWAITING_VISITOR_NAME');

            // Ask for visitor name
            responses.push({
                kind: 'text',
                to: phoneNumber,
                body: `Please provide the visitor's name:`,
            });
            return;
        }

        // Name provided, generate code
        await this.generateCodeForVisitor(visitorName, phoneNumber, responses);
    }

    /**
     * Handle generate code when name is provided directly
     */
    private async handleGenerateCodeWithName(
        visitorName: string,
        phoneNumber: string,
    ): Promise<OutgoingMessage[]> {
        const responses: OutgoingMessage[] = [];
        await this.generateCodeForVisitor(visitorName, phoneNumber, responses);
        return responses;
    }

    /**
     * Generate code for visitor (shared logic)
     */
    private async generateCodeForVisitor(
        visitorName: string,
        phoneNumber: string,
        responses: OutgoingMessage[],
    ): Promise<void> {
        try {
            // Show typing indicator before long operation
            await this.showTypingIndicator(phoneNumber);

            // Call domain service to generate code
            const result = await this.estateWhatsAppService.generateAndSendVisitorCode({
                occupantPhone: phoneNumber,
                visitorName: visitorName,
                validHours: 24, // Default 24 hours
            });

            if (result.success) {
                // Store the last generated visitor in context for quick cancel
                const context = await this.stateStore.getContext(phoneNumber);
                context.data.lastGeneratedVisitor = {
                    name: visitorName,
                    code: result.code,
                };
                await this.stateStore.saveContext(context);

                // Success - send follow-up with action buttons
                responses.push({
                    kind: 'interactive',
                    to: phoneNumber,
                    interactive: {
                        type: 'button',
                        body: {
                            text: `What would you like to do next?`,
                        },
                        action: {
                            buttons: [
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'cancel_code',
                                        title: 'Cancel Access',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'list_visitors',
                                        title: 'My Visitors',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'help',
                                        title: 'Done',
                                    },
                                },
                            ],
                        },
                    },
                });
                this.logger.log(`Visitor code generated: ${result.code}`);
            } else {
                // Check if it's an "occupant not found" error
                if (result.message === 'Occupant not found') {
                    responses.push({
                        kind: 'text',
                        to: phoneNumber,
                        body: `Hello! 👋\n\nIt looks like your phone number isn't registered in our system yet.\n\nTo get started with visitor management, please contact your facility manager or estate administrator to add your details to the system.\n\nThey'll need to:\n• Register you as a resident\n• Link your phone number to your unit\n• Activate your account\n\nOnce registered, you'll be able to:\n✓ Generate visitor codes\n✓ Manage your visitors\n✓ Track visitor arrivals\n\nThank you!`,
                    });
                } else {
                    // Other error - send retry options
                    responses.push({
                        kind: 'interactive',
                        to: phoneNumber,
                        interactive: {
                            type: 'button',
                            body: {
                                text: `Would you like to try again?`,
                            },
                            action: {
                                buttons: [
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: 'generate_code',
                                            title: 'Try Again',
                                        },
                                    },
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: 'help',
                                            title: 'Help',
                                        },
                                    },
                                ],
                            },
                        },
                    });
                    this.logger.error(`Failed to generate code: ${result.message}`);
                }
            }
        } catch (error) {
            this.logger.error(`Error in generateCodeForVisitor: ${error.message}`);
            responses.push({
                kind: 'text',
                to: phoneNumber,
                body: `Sorry, there was an error generating the visitor code. Please try again or contact support.`,
            });
        }
    }

    /**
     * Show typing indicator to user
     */
    /**
     * Show typing indicator to user
     */
    private async showTypingIndicator(phoneNumber: string): Promise<void> {
        try {
            // Call messenger service to show typing indicator
            await this.messengerService.showTypingIndicator(phoneNumber);
            this.logger.log(`Showing typing indicator for ${phoneNumber}`);
        } catch (error) {
            this.logger.error(`Error showing typing indicator: ${error.message}`);
        }
    }

    /**
     * Handle visitor departure
     */
    private async handleVisitorDeparture(
        intent: DetectedIntent,
        phoneNumber: string,
        responses: OutgoingMessage[],
    ): Promise<void> {
        try {
            const code = intent.parameters?.code;
            const visitorName = intent.parameters?.visitorName;

            if (!code && !visitorName) {
                responses.push({
                    kind: 'text',
                    to: phoneNumber,
                    body: `Please provide the visitor code or name:\n"John has left" or "Code ABC123 departed"`,
                });
                return;
            }

            // Show typing indicator
            await this.showTypingIndicator(phoneNumber);

            // Mark visitor as departed
            const result = await this.estateWhatsAppService.markVisitorDeparted({
                occupantPhone: phoneNumber,
                code: code,
                visitorName: visitorName,
            });

            if (result.success) {
                responses.push({
                    kind: 'interactive',
                    to: phoneNumber,
                    interactive: {
                        type: 'button',
                        body: {
                            text: `${result.visitorName} has been marked as departed.\n\nThank you for updating!`,
                        },
                        action: {
                            buttons: [
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'list_visitors',
                                        title: 'My Visitors',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'generate_code',
                                        title: 'Generate Code',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'help',
                                        title: 'Done',
                                    },
                                },
                            ],
                        },
                    },
                });
            } else {
                responses.push({
                    kind: 'text',
                    to: phoneNumber,
                    body: result.message || 'Could not find that visitor. Please check the code or name.',
                });
            }
        } catch (error) {
            this.logger.error(`Error handling visitor departure: ${error.message}`);
            responses.push({
                kind: 'text',
                to: phoneNumber,
                body: `Sorry, there was an error marking the visitor as departed. Please try again.`,
            });
        }
    }

    /**
     * Handle visitor at gate notification
     * When someone says "[Name] is at the gate"
     */
    private async handleVisitorAtGate(
        intent: DetectedIntent,
        phoneNumber: string,
        responses: OutgoingMessage[],
    ): Promise<void> {
        try {
            const visitorName = intent.parameters?.visitorName;

            if (!visitorName) {
                responses.push({
                    kind: 'text',
                    to: phoneNumber,
                    body: `Who is at the gate? Please provide the visitor's name.\n\nExample: "Seun is at the gate"`,
                });
                return;
            }

            this.logger.log(`Visitor at gate: ${visitorName}`);

            // Acknowledge receipt
            responses.push({
                kind: 'interactive',
                to: phoneNumber,
                interactive: {
                    type: 'button',
                    body: {
                        text: `Got it! ${visitorName} is at the gate.\n\nWhat would you like to do?`,
                    },
                    action: {
                        buttons: [
                            {
                                type: 'reply',
                                reply: {
                                    id: 'generate_code',
                                    title: 'Generate Code',
                                },
                            },
                            {
                                type: 'reply',
                                reply: {
                                    id: 'list_visitors',
                                    title: 'Check Status',
                                },
                            },
                            {
                                type: 'reply',
                                reply: {
                                    id: 'help',
                                    title: 'Done',
                                },
                            },
                        ],
                    },
                },
            });

            // Store visitor name in context for quick code generation
            const context = await this.stateStore.getContext(phoneNumber);
            context.data.visitorAtGate = {
                name: visitorName,
                timestamp: new Date().toISOString(),
            };
            await this.stateStore.saveContext(context);

        } catch (error) {
            this.logger.error(`Error handling visitor at gate: ${error.message}`);
            responses.push({
                kind: 'text',
                to: phoneNumber,
                body: `Sorry, there was an error processing that. Please try again.`,
            });
        }
    }

    /**
     * Get greeting response with interactive buttons
     */
    private getGreetingWithButtons(phoneNumber: string, responses: OutgoingMessage[]): void {
        responses.push({
            kind: 'interactive',
            to: phoneNumber,
            interactive: {
                type: 'button',
                body: {
                    text: `Hello I'm Kira, your AI estate assistant.\n\nI can help you manage visitors.\n\nWhat would you like to do?`,
                },
                action: {
                    buttons: [
                        {
                            type: 'reply',
                            reply: {
                                id: 'generate_code',
                                title: 'Register Visitor',
                            },
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'manage_household',
                                title: 'Household Members',
                            },
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'manage_visitors',
                                title: 'Visitors',
                            },
                        },
                    ],
                },
            },
        });
    }

    /**
     * Get household management menu
     */
    private getHouseholdMenuWithButtons(phoneNumber: string, responses: OutgoingMessage[]): void {
        responses.push({
            kind: 'interactive',
            to: phoneNumber,
            interactive: {
                type: 'button',
                body: {
                    text: `Household Management\n\nManage your household members here.\n\nWhat would you like to do?`,
                },
                action: {
                    buttons: [
                        {
                            type: 'reply',
                            reply: {
                                id: 'add_household',
                                title: 'Add Member',
                            },
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'list_household',
                                title: 'List Members',
                            },
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'help',
                                title: 'Back',
                            },
                        },
                    ],
                },
            },
        });
    }

    /**
     * Get visitors management menu
     */
    private getVisitorsMenuWithButtons(phoneNumber: string, responses: OutgoingMessage[]): void {
        responses.push({
            kind: 'interactive',
            to: phoneNumber,
            interactive: {
                type: 'button',
                body: {
                    text: `Visitor Management\n\nManage your visitor access codes here.\n\nWhat would you like to do?`,
                },
                action: {
                    buttons: [
                        {
                            type: 'reply',
                            reply: {
                                id: 'list_visitors',
                                title: 'My Visitors',
                            },
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'verify_code',
                                title: 'Check Status',
                            },
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'cancel_code',
                                title: 'Cancel Access',
                            },
                        },
                    ],
                },
            },
        });
    }

    /**
     * Get help response with interactive buttons
     */
    private getHelpWithButtons(phoneNumber: string, responses: OutgoingMessage[]): void {
        responses.push({
            kind: 'interactive',
            to: phoneNumber,
            interactive: {
                type: 'button',
                body: {
                    text: `I'm Kira, your estate assistant.\n\nI can help you with:\n\n• Register visitors\n• Manage household members\n• View and cancel visitor codes\n\nWhat would you like to do?`,
                },
                action: {
                    buttons: [
                        {
                            type: 'reply',
                            reply: {
                                id: 'generate_code',
                                title: 'Register Visitor',
                            },
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'manage_household',
                                title: 'Household',
                            },
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'manage_visitors',
                                title: 'Visitors',
                            },
                        },
                    ],
                },
            },
        });
    }

    /**
     * Get fallback response with interactive buttons
     */
    private getFallbackWithButtons(phoneNumber: string, responses: OutgoingMessage[]): void {
        responses.push({
            kind: 'interactive',
            to: phoneNumber,
            interactive: {
                type: 'button',
                body: {
                    text: `I didn't quite understand that.\n\nWhat would you like to do?`,
                },
                action: {
                    buttons: [
                        {
                            type: 'reply',
                            reply: {
                                id: 'generate_code',
                                title: 'Register Visitor',
                            },
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'manage_household',
                                title: 'Household',
                            },
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'manage_visitors',
                                title: 'Visitors',
                            },
                        },
                    ],
                },
            },
        });
    }

    /**
     * Get verify code response with interactive buttons
     */
    private getVerifyCodeWithButtons(intent: DetectedIntent, phoneNumber: string, responses: OutgoingMessage[]): void {
        const code = intent.parameters?.code;

        if (!code) {
            responses.push({
                kind: 'interactive',
                to: phoneNumber,
                interactive: {
                    type: 'button',
                    body: {
                        text: `I can help verify a visitor code!\n\nPlease provide the code:\n"Check code ABC123"`,
                    },
                    action: {
                        buttons: [
                            {
                                type: 'reply',
                                reply: {
                                    id: 'generate_code',
                                    title: 'Generate Code',
                                },
                            },
                            {
                                type: 'reply',
                                reply: {
                                    id: 'list_visitors',
                                    title: 'My Visitors',
                                },
                            },
                            {
                                type: 'reply',
                                reply: {
                                    id: 'help',
                                    title: 'Help',
                                },
                            },
                        ],
                    },
                },
            });
            return;
        }

        // TODO: Integrate with domain service
        responses.push({
            kind: 'interactive',
            to: phoneNumber,
            interactive: {
                type: 'button',
                body: {
                    text: `Checking code ${code}...\n\nThis feature will be connected to the verification service soon!`,
                },
                action: {
                    buttons: [
                        {
                            type: 'reply',
                            reply: {
                                id: 'generate_code',
                                title: 'Generate Code',
                            },
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'list_visitors',
                                title: 'My Visitors',
                            },
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'help',
                                title: 'Done',
                            },
                        },
                    ],
                },
            },
        });
    }

    /**
     * Get list visitors response with interactive buttons
     */
    private async getListVisitorsWithButtons(phoneNumber: string, responses: OutgoingMessage[]): Promise<void> {
        try {
            await this.showTypingIndicator(phoneNumber);
            const visitorList = await this.estateWhatsAppService.listVisitorCodes(phoneNumber);

            if (visitorList.success && visitorList.visitors && visitorList.visitors.length > 0) {
                let message = `Your Active Visitors (${visitorList.visitors.length}):\n\n`;

                visitorList.visitors.forEach((visitor, index) => {
                    const expiryDate = new Date(visitor.expiresAt);
                    const isExpired = expiryDate < new Date();
                    const status = isExpired ? 'EXPIRED' : visitor.status;

                    message += `${index + 1}. ${visitor.visitorName}\n`;
                    message += `   Code: *${visitor.code}*\n`;
                    message += `   Status: ${status}\n`;
                    message += `   Expires: ${expiryDate.toLocaleString()}\n\n`;
                });

                responses.push({
                    kind: 'text',
                    to: phoneNumber,
                    body: message,
                });

                responses.push({
                    kind: 'interactive',
                    to: phoneNumber,
                    interactive: {
                        type: 'button',
                        body: {
                            text: `What would you like to do?`,
                        },
                        action: {
                            buttons: [
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'generate_code',
                                        title: 'Generate Code',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'cancel_code',
                                        title: 'Cancel Code',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'help',
                                        title: 'Done',
                                    },
                                },
                            ],
                        },
                    },
                });
            } else {
                responses.push({
                    kind: 'interactive',
                    to: phoneNumber,
                    interactive: {
                        type: 'button',
                        body: {
                            text: `You don't have any active visitors.\n\nWould you like to generate a visitor code?`,
                        },
                        action: {
                            buttons: [
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'generate_code',
                                        title: 'Generate Code',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'help',
                                        title: 'Help',
                                    },
                                },
                            ],
                        },
                    },
                });
            }
        } catch (error) {
            this.logger.error(`Error listing visitors: ${error.message}`);
            responses.push({
                kind: 'text',
                to: phoneNumber,
                body: `Sorry, there was an error fetching your visitor list. Please try again.`,
            });
        }
    }

    /**
     * Get cancel code response with interactive buttons
     */
    private async getCancelCodeWithButtons(intent: DetectedIntent, phoneNumber: string, responses: OutgoingMessage[]): Promise<void> {
        const code = intent.parameters?.code;
        const visitorName = intent.parameters?.visitorName;

        if (!code && !visitorName) {
            const visitorList = await this.estateWhatsAppService.listVisitorCodes(phoneNumber);

            if (visitorList.success && visitorList.visitors && visitorList.visitors.length > 0) {
                const lastVisitor = visitorList.visitors[0];

                responses.push({
                    kind: 'interactive',
                    to: phoneNumber,
                    interactive: {
                        type: 'button',
                        body: {
                            text: `Which visitor code would you like to cancel?\n\nYour most recent visitor:\n*${lastVisitor.visitorName}* (Code: ${lastVisitor.code})`,
                        },
                        action: {
                            buttons: [
                                {
                                    type: 'reply',
                                    reply: {
                                        id: `cancel_last_visitor_${lastVisitor.code}`,
                                        title: `Cancel ${lastVisitor.visitorName}`,
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'cancel_other_visitor',
                                        title: 'Cancel Other',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'help',
                                        title: 'Back',
                                    },
                                },
                            ],
                        },
                    },
                });
            } else {
                responses.push({
                    kind: 'interactive',
                    to: phoneNumber,
                    interactive: {
                        type: 'button',
                        body: {
                            text: `You don't have any active visitor codes to cancel.`,
                        },
                        action: {
                            buttons: [
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'generate_code',
                                        title: 'Generate Code',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'help',
                                        title: 'Help',
                                    },
                                },
                            ],
                        },
                    },
                });
            }
            return;
        }

        const msgs = await this.handleCancelWithInfo(code, visitorName, phoneNumber);
        responses.push(...msgs);
    }

    /**
     * Handle cancel with code or name
     */
    private async handleCancelWithInfo(
        code?: string,
        visitorName?: string,
        phoneNumber?: string,
    ): Promise<OutgoingMessage[]> {
        const msgs: OutgoingMessage[] = [];

        try {
            await this.showTypingIndicator(phoneNumber);

            const result = await this.estateWhatsAppService.cancelVisitorCode({
                occupantPhone: phoneNumber,
                code: code,
                visitorName: visitorName,
            });

            if (result.success) {
                msgs.push({
                    kind: 'interactive',
                    to: phoneNumber,
                    interactive: {
                        type: 'button',
                        body: {
                            text: `Visitor code for *${result.visitorName}* has been cancelled.\n\nCode: ${result.code}`,
                        },
                        action: {
                            buttons: [
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'generate_code',
                                        title: 'Generate Code',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'list_visitors',
                                        title: 'My Visitors',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'help',
                                        title: 'Done',
                                    },
                                },
                            ],
                        },
                    },
                });
            } else {
                msgs.push({
                    kind: 'interactive',
                    to: phoneNumber,
                    interactive: {
                        type: 'button',
                        body: {
                            text: result.message || 'Could not find that visitor code.',
                        },
                        action: {
                            buttons: [
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'list_visitors',
                                        title: 'My Visitors',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'generate_code',
                                        title: 'Generate Code',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'help',
                                        title: 'Help',
                                    },
                                },
                            ],
                        },
                    },
                });
            }
        } catch (error) {
            this.logger.error(`Error cancelling visitor code: ${error.message}`);
            msgs.push({
                kind: 'text',
                to: phoneNumber,
                body: `Sorry, there was an error cancelling the visitor code. Please try again.`,
            });
        }

        return msgs;
    }

    /**
     * Handle add household member intent
     */
    private async handleAddHouseholdMember(
        intent: DetectedIntent,
        phoneNumber: string,
        responses: OutgoingMessage[],
    ): Promise<void> {
        await this.showTypingIndicator(phoneNumber);

        const memberName = intent.parameters?.memberName;

        if (!memberName) {
            await this.updateState(phoneNumber, 'AWAITING_HOUSEHOLD_NAME');
            responses.push({
                kind: 'text',
                to: phoneNumber,
                body: `What's the full name of the household member you'd like to add?`,
            });
            return;
        }

        const context = await this.stateStore.getContext(phoneNumber);
        context.data.pendingHouseholdMember = { name: memberName };
        context.state = 'AWAITING_HOUSEHOLD_PHONE';
        await this.stateStore.saveContext(context);

        responses.push({
            kind: 'text',
            to: phoneNumber,
            body: `What's ${memberName}'s WhatsApp phone number?`,
        });
    }

    /**
     * Complete adding household member
     */
    private async completeAddHouseholdMember(
        memberName: string,
        memberPhone: string,
        phoneNumber: string,
    ): Promise<OutgoingMessage[]> {
        const responses: OutgoingMessage[] = [];

        try {
            await this.showTypingIndicator(phoneNumber);

            const result = await this.estateWhatsAppService.addHouseholdMember({
                occupantPhone: phoneNumber,
                memberName: memberName,
                memberPhone: memberPhone,
            });

            if (result.success) {
                responses.push({
                    kind: 'interactive',
                    to: phoneNumber,
                    interactive: {
                        type: 'button',
                        body: {
                            text: `${result.memberName} has been added to your household!\n\nThey can now generate visitor codes using their WhatsApp number: ${memberPhone}`,
                        },
                        action: {
                            buttons: [
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'list_household',
                                        title: 'My Household',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'generate_code',
                                        title: 'Generate Code',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'help',
                                        title: 'Done',
                                    },
                                },
                            ],
                        },
                    },
                });
            } else {
                responses.push({
                    kind: 'text',
                    to: phoneNumber,
                    body: result.message || 'Failed to add household member. Please try again.',
                });
            }
        } catch (error) {
            this.logger.error(`Error completing add household member: ${error.message}`);
            responses.push({
                kind: 'text',
                to: phoneNumber,
                body: `Sorry, there was an error adding the household member. Please try again.`,
            });
        }

        return responses;
    }

    /**
     * Handle list household members
     */
    private async handleListHouseholdMembers(
        phoneNumber: string,
        responses: OutgoingMessage[],
    ): Promise<void> {
        try {
            await this.showTypingIndicator(phoneNumber);

            const result = await this.estateWhatsAppService.listHouseholdMembers(phoneNumber);

            if (result.success && result.members && result.members.length > 0) {
                let message = `Your Household Members (${result.members.length}):\n\n`;

                result.members.forEach((member, index) => {
                    message += `${index + 1}. ${member.name}\n`;
                    if (member.phone) {
                        message += `   Phone: ${member.phone}\n`;
                    }
                    message += `\n`;
                });

                // Send the list with Edit Member button
                responses.push({
                    kind: 'interactive',
                    to: phoneNumber,
                    interactive: {
                        type: 'button',
                        body: {
                            text: message,
                        },
                        action: {
                            buttons: [
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'show_edit_member_options',
                                        title: 'Edit Member',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'add_household',
                                        title: 'Add Member',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'help',
                                        title: 'Done',
                                    },
                                },
                            ],
                        },
                    },
                });
            } else {
                responses.push({
                    kind: 'interactive',
                    to: phoneNumber,
                    interactive: {
                        type: 'button',
                        body: {
                            text: `You don't have any household members yet.\n\nWould you like to add one?`,
                        },
                        action: {
                            buttons: [
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'add_household',
                                        title: 'Add Member',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'generate_code',
                                        title: 'Generate Code',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'help',
                                        title: 'Help',
                                    },
                                },
                            ],
                        },
                    },
                });
            }
        } catch (error) {
            this.logger.error(`Error listing household members: ${error.message}`);
            responses.push({
                kind: 'text',
                to: phoneNumber,
                body: `Sorry, there was an error fetching your household members.`,
            });
        }
    }

    /**
     * Handle remove household member
     */
    private async handleRemoveHouseholdMember(
        intent: DetectedIntent,
        phoneNumber: string,
        responses: OutgoingMessage[],
    ): Promise<void> {
        await this.showTypingIndicator(phoneNumber);

        const memberName = intent.parameters?.memberName;

        if (!memberName) {
            responses.push({
                kind: 'text',
                to: phoneNumber,
                body: `Which household member would you like to remove?\n\nPlease provide their name.`,
            });
            return;
        }

        try {
            const result = await this.estateWhatsAppService.removeHouseholdMember({
                occupantPhone: phoneNumber,
                memberName: memberName,
            });

            if (result.success) {
                responses.push({
                    kind: 'interactive',
                    to: phoneNumber,
                    interactive: {
                        type: 'button',
                        body: {
                            text: `${result.memberName} has been removed from your household.`,
                        },
                        action: {
                            buttons: [
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'list_household',
                                        title: 'My Household',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'generate_code',
                                        title: 'Generate Code',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'help',
                                        title: 'Done',
                                    },
                                },
                            ],
                        },
                    },
                });
            } else {
                responses.push({
                    kind: 'text',
                    to: phoneNumber,
                    body: result.message || 'Could not find that household member.',
                });
            }
        } catch (error) {
            this.logger.error(`Error removing household member: ${error.message}`);
            responses.push({
                kind: 'text',
                to: phoneNumber,
                body: `Sorry, there was an error removing the household member.`,
            });
        }
    }

    /**
     * Handle edit household member intent
     */
    private async handleEditHouseholdMember(
        intent: DetectedIntent,
        phoneNumber: string,
        responses: OutgoingMessage[],
    ): Promise<void> {
        await this.showTypingIndicator(phoneNumber);

        const memberName = intent.parameters?.memberName;

        if (!memberName) {
            responses.push({
                kind: 'text',
                to: phoneNumber,
                body: `Which household member would you like to edit?\n\nPlease provide their name (first name is enough).`,
            });
            return;
        }

        const context = await this.stateStore.getContext(phoneNumber);
        context.data.editingMember = { name: memberName };
        context.state = 'AWAITING_EDIT_MEMBER_PHONE';
        await this.stateStore.saveContext(context);

        responses.push({
            kind: 'text',
            to: phoneNumber,
            body: `What's the new phone number for ${memberName}?`,
        });
    }

    /**
     * Complete editing household member
     */
    private async completeEditHouseholdMember(
        memberName: string,
        newPhone: string,
        phoneNumber: string,
    ): Promise<OutgoingMessage[]> {
        const responses: OutgoingMessage[] = [];

        try {
            await this.showTypingIndicator(phoneNumber);

            const result = await this.estateWhatsAppService.updateHouseholdMemberPhone({
                occupantPhone: phoneNumber,
                memberName: memberName,
                newPhone: newPhone,
            });

            if (result.success) {
                responses.push({
                    kind: 'interactive',
                    to: phoneNumber,
                    interactive: {
                        type: 'button',
                        body: {
                            text: `${result.memberName}'s phone number has been updated to ${newPhone}!`,
                        },
                        action: {
                            buttons: [
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'list_household',
                                        title: 'My Household',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'edit_household',
                                        title: 'Edit Household',
                                    },
                                },
                                {
                                    type: 'reply',
                                    reply: {
                                        id: 'help',
                                        title: 'Done',
                                    },
                                },
                            ],
                        },
                    },
                });
            } else {
                responses.push({
                    kind: 'text',
                    to: phoneNumber,
                    body: result.message || 'Failed to update household member. Please try again.',
                });
            }
        } catch (error) {
            this.logger.error(`Error updating household member: ${error.message}`);
            responses.push({
                kind: 'text',
                to: phoneNumber,
                body: `Sorry, there was an error updating the household member. Please try again.`,
            });
        }

        return responses;
    }



    /**
     * Get conversation context
     */
    async getContext(userId: string): Promise<ConversationContext> {
        return this.stateStore.getContext(userId);
    }

    /**
     * Update conversation state
     */
    async updateState(userId: string, state: string, data?: Record<string, any>): Promise<void> {
        this.logger.log(`Updating state for ${userId}: ${state}`);
        const context = await this.stateStore.getContext(userId);
        context.state = state;
        if (data) {
            context.data = { ...context.data, ...data };
        }
        await this.stateStore.saveContext(context);
        this.logger.log(`State updated successfully for ${userId}: ${state}`);
    }

    /**
     * Show edit member options with individual member buttons
     */
    private async showEditMemberOptions(phoneNumber: string): Promise<OutgoingMessage[]> {
        const responses: OutgoingMessage[] = [];

        try {
            await this.showTypingIndicator(phoneNumber);

            const result = await this.estateWhatsAppService.listHouseholdMembers(phoneNumber);

            if (result.success && result.members && result.members.length > 0) {
                // Show up to 3 members as buttons
                const membersToShow = result.members.slice(0, 3);

                if (membersToShow.length > 0) {
                    const buttons = membersToShow.map(member => ({
                        type: 'reply' as const,
                        reply: {
                            id: `edit_member_${member.name.replace(/\s+/g, '_')}`,
                            title: `Edit ${member.name.split(' ')[0]}`, // Use first name only
                        },
                    }));

                    responses.push({
                        kind: 'interactive',
                        to: phoneNumber,
                        interactive: {
                            type: 'button',
                            body: {
                                text: `Select a member to edit their phone number:`,
                            },
                            action: {
                                buttons: buttons,
                            },
                        },
                    });
                }

                // If more than 3 members, show additional instructions
                if (result.members.length > 3) {
                    responses.push({
                        kind: 'text',
                        to: phoneNumber,
                        body: `To edit other members, type:\n"Edit [member name]"\n\nExample: "Edit John"`,
                    });
                }
            } else {
                responses.push({
                    kind: 'text',
                    to: phoneNumber,
                    body: `You don't have any household members to edit.`,
                });
            }
        } catch (error) {
            this.logger.error(`Error showing edit member options: ${error.message}`);
            responses.push({
                kind: 'text',
                to: phoneNumber,
                body: `Sorry, there was an error loading household members.`,
            });
        }

        return responses;
    }

    /**
     * Clear conversation context
     */
    async clearContext(userId: string): Promise<void> {
        await this.stateStore.clearContext(userId);
    }
}
