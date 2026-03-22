# EstateAI - Next.js Frontend

A modern, beautiful estate management application built with Next.js 14, TypeScript, and Tailwind CSS.

## ✨ Features

### 🎨 Modern Design
- **Beautiful gradient backgrounds** and glass morphism effects
- **Responsive design** that works on all devices
- **Smooth animations** and hover effects
- **Professional UI components** with shadcn/ui

### 🔐 Authentication & Authorization
- **Role-based access control** (Super Admin, Estate Admin, Security)
- **Protected routes** with automatic redirects
- **Demo credentials** for easy testing

### 📱 Pages & Features
- **Modern Login Page** - Beautiful, responsive login with demo credentials
- **Dashboard** - Role-specific dashboards with stats and quick actions
- **Estate Management** - For super admins to manage properties
- **Resident Management** - For estate admins to manage residents
- **Visitor Management** - QR code generation and tracking
- **Security Features** - Visitor verification and logs
- **Settings** - Comprehensive configuration options
- **Analytics** - Platform-wide insights and metrics

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone and navigate to the project
cd nextjs-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` - you'll be redirected to the login page.

## 🔑 Demo Credentials

### Super Admin
- **Email**: `admin@estateai.com`
- **Password**: `admin123`
- **Access**: Full platform management

### Estate Admin  
- **Email**: `estate@estateai.com`
- **Password**: `estate123`
- **Access**: Estate and resident management

### Security
- **Email**: `security@estateai.com`
- **Password**: `security123`
- **Access**: Visitor verification and logs

## 🏗️ Project Structure

```
nextjs-frontend/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # Protected dashboard routes
│   │   ├── dashboard/         # Main dashboard
│   │   ├── super-admin/       # Super admin pages
│   │   ├── admin/             # Estate admin pages
│   │   ├── security/          # Security pages
│   │   ├── analytics/         # Analytics page
│   │   └── settings/          # Settings page
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Root redirect page
├── components/
│   ├── ui/                    # Reusable UI components
│   └── Navigation.tsx         # Main navigation
├── contexts/
│   └── AuthContext.tsx        # Authentication context
├── services/                  # API services
└── types/                     # TypeScript definitions
```

## 🎯 Key Features by Role

### Super Admin
- ✅ Manage all estates
- ✅ Create estate administrators  
- ✅ View platform analytics
- ✅ System configuration

### Estate Admin
- ✅ Manage residents
- ✅ Generate visitor codes
- ✅ Manage security staff
- ✅ WhatsApp integration

### Security
- ✅ Verify visitor codes
- ✅ View visitor logs
- ✅ Track entry/exit times
- ✅ Emergency alerts

## 🛠️ Built With

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible components
- **Lucide React** - Modern icon library
- **Axios** - HTTP client for API calls

## 🎨 Design System

### Colors
- **Primary**: Blue gradient (`from-blue-600 via-purple-600 to-indigo-600`)
- **Background**: Subtle gradients (`from-slate-50 via-blue-50 to-indigo-50`)
- **Cards**: Glass morphism (`bg-white/80 backdrop-blur-xl`)

### Typography
- **Headings**: Bold gradients with proper hierarchy
- **Body**: Clean, readable text with proper contrast
- **Code**: Monospace font for technical content

## 📱 Responsive Design

- **Mobile First** - Optimized for mobile devices
- **Tablet Support** - Perfect layout for tablets
- **Desktop** - Full-featured desktop experience
- **Large Screens** - Scales beautifully on large displays

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Setup
The app is configured to work with the NestJS backend. Update API endpoints in the services files as needed.

## 🚀 Deployment

The app is ready for deployment on platforms like:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Docker** containers

## 📄 License

This project is part of the EstateAI platform.