from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'xxxx_merge_phase0_phase1'
down_revision = 'previous_revision_id'  # Change to your last migration
branch_labels = None
depends_on = None


def upgrade():
    """Upgrade schema from Phase 0 to Phase 1"""
    
    # ========================================================================
    # STEP 1: Change column types for precision
    # ========================================================================
    
    # Change units_consumed from Integer to Float
    op.alter_column(
        'electricity_bills',
        'units_consumed',
        type_=sa.Float(),
        existing_type=sa.Integer(),
        existing_nullable=True
    )
    
    # Change units_exported from Integer to Float
    op.alter_column(
        'electricity_bills',
        'units_exported',
        type_=sa.Float(),
        existing_type=sa.Integer(),
        existing_nullable=False,
        server_default='0'
    )
    
    # Change date columns from DateTime to Date
    op.alter_column(
        'electricity_bills',
        'bill_date',
        type_=sa.Date(),
        existing_type=sa.DateTime(),
        existing_nullable=True,
        postgresql_using='bill_date::date'
    )
    
    op.alter_column(
        'electricity_bills',
        'previous_reading_date',
        type_=sa.Date(),
        existing_type=sa.DateTime(),
        existing_nullable=True,
        postgresql_using='previous_reading_date::date'
    )
    
    op.alter_column(
        'electricity_bills',
        'current_reading_date',
        type_=sa.Date(),
        existing_type=sa.DateTime(),
        existing_nullable=True,
        postgresql_using='current_reading_date::date'
    )
    
    # ========================================================================
    # STEP 2: Add new customer information fields
    # ========================================================================
    
    op.add_column(
        'electricity_bills',
        sa.Column('mobile_number', sa.String(20), nullable=True)
    )
    
    op.add_column(
        'electricity_bills',
        sa.Column('area_office', sa.String(100), nullable=True)
    )
    
    op.add_column(
        'electricity_bills',
        sa.Column('walk_order', sa.String(50), nullable=True)
    )
    
    op.add_column(
        'electricity_bills',
        sa.Column('premises_id', sa.String(50), nullable=True)
    )
    
    # ========================================================================
    # STEP 3: Add current month charge breakdown fields
    # ========================================================================
    
    op.add_column(
        'electricity_bills',
        sa.Column('current_month_subtotal', sa.Float(), nullable=True)
    )
    
    op.add_column(
        'electricity_bills',
        sa.Column('sscl_tax', sa.Float(), nullable=True)
    )
    
    op.add_column(
        'electricity_bills',
        sa.Column('current_month_charge', sa.Float(), nullable=True)
    )
    
    # ========================================================================
    # STEP 4: Add arrears tracking fields
    # ========================================================================
    
    op.add_column(
        'electricity_bills',
        sa.Column('credits', sa.Float(), nullable=True, server_default='0')
    )
    
    op.add_column(
        'electricity_bills',
        sa.Column('debits', sa.Float(), nullable=True, server_default='0')
    )
    
    # ========================================================================
    # STEP 5: Add payment tracking fields
    # ========================================================================
    
    op.add_column(
        'electricity_bills',
        sa.Column('last_payment_amount', sa.Float(), nullable=True)
    )
    
    op.add_column(
        'electricity_bills',
        sa.Column('last_payment_date', sa.Date(), nullable=True)
    )
    
    op.add_column(
        'electricity_bills',
        sa.Column('due_date', sa.Date(), nullable=True)
    )
    
    # ========================================================================
    # STEP 6: Backfill data for existing bills
    # ========================================================================
    
    # For existing bills, set current_month_charge = total_charge
    # (since old bills don't have arrears tracking)
    op.execute("""
        UPDATE electricity_bills
        SET current_month_charge = total_charge,
            current_month_subtotal = total_charge / 1.025,  -- Reverse SSCL
            sscl_tax = total_charge - (total_charge / 1.025),
            credits = 0,
            debits = 0
        WHERE current_month_charge IS NULL
          AND total_charge IS NOT NULL
    """)
    
    # For bills where total_due != total_charge, calculate arrears
    op.execute("""
        UPDATE electricity_bills
        SET previous_due = total_due - current_month_charge
        WHERE current_month_charge IS NOT NULL
          AND total_due IS NOT NULL
          AND total_due > current_month_charge
          AND previous_due = 0
    """)
    
    print("✅ Phase 1 fields added and data backfilled!")


def downgrade():
    """Downgrade schema from Phase 1 to Phase 0"""
    
    # Remove payment tracking fields
    op.drop_column('electricity_bills', 'due_date')
    op.drop_column('electricity_bills', 'last_payment_date')
    op.drop_column('electricity_bills', 'last_payment_amount')
    
    # Remove arrears tracking fields
    op.drop_column('electricity_bills', 'debits')
    op.drop_column('electricity_bills', 'credits')
    
    # Remove current month charge breakdown
    op.drop_column('electricity_bills', 'current_month_charge')
    op.drop_column('electricity_bills', 'sscl_tax')
    op.drop_column('electricity_bills', 'current_month_subtotal')
    
    # Remove customer information fields
    op.drop_column('electricity_bills', 'premises_id')
    op.drop_column('electricity_bills', 'walk_order')
    op.drop_column('electricity_bills', 'area_office')
    op.drop_column('electricity_bills', 'mobile_number')
    
    # Revert date columns to DateTime
    op.alter_column(
        'electricity_bills',
        'current_reading_date',
        type_=sa.DateTime(),
        existing_type=sa.Date(),
        existing_nullable=True
    )
    
    op.alter_column(
        'electricity_bills',
        'previous_reading_date',
        type_=sa.DateTime(),
        existing_type=sa.Date(),
        existing_nullable=True
    )
    
    op.alter_column(
        'electricity_bills',
        'bill_date',
        type_=sa.DateTime(),
        existing_type=sa.Date(),
        existing_nullable=True
    )
    
    # Revert Float to Integer for units
    op.alter_column(
        'electricity_bills',
        'units_exported',
        type_=sa.Integer(),
        existing_type=sa.Float(),
        existing_nullable=False,
        server_default='0'
    )
    
    op.alter_column(
        'electricity_bills',
        'units_consumed',
        type_=sa.Integer(),
        existing_type=sa.Float(),
        existing_nullable=True
    )
    
    print("✅ Downgraded to Phase 0 schema")
