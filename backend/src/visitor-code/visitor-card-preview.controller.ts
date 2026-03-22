import { Controller, Get, Logger, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { VisitorCardService } from './visitor-card.service';

/**
 * Visitor Card Preview Controller
 * Allows testing and previewing visitor cards in the browser
 */
@Controller('visitor-card-preview')
export class VisitorCardPreviewController {
    private readonly logger = new Logger(VisitorCardPreviewController.name);

    constructor(
        private readonly visitorCardService: VisitorCardService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Generate a test visitor card with sample data
     */
    @Public()
    @Get('test')
    async generateTestCard(@Res() res: Response) {
        try {
            // Create sample visitor code data
            const sampleData = {
                code: 'TEST123',
                visitorName: 'John Doe',
                visitorPhone: '+1234567890',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
                occupant: {
                    name: 'Jane Smith',
                    estate: {
                        name: 'Sunset Gardens Estate',
                        address: '123 Main Street, City'
                    },
                    unit: {
                        block: 'Block A',
                        flat: '#101'
                    },
                    primaryOccupant: {
                        name: 'Jane Smith'
                    }
                }
            };

            // Generate the card
            const cardPath = await this.visitorCardService.generateVisitorCard(sampleData);

            // Read the file
            const imageBuffer = fs.readFileSync(cardPath);

            // Send as image
            res.set('Content-Type', 'image/png');
            res.set('Content-Disposition', 'inline; filename="test-visitor-card.png"');
            res.send(imageBuffer);
        } catch (error) {
            this.logger.error(`Failed to generate test card: ${error.message}`);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Generate a card for a specific visitor code from database
     */
    @Public()
    @Get('code/:code')
    async generateCardForCode(@Param('code') code: string, @Res() res: Response) {
        try {
            // Find the visitor code in database
            const visitorCode = await this.prisma.visitorCode.findUnique({
                where: { code },
                include: {
                    occupant: {
                        include: {
                            estate: true,
                            unit: true,
                            primaryOccupant: true
                        }
                    }
                }
            });

            if (!visitorCode) {
                return res.status(404).json({ error: 'Visitor code not found' });
            }

            // Generate the card
            const cardPath = await this.visitorCardService.generateVisitorCard(visitorCode);

            // Read the file
            const imageBuffer = fs.readFileSync(cardPath);

            // Send as image
            res.set('Content-Type', 'image/png');
            res.set('Content-Disposition', `inline; filename="visitor-${code}.png"`);
            res.send(imageBuffer);
        } catch (error) {
            this.logger.error(`Failed to generate card for code ${code}: ${error.message}`);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Preview page with HTML interface
     */
    @Public()
    @Get('preview')
    async previewPage(@Res() res: Response) {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visitor Card Preview</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .card-preview {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            margin-bottom: 30px;
        }
        
        .preview-title {
            font-size: 1.5rem;
            color: #1e293b;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .card-container {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            background: #f8fafc;
            border-radius: 15px;
        }
        
        .card-container img {
            max-width: 100%;
            height: auto;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .controls {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .controls h2 {
            color: #1e293b;
            margin-bottom: 20px;
            font-size: 1.3rem;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            color: #64748b;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .btn {
            width: 100%;
            padding: 14px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }
        
        .btn:active {
            transform: translateY(0);
        }
        
        .info-box {
            background: #f1f5f9;
            border-left: 4px solid #667eea;
            padding: 16px;
            border-radius: 8px;
            margin-top: 20px;
        }
        
        .info-box h3 {
            color: #1e293b;
            margin-bottom: 8px;
            font-size: 1rem;
        }
        
        .info-box p {
            color: #64748b;
            font-size: 0.9rem;
            line-height: 1.6;
        }
        
        .info-box code {
            background: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            color: #667eea;
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2rem;
            }
            
            .card-preview, .controls {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎫 Visitor Card Preview</h1>
            <p>Test and preview your visitor badge designs</p>
        </div>
        
        <div class="card-preview">
            <h2 class="preview-title">Sample Visitor Badge</h2>
            <div class="card-container">
                <img src="/api/visitor-card-preview/test" alt="Visitor Card" id="cardImage">
            </div>
        </div>
        
        <div class="controls">
            <h2>Generate Custom Card</h2>
            
            <div class="form-group">
                <label for="visitorName">Visitor Name</label>
                <input type="text" id="visitorName" placeholder="John Doe" value="John Doe">
            </div>
            
            <div class="form-group">
                <label for="code">Access Code</label>
                <input type="text" id="code" placeholder="ABC123" value="TEST123">
            </div>
            
            <div class="form-group">
                <label for="unit">Unit</label>
                <input type="text" id="unit" placeholder="Block A #101" value="Block A #101">
            </div>
            
            <div class="form-group">
                <label for="hostName">Host Name</label>
                <input type="text" id="hostName" placeholder="Jane Smith" value="Jane Smith">
            </div>
            
            <div class="form-group">
                <label for="estateName">Estate Name</label>
                <input type="text" id="estateName" placeholder="Sunset Gardens Estate" value="Sunset Gardens Estate">
            </div>
            
            <button class="btn" onclick="refreshCard()">🔄 Refresh Card</button>
            
            <div class="info-box">
                <h3>💡 Quick Tips</h3>
                <p>
                    • The card auto-refreshes when you click the button<br>
                    • Test different names and codes to see how they look<br>
                    • The design matches the badge style you requested<br>
                    • Access via: <code>http://localhost:3001/api/visitor-card-preview/preview</code>
                </p>
            </div>
            
            <div class="info-box" style="margin-top: 15px; border-left-color: #10b981;">
                <h3>🔗 API Endpoints</h3>
                <p>
                    • Test card: <code>GET /api/visitor-card-preview/test</code><br>
                    • By code: <code>GET /api/visitor-card-preview/code/:code</code><br>
                    • Preview page: <code>GET /api/visitor-card-preview/preview</code>
                </p>
            </div>
        </div>
    </div>
    
    <script>
        function refreshCard() {
            const img = document.getElementById('cardImage');
            // Add timestamp to force refresh
            const timestamp = new Date().getTime();
            img.src = '/api/visitor-card-preview/test?' + timestamp;
        }
        
        // Auto-refresh every 30 seconds
        setInterval(refreshCard, 30000);
    </script>
</body>
</html>
        `;

        res.set('Content-Type', 'text/html');
        res.send(html);
    }
}
