import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { DueBanner } from './due-banner';
import { AuthService, AuthUser } from '../../services/auth-service';
import { Rent, RentalItem } from '../../services/rent';

const NOW = 1_700_000_000_000;
const DAY = 86_400_000;
const DISMISS_KEY = 'looker:due-banner-dismissed';

const makeItem = (id: string, dueOffsetMs: number, status = 'ativo'): RentalItem => ({
  id,
  filme_id: 1,
  data_aluguel: new Date(NOW - 5 * DAY).toISOString(),
  data_prevista_devolucao: new Date(NOW + dueOffsetMs).toISOString(),
  status,
  valor_aluguel: 10
});

describe('DueBanner', () => {
  let component: DueBanner;
  let fixture: ComponentFixture<DueBanner>;
  let user$: BehaviorSubject<AuthUser | null>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let rentSpy: jasmine.SpyObj<Rent>;
  let routerSpy: jasmine.SpyObj<Router>;

  function setup(isLoggedIn: boolean) {
    user$ = new BehaviorSubject<AuthUser | null>(null);
    authSpy = jasmine.createSpyObj('AuthService', [], { user$, isLoggedIn });
    rentSpy = jasmine.createSpyObj('Rent', ['listMyRents']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [DueBanner],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Rent, useValue: rentSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    fixture = TestBed.createComponent(DueBanner);
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    sessionStorage.removeItem(DISMISS_KEY);
    spyOn(Date, 'now').and.returnValue(NOW);
  });

  afterEach(() => {
    sessionStorage.removeItem(DISMISS_KEY);
  });

  it('should create', () => {
    setup(false);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should hide the banner and clear items when the user is not logged in', () => {
    setup(false);
    rentSpy.listMyRents.and.returnValue(of([]));
    fixture.detectChanges();
    user$.next(null);
    expect(component.visible).toBeFalse();
    expect(component.dueSoon).toEqual([]);
    expect(rentSpy.listMyRents).not.toHaveBeenCalled();
  });

  it('should show due-soon items within the window, sorted, when logged in', () => {
    setup(true);
    const dueTomorrow = makeItem('a', 1 * DAY);
    const dueFarFuture = makeItem('b', 10 * DAY);
    const wrongStatus = makeItem('c', 1 * DAY, 'devolvido');
    const dueYesterday = makeItem('d', -1 * DAY);
    const tooOld = makeItem('e', -3 * DAY);
    rentSpy.listMyRents.and.returnValue(
      of([dueTomorrow, dueFarFuture, wrongStatus, dueYesterday, tooOld])
    );

    fixture.detectChanges();
    user$.next({ nome: 'Test', email: 't@t.com' });

    expect(component.dueSoon.map(r => r.id)).toEqual(['d', 'a']);
    expect(component.visible).toBeTrue();
  });

  it('should hide the banner when there are no due-soon items', () => {
    setup(true);
    rentSpy.listMyRents.and.returnValue(of([]));
    fixture.detectChanges();
    user$.next({ nome: 'Test', email: 't@t.com' });
    expect(component.dueSoon).toEqual([]);
    expect(component.visible).toBeFalse();
  });

  it('should hide the banner when listMyRents errors', () => {
    setup(true);
    rentSpy.listMyRents.and.returnValue(throwError(() => new Error('boom')));
    fixture.detectChanges();
    user$.next({ nome: 'Test', email: 't@t.com' });
    expect(component.visible).toBeFalse();
  });

  it('should not call listMyRents when the banner was already dismissed this session', () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setup(true);
    fixture.detectChanges();
    user$.next({ nome: 'Test', email: 't@t.com' });
    expect(rentSpy.listMyRents).not.toHaveBeenCalled();
  });

  it('dismiss should hide the banner and persist the dismissal', () => {
    setup(true);
    rentSpy.listMyRents.and.returnValue(of([makeItem('a', 1 * DAY)]));
    fixture.detectChanges();
    user$.next({ nome: 'Test', email: 't@t.com' });
    expect(component.visible).toBeTrue();

    component.dismiss();

    expect(component.visible).toBeFalse();
    expect(sessionStorage.getItem(DISMISS_KEY)).toBe('1');
  });

  it('dismiss should not throw when sessionStorage.setItem fails', () => {
    setup(false);
    fixture.detectChanges();
    spyOn(sessionStorage, 'setItem').and.throwError('quota exceeded');
    expect(() => component.dismiss()).not.toThrow();
    expect(component.visible).toBeFalse();
  });

  it('goToRentals should navigate and dismiss the banner', () => {
    setup(true);
    rentSpy.listMyRents.and.returnValue(of([makeItem('a', 1 * DAY)]));
    fixture.detectChanges();
    user$.next({ nome: 'Test', email: 't@t.com' });

    component.goToRentals();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/meus-alugueis']);
    expect(component.visible).toBeFalse();
    expect(sessionStorage.getItem(DISMISS_KEY)).toBe('1');
  });

  it('daysUntil should return the number of whole days until the target date', () => {
    setup(false);
    fixture.detectChanges();
    expect(component.daysUntil(new Date(NOW + 2 * DAY).toISOString())).toBe(2);
  });

  it('daysUntil should clamp to 0 for dates in the past', () => {
    setup(false);
    fixture.detectChanges();
    expect(component.daysUntil(new Date(NOW - 5 * DAY).toISOString())).toBe(0);
  });

  it('should unsubscribe from auth.user$ on destroy', () => {
    setup(false);
    rentSpy.listMyRents.and.returnValue(of([]));
    fixture.detectChanges();
    expect(user$.observers.length).toBe(1);
    fixture.destroy();
    expect(user$.observers.length).toBe(0);
  });
});
