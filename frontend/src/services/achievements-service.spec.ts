import { TestBed } from '@angular/core/testing';
import { AchievementsService } from './achievements-service';
import { AuthService } from './auth-service';
import { ToastService } from './toast-service';

function makeJwt(payload: any): string {
  const b64 = (obj: any) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'none' })}.${b64(payload)}.signature`;
}

describe('AchievementsService', () => {
  let auth: AuthService;
  let toast: jasmine.SpyObj<ToastService>;
  let service: AchievementsService;

  beforeEach(() => {
    localStorage.clear();
    toast = jasmine.createSpyObj('ToastService', ['success']);
    TestBed.configureTestingModule({
      providers: [{ provide: ToastService, useValue: toast }],
    });
    auth = TestBed.inject(AuthService);
    service = TestBed.inject(AchievementsService);
  });

  it('starts with no achievements unlocked', () => {
    expect(service.list).toEqual([]);
    expect(service.has('first-login')).toBeFalse();
  });

  it('unlock adds a known achievement and notifies via toast', () => {
    const result = service.unlock('first-rent');
    expect(result).toBeTrue();
    expect(service.has('first-rent')).toBeTrue();
    expect(toast.success).toHaveBeenCalled();
  });

  it('unlock returns false for an unknown id', () => {
    expect(service.unlock('nao-existe')).toBeFalse();
  });

  it('unlock returns false when already unlocked', () => {
    service.unlock('first-rent');
    expect(service.unlock('first-rent')).toBeFalse();
  });

  it('evaluate unlocks first-login when the user is logged in', () => {
    auth.setToken(makeJwt({ email: 'a@b.com', exp: 9999999999 }));
    service.evaluate({});
    expect(service.has('first-login')).toBeTrue();
  });

  it('evaluate unlocks rental-based achievements by threshold', () => {
    service.evaluate({ rentalsCount: 10 });
    expect(service.has('first-rent')).toBeTrue();
    expect(service.has('movie-buff')).toBeTrue();
    expect(service.has('marathoner')).toBeTrue();
  });

  it('evaluate does not unlock thresholds that are not met', () => {
    service.evaluate({ rentalsCount: 1 });
    expect(service.has('movie-buff')).toBeFalse();
  });

  it('persists unlocked achievements across instances for the same user', () => {
    service.unlock('critic');
    const other = TestBed.runInInjectionContext(() => new AchievementsService());
    expect(other.has('critic')).toBeTrue();
  });
});
