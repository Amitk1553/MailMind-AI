# MailMind AI

MailMind AI is an enterprise-grade, high-performance cold email generation platform designed to help job seekers craft high-converting recruiter outreach messages. Built using a decoupled MERN stack architecture, the platform optimizes external AI inference latency by integrating a distributed in-memory Redis caching tier, resulting in near-instant response times for repetitive contexts.

## Live Deployments

Production Frontend: [https://mailmind-ai.vercel.app](https://mailmind-ai.vercel.app)

Production Backend API: [https://mailmind-backend-hjux.onrender.com](https://mailmind-backend-hjux.onrender.com)

---

## ⚡ Quick Start (One Command)

After cloning and configuring your `.env` file (see setup below), just run this **single command** from the root directory to start both frontend and backend simultaneously:

```bash
npm run dev
```

> Frontend runs on **http://localhost:5173** · Backend runs on **http://localhost:3000**  
> No need to `cd` into separate folders or run two terminals.

---

## System Architecture & Data Flow

The platform utilizes a modern decoupled microservices-inspired flow to ensure isolation of concerns, secure identity verification, and optimized performance metrics.

```text
       [ Client: React + Vite ] (Deployed on Vercel)
                 │         ▲
    HTTPS Post   │         │  JSON Response
  (Bearer Token) ▼         │
      [ API Gateway / Express Backend ] (Deployed on Render)
                 │
                 ├──► [ JWT Middleware Verification ]
                 │
                 ├──► [ In-Memory Cache: Upstash Redis Cluster ] (Fast Path)
                 │     (TTL: 1 Hour for Prompt Hits)
                 │
                 ├──► [ Inference Layer: Gemini API / Gemini 3.6 Flash ] (Slow Path)
                 │
                 └──► [ Data Layer: MongoDB Atlas Cluster ]
                       (User Schemas & Transactional Email History)
```

**Architectural Key Highlights**

- **Dual-Tier Cache Strategy:** Generative AI requests bypass the external inference engine if an identical payload signature is found within the Upstash Redis cache instance, dropping response times from seconds to sub-milliseconds.

- **Asynchronous Cache Invalidation:** Write operations to the transactional database automatically purge specific user query histories cached in memory, ensuring immediate state consistency across distributed updates.

- **Secure Session Lifecycles:** Multi-stage authentication utilizing cryptographically signed JSON Web Tokens (JWT) paired with an active NodeMailer/Gmail SMTP One-Time Password (OTP) verification engine.

---

## Technology Stack

**Frontend Core**

- Library/Runtime: React.js (Vite Native Compilation Engine)
- State Management: React Context API (Auth Injection Lifecycle Context)
- Styling Framework: Tailwind CSS + PostCSS Layout Utilities
- Client Networking: Axios (Interceptors configured for local/production fallback auto-switching)

**Backend & Middleware Infrastructure**

- Server Framework: Node.js + Express.js Router
- Primary Database: MongoDB Atlas (Object Data Modeling via Mongoose ODM)
- Caching & Session Layer: Redis (TCP-based Upstash serverless infrastructure distributed over TLS)
- Inference Engine: Google Gen AI SDK (Gemini 3.6 Flash optimization)

---

## Project Directory Structure

```plaintext
MailMind-AI/
├── client/                     # Frontend React + Vite application
│   └── src/
│       ├── components/         # Reusable UI elements
│       │   ├── Layout.jsx      # Global wrapper structural component defining page layout
│       │   ├── Navbar.jsx      # Top navigation bar for branding and user controls
│       │   └── Sidebar.jsx     # Side navigation for dashboard routing and history access
│       ├── context/            # Global React state management
│       │   └── AuthContext.jsx # Manages JWT session state and user authentication data
│       ├── pages/              # Main application views/routes
│       │   ├── Dashboard.jsx   # Protected view for AI prompt input and email generation
│       │   ├── LandingPage.jsx # Public-facing marketing and feature overview page
│       │   ├── Login.jsx       # User authentication entry point
│       │   ├── Signup.jsx      # User registration form capturing initial details
│       │   └── VerifyOtp.jsx   # Security view for processing email-based OTP verification
│       └── utils/
│           └── api.js          # Axios client with JWT interceptors and dynamic environment URLs
├── server/                     # Node.js + Express backend infrastructure
│   ├── config/                 # External service connection configurations
│   │   ├── db.js               # MongoDB Atlas connection initialization
│   │   └── redisClient.js      # Upstash cloud Redis client for in-memory caching
│   ├── controllers/            # Core business logic and request handling
│   │   ├── authController.js   # Handles registration, OTP generation, and JWT issuance
│   │   └── aiController.js     # Manages Gemini API inference, Redis caching, and MongoDB logging
│   ├── middleware/             # Express request interceptors
│   │   └── authMiddleware.js   # Route guard that verifies and decodes JWT Bearer tokens
│   ├── models/                 # Mongoose Object Data Modeling (ODM) schemas
│   │   ├── User.js             # Data structure for user accounts and authentication states
│   │   └── EmailHistory.js     # Transactional ledger for storing user-generated AI emails
│   ├── routes/                 # API endpoint definitions mapping to controllers
│   │   ├── authRoutes.js       # Endpoints: /register, /login, /verify-otp
│   │   └── aiRoutes.js         # Endpoints: /generate-email, /history (Protected)
│   ├── utils/                  # Backend helper functions
│   │   └── sendOtpEmail.js     # Nodemailer SMTP integration for dispatching security codes
│   └── server.js               # Primary Express application entry point and port listener
└── package.json                # Monorepo configuration for concurrent script execution
```

---

## Local Installation & Set Up

### Prerequisites

- Node.js (v18+ recommended)
- Docker Desktop (to run a local Redis container)
- MongoDB Atlas cluster string or local MongoDB instance

### 1. Clone the Codebase

```bash
git clone https://github.com/Amitk1553/MailMind-AI.git
cd MailMind-AI
```

### 2. Configure Environment Variables

Create a `.env` file inside the `server/` directory:

```plaintext
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signing_secret
GEMINI_API_KEY=your_gemini_api_key
SMTP_USER=your_gmail_address
SMTP_PASS=your_gmail_app_password
REDIS_URL=redis://127.0.0.1:6379
```

### 3. Initialize Local Redis Container

Ensure Docker Desktop is running, then start a background Redis server on port 6379:

```bash
docker run --name mailmind-redis -p 6379:6379 -d redis
```

### 4. Install All Dependencies

From the root directory, install all workspace dependencies in one go:

```bash
npm run install-all
```

### 5. Start the App

```bash
npm run dev
```

That's it! Both frontend and backend start together with a single command. No need to open separate terminals.

---

## Core API Specifications

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Creates a user record and sends an OTP to the provided email for verification. |
| `POST` | `/api/auth/verify-otp` | Validates the OTP token and activates the user account, returning a signed JWT. |
| `POST` | `/api/auth/login` | Validates credentials. If the account is unverified, sends a fresh OTP and prompts verification. On success, returns a signed Bearer JWT. |

### Generative AI & Cache

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `POST` | `/api/ai/generate-email` | ✅ | Checks Redis cache first. On hit: returns instantly. On miss: calls Gemini, caches result (1-hr TTL), and logs to MongoDB. |
| `GET`  | `/api/ai/history` | ✅ | Returns previous generated emails from Redis cache; falls back to MongoDB on cold load. |

---

## Performance Optimization and Security Features

- **Vite Dynamic Compilation:** Code splitting and tree shaking automatically optimized for high Lighthouse asset delivery scores.
- **Dockerized Environment:** Eliminates the "works on my machine" issue by isolating Redis infrastructure dependencies.
- **Cross-Origin Resource Sharing (CORS):** Strict origin whitelist protecting the API server from unauthorized cross-domain requests.
