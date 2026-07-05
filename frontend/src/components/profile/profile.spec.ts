import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Profile } from './profile';
import { AuthService, AuthUser } from '../../services/auth-service';
import { FavoritesService } from '../../services/favorites-service';
import { WatchlistService } from '../../services/watchlist-service';
import { RatingsService } from '../../services/ratings-service';
import { MovieService } from '../../services/movie-service';
import { Rent } from '../../services/rent';
import { AchievementsService } from '../../services/achievements-service';
import { CommentsService } from '../../services/comments-service';
import { RecentService } from '../../services/recent-service';
import { FilmeModel } from '../../models/filme-model';

const film = (id: number, genero: string): FilmeModel => ({
  id, titulo: `F${id}`, genero, ano: new Date(2020, 0, 1), preco_aluguel: 10,
  sinopse: '', imagem_url: '', duracao_minutos: 90, classificacao_indicativa: '12',
  data_lancamento: new Date(2020, 0, 1), total_copias: 5, diretor: 'D', copias_disponiveis: 3,
});

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let user$: BehaviorSubject<AuthUser | null>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let rentSpy: jasmine.SpyObj<Rent>;
  let movieSpy: jasmine.SpyObj<MovieService>;
  let favoritesSpy: jasmine.SpyObj<FavoritesService>;
  let watchlistSpy: jasmine.SpyObj<WatchlistService>;
  let ratingsSpy: jasmine.SpyObj<RatingsService>;
  let achievementsSpy: jasmine.SpyObj<AchievementsService>;
  let commentsSpy: jasmine.SpyObj<CommentsService>;
  let recentSpy: jasmine.SpyObj<RecentService>;

  async function setup(user: AuthUser | null) {
    user$ = new BehaviorSubject<AuthUser | null>(user);
    authSpy = jasmine.createSpyObj('AuthService', ['logout'], { user$, user });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    rentSpy = jasmine.createSpyObj('Rent', ['listMyRents']);
    rentSpy.listMyRents.and.returnValue(of([
      { id: 1, filme_id: 1, data_aluguel: '', data_prevista_devolucao: '', status: 'ativo', valor_aluguel: 20 },
      { id: 2, filme_id: 2, data_aluguel: '', data_prevista_devolucao: '', status: 'devolvido', valor_aluguel: 10 },
    ]));
    movieSpy = jasmine.createSpyObj('MovieService', ['getAllMovies']);
    movieSpy.getAllMovies.and.returnValue(of([film(1, 'Ação'), film(2, 'Drama')]));
    favoritesSpy = jasmine.createSpyObj('FavoritesService', [], { favorites$: of(new Set([1])) });
    watchlistSpy = jasmine.createSpyObj('WatchlistService', [], { watchlist$: of([{ id: 2, addedAt: Date.now() }]) });
    ratingsSpy = jasmine.createSpyObj('RatingsService', [], {
      ratings$: of([{ user: user?.email ?? 'guest', filmeId: 1, stars: 4, ts: Date.now() }]),
    });
    achievementsSpy = jasmine.createSpyObj('AchievementsService', ['evaluate'], { achievements$: of(new Set(['first-login'])) });
    commentsSpy = jasmine.createSpyObj('CommentsService', ['byUser']);
    commentsSpy.byUser.and.returnValue([{ id: 1, filmeId: 1, author: 'A', email: user?.email ?? '', text: 'x', ts: 0 }]);
    recentSpy = jasmine.createSpyObj('RecentService', [], { list: [1, 2, 3] });

    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: Rent, useValue: rentSpy },
        { provide: MovieService, useValue: movieSpy },
        { provide: FavoritesService, useValue: favoritesSpy },
        { provide: WatchlistService, useValue: watchlistSpy },
        { provide: RatingsService, useValue: ratingsSpy },
        { provide: AchievementsService, useValue: achievementsSpy },
        { provide: CommentsService, useValue: commentsSpy },
        { provide: RecentService, useValue: recentSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
  }

  it('redirects home when there is no logged-in user', async () => {
    await setup(null);
    fixture.detectChanges();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['']);
  });

  it('loads aggregated stats for the logged-in user', async () => {
    await setup({ nome: 'Ana Silva', email: 'ana@teste.com' });
    fixture.detectChanges();

    expect(component.stats.rentalsTotal).toBe(2);
    expect(component.stats.rentalsActive).toBe(1);
    expect(component.stats.totalSpent).toBe(30);
    expect(component.stats.favoritesCount).toBe(1);
    expect(component.stats.watchlistCount).toBe(1);
    expect(component.stats.ratingsCount).toBe(1);
    expect(component.stats.ratingsAverage).toBe(4);
    expect(component.statsLoading).toBeFalse();
  });

  it('evaluates achievements with the computed stats', async () => {
    await setup({ nome: 'Ana Silva', email: 'ana@teste.com' });
    fixture.detectChanges();

    expect(achievementsSpy.evaluate).toHaveBeenCalledWith(jasmine.objectContaining({
      rentalsCount: 2,
      favoritesCount: 1,
      ratingsCount: 1,
      totalSpent: 30,
      commentsCount: 1,
      moviesVisited: 3,
    }));
  });

  it('hasAchievement reflects the unlocked set', async () => {
    await setup({ nome: 'Ana Silva', email: 'ana@teste.com' });
    fixture.detectChanges();
    expect(component.hasAchievement('first-login')).toBeTrue();
    expect(component.hasAchievement('critic')).toBeFalse();
  });

  it('initials derives from first and last name', async () => {
    await setup({ nome: 'Ana Maria Silva', email: 'a@b.com' });
    fixture.detectChanges();
    expect(component.initials).toBe('AS');
  });

  it('initials falls back to ? without a name', async () => {
    await setup({ nome: '', email: 'a@b.com' });
    fixture.detectChanges();
    expect(component.initials).toBe('?');
  });

  it('maskedCpf formats the cpf with dots and dash', async () => {
    await setup({ nome: 'Ana', email: 'a@b.com', cpf: '12345678900' });
    fixture.detectChanges();
    expect(component.maskedCpf).toBe('123.456.789-00');
  });

  it('maskedCpf returns a dash without a cpf', async () => {
    await setup({ nome: 'Ana', email: 'a@b.com' });
    fixture.detectChanges();
    expect(component.maskedCpf).toBe('—');
  });

  it('birthDateFormatted returns a dash without a birth date', async () => {
    await setup({ nome: 'Ana', email: 'a@b.com' });
    fixture.detectChanges();
    expect(component.birthDateFormatted).toBe('—');
  });

  it('birthDateFormatted formats a valid date', async () => {
    await setup({ nome: 'Ana', email: 'a@b.com', data_nascimento: '1990-05-10' });
    fixture.detectChanges();
    expect(component.birthDateFormatted).not.toBe('—');
  });

  it('totalSpentFormatted renders the spent amount as BRL currency', async () => {
    await setup({ nome: 'Ana', email: 'a@b.com' });
    fixture.detectChanges();
    expect(component.totalSpentFormatted).toContain('30');
  });

  it('navigation shortcuts route to the right pages', async () => {
    await setup({ nome: 'Ana', email: 'a@b.com' });
    fixture.detectChanges();

    component.goToRentals();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/meus-alugueis']);
    component.goToFavorites();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/favoritos']);
    component.goToWatchlist();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/watchlist']);
  });

  it('logout logs the user out and navigates home', async () => {
    await setup({ nome: 'Ana', email: 'a@b.com' });
    fixture.detectChanges();

    component.logout();

    expect(authSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['']);
  });

  it('tolerates a failing rentals request and still computes stats', async () => {
    await setup({ nome: 'Ana', email: 'a@b.com' });
    rentSpy.listMyRents.and.returnValue(throwError(() => new Error('falhou')));

    fixture.detectChanges();

    expect(component.stats.rentalsTotal).toBe(0);
    expect(component.statsLoading).toBeFalse();
  });
});
