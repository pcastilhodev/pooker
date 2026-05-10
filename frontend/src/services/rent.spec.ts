import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Rent } from './rent';

describe('Rent', () => {
  let service: Rent;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(Rent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── getRents ──────────────────────────────────────────────────────────────

  it('getRents deve fazer POST em /gateway/rent/v1/alugueis/', () => {
    service.getRents(1).subscribe();

    const req = httpMock.expectOne('/gateway/rent/v1/alugueis/');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('getRents deve enviar filme_id no body', () => {
    service.getRents(42).subscribe();

    const req = httpMock.expectOne('/gateway/rent/v1/alugueis/');
    expect(req.request.body).toEqual({ filme_id: 42 });
    req.flush({});
  });

  it('getRents deve retornar resposta da API', () => {
    const respostaMock = { id: 10, filme_id: 5, usuario_id: 1 };

    let resultado: any;
    service.getRents(5).subscribe(r => (resultado = r));

    httpMock.expectOne('/gateway/rent/v1/alugueis/').flush(respostaMock);
    expect(resultado).toEqual(respostaMock);
  });

  it('getRents deve propagar erro 401 quando não autenticado', () => {
    let erroCapturado: any;
    service.getRents(1).subscribe({ error: e => (erroCapturado = e) });

    httpMock.expectOne('/gateway/rent/v1/alugueis/').flush(
      'Unauthorized',
      { status: 401, statusText: 'Unauthorized' }
    );
    expect(erroCapturado.status).toBe(401);
  });
});
