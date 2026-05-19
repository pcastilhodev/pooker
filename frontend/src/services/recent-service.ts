import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth-service';

const PREFIX = 'looker:recent:';
const MAX = 12;

@Injectable({ providedIn: 'root' })
export class RecentService {
  private list$ = new BehaviorSubject<number[]>([]);

  recent$: Observable<number[]> = this.list$.asObservable();

  constructor(private auth: AuthService) {
    this.reload();
    this.auth.user$.subscribe(() => this.reload());
  }

  get list(): number[] { return this.list$.value; }

  track(filmeId: number) {
    const without = this.list$.value.filter(id => id !== filmeId);
    const next = [filmeId, ...without].slice(0, MAX);
    this.list$.next(next);
    this.persist();
  }

  clear() {
    this.list$.next([]);
    this.persist();
  }

  private key(): string { return PREFIX + (this.auth.user?.email ?? 'guest'); }

  private reload() {
    try {
      const raw = localStorage.getItem(this.key());
      const arr = raw ? JSON.parse(raw) as number[] : [];
      this.list$.next(arr.filter(n => typeof n === 'number'));
    } catch { this.list$.next([]); }
  }

  private persist() {
    try { localStorage.setItem(this.key(), JSON.stringify(this.list$.value)); }
    catch { /* ignore */ }
  }
}
