import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { MOCK_FILMES } from './mock-data';

interface MockRental {
  id: string;
  filme_id: number;
  filme_titulo: string;
  filme_imagem_url: string;
  data_aluguel: string;
  data_prevista_devolucao: string;
  data_devolucao: string | null;
  status: string;
  preco: number;
}

interface LoginBody {
  email?: string;
}

interface RentalBody {
  filme_id?: number;
}

const MOCK_RENTALS: MockRental[] = [];

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
  const utf8 = decodeURIComponent(encodeURIComponent(value));
  return btoa(utf8).replace(/={1,2}$/, '').replaceAll('+', '-').replaceAll('/', '_');
}

export function isMockApiEnabled(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('mock-api') === '1';
  } catch {
    return false;
  }
}

function handleLoginPost(body: unknown): Observable<HttpResponse<unknown>> {
  const email = (body as LoginBody)?.email ?? 'visitante@looker.com';
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

function handleFilmesGet(url: string): Observable<HttpResponse<unknown>> {
  const idMatch = /\/filmes\/(\d+)/.exec(url);
  if (idMatch) {
    const filme = MOCK_FILMES.find(f => f.id === +idMatch[1]) ?? MOCK_FILMES[0];
    return of(new HttpResponse({ status: 200, body: filme }));
  }
  return of(new HttpResponse({ status: 200, body: MOCK_FILMES }));
}

function handleAlugueisPost(body: unknown): Observable<HttpResponse<unknown>> {
  const filmeId = (body as RentalBody)?.filme_id;
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

function handlePost(url: string, body: unknown): Observable<HttpResponse<unknown>> | null {
  if (url.includes('/users/login')) return handleLoginPost(body);
  if (url.includes('/users/'))     return of(new HttpResponse({ status: 200, body: {} }));
  if (url.includes('/alugueis/'))  return handleAlugueisPost(body);
  return null;
}

function handleGet(url: string): Observable<HttpResponse<unknown>> | null {
  if (url.includes('/filmes/'))     return handleFilmesGet(url);
  if (url.endsWith('/alugueis/me')) return of(new HttpResponse({ status: 200, body: MOCK_RENTALS }));
  return null;
}

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isMockApiEnabled()) return next(req);
  let result: Observable<HttpResponse<unknown>> | null = null;
  if (req.method === 'POST')      result = handlePost(req.url, req.body);
  else if (req.method === 'GET')  result = handleGet(req.url);
  return result ?? next(req);
};

function deriveName(email: string): string {
  const local = email.split('@')[0] ?? 'Usuário';
  return local
    .replaceAll(/[._-]+/g, ' ')
    .replaceAll(/\b\w/g, c => c.toUpperCase());
}
