import { AuthService, decodeJwt } from './auth-service';

function makeJwt(payload: any): string {
  const b64 = (obj: any) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'none' })}.${b64(payload)}.signature`;
}

describe('decodeJwt', () => {
  it('decodes a valid jwt payload', () => {
    const token = makeJwt({ email: 'a@b.com', exp: 9999999999 });
    expect(decodeJwt(token)?.email).toBe('a@b.com');
  });

  it('returns null for a malformed token', () => {
    expect(decodeJwt('not-a-jwt')).toBeNull();
  });

  it('returns null for garbage payload', () => {
    expect(decodeJwt('a.b.c')).toBeNull();
  });
});

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => { localStorage.clear(); service = new AuthService(); });

  it('starts logged out with no token', () => {
    expect(service.isLoggedIn).toBeFalse();
    expect(service.user).toBeNull();
    expect(service.token).toBeNull();
  });

  it('setToken logs the user in with data from the jwt', () => {
    service.setToken(makeJwt({ email: 'ana@test.com', nome: 'Ana', exp: 9999999999 }));

    expect(service.isLoggedIn).toBeTrue();
    expect(service.user?.email).toBe('ana@test.com');
    expect(service.user?.nome).toBe('Ana');
  });

  it('derives a name from email when nome is missing', () => {
    service.setToken(makeJwt({ email: 'joao.silva@test.com', exp: 9999999999 }));
    expect(service.user?.nome).toBe('Joao Silva');
  });

  it('logout clears the token and user', () => {
    service.setToken(makeJwt({ email: 'a@b.com', exp: 9999999999 }));
    service.logout();

    expect(service.isLoggedIn).toBeFalse();
    expect(service.token).toBeNull();
  });

  it('treats an expired token as logged out', () => {
    service.setToken(makeJwt({ email: 'a@b.com', exp: 1 }));
    expect(service.isLoggedIn).toBeFalse();
    expect(localStorage.getItem('jwt')).toBeNull();
  });

  it('refresh re-reads the token from storage', () => {
    localStorage.setItem('jwt', makeJwt({ email: 'x@y.com', exp: 9999999999 }));
    service.refresh();
    expect(service.user?.email).toBe('x@y.com');
  });
});
