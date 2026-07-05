import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { MovieService } from '../../services/movie-service';
import { of, throwError, Subject, Observable } from 'rxjs';
import { FilmeModel } from '../../models/filme-model';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../services/auth-service';
import { FavoritesService } from '../../services/favorites-service';
import { Rent, RentalItem } from '../../services/rent';
import { RecentService } from '../../services/recent-service';
import { FilmFilters } from '../../services/filter-service';

const makeFilm = (id: number, overrides: Partial<FilmeModel> = {}): FilmeModel => ({
  id, titulo: `Filme ${id}`, genero: 'Drama', ano: new Date('2024-01-01'),
  preco_aluguel: 10, sinopse: '', imagem_url: '', duracao_minutos: 120,
  classificacao_indicativa: '12', data_lancamento: new Date('2024-01-01'),
  total_copias: 5, diretor: 'Dir', copias_disponiveis: 3,
  ...overrides
});

interface CreateDashboardOptions {
  films?: FilmeModel[];
  queryParams?: Record<string, string>;
  isLoggedIn?: boolean;
  favoritesList?: number[];
  recentList?: number[];
  rentals$?: Observable<RentalItem[]>;
  routerEvents?: Subject<unknown> | 'none';
}

async function createDashboard(opts: CreateDashboardOptions = {}) {
  const movieSpy = jasmine.createSpyObj('MovieService', ['getAllMovies']);
  movieSpy.getAllMovies.and.returnValue(of(opts.films ?? [makeFilm(1), makeFilm(2), makeFilm(3)]));

  const authSpy = {} as jasmine.SpyObj<AuthService>;
  Object.defineProperty(authSpy, 'isLoggedIn', { get: () => opts.isLoggedIn ?? false, configurable: true });

  const favoritesSpy = {} as jasmine.SpyObj<FavoritesService>;
  Object.defineProperty(favoritesSpy, 'list', { get: () => opts.favoritesList ?? [], configurable: true });

  const rentSpy = jasmine.createSpyObj('Rent', ['listMyRents', 'getRents']);
  rentSpy.listMyRents.and.returnValue(opts.rentals$ ?? of([]));

  const recentSpy = {} as jasmine.SpyObj<RecentService>;
  Object.defineProperty(recentSpy, 'list', { get: () => opts.recentList ?? [], configurable: true });

  const routerValue: Record<string, unknown> = { navigate: jasmine.createSpy('navigate') };
  if (opts.routerEvents !== 'none') {
    routerValue['events'] = opts.routerEvents ?? new Subject();
  }

  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [Dashboard],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MovieService, useValue: movieSpy },
      { provide: Router, useValue: routerValue },
      { provide: ActivatedRoute, useValue: { snapshot: { queryParams: opts.queryParams ?? {} }, queryParams: of({}) } },
      { provide: AuthService, useValue: authSpy },
      { provide: FavoritesService, useValue: favoritesSpy },
      { provide: Rent, useValue: rentSpy },
      { provide: RecentService, useValue: recentSpy },
    ]
  }).compileComponents();

  const fixture = TestBed.createComponent(Dashboard);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { component, fixture, movieSpy, authSpy, favoritesSpy, rentSpy, recentSpy, routerValue };
}

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
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MovieService, useValue: movieSpy },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} }, queryParams: of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
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

  describe('loadMovies / ngOnInit query param + genres', () => {
    it('should filter films by the q query param (case-insensitive, matches titulo)', async () => {
      const films = [makeFilm(1, { titulo: 'Duna' }), makeFilm(2, { titulo: 'Matrix' })];
      const { component: c } = await createDashboard({ films, queryParams: { q: 'DUN' } });
      expect(c.allFilms.length).toBe(1);
      expect(c.allFilms[0].titulo).toBe('Duna');
    });

    it('should use all films when there is no q query param', async () => {
      const films = [makeFilm(1), makeFilm(2)];
      const { component: c } = await createDashboard({ films });
      expect(c.allFilms.length).toBe(2);
    });

    it('should extract unique, sorted genres and exclude falsy genero values', async () => {
      const films = [
        makeFilm(1, { genero: 'Terror' }),
        makeFilm(2, { genero: 'Ação' }),
        makeFilm(3, { genero: 'Terror' }),
        makeFilm(4, { genero: '' }),
      ];
      const { component: c } = await createDashboard({ films });
      expect(c.genres).toEqual(['Ação', 'Terror']);
    });

    it('should reload movies when a NavigationEnd event fires on router.events', async () => {
      const events$ = new Subject<unknown>();
      const { movieSpy: spy } = await createDashboard({ routerEvents: events$ });
      spy.getAllMovies.calls.reset();
      events$.next(new NavigationEnd(1, '/', '/'));
      expect(spy.getAllMovies).toHaveBeenCalledTimes(1);
    });

    it('should ignore router events that are not NavigationEnd', async () => {
      const events$ = new Subject<unknown>();
      const { movieSpy: spy } = await createDashboard({ routerEvents: events$ });
      spy.getAllMovies.calls.reset();
      events$.next({ type: 'not-a-navigation-end' });
      expect(spy.getAllMovies).not.toHaveBeenCalled();
    });

    it('should not throw and should still load once when router.events is undefined', async () => {
      const { movieSpy: spy } = await createDashboard({ routerEvents: 'none' });
      expect(spy.getAllMovies).toHaveBeenCalledTimes(1);
    });
  });

  describe('computeRecommendations / applyRecommendations', () => {
    it('should be empty when the user is not logged in', async () => {
      const { component: c } = await createDashboard({ isLoggedIn: false });
      expect(c.recommended).toEqual([]);
    });

    it('should be empty when logged in but there is no favorite/rental signal', async () => {
      const films = [makeFilm(1), makeFilm(2)];
      const { component: c } = await createDashboard({ films, isLoggedIn: true, favoritesList: [], rentals$: of([]) });
      expect(c.recommended).toEqual([]);
    });

    it('should score genres from favorites, excluding already-favorited films, and rank candidates', async () => {
      const films = [
        makeFilm(1, { genero: 'Terror' }),
        makeFilm(2, { genero: 'Terror' }),
        makeFilm(3, { genero: 'Comédia' }),
      ];
      const { component: c } = await createDashboard({
        films, isLoggedIn: true, favoritesList: [1], rentals$: of([])
      });
      expect(c.recommended.map(f => f.id)).toEqual([2]);
    });

    it('should add rental-based scoring, mark rented films as seen, and ignore rentals for unknown films', async () => {
      const films = [
        makeFilm(1, { genero: 'Terror' }),
        makeFilm(2, { genero: 'Terror' }),
      ];
      const rentals: RentalItem[] = [
        { id: 'r1', filme_id: 1, data_aluguel: '', data_prevista_devolucao: '', status: 'ativo', valor_aluguel: 10 },
        { id: 'r2', filme_id: 999, data_aluguel: '', data_prevista_devolucao: '', status: 'ativo', valor_aluguel: 10 },
      ];
      const { component: c } = await createDashboard({
        films, isLoggedIn: true, favoritesList: [], rentals$: of(rentals)
      });
      expect(c.recommended.map(f => f.id)).toEqual([2]);
    });

    it('should fall back to favorites-only scoring when listMyRents errors', async () => {
      const films = [
        makeFilm(1, { genero: 'Terror' }),
        makeFilm(2, { genero: 'Terror' }),
      ];
      const { component: c } = await createDashboard({
        films, isLoggedIn: true, favoritesList: [1],
        rentals$: throwError(() => new Error('network error'))
      });
      expect(c.recommended.map(f => f.id)).toEqual([2]);
    });

    it('should accumulate scores across multiple favorites/rentals of the same genre and sort by score desc', async () => {
      const films = [
        makeFilm(1, { genero: 'Terror' }),
        makeFilm(2, { genero: 'Terror' }),
        makeFilm(3, { genero: 'Terror' }),
        makeFilm(4, { genero: 'Comédia' }),
        makeFilm(5, { genero: 'Comédia' }),
        makeFilm(6, { genero: '' }),
      ];
      const rentals: RentalItem[] = [
        { id: 'r1', filme_id: 4, data_aluguel: '', data_prevista_devolucao: '', status: 'ativo', valor_aluguel: 10 },
      ];
      const { component: c } = await createDashboard({
        films, isLoggedIn: true, favoritesList: [1, 2], rentals$: of(rentals)
      });
      // Terror score = 2 + 2 = 4 (candidate: film 3), Comédia score = 3 (candidate: film 5)
      expect(c.recommended.map(f => f.id)).toEqual([3, 5]);
    });

    it('should cap recommended at 8 items', async () => {
      const films = [
        makeFilm(1, { genero: 'Terror' }),
        ...Array.from({ length: 10 }, (_, i) => makeFilm(100 + i, { genero: 'Terror' })),
      ];
      const { component: c } = await createDashboard({
        films, isLoggedIn: true, favoritesList: [1], rentals$: of([])
      });
      expect(c.recommended.length).toBe(8);
    });
  });

  describe('computeRecent', () => {
    it('should map recent ids to films and filter out ids with no matching film', async () => {
      const films = [makeFilm(1), makeFilm(2)];
      const { component: c } = await createDashboard({ films, recentList: [2, 999] });
      expect(c.recentFilms.map(f => f.id)).toEqual([2]);
    });

    it('should be empty when there are no recent ids', async () => {
      const films = [makeFilm(1)];
      const { component: c } = await createDashboard({ films, recentList: [] });
      expect(c.recentFilms).toEqual([]);
    });
  });

  describe('onFiltersChange / applyFilters / selectGenre / applyGenre', () => {
    beforeEach(() => {
      component.allFilms = [
        makeFilm(1, { genero: 'Terror', preco_aluguel: 5 }),
        makeFilm(2, { genero: 'Comédia', preco_aluguel: 20 }),
        makeFilm(3, { genero: 'Terror', preco_aluguel: 30 }),
      ];
      component.onFiltersChange(component.activeFilters);
    });

    it('should recompute films according to the given filters and keep filteredFilms in sync', () => {
      const filters: FilmFilters = {
        generos: ['Terror'], minAno: 0, maxAno: 9999,
        minPreco: 0, maxPreco: 9999, minDuracao: 0, maxDuracao: 9999,
        apenasDisponivel: false
      };
      component.onFiltersChange(filters);
      expect(component.films.map(f => f.id)).toEqual([1, 3]);
      expect(component.filteredFilms.map(f => f.id)).toEqual([1, 3]);
    });

    it('selectGenre should narrow filteredFilms to the chosen genre', () => {
      component.selectGenre('Terror');
      expect(component.activeGenre).toBe('Terror');
      expect(component.filteredFilms.map(f => f.id)).toEqual([1, 3]);
    });

    it('selectGenre should toggle activeGenre off when the same genre is selected again', () => {
      component.selectGenre('Terror');
      component.selectGenre('Terror');
      expect(component.activeGenre).toBeNull();
      expect(component.filteredFilms).toEqual(component.films);
    });

    it('selectGenre should switch to a new genre when a different one is selected', () => {
      component.selectGenre('Terror');
      component.selectGenre('Comédia');
      expect(component.activeGenre).toBe('Comédia');
      expect(component.filteredFilms.map(f => f.id)).toEqual([2]);
    });
  });

  describe('onIntroDismissed', () => {
    it('should hide intro, show nav and animate the first snap section after a delay', fakeAsync(() => {
      const animateSpy = jasmine.createSpy('animate');
      component.snapSections = { toArray: () => [{ animate: animateSpy, leave: jasmine.createSpy('leave') }] } as unknown as Dashboard['snapSections'];

      component.onIntroDismissed();
      expect(component.showIntro).toBeFalse();
      expect(component.navVisible).toBeTrue();
      expect(animateSpy).not.toHaveBeenCalled();

      tick(50);
      expect(animateSpy).toHaveBeenCalled();
    }));

    it('should not throw when there are no snap sections', fakeAsync(() => {
      component.snapSections = { toArray: () => [] } as unknown as Dashboard['snapSections'];
      expect(() => { component.onIntroDismissed(); tick(50); }).not.toThrow();
    }));

    it('should not throw when snapSections is undefined', fakeAsync(() => {
      component.snapSections = undefined as unknown as Dashboard['snapSections'];
      expect(() => { component.onIntroDismissed(); tick(50); }).not.toThrow();
    }));
  });

  describe('snapToSection', () => {
    let sections: { leave: jasmine.Spy; animate: jasmine.Spy }[];
    let scrollToSpy: jasmine.Spy;

    beforeEach(() => {
      component.films = [makeFilm(1), makeFilm(2), makeFilm(3)];
      component.snapFilms = component.films.slice(0, 6);
      sections = [0, 1, 2].map(() => ({ leave: jasmine.createSpy('leave'), animate: jasmine.createSpy('animate') }));
      component.snapSections = { toArray: () => sections } as unknown as Dashboard['snapSections'];
      scrollToSpy = jasmine.createSpy('scrollTo');
      component.scrollContainerRef = { nativeElement: { scrollTo: scrollToSpy, scrollBy: jasmine.createSpy('scrollBy') } } as unknown as Dashboard['scrollContainerRef'];
      component.currentIndex = 0;
    });

    it('should clamp to 0 for negative indices', () => {
      component.snapToSection(-5);
      expect(component.currentIndex).toBe(0);
    });

    it('should clamp to the last section for out-of-range indices', () => {
      component.snapToSection(99);
      expect(component.currentIndex).toBe(2);
    });

    it('should return early without side effects when index === currentIndex', () => {
      component.snapToSection(0);
      expect(sections[0].leave).not.toHaveBeenCalled();
      expect(scrollToSpy).not.toHaveBeenCalled();
    });

    it('should call leave() on the current section, update currentIndex and scrollTo the new offset', fakeAsync(() => {
      component.snapToSection(1);
      expect(sections[0].leave).toHaveBeenCalled();
      expect(component.currentIndex).toBe(1);
      expect(scrollToSpy).toHaveBeenCalledWith({ top: window.innerHeight, behavior: 'smooth' });

      expect(sections[1].animate).not.toHaveBeenCalled();
      tick(300);
      expect(sections[1].animate).toHaveBeenCalled();
    }));

    it('should skip scrollTo when scrollContainerRef is missing', fakeAsync(() => {
      component.scrollContainerRef = undefined as unknown as Dashboard['scrollContainerRef'];
      expect(() => component.snapToSection(1)).not.toThrow();
      expect(component.currentIndex).toBe(1);
      tick(300);
    }));
  });

  describe('onWheel', () => {
    let scrollBySpy: jasmine.Spy;
    let snapSpy: jasmine.Spy;

    beforeEach(() => {
      component.snapFilms = [makeFilm(1), makeFilm(2), makeFilm(3)];
      component.currentIndex = 0;
      scrollBySpy = jasmine.createSpy('scrollBy');
      component.scrollContainerRef = { nativeElement: { scrollTo: jasmine.createSpy('scrollTo'), scrollBy: scrollBySpy } } as unknown as Dashboard['scrollContainerRef'];
      snapSpy = spyOn(component, 'snapToSection');
    });

    function wheelEvent(deltaY: number): WheelEvent {
      return { deltaY, preventDefault: jasmine.createSpy('preventDefault') } as unknown as WheelEvent;
    }

    it('should call preventDefault immediately', () => {
      const e = wheelEvent(10);
      component.onWheel(e);
      expect(e.preventDefault).toHaveBeenCalled();
    });

    it('should debounce and snap forward when scrolling down and not at the last section', fakeAsync(() => {
      component.onWheel(wheelEvent(50));
      tick(40);
      expect(snapSpy).toHaveBeenCalledWith(1);
    }));

    it('should debounce and snap backward when scrolling up', fakeAsync(() => {
      component.currentIndex = 2;
      component.onWheel(wheelEvent(-50));
      tick(40);
      expect(snapSpy).toHaveBeenCalledWith(1);
    }));

    it('should scrollBy instead of snapping when already at the last section and scrolling down', fakeAsync(() => {
      component.currentIndex = 2;
      component.onWheel(wheelEvent(80));
      tick(40);
      expect(snapSpy).not.toHaveBeenCalled();
      expect(scrollBySpy).toHaveBeenCalledWith({ top: 240, behavior: 'smooth' });
    }));

    it('should still snap backward at the last section when scrolling up', fakeAsync(() => {
      component.currentIndex = 2;
      component.onWheel(wheelEvent(-30));
      tick(40);
      expect(snapSpy).toHaveBeenCalledWith(1);
    }));

    it('should reset the debounce timer on rapid consecutive wheel events', fakeAsync(() => {
      component.onWheel(wheelEvent(50));
      tick(20);
      component.onWheel(wheelEvent(50));
      tick(20);
      expect(snapSpy).not.toHaveBeenCalled();
      tick(20);
      expect(snapSpy).toHaveBeenCalledTimes(1);
    }));
  });

  describe('counterLabel', () => {
    it('should pad single-digit index/count with a leading zero', () => {
      component.currentIndex = 0;
      component.snapFilms = [makeFilm(1), makeFilm(2), makeFilm(3)];
      expect(component.counterLabel).toBe('01 / 03');
    });

    it('should not pad when index/count already have two digits', () => {
      component.currentIndex = 9;
      component.snapFilms = Array.from({ length: 12 }, (_, i) => makeFilm(i));
      expect(component.counterLabel).toBe('10 / 12');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from router NavigationEnd events', async () => {
      const events$ = new Subject<unknown>();
      const { component: c, movieSpy: spy } = await createDashboard({ routerEvents: events$ });
      spy.getAllMovies.calls.reset();
      c.ngOnDestroy();
      events$.next(new NavigationEnd(1, '/', '/'));
      expect(spy.getAllMovies).not.toHaveBeenCalled();
    });

    it('should call ctx.revert() when a gsap context exists', () => {
      const revertSpy = jasmine.createSpy('revert');
      (component as unknown as { ctx: { revert: () => void } }).ctx = { revert: revertSpy };
      component.ngOnDestroy();
      expect(revertSpy).toHaveBeenCalled();
    });

    it('should not throw when there is no gsap context', () => {
      (component as unknown as { ctx: unknown }).ctx = undefined;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should clear the pending wheel debounce timer', () => {
      const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callThrough();
      component.onWheel({ deltaY: 10, preventDefault: () => { /* noop */ } } as unknown as WheelEvent);
      component.ngOnDestroy();
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
