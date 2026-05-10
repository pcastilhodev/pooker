import sys
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

# === CONFIGURAÇÕES DE CAMINHO ===
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# === CARREGAR VARIÁVEIS DO .ENV ===
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "app", "core", ".env"))

# === IMPORTAR MODELS E BASE ===
from app.core.db_usuario import Base
from app.models.models_user import User

# === LOGGING DO ALEMBIC ===
if context.config.config_file_name is not None:
    fileConfig(context.config.config_file_name)

# === METADATA PARA AUTOGENERATE ===
target_metadata = Base.metadata

# === URL DO BANCO ===
DATABASE_URL = (
    f"postgresql+psycopg2://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
    f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
)

# === MIGRATIONS OFFLINE ===
def run_migrations_offline() -> None:
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table="alembic_version_usuario"  # tabela de versão específica
    )
    with context.begin_transaction():
        context.run_migrations()


# === MIGRATIONS ONLINE ===
def run_migrations_online() -> None:
    connectable = engine_from_config(
        {"sqlalchemy.url": DATABASE_URL},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            version_table="alembic_version_usuario"  # tabela de versão específica
        )
        with context.begin_transaction():
            context.run_migrations()


# === EXECUÇÃO ===
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
