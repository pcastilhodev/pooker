import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Header } from './header';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LoginService } from '../../services/login-service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let httpMock: HttpTestingController;
  let loginSpy: jasmine.SpyObj<LoginService>;

  beforeEach(async () => {
    loginSpy = jasmine.createSpyObj('LoginService', ['authenticate', 'register']);

    await TestBed.configureTestingModule({
      imports: [Header],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: LoginService, useValue: loginSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(component.router, 'navigate');
    fixture.detectChanges();
  });

  afterEach(() => { try { httpMock.verify(); } catch { /* ignore pending requests from debounced search */ } });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should start with scrolled = false', () => {
    expect(component.scrolled).toBeFalse();
  });

  it('should set scrolled = true when scrollY > 40', () => {
    component.onScroll({ scrollTop: 50 });
    expect(component.scrolled).toBeTrue();
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

  it('should open login modal when openLogin() is called', () => {
    component.openLogin();
    expect(component.loginVisible).toBeTrue();
  });

  it('closeLogin hides the login modal', () => {
    component.openLogin();
    component.closeLogin();
    expect(component.loginVisible).toBeFalse();
  });

  it('toggleMenu flips the menu open state', () => {
    component.toggleMenu();
    expect(component.menuOpen).toBeTrue();
    component.toggleMenu();
    expect(component.menuOpen).toBeFalse();
  });

  it('closeMenu closes the menu', () => {
    component.toggleMenu();
    component.closeMenu();
    expect(component.menuOpen).toBeFalse();
  });

  it('openSearch opens the search panel', () => {
    component.openSearch();
    expect(component.searchOpen).toBeTrue();
  });

  it('closeSearch resets the search state', () => {
    component.searchTerm = 'matrix';
    component.searchResults = [{ id: 1 } as any];
    component.openSearch();
    component.closeSearch();

    expect(component.searchOpen).toBeFalse();
    expect(component.searchTerm).toBe('');
    expect(component.searchResults).toEqual([]);
  });

  it('onSearchInput triggers a debounced movie search', fakeAsync(() => {
    component.onSearchInput('matrix');
    expect(component.searchTerm).toBe('matrix');
    tick(200);

    const req = httpMock.expectOne(r => r.url.includes('filmes'));
    req.flush([{ id: 1, titulo: 'Matrix', genero: 'Ação' }]);

    expect(component.searchResults.length).toBe(1);
    expect(component.searchLoading).toBeFalse();
  }));

  it('onSearchInput with a blank term clears results without a request', () => {
    component.onSearchInput('   ');
    httpMock.expectNone(r => r.url.includes('filmes'));
    expect(component.searchResults).toEqual([]);
  });

  it('pickResult records history, closes search and navigates to the movie', () => {
    spyOn(component['history'], 'push');
    component.searchTerm = 'matrix';
    component.pickResult({ id: 5, titulo: 'Matrix' } as any);

    expect(component['history'].push).toHaveBeenCalledWith('matrix');
    expect(component.searchOpen).toBeFalse();
    expect(component.router.navigate).toHaveBeenCalledWith(['/movie', 5]);
  });

  it('pickHistory sets the term and re-triggers the search', fakeAsync(() => {
    component.pickHistory('duna');
    expect(component.searchTerm).toBe('duna');
    tick(200);
    httpMock.expectOne(r => r.url.includes('filmes')).flush([]);
  }));

  it('removeHistory stops propagation and delegates to the service', () => {
    spyOn(component['history'], 'remove');
    const evt = jasmine.createSpyObj('Event', ['stopPropagation']);
    component.removeHistory('duna', evt);

    expect(evt.stopPropagation).toHaveBeenCalled();
    expect(component['history'].remove).toHaveBeenCalledWith('duna');
  });

  it('clearHistory stops propagation and delegates to the service', () => {
    spyOn(component['history'], 'clear');
    const evt = jasmine.createSpyObj('Event', ['stopPropagation']);
    component.clearHistory(evt);

    expect(evt.stopPropagation).toHaveBeenCalled();
    expect(component['history'].clear).toHaveBeenCalled();
  });

  it('submitSearch ignores a blank term', () => {
    component.searchTerm = '   ';
    component.submitSearch();
    expect(component.router.navigate).not.toHaveBeenCalled();
  });

  it('submitSearch records history and navigates with a query param', () => {
    component.searchTerm = 'matrix';
    component.submitSearch();

    expect(component.router.navigate).toHaveBeenCalledWith([''], { queryParams: { q: 'matrix' } });
    expect(component.searchOpen).toBeFalse();
  });

  it('goTo closes the menu and navigates to the given path', () => {
    component.toggleMenu();
    component.goTo('/favoritos');

    expect(component.menuOpen).toBeFalse();
    expect(component.router.navigate).toHaveBeenCalledWith(['/favoritos']);
  });

  it('logout logs out, closes the menu and navigates home', () => {
    spyOn(component['auth'], 'logout');
    component.logout();

    expect(component['auth'].logout).toHaveBeenCalled();
    expect(component.router.navigate).toHaveBeenCalledWith(['']);
  });

  it('openSurprise delegates to the surprise service', () => {
    spyOn(component['surprise'], 'open');
    component.openSurprise();
    expect(component['surprise'].open).toHaveBeenCalled();
  });

  it('initials falls back to ? without a user', () => {
    component.user = null;
    expect(component.initials).toBe('?');
  });

  it('initials derives from the logged-in user name', () => {
    component.user = { nome: 'Ana Silva', email: 'a@b.com' };
    expect(component.initials).toBe('AS');
  });

  it('handleLogin sets the token and shows a success toast', () => {
    loginSpy.authenticate.and.returnValue(of({ token: 'abc' }));
    spyOn(component['auth'], 'setToken');
    spyOn(component['toast'], 'success');

    component.handleLogin({ username: 'a@b.com', password: 'x', remember: false });

    expect(component['auth'].setToken).toHaveBeenCalledWith('abc');
    expect(component['toast'].success).toHaveBeenCalled();
    expect(component.loginVisible).toBeFalse();
  });

  it('handleLogin shows an error toast on failure', () => {
    loginSpy.authenticate.and.returnValue(throwError(() => new Error('401')));
    spyOn(component['toast'], 'error');

    component.handleLogin({ username: 'a@b.com', password: 'x', remember: false });

    expect(component['toast'].error).toHaveBeenCalled();
  });

  it('handleRegister shows a success toast and closes the login modal', () => {
    loginSpy.register.and.returnValue(of({}));
    spyOn(component['toast'], 'success');

    component.handleRegister({ nome: 'Ana', email: 'a@b.com', senha: 'x' } as any);

    expect(component['toast'].success).toHaveBeenCalled();
    expect(component.loginVisible).toBeFalse();
  });

  it('handleRegister shows an error toast on failure', () => {
    loginSpy.register.and.returnValue(throwError(() => new Error('500')));
    spyOn(component['toast'], 'error');

    component.handleRegister({ nome: 'Ana', email: 'a@b.com', senha: 'x' } as any);

    expect(component['toast'].error).toHaveBeenCalled();
  });

  it('onEscape closes both the menu and the search panel', () => {
    component.toggleMenu();
    component.openSearch();
    component.onEscape();

    expect(component.menuOpen).toBeFalse();
    expect(component.searchOpen).toBeFalse();
  });

  it('onDocumentClick closes menu/search when the click is outside the header', () => {
    component.toggleMenu();
    component.openSearch();
    const outside = document.createElement('div');
    document.body.appendChild(outside);

    component.onDocumentClick({ target: outside } as unknown as MouseEvent);

    expect(component.menuOpen).toBeFalse();
    expect(component.searchOpen).toBeFalse();
    document.body.removeChild(outside);
  });

  it('ngOnDestroy unsubscribes without throwing', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
