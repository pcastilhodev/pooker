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

  it('authenticate posts username/password mapped to email/senha, to the login endpoint', () => {
    let result: { token: string } | undefined;
    service.authenticate('user@test.com', 'secret123').subscribe(r => (result = r));

    const req = httpMock.expectOne('/gateway/user/api/v1/users/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'user@test.com', senha: 'secret123' });

    req.flush({ token: 'jwt-token-abc' });
    expect(result).toEqual({ token: 'jwt-token-abc' });
  });

  it('authenticate propagates HTTP errors to the caller', () => {
    let error: unknown;
    service.authenticate('bad@test.com', 'wrong').subscribe({
      error: e => (error = e)
    });

    const req = httpMock.expectOne('/gateway/user/api/v1/users/login');
    req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(error).toBeTruthy();
  });

  it('register posts the full payload with role hardcoded to "user"', () => {
    spyOn(console, 'log');
    const data: RegisterModel = {
      nome: 'Fulano',
      cpf: '12345678900',
      email: 'fulano@test.com',
      senha: 'senha123',
      telefone: '11999999999',
      data_nascimento: new Date('1990-01-01')
    };

    let result: unknown;
    service.register(data).subscribe(r => (result = r));

    const req = httpMock.expectOne('/gateway/user/api/v1/users/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      nome: 'Fulano',
      cpf: '12345678900',
      email: 'fulano@test.com',
      senha: 'senha123',
      telefone: '11999999999',
      data_nascimento: data.data_nascimento,
      role: 'user'
    });

    req.flush({ id: 1 });
    expect(result).toEqual({ id: 1 });
    expect(console.log).toHaveBeenCalledWith(data);
  });

  it('register sends undefined fields through as-is when data is partial', () => {
    spyOn(console, 'log');
    const data: RegisterModel = { email: 'only-email@test.com' };

    service.register(data).subscribe();

    const req = httpMock.expectOne('/gateway/user/api/v1/users/');
    expect(req.request.body).toEqual({
      nome: undefined,
      cpf: undefined,
      email: 'only-email@test.com',
      senha: undefined,
      telefone: undefined,
      data_nascimento: undefined,
      role: 'user'
    });

    req.flush({});
  });

  it('register propagates HTTP errors to the caller', () => {
    spyOn(console, 'log');
    let error: unknown;
    service.register({ email: 'dup@test.com' }).subscribe({
      error: e => (error = e)
    });

    const req = httpMock.expectOne('/gateway/user/api/v1/users/');
    req.flush({ message: 'Email already exists' }, { status: 409, statusText: 'Conflict' });

    expect(error).toBeTruthy();
  });
});
