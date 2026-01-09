# Backend Documentation - AppTodo

Complete guide to the FastAPI backend application.

## 📁 Directory Structure

```
app/
├── backend/
│   ├── main.py              # Application entry point
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database connection
│   │
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── task.py
│   │   ├── category.py
│   │   └── event.py
│   │
│   ├── schemas/             # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── task.py
│   │   ├── category.py
│   │   └── event.py
│   │
│   ├── routers/             # API endpoint definitions
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── tasks.py
│   │   ├── categories.py
│   │   └── users.py
│   │
│   ├── services/            # Business logic layer
│   │   ├── __init__.py
│   │   ├── task_service.py
│   │   ├── auth_service.py
│   │   ├── category_service.py
│   │   └── event_service.py
│   │
│   ├── repositories/        # Data access layer
│   │   ├── __init__.py
│   │   ├── base_repository.py
│   │   ├── task_repository.py
│   │   ├── user_repository.py
│   │   └── category_repository.py
│   │
│   ├── dependencies/        # FastAPI dependencies
│   │   ├── __init__.py
│   │   └── auth.py
│   │
│   ├── utils/               # Utility functions
│   │   ├── __init__.py
│   │   ├── security.py
│   │   ├── validators.py
│   │   └── pagination.py
│   │
│   ├── tests/               # Unit and integration tests
│   │   ├── __init__.py
│   │   ├── test_tasks.py
│   │   ├── test_auth.py
│   │   └── conftest.py
│   │
│   ├── requirements.txt     # Python dependencies
│   ├── pyproject.toml       # Project configuration
│   └── pytest.ini           # Test configuration
```

## 🚀 Application Setup

### main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, tasks, categories

