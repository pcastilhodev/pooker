import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { DueBanner } from './due-banner';
import { AuthService } from '../../services/auth-service';
import { Rent, RentalItem } from '../../services/rent';

describe('DueBanner', () => {
  let component: DueBanner;
  let fixture: ComponentFixture<DueBanner>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let rentSpy: jasmine.SpyObj<Rent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let user$: BehaviorSubject<any>;

  function makeItem(overrides: Partial<RentalItem> = {}): RentalItem {
    return {
      id: 1, filme_id: 1, data_aluguel: new Date().toISOString(),
      data_prevista_devolucao: new Date(Date.now() + 86_400_000).toISOString(),
      status: 'ativo', valor_aluguel: 10, ...overrides,
    };
  }

  beforeEach(async () => {
    sessionStorage.clear();
    user$ = new BehaviorSubject<any>({ email: 'a@b.com' });
    authSpy = jasmine.createSpyObj('AuthService', [], { user$, isLoggedIn: true });
    rentSpy = jasmine.createSpyObj('Rent', ['listMyRents']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [DueBanner],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Rent, useValue: rentSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DueBanner);
    component = fixture.componentInstance;
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('shows the banner when a rental is due soon', () => {
    rentSpy.listMyRents.and.returnValue(of([makeItem()]));
    fixture.detectChanges();

    expect(component.visible).toBeTrue();
    expect(component.dueSoon.length).toBe(1);
  });

  it('hides the banner when there is nothing due soon', () => {
    rentSpy.listMyRents.and.returnValue(of([makeItem({ data_prevista_devolucao: new Date(Date.now() + 30 * 86_400_000).toISOString() })]));
    fixture.detectChanges();

    expect(component.visible).toBeFalse();
  });

  it('ignores non-active rentals', () => {
    rentSpy.listMyRents.and.returnValue(of([makeItem({ status: 'devolvido' })]));
    fixture.detectChanges();

    expect(component.visible).toBeFalse();
  });

  it('hides the banner on request error', () => {
    rentSpy.listMyRents.and.returnValue(throwError(() => new Error('falhou')));
    fixture.detectChanges();

    expect(component.visible).toBeFalse();
  });

  it('respects a previous dismissal in sessionStorage', () => {
    sessionStorage.setItem('looker:due-banner-dismissed', '1');
    rentSpy.listMyRents.and.returnValue(of([makeItem()]));
    fixture.detectChanges();

    expect(rentSpy.listMyRents).not.toHaveBeenCalled();
  });

  it('dismiss hides the banner and persists the dismissal', () => {
    rentSpy.listMyRents.and.returnValue(of([makeItem()]));
    fixture.detectChanges();

    component.dismiss();

    expect(component.visible).toBeFalse();
    expect(sessionStorage.getItem('looker:due-banner-dismissed')).toBe('1');
  });

  it('goToRentals navigates and dismisses', () => {
    rentSpy.listMyRents.and.returnValue(of([makeItem()]));
    fixture.detectChanges();

    component.goToRentals();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/meus-alugueis']);
    expect(component.visible).toBeFalse();
  });

  it('daysUntil computes the number of days remaining', () => {
    const iso = new Date(Date.now() + 2 * 86_400_000).toISOString();
    expect(component.daysUntil(iso)).toBeGreaterThanOrEqual(1);
  });
});
