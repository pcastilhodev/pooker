import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth-service';

const KEY_PREFIX = 'looker:favorites:';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private ids$ = new BehaviorSubject<Set<number>>(new Set());

  favorites$: Observable<Set<number>> = this.ids$.asObservable();

  constructor(private auth: AuthService) {
    this.reload();
    this.auth.user$.subscribe(() => this.reload());
  }

  get list(): number[] { return Array.from(this.ids$.value); }

  isFavorite(id: number): boolean { return this.ids$.value.has(id); }

  toggle(id: number): boolean {
    const set = new Set(this.ids$.value);
    const isFav = set.has(id);
    if (isFav) set.delete(id); else set.add(id);
    this.ids$.next(set);
    this.persist();
    return !isFav;
  }

  clear() {
    this.ids$.next(new Set());
    this.persist();
  }

  private storageKey(): string {
    return KEY_PREFIX + (this.auth.user?.email ?? 'guest');
  }

  private reload() {
    try {
      const raw = localStorage.getItem(this.storageKey());
      const arr = raw ? JSON.parse(raw) as number[] : [];
      this.ids$.next(new Set(arr.filter(n => typeof n === 'number')));
    } catch {
      this.ids$.next(new Set());
    }
  }

  private persist() {
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(Array.from(this.ids$.value)));
    } catch { /* ignore */ }
  }
}
