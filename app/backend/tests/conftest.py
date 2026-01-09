"""
Pytest configuration and fixtures for test isolation.

This module provides fixtures to ensure test isolation by cleaning
the database between tests.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db


# Create in-memory database for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override the get_db dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function", autouse=True)
def setup_database():
    """
    Fixture that recreates the database schema before each test.

    This ensures test isolation by giving each test a clean database.
    Using scope="function" means this runs before every test function.
    Using autouse=True means it applies automatically to all tests.
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)

    yield

    # Drop all tables after the test
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client():
    """
    Fixture that provides a TestClient with database dependency override.

    Each test that uses this fixture gets a fresh client with a clean database.
    """
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def authenticated_client(client):
    """
    Fixture that provides an authenticated TestClient.

    Creates a test user and returns a client with auth headers set.
    """
    # Register test user
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "SecurePass123"
        }
    )

    # Login to get token
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "SecurePass123"
        }
    )

    token = response.json()["data"]["access_token"]

    # Set auth header for subsequent requests
    client.headers = {
        **client.headers,
        "Authorization": f"Bearer {token}"
    }

    return client
