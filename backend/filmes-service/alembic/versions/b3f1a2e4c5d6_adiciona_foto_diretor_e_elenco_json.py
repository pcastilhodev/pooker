"""adiciona diretor_foto_url e expande elenco para TEXT

Revision ID: b3f1a2e4c5d6
Revises: 39dd8a920b45
Create Date: 2026-05-11 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b3f1a2e4c5d6'
down_revision: Union[str, Sequence[str], None] = '39dd8a920b45'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('filmes', sa.Column('diretor_foto_url', sa.String(length=255), nullable=True))
    op.alter_column('filmes', 'elenco', type_=sa.Text(), existing_nullable=True)


def downgrade() -> None:
    op.drop_column('filmes', 'diretor_foto_url')
    op.alter_column('filmes', 'elenco', type_=sa.String(length=255), existing_nullable=True)
