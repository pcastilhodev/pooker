import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Collection {
  id: string;
  name: string;
  filmIds: number[];
  createdAt: string;
}

const KEY = 'looker:collections';

@Injectable({ providedIn: 'root' })
export class CollectionsService {
  private readonly data$ = new BehaviorSubject<Collection[]>(this.load());
  collections$ = this.data$.asObservable();

  getAll(): Collection[] { return this.data$.value; }

  create(name: string): void {
    const col: Collection = { id: crypto.randomUUID(), name, filmIds: [], createdAt: new Date().toISOString() };
    this.save([...this.data$.value, col]);
  }

  delete(id: string): void { this.save(this.data$.value.filter(c => c.id !== id)); }

  addFilm(collectionId: string, filmId: number): void {
    this.save(this.data$.value.map(c =>
      c.id === collectionId && !c.filmIds.includes(filmId)
        ? { ...c, filmIds: [...c.filmIds, filmId] } : c
    ));
  }

  removeFilm(collectionId: string, filmId: number): void {
    this.save(this.data$.value.map(c =>
      c.id === collectionId ? { ...c, filmIds: c.filmIds.filter(id => id !== filmId) } : c
    ));
  }

  private load(): Collection[] {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
    catch { return []; }
  }

  private save(cols: Collection[]): void {
    this.data$.next(cols);
    try { localStorage.setItem(KEY, JSON.stringify(cols)); } catch { /* ignore */ }
  }
}
