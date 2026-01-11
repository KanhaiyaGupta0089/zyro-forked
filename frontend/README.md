# Zyro Frontend

React + TypeScript frontend application for Zyro project management system.

## 🚀 Features

- Modern React 18 with TypeScript
- Fast development with Vite
- State management with Redux Toolkit
- Beautiful UI with Tailwind CSS
- Real-time updates with WebSocket
- Role-based routing and access control
- Responsive design
- Smooth animations with Framer Motion

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   └── custom/       # Custom components
│   ├── pages/           # Page components
│   │   ├── manager/     # Manager pages
│   │   ├── employee/    # Employee pages
│   │   └── admin/       # Admin pages
│   ├── services/        # API services
│   │   └── api/         # API client and endpoints
│   ├── redux/           # Redux store
│   │   ├── store.ts     # Store configuration
│   │   └── auth/        # Auth slice
│   ├── routes/          # Route configurations
│   │   ├── ProtectedRoute.tsx
│   │   └── RoleProtectedRoute.tsx
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   ├── layouts/         # Layout components
│   └── assets/          # Static assets
├── public/              # Public assets
├── package.json         # Dependencies
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the frontend directory:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Styling

The project uses Tailwind CSS for styling. Configuration is in `tailwind.config.js`.

### Custom Components

The project includes custom UI components built with Tailwind CSS and Radix UI primitives.

## 🔐 Authentication

The frontend uses JWT tokens stored in cookies for authentication. The auth state is managed with Redux.

### Protected Routes

- `ProtectedRoute`: Requires authentication
- `RoleProtectedRoute`: Requires specific role (admin, manager, employee)

## 📡 API Integration

API calls are made through services in `src/services/api/`. The base API client is configured in `src/services/api/client.ts`.

### Example API Service

```typescript
import { apiClient } from './client';

export const getProjects = async () => {
  const response = await apiClient.get('/project/');
  return response.data;
};
```

## 🔄 State Management

State is managed with Redux Toolkit. The store is configured in `src/redux/store.ts`.

### Redux Slices

- `auth`: Authentication state and user information

## 🌐 Routing

Routing is handled by React Router v7. Routes are defined in `src/App.tsx`.

### Main Routes

- `/` - Root (redirects based on auth state)
- `/signup` - User registration
- `/login` - User login
- `/manager/*` - Manager dashboard
- `/employee` - Employee dashboard
- `/admin` - Admin dashboard
- `/projects` - Project management
- `/issues` - Issue management
- `/people` - Team management
- `/settings` - User settings

## 🎭 WebSocket Integration

Real-time updates are handled through WebSocket connections. The WebSocket hook is in `src/hooks/useWebSocket.ts`.

## 🧪 Testing

Run tests:
```bash
npm test
```

## 📦 Building for Production

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Preview the build:**
   ```bash
   npm run preview
   ```

3. **Deploy the `dist/` folder** to your hosting platform

## 🚀 Deployment

### Vercel

The project includes `vercel.json` for Vercel deployment:

```bash
vercel deploy
```

### Other Platforms

Build the application and deploy the `dist/` folder:

```bash
npm run build
# Deploy dist/ folder to your hosting platform
```

## 🔧 Configuration

### Environment Variables

- `VITE_API_BASE_URL`: Backend API base URL

#### Development Setup
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

#### Production Setup
```env
VITE_API_BASE_URL=https://your-production-api-domain.com/api/v1
```

**Note:** When deploying to production:
- Set `VITE_API_BASE_URL` to your production API URL
- The GitHub integration will automatically detect production mode and use the production webhook URL
- No ngrok setup is needed in production

### Vite Configuration

Vite configuration is in `vite.config.ts`. The project uses:
- React plugin
- Path aliases (`@/` for `src/`)
- Tailwind CSS plugin

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1024px+)
- Tablet (768px+)
- Mobile (320px+)

## 🎨 UI Components

The project uses custom components built with:
- Tailwind CSS for styling
- Radix UI for accessible primitives
- Lucide React for icons
- Framer Motion for animations

## 🔍 Code Quality

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting (if configured)

## 📞 Support

For issues or questions, please contact the development team.

---

**Built with React + TypeScript + Vite ❤️**
