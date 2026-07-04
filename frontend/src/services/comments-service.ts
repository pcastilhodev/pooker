import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth-service';

const STORAGE_KEY = 'looker:comments';

export interface MovieComment {
  id: number;
  filmeId: number;
  author: string;
  email: string;
  text: string;
  ts: number;
}

@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly auth = inject(AuthService);

  private readonly all$ = new BehaviorSubject<MovieComment[]>(this.read());
  private nextId = (this.all$.value.reduce((m, c) => Math.max(m, c.id), 0)) + 1;

  comments$: Observable<MovieComment[]> = this.all$.asObservable();

  for(filmeId: number): MovieComment[] {
    return this.all$.value
      .filter(c => c.filmeId === filmeId)
      .sort((a, b) => b.ts - a.ts);
  }

  byUser(email: string): MovieComment[] {
    return this.all$.value.filter(c => c.email === email);
  }

  add(filmeId: number, text: string): MovieComment | null {
    const user = this.auth.user;
    if (!user || !text.trim()) return null;
    const comment: MovieComment = {
      id: this.nextId++,
      filmeId,
      author: user.nome,
      email: user.email,
      text: text.trim().slice(0, 800),
      ts: Date.now(),
    };
    this.all$.next([...this.all$.value, comment]);
    this.persist();
    return comment;
  }

  remove(id: number) {
    const user = this.auth.user;
    if (!user) return;
    this.all$.next(this.all$.value.filter(c => !(c.id === id && c.email === user.email)));
    this.persist();
  }

  private read(): MovieComment[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as MovieComment[] : [];
    } catch { return []; }
  }

  private persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.all$.value)); }
    catch { /* ignore */ }
  }
}
