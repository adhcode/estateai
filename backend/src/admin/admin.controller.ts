import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('estates/:estateId/occupants')
  async getEstateOccupants(@Param('estateId') estateId: string) {
    const occupants = await this.adminService.getEstateOccupants(estateId);
    return {
      success: true,
      data: occupants,
    };
  }

  @Get('estates/:estateId/residents')
  async getEstateResidents(@Param('estateId') estateId: string) {
    const residents = await this.adminService.getEstateOccupants(estateId);
    return {
      success: true,
      data: residents,
    };
  }

  @Post('estates/:estateId/residents')
  async addResidentWithWhatsapp(
    @Param('estateId') estateId: string,
    @Body() data: {
      name: string;
      phone: string;
      email?: string;
      unitId: string;
    },
  ) {
    const resident = await this.adminService.addResidentWithWhatsapp(estateId, data);
    return {
      success: true,
      message: `Resident ${resident.name} added successfully`,
      data: resident,
    };
  }

  @Patch('occupants/:occupantId/phone')
  async updateOccupantWhatsapp(
    @Param('occupantId') occupantId: string,
    @Body() data: { phone: string },
  ) {
    const occupant = await this.adminService.updateOccupantWhatsapp(
      occupantId,
      data.phone,
    );
    return {
      success: true,
      message: `Phone number updated for ${occupant.name}`,
      data: occupant,
    };
  }

  @Get('estates/:estateId/stats')
  async getEstateStats(@Param('estateId') estateId: string) {
    const stats = await this.adminService.getEstateStats(estateId);
    return {
      success: true,
      data: stats,
    };
  }

  @Post('occupants/:occupantId/invite')
  async sendWhatsappInvite(@Param('occupantId') occupantId: string) {
    const result = await this.adminService.sendWhatsappInvite(occupantId);
    return {
      success: true,
      message: `WhatsApp invitation sent to ${result.phone}`,
      data: result,
    };
  }
}