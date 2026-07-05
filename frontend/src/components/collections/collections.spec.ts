import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { Collections } from './collections';
import { CollectionsService, Collection } from '../../services/collections-service';
import { MovieService } from '../../services/movie-service';
import { FilmeModel } from '../../models/filme-model';

const film = (id: number): FilmeModel => ({
  id, titulo: `F${id}`, genero: 'Ação', ano: new Date(2020, 0, 1), preco_aluguel: 10,
  sinopse: '', imagem_url: '', duracao_minutos: 90, classificacao_indicativa: '12',
  data_lancamento: new Date(2020, 0, 1), total_copias: 5, diretor: 'D', copias_disponiveis: 3,
});

describe('Collections', () => {
  let component: Collections;
  let fixture: ComponentFixture<Collections>;
  let collections$: BehaviorSubject<Collection[]>;
  let collectionsSpy: jasmine.SpyObj<CollectionsService>;
  let movieSpy: jasmine.SpyObj<MovieService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    collections$ = new BehaviorSubject<Collection[]>([]);
    collectionsSpy = jasmine.createSpyObj('CollectionsService', ['create'], { collections$ });
    movieSpy = jasmine.createSpyObj('MovieService', ['getAllMovies']);
    movieSpy.getAllMovies.and.returnValue(of([film(1), film(2)]));
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [Collections],
      providers: [
        { provide: CollectionsService, useValue: collectionsSpy },
        { provide: MovieService, useValue: movieSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Collections);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('loads collections and all films on init', () => {
    collections$.next([{ id: '1', name: 'Maratona', filmIds: [1], createdAt: '' }]);
    expect(component.collections.length).toBe(1);
    expect(component.allFilms.length).toBe(2);
  });

  it('create ignores blank names', () => {
    component.newName = '   ';
    component.create();
    expect(collectionsSpy.create).not.toHaveBeenCalled();
  });

  it('create delegates to the service and clears the input', () => {
    component.newName = 'Favoritos de sábado';
    component.create();
    expect(collectionsSpy.create).toHaveBeenCalledWith('Favoritos de sábado');
    expect(component.newName).toBe('');
  });

  it('filmsFor returns only the films that belong to a collection', () => {
    component.allFilms = [film(1), film(2), film(3)];
    const col: Collection = { id: '1', name: 'X', filmIds: [1, 3], createdAt: '' };

    const result = component.filmsFor(col);
    expect(result.map(f => f.id)).toEqual([1, 3]);
  });

  it('goBack navigates to the home page', () => {
    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });
});
