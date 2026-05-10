import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { LoginService } from './login-service';
import { RegisterModel } from '../models/register-model';

describe('LoginService', () => {
  let service: LoginService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(LoginService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── authenticate ──────────────────────────────────────────────────────────

  it('authenticate deve fazer POST em /gateway/user/api/v1/users/login', () => {
    service.authenticate('user@test.com', 'senha123').subscribe();

    const req = httpMock.expectOne('/gateway/user/api/v1/users/login');
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'abc' });
  });

  it('authenticate deve enviar email e senha no body', () => {
    service.authenticate('user@test.com', 'senha123').subscribe();

    const req = httpMock.expectOne('/gateway/user/api/v1/users/login');
    expect(req.request.body).toEqual({ email: 'user@test.com', senha: 'senha123' });
    req.flush({});
  });

  it('authenticate deve retornar resposta da API', () => {
    const respostaMock = { token: 'meu.jwt.token' };

    let resultado: any;
    service.authenticate('u@u.com', 'pass').subscribe(r => (resultado = r));

    httpMock.expectOne('/gateway/user/api/v1/users/login').flush(respostaMock);
    expect(resultado).toEqual(respostaMock);
  });

  it('authenticate deve propagar erro 401 com credenciais inválidas', () => {
    let erroCapturado: any;
    service.authenticate('errado@test.com', 'senhaerrada').subscribe({ error: e => (erroCapturado = e) });

    httpMock.expectOne('/gateway/user/api/v1/users/login').flush(
      'Unauthorized',
      { status: 401, statusText: 'Unauthorized' }
    );
    expect(erroCapturado.status).toBe(401);
  });

  // ── register ──────────────────────────────────────────────────────────────

  it('register deve fazer POST em /gateway/user/api/v1/users/', () => {
    const dados: RegisterModel = { nome: 'Ana', cpf: '12345678901', email: 'ana@test.com', senha: 'senha' };
    service.register(dados).subscribe();

    const req = httpMock.expectOne('/gateway/user/api/v1/users/');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('register deve enviar os campos do model no body com role "user"', () => {
    const dados: RegisterModel = {
      nome: 'João', cpf: '98765432100', email: 'joao@test.com',
      senha: 'senha', telefone: '11999999999', data_nascimento: new Date('1990-01-01')
    };
    service.register(dados).subscribe();

    const req = httpMock.expectOne('/gateway/user/api/v1/users/');
    expect(req.request.body.nome).toBe('João');
    expect(req.request.body.cpf).toBe('98765432100');
    expect(req.request.body.role).toBe('user');
    req.flush({});
  });

  it('register deve retornar resposta da API', () => {
    const respostaMock = { id: 1, email: 'ana@test.com' };
    const dados: RegisterModel = { nome: 'Ana', email: 'ana@test.com', senha: 'senha' };

    let resultado: any;
    service.register(dados).subscribe(r => (resultado = r));

    httpMock.expectOne('/gateway/user/api/v1/users/').flush(respostaMock);
    expect(resultado).toEqual(respostaMock);
  });
});
