"""
Test fixtures and shared infrastructure.

Uses an in-memory SQLite DB so tests never touch srts.db.

The critical detail: SQLite's in-memory databases are per-connection.
We use StaticPool to force all connections to share a single in-memory
DB, so tables created in setup remain visible across connections.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.database as _db_module
from app.database import Base, get_db
from app.main import app
from app.seed import seed_database
from app.routers.alerts import refresh_alerts


def _make_test_engine():
    return create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )


@pytest.fixture(scope="function")
def db_session():
    """
    Fresh in-memory SQLite session with seed data, using StaticPool so all
    connections see the same database state.
    """
    test_engine = _make_test_engine()
    TestingSession = sessionmaker(bind=test_engine, autocommit=False, autoflush=False)

    Base.metadata.create_all(bind=test_engine)
    session = TestingSession()
    seed_database(session)
    refresh_alerts(session)

    # Patch module globals so the app's lifespan and any direct SessionLocal()
    # calls also land in the same in-memory database.
    orig_engine = _db_module.engine
    orig_session = _db_module.SessionLocal
    _db_module.engine = test_engine
    _db_module.SessionLocal = TestingSession

    yield session

    _db_module.engine = orig_engine
    _db_module.SessionLocal = orig_session
    session.close()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """TestClient wired to the in-memory DB session via dependency override."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()
