import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { Watchlist } from './watchlist';
import { MovieService } from '../../services/movie-service';
import { WatchlistService, WatchlistEntry } from '../../services/watchlist-service';
import { AuthService } from '../../services/auth-service';
import { ToastService } from '../../services/toast-service';
import { FilmeModel } from '../../models/filme-model';

const film = (id: number): FilmeModel => ({
  id, titulo: `F${id}`, genero: 'Ação', ano: new Date(2020, 0, 1), preco_aluguel: 10,
  sinopse: '', imagem_url: '', duracao_minutos: 90, classificacao_indicativa: '12',
  data_lancamento: new Date(2020, 0, 1), total_copias: 5, diretor: 'D', copias_disponiveis: 3,
});

describe('Watchlist', () => {
  let component: Watchlist;
  let fixture: ComponentFixture<Watchlist>;
  let movieSpy: jasmine.SpyObj<MovieService>;
  let watchlistSpy: jasmine.SpyObj<WatchlistService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let watchlist$: BehaviorSubject<WatchlistEntry[]>;

  async function setup(isLoggedIn: boolean) {
    movieSpy = jasmine.createSpyObj('MovieService', ['getAllMovies']);
    movieSpy.getAllMovies.and.returnValue(of([film(1), film(2)]));
    watchlist$ = new BehaviorSubject<WatchlistEntry[]>([{ id: 1, addedAt: Date.now() }]);
    watchlistSpy = jasmine.createSpyObj('WatchlistService', ['clear'], { watchlist$ });
    toastSpy = jasmine.createSpyObj('ToastService', ['info']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [Watchlist],
      providers: [
        { provide: MovieService, useValue: movieSpy },
        { provide: WatchlistService, useValue: watchlistSpy },
        { provide: AuthService, useValue: { isLoggedIn } },
        { provide: ToastService, useValue: toastSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Watchlist);
    component = fixture.componentInstance;
  }

  it('redirects home when not logged in', async () => {
    await setup(false);
    fixture.detectChanges();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['']);
  });

  it('builds rows by joining watchlist entries with film data', async () => {
    await setup(true);
    fixture.detectChanges();

    expect(component.rows.length).toBe(1);
    expect(component.rows[0].film.id).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('skips entries whose film cannot be found', async () => {
    await setup(true);
    watchlist$.next([{ id: 999, addedAt: Date.now() }]);
    fixture.detectChanges();

    expect(component.rows).toEqual([]);
  });

  it('clearAll clears the watchlist and shows a toast', async () => {
    await setup(true);
    fixture.detectChanges();

    component.clearAll();

    expect(watchlistSpy.clear).toHaveBeenCalled();
    expect(toastSpy.info).toHaveBeenCalledWith('Watchlist esvaziada.');
  });

  it('clearAll does nothing when the list is already empty', async () => {
    await setup(true);
    watchlist$.next([]);
    fixture.detectChanges();

    component.clearAll();

    expect(watchlistSpy.clear).not.toHaveBeenCalled();
  });

  it('goExplore navigates home', async () => {
    await setup(true);
    fixture.detectChanges();
    component.goExplore();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['']);
  });

  it('trackById returns the row film id', async () => {
    await setup(true);
    fixture.detectChanges();
    expect(component.trackById(0, { film: film(3), addedAt: 0 })).toBe(3);
  });

  it('daysAgo formats recent timestamps', async () => {
    await setup(true);
    fixture.detectChanges();
    expect(component.daysAgo(Date.now())).toBe('hoje');
    expect(component.daysAgo(Date.now() - 86_400_000)).toBe('ontem');
    expect(component.daysAgo(Date.now() - 3 * 86_400_000)).toBe('3 dias');
  });

  it('unsubscribes on destroy', async () => {
    await setup(true);
    fixture.detectChanges();
    fixture.destroy();
    expect(watchlist$.observed).toBeFalse();
  });
});
