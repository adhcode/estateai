import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { OccupantsService } from '../../occupants/occupants.service';
import { ImageUploadService } from '../../visitor-code/image-upload.service';
import { QrCodeService } from '../../visitor-code/qr-code.service';
import { VisitorCardService } from '../../visitor-code/visitor-card.service';
import { VisitorCodeService } from '../../visitor-code/visitor-code.service';
import { MessengerService } from '../outbound/messenger.service';

/**
 * Estate WhatsApp Service
 * Domain layer that connects WhatsApp messaging with estate business logic
 */
@Injectable()
export class EstateWhatsAppService {
    private readonly logger = new Logger(EstateWhatsAppService.name);

    constructor(
        private readonly messengerService: MessengerService,
        @Inject(forwardRef(() => VisitorCodeService))
        private readonly visitorCodeService: VisitorCodeService,
        private readonly occupantsService: OccupantsService,
        @Inject(forwardRef(() => QrCodeService))
        private readonly qrCodeService: QrCodeService,
        @Inject(forwardRef(() => VisitorCardService))
        private readonly visitorCardService: VisitorCardService,
        @Inject(forwardRef(() => ImageUploadService))
        private readonly imageUploadService: ImageUploadService,
    ) { }

    /**
     * Generate visitor code and send via WhatsApp
     */
    async generateAndSendVisitorCode(params: {
        occupantPhone: string;
        visitorName: string;
        visitorPhone?: string;
        validHours?: number;
    }): Promise<{ success: boolean; code?: string; message: string }> {
        try {
            this.logger.log(`Generating visitor code for: ${params.visitorName} (requested by ${params.occupantPhone})`);

            // Find occupant by phone
            const occupant = await this.findOccupantByPhone(params.occupantPhone);

            if (!occupant) {
                await this.messengerService.sendText({
                    to: params.occupantPhone,
                    body: "Sorry, I couldn't find your account. Please make sure you're registered as a resident.",
                });

                return {
                    success: false,
                    message: 'Occupant not found',
                };
            }

            this.logger.log(`Found occupant: ${occupant.id}, generating code for visitor: ${params.visitorName}`);

            // Generate visitor code
            const visitorCode = await this.visitorCodeService.generateCode({
                visitorName: params.visitorName,
                visitorPhone: params.visitorPhone,
                occupantId: occupant.id,
                validHours: params.validHours || 2,
            });

            this.logger.log(`Visitor code generated: ${visitorCode.code} for ${visitorCode.visitorName}`);

            // Generate beautiful visitor card with QR code
            let cardUrl: string | null = null;
            try {
                const cardPath = await this.visitorCardService.generateVisitorCard(visitorCode);

                // Upload to public image hosting (Telegraph, ImgBB, or Cloudinary)
                this.logger.log(`Uploading visitor card to public hosting...`);
                cardUrl = await this.imageUploadService.uploadImage(cardPath);
                this.logger.log(`✅ Visitor card uploaded: ${cardUrl}`);
            } catch (uploadError) {
                this.logger.error(`Failed to upload visitor card: ${uploadError.message}`);
                this.logger.warn(`Continuing without image - will send text-only code`);
                // Continue without image - better to send code than fail completely
            }

            // Send to occupant with beautiful card (or text-only if upload failed)
            const occupantMessage =
                `Access created for ${params.visitorName}\n\n` +
                `Code: *${visitorCode.code}*\n` +
                `Valid until: ${new Date(visitorCode.expiresAt).toLocaleString()}\n\n` +
                (cardUrl ? `Access card attached below.` : `Show this code at the gate for entry.`);

            await this.messengerService.sendText({
                to: params.occupantPhone,
                body: occupantMessage,
            });

            // Send visitor card as image (only if upload succeeded)
            if (cardUrl) {
                try {
                    await this.messengerService.sendMedia({
                        to: params.occupantPhone,
                        type: 'image',
                        url: cardUrl,
                        caption: `Visitor Access Card for ${params.visitorName}`,
                    });
                } catch (mediaError) {
                    this.logger.error(`Failed to send media to occupant: ${mediaError.message}`);
                    // Already sent text with code, so this is not critical
                }
            }

            // Send to visitor if phone provided
            if (params.visitorPhone) {
                const visitorMessage =
                    `*${occupant.estate?.name || 'Estate'}* - Visitor Access\n\n` +
                    `Hello ${params.visitorName},\n\n` +
                    `Your Access Code: *${visitorCode.code}*\n` +
                    `Unit: ${occupant.unit?.block} ${occupant.unit?.flat}\n` +
                    `Valid Until: ${new Date(visitorCode.expiresAt).toLocaleString()}\n\n` +
                    `Address: ${occupant.estate?.address || 'Estate Address'}\n\n` +
                    `Please show this ${cardUrl ? 'card or access' : 'access'} code at the gate for entry.`;

                await this.messengerService.sendText({
                    to: params.visitorPhone,
                    body: visitorMessage,
                });

                // Send visitor card as image (only if upload succeeded)
                if (cardUrl) {
                    try {
                        await this.messengerService.sendMedia({
                            to: params.visitorPhone,
                            type: 'image',
                            url: cardUrl,
                            caption: 'Your visitor access card - Show at gate',
                        });
                    } catch (mediaError) {
                        this.logger.error(`Failed to send media to visitor: ${mediaError.message}`);
                        // Already sent text with code, so this is not critical
                    }
                }
            }

            return {
                success: true,
                code: visitorCode.code,
                message: 'Visitor code generated and sent successfully',
            };
        } catch (error) {
            this.logger.error(`Error generating visitor code: ${error.message}`, error.stack);

            await this.messengerService.sendText({
                to: params.occupantPhone,
                body: `Sorry, there was an error generating the visitor code: ${error.message}`,
            });

            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Notify occupant when visitor arrives
     */
    async notifyVisitorArrival(params: {
        occupantId: string;
        visitorName: string;
        code: string;
    }): Promise<void> {
        try {
            const occupant = await this.occupantsService.findOne(params.occupantId);

            if (!occupant?.phone) {
                this.logger.warn(`No phone number for occupant ${params.occupantId}`);
                return;
            }

            const message =
                `${params.visitorName} has arrived\n\n` +
                `Access Granted\n` +
                `Code: *${params.code}*\n` +
                `Entry Time: ${new Date().toLocaleString()}\n` +
                `Unit: ${occupant.unit?.block} ${occupant.unit?.flat}\n\n` +
                `If this was unexpected, please contact security immediately.`;

            await this.messengerService.sendText({
                to: occupant.phone,
                body: message,
            });
        } catch (error) {
            this.logger.error(`Error notifying visitor arrival: ${error.message}`);
        }
    }

    /**
     * List visitor codes for an occupant
     */
    async listVisitorCodes(occupantPhone: string): Promise<{
        success: boolean;
        visitors?: any[];
        message?: string;
    }> {
        try {
            const occupant = await this.findOccupantByPhone(occupantPhone);

            if (!occupant) {
                return {
                    success: false,
                    message: 'Occupant not found',
                };
            }

            // Get all active visitor codes for this occupant
            const visitors = await this.visitorCodeService.findByOccupant(occupant.id);

            // Filter to show only ACTIVE codes (not cancelled, revoked, expired, or used)
            const activeVisitors = visitors.filter(v => v.status === 'ACTIVE');

            return {
                success: true,
                visitors: activeVisitors,
            };
        } catch (error) {
            this.logger.error(`Error listing visitor codes: ${error.message}`);
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Mark visitor as departed
     */
    async markVisitorDeparted(params: {
        occupantPhone: string;
        code?: string;
        visitorName?: string;
    }): Promise<{
        success: boolean;
        visitorName?: string;
        message?: string;
    }> {
        try {
            const occupant = await this.findOccupantByPhone(params.occupantPhone);

            if (!occupant) {
                return {
                    success: false,
                    message: 'Occupant not found',
                };
            }

            // Find the visitor code
            let visitorCode;
            if (params.code) {
                visitorCode = await this.visitorCodeService.findByCode(params.code);
            } else if (params.visitorName) {
                // Find by visitor name for this occupant - look for USED status (visitor has entered)
                const visitors = await this.visitorCodeService.findByOccupant(occupant.id);
                visitorCode = visitors.find(v =>
                    v.visitorName.toLowerCase().includes(params.visitorName.toLowerCase()) &&
                    v.status === 'USED' // Changed from ACTIVE to USED
                );
            }

            if (!visitorCode) {
                return {
                    success: false,
                    message: 'Visitor not found or has not entered yet',
                };
            }

            // Mark as departed using the existing method
            await this.visitorCodeService.markVisitorDeparture(visitorCode.id);

            this.logger.log(`Visitor ${visitorCode.visitorName} marked as departed`);

            return {
                success: true,
                visitorName: visitorCode.visitorName,
            };
        } catch (error) {
            this.logger.error(`Error marking visitor as departed: ${error.message}`);
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Cancel visitor code
     */
    async cancelVisitorCode(params: {
        occupantPhone: string;
        code?: string;
        visitorName?: string;
    }): Promise<{
        success: boolean;
        visitorName?: string;
        code?: string;
        message?: string;
    }> {
        try {
            this.logger.log(`Cancelling visitor code - phone: ${params.occupantPhone}, code: ${params.code}, name: ${params.visitorName}`);

            const occupant = await this.findOccupantByPhone(params.occupantPhone);

            if (!occupant) {
                this.logger.warn(`Occupant not found for phone: ${params.occupantPhone}`);
                return {
                    success: false,
                    message: 'Occupant not found',
                };
            }

            this.logger.log(`Found occupant: ${occupant.id}`);

            // Find the visitor code by code or name
            let visitorCode;

            if (params.code) {
                this.logger.log(`Searching by code: ${params.code}`);
                visitorCode = await this.visitorCodeService.findByCode(params.code);
            } else if (params.visitorName) {
                this.logger.log(`Searching by name: ${params.visitorName}`);
                // Find by visitor name for this occupant
                const visitors = await this.visitorCodeService.findByOccupant(occupant.id);
                this.logger.log(`Found ${visitors.length} visitor codes for occupant`);
                visitorCode = visitors.find(v =>
                    v.visitorName.toLowerCase().includes(params.visitorName.toLowerCase()) &&
                    v.status === 'ACTIVE'
                );
                if (visitorCode) {
                    this.logger.log(`Found matching visitor: ${visitorCode.visitorName} (${visitorCode.code})`);
                } else {
                    this.logger.warn(`No matching active visitor found for name: ${params.visitorName}`);
                }
            }

            if (!visitorCode) {
                return {
                    success: false,
                    message: params.visitorName
                        ? `Could not find an active visitor code for "${params.visitorName}"`
                        : 'Visitor code not found',
                };
            }

            // Verify the code belongs to this occupant
            if (visitorCode.occupantId !== occupant.id) {
                this.logger.warn(`Code ${visitorCode.code} does not belong to occupant ${occupant.id}`);
                return {
                    success: false,
                    message: 'You can only cancel your own visitor codes',
                };
            }

            // Check if already used
            if (visitorCode.status === 'USED') {
                return {
                    success: false,
                    message: 'Cannot cancel a code that has already been used',
                };
            }

            // Check if already cancelled
            if (visitorCode.status === 'REVOKED') {
                return {
                    success: false,
                    message: 'This code has already been cancelled',
                };
            }

            // Cancel the code
            this.logger.log(`Cancelling code ${visitorCode.code} for visitor ${visitorCode.visitorName}`);
            await this.visitorCodeService.cancelCode(visitorCode.id);

            this.logger.log(`✅ Visitor code ${visitorCode.code} cancelled successfully`);

            return {
                success: true,
                visitorName: visitorCode.visitorName,
                code: visitorCode.code,
            };
        } catch (error) {
            this.logger.error(`Error cancelling visitor code: ${error.message}`);
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Find occupant by phone number
     */
    private async findOccupantByPhone(phoneNumber: string): Promise<any> {
        const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
        const occupants = await this.occupantsService.findAll();

        return occupants.find((occupant) => {
            if (!occupant.phone) return false;
            const occupantPhone = occupant.phone.replace(/[\s\-\(\)]/g, '');
            return occupantPhone === cleanPhone || occupantPhone.endsWith(cleanPhone.slice(-10));
        });
    }

    /**
     * Add household member for a primary resident
     */
    async addHouseholdMember(params: {
        occupantPhone: string;
        memberName: string;
        memberPhone: string;
    }): Promise<{
        success: boolean;
        memberName?: string;
        message?: string;
    }> {
        try {
            this.logger.log(`Adding household member: ${params.memberName} for ${params.occupantPhone}`);

            // Find the primary resident by phone
            const primaryResident = await this.findOccupantByPhone(params.occupantPhone);

            if (!primaryResident) {
                return {
                    success: false,
                    message: 'Primary resident not found',
                };
            }

            // Verify they are a primary resident (not a household member)
            if (primaryResident.type !== 'RESIDENT') {
                return {
                    success: false,
                    message: 'Only primary residents can add household members',
                };
            }

            // Create the household member
            const householdMember = await this.occupantsService.createHouseholdMember(
                primaryResident.id,
                {
                    name: params.memberName,
                    phone: params.memberPhone,
                    estateId: primaryResident.estateId,
                    unitId: primaryResident.unitId,
                }
            );

            this.logger.log(`✅ Household member added: ${householdMember.name}`);

            return {
                success: true,
                memberName: householdMember.name,
            };
        } catch (error) {
            this.logger.error(`Error adding household member: ${error.message}`);
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * List household members for a primary resident
     */
    async listHouseholdMembers(occupantPhone: string): Promise<{
        success: boolean;
        members?: any[];
        message?: string;
    }> {
        try {
            const primaryResident = await this.findOccupantByPhone(occupantPhone);

            if (!primaryResident) {
                return {
                    success: false,
                    message: 'Primary resident not found',
                };
            }

            if (primaryResident.type !== 'RESIDENT') {
                return {
                    success: false,
                    message: 'Only primary residents can list household members',
                };
            }

            const members = await this.occupantsService.getResidentHouseholdMembers(primaryResident.id);

            return {
                success: true,
                members: members,
            };
        } catch (error) {
            this.logger.error(`Error listing household members: ${error.message}`);
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Remove household member
     */
    async removeHouseholdMember(params: {
        occupantPhone: string;
        memberName: string;
    }): Promise<{
        success: boolean;
        memberName?: string;
        message?: string;
    }> {
        try {
            const primaryResident = await this.findOccupantByPhone(params.occupantPhone);

            if (!primaryResident) {
                return {
                    success: false,
                    message: 'Primary resident not found',
                };
            }

            if (primaryResident.type !== 'RESIDENT') {
                return {
                    success: false,
                    message: 'Only primary residents can remove household members',
                };
            }

            // Find the household member by name (supports full name, partial match, or first name)
            const members = await this.occupantsService.getResidentHouseholdMembers(primaryResident.id);
            const searchName = params.memberName.toLowerCase().trim();

            const member = members.find(m => {
                const fullName = m.name.toLowerCase();
                const firstName = fullName.split(' ')[0];

                // Match full name, partial match, or first name
                return fullName === searchName ||
                    fullName.includes(searchName) ||
                    searchName.includes(fullName) ||
                    firstName === searchName;
            });

            if (!member) {
                return {
                    success: false,
                    message: `Household member "${params.memberName}" not found`,
                };
            }

            // Remove the member
            await this.occupantsService.remove(member.id);

            this.logger.log(`✅ Household member removed: ${member.name}`);

            return {
                success: true,
                memberName: member.name,
            };
        } catch (error) {
            this.logger.error(`Error removing household member: ${error.message}`);
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Update household member phone number
     */
    async updateHouseholdMemberPhone(params: {
        occupantPhone: string;
        memberName: string;
        newPhone: string;
    }): Promise<{
        success: boolean;
        memberName?: string;
        message?: string;
    }> {
        try {
            const primaryResident = await this.findOccupantByPhone(params.occupantPhone);

            if (!primaryResident) {
                return {
                    success: false,
                    message: 'Primary resident not found',
                };
            }

            if (primaryResident.type !== 'RESIDENT') {
                return {
                    success: false,
                    message: 'Only primary residents can update household members',
                };
            }

            // Find the household member by name (supports full name, partial match, or first name)
            const members = await this.occupantsService.getResidentHouseholdMembers(primaryResident.id);
            const searchName = params.memberName.toLowerCase().trim();

            const member = members.find(m => {
                const fullName = m.name.toLowerCase();
                const firstName = fullName.split(' ')[0];

                // Match full name, partial match, or first name
                return fullName === searchName ||
                    fullName.includes(searchName) ||
                    searchName.includes(fullName) ||
                    firstName === searchName;
            });

            if (!member) {
                return {
                    success: false,
                    message: `Household member "${params.memberName}" not found`,
                };
            }

            // Update the phone number
            await this.occupantsService.update(member.id, {
                phone: params.newPhone,
            });

            this.logger.log(`✅ Household member phone updated: ${member.name} → ${params.newPhone}`);

            return {
                success: true,
                memberName: member.name,
            };
        } catch (error) {
            this.logger.error(`Error updating household member phone: ${error.message}`);
            return {
                success: false,
                message: error.message,
            };
        }
    }

}
