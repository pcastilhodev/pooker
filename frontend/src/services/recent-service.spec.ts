import { TestBed } from '@angular/core/testing';
import { RecentService } from './recent-service';
import { AuthService } from './auth-service';

function base64url(input: string): string {
  return btoa(input).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function makeJwt(payload: Record<string, unknown>): string {
  const header = base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe('RecentService', () => {
  let service: RecentService;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    auth = TestBed.inject(AuthService);
    service = TestBed.inject(RecentService);
  });

  it('starts empty for a guest user', () => {
    expect(service.list).toEqual([]);
  });

  it('track adds a filmeId to the front of the list', () => {
    service.track(10);
    expect(service.list).toEqual([10]);
  });

  it('track dedups an existing id by moving it to the front', () => {
    service.track(1);
    service.track(2);
    service.track(1);
    expect(service.list).toEqual([1, 2]);
  });

  it('track caps the list at MAX (12)', () => {
    for (let i = 1; i <= 15; i++) {
      service.track(i);
    }
    expect(service.list.length).toBe(12);
    expect(service.list[0]).toBe(15);
    expect(service.list).not.toContain(1);
    expect(service.list).not.toContain(3);
  });

  it('track persists the list to localStorage under the guest key', () => {
    service.track(42);
    const raw = localStorage.getItem('looker:recent:guest');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual([42]);
  });

  it('clear empties the list and persists', () => {
    service.track(1);
    service.track(2);
    service.clear();
    expect(service.list).toEqual([]);
    const raw = localStorage.getItem('looker:recent:guest');
    expect(JSON.parse(raw!)).toEqual([]);
  });

  it('recent$ emits the current list on track', () => {
    const emissions: number[][] = [];
    service.recent$.subscribe(v => emissions.push(v));
    service.track(7);
    expect(emissions[emissions.length - 1]).toEqual([7]);
  });

  it('recent$ emits the current list on clear', () => {
    service.track(7);
    const emissions: number[][] = [];
    service.recent$.subscribe(v => emissions.push(v));
    service.clear();
    expect(emissions[emissions.length - 1]).toEqual([]);
  });

  it('reloads from a different storage key when the authenticated user changes', () => {
    service.track(99);
    expect(localStorage.getItem('looker:recent:guest')).not.toBeNull();

    const token = makeJwt({ email: 'user@example.com', exp: Math.floor(Date.now() / 1000) + 3600 });
    auth.setToken(token);

    // Reload happened for the new user -> empty list, since nothing tracked yet under that key
    expect(service.list).toEqual([]);

    service.track(5);
    const raw = localStorage.getItem('looker:recent:user@example.com');
    expect(JSON.parse(raw!)).toEqual([5]);
    // Guest data remains untouched
    expect(JSON.parse(localStorage.getItem('looker:recent:guest')!)).toEqual([99]);
  });

  it('reloads back to guest data after logout', () => {
    const token = makeJwt({ email: 'user@example.com', exp: Math.floor(Date.now() / 1000) + 3600 });
    auth.setToken(token);
    service.track(3);

    auth.logout();
    expect(service.list).toEqual([]);
  });

  it('ignores corrupted (non-JSON) localStorage content and stays empty', () => {
    localStorage.setItem('looker:recent:guest', '{not-valid-json');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const svc = TestBed.inject(RecentService);
    expect(svc.list).toEqual([]);
  });

  it('filters out non-number entries when reading from localStorage', () => {
    localStorage.setItem('looker:recent:guest', JSON.stringify([1, 'two', 3, null, 4]));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const svc2 = TestBed.inject(RecentService);
    expect(svc2.list).toEqual([1, 3, 4]);
  });
});
