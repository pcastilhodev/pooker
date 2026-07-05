import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RatingsService } from './ratings-service';
import { AuthService } from './auth-service';

describe('RatingsService', () => {
  let service: RatingsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(RatingsService);
  });

  it('statsFor returns zeroed stats when there are no ratings', () => {
    expect(service.statsFor(1)).toEqual({ count: 0, average: 0, userStars: 0 });
  });

  it('rate stores a rating and returns updated stats', () => {
    const stats = service.rate(1, 4);
    expect(stats.count).toBe(1);
    expect(stats.average).toBe(4);
    expect(stats.userStars).toBe(4);
  });

  it('rate clamps stars below 1 up to 1', () => {
    const stats = service.rate(1, 0);
    expect(stats.userStars).toBe(1);
  });

  it('rate clamps stars above 5 down to 5', () => {
    const stats = service.rate(1, 10);
    expect(stats.userStars).toBe(5);
  });

  it('rate replaces a previous rating from the same user', () => {
    service.rate(1, 2);
    const stats = service.rate(1, 5);
    expect(stats.count).toBe(1);
    expect(stats.userStars).toBe(5);
  });

  it('statsFor averages ratings from multiple users', () => {
    service.rate(1, 4);

    const otherAuth = new AuthService();
    spyOnProperty(otherAuth, 'user', 'get').and.returnValue({ nome: 'B', email: 'b@b.com' } as any);
    const injector = Injector.create({ providers: [{ provide: AuthService, useValue: otherAuth }, RatingsService] });
    const otherService = injector.get(RatingsService);
    otherService.rate(1, 2);

    expect(otherService.statsFor(1).count).toBe(2);
    expect(otherService.statsFor(1).average).toBe(3);
  });
});
