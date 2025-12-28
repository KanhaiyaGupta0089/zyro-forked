from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '9f8ff92e1f30'
down_revision = '2eed5761779a'
branch_labels = None
depends_on = None

# Define the Enum type
priority_enum = postgresql.ENUM('LOW', 'MODERATE', 'HIGH', 'CRITICAL', name='priority')

def upgrade() -> None:
    # Create the enum type in DB
    priority_enum.create(op.get_bind(), checkfirst=True)
    
    # Add the column
    op.add_column('issue', sa.Column('priority', priority_enum, nullable=True))


def downgrade() -> None:
    # Drop the column
    op.drop_column('issue', 'priority')
    
    # Drop the enum type if not needed
    priority_enum.drop(op.get_bind(), checkfirst=True)
