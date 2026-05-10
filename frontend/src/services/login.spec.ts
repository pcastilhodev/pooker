import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { LoginService } from './login-service';

describe('Login', () => {
  let service: LoginService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(LoginService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
