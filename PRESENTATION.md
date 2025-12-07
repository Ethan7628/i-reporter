# iReporter Application - Technical Presentation Guide

> A comprehensive documentation of the iReporter application architecture, explaining each file and how the system works together.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Backend Structure](#backend-structure)
4. [Frontend Structure](#frontend-structure)
5. [Authentication Flow](#authentication-flow)
6. [Report Management Flow](#report-management-flow)
7. [Key Features](#key-features)
8. [Technology Stack](#technology-stack)

---

## 🎯 Project Overview

**iReporter** is a civic engagement platform that empowers citizens to:
- Report corruption incidents (Red-Flag Reports)
- Request government intervention on issues (Intervention Reports)
- Track the status of their submissions
- Receive email notifications when report status changes

The application follows a **client-server architecture** with a separate frontend (React) and backend (Node.js/Express).

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │   Pages     │  │ Components  │  │  Services   │            │
│   │ (Auth, etc) │  │ (UI, Map)   │  │ (API calls) │            │
│   └─────────────┘  └─────────────┘  └─────────────┘            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP Requests (REST API)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (Express)                         │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │   Routes    │  │ Controllers │  │ Middleware  │            │
│   │ (Endpoints) │  │  (Logic)    │  │ (Auth/Val)  │            │
│   └─────────────┘  └─────────────┘  └─────────────┘            │
│                            │                                    │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │  Database   │  │   Email     │  │   Upload    │            │
│   │  (MySQL)    │  │ (NodeMailer)│  │  (Multer)   │            │
│   └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Backend Structure

### `/backend/src/app.ts` - Application Entry Point
**Purpose:** The main server configuration file that bootstraps the entire backend.

**Key Responsibilities:**
- Loads environment variables from `.env` file
- Configures Express middleware (CORS, Helmet, body parsers)
- Sets up static file serving for uploads
- Mounts API routes (`/api/auth`, `/api/reports`)
- Initializes database connection and email transporter
- Defines health check and error handling endpoints

```typescript
// Example: Route mounting
app.use('/api/auth', authRoutes);      // Authentication endpoints
app.use('/api/reports', reportRoutes); // Report CRUD endpoints
```

---

### `/backend/src/routes/` - API Route Definitions

#### `auth.routes.ts`
**Purpose:** Defines all authentication-related API endpoints.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Initiate registration (sends OTP) |
| `/api/auth/verify-otp` | POST | Verify OTP and create account |
| `/api/auth/login` | POST | User login with email/password |
| `/api/auth/me` | GET | Get current authenticated user |
| `/api/auth/logout` | POST | Logout user |
| `/api/auth/refresh-token` | POST | Refresh JWT token |

#### `report.route.ts`
**Purpose:** Defines all report management API endpoints.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports` | GET | Get all reports (filtered by role) |
| `/api/reports` | POST | Create new report with media |
| `/api/reports/:id` | GET | Get specific report by ID |
| `/api/reports/:id` | PUT | Update report (draft only) |
| `/api/reports/:id` | DELETE | Delete report (draft only) |
| `/api/reports/:id/status` | PATCH | Update status (admin only) |
| `/api/reports/user/:userId` | GET | Get reports by user |

---

### `/backend/src/controllers/` - Business Logic

#### `auth.controllers.ts`
**Purpose:** Implements all authentication business logic.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `signup()` | Validates input, checks for existing user, hashes password, generates OTP, stores temporarily, sends verification email |
| `verifyOTPAndCreateUser()` | Validates OTP, creates user in database, generates JWT token |
| `login()` | Validates credentials, compares passwords with bcrypt, generates JWT |
| `getCurrentUser()` | Retrieves authenticated user's profile from database |
| `logout()` | Confirms logout (JWT invalidation handled client-side) |
| `refreshToken()` | Issues new JWT from refresh token |

**Security Features:**
- Password hashing with bcrypt (12 salt rounds)
- 6-digit OTP with 10-minute expiry
- JWT tokens for session management
- Email format validation

#### `reports.controllers.ts`
**Purpose:** Implements all report CRUD operations.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `createReport()` | Validates input, handles file uploads (Multer or Base64), saves to database |
| `getAllReports()` | Returns all reports (admin) or user's own reports |
| `getReportById()` | Retrieves single report with ownership validation |
| `updateReport()` | Updates report content (only if status is "draft") |
| `deleteReport()` | Removes report and associated media files |
| `updateReportStatus()` | Admin-only status change with email notification |

**Report Statuses:**
1. `draft` - Initial state, editable
2. `under-investigation` - Being reviewed by admin
3. `resolved` - Issue has been addressed
4. `rejected` - Report was denied

---

### `/backend/src/middleware/` - Request Processing

#### `auth.middleware.ts`
**Purpose:** Protects routes requiring authentication.

**How it works:**
1. Extracts JWT from `Authorization: Bearer <token>` header
2. Verifies token signature using secret key
3. Decodes user payload (userId, email, role)
4. Attaches user object to request for controllers
5. Rejects with 401 if token is invalid/expired

```typescript
// Usage in routes
router.get('/me', authenticate, getCurrentUser);
```

#### `validation.middleware.ts`
**Purpose:** Validates request data before processing.

**Validations:**
- Required field checks
- Data type validation
- Format validation (email, etc.)

---

### `/backend/src/utils/` - Utility Functions

#### `database.ts`
**Purpose:** MySQL database connection and query execution.

**Features:**
- Connection pool for performance
- Promisified query wrapper
- Connection testing on startup
- Error handling and logging

```typescript
// Example usage
const result = await query('SELECT * FROM users WHERE email = ?', [email]);
```

#### `email.ts`
**Purpose:** Email sending functionality using NodeMailer.

**Features:**
- Gmail SMTP integration
- OTP email templates
- Status update notifications
- Automatic transporter initialization

**Key Functions:**
| Function | Description |
|----------|-------------|
| `initializeEmailTransporter()` | Sets up NodeMailer with Gmail credentials |
| `generateOTP()` | Creates random 6-digit code |
| `sendOTPEmail()` | Sends verification email with OTP |
| `sendStatusUpdateEmail()` | Notifies users when report status changes |

#### `jwt.ts`
**Purpose:** JSON Web Token operations.

**Functions:**
| Function | Description |
|----------|-------------|
| `generateToken()` | Creates signed JWT with user payload |
| `verifyToken()` | Validates and decodes JWT |

**Token Payload:**
```typescript
{
  userId: string,
  email: string,
  role: 'user' | 'admin'
}
```

#### `otp.ts`
**Purpose:** OTP storage and verification.

**Features:**
- In-memory OTP storage with expiry
- 10-minute validity period
- Automatic cleanup of expired OTPs
- Stores user data temporarily during verification

#### `upload.ts`
**Purpose:** File upload handling with Multer.

**Features:**
- Supports images, videos, and audio files
- Maximum 4 files per upload
- 50MB per file limit
- Unique filename generation
- File type validation

**Supported MIME Types:**
- Images: jpeg, png, gif, webp
- Videos: mp4, webm, ogg
- Audio: mpeg, wav, ogg, mp4

---

## 📱 Frontend Structure

### `/frontend/src/main.tsx` - Application Entry
**Purpose:** Bootstraps the React application.

```typescript
// Mounts React app to DOM
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### `/frontend/src/App.tsx` - Router Configuration
**Purpose:** Defines application routes and global providers.

**Routes:**

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Index | Landing page / route handler |
| `/landing` | Landing | Marketing/info page |
| `/auth` | Auth | Login/Signup forms |
| `/dashboard` | Dashboard | User's report list |
| `/report/new` | NewReport | Create report form |
| `/report/:id/edit` | EditReport | Edit existing report |
| `/admin` | Admin | Admin dashboard |
| `*` | NotFound | 404 page |

**Global Features:**
- ErrorBoundary for crash handling
- ToastContainer for notifications

---

### `/frontend/src/pages/` - Page Components

#### `Auth.tsx`
**Purpose:** Handles user authentication UI.

**Features:**
- Toggle between Login and Signup modes
- OTP verification step after signup
- Form validation
- Error/success notifications
- Redirect to dashboard on success

#### `Dashboard.tsx`
**Purpose:** Displays user's reports and statistics.

**Features:**
- Report cards with status badges
- Filter by report type
- Quick actions (edit, delete, view)
- Statistics summary
- Create new report button

#### `NewReport.tsx` & `EditReport.tsx`
**Purpose:** Report creation and editing forms.

**Features:**
- Title and description inputs
- Report type selector (red-flag/intervention)
- Location picker with interactive map
- Media upload (images, videos, audio)
- Audio recording capability
- Form validation
- Draft auto-save concept

#### `Admin.tsx`
**Purpose:** Administrative dashboard for managing all reports.

**Features:**
- View all reports from all users
- Status update controls
- Filter and search
- User information display
- Bulk actions

#### `Landing.tsx`
**Purpose:** Marketing/information page for new visitors.

**Features:**
- App introduction
- Feature highlights
- Call-to-action buttons
- Navigation to auth

---

### `/frontend/src/components/` - Reusable Components

#### `ui/` - UI Component Library
**Purpose:** Shadcn/UI based component library.

Contains: Button, Card, Input, Select, Dialog, Toast, etc.

#### `LocationPicker.tsx`
**Purpose:** Interactive map for selecting report locations.

**Features:**
- Leaflet map integration
- Click to select coordinates
- Search box using Nominatim API
- Marker display
- Coordinate display

#### `LoadingSpinner.tsx`
**Purpose:** Loading state indicator.

#### `ErrorBoundary.tsx`
**Purpose:** Catches JavaScript errors in child components.

#### `ErrorMessage.tsx`
**Purpose:** Displays error messages consistently.

---

### `/frontend/src/services/` - API Communication

#### `api.service.ts`
**Purpose:** Centralized HTTP client for all API calls.

**Features:**
- Base URL configuration
- Request/response interceptors
- Authentication header injection
- Error logging
- Response parsing

```typescript
// Example usage
const response = await api.post('/auth/login', { email, password });
```

#### `auth.service.ts`
**Purpose:** Authentication-specific API methods.

**Functions:**
| Function | Description |
|----------|-------------|
| `signup()` | POST /api/auth/signup |
| `verifyOTP()` | POST /api/auth/verify-otp |
| `login()` | POST /api/auth/login |
| `logout()` | POST /api/auth/logout |
| `getCurrentUser()` | GET /api/auth/me |

#### `report.service.ts`
**Purpose:** Report-specific API methods.

**Functions:**
| Function | Description |
|----------|-------------|
| `createReport()` | POST /api/reports (with FormData) |
| `getReports()` | GET /api/reports |
| `getReportById()` | GET /api/reports/:id |
| `updateReport()` | PUT /api/reports/:id |
| `deleteReport()` | DELETE /api/reports/:id |
| `updateStatus()` | PATCH /api/reports/:id/status |

---

### `/frontend/src/hooks/` - Custom React Hooks
**Purpose:** Reusable stateful logic.

Examples:
- `useAuth` - Authentication state management
- `useReports` - Report data fetching
- `useMediaUpload` - File upload handling

---

### `/frontend/src/types/` - TypeScript Definitions
**Purpose:** Type definitions for the application.

Key types:
- `User` - User object structure
- `Report` - Report object structure
- `ApiResponse` - API response wrapper

---

## 🔐 Authentication Flow

### Signup Flow (Two-Step)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │    │ Frontend │    │ Backend  │    │  Email   │
│  Form    │    │ Service  │    │   API    │    │ Service  │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ Submit form   │               │               │
     │──────────────>│               │               │
     │               │ POST /signup  │               │
     │               │──────────────>│               │
     │               │               │ Generate OTP  │
     │               │               │──────────────>│
     │               │               │               │ Send Email
     │               │               │<──────────────│
     │               │ "OTP sent"    │               │
     │<──────────────│<──────────────│               │
     │               │               │               │
     │ Enter OTP     │               │               │
     │──────────────>│               │               │
     │               │ POST /verify  │               │
     │               │──────────────>│               │
     │               │               │ Create User   │
     │               │               │ Generate JWT  │
     │               │ User + Token  │               │
     │<──────────────│<──────────────│               │
     │               │               │               │
```

### Login Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │    │ Frontend │    │ Backend  │
└────┬─────┘    └────┬─────┘    └────┬─────┘
     │ Credentials   │               │
     │──────────────>│               │
     │               │ POST /login   │
     │               │──────────────>│
     │               │               │ Verify password
     │               │               │ Generate JWT
     │               │ User + Token  │
     │<──────────────│<──────────────│
     │ Store token   │               │
     │ Redirect      │               │
```

---

## 📊 Report Management Flow

### Create Report

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │    │ Frontend │    │ Backend  │    │ Database │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │ Fill form     │               │               │
     │ Add media     │               │               │
     │ Pick location │               │               │
     │──────────────>│               │               │
     │               │ POST /reports │               │
     │               │ (FormData)    │               │
     │               │──────────────>│               │
     │               │               │ Save files    │
     │               │               │ INSERT report │
     │               │               │──────────────>│
     │               │ Report data   │<──────────────│
     │<──────────────│<──────────────│               │
     │ Success toast │               │               │
     │ Redirect      │               │               │
```

### Admin Status Update

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Admin   │    │ Backend  │    │ Database │    │  Email   │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │ Change status │               │               │
     │──────────────>│               │               │
     │               │ UPDATE status │               │
     │               │──────────────>│               │
     │               │<──────────────│               │
     │               │ Get user email│               │
     │               │──────────────>│               │
     │               │<──────────────│               │
     │               │ Send notification             │
     │               │──────────────────────────────>│
     │ Success       │                               │
     │<──────────────│                               │
```

---

## ⭐ Key Features

### 1. Two-Step Email Verification
- Users receive OTP via email during signup
- Prevents fake account creation
- 10-minute OTP expiry for security

### 2. Role-Based Access Control
- **Users:** Can create, edit (draft only), delete own reports
- **Admin:** Can view all reports, change statuses

### 3. Interactive Location Picker
- Leaflet map integration
- Click-to-select coordinates
- Address search via Nominatim API

### 4. Unified Media Handling
- Single "images" field stores all media types
- Supports images, videos, and audio
- In-browser audio recording capability
- 4 files max, 50MB each

### 5. Email Notifications
- OTP during registration
- Status update notifications to report creators

### 6. Edit Restrictions
- Reports can only be edited in "draft" status
- Once admin reviews, report is locked

---

## 🛠️ Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web framework |
| **TypeScript** | Type safety |
| **MySQL** | Relational database |
| **JWT** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **NodeMailer** | Email sending |
| **Multer** | File uploads |
| **Helmet** | Security headers |
| **CORS** | Cross-origin requests |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React** | UI library |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **React Router** | Navigation |
| **Tailwind CSS** | Styling |
| **Shadcn/UI** | Component library |
| **Leaflet** | Map integration |
| **React Toastify** | Notifications |
| **Lucide React** | Icons |

---

## 🚀 Running the Application

### Backend
```bash
cd backend
pnpm install
# Configure .env file
pnpm run dev
```

### Frontend
```bash
cd frontend
pnpm install
pnpm run dev
```

### Environment Variables (Backend)
```env
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ireporter
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
CORS_ORIGIN=http://localhost:3000
```

---

## 📝 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Reports Table
```sql
CREATE TABLE reports (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('red-flag', 'intervention') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location JSON,
  media JSON,
  status ENUM('draft', 'under-investigation', 'resolved', 'rejected') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🎤 Presentation Tips

1. **Start with the problem:** Corruption affects citizens, but there's no easy way to report it.

2. **Show the solution:** Demo the app - create an account, submit a report, show admin view.

3. **Highlight security:** OTP verification, password hashing, JWT authentication.

4. **Show the architecture:** Use the diagrams in this document.

5. **Demonstrate real-time features:** Email notifications, status updates.

6. **Discuss scalability:** Separate frontend/backend, database design, API structure.

---

*Created for iReporter Presentation - December 2024*
