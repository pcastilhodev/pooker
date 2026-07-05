import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { Favorites } from './favorites';
import { MovieService } from '../../services/movie-service';
import { FavoritesService } from '../../services/favorites-service';
import { AuthService } from '../../services/auth-service';
import { FilmeModel } from '../../models/filme-model';

const film = (id: number): FilmeModel => ({
  id, titulo: `F${id}`, genero: 'Ação', ano: new Date(2020, 0, 1), preco_aluguel: 10,
  sinopse: '', imagem_url: '', duracao_minutos: 90, classificacao_indicativa: '12',
  data_lancamento: new Date(2020, 0, 1), total_copias: 5, diretor: 'D', copias_disponiveis: 3,
});

describe('Favorites', () => {
  let component: Favorites;
  let fixture: ComponentFixture<Favorites>;
  let movieSpy: jasmine.SpyObj<MovieService>;
  let favoritesSpy: jasmine.SpyObj<FavoritesService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let favorites$: BehaviorSubject<Set<number>>;

  async function setup(isLoggedIn: boolean) {
    movieSpy = jasmine.createSpyObj('MovieService', ['getAllMovies']);
    movieSpy.getAllMovies.and.returnValue(of([film(1), film(2)]));
    favorites$ = new BehaviorSubject<Set<number>>(new Set([1]));
    favoritesSpy = jasmine.createSpyObj('FavoritesService', [], { favorites$ });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [Favorites],
      providers: [
        { provide: MovieService, useValue: movieSpy },
        { provide: FavoritesService, useValue: favoritesSpy },
        { provide: AuthService, useValue: { isLoggedIn } },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Favorites);
    component = fixture.componentInstance;
  }

  it('redirects home when the user is not logged in', async () => {
    await setup(false);
    fixture.detectChanges();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['']);
  });

  it('loads only the favorited films when logged in', async () => {
    await setup(true);
    fixture.detectChanges();
    expect(component.films.map(f => f.id)).toEqual([1]);
    expect(component.loading).toBeFalse();
  });

  it('goExplore navigates home', async () => {
    await setup(true);
    fixture.detectChanges();
    component.goExplore();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['']);
  });

  it('trackById returns the film id', async () => {
    await setup(true);
    fixture.detectChanges();
    expect(component.trackById(0, film(5))).toBe(5);
  });

  it('unsubscribes on destroy', async () => {
    await setup(true);
    fixture.detectChanges();
    fixture.destroy();
    expect(favorites$.observed).toBeFalse();
  });
});
