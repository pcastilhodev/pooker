import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './http-interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('jwt');
  });

  it('should be defined', () => {
    expect(authInterceptor).toBeDefined();
  });

  // ── com token no localStorage ─────────────────────────────────────────────

  it('com token no localStorage adiciona header Authorization: Bearer', () => {
    localStorage.setItem('jwt', 'meu.token.jwt');

    http.get('/alguma/rota').subscribe();

    const req = httpMock.expectOne('/alguma/rota');
    expect(req.request.headers.get('Authorization')).toBe('Bearer meu.token.jwt');
    req.flush({});
  });

  it('com token diferente adiciona o token correto no header', () => {
    localStorage.setItem('jwt', 'outro.token.diferente');

    http.get('/outra/rota').subscribe();

    const req = httpMock.expectOne('/outra/rota');
    expect(req.request.headers.get('Authorization')).toBe('Bearer outro.token.diferente');
    req.flush({});
  });

  // ── sem token no localStorage ─────────────────────────────────────────────

  it('sem token no localStorage não adiciona header Authorization', () => {
    localStorage.removeItem('jwt');

    http.get('/rota/sem/token').subscribe();

    const req = httpMock.expectOne('/rota/sem/token');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
  });

  it('sem token encaminha a requisição original sem modificação do método', () => {
    localStorage.removeItem('jwt');

    http.post('/rota/post', { dado: 1 }).subscribe();

    const req = httpMock.expectOne('/rota/post');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
  });
});
