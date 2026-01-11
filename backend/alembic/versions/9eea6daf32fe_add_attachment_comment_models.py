"""add attachment and comment models

Revision ID: 9eea6daf32fe
Revises: 2ca734a101dc
Create Date: 2024-01-11

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9eea6daf32fe'
down_revision: Union[str, None] = '2ca734a101dc'  # Latest migration: updated user model
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    # Create attachment table
    op.create_table(
        'attachment',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('issue_id', sa.Integer(), nullable=False),
        sa.Column('file_name', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('file_type', sa.String(), nullable=False),
        sa.Column('file_url', sa.String(), nullable=False),
        sa.Column('cloudinary_public_id', sa.String(), nullable=False),
        sa.Column('uploaded_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['issue_id'], ['issue.id'], ),
        sa.ForeignKeyConstraint(['uploaded_by'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_attachment_issue_id', 'attachment', ['issue_id'], unique=False)
    op.create_index('idx_attachment_user_id', 'attachment', ['uploaded_by'], unique=False)
    
    # Create comment table
    op.create_table(
        'comment',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('issue_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.String(), nullable=False),
        sa.Column('edited', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['issue_id'], ['issue.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_comment_issue_id', 'comment', ['issue_id'], unique=False)
    op.create_index('idx_comment_user_id', 'comment', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_comment_user_id', table_name='comment')
    op.drop_index('idx_comment_issue_id', table_name='comment')
    op.drop_table('comment')
    op.drop_index('idx_attachment_user_id', table_name='attachment')
    op.drop_index('idx_attachment_issue_id', table_name='attachment')
    op.drop_table('attachment')
