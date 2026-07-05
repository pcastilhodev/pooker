import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Movie } from './movie';
import { MovieService } from '../../services/movie-service';
import { Rent } from '../../services/rent';
import { TmdbService } from '../../services/tmdb-service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FilmeModel } from '../../models/filme-model';
import { AuthService, AuthUser } from '../../services/auth-service';
import { ToastService } from '../../services/toast-service';
import { FavoritesService } from '../../services/favorites-service';
import { RatingsService } from '../../services/ratings-service';
import { RecentService } from '../../services/recent-service';
import { CommentsService, MovieComment } from '../../services/comments-service';
import { RecommendationService } from '../../services/recommendation-service';

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
  let tmdbSpy:  jasmine.SpyObj<TmdbService>;

  beforeEach(async () => {
    movieSpy = jasmine.createSpyObj('MovieService', ['getMovie', 'getAllMovies']);
    rentSpy  = jasmine.createSpyObj('Rent', ['getRents']);
    tmdbSpy  = jasmine.createSpyObj('TmdbService', ['getTrailerKey']);

    movieSpy.getMovie.and.returnValue(of(makeFilm(1)));
    movieSpy.getAllMovies.and.returnValue(of([makeFilm(1), makeFilm(2), makeFilm(3, 'Comédia')]));
    tmdbSpy.getTrailerKey.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [Movie],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: MovieService, useValue: movieSpy },
        { provide: Rent, useValue: rentSpy },
        { provide: TmdbService, useValue: tmdbSpy },
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
      pagamento: { aluguel_id: '1', amount: 10 }
    }));
    component.rentMovie();
    expect(rentSpy.getRents).toHaveBeenCalledWith(1);
  });

  it('filmYear should return year as number', () => {
    expect(component.filmYear).toBe(2024);
  });

  it('filmYear should return 0 when ano is falsy', () => {
    component.film = makeFilm(1, 'Drama', { ano: undefined as unknown as Date });
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

describe('Movie - branch coverage with mocked collaborators', () => {
  let component: Movie;
  let fixture: ComponentFixture<Movie>;

  let movieSpy: jasmine.SpyObj<MovieService>;
  let rentSpy: jasmine.SpyObj<Rent>;
  let tmdbSpy: jasmine.SpyObj<TmdbService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let favoritesSpy: jasmine.SpyObj<FavoritesService>;
  let ratingsSpy: jasmine.SpyObj<RatingsService>;
  let recentSpy: jasmine.SpyObj<RecentService>;
  let commentsSpy: jasmine.SpyObj<CommentsService>;
  let recommendationSpy: jasmine.SpyObj<RecommendationService>;

  let favoritesSubject: BehaviorSubject<Set<number>>;
  let isLoggedIn: boolean;
  let currentUser: AuthUser | null;

  beforeEach(async () => {
    favoritesSubject = new BehaviorSubject<Set<number>>(new Set());
    isLoggedIn = false;
    currentUser = null;

    movieSpy = jasmine.createSpyObj('MovieService', ['getMovie', 'getAllMovies']);
    rentSpy = jasmine.createSpyObj('Rent', ['getRents']);
    tmdbSpy = jasmine.createSpyObj('TmdbService', ['getTrailerKey']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    authSpy = {} as jasmine.SpyObj<AuthService>;
    Object.defineProperty(authSpy, 'isLoggedIn', { get: () => isLoggedIn, configurable: true });
    Object.defineProperty(authSpy, 'user', { get: () => currentUser, configurable: true });

    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'warn', 'error', 'info']);

    favoritesSpy = jasmine.createSpyObj('FavoritesService', ['toggle']);
    Object.defineProperty(favoritesSpy, 'favorites$', { value: favoritesSubject.asObservable(), configurable: true });

    ratingsSpy = jasmine.createSpyObj('RatingsService', ['rate', 'statsFor']);
    ratingsSpy.statsFor.and.returnValue({ count: 0, average: 0, userStars: 0 });

    recentSpy = jasmine.createSpyObj('RecentService', ['track']);

    commentsSpy = jasmine.createSpyObj('CommentsService', ['for', 'add', 'remove']);
    commentsSpy.for.and.returnValue([]);

    recommendationSpy = jasmine.createSpyObj('RecommendationService', ['trackView']);

    movieSpy.getMovie.and.returnValue(of(makeFilm(1)));
    movieSpy.getAllMovies.and.returnValue(of([makeFilm(1)]));
    tmdbSpy.getTrailerKey.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [Movie],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: MovieService, useValue: movieSpy },
        { provide: Rent, useValue: rentSpy },
        { provide: TmdbService, useValue: tmdbSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: FavoritesService, useValue: favoritesSpy },
        { provide: RatingsService, useValue: ratingsSpy },
        { provide: RecentService, useValue: recentSpy },
        { provide: CommentsService, useValue: commentsSpy },
        { provide: RecommendationService, useValue: recommendationSpy },
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

  describe('guard clauses when there is no film', () => {
    beforeEach(() => { component.film = undefined; });

    it('refreshComments returns early', () => {
      commentsSpy.for.calls.reset();
      component.refreshComments();
      expect(commentsSpy.for).not.toHaveBeenCalled();
    });

    it('addComment returns early', () => {
      component.addComment();
      expect(toastSpy.warn).not.toHaveBeenCalled();
      expect(commentsSpy.add).not.toHaveBeenCalled();
    });

    it('toggleFavorite returns early', () => {
      component.toggleFavorite();
      expect(favoritesSpy.toggle).not.toHaveBeenCalled();
    });

    it('rate returns early', () => {
      component.rate(5);
      expect(ratingsSpy.rate).not.toHaveBeenCalled();
    });

    it('rentMovie returns early', () => {
      component.rentMovie();
      expect(rentSpy.getRents).not.toHaveBeenCalled();
    });

    it('shareMovie returns early', () => {
      const shareSpy = jasmine.createSpy('share').and.returnValue(Promise.resolve());
      Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true });
      component.shareMovie();
      expect(shareSpy).not.toHaveBeenCalled();
    });
  });

  describe('refreshComments', () => {
    it('loads comments for the current film', () => {
      component.film = makeFilm(7);
      const list: MovieComment[] = [{ id: 1, filmeId: 7, author: 'Ana', email: 'ana@x.com', text: 'Top', ts: 1 }];
      commentsSpy.for.and.returnValue(list);
      component.refreshComments();
      expect(commentsSpy.for).toHaveBeenCalledWith(7);
      expect(component.comments).toEqual(list);
    });
  });

  describe('addComment', () => {
    beforeEach(() => { component.film = makeFilm(7); });

    it('warns when not logged in', () => {
      isLoggedIn = false;
      component.addComment();
      expect(toastSpy.warn).toHaveBeenCalledWith('Faça login para comentar.', 'Acesso necessário');
      expect(commentsSpy.add).not.toHaveBeenCalled();
    });

    it('warns when the created comment comes back null (blank text)', () => {
      isLoggedIn = true;
      commentsSpy.add.and.returnValue(null);
      component.newComment = '   ';
      component.addComment();
      expect(toastSpy.warn).toHaveBeenCalledWith('Escreva algo antes de publicar.');
    });

    it('publishes, clears input, refreshes list and toasts success', () => {
      isLoggedIn = true;
      const created: MovieComment = { id: 2, filmeId: 7, author: 'Ana', email: 'ana@x.com', text: 'Ótimo!', ts: 2 };
      commentsSpy.add.and.returnValue(created);
      commentsSpy.for.and.returnValue([created]);
      component.newComment = 'Ótimo!';

      component.addComment();

      expect(commentsSpy.add).toHaveBeenCalledWith(7, 'Ótimo!');
      expect(component.newComment).toBe('');
      expect(component.comments).toEqual([created]);
      expect(toastSpy.success).toHaveBeenCalledWith('Comentário publicado.');
    });
  });

  describe('removeComment', () => {
    it('removes the comment and refreshes the list', () => {
      component.film = makeFilm(7);
      component.removeComment(3);
      expect(commentsSpy.remove).toHaveBeenCalledWith(3);
      expect(commentsSpy.for).toHaveBeenCalledWith(7);
    });
  });

  describe('shareMovie', () => {
    let originalShare: PropertyDescriptor | undefined;
    let originalClipboard: PropertyDescriptor | undefined;

    beforeEach(() => {
      originalShare = Object.getOwnPropertyDescriptor(navigator, 'share');
      originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
      component.film = makeFilm(9, 'Drama', { titulo: 'Duna' });
    });

    afterEach(() => {
      if (originalShare) Object.defineProperty(navigator, 'share', originalShare);
      else delete (navigator as unknown as Record<string, unknown>)['share'];
      if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
      else delete (navigator as unknown as Record<string, unknown>)['clipboard'];
    });

    it('uses navigator.share when available', () => {
      const shareSpy = jasmine.createSpy('share').and.returnValue(Promise.resolve());
      Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true });

      component.shareMovie();

      expect(shareSpy).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Duna' }));
    });

    it('swallows a rejected navigator.share promise', fakeAsync(() => {
      const shareSpy = jasmine.createSpy('share').and.returnValue(Promise.reject(new Error('cancelled')));
      Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true });

      expect(() => component.shareMovie()).not.toThrow();
      tick();
    }));

    it('falls back to clipboard when navigator.share is unavailable', fakeAsync(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
      const writeTextSpy = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: writeTextSpy }, configurable: true });

      component.shareMovie();
      tick();

      expect(writeTextSpy).toHaveBeenCalled();
      expect(toastSpy.success).toHaveBeenCalledWith('Link copiado!');
    }));

    it('falls back to toast.info when neither share nor clipboard are available', () => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });

      component.shareMovie();

      expect(toastSpy.info).toHaveBeenCalled();
    });
  });

  describe('toggleFavorite', () => {
    beforeEach(() => { component.film = makeFilm(4); });

    it('warns when not logged in', () => {
      isLoggedIn = false;
      component.toggleFavorite();
      expect(toastSpy.warn).toHaveBeenCalledWith('Faça login para salvar nos favoritos.', 'Acesso necessário');
      expect(favoritesSpy.toggle).not.toHaveBeenCalled();
    });

    it('toasts "Adicionado" when toggled on', () => {
      isLoggedIn = true;
      favoritesSpy.toggle.and.returnValue(true);
      component.toggleFavorite();
      expect(favoritesSpy.toggle).toHaveBeenCalledWith(4);
      expect(toastSpy.info).toHaveBeenCalledWith('Adicionado aos favoritos');
    });

    it('toasts "Removido" when toggled off', () => {
      isLoggedIn = true;
      favoritesSpy.toggle.and.returnValue(false);
      component.toggleFavorite();
      expect(toastSpy.info).toHaveBeenCalledWith('Removido dos favoritos');
    });
  });

  describe('rate', () => {
    beforeEach(() => { component.film = makeFilm(4); });

    it('warns when not logged in', () => {
      isLoggedIn = false;
      component.rate(3);
      expect(toastSpy.warn).toHaveBeenCalledWith('Faça login para avaliar este filme.', 'Acesso necessário');
      expect(ratingsSpy.rate).not.toHaveBeenCalled();
    });

    it('uses plural "estrelas" label and updates stats for stars > 1', () => {
      isLoggedIn = true;
      ratingsSpy.rate.and.returnValue({ count: 1, average: 4, userStars: 4 });
      component.rate(4);
      expect(ratingsSpy.rate).toHaveBeenCalledWith(4, 4);
      expect(component.ratingStats).toEqual({ count: 1, average: 4, userStars: 4 });
      expect(toastSpy.success).toHaveBeenCalledWith('Você avaliou com 4 estrelas.', 'Avaliação registrada');
    });

    it('uses singular "estrela" label for a single star', () => {
      isLoggedIn = true;
      ratingsSpy.rate.and.returnValue({ count: 1, average: 1, userStars: 1 });
      component.rate(1);
      expect(toastSpy.success).toHaveBeenCalledWith('Você avaliou com 1 estrela.', 'Avaliação registrada');
    });
  });

  describe('rentMovie', () => {
    beforeEach(() => { component.film = makeFilm(4); });

    it('confirms the rent and stops loading on success', () => {
      rentSpy.getRents.and.returnValue(of({
        aluguel: { data_prevista_devolucao: '2024-05-01T00:00:00.000000Z' },
        pagamento: { aluguel_id: 'abc', amount: 25 }
      }));

      component.rentMovie();

      expect(rentSpy.getRents).toHaveBeenCalledWith(4);
      expect(toastSpy.success).toHaveBeenCalledWith(jasmine.any(String), 'Aluguel confirmado');
      expect(component.rentLoading).toBeFalse();
    });

    it('warns to log in on a 401 error', () => {
      rentSpy.getRents.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

      component.rentMovie();

      expect(toastSpy.warn).toHaveBeenCalledWith('Faça login para alugar este filme.', 'Acesso necessário');
      expect(toastSpy.error).not.toHaveBeenCalled();
      expect(component.rentLoading).toBeFalse();
    });

    it('shows a generic error toast on other failures', () => {
      rentSpy.getRents.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      component.rentMovie();

      expect(toastSpy.error).toHaveBeenCalledWith('Não foi possível concluir o aluguel. Tente novamente.', 'Erro');
      expect(component.rentLoading).toBeFalse();
    });
  });

  describe('goBack', () => {
    it('navigates to the home route', () => {
      component.goBack();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('palette / gradId / radId getters', () => {
    it('repeat every 6 film ids', () => {
      component.film = makeFilm(8);
      const p8 = component.palette;
      component.film = makeFilm(2);
      const p2 = component.palette;
      expect(p8).toEqual(p2);
      expect(component.gradId).toBe('fg2');
      expect(component.radId).toBe('rg2');
    });

    it('default to id 0 when there is no film loaded', () => {
      component.film = makeFilm(0);
      const p0 = component.palette;

      component.film = undefined;

      expect(component.gradId).toBe('fg0');
      expect(component.radId).toBe('rg0');
      expect(component.palette).toEqual(p0);
    });
  });

  describe('currentUserEmail', () => {
    it('is undefined when there is no logged-in user', () => {
      currentUser = null;
      expect(component.currentUserEmail).toBeUndefined();
    });

    it('returns the auth user email when logged in', () => {
      currentUser = { nome: 'Ana', email: 'ana@x.com' };
      expect(component.currentUserEmail).toBe('ana@x.com');
    });
  });
});
