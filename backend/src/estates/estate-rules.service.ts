import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface EstateRule {
    id: string;
    category: string;
    title: string;
    rule: string;
    keywords: string[];
    answer: string;
}

export interface EstateRulesData {
    rules: EstateRule[];
}

@Injectable()
export class EstateRulesService {
    private readonly logger = new Logger(EstateRulesService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get all rules for an estate
     */
    async getEstateRules(estateId: string): Promise<EstateRulesData | null> {
        const estate = await this.prisma.estate.findUnique({
            where: { id: estateId },
            select: { rules: true },
        });

        if (!estate || !estate.rules) {
            return null;
        }

        // Safely convert JSON to EstateRulesData
        return estate.rules as unknown as EstateRulesData;
    }

    /**
     * Find rules matching a query
     */
    async findMatchingRules(
        estateId: string,
        query: string,
    ): Promise<{ rules: EstateRule[]; bestMatch?: EstateRule }> {
        const rulesData = await this.getEstateRules(estateId);

        if (!rulesData || !rulesData.rules) {
            return { rules: [] };
        }

        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/);

        // Score each rule based on keyword matches
        const scoredRules = rulesData.rules.map((rule) => {
            let score = 0;

            // Check each keyword
            for (const keyword of rule.keywords) {
                const keywordLower = keyword.toLowerCase();

                // Exact match in query
                if (queryLower.includes(keywordLower)) {
                    score += 10;
                }

                // Word match
                if (queryWords.some((word) => word === keywordLower)) {
                    score += 5;
                }

                // Partial match
                if (queryWords.some((word) => word.includes(keywordLower) || keywordLower.includes(word))) {
                    score += 2;
                }
            }

            return { rule, score };
        });

        // Filter rules with score > 0 and sort by score
        const matchingRules = scoredRules
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map((item) => item.rule);

        return {
            rules: matchingRules,
            bestMatch: matchingRules.length > 0 ? matchingRules[0] : undefined,
        };
    }

    /**
     * Update estate rules
     */
    async updateEstateRules(estateId: string, rules: EstateRulesData): Promise<boolean> {
        try {
            await this.prisma.estate.update({
                where: { id: estateId },
                data: { rules: rules as any },
            });

            this.logger.log(`Updated rules for estate ${estateId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to update estate rules: ${error.message}`);
            return false;
        }
    }

    /**
     * Add a new rule to an estate
     */
    async addRule(estateId: string, rule: EstateRule): Promise<boolean> {
        try {
            const rulesData = await this.getEstateRules(estateId);

            if (!rulesData) {
                // Create new rules data
                await this.updateEstateRules(estateId, { rules: [rule] });
            } else {
                // Add to existing rules
                rulesData.rules.push(rule);
                await this.updateEstateRules(estateId, rulesData);
            }

            this.logger.log(`Added rule ${rule.id} to estate ${estateId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to add rule: ${error.message}`);
            return false;
        }
    }

    /**
     * Remove a rule from an estate
     */
    async removeRule(estateId: string, ruleId: string): Promise<boolean> {
        try {
            const rulesData = await this.getEstateRules(estateId);

            if (!rulesData) {
                return false;
            }

            rulesData.rules = rulesData.rules.filter((r) => r.id !== ruleId);
            await this.updateEstateRules(estateId, rulesData);

            this.logger.log(`Removed rule ${ruleId} from estate ${estateId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to remove rule: ${error.message}`);
            return false;
        }
    }

    /**
     * Get default rules template
     */
    getDefaultRules(): EstateRulesData {
        return {
            rules: [
                {
                    id: 'pets-policy',
                    category: 'pets',
                    title: 'Pet Policy',
                    rule: 'Pets are not allowed in the estate',
                    keywords: ['pet', 'pets', 'dog', 'cat', 'animal', 'animals'],
                    answer: 'Pets are not allowed in the estate. This policy helps maintain cleanliness and ensures the comfort of all residents.'
                },
            ],
        };
    }
}
