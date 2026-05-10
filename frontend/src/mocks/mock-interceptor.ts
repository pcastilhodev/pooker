import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { MOCK_FILMES } from './mock-data';

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
    const filmeId = (req.body as any)?.filme_id;
    const filme = MOCK_FILMES.find(f => f.id === filmeId) ?? MOCK_FILMES[0];
    const devolucao = new Date();
    devolucao.setDate(devolucao.getDate() + 7);
    return of(new HttpResponse({
      status: 200,
      body: {
        aluguel: { data_prevista_devolucao: devolucao.toISOString() },
        pagamento: { aluguel_id: 'MOCK-001', amount: filme.preco_aluguel },
      },
    }));
  }

  return next(req);
};
