import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Movie } from './movie';
import { MovieService } from '../../services/movie-service';
import { Rent } from '../../services/rent';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FilmeModel } from '../../models/filme-model';

const makeFilm = (id: number, genero = 'Drama'): FilmeModel => ({
  id, titulo: `Filme ${id}`, genero, ano: new Date('2024-01-01'),
  preco_aluguel: 10, sinopse: 'Uma sinopse.', imagem_url: '', duracao_minutos: 120,
  classificacao_indicativa: '12', data_lancamento: new Date('2024-01-01'),
  total_copias: 5, diretor: 'Diretor Teste', copias_disponiveis: 3
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

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should load film on init', () => {
    expect(component.film?.titulo).toBe('Filme 1');
  });

  it('should load similar films of same genre', () => {
    expect(component.similarFilms.length).toBe(1);
    expect(component.similarFilms[0].id).toBe(2);
  });

  it('should call rentService when rentMovie is called', () => {
    rentSpy.getRents.and.returnValue(of({ aluguel: { data_prevista_devolucao: new Date().toISOString() }, pagamento: { aluguel_id: 1, amount: 10 } }));
    component.rentMovie();
    expect(rentSpy.getRents).toHaveBeenCalledWith(1);
  });

  it('filmYear should return year as number', () => {
    expect(component.filmYear).toBe(2024);
  });
});
