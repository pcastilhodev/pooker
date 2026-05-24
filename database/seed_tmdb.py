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
    # ── Clássicos originais ───────────────────────────────────────────────────
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

    # ── Drama / Thriller / Crime ──────────────────────────────────────────────
    (637,    10.90, 5),   # A Vida é Bela
    (769,    12.90, 6),   # Os Bons Companheiros
    (807,    11.90, 5),   # Seven
    (274,    11.90, 5),   # O Silêncio dos Inocentes
    (77,     10.90, 4),   # Amnésia
    (106646, 12.90, 5),   # O Lobo de Wall Street
    (489,    10.90, 5),   # Gênio Indomável
    (745,    11.90, 5),   # O Sexto Sentido
    (37799,  11.90, 6),   # A Rede Social
    (65754,  10.90, 4),   # Cisne Negro
    (490,    11.90, 4),   # O Pianista
    (334,    11.90, 4),   # Apocalypse Now
    (539,    10.90, 4),   # Psicose
    (62,     11.90, 4),   # 2001: Uma Odisseia no Espaço
    (1422,   12.90, 5),   # Os Infiltrados
    (197,    11.90, 5),   # Coração Valente
    (241,    11.90, 4),   # O Poderoso Chefão III
    (504608, 11.90, 5),   # Entre Facas e Segredos
    (399055, 12.90, 5),   # Corra!
    (399171, 11.90, 5),   # Nós
    (68718,  12.90, 5),   # Django Livre
    (130993, 11.90, 5),   # O Grande Hotel Budapeste
    (194662, 10.90, 5),   # Birdman
    (395991, 11.90, 4),   # Me Chame Pelo Seu Nome
    (332562, 10.90, 5),   # Nasce uma Estrela
    (503919, 11.90, 4),   # O Farol
    (522481, 10.90, 5),   # História de um Casamento
    (38757,  11.90, 4),   # O Artista
    (376867, 11.90, 4),   # Moonlight
    (264660, 11.90, 5),   # Ex Machina
    (273248, 11.90, 5),   # Os Oito Odiados
    (902,    11.90, 4),   # Janela Indiscreta
    (631,    11.90, 4),   # Vertigo

    # ── Ficção Científica ─────────────────────────────────────────────────────
    (27205,  13.90, 7),   # A Origem
    (78,     11.90, 5),   # Blade Runner
    (335984, 12.90, 5),   # Blade Runner 2049
    (218,    10.90, 5),   # O Exterminador do Futuro
    (280,    11.90, 6),   # O Exterminador do Futuro 2
    (348,    10.90, 5),   # Alien
    (679,    11.90, 5),   # Aliens
    (286217, 12.90, 5),   # Perdido em Marte
    (438631, 13.90, 7),   # Duna
    (693134, 14.90, 7),   # Duna: Parte Dois
    (105864, 12.90, 5),   # Gravidade
    (604,    10.90, 5),   # Matrix Reloaded
    (414906, 12.90, 5),   # Tenet

    # ── Guerra nas Estrelas ───────────────────────────────────────────────────
    (11,     12.90, 7),   # Star Wars: Uma Nova Esperança
    (1891,   12.90, 6),   # Star Wars: O Império Contra-Ataca
    (1892,   11.90, 5),   # Star Wars: O Retorno de Jedi
    (140607, 13.90, 7),   # Star Wars: O Despertar da Força
    (330459, 12.90, 6),   # Rogue One: Uma História Star Wars

    # ── Christopher Nolan ─────────────────────────────────────────────────────
    (272,    11.90, 5),   # Batman Begins
    (49026,  12.90, 6),   # Batman: O Cavaleiro das Trevas Ressurge
    (7491,   11.90, 5),   # O Grande Truque
    (872585, 14.90, 8),   # Oppenheimer

    # ── Marvel ────────────────────────────────────────────────────────────────
    (1726,   11.90, 6),   # Homem de Ferro
    (10195,  10.90, 5),   # Thor
    (1771,   11.90, 5),   # Capitão América: O Primeiro Vingador
    (24428,  13.90, 8),   # Os Vingadores
    (68721,  11.90, 5),   # Homem de Ferro 3
    (100402, 12.90, 6),   # Capitão América: O Soldado Invernal
    (99861,  13.90, 7),   # Vingadores: Era de Ultron
    (271110, 13.90, 7),   # Capitão América: Guerra Civil
    (284053, 12.90, 6),   # Thor: Ragnarok
    (284054, 13.90, 7),   # Pantera Negra
    (299537, 12.90, 6),   # Capitã Marvel
    (315635, 12.90, 6),   # Homem-Aranha: De Volta ao Lar
    (363088, 11.90, 5),   # Homem-Formiga e a Vespa
    (429617, 12.90, 6),   # Homem-Aranha: Longe de Casa
    (497698, 12.90, 5),   # Viúva Negra
    (524434, 12.90, 5),   # Eternos
    (566525, 12.90, 6),   # Shang-Chi e a Lenda dos Dez Anéis
    (569094, 13.90, 6),   # Homem-Aranha: Através do Aranhaverso
    (634649, 14.90, 8),   # Homem-Aranha: Sem Volta para Casa
    (293660, 11.90, 6),   # Deadpool
    (567604, 14.90, 7),   # Deadpool e Wolverine
    (102899, 11.90, 5),   # Homem-Formiga
    (284052, 12.90, 5),   # Doutor Estranho

    # ── DC ────────────────────────────────────────────────────────────────────
    (209112, 11.90, 5),   # Batman vs Superman
    (297762, 12.90, 6),   # Mulher-Maravilha
    (333339, 11.90, 5),   # Jogador Nº 1

    # ── Animação ─────────────────────────────────────────────────────────────
    (862,    9.90, 6),    # Toy Story
    (863,    9.90, 5),    # Toy Story 2
    (10193,  10.90, 6),   # Toy Story 3
    (301528, 10.90, 5),   # Toy Story 4
    (9806,   10.90, 6),   # Os Incríveis
    (260513, 10.90, 6),   # Os Incríveis 2
    (10681,  10.90, 5),   # WALL-E
    (14160,  10.90, 6),   # Up: Altas Aventuras
    (8587,   9.90, 5),    # O Rei Leão
    (585,    9.90, 5),    # Monstros S.A.
    (920,    9.90, 5),    # Carros
    (12,     9.90, 5),    # Procurando Nemo
    (127380, 10.90, 5),   # Procurando Dory
    (150540, 11.90, 5),   # Divertida Mente
    (354912, 10.90, 5),   # Viva: A Vida é uma Festa
    (109445, 9.90, 6),    # Frozen: Uma Aventura Congelante
    (330457, 10.90, 5),   # Frozen II
    (269149, 10.90, 5),   # Zootopia
    (11324,  9.90, 5),    # Shrek
    (810,    9.90, 5),    # Shrek 2
    (438148, 10.90, 5),   # Minions: A Origem do Gru
    (508943, 10.90, 5),   # Luca
    (508947, 10.90, 5),   # Turning Red
    (508965, 10.90, 5),   # Encanto
    (315162, 10.90, 5),   # Gato de Botas 2: O Último Pedido
    (4935,   10.90, 5),   # O Castelo Animado
    (128,    11.90, 5),   # Princesa Mononoke
    (12477,  10.90, 4),   # Túmulo dos Vagalumes
    (508442, 11.90, 5),   # Soul
    (10191,  10.90, 5),   # Como Treinar Seu Dragão

    # ── O Senhor dos Anéis / Hobbit ───────────────────────────────────────────
    (121,    12.90, 6),   # LOTR: O Retorno do Rei
    (122,    11.90, 6),   # LOTR: As Duas Torres
    (49051,  11.90, 5),   # O Hobbit: Uma Jornada Inesperada
    (57158,  11.90, 5),   # O Hobbit: A Desolação de Smaug
    (122917, 11.90, 4),   # O Hobbit: A Batalha dos Cinco Exércitos

    # ── Harry Potter ──────────────────────────────────────────────────────────
    (671,    10.90, 6),   # Harry Potter e a Pedra Filosofal
    (672,    10.90, 5),   # Harry Potter e a Câmara Secreta
    (673,    10.90, 5),   # Harry Potter e o Prisioneiro de Azkaban
    (674,    10.90, 5),   # Harry Potter e o Cálice de Fogo
    (675,    10.90, 5),   # Harry Potter e a Ordem da Fênix
    (676,    10.90, 5),   # Harry Potter e o Enigma do Príncipe
    (12444,  10.90, 5),   # Harry Potter e as Relíquias da Morte Parte 1
    (12445,  10.90, 5),   # Harry Potter e as Relíquias da Morte Parte 2

    # ── Ação / Aventura ───────────────────────────────────────────────────────
    (98,     11.90, 6),   # Gladiador
    (562,    10.90, 5),   # Duro de Matar
    (22,     10.90, 6),   # Piratas do Caribe: A Maldição do Pérola Negra
    (105,    10.90, 6),   # De Volta para o Futuro
    (324786, 11.90, 5),   # Até o Último Homem
    (361743, 13.90, 7),   # Top Gun: Maverick
    (51497,  11.90, 5),   # Velozes e Furiosos 5
    (70160,  11.90, 6),   # Jogos Vorazes
    (101299, 11.90, 5),   # Jogos Vorazes: Em Chamas
    (161,    10.90, 5),   # Onze Homens e um Segredo
    (177677, 11.90, 5),   # Missão: Impossível - Nação Secreta
    (353081, 12.90, 5),   # Missão: Impossível - Efeito Fallout
    (56292,  12.90, 5),   # Missão: Impossível - Protocolo Fantasma
    (329,    10.90, 5),   # Jurassic Park
    (135397, 11.90, 5),   # Jurassic World
    (459151, 10.90, 5),   # O Rei do Show
    (346698, 12.90, 6),   # Barbie
    (603692, 11.90, 5),   # Não Olhe para Cima
    (96721,  11.90, 5),   # Rush
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

    # Remove filmes antigos, reseta sequência e reinserem com dados completos
    cur.execute("TRUNCATE TABLE filmes RESTART IDENTITY CASCADE")

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
