import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MovieService } from './movie-service';
import { FilmeModel } from '../models/filme-model';

describe('MovieService', () => {
  let service: MovieService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(MovieService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── getAllMovies ───────────────────────────────────────────────────────────

  it('getAllMovies deve fazer GET em /gateway/movie/v1/filmes/', () => {
    service.getAllMovies().subscribe();

    const req = httpMock.expectOne('/gateway/movie/v1/filmes/');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getAllMovies deve retornar array de filmes', () => {
    const filmesMock: FilmeModel[] = [
      {
        id: 1, titulo: 'Filme A', genero: 'Ação', ano: new Date('2020-01-01'),
        preco_aluguel: 10, sinopse: 'Sinopse', imagem_url: 'url',
        duracao_minutos: 120, classificacao_indicativa: '12',
        data_lancamento: new Date('2020-01-01'), total_copias: 5,
        diretor: 'Diretor', copias_disponiveis: 3
      }
    ];

    let resultado: FilmeModel[] | undefined;
    service.getAllMovies().subscribe(filmes => (resultado = filmes));

    httpMock.expectOne('/gateway/movie/v1/filmes/').flush(filmesMock);
    expect(resultado).toEqual(filmesMock);
  });

  it('getAllMovies deve retornar array vazio quando API retorna []', () => {
    let resultado: FilmeModel[] | undefined;
    service.getAllMovies().subscribe(filmes => (resultado = filmes));

    httpMock.expectOne('/gateway/movie/v1/filmes/').flush([]);
    expect(resultado).toEqual([]);
  });

  // ── getMovie ──────────────────────────────────────────────────────────────

  it('getMovie deve fazer GET em /gateway/movie/v1/filmes/{id}', () => {
    service.getMovie(42).subscribe();

    const req = httpMock.expectOne('/gateway/movie/v1/filmes/42');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getMovie deve retornar o filme correspondente ao id', () => {
    const filmeMock = { id: 7, titulo: 'Filme B' };

    let resultado: any;
    service.getMovie(7).subscribe(f => (resultado = f));

    httpMock.expectOne('/gateway/movie/v1/filmes/7').flush(filmeMock);
    expect(resultado).toEqual(filmeMock);
  });

  it('getMovie deve propagar erro 404 quando filme não encontrado', () => {
    let erroCapturado: any;
    service.getMovie(999).subscribe({ error: err => (erroCapturado = err) });

    httpMock.expectOne('/gateway/movie/v1/filmes/999').flush(
      'Not Found',
      { status: 404, statusText: 'Not Found' }
    );
    expect(erroCapturado.status).toBe(404);
  });
});
