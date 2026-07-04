import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { FilmeModel } from '../models/filme-model';

@Injectable({ providedIn: 'root' })
export class MovieService {
  private http = inject(HttpClient);

  private allMovies$: Observable<FilmeModel[]> | null = null;

  getMovie(id: number): Observable<FilmeModel> {
    return this.http.get<FilmeModel>(`/gateway/movie/v1/filmes/${id}`);
  }

  getAllMovies(): Observable<FilmeModel[]> {
    if (!this.allMovies$) {
      this.allMovies$ = this.http
        .get<FilmeModel[]>('/gateway/movie/v1/filmes/')
        .pipe(shareReplay(1));
    }
    return this.allMovies$;
  }
}
