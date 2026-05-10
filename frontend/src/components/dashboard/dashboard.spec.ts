import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { MovieService } from '../../services/movie-service';
import { of } from 'rxjs';
import { FilmeModel } from '../../models/filme-model';
import { ActivatedRoute, Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

const makeFilm = (id: number): FilmeModel => ({
  id, titulo: `Filme ${id}`, genero: 'Drama', ano: new Date('2024-01-01'),
  preco_aluguel: 10, sinopse: '', imagem_url: '', duracao_minutos: 120,
  classificacao_indicativa: '12', data_lancamento: new Date('2024-01-01'),
  total_copias: 5, diretor: 'Dir', copias_disponiveis: 3
});

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let movieSpy: jasmine.SpyObj<MovieService>;

  beforeEach(async () => {
    movieSpy = jasmine.createSpyObj('MovieService', ['getAllMovies']);
    movieSpy.getAllMovies.and.returnValue(of([makeFilm(1), makeFilm(2), makeFilm(3)]));

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: MovieService, useValue: movieSpy },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should load films on init', () => {
    expect(component.films.length).toBe(3);
  });

  it('should expose snap sections (first 6 films)', () => {
    expect(component.snapFilms.length).toBe(3);
  });

  it('should update currentIndex when snapToSection is called', () => {
    component.snapToSection(1);
    expect(component.currentIndex).toBe(1);
  });

  it('should not go below 0 or above snap count', () => {
    component.films = [makeFilm(1), makeFilm(2)];
    component.snapFilms = component.films.slice(0, 6);
    component.snapToSection(-1);
    expect(component.currentIndex).toBe(0);
    component.snapToSection(99);
    expect(component.currentIndex).toBe(1);
  });

  it('should show intro initially', () => {
    expect(component.showIntro).toBeTrue();
  });

  it('should hide intro on onIntroDismissed', () => {
    component.onIntroDismissed();
    expect(component.showIntro).toBeFalse();
  });
});
