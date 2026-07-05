import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

const STORAGE_KEY = 'looker:search-history';
const MAX_ENTRIES = 6;

@Injectable({ providedIn: 'root' })
export class SearchHistoryService {
  private readonly entries$ = new BehaviorSubject<string[]>(this.read());

  history$: Observable<string[]> = this.entries$.asObservable();

  get list(): string[] { return this.entries$.value; }

  push(term: string) {
    const t = term.trim();
    if (!t) return;
    const lc = t.toLowerCase();
    const next = [t, ...this.entries$.value.filter(e => e.toLowerCase() !== lc)].slice(0, MAX_ENTRIES);
    this.entries$.next(next);
    this.persist();
  }

  remove(term: string) {
    const lc = term.toLowerCase();
    this.entries$.next(this.entries$.value.filter(e => e.toLowerCase() !== lc));
    this.persist();
  }

  clear() {
    this.entries$.next([]);
    this.persist();
  }

  private read(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) as string[] : [];
      return Array.isArray(arr) ? arr.filter(s => typeof s === 'string').slice(0, MAX_ENTRIES) : [];
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
