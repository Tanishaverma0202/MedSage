# MedSage - AI-Powered Holistic Health Management Platform

![MedSage](https://img.shields.io/badge/version-1.0.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-ES2022-blue) ![Node](https://img.shields.io/badge/node-v18+-green) ![React](https://img.shields.io/badge/React-18+-61DAFB)

## 📋 Project Overview

**MedSage** is a comprehensive full-stack health and wellness management application that leverages AI to provide personalized health insights, fitness guidance, nutrition planning, and mental health support. It combines modern web technologies with advanced AI capabilities to create an integrated health companion that tracks and analyzes multiple health dimensions.

### Core Value Proposition
- **AI-Powered Personalization**: Google Generative AI for intelligent health recommendations
- **Holistic Health Tracking**: Monitor fitness, nutrition, mental health, hormones, and sleep
- **Interactive Chat Interface**: Real-time health consultations with AI
- **Detailed Health Reports**: Comprehensive analytics and insights
- **Community Features**: Discussions and shared health challenges

---

## 🚀 Key Features

### 1. **Authentication & User Management**
- Secure registration and login with JWT tokens
- OTP verification for email verification
- Role-based access control
- Token refresh mechanism
- Password hashing with bcryptjs

### 2. **AI-Powered Chat**
- Conversational health advisor
- Real-time responses
- Context-aware recommendations
- Memory management for conversation history

### 3. **Health Tracking**
- **Workout Module**: Exercise logging, workout plans, fitness goals
- **Nutrition Module**: Meal tracking, macro analysis, dietary recommendations
- **Mental Health**: Mood tracking, stress assessment, wellness routines
- **Hormone Tracking**: Cycle tracking, hormonal health insights
- **Sleep Monitoring**: Sleep quality and duration tracking
- **Task Management**: Health goals and habit formation

### 4. **Analytics & Reports**
- Health score calculation
- Performance trends
- Personalized insights
- PDF report generation
- Data visualization

### 5. **Community Features**
- Health discussions and forums
- Shared health challenges
- Community support groups

### 6. **Advanced Capabilities**
- AI-powered fitness recommendations
- Nutritional AI analysis
- Mental health AI support
- Real-time notifications
- Rate limiting and security

---

## 🛠️ Technology Stack

### **Frontend**
| Technology | Purpose | Version |
|-----------|---------|---------|
| React | UI Framework | 18+ |
| TypeScript | Type Safety | ES2022 |
| Vite | Build Tool | Latest |
| Tailwind CSS | Styling | 4.1.14 |
| React Router | Routing | Latest |
| Radix UI | Component Library | 1.x |
| Three.js / React Three Fiber | 3D Graphics | Latest |
| Framer Motion | Animations | 12.38.0 |
| GSAP | Advanced Animations | 3.14.2 |
| Axios | HTTP Client | 1.7.9 |
| Lucide React | Icons | 0.546.0 |

### **Backend**
| Technology | Purpose | Version |
|-----------|---------|---------|
| Node.js | Runtime | 18+ |
| Express.js | Web Framework | 4.21.2 |
| TypeScript | Type Safety | ES2022 |
| MongoDB | Database | via Mongoose 8.13.2 |
| Mongoose | ODM | 8.13.2 |
| Google Generative AI | AI Engine | 0.24.1 |
| JWT | Authentication | 9.0.2 |
| bcryptjs | Password Hashing | 3.0.2 |
| Redis | Caching | via ioredis 5.6.1 |
| Bull | Job Queue | 4.16.5 |
| PDFKit | PDF Generation | 0.17.5 |
| Nodemailer | Email Service | 6.x |

### **DevOps & Quality**
| Tool | Purpose |
|------|---------|
| Jest | Testing Framework |
| ESLint | Code Linting |
| TypeScript Compiler | Type Checking |
| Docker | Containerization (recommended) |

---

## 📁 Project Structure

```
MedSage/
├── frontend/
│   ├── src/
│   │   ├── pages/               # Route pages (Home, Chat, Reports, etc.)
│   │   │   ├── auth/           # Authentication pages (Login, SignUp, OTP)
│   │   ├── components/          # Reusable React components
│   │   │   ├── Layout.tsx       # Main layout wrapper
│   │   │   ├── MedSageLogo.tsx
│   │   │   └── Background3D.tsx # 3D visual effects
│   │   ├── context/            # React Context (AppContext)
│   │   ├── services/           # API communication layer
│   │   ├── utils/              # Helper functions
│   │   │   ├── healthScore.ts
│   │   │   └── healthScoreCalculator.ts
│   │   ├── data/               # Static data
│   │   ├── assets/             # Images, fonts, etc.
│   │   ├── App.tsx             # Main app component
│   │   ├── main.tsx            # Entry point
│   │   └── index.css           # Global styles
│   ├── index.html
│   ├── vite.config.ts          # Vite configuration
│   └── tsconfig.json
│
├── backend/
│   ├── server.ts               # Express app initialization
│   ├── index.ts                # Server entry point
│   ├── contracts/
│   │   └── api-contracts.ts    # API endpoint definitions (single source of truth)
│   ├── controllers/            # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── chat.controller.ts
│   │   ├── nutrition.controller.ts
│   │   ├── workout.controller.ts
│   │   ├── mental-health.controller.ts
│   │   ├── hormone.controller.ts
│   │   ├── task.controller.ts
│   │   ├── reports.controller.ts
│   │   ├── discussion.controller.ts
│   │   ├── health.controller.ts
│   │   ├── insights.controller.ts
│   │   ├── mentalhealth.ai.controller.ts
│   │   └── nutrition.ai.controller.ts
│   ├── services/               # Business logic
│   │   ├── auth.service.ts
│   │   ├── chat.service.ts
│   │   ├── database.service.ts
│   │   ├── ai.service.ts       # Google Generative AI integration
│   │   ├── email.service.ts
│   │   ├── health.service.ts
│   │   ├── nutrition.service.ts
│   │   ├── workout.service.ts
│   │   ├── hormone.service.ts
│   │   ├── mental-health.service.ts
│   │   ├── task.service.ts
│   │   ├── vector.service.ts   # Vector embeddings
│   │   └── health.service.ts
│   ├── models/                 # MongoDB schemas
│   │   ├── user.model.ts
│   │   ├── chat.model.ts
│   │   ├── nutrition.model.ts
│   │   ├── workout.model.ts
│   │   ├── mental-health.model.ts
│   │   ├── hormone.model.ts
│   │   ├── task.model.ts
│   │   ├── report.model.ts
│   │   ├── sleep.model.ts
│   │   ├── assessment.model.ts
│   │   ├── memory.model.ts
│   │   ├── discussion.model.ts
│   │   └── otp.model.ts
│   ├── middleware/
│   │   └── common.middleware.ts # Auth, error handling, rate limiting, etc.
│   └── utils/
│       ├── errors.ts           # Custom error classes
│       └── pdf-parser.util.ts
│
├── public/                      # Static assets
├── logs/                        # Application logs
├── scratch/                     # Development utilities
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env (not in repo - see setup)
```

---

## 🔄 Application Flow

### **User Journey**

```
Landing Page
    ↓
[Not Logged In] → Sign Up → OTP Verification → Profile Setup → Dashboard
    ↓
[Logged In] → Home Dashboard
    ├─→ Chat with AI Health Advisor
    ├─→ Track Workouts
    ├─→ Log Nutrition
    ├─→ Mental Health Check-in
    ├─→ Hormone Tracking
    ├─→ View Health Reports
    ├─→ Participate in Discussions
    └─→ Manage Health Tasks/Goals
```

### **Request Flow (Frontend to Backend)**

```
React Component
    ↓
API Service (axios call)
    ↓
Express Route
    ↓
Middleware (auth, validation, rate limiting)
    ↓
Controller (request handling)
    ↓
Service Layer (business logic)
    ↓
MongoDB via Mongoose
    ↓
Response back to frontend
```

### **AI Integration Flow**

```
User Query (Chat/AI Service Request)
    ↓
AI Service (Backend)
    ↓
Google Generative AI API
    ↓
Vector Service (embeddings for similarity search)
    ↓
Context from user history + new query
    ↓
AI Response
    ↓
Store in chat history (MongoDB)
    ↓
Return to frontend
```

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js v18 or higher
- MongoDB instance (local or cloud)
- npm or yarn
- Google Generative AI API key
- Optional: Redis for caching

### **Installation**

#### 1. **Clone Repository**
```bash
git clone <repository-url>
cd MedSage
```

#### 2. **Install Dependencies**
```bash
npm install
```

#### 3. **Environment Setup**

Create `.env` file in the root directory:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/medsage
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/medsage

# AI Configuration
GOOGLE_AI_API_KEY=your_google_generative_ai_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email Service (Nodemailer)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@medsage.com

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=15000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
```

#### 4. **Install & Run MongoDB** (if using locally)
```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows (if installed as service)
net start MongoDB
```

#### 5. **Start Development Environment**

**Terminal 1 - Backend**
```bash
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - Frontend**
```bash
npm run preview
# Or for development with hot reload:
npm run dev
# Runs on http://localhost:5173
```

The frontend is configured to proxy API calls to the backend via `vite.config.ts`.

### **Build for Production**
```bash
npm run build        # Builds TypeScript and Vite
npm run lint         # Type checking
npm run test         # Run tests
```

---

## 📡 API Overview

### **API Base Path**
```
http://localhost:3000/api/v1
```

### **Core Endpoints**

#### **Authentication** (`/auth`)
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user
- `POST /auth/send-otp` - Send OTP to email
- `POST /auth/verify-otp` - Verify OTP

#### **Health & Chat** (`/chat`)
- `POST /chat/message` - Send message to AI
- `GET /chat/history` - Get chat history
- `DELETE /chat/:id` - Delete chat

#### **Workouts** (`/workout`)
- `GET /workout` - List workouts
- `POST /workout` - Create workout
- `PUT /workout/:id` - Update workout
- `DELETE /workout/:id` - Delete workout

#### **Nutrition** (`/nutrition`)
- `GET /nutrition` - List meals
- `POST /nutrition` - Log meal
- `GET /nutrition/analysis` - Get nutrition analysis

#### **Mental Health** (`/mental-health`)
- `POST /mental-health/assessment` - Submit assessment
- `GET /mental-health/status` - Get mental health status

#### **Reports** (`/reports`)
- `GET /reports` - Get health reports
- `POST /reports/generate` - Generate PDF report

#### **Health Status** (`/health`)
- `GET /health` - Server health check

**Full API contract documentation**: See [backend/contracts/api-contracts.ts](backend/contracts/api-contracts.ts)

---

## 🔐 Security Features

### **Authentication & Authorization**
- JWT-based authentication with access and refresh tokens
- Password hashing with bcryptjs (salt rounds: 10)
- OTP verification for email confirmation
- Role-based access control (RBAC)

### **API Security**
- Helmet.js for HTTP headers security
- CORS configuration for frontend integration
- Rate limiting on auth endpoints
- Input validation using express-validator
- Request ID tracking for debugging

### **Data Protection**
- MongoDB password hashing
- Secure token storage
- Email verification required
- Session management with Redis

---

## 📊 Database Schema

### **Key Models**
- **User**: Account information, profile, preferences
- **Chat**: Conversation history, AI interactions
- **Workout**: Exercise logs, fitness goals
- **Nutrition**: Meal logs, dietary tracking
- **MentalHealth**: Mood tracking, assessments
- **Hormone**: Cycle tracking, hormonal data
- **Sleep**: Sleep quality metrics
- **Task**: Health goals, habits, reminders
- **Report**: Generated health reports
- **Discussion**: Community discussions
- **Memory**: AI conversation memory
- **OTP**: Email verification tokens

---

## 🤖 AI Integration

### **Google Generative AI**
- Powers the chat interface
- Generates personalized health recommendations
- Analyzes user data for insights
- Provides nutritional guidance
- Mental health support responses

### **Vector Embeddings**
- Semantic search for similar health data
- Context retrieval for AI responses

### **Job Queue (Bull)**
- Asynchronous task processing
- Report generation
- Email notifications
- Background jobs

---

## 📱 Frontend Architecture

### **State Management**
- React Context API for global state
- Component-level state with hooks

### **Styling**
- Tailwind CSS utility-first framework
- Radix UI for accessible components
- Framer Motion for animations
- GSAP for advanced animations
- Three.js for 3D visualizations

### **Routing**
- React Router for client-side routing
- Protected routes with auth check
- Error boundary for graceful error handling

### **HTTP Client**
- Axios with interceptors
- Automatic token refresh
- Request/response transformation
- Error handling

---

## 🧪 Testing

### **Run Tests**
```bash
npm run test              # Run all tests once
npm run test:watch       # Run tests in watch mode
```

### **Testing Framework**
- Jest for unit and integration tests
- TypeScript support

---

## 📈 Performance Optimization

### **Frontend**
- Code splitting via Vite
- Lazy loading of routes
- Image optimization
- CSS purging via Tailwind

### **Backend**
- Database indexing
- Redis caching
- Rate limiting to prevent abuse
- Response compression
- Request debouncing for expensive operations

---

## 🐛 Debugging

### **Backend Debugging**
- Debug logs available in `logs/` directory
- Request ID tracking in middleware
- Detailed error messages with stack traces
- MongoDB connection status monitoring

### **Frontend Debugging**
- Browser DevTools support
- React DevTools extension compatible
- Network tab for API inspection
- Error boundary for component errors

---

## 🔧 Development Guidelines

### **Code Organization**
- Keep business logic in services
- Controllers handle HTTP requests/responses
- Middleware for cross-cutting concerns
- Utilities for reusable functions

### **Naming Conventions**
- PascalCase for classes and types
- camelCase for variables and functions
- UPPER_SNAKE_CASE for constants
- Descriptive names (prefer clarity over brevity)

### **Error Handling**
- Use custom error classes from `utils/errors.ts`
- Meaningful error messages
- Proper HTTP status codes
- Validation before operations

### **Git Practices**
- Feature branches for new features
- Meaningful commit messages
- PR review before merging to main

---

## 📋 Environment Checklist

Before deploying to production:
- [ ] Update `NODE_ENV=production`
- [ ] Set strong JWT secrets
- [ ] Configure MongoDB production instance
- [ ] Set up email service credentials
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up monitoring and logging
- [ ] Test all AI integrations
- [ ] Backup strategy for database
- [ ] Rate limiting tuned for production

---

## 🚨 Troubleshooting

### **Common Issues**

**Issue**: MongoDB connection failed
```bash
# Check if MongoDB is running
# macOS: brew services list
# Linux: sudo systemctl status mongod
# Ensure MONGODB_URI is correct in .env
```

**Issue**: API calls return 401 (Unauthorized)
```bash
# Check JWT token in localStorage
# Verify JWT_SECRET matches between sessions
# Ensure token hasn't expired
```

**Issue**: AI responses not working
```bash
# Verify GOOGLE_AI_API_KEY is set correctly
# Check API quota and usage limits
# Ensure proper request formatting
```

**Issue**: Email sending fails
```bash
# Verify email credentials in .env
# Check app-specific password for Gmail
# Ensure SMTP settings are correct
```

---

## 📞 Support & Contact

For issues, feature requests, or questions:
- Create an issue in the repository
- Check existing issues for solutions
- Provide detailed error logs and reproduction steps

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🙏 Acknowledgments

- Google Generative AI for AI capabilities
- Radix UI for accessible component primitives
- Three.js for 3D graphics
- Open-source community for excellent tools and libraries

---

**Version**: 1.0.0  
**Last Updated**: June 2026  
**Maintainers**: MedSage Development Team

