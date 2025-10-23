# Backend Integration Guide

## Overview
The iReporter application is fully refactored and ready for backend integration. All API calls are centralized in service layers that can easily switch from mock data to real API endpoints.

## Quick Start

### 1. Configure Your Backend URL

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=https://your-backend-api.com/api
```

### 2. Switch from Mock to Real API

In `src/services/api.service.ts`, change:

```typescript
const USE_MOCK_DATA = true; // Change to false
```

### 3. API Endpoints Expected

Your backend should implement these endpoints:

#### Authentication Endpoints
```
POST   /api/auth/signup          - Register new user
POST   /api/auth/login           - Login user
POST   /api/auth/logout          - Logout user
GET    /api/auth/me              - Get current user
POST   /api/auth/refresh         - Refresh auth token
```

#### Report Endpoints
```
POST   /api/reports              - Create report
GET    /api/reports              - Get all reports
GET    /api/reports/:id          - Get single report
GET    /api/reports/user/:userId - Get user's reports
PATCH  /api/reports/:id          - Update report
DELETE /api/reports/:id          - Delete report
PATCH  /api/reports/:id/status   - Update report status (admin)
POST   /api/reports/:id/images   - Upload image to report
```

## Project Structure

```
src/
├── config/
│   └── api.config.ts          # API configuration & endpoints
├── services/
│   ├── api.service.ts         # Core HTTP client
│   ├── auth.service.ts        # Authentication service
│   └── report.service.ts      # Report management service
├── hooks/
│   ├── useAuth.ts             # Authentication hook
│   └── useReports.ts          # Reports management hook
├── types/
│   └── index.ts               # TypeScript interfaces
├── utils/
│   └── constants.ts           # App constants
└── pages/                     # React components (no changes needed)
```

## Request/Response Formats

### Authentication

**Signup Request:**
```json
{
  "email": "user@example.com",
  "password": "securepass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Signup/Login Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  },
  "token": "jwt-token-here"
}
```

### Reports

**Create Report Request:**
```json
{
  "title": "Road infrastructure corruption",
  "description": "Detailed description...",
  "type": "red-flag",
  "userId": "user-uuid"
}
```

**Report Response:**
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "type": "red-flag",
  "title": "Road infrastructure corruption",
  "description": "Detailed description...",
  "location": {
    "lat": -1.2921,
    "lng": 36.8219
  },
  "status": "draft",
  "images": ["url1", "url2"],
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

**Update Status Request:**
```json
{
  "status": "under-investigation"
}
```

## Authentication Flow

1. User logs in → Backend returns JWT token
2. Token is stored in localStorage as `auth_token`
3. All subsequent requests include: `Authorization: Bearer <token>`
4. Token is cleared on logout

## Error Handling

All API responses should follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Service Layer Usage

### In Components - Use Hooks

```typescript
// Authentication
import { useAuth } from '@/hooks/useAuth';

const MyComponent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  const handleLogin = async () => {
    const success = await login({ email, password });
    if (success) {
      // Navigate or update UI
    }
  };
};
```

```typescript
// Reports
import { useReports } from '@/hooks/useReports';

const Dashboard = () => {
  const { reports, loading, createReport, deleteReport } = useReports(userId);
  
  const handleCreate = async () => {
    const report = await createReport(data, userId);
  };
};
```

### Direct Service Calls (Advanced)

```typescript
import { authService } from '@/services/auth.service';
import { reportService } from '@/services/report.service';

// Direct calls if needed
const user = await authService.login(credentials);
const report = await reportService.create(data, userId);
```

## Testing Before Backend is Ready

The app currently uses localStorage-based mock data. You can:

1. Test all features with mock data
2. Develop your UI/UX
3. When backend is ready, just flip the switch in `api.service.ts`

## Migration Checklist

- [ ] Set up `.env` with `VITE_API_BASE_URL`
- [ ] Implement all required backend endpoints
- [ ] Test authentication flow (signup, login, logout)
- [ ] Test report CRUD operations
- [ ] Test file upload for images
- [ ] Test admin status updates
- [ ] Set `USE_MOCK_DATA = false` in `src/services/api.service.ts`
- [ ] Remove mock implementations from service files (optional)
- [ ] Test error handling and edge cases

## Security Notes

1. **JWT Token**: Stored in localStorage. For better security, consider httpOnly cookies.
2. **CORS**: Ensure your backend allows requests from your frontend domain.
3. **HTTPS**: Always use HTTPS in production.
4. **Rate Limiting**: Implement rate limiting on backend.
5. **Input Validation**: Both frontend (Zod schemas) and backend validation required.

## Support

For questions or issues during integration, refer to:
- `src/types/index.ts` - All TypeScript interfaces
- `src/config/api.config.ts` - All endpoint definitions
- Service files - Example request/response handling

---

**Ready to integrate!** Your backend just needs to match the expected request/response formats and the app will work seamlessly.
