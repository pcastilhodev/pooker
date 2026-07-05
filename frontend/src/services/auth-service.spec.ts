import { AuthService, AuthUser, decodeJwt, JwtPayload } from './auth-service';

const TOKEN_KEY = 'jwt';

function base64Url(json: string): string {
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function makeToken(payload: JwtPayload): string {
  return `header.${base64Url(JSON.stringify(payload))}.signature`;
}

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    service = new AuthService();
  });

  describe('initial state (no token)', () => {
    it('token is null', () => { expect(service.token).toBeNull(); });
    it('user is null', () => { expect(service.user).toBeNull(); });
    it('isLoggedIn is false', () => { expect(service.isLoggedIn).toBeFalse(); });
  });

  describe('setToken', () => {
    it('stores the token in localStorage', () => {
      const token = makeToken({ email: 'a@b.com', exp: Math.floor(Date.now() / 1000) + 1000 });
      service.setToken(token);
      expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
      expect(service.token).toBe(token);
    });

    it('populates user and isLoggedIn from a valid, non-expired token', () => {
      const token = makeToken({ nome: 'João', email: 'joao@example.com', exp: Math.floor(Date.now() / 1000) + 1000 });
      service.setToken(token);
      expect(service.isLoggedIn).toBeTrue();
      expect(service.user).toEqual(jasmine.objectContaining({ nome: 'João', email: 'joao@example.com' }));
    });

    it('emits the new user on user$', () => {
      const emitted: (AuthUser | null)[] = [];
      service.user$.subscribe(u => emitted.push(u));
      const token = makeToken({ email: 'x@y.com', exp: Math.floor(Date.now() / 1000) + 1000 });
      service.setToken(token);
      expect(emitted.length).toBe(2); // initial null + after setToken
      expect(emitted[1]?.email).toBe('x@y.com');
    });
  });

  describe('logout', () => {
    it('removes the token and clears the user', () => {
      const token = makeToken({ email: 'x@y.com', exp: Math.floor(Date.now() / 1000) + 1000 });
      service.setToken(token);
      service.logout();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(service.user).toBeNull();
      expect(service.isLoggedIn).toBeFalse();
    });
  });

  describe('refresh', () => {
    it('re-reads the user from localStorage', () => {
      expect(service.user).toBeNull();
      const token = makeToken({ email: 'refreshed@example.com', exp: Math.floor(Date.now() / 1000) + 1000 });
      localStorage.setItem(TOKEN_KEY, token);
      service.refresh();
      expect(service.user?.email).toBe('refreshed@example.com');
    });

    it('clears user when localStorage token is removed externally', () => {
      const token = makeToken({ email: 'x@y.com', exp: Math.floor(Date.now() / 1000) + 1000 });
      service.setToken(token);
      localStorage.removeItem(TOKEN_KEY);
      service.refresh();
      expect(service.user).toBeNull();
    });
  });

  describe('token expiration', () => {
    it('treats an expired token as absent and removes it from storage', () => {
      const token = makeToken({ email: 'x@y.com', exp: Math.floor(Date.now() / 1000) - 1000 });
      localStorage.setItem(TOKEN_KEY, token);
      const svc = new AuthService();
      expect(svc.user).toBeNull();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('treats a token with no exp claim as never expiring', () => {
      const token = makeToken({ email: 'x@y.com' });
      localStorage.setItem(TOKEN_KEY, token);
      const svc = new AuthService();
      expect(svc.user?.email).toBe('x@y.com');
    });
  });

  describe('constructor with a malformed token already in storage', () => {
    it('does not throw and results in a null user', () => {
      localStorage.setItem(TOKEN_KEY, 'not-a-valid-jwt');
      expect(() => new AuthService()).not.toThrow();
      const svc = new AuthService();
      expect(svc.user).toBeNull();
    });
  });

  describe('buildUser field mapping', () => {
    const future = Math.floor(Date.now() / 1000) + 1000;

    it('prefers payload.nome over payload.name', () => {
      const token = makeToken({ nome: 'Nome Principal', name: 'Nome Secundario', email: 'a@b.com', exp: future });
      service.setToken(token);
      expect(service.user?.nome).toBe('Nome Principal');
    });

    it('falls back to payload.name when nome is absent', () => {
      const token = makeToken({ name: 'Fallback Name', email: 'a@b.com', exp: future });
      service.setToken(token);
      expect(service.user?.nome).toBe('Fallback Name');
    });

    it('derives nome from email when nome and name are absent', () => {
      const token = makeToken({ email: 'john.doe_test-name@example.com', exp: future });
      service.setToken(token);
      expect(service.user?.nome).toBe('John Doe Test Name');
    });

    it('derives nome from sub when email is also absent', () => {
      const token = makeToken({ sub: 'jane.smith@example.com', exp: future });
      service.setToken(token);
      expect(service.user?.nome).toBe('Jane Smith');
    });

    it('uses "Usuário" when there is nothing to derive a name from', () => {
      const token = makeToken({ exp: future });
      service.setToken(token);
      expect(service.user?.nome).toBe('Usuário');
    });

    it('uses "Usuário" when the email local part is empty', () => {
      const token = makeToken({ email: '@example.com', exp: future });
      service.setToken(token);
      expect(service.user?.nome).toBe('Usuário');
    });

    it('falls back to sub for email when email claim is absent', () => {
      const token = makeToken({ sub: 'sub-email@example.com', exp: future });
      service.setToken(token);
      expect(service.user?.email).toBe('sub-email@example.com');
    });

    it('defaults email to empty string when neither email nor sub is present', () => {
      const token = makeToken({ exp: future });
      service.setToken(token);
      expect(service.user?.email).toBe('');
    });

    it('prefers role over roles', () => {
      const token = makeToken({ email: 'a@b.com', role: 'admin', roles: 'user', exp: future });
      service.setToken(token);
      expect(service.user?.role).toBe('admin');
    });

    it('falls back to roles when role is absent', () => {
      const token = makeToken({ email: 'a@b.com', roles: 'editor', exp: future });
      service.setToken(token);
      expect(service.user?.role).toBe('editor');
    });

    it('prefers telefone over phone', () => {
      const token = makeToken({ email: 'a@b.com', telefone: '111', phone: '222', exp: future });
      service.setToken(token);
      expect(service.user?.telefone).toBe('111');
    });

    it('falls back to phone when telefone is absent', () => {
      const token = makeToken({ email: 'a@b.com', phone: '333', exp: future });
      service.setToken(token);
      expect(service.user?.telefone).toBe('333');
    });

    it('prefers data_nascimento over birthDate', () => {
      const token = makeToken({ email: 'a@b.com', data_nascimento: '2000-01-01', birthDate: '1999-01-01', exp: future });
      service.setToken(token);
      expect(service.user?.data_nascimento).toBe('2000-01-01');
    });

    it('falls back to birthDate when data_nascimento is absent', () => {
      const token = makeToken({ email: 'a@b.com', birthDate: '1998-05-05', exp: future });
      service.setToken(token);
      expect(service.user?.data_nascimento).toBe('1998-05-05');
    });

    it('passes through sub and exp', () => {
      const token = makeToken({ email: 'a@b.com', sub: 'the-sub', exp: future });
      service.setToken(token);
      expect(service.user?.sub).toBe('the-sub');
      expect(service.user?.exp).toBe(future);
    });
  });
});

describe('decodeJwt', () => {
  it('returns the parsed payload for a well-formed token', () => {
    const payload: JwtPayload = { email: 'ok@example.com', exp: 123 };
    const token = `header.${base64Url(JSON.stringify(payload))}.signature`;
    expect(decodeJwt(token)).toEqual(payload);
  });

  it('returns null when the token does not have exactly 3 parts', () => {
    expect(decodeJwt('only.two')).toBeNull();
    expect(decodeJwt('a.b.c.d')).toBeNull();
    expect(decodeJwt('nopartsatall')).toBeNull();
  });

  it('returns null when the payload segment is not valid base64', () => {
    expect(decodeJwt('header.***not-base64***.signature')).toBeNull();
  });

  it('returns null when the decoded payload is not valid JSON', () => {
    const notJsonB64 = btoa('not json').replaceAll('=', '');
    expect(decodeJwt(`header.${notJsonB64}.signature`)).toBeNull();
  });
});
