# 🏢 EstateAI - Intelligent Estate Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0+-red)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18.0+-blue)](https://reactjs.org/)

> A comprehensive AI-powered estate management system with WhatsApp integration, intelligent visitor management, and real-time security features.

## 🌟 Features

### 🤖 AI-Powered Messaging
- **WhatsApp Integration**: Provider-agnostic (Meta, Twilio, BSPs)
- **Dialogflow NLU**: Professional natural language understanding
- **Smart Intent Recognition**: Automatic parsing of visitor requests
- **Multi-provider Support**: Switch providers in 1 minute

### 🎫 Advanced Visitor Management
- **QR Code Generation**: Dynamic QR codes for contactless entry
- **Time-based Access Codes**: Secure, expiring visitor codes
- **Real-time Notifications**: Instant alerts to residents and security
- **Visitor Lifecycle Tracking**: Complete journey from arrival to departure

### 🏢 Estate Operations
- **Multi-tenant Architecture**: Support for multiple estates
- **Role-based Access Control**: Admin, Security, and Resident roles
- **Unit Management**: Comprehensive property and occupant tracking
- **Security Dashboard**: Real-time monitoring and access control

### 🔒 Enterprise Security
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against abuse and attacks
- **Input Validation**: Comprehensive data sanitization
- **Audit Logging**: Complete activity tracking

## 🏗️ Architecture

```
EstateAI/
├── 🔧 backend/                 # NestJS API Server
│   ├── src/
│   │   ├── ai-message/         # AI & WhatsApp integration
│   │   ├── auth/               # Authentication & authorization
│   │   ├── visitor-code/       # Visitor management & QR codes
│   │   ├── estates/            # Estate management
│   │   ├── units/              # Property unit management
│   │   ├── occupants/          # Resident management
│   │   ├── admin/              # Administrative functions
│   │   └── common/             # Shared utilities & middleware
│   ├── prisma/                 # Database schema & migrations
│   └── docs/                   # API documentation
│
├── ⚛️ frontend/                # React Web Application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── contexts/           # React contexts
│   │   └── utils/              # Utility functions
│   └── public/                 # Static assets
│
└── 📚 docs/                    # Project documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Twilio Account (for WhatsApp)
- OpenAI API Key (for AI features)

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
# Edit .env with your database and API credentials

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

### 4. WhatsApp Integration

Follow the [WhatsApp Setup Guide](./WHATSAPP_SETUP_GUIDE.md) to configure Twilio integration.

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/estateai"

# Authentication
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="24h"

# Twilio WhatsApp
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

# OpenAI
OPENAI_API_KEY="your-openai-key"

# Application
PORT=3001
NODE_ENV="development"
```

## 📱 API Documentation

### Core Endpoints

#### Authentication
```http
POST /auth/login          # User login
POST /auth/register       # User registration
GET  /auth/profile        # Get user profile
```

#### Visitor Management
```http
POST /visitor-codes/generate    # Generate visitor code
POST /visitor-codes/validate    # Validate visitor access
GET  /visitor-codes/qr/:id      # Get QR code image
POST /ai-message/whatsapp       # WhatsApp webhook
```

#### Estate Management
```http
GET    /estates                 # List estates
POST   /estates                 # Create estate
GET    /estates/:id/stats       # Estate statistics
GET    /units/estate/:id        # Units by estate
```

For complete API documentation, see [API_ENDPOINTS.md](./backend/API_ENDPOINTS.md).

## 🤖 AI Features

### WhatsApp Bot Commands

The AI assistant understands natural language and responds to:

- **Visitor Registration**: "Hi, I'm John visiting Mary in Block A"
- **Code Requests**: "Can you generate my access code?"
- **Status Inquiries**: "What's my visitor status?"
- **Departure Notifications**: "I'm leaving now"

### Intent Recognition

The system automatically parses and responds to:
- Visitor arrivals and departures
- Code generation requests
- Status inquiries
- Emergency situations

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e

# Frontend tests
cd frontend
npm test
```

### Manual Testing

Use the provided test scripts:

```bash
# Test WhatsApp integration
./test-whatsapp-integration.sh

# Complete workflow test
./test-setup.sh
```

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
   ```bash
   NODE_ENV=production
   DATABASE_URL="your-production-db-url"
   ```

2. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

3. **Build Applications**
   ```bash
   # Backend
   npm run build
   npm run start:prod
   
   # Frontend
   npm run build
   ```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🔒 Security

### Implemented Security Measures

- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Comprehensive DTO validation
- **Rate Limiting**: API endpoint protection
- **CORS**: Configured for production
- **Security Headers**: Helmet.js integration
- **SQL Injection Prevention**: Prisma ORM protection

### Security Best Practices

- Regular dependency updates
- Environment variable protection
- Secure session management
- API versioning
- Audit logging

## 📊 Performance

### Optimization Features

- **Database Indexing**: Optimized queries
- **Caching**: Redis integration ready
- **Connection Pooling**: Database optimization
- **Lazy Loading**: Frontend optimization
- **Code Splitting**: Bundle optimization

### Monitoring

- Request/response logging
- Error tracking
- Performance metrics
- Health checks

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md).

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Standards

- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- Test coverage > 80%

## 📚 Documentation

- [API Documentation](./backend/API_ENDPOINTS.md)
- [WhatsApp Setup Guide](./WHATSAPP_SETUP_GUIDE.md)
- [Security Admin Guide](./SECURITY_ADMIN_GUIDE.md)
- [Testing Guide](./backend/TESTING_GUIDE.md)
- [Optimization Guide](./backend/OPTIMIZATION_GUIDE.md)

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS 10+
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript
- **Routing**: React Router
- **HTTP Client**: Axios
- **Styling**: CSS Modules
- **Testing**: React Testing Library

### External Services
- **WhatsApp**: Twilio API
- **AI**: OpenAI GPT
- **QR Codes**: qrcode library
- **File Storage**: Local/Cloud ready

## 📈 Roadmap

### Phase 1 (Current)
- ✅ Core estate management
- ✅ WhatsApp integration
- ✅ AI-powered messaging
- ✅ QR code generation

### Phase 2 (Planned)
- 🔄 Mobile application
- 🔄 Advanced analytics
- 🔄 Integration APIs
- 🔄 Multi-language support

### Phase 3 (Future)
- 📋 IoT device integration
- 📋 Advanced reporting
- 📋 Machine learning insights
- 📋 Enterprise features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 👨‍💻 Author

**Abdulhakeem Dhikrullah**
- GitHub: [@adhcode](https://github.com/adhcode)
- LinkedIn: [Abdulhakeem Dhikrullah](https://linkedin.com/in/adhcode)
- Email: [email]

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- Prisma team for the excellent ORM
- Twilio for WhatsApp API
- OpenAI for AI capabilities
- React team for the frontend framework

---

<div align="center">
  <strong>Built with ❤️ for modern estate management</strong>
</div>