import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Header } from './header';
import { Router, provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError, Subject, BehaviorSubject } from 'rxjs';
import { LoginService } from '../../services/login-service';
import { AuthService, AuthUser } from '../../services/auth-service';
import { ToastService } from '../../services/toast-service';
import { MovieService } from '../../services/movie-service';
import { SearchHistoryService } from '../../services/search-history-service';
import { ShortcutsService } from '../../services/shortcuts-service';
import { SurpriseService } from '../../services/surprise-service';
import { ThemeService } from '../../services/theme-service';
import { FilmeModel } from '../../models/filme-model';
import { RegisterModel } from '../../models/register-model';

const makeFilm = (id: number, titulo: string, genero: string): FilmeModel => ({
  id, titulo, genero, ano: new Date('2024-01-01'),
  preco_aluguel: 10, sinopse: '', imagem_url: '', duracao_minutos: 100,
  classificacao_indicativa: '12', data_lancamento: new Date('2024-01-01'),
  total_copias: 5, diretor: 'Dir', copias_disponiveis: 3
});

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  let routerSpy: jasmine.SpyObj<Router>;
  let loginSpy: jasmine.SpyObj<LoginService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let moviesSpy: jasmine.SpyObj<MovieService>;
  let historySpy: jasmine.SpyObj<SearchHistoryService>;
  let shortcutsSpy: jasmine.SpyObj<ShortcutsService>;
  let surpriseSpy: jasmine.SpyObj<SurpriseService>;
  let themeSpy: jasmine.SpyObj<ThemeService>;

  let userSubject: BehaviorSubject<AuthUser | null>;
  let historySubject: BehaviorSubject<string[]>;
  let focusSubject: Subject<void>;

  beforeEach(async () => {
    userSubject = new BehaviorSubject<AuthUser | null>(null);
    historySubject = new BehaviorSubject<string[]>([]);
    focusSubject = new Subject<void>();

    loginSpy = jasmine.createSpyObj('LoginService', ['authenticate', 'register']);

    authSpy = jasmine.createSpyObj('AuthService', ['logout', 'setToken']);
    Object.defineProperty(authSpy, 'user$', { value: userSubject.asObservable(), configurable: true });
    Object.defineProperty(authSpy, 'user', { get: () => userSubject.value, configurable: true });

    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    moviesSpy = jasmine.createSpyObj('MovieService', ['getAllMovies']);
    moviesSpy.getAllMovies.and.returnValue(of([]));

    historySpy = jasmine.createSpyObj('SearchHistoryService', ['push', 'remove', 'clear']);
    Object.defineProperty(historySpy, 'history$', { value: historySubject.asObservable(), configurable: true });

    shortcutsSpy = jasmine.createSpyObj('ShortcutsService', ['toggleHelp', 'openHelp', 'closeHelp', 'requestSearchFocus']);
    Object.defineProperty(shortcutsSpy, 'searchFocusRequest$', { value: focusSubject.asObservable(), configurable: true });

    surpriseSpy = jasmine.createSpyObj('SurpriseService', ['open', 'close', 'toggle']);

    themeSpy = jasmine.createSpyObj('ThemeService', ['toggle']);
    Object.defineProperty(themeSpy, 'theme', { get: () => 'dark', configurable: true });

    await TestBed.configureTestingModule({
      imports: [Header],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideRouter([]),
        { provide: LoginService, useValue: loginSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: MovieService, useValue: moviesSpy },
        { provide: SearchHistoryService, useValue: historySpy },
        { provide: ShortcutsService, useValue: shortcutsSpy },
        { provide: SurpriseService, useValue: surpriseSpy },
        { provide: ThemeService, useValue: themeSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate = spyOn(TestBed.inject(Router), 'navigate').and.returnValue(Promise.resolve(true));
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  describe('scroll behavior (onScroll)', () => {
    it('should start with scrolled = false', () => {
      expect(component.scrolled).toBeFalse();
    });

    it('should set scrolled = true when scrollTop > 40', () => {
      component.onScroll({ scrollTop: 50 });
      expect(component.scrolled).toBeTrue();
    });

    it('should keep scrolled = false when scrollTop <= 40', () => {
      component.onScroll({ scrollTop: 10 });
      expect(component.scrolled).toBeFalse();
    });

    it('should hide header when scrolling down past threshold', () => {
      component.onScroll({ scrollTop: 100 });
      component.onScroll({ scrollTop: 200 });
      expect(component.hidden).toBeTrue();
    });

    it('should show header when scrolling up', () => {
      component.onScroll({ scrollTop: 200 });
      component.onScroll({ scrollTop: 100 });
      expect(component.hidden).toBeFalse();
    });
  });

  describe('scroll container wiring (ngAfterViewInit / ngOnDestroy)', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.id = 'scroll-container';
      document.body.appendChild(container);

      fixture = TestBed.createComponent(Header);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    afterEach(() => {
      container.remove();
    });

    it('should attach a scroll listener that forwards scrollTop to onScroll', () => {
      const onScrollSpy = spyOn(component, 'onScroll').and.callThrough();
      container.dispatchEvent(new Event('scroll'));
      expect(onScrollSpy).toHaveBeenCalledWith({ scrollTop: container.scrollTop });
    });

    it('should remove the scroll listener on destroy', () => {
      const removeSpy = spyOn(container, 'removeEventListener').and.callThrough();
      component.ngOnDestroy();
      expect(removeSpy).toHaveBeenCalledWith('scroll', jasmine.any(Function));
    });
  });

  describe('login modal', () => {
    it('should open login modal when openLogin() is called', () => {
      component.openLogin();
      expect(component.loginVisible).toBeTrue();
    });

    it('should close login modal when closeLogin() is called', () => {
      component.loginVisible = true;
      component.closeLogin();
      expect(component.loginVisible).toBeFalse();
    });
  });

  describe('menu', () => {
    it('toggleMenu should flip menuOpen', () => {
      expect(component.menuOpen).toBeFalse();
      component.toggleMenu();
      expect(component.menuOpen).toBeTrue();
      component.toggleMenu();
      expect(component.menuOpen).toBeFalse();
    });

    it('closeMenu should set menuOpen to false', () => {
      component.menuOpen = true;
      component.closeMenu();
      expect(component.menuOpen).toBeFalse();
    });

    it('goTo should close menu and navigate to path', () => {
      component.menuOpen = true;
      component.goTo('/profile');
      expect(component.menuOpen).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/profile']);
    });

    it('logout should call auth.logout, close menu and navigate home', () => {
      component.menuOpen = true;
      component.logout();
      expect(authSpy.logout).toHaveBeenCalled();
      expect(component.menuOpen).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['']);
    });
  });

  describe('document click / escape handlers', () => {
    it('should close menu and search on outside click', () => {
      component.menuOpen = true;
      component.searchOpen = true;
      const outsideEl = document.createElement('div');
      document.body.appendChild(outsideEl);

      component.onDocumentClick({ target: outsideEl } as unknown as MouseEvent);

      expect(component.menuOpen).toBeFalse();
      expect(component.searchOpen).toBeFalse();
      outsideEl.remove();
    });

    it('should NOT close menu/search on inside click', () => {
      component.menuOpen = true;
      component.searchOpen = true;

      component.onDocumentClick({ target: fixture.nativeElement } as unknown as MouseEvent);

      expect(component.menuOpen).toBeTrue();
      expect(component.searchOpen).toBeTrue();
    });

    it('onEscape should close menu and search', () => {
      component.menuOpen = true;
      component.searchOpen = true;
      component.onEscape();
      expect(component.menuOpen).toBeFalse();
      expect(component.searchOpen).toBeFalse();
    });
  });

  describe('search open/close', () => {
    it('openSearch should set searchOpen = true', () => {
      component.openSearch();
      expect(component.searchOpen).toBeTrue();
    });

    it('closeSearch should reset searchOpen, searchTerm and searchResults', () => {
      component.searchOpen = true;
      component.searchTerm = 'duna';
      component.searchResults = [makeFilm(1, 'Duna', 'Ficção')];
      component.closeSearch();
      expect(component.searchOpen).toBeFalse();
      expect(component.searchTerm).toBe('');
      expect(component.searchResults).toEqual([]);
    });
  });

  describe('search input (debounce / switchMap)', () => {
    it('should debounce and populate results matching by titulo', fakeAsync(() => {
      moviesSpy.getAllMovies.and.returnValue(of([
        makeFilm(1, 'Duna', 'Ficção'),
        makeFilm(2, 'Matrix', 'Ficção'),
        makeFilm(3, 'Titanic', 'Drama'),
      ]));

      component.onSearchInput('duna');
      tick(180);

      expect(component.searchResults.length).toBe(1);
      expect(component.searchResults[0].titulo).toBe('Duna');
      expect(component.searchLoading).toBeFalse();
    }));

    it('should match by genero as well as titulo', fakeAsync(() => {
      moviesSpy.getAllMovies.and.returnValue(of([
        makeFilm(1, 'Duna', 'Ficção Científica'),
        makeFilm(2, 'Matrix', 'Ação'),
      ]));

      component.onSearchInput('ficção');
      tick(180);

      expect(component.searchResults.length).toBe(1);
      expect(component.searchResults[0].titulo).toBe('Duna');
    }));

    it('should limit results to 6 items', fakeAsync(() => {
      const films = Array.from({ length: 10 }, (_, i) => makeFilm(i, `Filme ${i}`, 'Comedia'));
      moviesSpy.getAllMovies.and.returnValue(of(films));

      component.onSearchInput('comedia');
      tick(180);

      expect(component.searchResults.length).toBe(6);
    }));

    it('should clear results and loading when term becomes empty', fakeAsync(() => {
      moviesSpy.getAllMovies.and.returnValue(of([makeFilm(1, 'Duna', 'Ficção')]));

      component.onSearchInput('duna');
      tick(180);
      expect(component.searchResults.length).toBe(1);

      component.onSearchInput('');
      tick(180);

      expect(component.searchResults).toEqual([]);
      expect(component.searchLoading).toBeFalse();
      expect(moviesSpy.getAllMovies).toHaveBeenCalledTimes(1);
    }));

    it('should not call getAllMovies again for the same distinct value', fakeAsync(() => {
      moviesSpy.getAllMovies.and.returnValue(of([makeFilm(1, 'Duna', 'Ficção')]));

      component.onSearchInput('duna');
      tick(180);
      component.onSearchInput('duna');
      tick(180);

      expect(moviesSpy.getAllMovies).toHaveBeenCalledTimes(1);
    }));
  });

  describe('submitSearch', () => {
    it('should do nothing when term is blank', () => {
      component.searchTerm = '   ';
      component.submitSearch();
      expect(historySpy.push).not.toHaveBeenCalled();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should push history, close search and navigate with query param', () => {
      component.searchTerm = ' duna ';
      component.submitSearch();
      expect(historySpy.push).toHaveBeenCalledWith('duna');
      expect(component.searchOpen).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith([''], { queryParams: { q: 'duna' } });
    });
  });

  describe('pickResult', () => {
    it('should push history term, close search and navigate to movie detail', () => {
      component.searchTerm = 'duna';
      component.pickResult(makeFilm(5, 'Duna', 'Ficção'));
      expect(historySpy.push).toHaveBeenCalledWith('duna');
      expect(component.searchOpen).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/movie', 5]);
    });

    it('should fall back to film titulo when searchTerm is empty', () => {
      component.searchTerm = '';
      component.pickResult(makeFilm(5, 'Duna', 'Ficção'));
      expect(historySpy.push).toHaveBeenCalledWith('Duna');
    });
  });

  describe('pickHistory', () => {
    it('should set searchTerm, trigger the search stream and focus the input afterwards', fakeAsync(() => {
      moviesSpy.getAllMovies.and.returnValue(of([makeFilm(1, 'Duna', 'Ficção')]));

      component.pickHistory('duna');
      expect(component.searchTerm).toBe('duna');

      tick(180);
      tick();

      expect(component.searchResults.length).toBe(1);
    }));
  });

  describe('removeHistory / clearHistory', () => {
    it('removeHistory should stop propagation and call history.remove', () => {
      const evt = jasmine.createSpyObj<Event>('Event', ['stopPropagation']);
      component.removeHistory('duna', evt);
      expect(evt.stopPropagation).toHaveBeenCalled();
      expect(historySpy.remove).toHaveBeenCalledWith('duna');
    });

    it('clearHistory should stop propagation and call history.clear', () => {
      const evt = jasmine.createSpyObj<Event>('Event', ['stopPropagation']);
      component.clearHistory(evt);
      expect(evt.stopPropagation).toHaveBeenCalled();
      expect(historySpy.clear).toHaveBeenCalled();
    });
  });

  describe('openSurprise', () => {
    it('should call surprise.open()', () => {
      component.openSurprise();
      expect(surpriseSpy.open).toHaveBeenCalled();
    });
  });

  describe('ngOnInit subscriptions', () => {
    it('should update user when auth.user$ emits', () => {
      const u: AuthUser = { nome: 'Ana Silva', email: 'ana@example.com' };
      userSubject.next(u);
      expect(component.user).toEqual(u);
    });

    it('should update searchHistory when history$ emits', () => {
      historySubject.next(['duna', 'matrix']);
      expect(component.searchHistory).toEqual(['duna', 'matrix']);
    });

    it('should open search and schedule focus when shortcuts requests search focus', fakeAsync(() => {
      focusSubject.next();
      expect(component.searchOpen).toBeTrue();
      tick();
    }));
  });

  describe('initials', () => {
    it('should return "?" when there is no user', () => {
      expect(component.initials).toBe('?');
    });

    it('should return first+last initials uppercased for a full name', () => {
      userSubject.next({ nome: 'ana silva', email: 'a@a.com' });
      expect(component.initials).toBe('AS');
    });

    it('should return a single initial for a single-word name', () => {
      userSubject.next({ nome: 'Ana', email: 'a@a.com' });
      expect(component.initials).toBe('A');
    });
  });

  describe('handleLogin', () => {
    it('should authenticate, set token, close login modal and toast success', () => {
      loginSpy.authenticate.and.returnValue(of({ token: 'abc123' }));
      component.loginVisible = true;

      component.handleLogin({ username: 'a@a.com', password: '123456', remember: false });

      expect(loginSpy.authenticate).toHaveBeenCalledWith('a@a.com', '123456');
      expect(authSpy.setToken).toHaveBeenCalledWith('abc123');
      expect(component.loginVisible).toBeFalse();
      expect(toastSpy.success).toHaveBeenCalled();
    });

    it('should toast an error when authentication fails', () => {
      loginSpy.authenticate.and.returnValue(throwError(() => new Error('invalid credentials')));

      component.handleLogin({ username: 'x@x.com', password: 'bad', remember: false });

      expect(toastSpy.error).toHaveBeenCalledWith('Credenciais inválidas. Tente novamente.', 'Falha no login');
    });
  });

  describe('handleRegister', () => {
    const registerData: RegisterModel = {
      nome: 'Ana', cpf: '12345678900', email: 'ana@example.com',
      senha: 'password1', telefone: '11999999999', data_nascimento: new Date('2000-01-01')
    };

    it('should register, close login modal and toast success', () => {
      loginSpy.register.and.returnValue(of({}));
      component.loginVisible = true;

      component.handleRegister(registerData);

      expect(loginSpy.register).toHaveBeenCalledWith(registerData);
      expect(component.loginVisible).toBeFalse();
      expect(toastSpy.success).toHaveBeenCalled();
    });

    it('should toast an error when registration fails', () => {
      loginSpy.register.and.returnValue(throwError(() => new Error('failure')));

      component.handleRegister(registerData);

      expect(toastSpy.error).toHaveBeenCalledWith('Não foi possível concluir o registro.', 'Falha');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from user updates', () => {
      component.ngOnDestroy();
      userSubject.next({ nome: 'Novo Nome', email: 'n@n.com' });
      expect(component.user).toBeNull();
    });

    it('should unsubscribe from search history updates', () => {
      component.ngOnDestroy();
      historySubject.next(['abc']);
      expect(component.searchHistory).toEqual([]);
    });

    it('should unsubscribe from search focus requests', () => {
      component.ngOnDestroy();
      focusSubject.next();
      expect(component.searchOpen).toBeFalse();
    });

    it('should not throw when there is no scroll-container in the DOM', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
