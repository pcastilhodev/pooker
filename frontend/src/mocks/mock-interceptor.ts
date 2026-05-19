import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { MOCK_FILMES } from './mock-data';

const MOCK_RENTALS: any[] = [];

function buildMockJwt(payload: Record<string, unknown>): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify({
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
    ...payload,
  }));
  return `${header}.${body}.mock-signature`;
}

function base64UrlEncode(value: string): string {
  const utf8 = unescape(encodeURIComponent(value));
  return btoa(utf8).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function isMockApiEnabled(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('mock-api') === '1';
  } catch {
    return false;
  }
}

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isMockApiEnabled()) return next(req);
  const url = req.url;

  if (req.method === 'POST' && url.includes('/users/login')) {
    const email = (req.body as any)?.email ?? 'visitante@looker.com';
    const token = buildMockJwt({
      sub:   email,
      email,
      nome:  deriveName(email),
      role:  'user',
      cpf:   '12345678901',
      telefone: '11999998888',
      data_nascimento: '1995-04-12',
    });
    return of(new HttpResponse({ status: 200, body: { token } }));
  }

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

  if (req.method === 'GET' && url.endsWith('/alugueis/me')) {
    return of(new HttpResponse({ status: 200, body: MOCK_RENTALS }));
  }

  if (req.method === 'POST' && url.includes('/alugueis/')) {
    const filmeId = (req.body as any)?.filme_id;
    const filme = MOCK_FILMES.find(f => f.id === filmeId) ?? MOCK_FILMES[0];
    const now = new Date();
    const devolucao = new Date();
    devolucao.setDate(devolucao.getDate() + 7);
    const id = `MOCK-${String(MOCK_RENTALS.length + 1).padStart(3, '0')}`;

    MOCK_RENTALS.unshift({
      id,
      filme_id: filme.id,
      filme_titulo: filme.titulo,
      filme_imagem_url: filme.imagem_url,
      data_aluguel: now.toISOString(),
      data_prevista_devolucao: devolucao.toISOString(),
      data_devolucao: null,
      status: 'ativo',
      preco: filme.preco_aluguel,
    });

    return of(new HttpResponse({
      status: 200,
      body: {
        aluguel: { data_prevista_devolucao: devolucao.toISOString() },
        pagamento: { aluguel_id: id, amount: filme.preco_aluguel },
      },
    }));
  }

  return next(req);
};

function deriveName(email: string): string {
  const local = email.split('@')[0] ?? 'Usuário';
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