app = FastAPI(title="AppTodo API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(tasks.router, prefix="/api/v1", tags=["tasks"])
app.include_router(categories.router, prefix="/api/v1", tags=["categories"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}
```

## 📊 Database Models

### User Model

```python
from sqlalchemy import Column, String, DateTime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id: str = Column(String, primary_key=True)
    email: str = Column(String, unique=True, index=True)
    username: str = Column(String, unique=True, index=True)
    hashed_password: str = Column(String)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tasks = relationship("Task", back_populates="user")
    categories = relationship("Category", back_populates="user")
```

### Task Model

```python
from sqlalchemy import Column, String, ForeignKey, DateTime, Enum
from app.database import Base

class Task(Base):
    __tablename__ = "tasks"
    
    id: str = Column(String, primary_key=True)
    user_id: str = Column(String, ForeignKey("users.id"))
    title: str = Column(String(255), index=True)
    description: str = Column(String(1000), nullable=True)
    status: str = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    priority: str = Column(Enum(Priority), default=Priority.MEDIUM)
    category_id: str = Column(String, ForeignKey("categories.id"), nullable=True)
    deadline: datetime = Column(DateTime, nullable=True)
    completed_at: datetime = Column(DateTime, nullable=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: datetime = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="tasks")
    category = relationship("Category", back_populates="tasks")
    events = relationship("TaskEvent", back_populates="task")
```

### Category Model

```python
class Category(Base):
    __tablename__ = "categories"
    
    id: str = Column(String, primary_key=True)
    user_id: str = Column(String, ForeignKey("users.id"))
    name: str = Column(String(255), index=True)
    color: str = Column(String(7))  # Hex color
    icon: str = Column(String(50), nullable=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="categories")
    tasks = relationship("Task", back_populates="category")
```

### TaskEvent Model

```python
class TaskEvent(Base):
    __tablename__ = "task_events"
    
    id: str = Column(String, primary_key=True)
    task_id: str = Column(String, ForeignKey("tasks.id"))
    event_type: str = Column(Enum(EventType), index=True)
    old_state: dict = Column(JSON, nullable=True)
    new_state: dict = Column(JSON, nullable=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    task = relationship("Task", back_populates="events")
```

## 🔗 API Endpoints

### Authentication

#### Login
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLC...",
  "token_type": "bearer",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "username": "john_doe"
  }
}
```

#### Register
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "secure_password"
}
```

#### Refresh Token
```
POST /api/v1/auth/refresh
Authorization: Bearer <token>

Response:
{
  "access_token": "new_token",
  "token_type": "bearer"
}
```

### Tasks

#### List Tasks
```
GET /api/v1/tasks?status=pending&priority=high&search=urgent&limit=20&offset=0
Authorization: Bearer <token>

Query Parameters:
- status: pending, completed
- priority: low, medium, high
- category_id: category UUID
- categories: comma-separated category IDs
- deadline_from: ISO datetime string
- deadline_to: ISO datetime string
- search: free text search
- completed: true/false
- limit: pagination limit (default: 20)
- offset: pagination offset (default: 0)

Response:
{
  "items": [
    {
      "id": "task-1",
      "title": "My Task",
      "description": "Task description",
      "status": "pending",
      "priority": "high",
      "deadline": "2026-01-15T00:00:00Z",
      "created_at": "2026-01-09T00:00:00Z"
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

#### Create Task
```
POST /api/v1/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Task Title",
  "description": "Optional description",
  "priority": "medium",
  "category_id": "cat-123",
  "deadline": "2026-01-15T00:00:00Z"
}

Response: Task object with id, timestamps, etc.
```

#### Update Task
```
PUT /api/v1/tasks/{task_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "completed",
  "priority": "high"
}
```

#### Delete Task (Soft Delete)
```
DELETE /api/v1/tasks/{task_id}
Authorization: Bearer <token>
```

#### Restore Task
```
POST /api/v1/tasks/{task_id}/restore
Authorization: Bearer <token>
```

#### Batch Complete
```
POST /api/v1/tasks/batch/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "task_ids": ["id1", "id2", "id3"]
}

Response:
{
  "updated": 3,
  "total": 3
}
```

#### Batch Delete
```
POST /api/v1/tasks/batch/delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "task_ids": ["id1", "id2", "id3"]
}
```

#### Task Events (Audit Log)
```
GET /api/v1/tasks/{task_id}/events?limit=50&offset=0
Authorization: Bearer <token>

Response:
{
  "items": [
    {
      "id": "event-1",
      "event_type": "task_created",
      "old_state": null,
      "new_state": { ... },
      "created_at": "2026-01-09T00:00:00Z"
    }
  ]
}
```

### Categories

#### List Categories
```
GET /api/v1/categories
Authorization: Bearer <token>
```

#### Create Category
```
POST /api/v1/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Work",
  "color": "#FF6B6B",
  "icon": "briefcase"
}
```

#### Update Category
```
PUT /api/v1/categories/{category_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "color": "#0081CF"
}
```

#### Delete Category
```
DELETE /api/v1/categories/{category_id}
Authorization: Bearer <token>
```

## 🏗️ Architecture Layers

### Routers (API Layer)

```python
# routers/tasks.py
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(prefix="/tasks")

@router.get("/")
async def list_tasks(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all tasks for current user"""
    tasks = TaskService(db).get_user_tasks(
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    return {"items": tasks, "total": len(tasks)}
```

### Services (Business Logic Layer)

```python
# services/task_service.py
class TaskService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = TaskRepository(db)
    
    def create_task(self, user_id: str, task_data: CreateTaskInput) -> Task:
        # Business logic
        task = self.repository.create(
            user_id=user_id,
            **task_data.dict()
        )
        
        # Create event
        EventService(self.db).log_event(
            task_id=task.id,
            event_type="task_created",
            new_state=task.to_dict()
        )
        
        return task
    
    def get_user_tasks(self, user_id: str, skip: int = 0, limit: int = 20):
        return self.repository.get_by_user(user_id, skip, limit)
```

### Repositories (Data Access Layer)

```python
# repositories/task_repository.py
class TaskRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, **kwargs) -> Task:
        task = Task(**kwargs)
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def get_by_user(self, user_id: str, skip: int = 0, limit: int = 20):
        return self.db.query(Task)\
            .filter(Task.user_id == user_id)\
            .filter(Task.deleted_at == None)\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def search(self, user_id: str, query: str):
        return self.db.query(Task)\
            .filter(Task.user_id == user_id)\
            .filter(Task.deleted_at == None)\
            .filter(
                or_(
                    Task.title.ilike(f"%{query}%"),
                    Task.description.ilike(f"%{query}%")
                )
            )\
            .all()
```

## 🔐 Authentication & Security

### JWT Token Generation

```python
# utils/security.py
from datetime import datetime, timedelta
from jose import JWTError, jwt

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        return user_id
    except JWTError:
        return None
```

### Dependency: Get Current User

```python
# dependencies/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    user_id = verify_token(token)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user
```

## ✅ Validation

### Pydantic Schemas

```python
# schemas/task.py
from pydantic import BaseModel, Field, validator

class CreateTaskInput(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(default=None, max_length=1000)
    priority: Priority = Field(default=Priority.MEDIUM)
    category_id: str = Field(default=None)
    deadline: datetime = Field(default=None)
    
    @validator('title')
    def title_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()

class TaskResponse(BaseModel):
    id: str
    title: str
    description: str
    status: TaskStatus
    priority: Priority
    created_at: datetime
    
    class Config:
        from_attributes = True  # ORM mode
```

## 🧪 Testing

### Unit Tests with pytest

```python
# tests/test_tasks.py
import pytest
from app.services.task_service import TaskService
from app.repositories.task_repository import TaskRepository

@pytest.fixture
def db_session():
    # Setup test database
    yield session
    # Cleanup

def test_create_task(db_session):
    service = TaskService(db_session)
    task = service.create_task(
        user_id="test-user",
        task_data={
            "title": "Test Task",
            "priority": "high"
        }
    )
    
    assert task.id
    assert task.title == "Test Task"
    assert task.priority == "high"

def test_search_tasks(db_session):
    service = TaskService(db_session)
    # Create test tasks
    service.create_task("user1", {"title": "Important Meeting"})
    service.create_task("user1", {"title": "Grocery Shopping"})
    
    results = service.search("user1", "important")
    assert len(results) == 1
    assert results[0].title == "Important Meeting"
```

### Running Tests

```bash
# All tests
pytest

# Specific file
pytest tests/test_tasks.py

# With coverage
pytest --cov=app

# Verbose output
pytest -v
```

## 🚀 Deployment

### Environment Variables

```bash
# .env
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///./test.db
CORS_ORIGINS=http://localhost:5173,https://example.com
DEBUG=False
```

### Running in Production

```bash
# Using Gunicorn + Uvicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app

# Or using Uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 📊 Database Migrations

Using Alembic for migrations:

```bash
# Create migration
alembic revision --autogenerate -m "Add user table"

# Apply migrations
alembic upgrade head

# Downgrade
alembic downgrade -1
```

## 📈 Performance Optimization

### Database Indexing

```python
# models/task.py
class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)  # Index
    status = Column(String, index=True)  # Index
    created_at = Column(DateTime, index=True)  # Index
```

### Query Optimization

```python
# Use eager loading to avoid N+1 queries
tasks = db.query(Task).options(
    joinedload(Task.category),
    joinedload(Task.user)
).filter(Task.user_id == user_id).all()
```

### Pagination

```python
def get_paginated(db: Session, skip: int = 0, limit: int = 20):
    total = db.query(Task).count()
    items = db.query(Task).offset(skip).limit(limit).all()
    
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }
```

## 📚 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [Pydantic](https://docs.pydantic.dev/)
- [Pytest](https://docs.pytest.org/)
- [JWT Authentication](https://tools.ietf.org/html/rfc7519)

---

**Last Updated:** January 2026
