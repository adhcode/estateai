# 🏢 EstateAI - Complete Documentation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0+-red)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18.0+-blue)](https://reactjs.org/)

> A comprehensive AI-powered estate management system with WhatsApp integration, intelligent visitor management, and real-time security features.

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Quick Start](#quick-start)
5. [Configuration](#configuration)
6. [Estate & Unit Management](#estate--unit-management)
7. [Visitor Management](#visitor-management)
8. [WhatsApp Integration](#whatsapp-integration)
9. [Security Features](#security-features)
10. [Deployment](#deployment)
11. [Testing](#testing)
12. [Troubleshooting](#troubleshooting)
13. [API Reference](#api-reference)

---

## Overview

EstateAI is an intelligent estate management system designed to streamline property operations, visitor management, and security workflows. The system features:

- **Multi-tenant architecture** supporting multiple estates
- **WhatsApp integration** for natural language interactions
- **AI-powered messaging** with Dialogflow NLU
- **QR code-based** visitor access control
- **Real-time notifications** for residents and security
- **Role-based access control** (Super Admin, Estate Admin, Security, Resident)

---

## Features

### 🤖 AI-Powered Messaging
- **WhatsApp Integration**: Provider-agnostic (Meta Cloud API, Twilio)

- **Dialogflow NLU**: Professional natural language understanding
- **Smart Intent Recognition**: Automatic parsing of visitor requests
- **Multi-provider Support**: Switch between providers in minutes

### 🎫 Advanced Visitor Management
- **QR Code Generation**: Dynamic QR codes for contactless entry
- **Time-based Access Codes**: Secure, expiring visitor codes (6-8 characters)
- **Real-time Notifications**: Instant alerts to residents and security
- **Visitor Lifecycle Tracking**: Complete journey from arrival to departure
- **Household Member Management**: Add family members who can generate codes

### 🏢 Estate Operations
- **Multi-tenant Architecture**: Support for multiple estates
- **Bulk Unit Creation**: Create 40 blocks × 12 flats = 480 units automatically
- **Unit Reconfiguration**: Safely modify unit structures while preserving occupied units
- **Role-based Access Control**: Super Admin, Estate Admin, Security, Resident roles
- **Security Dashboard**: Real-time monitoring and access control

### 🔒 Enterprise Security
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against abuse and attacks
- **Input Validation**: Comprehensive data sanitization
- **Audit Logging**: Complete activity tracking
- **Code Protection**: Active visitor codes hidden from security until verification

---

## Architecture

```
EstateAI/
├── backend/                    # NestJS API Server
│   ├── src/
│   │   ├── whatsapp/          # WhatsApp integration & AI
│   │   │   ├── webhook/       # Webhook handling
│   │   │   ├── conversation/  # Conversation management
│   │   │   ├── intent/        # Intent detection
│   │   │   ├── domain/        # Business logic
│   │   │   └── outbound/      # Message sending
│   │   ├── auth/              # Authentication & authorization
│   │   ├── visitor-code/      # Visitor management & QR codes
│   │   ├── estates/           # Estate management
│   │   ├── units/             # Property unit management
│   │   ├── occupants/         # Resident management
│   │   ├── admin/             # Administrative functions
│   │   └── common/            # Shared utilities & middleware
│   ├── prisma/                # Database schema & migrations
│   └── assets/                # Fonts for PDF generation
│
├── frontend/                   # React Web Application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── contexts/          # React contexts
│   │   └── utils/             # Utility functions
│   └── public/                # Static assets
│
└── nextjs-frontend/           # Next.js Dashboard (Alternative)
    ├── app/
    │   └── (dashboard)/       # Dashboard pages
    └── components/            # Shared components
```

### System Flow

```
┌─────────────────────────────────────────────────────────┐
│                    WhatsApp User                         │
│              (Resident sends message)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         INBOUND LAYER (Entry Point)                      │
│  • webhook.controller.ts - Receives webhooks            │
│  • inbound.parser.ts - Normalizes message format        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         CONVERSATION LAYER (Brain)                       │
│  • conversation.service.ts - Main orchestrator          │
│  • intent.service.ts - Detects user intent              │
│  • state.store.ts - Manages conversation state          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         DOMAIN LAYER (Business Logic)                    │
│  • estate-whatsapp.service.ts - Estate operations       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│       SERVICE LAYER (Core Operations)                    │
│  • visitor-code.service.ts - Code generation            │
│  • visitor-card.service.ts - Visual card generation     │
│  • image-upload.service.ts - Cloud image hosting        │
│  • qr-code.service.ts - QR code generation              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              DATABASE (Prisma + PostgreSQL)              │
│  • VisitorCode, Occupant, Unit, Estate tables           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         OUTBOUND LAYER (Response)                        │
│  • messenger.service.ts - Sends messages                │
│  • provider.factory.ts - Provider selection             │
│  • meta.provider.ts / twilio.provider.ts                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    WhatsApp User                         │
│          (Receives code + visitor card)                  │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+
- **WhatsApp Provider** (Meta Cloud API or Twilio)
- **ImgBB API Key** (for image hosting - free)
- **Gemini API Key** (for AI features)

### 1. Clone & Setup

```bash
git clone https://github.com/adhcode/estateai.git
cd estateai
```

### 2. Backend Setup

```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials (see Configuration section)

# Setup database
npx prisma generate
npx prisma db push

# Start development server
npm run start:dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend will be available at `http://localhost:3000`.

### 4. Create Admin User

```bash
cd backend
node create-admin.js
```

Default credentials:
- Email: `admin@estateai.com`
- Password: `Admin@123`

---

## Configuration

### Environment Variables

Create `backend/.env` with the following configuration:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/estateai"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="24h"

# WhatsApp Provider (Choose one: meta or twilio)
WHATSAPP_PROVIDER="meta"

# Meta Cloud API Configuration
META_WA_PHONE_NUMBER_ID="your_phone_number_id"
META_WA_TOKEN="your_access_token"
META_WA_VERIFY_TOKEN="estate_verify_token_2025"

# OR Twilio Configuration
# TWILIO_ACCOUNT_SID="your_twilio_sid"
# TWILIO_AUTH_TOKEN="your_twilio_token"
# TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

# AI Configuration
GEMINI_API_KEY="your_gemini_api_key"

# Image Hosting (ImgBB - RECOMMENDED)
IMGBB_API_KEY="your_imgbb_api_key"

# Optional: Alternative Image Hosts
# CLOUDINARY_CLOUD_NAME="your_cloud_name"
# CLOUDINARY_API_KEY="your_api_key"
# CLOUDINARY_API_SECRET="your_api_secret"

# Application URLs
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
PORT=3001
NODE_ENV="development"
```

### Getting API Keys

#### 1. ImgBB API Key (30 seconds - REQUIRED for images)
1. Visit https://api.imgbb.com/
2. Click "Get API Key"
3. Sign up with your email
4. Copy your API key
5. Add to `.env`: `IMGBB_API_KEY=your_key_here`

**Why ImgBB?**
- Free tier: 32MB storage, unlimited bandwidth
- No rate limits
- Permanent image hosting
- Perfect for visitor cards

#### 2. Meta Cloud API (WhatsApp)
1. Go to https://developers.facebook.com/
2. Create an app with WhatsApp product
3. Get your Phone Number ID and Access Token
4. Configure webhook URL: `https://your-domain.com/api/webhooks/meta/whatsapp`
5. Set verify token: `estate_verify_token_2025`

#### 3. Gemini API Key (AI)
1. Visit https://makersuite.google.com/app/apikey
2. Create a new API key
3. Add to `.env`: `GEMINI_API_KEY=your_key_here`

---

## Estate & Unit Management

### Creating an Estate with Units

EstateAI supports bulk unit creation when setting up a new estate.

#### Frontend Flow

1. **Login as Super Admin**
2. **Navigate to Estates Page** (`/estates`)
3. **Click "Add Estate"**
4. **Fill in Estate Details:**
   - Name: "Sunshine Estate"
   - Address: "123 Main Street"
   - Phone: "+1234567890"
   - Description: "Modern residential estate"

5. **Configure Units:**
   - Total Blocks: `40`
   - Flats per Block: `12`
   - Block Prefix: "Block" (optional)
   - Flat Prefix: "Flat" (optional)
   
6. **Preview:** Shows "Total Units: 480"

7. **Click "Create Estate & Units"**

#### Result

- Estate created successfully
- 480 units created automatically:
  - Block 1, Flat 1
  - Block 1, Flat 2
  - ...
  - Block 40, Flat 12
- All units marked as `isOccupied: false`

#### API Example

```bash
curl -X POST http://localhost:3001/api/estates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Sunshine Estate",
    "address": "123 Main Street",
    "phoneNumber": "+1234567890",
    "description": "Modern residential estate",
    "unitConfig": {
      "totalBlocks": 40,
      "flatsPerBlock": 12,
      "blockPrefix": "Block",
      "flatPrefix": "Flat"
    }
  }'
```

### Unit Management Rules

#### 1. One Primary Resident Per Unit

**Rule:** Each unit can have ONLY ONE primary resident (type: `RESIDENT`).

**Enforcement:**
- When adding a primary resident, system checks if unit already has one
- If a primary resident exists, operation is rejected with error:
  ```
  "This unit already has a primary resident: John Doe. 
   Only one primary resident is allowed per unit."
  ```

**Adding a Primary Resident:**

```bash
curl -X POST http://localhost:3001/api/occupants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "estateId": "estate-id",
    "unitId": "unit-id",
    "type": "RESIDENT"
  }'
```

#### 2. Multiple Household Members

**Rule:** Multiple household members can be added to a unit with a primary resident.

**Requirements:**
- Must be linked to a primary resident (`primaryOccupantId`)
- Primary resident and household member must be in the same unit
- Household members can generate visitor codes via WhatsApp

**Adding a Household Member:**

```bash
curl -X POST http://localhost:3001/api/occupants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "phone": "+0987654321",
    "estateId": "estate-id",
    "unitId": "unit-id",
    "type": "HOUSEHOLD_MEMBER",
    "primaryOccupantId": "primary-resident-id"
  }'
```

#### 3. Deletion Protection

**Rule:** Primary residents cannot be deleted if they have active household members.

**Flow:**
1. Attempt to delete primary resident with household members → **FAILS**
2. Remove all household members first
3. Delete primary resident → **SUCCESS**
4. Unit is marked as `isOccupied: false` and becomes available

### Unit Reconfiguration

Super admins can safely reconfigure units for existing estates.

#### How It Works

1. **View Current Configuration:**
   - Total units
   - Number of blocks and flats per block
   - Occupied vs. available units

2. **Reconfigure Process:**
   - Deletes all **unoccupied** units
   - Preserves all **occupied** units (with residents)
   - Creates new units based on new configuration

3. **Safety Measures:**
   - Occupied units are NEVER deleted
   - Warning shows occupied unit count
   - Confirmation dialog before proceeding

#### Example Scenario

**Current Configuration:**
- 40 blocks × 12 flats = 480 units
- 25 units occupied, 455 available

**New Configuration:**
- 50 blocks × 15 flats = 750 new units

**Result:**
- Keeps 25 occupied units (old structure)
- Deletes 455 unoccupied units
- Creates 750 new units
- **Total: 775 units** (25 old + 750 new)

#### API Endpoints

**Get Current Configuration:**
```bash
GET /estates/:id/units/configuration
```

**Delete Unoccupied Units:**
```bash
DELETE /estates/:id/units/unoccupied
```

**Bulk Create Units:**
```bash
POST /estates/:id/units/bulk-create
Content-Type: application/json

{
  "totalBlocks": 50,
  "flatsPerBlock": 15,
  "blockPrefix": "Block",
  "flatPrefix": "Flat"
}
```

### Database Schema

```prisma
model Estate {
  id          String   @id @default(cuid())
  name        String
  address     String
  phoneNumber String?
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  units       Unit[]
  occupants   Occupant[]
}

model Unit {
  id         String   @id @default(cuid())
  estateId   String
  block      String   // "Block 1"
  flat       String   // "Flat 4"
  isOccupied Boolean  @default(false)
  
  estate     Estate     @relation(fields: [estateId], references: [id])
  occupants  Occupant[]
  
  @@unique([estateId, block, flat])
}

model Occupant {
  id                String       @id @default(cuid())
  name              String
  phone             String?
  email             String?
  estateId          String
  unitId            String
  type              OccupantType @default(RESIDENT)
  primaryOccupantId String?
  isActive          Boolean      @default(true)
  
  estate            Estate        @relation(fields: [estateId], references: [id])
  unit              Unit          @relation(fields: [unitId], references: [id])
  primaryOccupant   Occupant?     @relation("PrimaryOccupant", fields: [primaryOccupantId], references: [id])
  householdMembers  Occupant[]    @relation("PrimaryOccupant")
  visitorCodes      VisitorCode[]
}

enum OccupantType {
  RESIDENT         // Primary resident (ONE per unit)
  HOUSEHOLD_MEMBER // Family members (MANY per unit)
}
```

---

## Visitor Management

### Visitor Access System

EstateAI provides a comprehensive visitor management system with QR codes, time-based access codes, and real-time notifications.

### Visitor Code Lifecycle

```
ACTIVE → USED → DEPARTED
  ↓
REVOKED (cancelled)
  ↓
EXPIRED (time limit reached)
```

#### Status Definitions

- **ACTIVE**: Code generated, not yet used
- **USED**: Visitor verified and entered estate
- **DEPARTED**: Visitor has left (marked by resident)
- **REVOKED**: Code cancelled by resident
- **EXPIRED**: Code passed expiration time

### Generating Visitor Codes

#### Via WhatsApp (Recommended)

1. **Resident sends:** `Hi` or `Hello`
2. **Bot responds** with menu buttons
3. **Resident clicks:** "1️⃣ Register a visitor"
4. **Bot asks:** "Please provide the visitor's name:"
5. **Resident types:** "Sarah Johnson"
6. **Bot generates code** and sends:
   - Text message with code details
   - Beautiful visitor card image with QR code
   - Card includes: visitor name, code, expiry time, resident details

#### Via Admin Panel

1. Navigate to Visitor Management
2. Click "Generate Code"
3. Select resident/unit
4. Enter visitor name and phone (optional)
5. Set expiry time (default: 24 hours)
6. Click "Generate"

#### Via API

```bash
curl -X POST http://localhost:3001/api/visitor-codes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "occupantPhone": "+1234567890",
    "visitorName": "Sarah Johnson",
    "visitorPhone": "+0987654321",
    "validHours": 24
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "code": "ABC123",
    "visitorName": "Sarah Johnson",
    "status": "ACTIVE",
    "expiresAt": "2026-07-27T10:30:00.000Z",
    "cardUrl": "https://i.ibb.co/5WjCLyjN/visitor-card.png"
  }
}
```

### Visitor Verification (Security Gate)

#### Flow

1. **Visitor arrives at gate**
2. **Security staff opens** verification page
3. **Enters visitor code** and name
4. **Clicks "Verify"**
5. **System validates:**
   - Code exists
   - Code is ACTIVE
   - Code not expired
   - Name matches (partial match allowed)
6. **If valid:**
   - Status changes to USED
   - Timestamp recorded
   - Resident receives simple notification:
     ```
     Sarah Johnson is on the way to your place.
     
     Please notify us when they're leaving.
     ```

#### Security Features

- **Active codes hidden**: Security cannot see ACTIVE codes in visitor log (prevents pre-viewing)
- **Name verification**: Must enter visitor name (partial match allowed)
- **Time validation**: Expired codes automatically rejected
- **Audit trail**: All verifications logged with timestamp

### Visitor Departure

#### Via WhatsApp

**By Name:**
```
Resident: Sarah has left
Bot: Sarah has left. Thank you for notifying us!
```

**By Code:**
```
Resident: ABC123 departed
Bot: Sarah Johnson has left. Thank you for notifying us!
```

#### Requirements

- Visitor must have **USED** status (entered the estate)
- Cannot mark departure before entry
- Cannot mark departure twice
- Name or code must match exactly

### Cancelling Visitor Codes

#### Via WhatsApp

**Option 1: Cancel Most Recent**
```
Resident: cancel code
Bot: [Shows most recent visitor with "Cancel [Name]" button]
Resident: [Clicks button]
Bot: Visitor code cancelled successfully.
```

**Option 2: Cancel Other Visitor**
```
Resident: cancel code
Bot: [Shows "Cancel Other" button]
Resident: [Clicks "Cancel Other"]
Bot: [Shows list of all active visitors with buttons]
Resident: [Clicks visitor to cancel]
Bot: Visitor code cancelled successfully.
```

#### Via Admin Panel

1. Navigate to Visitor Codes
2. Find active code
3. Click "Cancel"
4. Confirm cancellation

### Visitor Card Features

The visitor card is a beautiful, professional image sent via WhatsApp containing:

- **Header**: Estate name and logo
- **Visitor Information**: Name, access code
- **QR Code**: Scannable for quick verification
- **Resident Information**: Host name, unit
- **Validity**: Expiration date and time
- **Security Notice**: Instructions for security staff

**Example Card:**
```
┌─────────────────────────────┐
│     SUNSHINE ESTATE         │
│                             │
│   VISITOR ACCESS CARD       │
│                             │
│  👤 Sarah Johnson           │
│  🔑 Code: ABC123            │
│                             │
│       [QR CODE]             │
│                             │
│  🏠 Host: John Doe          │
│  📍 Unit: Block 1, Flat 4   │
│  ⏰ Valid until:            │
│     Jul 27, 2026 10:30 PM   │
│                             │
│  Show this to security      │
└─────────────────────────────┘
```

### Image Hosting

Visitor cards are automatically uploaded to cloud storage for WhatsApp delivery.

**Supported Services:**
1. **ImgBB** (Recommended) - Free, reliable, no rate limits
2. **Imgur** - Free but has rate limits
3. **Telegraph** - Free backup option
4. **Cloudinary** - Premium alternative

**Configuration (ImgBB):**
```bash
IMGBB_API_KEY=your_api_key_here
```

**Fallback Behavior:**
- If image upload fails, system sends text-only code
- All services tried in order until one succeeds
- Detailed error logging for debugging

---

## WhatsApp Integration

### Overview

EstateAI integrates with WhatsApp using a conversational AI approach powered by natural language understanding.

### Supported Providers

- **Meta Cloud API** (Recommended)
- **Twilio**
- Easily extensible to other BSPs

### WhatsApp Features

#### 1. Household Member Management

**Add Member:**
```
Resident: add household member
Bot: What's their full name?
Resident: John Doe
Bot: What's their WhatsApp number?
Resident: +1234567890
Bot: John Doe has been added to your household.
```

**List Members:**
```
Resident: list household members
Bot: Your Household Members (2):

1. John Doe
   Phone: +1234567890

2. Jane Smith
   Phone: +9876543210

To edit a member, type: "Edit [member name]"
```

**Edit Member Phone:**
```
Resident: edit John Doe
Bot: What's the new phone number for John Doe?
Resident: +1111111111
Bot: [Confirmation buttons]
Resident: [Clicks "Yes, Update"]
Bot: John Doe's phone number has been updated!
```

**Remove Member:**
```
Resident: remove John Doe
Bot: [Confirmation]
Resident: [Confirms]
Bot: John Doe has been removed from your household.
```

#### 2. Visitor Code Generation

**Simple Flow:**
```
Resident: generate code for Sarah
Bot: [Sends visitor code + card image]
```

**Interactive Flow:**
```
Resident: generate code
Bot: Please provide the visitor's name:
Resident: Sarah
Bot: [Sends visitor code + card image]
```

**Visitor at Gate:
**
```
Resident: Sarah is at the gate
Bot: [Generate Code button]
Resident: [Clicks button]
Bot: [Sends visitor code + card]
```

#### 3. Check Visitor Status

```
Resident: list my visitors
Bot: Your Active Visitors:

1. Sarah Johnson
   Code: ABC123
   Status: USED
   Entered: 2:30 PM
   
2. Mike Brown
   Code: XYZ789
   Status: ACTIVE
   Expires: 10:00 PM
```

#### 4. Mark Visitor Departure

```
Resident: Sarah has left
Bot: Sarah has left. Thank you for notifying us!
```

### Intent Detection

The system uses AI to understand natural language commands:

| Intent | Example Phrases |
|--------|----------------|
| Generate Code | "generate code for Sarah", "Sarah is visiting", "create visitor code" |
| List Visitors | "my visitors", "show codes", "active visitors" |
| Cancel Code | "cancel code", "revoke access", "delete visitor" |
| Mark Departure | "Sarah has left", "visitor leaving", "ABC123 departed" |
| Add Household | "add household member", "add family member" |
| Edit Household | "edit John", "update John's phone", "change number" |
| List Household | "list household members", "show family", "my household" |
| Help | "help", "menu", "what can you do" |

### Conversation State Management

The system maintains conversation state to handle multi-step flows:

```typescript
type ConversationState = 
  | 'idle'
  | 'AWAITING_VISITOR_NAME'
  | 'AWAITING_CANCEL_INFO'
  | 'AWAITING_HOUSEHOLD_NAME'
  | 'AWAITING_HOUSEHOLD_PHONE'
  | 'AWAITING_EDIT_MEMBER_NAME'
  | 'AWAITING_NEW_PHONE'
```

**Example State Flow:**
```
State: idle
User: "generate code"
→ State: AWAITING_VISITOR_NAME
User: "Sarah"
→ State: idle (code generated)
```

### Message Types

#### Text Messages
Simple text responses from the bot.

#### Interactive Buttons
Clickable buttons for quick actions:
```typescript
{
  type: 'button',
  body: { text: 'What would you like to do?' },
  action: {
    buttons: [
      { id: 'generate_code', title: 'Register Visitor' },
      { id: 'list_visitors', title: 'My Visitors' },
      { id: 'household', title: 'Household' }
    ]
  }
}
```

#### Media Messages
Images (visitor cards) with captions.

### Webhook Configuration

#### Meta Cloud API

1. **Webhook URL**: `https://your-domain.com/api/webhooks/meta/whatsapp`
2. **Verify Token**: Set in `.env` as `META_WA_VERIFY_TOKEN`
3. **Subscribe to**: `messages` webhook field

#### Twilio

1. **Webhook URL**: `https://your-domain.com/api/webhooks/twilio/whatsapp`
2. **HTTP Method**: POST
3. **Content Type**: application/x-www-form-urlencoded

### Testing WhatsApp Integration

**Test Script:**
```bash
cd backend
node test-whatsapp-integration.js
```

**Manual Testing:**
1. Send "Hi" to your WhatsApp bot number
2. Should receive welcome message with buttons
3. Click "Register Visitor" and follow prompts
4. Verify visitor card is received

---

## Security Features

### 1. Authentication & Authorization

#### JWT-based Authentication

```typescript
// Login
POST /auth/login
{
  "email": "admin@estateai.com",
  "password": "Admin@123"
}

// Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "admin@estateai.com",
    "role": "SUPER_ADMIN"
  }
}
```

#### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|------------|
| **SUPER_ADMIN** | Create/edit estates, manage admins, full system access |
| **ESTATE_ADMIN** | Manage own estate, add/remove residents, view reports |
| **SECURITY** | Verify visitors, view visitor log, access security dashboard |
| **RESIDENT** | Generate visitor codes via WhatsApp, manage household |

### 2. Security Measures

#### Active Code Protection

**Problem:** Security staff could see visitor codes before visitors arrive (security breach).

**Solution:** Active codes are hidden in the visitor log:
```
ACTIVE: "Code hidden until verified"
USED: "Code: ABC123"
```

This ensures security staff must wait for visitor to present their code.

#### Input Validation

All inputs validated using `class-validator`:
```typescript
export class GenerateVisitorCodeDto {
  @IsString()
  @IsNotEmpty()
  visitorName: string;

  @IsPhoneNumber()
  @IsOptional()
  visitorPhone?: string;

  @IsNumber()
  @Min(1)
  @Max(720)
  validHours: number = 24;
}
```

#### Rate Limiting

```typescript
@UseGuards(RateLimitGuard)
@RateLimit({ ttl: 60, limit: 10 }) // 10 requests per minute
```

#### SQL Injection Prevention

Using Prisma ORM with parameterized queries:
```typescript
// Safe - Prisma handles parameterization
const unit = await prisma.unit.findUnique({
  where: { id: unitId }
});
```

#### Security Headers

```typescript
// Helmet.js configuration
app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: true,
  xssFilter: true
}));
```

### 3. Audit Logging

All critical operations are logged:
```typescript
logger.log('Visitor code generated', {
  occupantId: occupant.id,
  visitorName: params.visitorName,
  code: visitorCode.code,
  timestamp: new Date()
});
```

**Logged Events:**
- User authentication
- Visitor code generation
- Visitor verification
- Code cancellation
- Resident/household changes
- Estate modifications

---

## Deployment

### Local Development

Already covered in [Quick Start](#quick-start).

### Railway Deployment (Recommended)

Railway provides easy deployment with automatic scaling.

#### Step 1: Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/estateai.git
git branch -M main
git push -u origin main
```

#### Step 2: Deploy to Railway

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Railway auto-detects NestJS

#### Step 3: Configure Environment Variables

In Railway dashboard, add all variables from `.env`:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
META_WA_PHONE_NUMBER_ID=...
META_WA_TOKEN=...
GEMINI_API_KEY=...
IMGBB_API_KEY=...
# ... etc
```

**IMPORTANT:** Don't set `BACKEND_URL` yet - Railway will generate it.

#### Step 4: Run Database Migrations

In Railway terminal:
```bash
npx prisma migrate deploy
```

#### Step 5: Create Admin User

```bash
node create-admin.js
```

#### Step 6: Update BACKEND_URL

1. Copy your Railway URL (e.g., `https://estateai-production.up.railway.app`)
2. Add as environment variable: `BACKEND_URL=https://your-app.railway.app`
3. Redeploy

#### Step 7: Update WhatsApp Webhook

Update Meta Developer Console with your Railway URL:
```
https://your-app.railway.app/api/webhooks/meta/whatsapp
```

#### Step 8: Test Deployment

```bash
# Health check
curl https://your-app.railway.app/health

# WhatsApp webhook
curl https://your-app.railway.app/api/webhooks/meta/whatsapp/health

# Test WhatsApp
# Send a message to your bot
```

### Docker Deployment

```bash
# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop
docker-compose down
```

### Production Checklist

- [ ] All environment variables configured
- [ ] Database migrations deployed
- [ ] Admin user created
- [ ] WhatsApp webhook configured
- [ ] Image hosting working (ImgBB)
- [ ] SSL certificate active
- [ ] Health endpoints responding
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Error tracking enabled

---

## Testing

### Running Tests

```bash
# Backend unit tests
cd backend
npm run test

# E2E tests
npm run test:e2e

# Frontend tests
cd frontend
npm test
```

### Manual Testing Guide

#### Estate & Unit Setup

1. **Create estate with 40 blocks × 12 flats**
   - Expected: 480 units created
   - Verify: All units have unique (estateId, block, flat)

2. **Add primary resident to unit**
   - Expected: Unit marked as occupied
   - Verify: Cannot add second primary resident

3. **Add household member**
   - Expected: Member linked to primary resident
   - Verify: Member can generate codes via WhatsApp

4. **Try deleting primary resident with household members**
   - Expected: Error "Cannot delete primary resident with active household members"

5. **Remove household members, then primary resident**
   - Expected: Success, unit marked as unoccupied

#### Visitor Management

1. **Generate visitor code via WhatsApp**
   ```
   Send: "Hi"
   Click: "Register Visitor"
   Type: "Sarah Johnson"
   ```
   - Expected: Code + visitor card image received
   - Verify: Code status is ACTIVE

2. **Security verifies visitor**
   - Navigate to security verification page
   - Enter code and name
   - Click "Verify"
   - Expected: Status changes to USED
   - Expected: Resident receives: "Sarah Johnson is on the way to your place."

3. **Mark visitor departure**
   ```
   Send: "Sarah has left"
   ```
   - Expected: Status changes to DEPARTED
   - Expected: "Sarah has left. Thank you for notifying us!"

4. **Cancel visitor code**
   ```
   Send: "cancel code"
   Click: "Cancel [Visitor]"
   ```
   - Expected: Status changes to REVOKED
   - Expected: Code no longer works

#### Household Management

1. **Add household member via WhatsApp**
   ```
   Send: "add household member"
   Type: "John Doe"
   Type: "+1234567890"
   Click: "Yes, Save"
   ```
   - Expected: Member added successfully
   - Verify: +1234567890 can now generate codes

2. **Edit household member phone**
   ```
   Send: "edit John Doe"
   Type: "+1111111111"
   Click: "Yes, Update"
   ```
   - Expected: Phone updated
   - Verify: Old number stops working
   - Verify: New number works

3. **List household members**
   ```
   Send: "list household members"
   ```
   - Expected: Shows all members with edit instructions

### Test Data Scripts

**Create Test Estate:**
```bash
curl -X POST http://localhost:3001/api/estates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Estate",
    "address": "123 Test St",
    "unitConfig": {
      "totalBlocks": 5,
      "flatsPerBlock": 4
    }
  }'
```

**Create Test Resident:**
```bash
curl -X POST http://localhost:3001/api/occupants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Resident",
    "phone": "+1234567890",
    "estateId": "ESTATE_ID",
    "unitId": "UNIT_ID",
    "type": "RESIDENT"
  }'
```

---

## Troubleshooting

### Common Issues

#### 1. WhatsApp Messages Not Received

**Symptoms:**
- No response from bot
- Webhook not triggered

**Solutions:**
1. Verify webhook URL is public and accessible
2. Check Meta/Twilio webhook configuration
3. Verify verify token matches `.env` value
4. Check backend logs: `npm run start:dev`
5. Test webhook endpoint:
   ```bash
   curl https://your-domain.com/api/webhooks/meta/whatsapp/health
   ```

#### 2. Image Upload Failing (404 Error)

**Symptoms:**
- Visitor card image not showing in WhatsApp
- "404 Not Found" error in logs

**Solutions:**
1. **Get ImgBB API key** (30 seconds):
   - Visit https://api.imgbb.com/
   - Sign up and copy API key
   - Add to `.env`: `IMGBB_API_KEY=your_key`
   - Restart backend

2. **Test image upload:**
   ```bash
   cd backend
   node test-image-upload.js
   ```

3. **Check logs** for upload errors
4. **Verify internet connectivity** from server

#### 3. "Unit Already Has Primary Resident" Error

**Symptoms:**
- Cannot add resident to unit
- Error message about existing primary resident

**Solutions:**
1. **Verify unit occupancy:**
   - Check if unit already has a resident
   - Use admin panel to view unit details

2. **Add as household member instead:**
   - If intentional, add as HOUSEHOLD_MEMBER type
   - Link to existing primary resident

3. **Choose different unit:**
   - Select an unoccupied unit
   - Use "Available Units" filter

#### 4. Estate Admin Dropdown Not Working

**Symptoms:**
- Dropdown shows no estates
- Cannot select estate

**Solutions:**
1. **Create an estate first:**
   - Navigate to Estates page
   - Click "Add Estate"
   - Fill in details and create

2. **Check backend connection:**
   ```bash
   curl http://localhost:3001/api/estates
   ```

3. **Check browser console** for errors (F12)

4. **Direct link alternative:**
   - Go to: `http://localhost:3000/estates/ESTATE_ID/admin`
   - Replace ESTATE_ID with actual ID

#### 5. Visitor Departure Not Working

**Symptoms:**
- "Visitor not found" error
- Cannot mark visitor as departed

**Solutions:**
1. **Verify visitor has entered:**
   - Visitor must have USED status (verified by security)
   - Cannot mark departure before entry

2. **Check visitor name:**
   - Use exact name or code
   - Commands: "Sarah has left" or "ABC123 departed"

3. **View active visitors:**
   ```
   Send: "list my visitors"
   ```

#### 6. Database Connection Issues

**Symptoms:**
- "Cannot connect to database" error
- Prisma errors in logs

**Solutions:**
1. **Verify DATABASE_URL** in `.env`
2. **Check PostgreSQL is running:**
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```

3. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

4. **Test connection:**
   ```bash
   npx prisma db push
   ```

### Debug Mode

Enable detailed logging:

```bash
# In backend/.env
NODE_ENV=development
LOG_LEVEL=debug
```

View logs:
```bash
# Development
npm run start:dev

# Production (Railway)
railway logs
```

### Getting Help

1. **Check logs** first (backend console or Railway logs)
2. **Search existing issues** on GitHub
3. **Create new issue** with:
   - Error message
   - Steps to reproduce
   - Environment (OS, Node version, etc.)
   - Relevant logs

---

## API Reference

### Authentication

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@estateai.com",
  "password": "Admin@123"
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "admin@estateai.com",
    "role": "SUPER_ADMIN"
  }
}
```

#### Get Profile
```http
GET /auth/profile
Authorization: Bearer {access_token}

Response: 200 OK
{
  "id": "user-id",
  "email": "admin@estateai.com",
  "role": "SUPER_ADMIN"
}
```

### Estates

#### List Estates
```http
GET /estates
Authorization: Bearer {access_token}

Response: 200 OK
[
  {
    "id": "estate-id",
    "name": "Sunshine Estate",
    "address": "123 Main St",
    "phoneNumber": "+1234567890",
    "isActive": true,
    "unitCount": 480,
    "occupiedCount": 25
  }
]
```

#### Create Estate with Units
```http
POST /estates
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Sunshine Estate",
  "address": "123 Main Street",
  "phoneNumber": "+1234567890",
  "description": "Modern residential estate",
  "unitConfig": {
    "totalBlocks": 40,
    "flatsPerBlock": 12,
    "blockPrefix": "Block",
    "flatPrefix": "Flat"
  }
}

Response: 201 Created
{
  "id": "estate-id",
  "name": "Sunshine Estate",
  "units": 480
}
```

#### Get Estate Details
```http
GET /estates/:id
Authorization: Bearer {access_token}

Response: 200 OK
{
  "id": "estate-id",
  "name": "Sunshine Estate",
  "address": "123 Main Street",
  "phoneNumber": "+1234567890",
  "description": "Modern residential estate",
  "isActive": true,
  "unitCount": 480,
  "occupiedCount": 25,
  "createdAt": "2026-07-20T10:00:00.000Z"
}
```

#### Update Estate
```http
PATCH /estates/:id
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Updated Name",
  "address": "Updated Address"
}

Response: 200 OK
{
  "id": "estate-id",
  "name": "Updated Name",
  "address": "Updated Address"
}
```

### Units

#### Get Unit Configuration
```http
GET /estates/:id/units/configuration
Authorization: Bearer {access_token}

Response: 200 OK
{
  "totalUnits": 480,
  "totalBlocks": 40,
  "flatsPerBlock": 12,
  "occupiedUnits": 25,
  "availableUnits": 455,
  "blockPrefix": "Block",
  "flatPrefix": "Flat"
}
```

#### Get Available Units
```http
GET /units/available/:estateId
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "unit-id",
      "block": "Block 1",
      "flat": "Flat 2",
      "isOccupied": false
    }
  ]
}
```

#### Bulk Create Units
```http
POST /estates/:id/units/bulk-create
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "totalBlocks": 40,
  "flatsPerBlock": 12,
  "blockPrefix": "Block",
  "flatPrefix": "Flat"
}

Response: 201 Created
{
  "success": true,
  "unitsCreated": 480
}
```

### Occupants

#### Create Occupant (Primary Resident)
```http
POST /occupants
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "estateId": "estate-id",
  "unitId": "unit-id",
  "type": "RESIDENT"
}

Response: 201 Created
{
  "id": "occupant-id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "type": "RESIDENT",
  "unit": {
    "block": "Block 1",
    "flat": "Flat 4"
  }
}
```

#### Create Household Member
```http
POST /occupants
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Jane Doe",
  "phone": "+0987654321",
  "estateId": "estate-id",
  "unitId": "unit-id",
  "type": "HOUSEHOLD_MEMBER",
  "primaryOccupantId": "primary-resident-id"
}

Response: 201 Created
{
  "id": "occupant-id",
  "name": "Jane Doe",
  "phone": "+0987654321",
  "type": "HOUSEHOLD_MEMBER",
  "primaryOccupant": {
    "name": "John Doe"
  }
}
```

#### List Occupants by Estate
```http
GET /occupants/estate/:estateId
Authorization: Bearer {access_token}

Response: 200 OK
[
  {
    "id": "occupant-id",
    "name": "John Doe",
    "phone": "+1234567890",
    "type": "RESIDENT",
    "unit": {
      "block": "Block 1",
      "flat": "Flat 4"
    },
    "householdMembers": [
      {
        "id": "member-id",
        "name": "Jane Doe",
        "phone": "+0987654321"
      }
    ]
  }
]
```

### Visitor Codes

#### Generate Visitor Code
```http
POST /visitor-codes/generate
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "occupantPhone": "+1234567890",
  "visitorName": "Sarah Johnson",
  "visitorPhone": "+0987654321",
  "validHours": 24
}

Response: 201 Created
{
  "success": true,
  "data": {
    "code": "ABC123",
    "visitorName": "Sarah Johnson",
    "status": "ACTIVE",
    "expiresAt": "2026-07-27T10:30:00.000Z",
    "cardUrl": "https://i.ibb.co/5WjCLyjN/visitor-card.png",
    "resident": {
      "name": "John Doe",
      "unit": "Block 1, Flat 4"
    }
  }
}
```

#### Validate Visitor Code
```http
POST /visitor-codes/validate
Content-Type: application/json

{
  "code": "ABC123",
  "visitorName": "Sarah"
}

Response: 200 OK
{
  "success": true,
  "message": "Access granted",
  "visitor": {
    "name": "Sarah Johnson",
    "code": "ABC123",
    "resident": {
      "name": "John Doe",
      "unit": "Block 1, Flat 4"
    },
    "validUntil": "2026-07-27T10:30:00.000Z"
  }
}
```

#### Cancel Visitor Code
```http
POST /visitor-codes/cancel
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "occupantPhone": "+1234567890",
  "code": "ABC123"
}

Response: 200 OK
{
  "success": true,
  "message": "Visitor code cancelled successfully"
}
```

#### List Visitor Codes
```http
GET /visitor-codes/occupant/:phone
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "code-id",
      "code": "ABC123",
      "visitorName": "Sarah Johnson",
      "status": "ACTIVE",
      "expiresAt": "2026-07-27T10:30:00.000Z",
      "createdAt": "2026-07-26T10:30:00.000Z"
    }
  ]
}
```

### WhatsApp Webhooks

#### Meta Cloud API Webhook
```http
POST /api/webhooks/meta/whatsapp
Content-Type: application/json

{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "1234567890",
                "text": {
                  "body": "Hi"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}

Response: 200 OK
{
  "success": true
}
```

#### Webhook Health Check
```http
GET /api/webhooks/meta/whatsapp/health

Response: 200 OK
{
  "status": "healthy",
  "timestamp": "2026-07-26T10:30:00.000Z"
}
```

---

## Tech Stack

### Backend
- **Framework**: NestJS 10+
- **Database**: PostgreSQL 14+ with Prisma ORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator, class-transformer
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Supertest
- **Image Generation**: Canvas, Sharp
- **QR Codes**: qrcode library
- **PDF Generation**: PDFKit

### Frontend
- **Framework**: React 18+ / Next.js 13+
- **Language**: TypeScript
- **Routing**: React Router / Next.js App Router
- **HTTP Client**: Axios
- **Styling**: TailwindCSS, CSS Modules
- **State Management**: React Context
- **Icons**: Lucide React
- **Testing**: React Testing Library

### External Services
- **WhatsApp**: Meta Cloud API / Twilio
- **AI/NLU**: Google Gemini AI
- **Image Hosting**: ImgBB (primary), Imgur, Telegraph, Cloudinary
- **Database Hosting**: Neon PostgreSQL (recommended for production)

### DevOps
- **Deployment**: Railway, Docker
- **Version Control**: Git, GitHub
- **CI/CD**: GitHub Actions (optional)
- **Monitoring**: Railway metrics, custom logging

---

## Contributing

We welcome contributions! Here's how you can help:

### Development Workflow

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/estateai.git
   ```

3. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make your changes**
5. **Add tests** for new features
6. **Run tests:**
   ```bash
   npm run test
   ```

7. **Commit your changes:**
   ```bash
   git commit -m "feat: add your feature"
   ```

8. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

9. **Create a Pull Request**

### Code Standards

- **TypeScript strict mode** enabled
- **ESLint + Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Test coverage** > 80%
- **Documentation** for all public APIs

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(visitor): add visitor departure tracking
fix(whatsapp): resolve household member edit flow
docs(readme): update deployment instructions
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Author

**Abdulhakeem Dhikrullah**
- GitHub: [@adhcode](https://github.com/adhcode)
- LinkedIn: [Abdulhakeem Dhikrullah](https://linkedin.com/in/adhcode)

---

## Acknowledgments

- **NestJS** team for the amazing framework
- **Prisma** team for the excellent ORM
- **Meta** for WhatsApp Cloud API
- **Google** for Gemini AI
- **React** team for the frontend framework
- **Railway** for easy deployment platform

---

## Support & Community

- **Documentation**: This file
- **Issues**: [GitHub Issues](https://github.com/adhcode/estateai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/adhcode/estateai/discussions)

---

<div align="center">
  <strong>Built with ❤️ for modern estate management</strong>
  
  If this project helped you, please give it a ⭐️!
</div>
