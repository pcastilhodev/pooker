import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth-service';

const KEY_PREFIX = 'looker:watchlist:';

export interface WatchlistEntry { id: number; addedAt: number; }

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private readonly auth = inject(AuthService);

  private readonly entries$ = new BehaviorSubject<WatchlistEntry[]>([]);

  watchlist$: Observable<WatchlistEntry[]> = this.entries$.asObservable();

  constructor() {
    this.reload();
    this.auth.user$.subscribe(() => this.reload());
  }

  get entries(): WatchlistEntry[] { return this.entries$.value; }

  get ids(): number[] { return this.entries$.value.map(e => e.id); }

  has(id: number): boolean { return this.entries$.value.some(e => e.id === id); }

  toggle(id: number): boolean {
    const next = this.entries$.value.filter(e => e.id !== id);
    const wasIn = next.length !== this.entries$.value.length;
    if (!wasIn) next.unshift({ id, addedAt: Date.now() });
    this.entries$.next(next);
    this.persist();
    return !wasIn;
  }

  remove(id: number) {
    this.entries$.next(this.entries$.value.filter(e => e.id !== id));
    this.persist();
  }

  clear() {
    this.entries$.next([]);
    this.persist();
  }

  private storageKey(): string {
    return KEY_PREFIX + (this.auth.user?.email ?? 'guest');
  }

  private reload() {
    try {
      const raw = localStorage.getItem(this.storageKey());
      const arr = raw ? JSON.parse(raw) as WatchlistEntry[] : [];
      const valid = arr.filter(e => e && typeof e.id === 'number');
      this.entries$.next(valid);
    } catch {
      this.entries$.next([]);
    }
  }

  private persist() {
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(this.entries$.value));
    } catch { /* ignore */ }
  }
}
