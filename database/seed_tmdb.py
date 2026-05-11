"""
Seed enriquecido via TMDB — busca poster, sinopse (pt-BR), diretor com foto,
elenco com personagens e fotos, duração, classificação indicativa e data de lançamento.

Uso:
    pip install requests psycopg2-binary passlib bcrypt
    python database/seed_tmdb.py --api-key SUA_KEY_AQUI

Chave gratuita: https://www.themoviedb.org/ → Settings → API
"""

import argparse
import json
import sys
import time

import psycopg2
import requests
from passlib.context import CryptContext
from psycopg2.extras import execute_values

# ── Configurações ────────────────────────────────────────────────────────────

DB = dict(host="localhost", port=5432, dbname="trabalho_if", user="postgres", password="postgres")

TMDB_BASE    = "https://api.themoviedb.org/3"
TMDB_IMG     = "https://image.tmdb.org/t/p/w500"
TMDB_FACE_LG = "https://image.tmdb.org/t/p/w300"
TMDB_FACE_SM = "https://image.tmdb.org/t/p/w185"

# (tmdb_id, preco_aluguel, total_copias)
FILMES_CONFIG = [
    (238,    12.90, 5),   # O Poderoso Chefão
    (424,    11.90, 4),   # A Lista de Schindler
    (550,    10.90, 6),   # Clube da Luta
    (603,    10.90, 8),   # Matrix
    (13,      9.90, 7),   # Forrest Gump
    (597,     9.90, 5),   # Titanic
    (120,    11.90, 6),   # O Senhor dos Anéis: A Sociedade do Anel
    (680,    10.90, 5),   # Pulp Fiction
    (157336, 13.90, 7),   # Interestelar
    (299534, 14.90, 10),  # Vingadores: Ultimato
    (496243, 12.90, 4),   # Parasita
    (155,    12.90, 8),   # O Cavaleiro das Trevas
    (244786, 10.90, 5),   # Whiplash
    (475557, 11.90, 6),   # Coringa
    (313369, 10.90, 5),   # La La Land
    (389,    11.90, 5),   # 12 Homens e uma Sentença
    (278,    12.90, 6),   # Um Sonho de Liberdade
    (240,    12.90, 4),   # O Poderoso Chefão II
    (129,    10.90, 5),   # A Viagem de Chihiro
    (19404,  10.90, 4),   # Dilwale Dulhania Le Jayenge
    (372058, 11.90, 5),   # Your Name
    (324857, 13.90, 6),   # Homem-Aranha: No Aranhaverso
    (299536, 14.90, 8),   # Vingadores: Guerra Infinita
    (346364, 11.90, 5),   # It: A Coisa
    (118340, 12.90, 6),   # Guardiões da Galáxia
]

CERT_MAP = {
    "G": "L", "PG": "10", "PG-13": "12", "R": "16", "NC-17": "18",
    "L": "L", "10": "10", "12": "12", "14": "14", "16": "16", "18": "18",
}

# ── Helpers TMDB ─────────────────────────────────────────────────────────────

def tmdb_get(path: str, api_key: str, params: dict = None) -> dict:
    url = f"{TMDB_BASE}{path}"
    p = {"api_key": api_key, "language": "pt-BR", **(params or {})}
    resp = requests.get(url, params=p, timeout=10)
    resp.raise_for_status()
    return resp.json()


def fetch_filme(tmdb_id: int, api_key: str) -> dict:
    data = tmdb_get(f"/movie/{tmdb_id}", api_key, {"append_to_response": "credits,release_dates"})

    credits  = data.get("credits", {})
    crew     = credits.get("crew", [])
    cast_raw = credits.get("cast", [])

    # Diretor
    director = next((c for c in crew if c["job"] == "Director"), None)
    diretor  = director["name"] if director else None
    diretor_foto_url = (
        f"{TMDB_FACE_LG}{director['profile_path']}"
        if director and director.get("profile_path") else None
    )

    # Elenco (top 6) com personagem e foto
    elenco_list = [
        {
            "name":      c["name"],
            "character": c.get("character") or "",
            "foto_url":  f"{TMDB_FACE_SM}{c['profile_path']}" if c.get("profile_path") else None,
        }
        for c in cast_raw[:6]
    ]
    elenco_json = json.dumps(elenco_list, ensure_ascii=False)

    # Gêneros em português
    generos = "/".join(g["name"] for g in data.get("genres", [])[:2]) or "Drama"

    # Classificação indicativa
    cert = _extrair_cert(data.get("release_dates", {}).get("results", []))

    # Poster
    poster = f"{TMDB_IMG}{data['poster_path']}" if data.get("poster_path") else None

    ano = int(data["release_date"][:4]) if data.get("release_date") else None

    return {
        "titulo":                 data.get("title") or data.get("original_title"),
        "genero":                 generos,
        "ano":                    ano,
        "sinopse":                data.get("overview") or None,
        "imagem_url":             poster,
        "duracao_minutos":        data.get("runtime") or None,
        "elenco":                 elenco_json,
        "diretor":                diretor,
        "diretor_foto_url":       diretor_foto_url,
        "classificacao_indicativa": cert,
        "data_lancamento":        data.get("release_date") or None,
    }


