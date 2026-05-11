import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Movie } from './movie';
import { MovieService } from '../../services/movie-service';
import { Rent } from '../../services/rent';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FilmeModel } from '../../models/filme-model';

const makeFilm = (id: number, genero = 'Drama', overrides: Partial<FilmeModel> = {}): FilmeModel => ({
  id, titulo: `Filme ${id}`, genero, ano: new Date('2024-01-01'),
  preco_aluguel: 10, sinopse: 'Uma sinopse.', imagem_url: '', duracao_minutos: 120,
  classificacao_indicativa: '12', data_lancamento: new Date('2024-01-01'),
  total_copias: 5, diretor: 'Diretor Teste', copias_disponiveis: 3,
  ...overrides
});

describe('Movie', () => {
  let component: Movie;
  let fixture: ComponentFixture<Movie>;
  let movieSpy: jasmine.SpyObj<MovieService>;
  let rentSpy:  jasmine.SpyObj<Rent>;

  beforeEach(async () => {
    movieSpy = jasmine.createSpyObj('MovieService', ['getMovie', 'getAllMovies']);
    rentSpy  = jasmine.createSpyObj('Rent', ['getRents']);

    movieSpy.getMovie.and.returnValue(of(makeFilm(1)));
    movieSpy.getAllMovies.and.returnValue(of([makeFilm(1), makeFilm(2), makeFilm(3, 'Comédia')]));

    await TestBed.configureTestingModule({
      imports: [Movie],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: MovieService, useValue: movieSpy },
        { provide: Rent, useValue: rentSpy },
        { provide: ActivatedRoute, useValue: { params: of({ id: '1' }) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Movie);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should load film on init', () => {
    expect(component.film?.titulo).toBe('Filme 1');
  });

  it('should load similar films of same genre', () => {
    expect(component.similarFilms.length).toBe(1);
    expect(component.similarFilms[0].id).toBe(2);
  });

  it('should call rentService when rentMovie is called', () => {
    rentSpy.getRents.and.returnValue(of({
      aluguel: { data_prevista_devolucao: new Date().toISOString() },
      pagamento: { aluguel_id: 1, amount: 10 }
    }));
    component.rentMovie();
    expect(rentSpy.getRents).toHaveBeenCalledWith(1);
  });

  it('filmYear should return year as number', () => {
    expect(component.filmYear).toBe(2024);
  });

  it('filmYear should return 0 when ano is falsy', () => {
    component.film = makeFilm(1, 'Drama', { ano: undefined as any });
    expect(component.filmYear).toBe(0);
  });

  it('durationFormatted should format hours and minutes', () => {
    component.film = makeFilm(1, 'Drama', { duracao_minutos: 135 });
    expect(component.durationFormatted).toBe('2h 15min');
  });

  it('durationFormatted should show only minutes when under 1 hour', () => {
    component.film = makeFilm(1, 'Drama', { duracao_minutos: 45 });
    expect(component.durationFormatted).toBe('45min');
  });

  it('durationFormatted should return 0min when duracao_minutos is falsy', () => {
    component.film = makeFilm(1, 'Drama', { duracao_minutos: 0 });
    expect(component.durationFormatted).toBe('0min');
  });

  it('cast should return empty array when elenco is undefined', () => {
    component.film = makeFilm(1, 'Drama', { elenco: undefined });
    expect(component.cast).toEqual([]);
  });

  it('cast should parse valid JSON elenco', () => {
    const castData = [{ name: 'Ator', character: 'Herói', foto_url: null }];
    component.film = makeFilm(1, 'Drama', { elenco: JSON.stringify(castData) });
    expect(component.cast).toEqual(castData);
  });

  it('cast should return empty array for invalid JSON', () => {
    component.film = makeFilm(1, 'Drama', { elenco: 'not-json' });
    expect(component.cast).toEqual([]);
  });

  it('should enable scroll on body and html on init', () => {
    expect(document.documentElement.style.overflow).toBe('auto');
    expect(document.body.style.overflow).toBe('auto');
  });

  it('should restore overflow hidden on destroy', () => {
    component.ngOnDestroy();
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.body.style.overflow).toBe('hidden');
  });
});
