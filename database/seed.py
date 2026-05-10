"""
Seed script — popula o banco trabalho_if com filmes e usuarios de demo.
Rode DEPOIS de iniciar todos os servicos (tabelas ja criadas pelo create_all).

  pip install psycopg2-binary passlib bcrypt
  python database/seed.py
"""

import sys
import time
import psycopg2
from psycopg2.extras import execute_values
from passlib.context import CryptContext

DB = dict(host="localhost", port=5432, dbname="trabalho_if", user="postgres", password="postgres")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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


def seed():
    conn = psycopg2.connect(**DB)
    conn.autocommit = False
    cur = conn.cursor()

    # ── USUARIOS ────────────────────────────────────────────────────────────────
    print("→ inserindo usuarios...")

    senha_admin = pwd_context.hash("admin123")
    senha_user  = pwd_context.hash("user123")

    cur.execute("""
        INSERT INTO tb_usuarios (nome, cpf, email, senha, telefone, data_nascimento, role)
        VALUES
            ('Admin Pooker',  '00000000001', 'admin@pooker.com', %s, '(11) 91111-0001', '1990-01-01', 'admin'),
            ('João Silva',    '00000000002', 'joao@pooker.com',  %s, '(11) 92222-0002', '1995-06-15', 'user'),
            ('Maria Oliveira','00000000003', 'maria@pooker.com', %s, '(11) 93333-0003', '1998-03-22', 'user')
        ON CONFLICT (email) DO NOTHING;
    """, (senha_admin, senha_user, senha_user))

    print("   admin@pooker.com  / admin123")
    print("   joao@pooker.com   / user123")
    print("   maria@pooker.com  / user123")

    # ── FILMES ──────────────────────────────────────────────────────────────────
    print("→ inserindo filmes...")

    filmes = [
        (
            "O Poderoso Chefão", "Crime/Drama", 1972,
            "A história da família Corleone, uma das mais poderosas famílias da máfia americana, e as guerras pelo poder que se seguem.",
            "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsLban7TTDiAu.jpg",
            175, "Marlon Brando, Al Pacino, James Caan", "Francis Ford Coppola",
            "14", "1972-03-24", 12.90, 5, 5
        ),
        (
            "A Lista de Schindler", "Drama/História", 1993,
            "Oskar Schindler, um empresário alemão, salva mais de mil judeus poloneses durante o Holocausto empregando-os em suas fábricas.",
            "https://image.tmdb.org/t/p/w500/sF1U4EUQS8Dyz2NyFSFVcTKnzQ2.jpg",
            195, "Liam Neeson, Ben Kingsley, Ralph Fiennes", "Steven Spielberg",
            "14", "1993-12-15", 11.90, 4, 4
        ),
        (
            "Clube da Luta", "Drama/Thriller", 1999,
            "Um homem insatisfeito com sua vida corporativa forma um clube de luta clandestino com um carismático vendedor de sabão.",
            "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
            139, "Brad Pitt, Edward Norton, Helena Bonham Carter", "David Fincher",
            "18", "1999-10-15", 10.90, 6, 6
        ),
        (
            "Matrix", "Ficção Científica/Ação", 1999,
            "Um hacker descobre que a realidade como a conhecemos é uma simulação criada por máquinas que escravizaram a humanidade.",
            "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
            136, "Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss", "Lana e Lilly Wachowski",
            "14", "1999-03-31", 10.90, 8, 8
        ),
        (
            "Forrest Gump", "Drama/Romance", 1994,
            "A história de vida extraordinária de um homem de Alabama com QI abaixo da média que acidentalmente influencia vários eventos históricos.",
            "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
            142, "Tom Hanks, Robin Wright, Gary Sinise", "Robert Zemeckis",
            "12", "1994-07-06", 9.90, 7, 7
        ),
        (
            "Titanic", "Drama/Romance", 1997,
            "Um jovem de classe baixa e uma jovem aristocrata se apaixonam a bordo do lendário navio Titanic em sua fatídica viagem inaugural.",
            "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
            194, "Leonardo DiCaprio, Kate Winslet, Billy Zane", "James Cameron",
            "12", "1997-12-19", 9.90, 5, 5
        ),
        (
            "O Senhor dos Anéis: A Sociedade do Anel", "Fantasia/Aventura", 2001,
            "Um hobbit herda um anel mágico e embarca em uma jornada épica com seus companheiros para destruí-lo antes que caia nas mãos do Senhor das Trevas.",
            "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
            178, "Elijah Wood, Ian McKellen, Viggo Mortensen", "Peter Jackson",
            "12", "2001-12-19", 11.90, 6, 6
        ),
        (
            "Pulp Fiction", "Crime/Drama", 1994,
            "Histórias entrelaçadas de criminosos, um boxeador, um gângster e seus associados em Los Angeles.",
            "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
            154, "John Travolta, Uma Thurman, Samuel L. Jackson", "Quentin Tarantino",
            "18", "1994-10-14", 10.90, 5, 5
        ),
        (
            "Interestelar", "Ficção Científica/Drama", 2014,
            "Uma equipe de exploradores viaja por um buraco de minhoca no espaço em busca de um novo planeta habitável para a humanidade.",
            "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
            169, "Matthew McConaughey, Anne Hathaway, Jessica Chastain", "Christopher Nolan",
            "10", "2014-11-07", 13.90, 7, 7
        ),
        (
            "Vingadores: Ultimato", "Ação/Ficção Científica", 2019,
            "Após Thanos eliminar metade das criaturas do universo, os Vingadores restantes buscam maneiras de reverter o desastre.",
            "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
            181, "Robert Downey Jr., Chris Evans, Mark Ruffalo", "Anthony e Joe Russo",
            "12", "2019-04-26", 14.90, 10, 10
        ),
        (
            "Parasita", "Drama/Suspense", 2019,
            "Uma família pobre infiltra-se na vida de uma família rica, gerando consequências imprevisíveis e violentas.",
            "https://image.tmdb.org/t/p/w500/7IiTTgloROVKhJDCyCjkVCS8G5I.jpg",
            132, "Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong", "Bong Joon-ho",
            "16", "2019-05-30", 12.90, 4, 4
        ),
        (
            "O Cavaleiro das Trevas", "Ação/Crime", 2008,
            "Batman enfrenta o Coringa, um criminoso anárquico que semeia o caos em Gotham City e força o herói a questionar seus limites.",
            "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
            152, "Christian Bale, Heath Ledger, Aaron Eckhart", "Christopher Nolan",
            "12", "2008-07-18", 12.90, 8, 8
        ),
        (
            "Whiplash: Em Busca da Perfeição", "Drama/Musical", 2014,
            "Um jovem baterista ambicioso enfrenta um professor brutal e obsessivo na busca pela grandeza musical.",
            "https://image.tmdb.org/t/p/w500/oPB1Twvm3bBBHdSVaCBMDgOQoej.jpg",
            107, "Miles Teller, J.K. Simmons, Melissa Benoist", "Damien Chazelle",
            "14", "2014-10-10", 10.90, 5, 5
        ),
        (
            "Coringa", "Drama/Suspense", 2019,
            "A origem do supervilão Coringa, um comediante fracassado que afunda na loucura e torna-se um símbolo do caos em Gotham.",
            "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
            122, "Joaquin Phoenix, Robert De Niro, Zazie Beetz", "Todd Phillips",
            "16", "2019-10-04", 11.90, 6, 6
        ),
        (
            "La La Land: Cantando Estações", "Musical/Romance", 2016,
            "Um pianista de jazz e uma aspirante a atriz se apaixonam em Los Angeles enquanto perseguem seus sonhos.",
            "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
            128, "Ryan Gosling, Emma Stone, John Legend", "Damien Chazelle",
            "10", "2016-12-09", 10.90, 5, 5
        ),
    ]

    execute_values(cur, """
        INSERT INTO filmes
            (titulo, genero, ano, sinopse, imagem_url, duracao_minutos, elenco, diretor,
             classificacao_indicativa, data_lancamento, preco_aluguel, total_copias, copias_disponiveis)
        VALUES %s
        ON CONFLICT DO NOTHING
    """, filmes)

    print(f"   {len(filmes)} filmes inseridos.")

    conn.commit()
    cur.close()
    conn.close()
    print("\n✅ Seed concluido!")
    print("\nCredenciais de acesso:")
    print("  admin@pooker.com  →  admin123")
    print("  joao@pooker.com   →  user123")
    print("  maria@pooker.com  →  user123")


if __name__ == "__main__":
    print("Conectando ao banco de dados...")
    wait_for_db()
    seed()
