import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, map, catchError, tap } from 'rxjs';
import { environment } from '../environments/environment';

const BASE = 'https://api.themoviedb.org/3';

interface TmdbSearchResult {
  id: number;
  title?: string;
}

interface TmdbSearchResponse {
  results?: TmdbSearchResult[];
}

interface TmdbVideo {
  key: string;
  type: string;
  site: string;
}

interface TmdbVideosResponse {
  results?: TmdbVideo[];
}

@Injectable({ providedIn: 'root' })
export class TmdbService {
  private readonly http = inject(HttpClient);

  private readonly cache = new Map<string, string | null>();

  getTrailerKey(titulo: string): Observable<string | null> {
    if (this.cache.has(titulo)) return of(this.cache.get(titulo)!);

    const key = environment.tmdbApiKey;
    return this.http
      .get<TmdbSearchResponse>(`${BASE}/search/movie`, { params: { api_key: key, query: titulo, language: 'pt-BR' } })
      .pipe(
        switchMap(res => {
          const id = res.results?.[0]?.id;
          if (!id) return of(null);
          return this.http
            .get<TmdbVideosResponse>(`${BASE}/movie/${id}/videos`, { params: { api_key: key } })
            .pipe(map(v => v.results?.find((r: TmdbVideo) => r.type === 'Trailer' && r.site === 'YouTube')?.key ?? null));
        }),
        catchError(() => of(null)),
        tap(k => { if (k !== null) this.cache.set(titulo, k); })
      );
  }
}
