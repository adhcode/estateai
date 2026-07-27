import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { EstateRule, EstateRulesService } from './estate-rules.service';

@Controller('estates/:estateId/rules')
export class EstateRulesController {
    constructor(private readonly estateRulesService: EstateRulesService) { }

    /**
     * Get all rules for an estate
     */
    @Get()
    async getRules(@Param('estateId') estateId: string) {
        const rules = await this.estateRulesService.getEstateRules(estateId);
        return {
            success: true,
            data: rules || { rules: [] },
        };
    }

    /**
     * Add a new rule
     */
    @Post()
    async addRule(@Param('estateId') estateId: string, @Body() rule: EstateRule) {
        const success = await this.estateRulesService.addRule(estateId, rule);
        return {
            success,
            message: success ? 'Rule added successfully' : 'Failed to add rule',
        };
    }

    /**
     * Update all rules
     */
    @Put()
    async updateRules(@Param('estateId') estateId: string, @Body() body: { rules: EstateRule[] }) {
        const success = await this.estateRulesService.updateEstateRules(estateId, body);
        return {
            success,
            message: success ? 'Rules updated successfully' : 'Failed to update rules',
        };
    }

    /**
     * Delete a rule
     */
    @Delete(':ruleId')
    async deleteRule(@Param('estateId') estateId: string, @Param('ruleId') ruleId: string) {
        const success = await this.estateRulesService.removeRule(estateId, ruleId);
        return {
            success,
            message: success ? 'Rule deleted successfully' : 'Failed to delete rule',
        };
    }

    /**
     * Query rules (for testing)
     */
    @Post('query')
    async queryRules(@Param('estateId') estateId: string, @Body() body: { query: string }) {
        const result = await this.estateRulesService.findMatchingRules(estateId, body.query);
        return {
            success: result.rules.length > 0,
            data: result,
        };
    }

    /**
     * Get default rules template
     */
    @Get('default')
    async getDefaultRules() {
        const rules = this.estateRulesService.getDefaultRules();
        return {
            success: true,
            data: rules,
        };
    }
}
