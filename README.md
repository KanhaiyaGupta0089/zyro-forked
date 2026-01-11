# Zyro - Project Management Tool

Zyro is a comprehensive project management tool built with modern technologies, designed to help teams manage projects, issues, sprints, and collaborate effectively.

## 🚀 Features

- **Project Management**: Create, manage, and track projects with detailed analytics
- **Issue Tracking**: Track issues with status, priority, assignees, and comments
- **Sprint Management**: Plan and manage sprints with burndown charts and velocity tracking
- **Team Collaboration**: Manage team members, roles, and permissions
- **Real-time Updates**: WebSocket support for real-time issue and project updates
- **Dashboard Analytics**: Comprehensive dashboards for managers and employees
- **Role-based Access**: Admin, Manager, and Employee roles with appropriate permissions
- **File Attachments**: Upload and manage attachments for issues
- **Time Tracking**: Log and track time spent on issues
- **Activity Logs**: Track all project and issue activities

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy (Async)
- **Authentication**: JWT (Access & Refresh Tokens)
- **Task Queue**: Celery with Redis
- **Caching**: Redis
- **File Storage**: Cloudinary
- **WebSockets**: FastAPI WebSocket support
- **Migrations**: Alembic

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **Routing**: React Router v7
- **UI Components**: Custom components with Tailwind CSS
- **Animations**: Framer Motion
- **Notifications**: React Hot Toast
- **HTTP Client**: Axios

## 📁 Project Structure

```
Zyro/
├── backend/              # FastAPI backend application
│   ├── app/
│   │   ├── api/         # API routes and endpoints
│   │   ├── core/        # Core configuration and settings
│   │   ├── db/          # Database models and CRUD operations
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic services
│   │   ├── tasks/       # Celery tasks
│   │   └── utils/       # Utility functions
│   ├── alembic/         # Database migrations
│   ├── main.py          # Application entry point
│   └── requirements.txt # Python dependencies
│
└── frontend/            # React frontend application
    ├── src/
    │   ├── components/  # Reusable UI components
    │   ├── pages/       # Page components
    │   ├── services/    # API services
    │   ├── redux/       # Redux store and slices
    │   ├── routes/      # Route configurations
    │   ├── hooks/       # Custom React hooks
    │   └── utils/       # Utility functions
    ├── package.json     # Node dependencies
    └── vite.config.ts   # Vite configuration
```

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 14+
- Redis (for caching and Celery)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

5. **Run database migrations:**
   ```bash
   alembic upgrade head
   ```

6. **Start the server:**
   ```bash
   uvicorn main:app --reload
   ```

   The API will be available at `http://localhost:8000`
   
   - API Documentation: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file with:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

## 📚 API Documentation

Once the backend is running, you can access:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🔐 Authentication

The application uses JWT-based authentication:
- **Access Token**: Short-lived (default: 30 minutes)
- **Refresh Token**: Long-lived (default: 7 days)

All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## 👥 User Roles

- **Admin**: Full system access, can manage users and organizations
- **Manager**: Can create and manage projects, issues, and sprints
- **Employee**: Can view assigned issues and update their status

## 🗄️ Database

The application uses PostgreSQL with async SQLAlchemy. Database migrations are managed using Alembic.

To create a new migration:
```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

## 🧪 Testing

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm test
```

## 📦 Deployment

### Backend Deployment

1. Set environment variables in your hosting platform
2. Run database migrations:
   ```bash
   alembic upgrade head
   ```
3. Start the application:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

### Frontend Deployment

1. Build the application:
   ```bash
   npm run build
   ```
2. Deploy the `dist/` folder to your hosting platform

## 🔧 Configuration

### Environment Variables

See `.env.example` files in both `backend/` and `frontend/` directories for required environment variables.

### Key Configuration Files

- **Backend**: `backend/app/core/conf.py`
- **Frontend**: `frontend/vite.config.ts`

## 📝 License

This project is proprietary software.

## 🤝 Contributing

This is a private project. For questions or issues, please contact the development team.

## 📞 Support

For support, please contact the development team or create an issue in the project repository.

---

**Built with ❤️ by the Zyro Team**
