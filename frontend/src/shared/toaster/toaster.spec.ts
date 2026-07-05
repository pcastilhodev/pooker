import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { Toaster } from './toaster';
import { Toast, ToastService } from '../../services/toast-service';

describe('Toaster', () => {
  let component: Toaster;
  let fixture: ComponentFixture<Toaster>;
  let stream$: Subject<Toast[]>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    stream$ = new Subject<Toast[]>();
    toastSpy = jasmine.createSpyObj('ToastService', ['dismiss'], { stream: stream$.asObservable() });

    await TestBed.configureTestingModule({
      imports: [Toaster],
      providers: [{ provide: ToastService, useValue: toastSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(Toaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('subscribes to the toast stream on init and stores toasts', () => {
    const toasts: Toast[] = [{ id: 1, kind: 'info', message: 'oi', timeoutMs: 1000 }];
    stream$.next(toasts);
    expect(component.toasts).toEqual(toasts);
  });

  it('dismiss delegates to ToastService', () => {
    component.dismiss(1);
    expect(toastSpy.dismiss).toHaveBeenCalledWith(1);
  });

  it('iconFor returns the right icon per kind', () => {
    expect(component.iconFor('success')).toBe('✓');
    expect(component.iconFor('error')).toBe('✕');
    expect(component.iconFor('warn')).toBe('!');
    expect(component.iconFor('info')).toBe('i');
  });

  it('trackById returns the toast id', () => {
    expect(component.trackById(0, { id: 7, kind: 'info', message: '', timeoutMs: 0 })).toBe(7);
  });

  it('unsubscribes on destroy', () => {
    fixture.destroy();
    expect(stream$.observed).toBeFalse();
  });
});
