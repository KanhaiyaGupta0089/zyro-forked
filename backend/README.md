# Zyro Backend API

FastAPI backend application for Zyro project management system.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── api/              # API routes
│   │   ├── __init__.py
│   │   └── v1/           # API version 1
│   │       ├── __init__.py
│   │       └── api.py    # API router
│   ├── core/             # Core configuration
│   │   ├── __init__.py
│   │   └── config.py     # Settings and configuration
│   ├── db/               # Database related
│   │   ├── __init__.py
│   │   └── base.py       # Database base setup
│   ├── models/           # Database models
│   │   └── __init__.py
│   ├── schemas/          # Pydantic schemas
│   │   └── __init__.py
│   ├── services/         # Business logic
│   │   └── __init__.py
│   └── utils/            # Utility functions
│       └── __init__.py
├── tests/                # Test files
│   └── __init__.py
├── main.py               # Application entry point
├── requirements.txt      # Python dependencies
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Run the application:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

API documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

