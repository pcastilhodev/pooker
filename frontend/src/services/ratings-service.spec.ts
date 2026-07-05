import { TestBed } from '@angular/core/testing';
import { RatingsService } from './ratings-service';
import { AuthService, JwtPayload } from './auth-service';

const STORAGE_KEY = 'looker:ratings';
const FUTURE = Math.floor(Date.now() / 1000) + 10_000;

function makeToken(payload: JwtPayload): string {
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  return `header.${b64}.signature`;
}

describe('RatingsService', () => {
  let service: RatingsService;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [RatingsService, AuthService] });
    service = TestBed.inject(RatingsService);
    auth = TestBed.inject(AuthService);
  });

  describe('statsFor() with no ratings', () => {
    it('returns count 0, average 0, userStars 0', () => {
      expect(service.statsFor(1)).toEqual({ count: 0, average: 0, userStars: 0 });
    });
  });

  describe('rate()', () => {
    it('stores a rating for the guest user and returns updated stats', () => {
      const stats = service.rate(1, 4);
      expect(stats).toEqual({ count: 1, average: 4, userStars: 4 });
    });

    it('clamps stars below 1 up to 1', () => {
      const stats = service.rate(1, 0);
      expect(stats.userStars).toBe(1);
      const negative = service.rate(2, -5);
      expect(negative.userStars).toBe(1);
    });

    it('clamps stars above 5 down to 5', () => {
      const stats = service.rate(1, 6);
      expect(stats.userStars).toBe(5);
      const large = service.rate(2, 100);
      expect(large.userStars).toBe(5);
    });

    it('replaces a previous rating from the same user for the same film instead of duplicating', () => {
      service.rate(1, 2);
      const stats = service.rate(1, 5);
      expect(stats.count).toBe(1);
      expect(stats.userStars).toBe(5);
    });

    it('persists ratings to localStorage', () => {
      service.rate(1, 3);
      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw as string).length).toBe(1);
    });

    it('computes the rounded average across multiple users', () => {
      service.rate(1, 3);
      auth.setToken(makeToken({ email: 'user2@example.com', exp: FUTURE }));
      const stats = service.rate(1, 4);
      expect(stats.count).toBe(2);
      expect(stats.average).toBe(3.5);
    });

    it('rounds the average to one decimal place', () => {
      service.rate(1, 1);
      auth.setToken(makeToken({ email: 'user2@example.com', exp: FUTURE }));
      service.rate(1, 2);
      auth.setToken(makeToken({ email: 'user3@example.com', exp: FUTURE }));
      const stats = service.rate(1, 2);
      // (1+2+2)/3 = 1.666... -> rounds to 1.7
      expect(stats.average).toBe(1.7);
    });

    it('keeps ratings for different films independent', () => {
      service.rate(1, 5);
      service.rate(2, 1);
      expect(service.statsFor(1).average).toBe(5);
      expect(service.statsFor(2).average).toBe(1);
    });
  });

  describe('per-user rating identity', () => {
    it('tracks each user\'s own rating (userStars) separately for the same film', () => {
      service.rate(10, 5); // guest rates 5

      auth.setToken(makeToken({ email: 'user2@example.com', exp: FUTURE }));
      expect(service.statsFor(10).userStars).toBe(0); // user2 has not rated yet
      service.rate(10, 2);
      expect(service.statsFor(10).userStars).toBe(2);
      expect(service.statsFor(10).count).toBe(2);

      auth.logout(); // back to guest
      expect(service.statsFor(10).userStars).toBe(5);
    });
  });

  describe('corrupted storage', () => {
    it('read() falls back to an empty list on invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not-json{{{');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [RatingsService, AuthService] });
      const svc = TestBed.inject(RatingsService);
      expect(svc.statsFor(1)).toEqual({ count: 0, average: 0, userStars: 0 });
    });
  });

  describe('persistence failure', () => {
    it('rate() does not throw when localStorage.setItem fails', () => {
      spyOn(localStorage, 'setItem').and.throwError('quota exceeded');
      expect(() => service.rate(1, 3)).not.toThrow();
      expect(service.statsFor(1).count).toBe(1);
    });
  });
});
