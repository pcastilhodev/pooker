import { TestBed } from '@angular/core/testing';
import { FavoritesService } from './favorites-service';
import { AuthService, JwtPayload } from './auth-service';

const FUTURE = Math.floor(Date.now() / 1000) + 10_000;

function makeToken(payload: JwtPayload): string {
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  return `header.${b64}.signature`;
}

describe('FavoritesService', () => {
  let service: FavoritesService;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [FavoritesService, AuthService] });
    service = TestBed.inject(FavoritesService);
    auth = TestBed.inject(AuthService);
  });

  it('starts with an empty list', () => {
    expect(service.list).toEqual([]);
  });

  it('isFavorite() returns false for an id not marked as favorite', () => {
    expect(service.isFavorite(1)).toBeFalse();
  });

  describe('toggle()', () => {
    it('adds the id and returns true when not previously a favorite', () => {
      const result = service.toggle(10);
      expect(result).toBeTrue();
      expect(service.isFavorite(10)).toBeTrue();
      expect(service.list).toContain(10);
    });

    it('removes the id and returns false when already a favorite', () => {
      service.toggle(10);
      const result = service.toggle(10);
      expect(result).toBeFalse();
      expect(service.isFavorite(10)).toBeFalse();
      expect(service.list).not.toContain(10);
    });

    it('supports multiple independent ids', () => {
      service.toggle(1);
      service.toggle(2);
      expect(service.list.sort()).toEqual([1, 2]);
      service.toggle(1);
      expect(service.list).toEqual([2]);
    });

    it('persists changes to localStorage', () => {
      service.toggle(5);
      const raw = localStorage.getItem('looker:favorites:guest');
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw as string)).toEqual([5]);
    });
  });

  describe('clear()', () => {
    it('empties the favorites and persists the empty state', () => {
      service.toggle(1);
      service.toggle(2);
      service.clear();
      expect(service.list).toEqual([]);
      const raw = JSON.parse(localStorage.getItem('looker:favorites:guest') as string) as number[];
      expect(raw).toEqual([]);
    });
  });

  describe('per-user storage', () => {
    it('keeps separate favorites for different users and reloads on auth change', () => {
      service.toggle(1); // guest

      auth.setToken(makeToken({ email: 'user1@example.com', exp: FUTURE }));
      expect(service.list).toEqual([]);
      service.toggle(2);
      expect(service.list).toEqual([2]);

      auth.logout(); // back to guest
      expect(service.list).toEqual([1]);
    });
  });

  describe('reload() sanitization', () => {
    it('filters out non-numeric entries from storage', () => {
      localStorage.setItem('looker:favorites:guest', JSON.stringify([1, 'not-a-number', 3, null]));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [FavoritesService, AuthService] });
      const svc = TestBed.inject(FavoritesService);
      expect(svc.list.sort()).toEqual([1, 3]);
    });

    it('falls back to an empty set on invalid JSON', () => {
      localStorage.setItem('looker:favorites:guest', 'not-json{{{');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [FavoritesService, AuthService] });
      const svc = TestBed.inject(FavoritesService);
      expect(svc.list).toEqual([]);
    });
  });

  describe('persistence failure', () => {
    it('toggle() does not throw when localStorage.setItem fails', () => {
      spyOn(localStorage, 'setItem').and.throwError('quota exceeded');
      expect(() => service.toggle(1)).not.toThrow();
      expect(service.isFavorite(1)).toBeTrue();
    });
  });
});
