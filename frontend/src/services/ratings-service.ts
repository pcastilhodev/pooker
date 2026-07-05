import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth-service';

const STORAGE_KEY = 'looker:ratings';

interface RatingEntry { user: string; filmeId: number; stars: number; ts: number; }

export interface RatingStats { count: number; average: number; userStars: number; }

@Injectable({ providedIn: 'root' })
export class RatingsService {
  private readonly auth = inject(AuthService);

  private readonly entries$ = new BehaviorSubject<RatingEntry[]>(this.read());

  ratings$: Observable<RatingEntry[]> = this.entries$.asObservable();

  rate(filmeId: number, stars: number): RatingStats {
    if (stars < 1 || stars > 5) stars = Math.max(1, Math.min(5, stars));
    const user = this.userKey();
    const next = this.entries$.value.filter(e => !(e.user === user && e.filmeId === filmeId));
    next.push({ user, filmeId, stars, ts: Date.now() });
    this.entries$.next(next);
    this.persist();
    return this.statsFor(filmeId);
  }

  statsFor(filmeId: number): RatingStats {
    const all = this.entries$.value.filter(e => e.filmeId === filmeId);
    const user = this.userKey();
    const userEntry = all.find(e => e.user === user);
    if (all.length === 0) return { count: 0, average: 0, userStars: 0 };
    const sum = all.reduce((acc, e) => acc + e.stars, 0);
    return {
      count: all.length,
      average: Math.round((sum / all.length) * 10) / 10,
      userStars: userEntry?.stars ?? 0,
    };
  }

  private userKey(): string {
    return this.auth.user?.email ?? 'guest';
  }

  private read(): RatingEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as RatingEntry[] : [];
    } catch {
      return [];
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries$.value));
    } catch { /* ignore */ }
  }
}
