"""Added type of signup in user table

Revision ID: 894fb8135097
Revises: 31d8aacd18e8
Create Date: 2026-01-21 21:26:17.547439
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '894fb8135097'
down_revision: Union[str, None] = '31d8aacd18e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create ENUM type (required for PostgreSQL)
    signup_enum = sa.Enum('EMAIL', 'GOOGLE', name='typeofsignup')
    signup_enum.create(op.get_bind(), checkfirst=True)

    # 2. Add column with database-level default
    op.add_column(
        'user',
        sa.Column(
            'type_of_signup',
            signup_enum,
            nullable=False,
            server_default='EMAIL'
        )
    )


def downgrade() -> None:
    # 1. Drop column
    op.drop_column('user', 'type_of_signup')

    # 2. Drop ENUM type
    signup_enum = sa.Enum('EMAIL', 'GOOGLE', name='typeofsignup')
    signup_enum.drop(op.get_bind(), checkfirst=True)
