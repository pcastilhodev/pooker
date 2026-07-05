import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { Toaster } from './toaster';
import { Toast, ToastService } from '../../services/toast-service';

describe('Toaster', () => {
  let component: Toaster;
  let fixture: ComponentFixture<Toaster>;
  let stream$: BehaviorSubject<Toast[]>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const toast = (id: number, kind: Toast['kind'] = 'info'): Toast => ({
    id, kind, message: `msg ${id}`, timeoutMs: 4200
  });

  beforeEach(async () => {
    stream$ = new BehaviorSubject<Toast[]>([]);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['dismiss'], { stream: stream$ });

    await TestBed.configureTestingModule({
      imports: [Toaster],
      providers: [{ provide: ToastService, useValue: toastServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(Toaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with an empty toast list', () => {
    expect(component.toasts).toEqual([]);
  });

  it('should reflect toast list emissions from the service stream', () => {
    const list = [toast(1), toast(2, 'success')];
    stream$.next(list);
    expect(component.toasts).toEqual(list);
  });

  it('dismiss should delegate to the toast service', () => {
    component.dismiss(7);
    expect(toastServiceSpy.dismiss).toHaveBeenCalledWith(7);
  });

  it('iconFor should return a check for success', () => {
    expect(component.iconFor('success')).toBe('✓');
  });

  it('iconFor should return a cross for error', () => {
    expect(component.iconFor('error')).toBe('✕');
  });

  it('iconFor should return an exclamation for warn', () => {
    expect(component.iconFor('warn')).toBe('!');
  });

  it('iconFor should return an info marker for anything else', () => {
    expect(component.iconFor('info')).toBe('i');
    expect(component.iconFor('unknown')).toBe('i');
  });

  it('trackById should return the toast id', () => {
    expect(component.trackById(0, toast(42))).toBe(42);
  });

  it('should unsubscribe from the stream on destroy', () => {
    expect(stream$.observers.length).toBe(1);
    fixture.destroy();
    expect(stream$.observers.length).toBe(0);
  });
});
