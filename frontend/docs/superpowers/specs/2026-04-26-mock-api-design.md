# Mock API Design

**Date:** 2026-04-26  
**Goal:** Permitir que o frontend rode completamente sem o backend para validar visual e imagens.

---

## Contexto

O projeto Angular (Looker) consome 5 endpoints REST via proxy (`/gateway/**` → `http://localhost:8080`). Sem o backend rodando, o app fica sem dados. A solução é um interceptor HTTP Angular que devolve dados mockados antes que a requisição saia da aplicação.

---

## Arquitetura

Dois arquivos novos em `src/mocks/`. Nenhum arquivo existente é modificado além de `app.config.ts`.

```
src/
  mocks/
    mock-data.ts        ← dados estáticos: 10 filmes + respostas fixas
    mock-interceptor.ts ← HttpInterceptorFn que intercepta por URL
```

### Ativação

Em `app.config.ts`, adicionar o interceptor na lista de `withInterceptors([...])`. Para voltar ao backend real, remover o interceptor.

---

## Endpoints Mockados

| Método | URL (contém) | Resposta |
|--------|-------------|----------|
| POST | `/users/login` | `{ token: "mock-jwt-token" }` |
| POST | `/users/` | `204 No Content` |
| GET | `/filmes/` | `FilmeModel[]` — 10 filmes |
| GET | `/filmes/{id}` | `FilmeModel` correspondente ao ID ou primeiro da lista |
| POST | `/alugueis/` | `{ aluguel: { data_prevista_devolucao }, pagamento: { aluguel_id, amount } }` |

---

## Dados Mock

### Filmes (10 itens)
Campos: `id, titulo, genero, ano, preco_aluguel, sinopse, imagem_url, duracao_minutos, classificacao_indicativa, data_lancamento, total_copias, diretor, copias_disponiveis`

Imagens: URLs públicas de posters reais via TMDB image CDN (`https://image.tmdb.org/t/p/w500/...`).

Gêneros variados para exercitar a feature de filmes similares: Ação, Drama, Ficção Científica, Terror, Comédia.

### Login
Sempre retorna `{ token: "mock-jwt-token" }`. O interceptor do app armazena no `localStorage['jwt']`.

### Registro
Sempre retorna 200. Sem validação.

### Aluguel
Devolve data prevista de devolução = hoje + 7 dias. `aluguel_id` fixo, `amount` baseado no `preco_aluguel` do filme (ou valor fixo 9.99).

---

## Implementação do Interceptor

```ts
export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  const url = req.url;

  if (req.method === 'POST' && url.includes('/users/login'))
    return of(new HttpResponse({ status: 200, body: { token: 'mock-jwt-token' } }));

  if (req.method === 'POST' && url.includes('/users/'))
    return of(new HttpResponse({ status: 200, body: {} }));

  if (req.method === 'GET' && url.includes('/filmes/')) {
    const idMatch = url.match(/\/filmes\/(\d+)/);
    if (idMatch) {
      const filme = MOCK_FILMES.find(f => f.id === +idMatch[1]) ?? MOCK_FILMES[0];
      return of(new HttpResponse({ status: 200, body: filme }));
    }
    return of(new HttpResponse({ status: 200, body: MOCK_FILMES }));
  }

  if (req.method === 'POST' && url.includes('/alugueis/')) {
    const devolucao = new Date();
    devolucao.setDate(devolucao.getDate() + 7);
    return of(new HttpResponse({
      status: 200,
      body: {
        aluguel: { data_prevista_devolucao: devolucao.toISOString() },
        pagamento: { aluguel_id: 'MOCK-001', amount: 9.99 }
      }
    }));
  }

  return next(req);
};
```

---

## Remoção

Para voltar ao backend real: remover `mockInterceptor` de `withInterceptors([...])` em `app.config.ts` e apagar `src/mocks/`.

---

## Fora do escopo

- Persistência de estado entre requisições
- Validação de credenciais
- Paginação
- Autenticação de rotas (guard)
