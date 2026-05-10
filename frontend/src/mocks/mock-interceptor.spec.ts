import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { mockInterceptor } from './mock-interceptor';
import { MOCK_FILMES } from './mock-data';

describe('mockInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([mockInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('POST /users/login retorna token mock', (done) => {
    http.post<{ token: string }>('/gateway/user/api/v1/users/login', {}).subscribe((res) => {
      expect(res.token).toBe('mock-jwt-token');
      done();
    });
    httpTesting.expectNone('/gateway/user/api/v1/users/login');
  });

  it('POST /users/ retorna 200', (done) => {
    http.post('/gateway/user/api/v1/users/', {}).subscribe((res) => {
      expect(res).toEqual({});
      done();
    });
    httpTesting.expectNone('/gateway/user/api/v1/users/');
  });

  it('GET /filmes/ retorna array com 10 filmes', (done) => {
    http.get<any[]>('/gateway/movie/v1/filmes/').subscribe((res) => {
      expect(res.length).toBe(10);
      expect(res[0].titulo).toBe('The Dark Knight');
      done();
    });
    httpTesting.expectNone('/gateway/movie/v1/filmes/');
  });

  it('GET /filmes/2 retorna o filme com id 2', (done) => {
    http.get<any>('/gateway/movie/v1/filmes/2').subscribe((res) => {
      expect(res.id).toBe(2);
      expect(res.titulo).toBe('Inception');
      done();
    });
    httpTesting.expectNone('/gateway/movie/v1/filmes/2');
  });

  it('GET /filmes/99 retorna o primeiro filme quando id nao existe', (done) => {
    http.get<any>('/gateway/movie/v1/filmes/99').subscribe((res) => {
      expect(res.id).toBe(MOCK_FILMES[0].id);
      done();
    });
    httpTesting.expectNone('/gateway/movie/v1/filmes/99');
  });

  it('POST /alugueis/ retorna aluguel com data de devolucao e pagamento', (done) => {
    http.post<any>('/gateway/rent/v1/alugueis/', { filme_id: 1 }).subscribe((res) => {
      expect(res.aluguel.data_prevista_devolucao).toBeDefined();
      expect(res.pagamento.aluguel_id).toBe('MOCK-001');
      expect(res.pagamento.amount).toBe(MOCK_FILMES[0].preco_aluguel);
      done();
    });
    httpTesting.expectNone('/gateway/rent/v1/alugueis/');
  });
});
