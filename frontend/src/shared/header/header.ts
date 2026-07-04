import { Component, AfterViewInit, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { of, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Login } from '../../components/login/login';
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

interface LoginResponse {
  token: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, Login],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit, AfterViewInit, OnDestroy {
  router = inject(Router);
  private readonly loginService = inject(LoginService);
  private readonly auth = inject(AuthService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly toast = inject(ToastService);
  private readonly movies = inject(MovieService);
  private readonly history = inject(SearchHistoryService);
  private readonly shortcuts = inject(ShortcutsService);
  private readonly surprise = inject(SurpriseService);
  themeService = inject(ThemeService);

  scrolled     = false;
  hidden       = false;
  loginVisible = false;
  menuOpen     = false;
  user: AuthUser | null = null;

  searchOpen    = false;
  searchTerm    = '';
  searchResults: FilmeModel[] = [];
  searchLoading = false;
  searchHistory: string[] = [];

  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  private lastScrollTop = 0;
  private readonly SCROLL_THRESHOLD = 40;
  private readonly HIDE_THRESHOLD   = 80;
  private scrollHandler!: () => void;
  private userSub?: Subscription;
  private searchSub?: Subscription;
  private historySub?: Subscription;
  private focusSub?: Subscription;
  private readonly searchInput$ = new Subject<string>();

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    const inside = this.host.nativeElement.contains(e.target as Node);
    if (!inside) {
      if (this.menuOpen)   this.closeMenu();
      if (this.searchOpen) this.closeSearch();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() { this.closeMenu(); this.closeSearch(); }

  ngOnInit() {
    this.userSub = this.auth.user$.subscribe(u => (this.user = u));
    this.historySub = this.history.history$.subscribe(h => (this.searchHistory = h));
    this.focusSub = this.shortcuts.searchFocusRequest$.subscribe(() => {
      this.openSearch();
      setTimeout(() => this.searchInputRef?.nativeElement.focus(), 0);
    });

    this.searchSub = this.searchInput$.pipe(
      debounceTime(180),
      distinctUntilChanged(),
      switchMap(q => {
        const term = q.trim().toLowerCase();
        if (term) {
          this.searchLoading = true;
          return this.movies.getAllMovies();
        }
        this.searchLoading = false;
        this.searchResults = [];
        return of([] as FilmeModel[]);
      })
    ).subscribe((all: FilmeModel[]) => {
      const term = this.searchTerm.trim().toLowerCase();
      this.searchResults = term ? all
        .filter(m => m.titulo.toLowerCase().includes(term) || m.genero?.toLowerCase().includes(term))
        .slice(0, 6) : [];
      this.searchLoading = false;
    });
  }

  ngAfterViewInit() {
    const sc = document.getElementById('scroll-container');
    if (sc) {
      this.scrollHandler = () => this.onScroll({ scrollTop: sc.scrollTop });
      sc.addEventListener('scroll', this.scrollHandler, { passive: true });
    }
  }

  ngOnDestroy() {
    const sc = document.getElementById('scroll-container');
    if (sc && this.scrollHandler) {
      sc.removeEventListener('scroll', this.scrollHandler);
    }
    this.userSub?.unsubscribe();
    this.searchSub?.unsubscribe();
    this.historySub?.unsubscribe();
    this.focusSub?.unsubscribe();
  }

  onScroll(event: { scrollTop: number }) {
    const st = event.scrollTop;
    this.scrolled = st > this.SCROLL_THRESHOLD;

    if (st > this.lastScrollTop && st > this.HIDE_THRESHOLD) {
      this.hidden = true;
    } else if (st < this.lastScrollTop) {
      this.hidden = false;
    }
    this.lastScrollTop = st;
  }

  openLogin()  { this.loginVisible = true; }
  closeLogin() { this.loginVisible = false; }

  openSurprise()  { this.surprise.open(); }

  toggleMenu() { this.menuOpen = !this.menuOpen; }
  closeMenu()  { this.menuOpen = false; }

  openSearch() { this.searchOpen = true; }
  closeSearch() {
    this.searchOpen = false;
    this.searchTerm = '';
    this.searchResults = [];
  }

  onSearchInput(value: string) {
    this.searchTerm = value;
    this.searchInput$.next(value);
  }

  pickResult(film: FilmeModel) {
    this.history.push(this.searchTerm || film.titulo);
    this.closeSearch();
    this.router.navigate(['/movie', film.id]);
  }

  pickHistory(term: string) {
    this.searchTerm = term;
    this.searchInput$.next(term);
    setTimeout(() => this.searchInputRef?.nativeElement.focus(), 0);
  }

  removeHistory(term: string, event: Event) {
    event.stopPropagation();
    this.history.remove(term);
  }

  clearHistory(event: Event) {
    event.stopPropagation();
    this.history.clear();
  }

  submitSearch() {
    const term = this.searchTerm.trim();
    if (!term) return;
    this.history.push(term);
    this.closeSearch();
    this.router.navigate([''], { queryParams: { q: term } });
  }

  goTo(path: string) {
    this.closeMenu();
    this.router.navigate([path]);
  }

  logout() {
    this.auth.logout();
    this.closeMenu();
    this.router.navigate(['']);
  }

  get initials(): string {
    if (!this.user?.nome) return '?';
    const parts = this.user.nome.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last  = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
    return (first + last).toUpperCase() || '?';
  }

  handleLogin(event: { username: string; password: string; remember: boolean }) {
    this.loginService.authenticate(event.username, event.password).subscribe({
      next: (res: LoginResponse) => {
        this.auth.setToken(res.token);
        this.closeLogin();
        this.toast.success(`Bem-vindo de volta, ${this.auth.user?.nome ?? ''}!`, 'Login realizado');
      },
      error: () => this.toast.error('Credenciais inválidas. Tente novamente.', 'Falha no login')
    });
  }

  handleRegister(event: RegisterModel) {
    this.loginService.register(event).subscribe({
      next: () => {
        this.closeLogin();
        this.toast.success('Conta criada com sucesso! Faça login para continuar.', 'Bem-vindo!');
      },
      error: () => this.toast.error('Não foi possível concluir o registro.', 'Falha')
    });
  }
}
