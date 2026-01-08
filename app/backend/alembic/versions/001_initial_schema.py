"""Initial schema with all tables

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-01-08 20:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create initial schema."""
    # Users table
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('username', sa.String(length=255), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email'),
    sa.UniqueConstraint('username')
    )
    op.create_index(op.f('idx_users_email'), 'users', ['email'], unique=False)

    # Tasks table
    op.create_table('tasks',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('priority', sa.String(length=20), nullable=False, server_default='media'),
    sa.Column('deadline', sa.Date(), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False, server_default='pendiente'),
    sa.Column('recurrence_rule', sa.String(length=255), nullable=True),
    sa.Column('completed_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.CheckConstraint("priority IN ('baja', 'media', 'alta')"),
    sa.CheckConstraint("status IN ('pendiente', 'en_progreso', 'completada')")
    )
    op.create_index(op.f('idx_tasks_user_id'), 'tasks', ['user_id'], unique=False)
    op.create_index(op.f('idx_tasks_status'), 'tasks', ['status'], unique=False)
    op.create_index(op.f('idx_tasks_priority'), 'tasks', ['priority'], unique=False)
    op.create_index(op.f('idx_tasks_deadline'), 'tasks', ['deadline'], unique=False)
    op.create_index(op.f('idx_tasks_deleted_at'), 'tasks', ['deleted_at'], unique=False)
    op.create_index(op.f('idx_tasks_user_status'), 'tasks', ['user_id', 'status'], unique=False)
    op.create_index(op.f('idx_tasks_user_deadline'), 'tasks', ['user_id', 'deadline'], unique=False)

    # Categories table
    op.create_table('categories',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('color', sa.String(length=20), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'name')
    )
    op.create_index(op.f('idx_categories_user_id'), 'categories', ['user_id'], unique=False)

    # Task-Category relationship (M2M)
    op.create_table('task_categories',
    sa.Column('task_id', sa.Integer(), nullable=False),
    sa.Column('category_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('task_id', 'category_id')
    )

    # Refresh tokens for secure authentication
    op.create_table('refresh_tokens',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('token_hash', sa.String(length=255), nullable=False),
    sa.Column('expires_at', sa.DateTime(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('token_hash')
    )
    op.create_index(op.f('idx_refresh_tokens_user_id'), 'refresh_tokens', ['user_id'], unique=False)
    op.create_index(op.f('idx_refresh_tokens_expires_at'), 'refresh_tokens', ['expires_at'], unique=False)

    # Task events for audit trail and event sourcing
    op.create_table('task_events',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('task_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('event_type', sa.String(length=50), nullable=False),
    sa.Column('old_state', sqlite.JSON(), nullable=True),
    sa.Column('new_state', sqlite.JSON(), nullable=True),
    sa.Column('payload', sqlite.JSON(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.CheckConstraint("event_type IN ('task_created', 'task_updated', 'task_completed', 'task_deleted', 'task_restored', 'priority_changed', 'deadline_changed', 'status_changed', 'category_added', 'category_removed')")
    )
    op.create_index(op.f('idx_task_events_task_id'), 'task_events', ['task_id'], unique=False)
    op.create_index(op.f('idx_task_events_user_id'), 'task_events', ['user_id'], unique=False)
    op.create_index(op.f('idx_task_events_event_type'), 'task_events', ['event_type'], unique=False)
    op.create_index(op.f('idx_task_events_created_at'), 'task_events', ['created_at'], unique=False)

    # Idempotency keys for preventing duplicates
    op.create_table('idempotency_keys',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('idempotency_key', sa.String(length=255), nullable=False),
    sa.Column('request_hash', sa.String(length=255), nullable=True),
    sa.Column('response_data', sqlite.JSON(), nullable=True),
    sa.Column('status_code', sa.Integer(), nullable=True),
    sa.Column('expires_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('idempotency_key')
    )
    op.create_index(op.f('idx_idempotency_keys_user_id'), 'idempotency_keys', ['user_id'], unique=False)
    op.create_index(op.f('idx_idempotency_keys_expires_at'), 'idempotency_keys', ['expires_at'], unique=False)


def downgrade() -> None:
    """Drop all tables."""
    op.drop_index(op.f('idx_idempotency_keys_expires_at'), table_name='idempotency_keys')
    op.drop_index(op.f('idx_idempotency_keys_user_id'), table_name='idempotency_keys')
    op.drop_table('idempotency_keys')
    
    op.drop_index(op.f('idx_task_events_created_at'), table_name='task_events')
    op.drop_index(op.f('idx_task_events_event_type'), table_name='task_events')
    op.drop_index(op.f('idx_task_events_user_id'), table_name='task_events')
    op.drop_index(op.f('idx_task_events_task_id'), table_name='task_events')
    op.drop_table('task_events')
    
    op.drop_index(op.f('idx_refresh_tokens_expires_at'), table_name='refresh_tokens')
    op.drop_index(op.f('idx_refresh_tokens_user_id'), table_name='refresh_tokens')
    op.drop_table('refresh_tokens')
    
    op.drop_table('task_categories')
    
    op.drop_index(op.f('idx_categories_user_id'), table_name='categories')
    op.drop_table('categories')
    
    op.drop_index(op.f('idx_tasks_user_deadline'), table_name='tasks')
    op.drop_index(op.f('idx_tasks_user_status'), table_name='tasks')
    op.drop_index(op.f('idx_tasks_deleted_at'), table_name='tasks')
    op.drop_index(op.f('idx_tasks_deadline'), table_name='tasks')
    op.drop_index(op.f('idx_tasks_priority'), table_name='tasks')
    op.drop_index(op.f('idx_tasks_status'), table_name='tasks')
    op.drop_index(op.f('idx_tasks_user_id'), table_name='tasks')
    op.drop_table('tasks')
    
    op.drop_index(op.f('idx_users_email'), table_name='users')
    op.drop_table('users')
