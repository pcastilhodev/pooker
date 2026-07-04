import { TestBed } from '@angular/core/testing';
import { WatchlistService, WatchlistEntry } from './watchlist-service';
import { AuthService, JwtPayload } from './auth-service';

const FUTURE = Math.floor(Date.now() / 1000) + 10_000;

function makeToken(payload: JwtPayload): string {
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  return `header.${b64}.signature`;
}

describe('WatchlistService', () => {
  let service: WatchlistService;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [WatchlistService, AuthService] });
    service = TestBed.inject(WatchlistService);
    auth = TestBed.inject(AuthService);
  });

  it('starts empty', () => {
    expect(service.entries).toEqual([]);
    expect(service.ids).toEqual([]);
  });

  it('has() returns false for an id not in the watchlist', () => {
    expect(service.has(1)).toBeFalse();
  });

  describe('toggle()', () => {
    it('adds an entry and returns true when not previously present', () => {
      const added = service.toggle(42);
      expect(added).toBeTrue();
      expect(service.has(42)).toBeTrue();
      expect(service.ids).toContain(42);
    });

    it('removes the entry and returns false when already present', () => {
      service.toggle(42);
      const added = service.toggle(42);
      expect(added).toBeFalse();
      expect(service.has(42)).toBeFalse();
    });

    it('unshifts new entries so the most recently added is first', () => {
      service.toggle(1);
      service.toggle(2);
      expect(service.ids[0]).toBe(2);
      expect(service.ids[1]).toBe(1);
    });

    it('stores an addedAt timestamp', () => {
      service.toggle(5);
      const entry = service.entries.find(e => e.id === 5);
      expect(typeof entry?.addedAt).toBe('number');
    });

    it('persists changes to localStorage', () => {
      service.toggle(7);
      const raw = localStorage.getItem('looker:watchlist:guest');
      expect(raw).toBeTruthy();
      const stored = JSON.parse(raw as string) as WatchlistEntry[];
      expect(stored.some(e => e.id === 7)).toBeTrue();
    });
  });

  describe('remove()', () => {
    it('removes an entry by id', () => {
      service.toggle(1);
      service.toggle(2);
      service.remove(1);
      expect(service.ids).toEqual([2]);
    });

    it('is a no-op when the id is not present', () => {
      service.toggle(1);
      service.remove(999);
      expect(service.ids).toEqual([1]);
    });
  });

  describe('clear()', () => {
    it('empties the watchlist and persists the empty state', () => {
      service.toggle(1);
      service.toggle(2);
      service.clear();
      expect(service.entries).toEqual([]);
      const raw = JSON.parse(localStorage.getItem('looker:watchlist:guest') as string) as WatchlistEntry[];
      expect(raw).toEqual([]);
    });
  });

  describe('per-user storage', () => {
    it('keeps separate watchlists for different users and reloads on auth change', () => {
      service.toggle(1); // guest

      auth.setToken(makeToken({ email: 'user1@example.com', exp: FUTURE }));
      expect(service.ids).toEqual([]); // fresh user, no entries
      service.toggle(2);
      expect(service.ids).toEqual([2]);

      auth.logout(); // back to guest
      expect(service.ids).toEqual([1]);
    });
  });

  describe('reload() sanitization', () => {
    it('filters out malformed entries from storage (missing/invalid id)', () => {
      localStorage.setItem('looker:watchlist:guest', JSON.stringify([
        { id: 1, addedAt: 1 },
        { id: 'not-a-number', addedAt: 2 },
        { addedAt: 3 },
        null,
      ]));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [WatchlistService, AuthService] });
      const svc = TestBed.inject(WatchlistService);
      expect(svc.ids).toEqual([1]);
    });

    it('falls back to an empty list on invalid JSON', () => {
      localStorage.setItem('looker:watchlist:guest', 'not-json{{{');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [WatchlistService, AuthService] });
      const svc = TestBed.inject(WatchlistService);
      expect(svc.entries).toEqual([]);
    });
  });

  describe('persistence failure', () => {
    it('toggle() does not throw when localStorage.setItem fails', () => {
      spyOn(localStorage, 'setItem').and.throwError('quota exceeded');
      expect(() => service.toggle(1)).not.toThrow();
      expect(service.has(1)).toBeTrue();
    });
  });
});
