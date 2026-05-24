import { Injectable } from '@angular/core';
import { FilmeModel } from '../models/filme-model';

const KEY = 'looker:recently-viewed';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  trackView(filmId: number): void {
    try {
      const ids: number[] = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      const next = [filmId, ...ids.filter(id => id !== filmId)].slice(0, 20);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch { /* ignore */ }
  }

  recentIds(): number[] {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
    catch { return []; }
  }

  recommend(all: FilmeModel[], recentFilms: FilmeModel[]): FilmeModel[] {
    if (!recentFilms.length) return [];
    const recentIds = new Set(recentFilms.map(m => m.id));
    const genreScore = new Map<string, number>();
    recentFilms.forEach(m => genreScore.set(m.genero, (genreScore.get(m.genero) ?? 0) + 1));
    return all
      .filter(m => !recentIds.has(m.id))
      .map(m => ({ film: m, score: genreScore.get(m.genero) ?? 0 }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(x => x.film);
  }
}
