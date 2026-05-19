import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ToastKind = 'info' | 'success' | 'warn' | 'error';

export interface Toast {
  id: number;
  kind: ToastKind;
  title?: string;
  message: string;
  timeoutMs: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private toasts$ = new BehaviorSubject<Toast[]>([]);

  stream: Observable<Toast[]> = this.toasts$.asObservable();

  show(message: string, kind: ToastKind = 'info', title?: string, timeoutMs = 4200) {
    const toast: Toast = { id: this.nextId++, kind, title, message, timeoutMs };
    this.toasts$.next([...this.toasts$.value, toast]);
    if (timeoutMs > 0) setTimeout(() => this.dismiss(toast.id), timeoutMs);
    return toast.id;
  }

  success(message: string, title?: string) { return this.show(message, 'success', title); }
  error(message: string, title?: string)   { return this.show(message, 'error',   title); }
  warn(message: string, title?: string)    { return this.show(message, 'warn',    title); }
  info(message: string, title?: string)    { return this.show(message, 'info',    title); }

  dismiss(id: number) {
    this.toasts$.next(this.toasts$.value.filter(t => t.id !== id));
  }
}
