# Zyro Backend API

FastAPI backend application for Zyro project management system.

## 🚀 Features

- RESTful API with FastAPI
- Async database operations with SQLAlchemy
- JWT-based authentication
- WebSocket support for real-time updates
- Celery for background tasks
- Redis for caching and pub/sub
- Cloudinary integration for file uploads
- Comprehensive error handling
- API documentation with Swagger/ReDoc

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/              # API routes
│   │   └── v1/           # API version 1 endpoints
│   │       ├── auth.py          # Authentication endpoints
│   │       ├── project.py       # Project management endpoints
│   │       ├── issue.py         # Issue management endpoints
│   │       ├── sprint.py        # Sprint management endpoints
│   │       ├── dashboard.py     # Dashboard endpoints
│   │       ├── user_api.py      # User management endpoints
│   │       ├── organization.py  # Organization endpoints
│   │       ├── logs_api.py      # Time logging endpoints
│   │       ├── websocket.py     # WebSocket endpoints
│   │       └── webhook.py       # Webhook endpoints
│   ├── core/             # Core configuration
│   │   ├── conf.py       # Environment configuration
│   │   ├── config.py     # Pydantic settings
│   │   ├── security.py   # JWT and password hashing
│   │   ├── dependencies.py  # FastAPI dependencies
│   │   ├── enums.py      # Enum definitions
│   │   ├── redis_config.py  # Redis configuration
│   │   ├── celery_app.py    # Celery configuration
│   │   └── websocket_manager.py  # WebSocket manager
│   ├── db/               # Database related
│   │   ├── base.py       # Database base setup
│   │   ├── connection.py # Database connection
│   │   └── crud/         # CRUD operations
│   │       ├── user.py
│   │       ├── project_crud.py
│   │       ├── issue_crud.py
│   │       ├── sprint.py
│   │       ├── dashboard_crud.py
│   │       └── logs_crud.py
│   ├── models/           # SQLAlchemy models
│   │   └── model.py
│   ├── schemas/          # Pydantic schemas
│   │   ├── auth.py
│   │   ├── project.py
│   │   ├── issue.py
│   │   ├── sprint.py
│   │   └── user.py
│   ├── services/         # Business logic
│   │   ├── email_service.py
│   │   └── redis_publisher.py
│   ├── tasks/            # Celery tasks
│   │   └── email_task.py
│   ├── common/           # Common utilities
│   │   ├── errors.py     # Custom exceptions
│   │   ├── exception_handler.py  # Exception handlers
│   │   ├── email_template.py     # Email templates
│   │   └── logging/      # Logging configuration
│   └── utils/            # Utility functions
├── alembic/              # Database migrations
│   ├── versions/         # Migration files
│   └── env.py
├── tests/                # Test files
├── logs/                 # Application logs
├── main.py               # Application entry point
├── requirements.txt      # Python dependencies
├── alembic.ini           # Alembic configuration
├── .env.example          # Environment variables template
└── README.md             # This file
```

## 🛠️ Setup

### Prerequisites

- Python 3.12+
- PostgreSQL 14+
- Redis (for caching and Celery)

### Installation

1. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

   Required environment variables:
   - Database connection (DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT)
   - JWT_SECRET_KEY (generate a secure random string)
   - Email settings (for notifications)
   - Redis URL (for caching and Celery)
   - Cloudinary credentials (for file uploads)

4. **Run database migrations:**
   ```bash
   alembic upgrade head
   ```

5. **Start the application:**
   ```bash
   uvicorn main:app --reload
   ```

   The API will be available at `http://localhost:8000`

## 📚 API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Sign Up**: `POST /api/v1/auth/signup`
2. **Login**: `POST /api/v1/auth/login`
3. **Use Token**: Include in Authorization header:
   ```
   Authorization: Bearer <access_token>
   ```

## 🗄️ Database Migrations

### Create a new migration:
```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply migrations:
```bash
alembic upgrade head
```

### Rollback migration:
```bash
alembic downgrade -1
```

## 🧪 Testing

Run tests with pytest:
```bash
pytest
```

Run with coverage:
```bash
pytest --cov=app
```

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available environment variables. Key variables:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET_KEY`: Secret key for JWT tokens
- `REDIS_URL`: Redis connection string
- `CELERY_BROKER_URL`: Celery broker URL
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name

### Logging

Logs are written to:
- `logs/app.log` - Application logs
- `logs/error.log` - Error logs

Log level is controlled by `DEBUG` environment variable.

## 🚀 Deployment

### Production Deployment

1. Set `DEBUG=False` in environment variables
2. Set `ENVIRONMENT=production`
3. Use a production ASGI server:
   ```bash
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

### Docker Deployment

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📝 API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/login` - User login

### Projects
- `GET /api/v1/project/` - List projects
- `POST /api/v1/project/` - Create project
- `GET /api/v1/project/{id}` - Get project details
- `PUT /api/v1/project/{id}` - Update project
- `DELETE /api/v1/project/{id}` - Delete project

### Issues
- `GET /api/v1/issue/` - List issues
- `POST /api/v1/issue/` - Create issue
- `GET /api/v1/issue/{id}` - Get issue details
- `PUT /api/v1/issue/{id}` - Update issue
- `DELETE /api/v1/issue/{id}` - Delete issue

### Sprints
- `GET /api/v1/sprint/` - List sprints
- `POST /api/v1/sprint/` - Create sprint
- `GET /api/v1/sprint/{id}` - Get sprint details
- `PUT /api/v1/sprint/{id}` - Update sprint

### Dashboard
- `GET /api/v1/dashboard/manager` - Manager dashboard
- `GET /api/v1/dashboard/employee` - Employee dashboard

See full API documentation at `/docs` when server is running.

## 🔍 Health Check

Check API health:
```bash
curl http://localhost:8000/health
```

## 📞 Support

For issues or questions, please contact the development team.

---

**Built with FastAPI ❤️**