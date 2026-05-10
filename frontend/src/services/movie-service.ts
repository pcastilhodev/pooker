import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {FilmeModel} from '../models/filme-model';

@Injectable({
  providedIn: 'root'
})

export class MovieService {

  constructor(private http: HttpClient) {}

  getMovie(id: number) {
    return this.http.get(`/gateway/movie/v1/filmes/${id}` );
  }

  getAllMovies(): Observable<FilmeModel[]> {
    const url = '/gateway/movie/v1/filmes/';

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    };
    console.log('Fetching all movies from:', url);
    return this.http.get<FilmeModel[]>(url, { headers });
  }
}