def _extrair_cert(release_dates: list) -> str | None:
    for iso in ("BR", "US"):
        for entry in release_dates:
            if entry["iso_3166_1"] == iso:
                for rd in entry.get("release_dates", []):
                    cert = rd.get("certification", "").strip()
                    if cert:
                        return CERT_MAP.get(cert, cert)
    return None


# ── Banco ────────────────────────────────────────────────────────────────────

def wait_for_db(retries=15, delay=3):
    for i in range(retries):
        try:
            conn = psycopg2.connect(**DB)
            conn.close()
            return
        except psycopg2.OperationalError:
            print(f"  aguardando banco... ({i+1}/{retries})")
            time.sleep(delay)
    print("ERRO: banco nao ficou disponivel.")
    sys.exit(1)


def ensure_columns(cur):
    """Garante que as colunas novas existam sem depender do Alembic."""
    cur.execute("""
        ALTER TABLE filmes
            ADD COLUMN IF NOT EXISTS diretor_foto_url VARCHAR(255);
    """)
    cur.execute("""
        ALTER TABLE filmes
            ALTER COLUMN elenco TYPE TEXT;
    """)


def seed_usuarios(cur):
    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
    cur.execute("""
        INSERT INTO tb_usuarios (nome, cpf, email, senha, telefone, data_nascimento, role)
        VALUES
            ('Admin Pooker',   '00000000001', 'admin@pooker.com', %s, '(11) 91111-0001', '1990-01-01', 'admin'),
            ('Joao Silva',     '00000000002', 'joao@pooker.com',  %s, '(11) 92222-0002', '1995-06-15', 'user'),
            ('Maria Oliveira', '00000000003', 'maria@pooker.com', %s, '(11) 93333-0003', '1998-03-22', 'user')
        ON CONFLICT (email) DO NOTHING;
    """, (pwd.hash("admin123"), pwd.hash("user123"), pwd.hash("user123")))
    print("  admin@pooker.com / admin123")
    print("  joao@pooker.com  / user123")
    print("  maria@pooker.com / user123")


def seed_filmes(cur, api_key: str):
    rows = []
    for tmdb_id, preco, copias in FILMES_CONFIG:
        try:
            f = fetch_filme(tmdb_id, api_key)
            rows.append((
                f["titulo"], f["genero"], f["ano"], f["sinopse"],
                f["imagem_url"], f["duracao_minutos"], f["elenco"],
                f["diretor"], f["diretor_foto_url"], f["classificacao_indicativa"],
                f["data_lancamento"], preco, copias, copias,
            ))
            print(f"  ok {f['titulo']} ({f['ano']})")
        except Exception as e:
            print(f"  erro tmdb_id={tmdb_id} — {e}")
        time.sleep(0.25)

    # Remove filmes antigos e reinserem com dados completos
    cur.execute("DELETE FROM filmes")

    execute_values(cur, """
        INSERT INTO filmes
            (titulo, genero, ano, sinopse, imagem_url, duracao_minutos, elenco,
             diretor, diretor_foto_url, classificacao_indicativa, data_lancamento,
             preco_aluguel, total_copias, copias_disponiveis)
        VALUES %s
    """, rows)
    print(f"\n  {len(rows)} filmes inseridos.")


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-key", required=True, help="TMDB API key")
    args = parser.parse_args()

    print("Conectando ao banco...")
    wait_for_db()

    conn = psycopg2.connect(**DB)
    conn.autocommit = False
    cur = conn.cursor()

    print("\nGarantindo colunas...")
    ensure_columns(cur)

    print("\nUsuarios...")
    seed_usuarios(cur)

    print("\nFilmes (buscando no TMDB)...")
    seed_filmes(cur, args.api_key)

    conn.commit()
    cur.close()
    conn.close()
    print("\nSeed concluido!")


if __name__ == "__main__":
    main()
