import { TestBed } from '@angular/core/testing';
import { AchievementsService } from './achievements-service';
import { AuthService, JwtPayload } from './auth-service';
import { ToastService } from './toast-service';

const FUTURE = Math.floor(Date.now() / 1000) + 10_000;

function makeToken(payload: JwtPayload): string {
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  return `header.${b64}.signature`;
}

describe('AchievementsService', () => {
  let service: AchievementsService;
  let auth: AuthService;
  let toast: ToastService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [AchievementsService, AuthService, ToastService] });
    service = TestBed.inject(AchievementsService);
    auth = TestBed.inject(AuthService);
    toast = TestBed.inject(ToastService);
  });

  it('starts with no unlocked achievements', () => {
    expect(service.list).toEqual([]);
  });

  it('has() returns false for a not-yet-unlocked achievement', () => {
    expect(service.has('first-login')).toBeFalse();
  });

  it('unlock() unlocks a known achievement and returns true', () => {
    const result = service.unlock('first-login');
    expect(result).toBeTrue();
    expect(service.has('first-login')).toBeTrue();
    expect(service.list).toContain('first-login');
  });

  it('unlock() persists to localStorage under the guest key', () => {
    service.unlock('lucky');
    const raw = localStorage.getItem('looker:achievements:guest');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)).toContain('lucky');
  });

  it('unlock() returns false and does not duplicate when already unlocked', () => {
    service.unlock('lucky');
    const second = service.unlock('lucky');
    expect(second).toBeFalse();
    expect(service.list.filter(id => id === 'lucky').length).toBe(1);
  });

  it('unlock() returns false for an unknown achievement id and does not add it', () => {
    const result = service.unlock('does-not-exist');
    expect(result).toBeFalse();
    expect(service.list).toEqual([]);
  });

  it('unlock() triggers a success toast with icon/title/description', () => {
    spyOn(toast, 'success');
    service.unlock('lucky');
    expect(toast.success).toHaveBeenCalledWith(jasmine.stringMatching('Sortudo'), 'Conquista desbloqueada!');
  });

  describe('evaluate()', () => {
    it('unlocks first-login only when the user is logged in', () => {
      service.evaluate({});
      expect(service.has('first-login')).toBeFalse();

      auth.setToken(makeToken({ email: 'a@b.com', exp: FUTURE }));
      service.evaluate({});
      expect(service.has('first-login')).toBeTrue();
    });

    it('unlocks first-rent at 1, movie-buff at 5, marathoner at 10 rentals', () => {
      service.evaluate({ rentalsCount: 1 });
      expect(service.has('first-rent')).toBeTrue();
      expect(service.has('movie-buff')).toBeFalse();
      expect(service.has('marathoner')).toBeFalse();

      service.evaluate({ rentalsCount: 5 });
      expect(service.has('movie-buff')).toBeTrue();
      expect(service.has('marathoner')).toBeFalse();

      service.evaluate({ rentalsCount: 10 });
      expect(service.has('marathoner')).toBeTrue();
    });

    it('unlocks fav-collector at 5 favorites', () => {
      service.evaluate({ favoritesCount: 4 });
      expect(service.has('fav-collector')).toBeFalse();
      service.evaluate({ favoritesCount: 5 });
      expect(service.has('fav-collector')).toBeTrue();
    });

    it('unlocks big-spender at 100 total spent', () => {
      service.evaluate({ totalSpent: 99 });
      expect(service.has('big-spender')).toBeFalse();
      service.evaluate({ totalSpent: 100 });
      expect(service.has('big-spender')).toBeTrue();
    });

    it('unlocks critic at 3 ratings', () => {
      service.evaluate({ ratingsCount: 2 });
      expect(service.has('critic')).toBeFalse();
      service.evaluate({ ratingsCount: 3 });
      expect(service.has('critic')).toBeTrue();
    });

    it('unlocks community at 1 comment', () => {
      service.evaluate({ commentsCount: 1 });
      expect(service.has('community')).toBeTrue();
    });

    it('unlocks explorer at 10 movies visited', () => {
      service.evaluate({ moviesVisited: 9 });
      expect(service.has('explorer')).toBeFalse();
      service.evaluate({ moviesVisited: 10 });
      expect(service.has('explorer')).toBeTrue();
    });

    it('unlocks nothing when every metric is below threshold and the user is a guest', () => {
      service.evaluate({
        rentalsCount: 0, favoritesCount: 0, totalSpent: 0,
        ratingsCount: 0, commentsCount: 0, moviesVisited: 0,
      });
      expect(service.list).toEqual([]);
    });

    it('treats missing ctx fields as 0 (no unlocks from an empty object)', () => {
      service.evaluate({});
      expect(service.list).toEqual([]);
    });
  });

  describe('per-user persistence', () => {
    it('keeps separate unlocked sets for different users and reloads on auth change', () => {
      service.unlock('lucky'); // guest

      auth.setToken(makeToken({ email: 'user1@example.com', exp: FUTURE }));
      expect(service.has('lucky')).toBeFalse();
      service.unlock('critic');
      expect(service.has('critic')).toBeTrue();

      auth.logout(); // back to guest
      expect(service.has('lucky')).toBeTrue();
      expect(service.has('critic')).toBeFalse();
    });
  });

  describe('corrupted storage', () => {
    it('reload() falls back to an empty set on invalid JSON', () => {
      localStorage.setItem('looker:achievements:guest', 'not-json{{{');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [AchievementsService, AuthService, ToastService] });
      const svc = TestBed.inject(AchievementsService);
      expect(svc.list).toEqual([]);
    });
  });

  describe('persistence failure', () => {
    it('unlock() does not throw when localStorage.setItem fails, and keeps the in-memory state', () => {
      spyOn(localStorage, 'setItem').and.throwError('quota exceeded');
      expect(() => service.unlock('lucky')).not.toThrow();
      expect(service.has('lucky')).toBeTrue();
    });
  });
});
