import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, map, catchError } from 'rxjs';
import { environment } from '../environments/environment';

const BASE = 'https://api.themoviedb.org/3';

@Injectable({ providedIn: 'root' })
export class TmdbService {
  private cache = new Map<string, string | null>();

  constructor(private http: HttpClient) {}

  getTrailerKey(titulo: string): Observable<string | null> {
    if (this.cache.has(titulo)) return of(this.cache.get(titulo)!);

    const key = environment.tmdbApiKey;
    return this.http
      .get<any>(`${BASE}/search/movie`, { params: { api_key: key, query: titulo, language: 'pt-BR' } })
      .pipe(
        switchMap(res => {
          const id = res.results?.[0]?.id;
          if (!id) return of(null);
          return this.http
            .get<any>(`${BASE}/movie/${id}/videos`, { params: { api_key: key } })
            .pipe(map(v => v.results?.find((r: any) => r.type === 'Trailer' && r.site === 'YouTube')?.key ?? null));
        }),
        catchError(() => of(null)),
        map(k => { this.cache.set(titulo, k); return k; })
      );
  }
}
