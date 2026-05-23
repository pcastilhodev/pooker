# Looker — 8 Features Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 high-value frontend-only features to Looker Film (Angular 20, standalone components) with zero backend changes.

**Architecture:** All state lives in localStorage via a shared `PreferenceStore`. Features are standalone Angular services + components that compose onto the existing `Dashboard`, `Movie`, `MovieCard`, and `Header` components. TMDB API (v3) is called directly from the Angular `TmdbService` for trailer data.

**Tech Stack:** Angular 20 standalone, RxJS BehaviorSubject, Jasmine/Karma, SCSS custom properties, localStorage, TMDB API v3

**Parallel execution map:**
- Task 1 (Infra): sequential — everything depends on it
- Task 2 (Dark Mode): sequential — modifies global styles.scss
- Tasks 3, 4: parallel — different files (Task 3: dashboard only; Task 4: new files only)
- Tasks 5, 6, 7: parallel after Task 4 — different files (movie, new service+section, new service+section)
- Tasks 8, 9: sequential — both touch MovieCard (run Task 8 first, Task 9 extends it)

---

## File Map

### New files
| File | Responsibility |
|------|---------------|
| `src/environments/environment.ts` | TMDB API key constant |
| `src/services/preference-store.ts` | Typed localStorage wrapper |
| `src/services/theme-service.ts` | Dark/light toggle |
| `src/services/view-mode-service.ts` | Grid/list preference |
| `src/services/filter-service.ts` | Client-side film filtering |
| `src/services/tmdb-service.ts` | TMDB trailer lookup |
| `src/services/trending-service.ts` | Film ranking from inventory data |
| `src/services/recommendation-service.ts` | Genre-based recommendations |
| `src/services/collections-service.ts` | User playlists (localStorage) |
| `src/services/compare-service.ts` | Film comparison (sessionStorage) |
| `src/shared/filter-panel/filter-panel.ts` | Filter UI component |
| `src/shared/filter-panel/filter-panel.html` | Filter UI template |
| `src/shared/filter-panel/filter-panel.css` | Filter UI styles |
| `src/shared/trending-section/trending-section.ts` | Trending row component |
| `src/shared/trending-section/trending-section.html` | Trending row template |
| `src/shared/trending-section/trending-section.css` | Trending row styles |
| `src/shared/recommendations-section/recommendations-section.ts` | Recommendations row component |
| `src/shared/recommendations-section/recommendations-section.html` | Recommendations row template |
| `src/shared/recommendations-section/recommendations-section.css` | Recommendations row styles |
| `src/shared/compare-bar/compare-bar.ts` | Floating compare bar |
| `src/shared/compare-bar/compare-bar.html` | Compare bar template |
| `src/shared/compare-bar/compare-bar.css` | Compare bar styles |
| `src/components/collections/collections.ts` | Collections list page |
| `src/components/collections/collections.html` | Collections list template |
| `src/components/collections/collections.css` | Collections list styles |
| `src/components/compare/compare.ts` | Side-by-side comparison page |
| `src/components/compare/compare.html` | Comparison template |
| `src/components/compare/compare.css` | Comparison styles |
| `src/services/preference-store.spec.ts` | PreferenceStore tests |
| `src/services/theme-service.spec.ts` | ThemeService tests |
| `src/services/view-mode-service.spec.ts` | ViewModeService tests |
| `src/services/filter-service.spec.ts` | FilterService tests |
| `src/services/tmdb-service.spec.ts` | TmdbService tests |
| `src/services/trending-service.spec.ts` | TrendingService tests |
| `src/services/recommendation-service.spec.ts` | RecommendationService tests |
| `src/services/collections-service.spec.ts` | CollectionsService tests |
| `src/services/compare-service.spec.ts` | CompareService tests |

### Modified files
| File | Changes |
|------|---------|
| `src/styles.scss` | Add `[data-theme="light"]` overrides for CSS custom properties |
| `src/shared/header/header.ts` | Add `ThemeService` injection + `toggleTheme()` |
| `src/shared/header/header.html` | Add theme toggle button |
| `src/shared/header/header.css` | Style for theme toggle button |
| `src/components/dashboard/dashboard.ts` | Inject ViewModeService, FilterService, TrendingService, RecommendationService |
| `src/components/dashboard/dashboard.html` | Add filter panel, view mode buttons, trending section, recommendations section |
| `src/components/dashboard/dashboard.css` | Add list-view styles |
| `src/components/movie/movie.ts` | Inject TmdbService, add trailerKey$ |
| `src/components/movie/movie.html` | Add trailer section after hero |
| `src/shared/movie-card/movie-card.ts` | Add CollectionsService + CompareService injection, actions menu |
| `src/shared/movie-card/movie-card.html` | Add action buttons |
| `src/shared/movie-card/movie-card.css` | Style action buttons |
| `src/app/app.routes.ts` | Add /colecoes and /comparar routes |
| `src/app/app.ts` | Import CompareBarComponent |
| `src/app/app.html` | Add `<app-compare-bar>` |

---

## Task 1: Infrastructure — PreferenceStore + TmdbService + environment.ts

**Files:**
- Create: `src/environments/environment.ts`
- Create: `src/services/preference-store.ts`
- Create: `src/services/preference-store.spec.ts`
- Create: `src/services/tmdb-service.ts`
- Create: `src/services/tmdb-service.spec.ts`

- [ ] **Step 1: Create environment.ts**

```typescript
// src/environments/environment.ts
export const environment = {
  tmdbApiKey: '', // set your TMDB v3 API key here
};
```

- [ ] **Step 2: Write failing PreferenceStore test**

```typescript
// src/services/preference-store.spec.ts
import { PreferenceStore } from './preference-store';

describe('PreferenceStore', () => {
  let store: PreferenceStore;

  beforeEach(() => {
    localStorage.clear();
    store = new PreferenceStore();
  });

  it('returns default when key absent', () => {
    expect(store.get('x', 'def')).toBe('def');
  });

  it('persists and retrieves typed value', () => {
    store.set('theme', 'dark');
    expect(store.get('theme', 'light')).toBe('dark');
  });

  it('clear removes key', () => {
    store.set('k', 'v');
    store.clear('k');
    expect(store.get('k', 'fallback')).toBe('fallback');
  });
});
```

- [ ] **Step 3: Run test — expect FAIL**

```bash
cd frontend && ng test --include="src/services/preference-store.spec.ts" --watch=false --browsers=ChromeHeadless
```
Expected: `Cannot find module './preference-store'`

- [ ] **Step 4: Implement PreferenceStore**

```typescript
// src/services/preference-store.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PreferenceStore {
  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* storage full — ignore */ }
  }

  clear(key: string): void {
    localStorage.removeItem(key);
  }
}
```

- [ ] **Step 5: Write failing TmdbService test**

```typescript
// src/services/tmdb-service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TmdbService } from './tmdb-service';

describe('TmdbService', () => {
  let service: TmdbService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TmdbService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { httpMock.verify(); });

  it('getTrailerKey returns YouTube key from TMDB response', () => {
    let result: string | null = undefined!;
    service.getTrailerKey('Inception').subscribe(k => (result = k));

    const searchReq = httpMock.expectOne(r => r.url.includes('search/movie'));
    searchReq.flush({ results: [{ id: 27205 }] });

    const videoReq = httpMock.expectOne(r => r.url.includes('27205/videos'));
    videoReq.flush({ results: [{ type: 'Trailer', site: 'YouTube', key: 'abc123' }] });

    expect(result).toBe('abc123');
  });

  it('getTrailerKey returns null when no results', () => {
    let result: string | null = undefined!;
    service.getTrailerKey('Unknown Film XYZ').subscribe(k => (result = k));

    httpMock.expectOne(r => r.url.includes('search/movie')).flush({ results: [] });

    expect(result).toBeNull();
  });
});
```

- [ ] **Step 6: Implement TmdbService**

```typescript
// src/services/tmdb-service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, map, catchError } from 'rxjs';
import { environment } from '../environments/environment';

const BASE = 'https://api.themoviedb.org/3';

@Injectable({ providedIn: 'root' })
export class TmdbService {
  private cache = new Map<string, string | null>();

  constructor(private http: HttpClient) {}

  getTrailerKey(titulo: string): Observable<string | null> {
    if (this.cache.has(titulo)) return of(this.cache.get(titulo)!);

    const key = environment.tmdbApiKey;
    return this.http
      .get<any>(`${BASE}/search/movie`, { params: { api_key: key, query: titulo, language: 'pt-BR' } })
      .pipe(
        switchMap(res => {
          const id = res.results?.[0]?.id;
          if (!id) return of(null);
          return this.http
            .get<any>(`${BASE}/movie/${id}/videos`, { params: { api_key: key } })
            .pipe(map(v => v.results?.find((r: any) => r.type === 'Trailer' && r.site === 'YouTube')?.key ?? null));
        }),
        catchError(() => of(null)),
        map(k => { this.cache.set(titulo, k); return k; })
      );
  }
}
```

- [ ] **Step 7: Run tests — expect PASS**

```bash
cd frontend && ng test --include="src/services/preference-store.spec.ts" --include="src/services/tmdb-service.spec.ts" --watch=false --browsers=ChromeHeadless
```
Expected: 5 specs, 0 failures

- [ ] **Step 8: Commit**

```bash
cd frontend && git add src/environments/environment.ts src/services/preference-store.ts src/services/preference-store.spec.ts src/services/tmdb-service.ts src/services/tmdb-service.spec.ts && git commit -m "feat: add PreferenceStore, TmdbService and environment"
```

---

## Task 2: Dark Mode

**Files:**
- Create: `src/services/theme-service.ts`
- Create: `src/services/theme-service.spec.ts`
- Modify: `src/styles.scss`
- Modify: `src/shared/header/header.ts`
- Modify: `src/shared/header/header.html`
- Modify: `src/shared/header/header.css`

- [ ] **Step 1: Write failing ThemeService test**

```typescript
// src/services/theme-service.spec.ts
import { ThemeService } from './theme-service';
import { PreferenceStore } from './preference-store';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    service = new ThemeService(new PreferenceStore());
  });

  it('defaults to dark', () => {
    expect(service.theme).toBe('dark');
  });

  it('toggle switches to light and sets attribute', () => {
    service.toggle();
    expect(service.theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('toggle back returns to dark', () => {
    service.toggle();
    service.toggle();
    expect(service.theme).toBe('dark');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd frontend && ng test --include="src/services/theme-service.spec.ts" --watch=false --browsers=ChromeHeadless
```
Expected: `Cannot find module './theme-service'`

- [ ] **Step 3: Implement ThemeService**

```typescript
// src/services/theme-service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PreferenceStore } from './preference-store';

type Theme = 'dark' | 'light';
const KEY = 'looker:theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private theme$ = new BehaviorSubject<Theme>(this.store.get<Theme>(KEY, 'dark'));

  constructor(private store: PreferenceStore) {
    this.apply(this.theme$.value);
  }

  get theme(): Theme { return this.theme$.value; }
  get theme$Obs() { return this.theme$.asObservable(); }

  toggle(): void {
    const next: Theme = this.theme$.value === 'dark' ? 'light' : 'dark';
    this.theme$.next(next);
    this.store.set(KEY, next);
    this.apply(next);
  }

  private apply(t: Theme): void {
    document.documentElement.setAttribute('data-theme', t);
  }
}
```

- [ ] **Step 4: Add light theme to styles.scss**

Append to `src/styles.scss` after the existing `:root` block:

```scss
/* ====== Light theme overrides ====== */
[data-theme="light"] {
  --bg:          #f0eff5;
  --bg-elev:     #e8e7f0;
  --card:        #ffffff;
  --border:      rgba(0, 0, 0, 0.08);
  --fg:          #0d0c1a;
  --muted:       #6a6880;
}
```

- [ ] **Step 5: Add toggle button to header**

Replace `src/shared/header/header.ts` (full file):

```typescript
import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Login } from '../../components/login/login';
import { LoginService } from '../../services/login-service';
import { ThemeService } from '../../services/theme-service';
import { RegisterModel } from '../../models/register-model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, Login],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements AfterViewInit, OnDestroy {
  scrolled     = false;
  hidden       = false;
  loginVisible = false;

  private lastScrollTop = 0;
  private readonly SCROLL_THRESHOLD = 40;
  private readonly HIDE_THRESHOLD   = 80;
  private scrollHandler!: () => void;

  constructor(
    public router: Router,
    private loginService: LoginService,
    public themeService: ThemeService
  ) {}

  ngAfterViewInit() {
    const sc = document.getElementById('scroll-container');
    if (sc) {
      this.scrollHandler = () => this.onScroll({ scrollTop: sc.scrollTop });
      sc.addEventListener('scroll', this.scrollHandler, { passive: true });
    }
  }

  ngOnDestroy() {
    const sc = document.getElementById('scroll-container');
    if (sc && this.scrollHandler) sc.removeEventListener('scroll', this.scrollHandler);
  }

  onScroll(event: { scrollTop: number }) {
    const st = event.scrollTop;
    this.scrolled = st > this.SCROLL_THRESHOLD;
    if (st > this.lastScrollTop && st > this.HIDE_THRESHOLD) this.hidden = true;
    else if (st < this.lastScrollTop) this.hidden = false;
    this.lastScrollTop = st;
  }

  openLogin()  { this.loginVisible = true; }
  closeLogin() { this.loginVisible = false; }

  handleLogin(event: { username: string; password: string; remember: boolean }) {
    this.loginService.authenticate(event.username, event.password).subscribe({
      next: (res: any) => { localStorage.setItem('jwt', String(res.token)); this.closeLogin(); },
      error: () => alert('Falha no login, tente novamente.')
    });
  }

  handleRegister(event: RegisterModel) {
    this.loginService.register(event).subscribe({
      next: () => { alert('Registro concluído!'); this.closeLogin(); },
      error: () => alert('Falha no registro.')
    });
  }
}
```

Replace `src/shared/header/header.html`:

```html
<nav [class.scrolled]="scrolled" [class.hidden]="hidden">
  <div class="nav-logo" (click)="router.navigate([''])">LOOKER</div>
  <div class="nav-right">
    <a routerLink="/" class="nav-link">Filmes</a>
    <button class="nav-theme" (click)="themeService.toggle()" [title]="themeService.theme === 'dark' ? 'Modo claro' : 'Modo escuro'">
      {{ themeService.theme === 'dark' ? '☀️' : '🌙' }}
    </button>
    <button class="nav-enter" (click)="openLogin()">Entrar</button>
  </div>
</nav>

<app-login
  *ngIf="loginVisible"
  [startVisible]="true"
  (loginSubmit)="handleLogin($event)"
  (registerSubmit)="handleRegister($event)"
  (closed)="closeLogin()">
</app-login>
```

Append to `src/shared/header/header.css`:

```css
.nav-theme {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 16px;
  color: var(--fg);
  transition: border-color 0.2s;
}
.nav-theme:hover { border-color: var(--primary); }
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd frontend && ng test --include="src/services/theme-service.spec.ts" --watch=false --browsers=ChromeHeadless
```
Expected: 3 specs, 0 failures

- [ ] **Step 7: Commit**

```bash
cd frontend && git add src/services/theme-service.ts src/services/theme-service.spec.ts src/styles.scss src/shared/header/ && git commit -m "feat: dark/light mode toggle"
```

---

## Task 3: Grid / Lista Toggle + Filtros Avançados (Dashboard)

**Files:**
- Create: `src/services/view-mode-service.ts`
- Create: `src/services/view-mode-service.spec.ts`
- Create: `src/services/filter-service.ts`
- Create: `src/services/filter-service.spec.ts`
- Create: `src/shared/filter-panel/filter-panel.ts`
- Create: `src/shared/filter-panel/filter-panel.html`
- Create: `src/shared/filter-panel/filter-panel.css`
- Modify: `src/components/dashboard/dashboard.ts`
- Modify: `src/components/dashboard/dashboard.html`
- Modify: `src/components/dashboard/dashboard.css`

- [ ] **Step 1: Write failing ViewModeService test**

```typescript
// src/services/view-mode-service.spec.ts
import { ViewModeService } from './view-mode-service';
import { PreferenceStore } from './preference-store';

describe('ViewModeService', () => {
  let service: ViewModeService;

  beforeEach(() => {
    localStorage.clear();
    service = new ViewModeService(new PreferenceStore());
  });

  it('defaults to grid', () => {
    expect(service.mode).toBe('grid');
  });

  it('toggle switches to list', () => {
    service.toggle();
    expect(service.mode).toBe('list');
  });

  it('setMode persists preference', () => {
    service.setMode('list');
    const service2 = new ViewModeService(new PreferenceStore());
    expect(service2.mode).toBe('list');
  });
});
```

- [ ] **Step 2: Write failing FilterService test**

```typescript
// src/services/filter-service.spec.ts
import { FilterService } from './filter-service';
import { FilmeModel } from '../models/filme-model';

const makeFilm = (overrides: Partial<FilmeModel>): FilmeModel => ({
  id: 1, titulo: 'Test', genero: 'Ação', ano: new Date('2020-01-01'),
  preco_aluguel: 10, sinopse: '', imagem_url: '', duracao_minutos: 120,
  classificacao_indicativa: '12', data_lancamento: new Date('2020-01-01'),
  total_copias: 5, diretor: 'Dir', copias_disponiveis: 3, ...overrides
});

describe('FilterService', () => {
  let service: FilterService;
  const films: FilmeModel[] = [
    makeFilm({ id: 1, genero: 'Ação', preco_aluguel: 10, duracao_minutos: 90,  ano: new Date('2020-01-01'), copias_disponiveis: 3 }),
    makeFilm({ id: 2, genero: 'Drama', preco_aluguel: 20, duracao_minutos: 150, ano: new Date('2015-01-01'), copias_disponiveis: 0 }),
  ];

  beforeEach(() => { service = new FilterService(); });

  it('empty filters return all films', () => {
    expect(service.apply(films, service.empty())).toEqual(films);
  });

  it('genre filter returns matching films', () => {
    const result = service.apply(films, { ...service.empty(), generos: ['Ação'] });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });

  it('disponivel filter excludes films with 0 copies', () => {
    const result = service.apply(films, { ...service.empty(), apenasDisponivel: true });
    expect(result.every(f => f.copias_disponiveis > 0)).toBeTrue();
  });

  it('maxPreco filter excludes expensive films', () => {
    const result = service.apply(films, { ...service.empty(), maxPreco: 15 });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
cd frontend && ng test --include="src/services/view-mode-service.spec.ts" --include="src/services/filter-service.spec.ts" --watch=false --browsers=ChromeHeadless
```
Expected: `Cannot find module`

- [ ] **Step 4: Implement ViewModeService**

```typescript
// src/services/view-mode-service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PreferenceStore } from './preference-store';

export type ViewMode = 'grid' | 'list';
const KEY = 'looker:view-mode';

@Injectable({ providedIn: 'root' })
export class ViewModeService {
  private mode$ = new BehaviorSubject<ViewMode>(this.store.get<ViewMode>(KEY, 'grid'));

  constructor(private store: PreferenceStore) {}

  get mode(): ViewMode { return this.mode$.value; }
  get mode$Obs() { return this.mode$.asObservable(); }

  setMode(m: ViewMode): void { this.mode$.next(m); this.store.set(KEY, m); }
  toggle(): void { this.setMode(this.mode === 'grid' ? 'list' : 'grid'); }
}
```

- [ ] **Step 5: Implement FilterService**

```typescript
// src/services/filter-service.ts
import { Injectable } from '@angular/core';
import { FilmeModel } from '../models/filme-model';

export interface FilmFilters {
  generos: string[];
  minAno: number;
  maxAno: number;
  minPreco: number;
  maxPreco: number;
  minDuracao: number;
  maxDuracao: number;
  apenasDisponivel: boolean;
}

@Injectable({ providedIn: 'root' })
export class FilterService {
  empty(): FilmFilters {
    return { generos: [], minAno: 0, maxAno: 9999, minPreco: 0, maxPreco: 9999, minDuracao: 0, maxDuracao: 9999, apenasDisponivel: false };
  }

  apply(films: FilmeModel[], f: FilmFilters): FilmeModel[] {
    return films.filter(m => {
      const ano = m.ano instanceof Date ? m.ano.getFullYear() : new Date(m.ano).getFullYear();
      if (f.generos.length && !f.generos.includes(m.genero)) return false;
      if (ano < f.minAno || ano > f.maxAno) return false;
      if (m.preco_aluguel < f.minPreco || m.preco_aluguel > f.maxPreco) return false;
      if ((m.duracao_minutos ?? 0) < f.minDuracao || (m.duracao_minutos ?? 0) > f.maxDuracao) return false;
      if (f.apenasDisponivel && m.copias_disponiveis <= 0) return false;
      return true;
    });
  }

  extractGenres(films: FilmeModel[]): string[] {
    return [...new Set(films.map(m => m.genero))].sort();
  }

  bounds(films: FilmeModel[]): { minAno: number; maxAno: number; maxPreco: number; maxDuracao: number } {
    const anos = films.map(m => m.ano instanceof Date ? m.ano.getFullYear() : new Date(m.ano).getFullYear());
    return {
      minAno: Math.min(...anos),
      maxAno: Math.max(...anos),
      maxPreco: Math.max(...films.map(m => m.preco_aluguel)),
      maxDuracao: Math.max(...films.map(m => m.duracao_minutos ?? 0)),
    };
  }
}
```

- [ ] **Step 6: Create FilterPanelComponent**

```typescript
// src/shared/filter-panel/filter-panel.ts
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilmeModel } from '../../models/filme-model';
import { FilterService, FilmFilters } from '../../services/filter-service';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.css'
})
export class FilterPanel implements OnChanges {
  @Input() films: FilmeModel[] = [];
  @Output() filtersChange = new EventEmitter<FilmFilters>();

  genres: string[] = [];
  filters!: FilmFilters;
  bounds = { minAno: 2000, maxAno: 2025, maxPreco: 50, maxDuracao: 240 };
  open = false;

  constructor(private filterService: FilterService) {
    this.filters = this.filterService.empty();
  }

  ngOnChanges() {
    if (!this.films.length) return;
    this.genres = this.filterService.extractGenres(this.films);
    this.bounds = this.filterService.bounds(this.films);
    if (!this.filters.maxAno || this.filters.maxAno === 9999) {
      this.filters = { ...this.filterService.empty(), maxAno: this.bounds.maxAno, minAno: this.bounds.minAno, maxPreco: this.bounds.maxPreco, maxDuracao: this.bounds.maxDuracao };
    }
  }

  toggleGenre(g: string) {
    const idx = this.filters.generos.indexOf(g);
    this.filters = { ...this.filters, generos: idx >= 0 ? this.filters.generos.filter(x => x !== g) : [...this.filters.generos, g] };
    this.emit();
  }

  emit() { this.filtersChange.emit({ ...this.filters }); }

  get activeCount(): number {
    let n = this.filters.generos.length;
    if (this.filters.apenasDisponivel) n++;
    if (this.filters.maxPreco < this.bounds.maxPreco) n++;
    return n;
  }

  reset() {
    this.filters = { ...this.filterService.empty(), maxAno: this.bounds.maxAno, minAno: this.bounds.minAno, maxPreco: this.bounds.maxPreco, maxDuracao: this.bounds.maxDuracao };
    this.emit();
  }
}
```

```html
<!-- src/shared/filter-panel/filter-panel.html -->
<div class="filter-bar">
  <button class="filter-toggle" (click)="open = !open">
    Filtros {{ activeCount > 0 ? '(' + activeCount + ')' : '' }}
  </button>
  <button *ngIf="activeCount > 0" class="filter-reset" (click)="reset()">Limpar</button>
</div>

<div class="filter-panel" *ngIf="open">
  <div class="filter-group">
    <div class="filter-label">Gênero</div>
    <div class="genre-chips">
      <button *ngFor="let g of genres"
              class="chip"
              [class.active]="filters.generos.includes(g)"
              (click)="toggleGenre(g)">{{ g }}</button>
    </div>
  </div>

  <div class="filter-group">
    <div class="filter-label">Preço máximo — R$ {{ filters.maxPreco | number:'1.0-0' }}</div>
    <input type="range" [min]="0" [max]="bounds.maxPreco" step="1"
           [(ngModel)]="filters.maxPreco" (change)="emit()" />
  </div>

  <div class="filter-group">
    <label class="filter-check">
      <input type="checkbox" [(ngModel)]="filters.apenasDisponivel" (change)="emit()" />
      Apenas disponíveis agora
    </label>
  </div>
</div>
```

```css
/* src/shared/filter-panel/filter-panel.css */
.filter-bar { display: flex; gap: 8px; align-items: center; margin-bottom: 16px; }

.filter-toggle {
  font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  background: none; border: 1px solid var(--border); border-radius: 4px;
  padding: 6px 14px; color: var(--fg); cursor: pointer; transition: border-color 0.2s;
}
.filter-toggle:hover { border-color: var(--primary); }

.filter-reset { font-size: 11px; color: var(--muted); background: none; border: none; cursor: pointer; padding: 4px 8px; }
.filter-reset:hover { color: var(--primary); }

.filter-panel {
  background: var(--card); border: 1px solid var(--border); border-radius: 8px;
  padding: 20px 24px; margin-bottom: 24px; display: flex; gap: 32px; flex-wrap: wrap;
}
.filter-group { display: flex; flex-direction: column; gap: 10px; }
.filter-label { font-size: 10px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); }

.genre-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  font-size: 11px; padding: 4px 12px; border-radius: 999px;
  border: 1px solid var(--border); background: none; color: var(--fg); cursor: pointer; transition: all 0.15s;
}
.chip.active { background: var(--primary); border-color: var(--primary); color: #fff; }

input[type="range"] { width: 180px; accent-color: var(--primary); }

.filter-check { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; color: var(--fg); }
```

- [ ] **Step 7: Update dashboard to use ViewMode + FilterPanel**

Replace `src/components/dashboard/dashboard.ts` with:

```typescript
import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChildren, QueryList, ElementRef, NgZone, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FilmeModel } from '../../models/filme-model';
import { MovieService } from '../../services/movie-service';
import { ViewModeService } from '../../services/view-mode-service';
import { FilterService, FilmFilters } from '../../services/filter-service';
import { FilmSnapSection } from '../../shared/film-snap-section/film-snap-section';
import { FilmIntro } from '../../shared/film-intro/film-intro';
import { MovieCard } from '../../shared/movie-card/movie-card';
import { ScrollRevealSection } from '../../shared/scroll-reveal-section/scroll-reveal-section';
import { FilterPanel } from '../../shared/filter-panel/filter-panel';

const MAX_SNAP = 6;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FilmSnapSection, FilmIntro, MovieCard, ScrollRevealSection, FilterPanel],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  allFilms: FilmeModel[]    = [];
  films: FilmeModel[]       = [];
  snapFilms: FilmeModel[]   = [];
  currentIndex              = 0;
  showIntro                 = true;
  navVisible                = false;
  activeFilters!: FilmFilters;

  @ViewChild('scrollContainer') scrollContainerRef!: ElementRef<HTMLElement>;
  @ViewChildren(FilmSnapSection) snapSections!: QueryList<FilmSnapSection>;

  private subs       = new Subscription();
  private ctx:         gsap.Context | undefined;
  private wheelTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private movieService: MovieService,
    private router:       Router,
    private route:        ActivatedRoute,
    private zone:         NgZone,
    public  viewMode:     ViewModeService,
    private filterService: FilterService
  ) {
    this.activeFilters = this.filterService.empty();
  }

  ngOnInit() {
    this.loadMovies();
    if (this.router.events) {
      this.subs.add(
        this.router.events
          .pipe(filter(e => e instanceof NavigationEnd))
          .subscribe(() => this.loadMovies())
      );
    }
  }

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      this.ctx = gsap.context(() => { ScrollTrigger.refresh(); });
    });
  }

  loadMovies() {
    this.movieService.getAllMovies().subscribe((data: FilmeModel[]) => {
      const q = this.route.snapshot.queryParams['q'];
      this.allFilms = q ? data.filter(m => m.titulo.toLowerCase().includes(q.toLowerCase())) : data;
      this.applyFilters();
      this.snapFilms = this.allFilms.slice(0, MAX_SNAP);
    });
  }

  onFiltersChange(f: FilmFilters) {
    this.activeFilters = f;
    this.applyFilters();
  }

  private applyFilters() {
    this.films = this.filterService.apply(this.allFilms, this.activeFilters);
  }

  onIntroDismissed() {
    this.showIntro  = false;
    this.navVisible = true;
    setTimeout(() => { this.snapSections?.toArray()?.[0]?.animate(); }, 50);
  }

  snapToSection(index: number) {
    const max = this.snapFilms.length - 1;
    if (index < 0) index = 0;
    if (index > max) index = max;
    if (index === this.currentIndex) return;
    const sections = this.snapSections?.toArray();
    sections?.[this.currentIndex]?.leave();
    this.currentIndex = index;
    const sc = this.scrollContainerRef?.nativeElement;
    if (sc) sc.scrollTo({ top: index * window.innerHeight, behavior: 'smooth' });
    setTimeout(() => sections?.[index]?.animate(), 300);
  }

  onWheel(e: WheelEvent) {
    e.preventDefault();
    clearTimeout(this.wheelTimer);
    this.wheelTimer = setTimeout(() => {
      const dir = e.deltaY > 0 ? 1 : -1;
      if (this.currentIndex < this.snapFilms.length - 1 || dir < 0) {
        this.snapToSection(this.currentIndex + dir);
      } else {
        this.scrollContainerRef?.nativeElement.scrollBy({ top: e.deltaY * 3, behavior: 'smooth' });
      }
    }, 40);
  }

  get counterLabel() {
    return `${String(this.currentIndex + 1).padStart(2, '0')} / ${String(this.snapFilms.length).padStart(2, '0')}`;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.ctx?.revert();
    clearTimeout(this.wheelTimer);
  }
}
```

Replace `src/components/dashboard/dashboard.html`:

```html
<app-film-intro *ngIf="showIntro" (dismissed)="onIntroDismissed()"></app-film-intro>

<div id="scroll-container" #scrollContainer (wheel)="onWheel($event)">

  <!-- SNAP SECTIONS -->
  <div id="films-container">
    <app-film-snap-section
      *ngFor="let film of snapFilms; let i = index"
      [film]="film" [index]="i" scroller="#scroll-container">
    </app-film-snap-section>
  </div>

  <!-- BROWSE GRID -->
  <div class="browse-section" id="browseSection">
    <div class="browse-sub">Catálogo completo</div>
    <div class="browse-title-row">
      <div class="browse-title">TODOS OS FILMES</div>
      <div class="view-toggle">
        <button [class.active]="viewMode.mode === 'grid'" (click)="viewMode.setMode('grid')" title="Grade">⊞</button>
        <button [class.active]="viewMode.mode === 'list'" (click)="viewMode.setMode('list')" title="Lista">☰</button>
      </div>
    </div>

    <app-filter-panel [films]="allFilms" (filtersChange)="onFiltersChange($event)"></app-filter-panel>

    <div *ngIf="films.length === 0" class="browse-empty">Nenhum filme encontrado para esses filtros.</div>

    <app-scroll-reveal-section>
      <div [class.browse-grid]="viewMode.mode === 'grid'" [class.browse-list]="viewMode.mode === 'list'">
        <app-movie-card *ngFor="let film of films" [film]="film"></app-movie-card>
      </div>
    </app-scroll-reveal-section>
  </div>
</div>

<!-- COUNTER -->
<div id="counter" [style.opacity]="navVisible ? '1' : '0'">
  <div class="counter-num">{{ counterLabel }}</div>
  <div class="counter-dots">
    <div *ngFor="let f of snapFilms; let i = index"
         class="counter-dot" [class.active]="i === currentIndex"
         (click)="snapToSection(i)"></div>
  </div>
</div>

<div id="scroll-hint" [style.opacity]="navVisible ? '1' : '0'" [class.hidden]="currentIndex > 1">
  <div class="scroll-line"></div>
  Rolar
</div>
```

Append to `src/components/dashboard/dashboard.css`:

```css
.browse-title-row { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 8px; }

.view-toggle { display: flex; gap: 4px; }
.view-toggle button {
  background: none; border: 1px solid var(--border); border-radius: 4px;
  padding: 6px 10px; cursor: pointer; color: var(--muted); font-size: 16px; transition: all 0.15s;
}
.view-toggle button.active { border-color: var(--primary); color: var(--primary); }

.browse-list { display: flex; flex-direction: column; gap: 8px; margin-top: 40px; }
.browse-list app-movie-card { display: block; }
.browse-empty { color: var(--muted); font-size: 14px; padding: 40px 0; }
```

- [ ] **Step 8: Run all tests**

```bash
cd frontend && ng test --include="src/services/view-mode-service.spec.ts" --include="src/services/filter-service.spec.ts" --watch=false --browsers=ChromeHeadless
```
Expected: 7 specs, 0 failures

- [ ] **Step 9: Commit**

```bash
cd frontend && git add src/services/view-mode-service.ts src/services/view-mode-service.spec.ts src/services/filter-service.ts src/services/filter-service.spec.ts src/shared/filter-panel/ src/components/dashboard/ && git commit -m "feat: grid/list toggle and advanced filters"
```

---

## Task 4: Trending & Recomendações (Dashboard sections)

> Can run in parallel with Tasks 5 (Trailer) after Task 3 is merged.

**Files:**
- Create: `src/services/trending-service.ts`
- Create: `src/services/trending-service.spec.ts`
- Create: `src/services/recommendation-service.ts`
- Create: `src/services/recommendation-service.spec.ts`
- Create: `src/shared/trending-section/trending-section.ts` + `.html` + `.css`
- Create: `src/shared/recommendations-section/recommendations-section.ts` + `.html` + `.css`
- Modify: `src/components/dashboard/dashboard.ts`
- Modify: `src/components/dashboard/dashboard.html`

- [ ] **Step 1: Write failing TrendingService test**

```typescript
// src/services/trending-service.spec.ts
import { TrendingService } from './trending-service';
import { FilmeModel } from '../models/filme-model';

const f = (id: number, total: number, disp: number, preco = 10, dur = 90): FilmeModel => ({
  id, titulo: `F${id}`, genero: 'Ação', ano: new Date('2020-01-01'), preco_aluguel: preco,
  sinopse: '', imagem_url: '', duracao_minutos: dur, classificacao_indicativa: '12',
  data_lancamento: new Date('2020-01-01'), total_copias: total, diretor: 'D', copias_disponiveis: disp
});

describe('TrendingService', () => {
  let service: TrendingService;

  beforeEach(() => { service = new TrendingService(); });

  it('ranks by rental rate descending', () => {
    const films = [f(1, 10, 8), f(2, 10, 2), f(3, 10, 5)];
    const result = service.topByRentalRate(films, 3);
    expect(result[0].id).toBe(2); // 80% rented
    expect(result[1].id).toBe(3); // 50% rented
  });

  it('topByPrice returns most expensive first', () => {
    const films = [f(1, 5, 3, 15), f(2, 5, 3, 25), f(3, 5, 3, 10)];
    const result = service.topByPrice(films, 3);
    expect(result[0].id).toBe(2);
  });

  it('respects limit', () => {
    const films = [f(1,10,5), f(2,10,3), f(3,10,1), f(4,10,8)];
    expect(service.topByRentalRate(films, 2).length).toBe(2);
  });
});
```

- [ ] **Step 2: Write failing RecommendationService test**

```typescript
// src/services/recommendation-service.spec.ts
import { RecommendationService } from './recommendation-service';
import { FilmeModel } from '../models/filme-model';

const f = (id: number, genero: string): FilmeModel => ({
  id, titulo: `F${id}`, genero, ano: new Date('2020-01-01'), preco_aluguel: 10,
  sinopse: '', imagem_url: '', duracao_minutos: 90, classificacao_indicativa: '12',
  data_lancamento: new Date('2020-01-01'), total_copias: 5, diretor: 'D', copias_disponiveis: 3
});

describe('RecommendationService', () => {
  let service: RecommendationService;

  beforeEach(() => { localStorage.clear(); service = new RecommendationService(); });

  it('returns empty array when no recent history', () => {
    const all = [f(1, 'Ação'), f(2, 'Drama')];
    expect(service.recommend(all, [])).toEqual([]);
  });

  it('recommends films matching genres of recently viewed', () => {
    const recent = [f(1, 'Ação')];
    const all = [f(1, 'Ação'), f(2, 'Ação'), f(3, 'Drama')];
    const result = service.recommend(all, recent);
    expect(result.find(m => m.id === 2)).toBeTruthy();
    expect(result.find(m => m.id === 1)).toBeFalsy(); // exclude source film
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

```bash
cd frontend && ng test --include="src/services/trending-service.spec.ts" --include="src/services/recommendation-service.spec.ts" --watch=false --browsers=ChromeHeadless
```

- [ ] **Step 4: Implement TrendingService**

```typescript
// src/services/trending-service.ts
import { Injectable } from '@angular/core';
import { FilmeModel } from '../models/filme-model';

@Injectable({ providedIn: 'root' })
export class TrendingService {
  topByRentalRate(films: FilmeModel[], limit: number): FilmeModel[] {
    return [...films]
      .filter(m => m.total_copias > 0)
      .sort((a, b) => this.rate(b) - this.rate(a))
      .slice(0, limit);
  }

  topByPrice(films: FilmeModel[], limit: number): FilmeModel[] {
    return [...films].sort((a, b) => b.preco_aluguel - a.preco_aluguel).slice(0, limit);
  }

  topByDuration(films: FilmeModel[], limit: number): FilmeModel[] {
    return [...films].sort((a, b) => (b.duracao_minutos ?? 0) - (a.duracao_minutos ?? 0)).slice(0, limit);
  }

  private rate(m: FilmeModel): number {
    return (m.total_copias - m.copias_disponiveis) / m.total_copias;
  }
}
```

- [ ] **Step 5: Implement RecommendationService**

```typescript
// src/services/recommendation-service.ts
import { Injectable } from '@angular/core';
import { FilmeModel } from '../models/filme-model';

const KEY = 'looker:recently-viewed';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  trackView(filmId: number): void {
    try {
      const ids: number[] = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      const next = [filmId, ...ids.filter(id => id !== filmId)].slice(0, 20);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch { /* ignore */ }
  }

  recentIds(): number[] {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
    catch { return []; }
  }

  recommend(all: FilmeModel[], recentFilms: FilmeModel[]): FilmeModel[] {
    if (!recentFilms.length) return [];
    const recentIds = new Set(recentFilms.map(m => m.id));
    const genreScore = new Map<string, number>();
    recentFilms.forEach(m => genreScore.set(m.genero, (genreScore.get(m.genero) ?? 0) + 1));
    return all
      .filter(m => !recentIds.has(m.id))
      .map(m => ({ film: m, score: genreScore.get(m.genero) ?? 0 }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(x => x.film);
  }
}
```

- [ ] **Step 6: Create TrendingSectionComponent**

```typescript
// src/shared/trending-section/trending-section.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FilmeModel } from '../../models/filme-model';
import { TrendingService } from '../../services/trending-service';

type TrendTab = 'rate' | 'price' | 'duration';

@Component({
  selector: 'app-trending-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trending-section.html',
  styleUrl: './trending-section.css'
})
export class TrendingSection {
  @Input() set films(val: FilmeModel[]) { this._films = val; this.refresh(); }
  private _films: FilmeModel[] = [];
  activeTab: TrendTab = 'rate';
  items: FilmeModel[] = [];

  constructor(private trending: TrendingService, private router: Router) {}

  setTab(t: TrendTab) { this.activeTab = t; this.refresh(); }

  private refresh() {
    const f = this._films;
    if (!f.length) return;
    this.items = this.activeTab === 'rate'     ? this.trending.topByRentalRate(f, 5)
               : this.activeTab === 'price'    ? this.trending.topByPrice(f, 5)
               :                                 this.trending.topByDuration(f, 5);
  }

  go(id: number) { this.router.navigate(['/movie', id]); }
}
```

```html
<!-- src/shared/trending-section/trending-section.html -->
<div class="trending-wrap" *ngIf="items.length">
  <div class="ts-header">
    <div class="ts-title">EM ALTA</div>
    <div class="ts-tabs">
      <button [class.active]="activeTab === 'rate'"     (click)="setTab('rate')">Mais Alugados</button>
      <button [class.active]="activeTab === 'price'"    (click)="setTab('price')">Premium</button>
      <button [class.active]="activeTab === 'duration'" (click)="setTab('duration')">Mais Longos</button>
    </div>
  </div>
  <div class="ts-row">
    <div class="ts-card" *ngFor="let film of items; let i = index" (click)="go(film.id)">
      <div class="ts-rank">{{ i + 1 }}</div>
      <div class="ts-poster">
        <img *ngIf="film.imagem_url" [src]="film.imagem_url" [alt]="film.titulo" />
      </div>
      <div class="ts-info">
        <div class="ts-name">{{ film.titulo }}</div>
        <div class="ts-meta">{{ film.genero }} · R$ {{ film.preco_aluguel.toFixed(2) }}</div>
      </div>
    </div>
  </div>
</div>
```

```css
/* src/shared/trending-section/trending-section.css */
.trending-wrap { padding: 60px 52px 0; }
.ts-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.ts-title { font-family: 'Bebas Neue', sans-serif; font-size: 36px; letter-spacing: 0.05em; color: var(--fg); }
.ts-tabs { display: flex; gap: 8px; }
.ts-tabs button {
  font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
  background: none; border: 1px solid var(--border); border-radius: 4px;
  padding: 5px 12px; color: var(--muted); cursor: pointer; transition: all 0.15s;
}
.ts-tabs button.active { border-color: var(--primary); color: var(--primary); }
.ts-row { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
.ts-card { display: flex; align-items: center; gap: 12px; min-width: 220px; cursor: pointer; padding: 10px; border-radius: 8px; background: var(--card); border: 1px solid var(--border); transition: border-color 0.2s; }
.ts-card:hover { border-color: var(--primary); }
.ts-rank { font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: var(--primary); min-width: 28px; }
.ts-poster { width: 40px; height: 60px; overflow: hidden; border-radius: 4px; background: var(--bg-elev); }
.ts-poster img { width: 100%; height: 100%; object-fit: cover; }
.ts-name { font-size: 13px; font-weight: 500; color: var(--fg); line-height: 1.3; }
.ts-meta { font-size: 11px; color: var(--muted); margin-top: 2px; }
```

- [ ] **Step 7: Create RecommendationsSectionComponent**

```typescript
// src/shared/recommendations-section/recommendations-section.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FilmeModel } from '../../models/filme-model';

@Component({
  selector: 'app-recommendations-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recommendations-section.html',
  styleUrl: './recommendations-section.css'
})
export class RecommendationsSection {
  @Input() films: FilmeModel[] = [];

  constructor(private router: Router) {}
  go(id: number) { this.router.navigate(['/movie', id]); }
}
```

```html
<!-- src/shared/recommendations-section/recommendations-section.html -->
<div class="rec-wrap" *ngIf="films.length">
  <div class="rec-title">RECOMENDADOS PARA VOCÊ</div>
  <div class="rec-row">
    <div class="rec-card" *ngFor="let film of films" (click)="go(film.id)">
      <div class="rec-poster">
        <img *ngIf="film.imagem_url" [src]="film.imagem_url" [alt]="film.titulo" />
      </div>
      <div class="rec-name">{{ film.titulo }}</div>
      <div class="rec-genre">{{ film.genero }}</div>
    </div>
  </div>
</div>
```

```css
/* src/shared/recommendations-section/recommendations-section.css */
.rec-wrap { padding: 40px 52px 0; }
.rec-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 0.05em; color: var(--fg); margin-bottom: 16px; }
.rec-row { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
.rec-card { min-width: 120px; cursor: pointer; }
.rec-card:hover .rec-poster { border-color: var(--primary); }
.rec-poster { width: 120px; height: 180px; overflow: hidden; border-radius: 6px; background: var(--card); border: 1px solid var(--border); transition: border-color 0.2s; margin-bottom: 8px; }
.rec-poster img { width: 100%; height: 100%; object-fit: cover; display: block; }
.rec-name { font-size: 12px; font-weight: 500; color: var(--fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
.rec-genre { font-size: 11px; color: var(--muted); }
```

- [ ] **Step 8: Wire into Dashboard**

Add to `dashboard.ts` imports: `TrendingSection`, `RecommendationsSection`, `TrendingService`, `RecommendationService`.

Add to constructor: `private trendingService: TrendingService, private recommendationService: RecommendationService`

Add property `recommendations: FilmeModel[] = [];`

Update `loadMovies()` — after `this.applyFilters()` add:

```typescript
const recentIds = this.recommendationService.recentIds();
const recentFilms = data.filter(m => recentIds.includes(m.id));
this.recommendations = this.recommendationService.recommend(data, recentFilms);
```

Add `TrendingSection` and `RecommendationsSection` to `imports` array in `@Component`.

In `dashboard.html`, add before the `<!-- BROWSE GRID -->` div:

```html
<app-trending-section [films]="allFilms"></app-trending-section>
<app-recommendations-section [films]="recommendations"></app-recommendations-section>
```

- [ ] **Step 9: Run tests**

```bash
cd frontend && ng test --include="src/services/trending-service.spec.ts" --include="src/services/recommendation-service.spec.ts" --watch=false --browsers=ChromeHeadless
```
Expected: 5 specs, 0 failures

- [ ] **Step 10: Commit**

```bash
cd frontend && git add src/services/trending-service.ts src/services/trending-service.spec.ts src/services/recommendation-service.ts src/services/recommendation-service.spec.ts src/shared/trending-section/ src/shared/recommendations-section/ src/components/dashboard/ && git commit -m "feat: trending sections and recommendations"
```

Also update `movie.ts` `ngOnInit` to call `recommendationService.trackView(id)` after loading the film. Add `RecommendationService` to `movie.ts` constructor:

```typescript
// in Movie.ngOnInit, after this.film = data as FilmeModel:
this.recommendationService.trackView(id);
```

---

## Task 5: Trailer Integrado

> Runs in parallel with Task 4.

**Files:**
- Modify: `src/components/movie/movie.ts`
- Modify: `src/components/movie/movie.html`
- Modify: `src/components/movie/movie.css`

- [ ] **Step 1: Inject TmdbService into Movie component**

In `src/components/movie/movie.ts`, add:

```typescript
import { TmdbService } from '../../services/tmdb-service';
// ...
trailerKey: string | null = null;
trailerLoading = false;
```

Add `private tmdbService: TmdbService` to constructor.

In `loadSimilar()` — after `this.film = data as FilmeModel`, add:

```typescript
this.trailerKey = null;
this.trailerLoading = true;
this.tmdbService.getTrailerKey(this.film.titulo).subscribe(key => {
  this.trailerKey = key;
  this.trailerLoading = false;
});
```

- [ ] **Step 2: Add trailer section to movie.html**

After the `<section class="synopsis-panel">` block, add:

```html
<!-- ── TRAILER ── -->
<section class="trailer-panel" data-section="trailer" *ngIf="trailerKey || trailerLoading">
  <div class="panel-label">Trailer</div>
  <div *ngIf="trailerLoading" class="trailer-skeleton"></div>
  <div *ngIf="trailerKey && !trailerLoading" class="trailer-embed">
    <iframe
      [src]="'https://www.youtube.com/embed/' + trailerKey + '?rel=0' | safeUrl"
      frameborder="0"
      allowfullscreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
    </iframe>
  </div>
</section>
```

**Note:** Angular requires a `SafeUrl` pipe for dynamic iframe URLs. Create it:

```typescript
// src/shared/safe-url.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({ name: 'safeUrl', standalone: true })
export class SafeUrlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(url: string) { return this.sanitizer.bypassSecurityTrustResourceUrl(url); }
}
```

Add `SafeUrlPipe` to `movie.ts` imports array.

- [ ] **Step 3: Add trailer CSS**

Append to `src/components/movie/movie.css`:

```css
.trailer-panel { padding: 80px 52px; }
.trailer-skeleton { width: 100%; max-width: 800px; aspect-ratio: 16/9; background: var(--card); border-radius: 8px; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
.trailer-embed { width: 100%; max-width: 800px; }
.trailer-embed iframe { width: 100%; aspect-ratio: 16/9; border-radius: 8px; }
```

- [ ] **Step 4: Add progress dot for trailer in movie.html**

In the `#progress-line` div, add a dot:
```html
<div class="prog-dot" title="Trailer"></div>
```

- [ ] **Step 5: Commit**

```bash
cd frontend && git add src/components/movie/ src/shared/safe-url.pipe.ts && git commit -m "feat: trailer integration via TMDB"
```

---

## Task 6: Coleções Personalizadas

> Sequential — runs after Tasks 4 and 5 are merged.

**Files:**
- Create: `src/services/collections-service.ts`
- Create: `src/services/collections-service.spec.ts`
- Create: `src/components/collections/collections.ts` + `.html` + `.css`
- Modify: `src/shared/movie-card/movie-card.ts`
- Modify: `src/shared/movie-card/movie-card.html`
- Modify: `src/shared/movie-card/movie-card.css`
- Modify: `src/app/app.routes.ts`

- [ ] **Step 1: Write failing CollectionsService test**

```typescript
// src/services/collections-service.spec.ts
import { CollectionsService } from './collections-service';

describe('CollectionsService', () => {
  let service: CollectionsService;

  beforeEach(() => { localStorage.clear(); service = new CollectionsService(); });

  it('starts empty', () => { expect(service.getAll().length).toBe(0); });

  it('creates collection with name', () => {
    service.create('Maratona');
    expect(service.getAll()[0].name).toBe('Maratona');
  });

  it('addFilm adds filmId to collection', () => {
    service.create('Test');
    const id = service.getAll()[0].id;
    service.addFilm(id, 42);
    expect(service.getAll()[0].filmIds).toContain(42);
  });

  it('removeFilm removes filmId', () => {
    service.create('Test');
    const id = service.getAll()[0].id;
    service.addFilm(id, 42);
    service.removeFilm(id, 42);
    expect(service.getAll()[0].filmIds).not.toContain(42);
  });

  it('delete removes collection', () => {
    service.create('Del');
    const id = service.getAll()[0].id;
    service.delete(id);
    expect(service.getAll().length).toBe(0);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd frontend && ng test --include="src/services/collections-service.spec.ts" --watch=false --browsers=ChromeHeadless
```

- [ ] **Step 3: Implement CollectionsService**

```typescript
// src/services/collections-service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Collection {
  id: string;
  name: string;
  filmIds: number[];
  createdAt: string;
}

const KEY = 'looker:collections';

@Injectable({ providedIn: 'root' })
export class CollectionsService {
  private data$ = new BehaviorSubject<Collection[]>(this.load());
  collections$ = this.data$.asObservable();

  getAll(): Collection[] { return this.data$.value; }

  create(name: string): void {
    const col: Collection = { id: crypto.randomUUID(), name, filmIds: [], createdAt: new Date().toISOString() };
    this.save([...this.data$.value, col]);
  }

  delete(id: string): void { this.save(this.data$.value.filter(c => c.id !== id)); }

  addFilm(collectionId: string, filmId: number): void {
    this.save(this.data$.value.map(c =>
      c.id === collectionId && !c.filmIds.includes(filmId)
        ? { ...c, filmIds: [...c.filmIds, filmId] } : c
    ));
  }

  removeFilm(collectionId: string, filmId: number): void {
    this.save(this.data$.value.map(c =>
      c.id === collectionId ? { ...c, filmIds: c.filmIds.filter(id => id !== filmId) } : c
    ));
  }

  private load(): Collection[] {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
    catch { return []; }
  }

  private save(cols: Collection[]): void {
    this.data$.next(cols);
    try { localStorage.setItem(KEY, JSON.stringify(cols)); } catch { /* ignore */ }
  }
}
```

- [ ] **Step 4: Create CollectionsComponent**

```typescript
// src/components/collections/collections.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CollectionsService, Collection } from '../../services/collections-service';
import { MovieService } from '../../services/movie-service';
import { FilmeModel } from '../../models/filme-model';
import { MovieCard } from '../../shared/movie-card/movie-card';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [CommonModule, FormsModule, MovieCard],
  templateUrl: './collections.html',
  styleUrl: './collections.css'
})
export class Collections implements OnInit {
  collections: Collection[] = [];
  allFilms: FilmeModel[] = [];
  newName = '';
  selectedId: string | null = null;

  constructor(
    public collectionsService: CollectionsService,
    private movieService: MovieService,
    private router: Router
  ) {}

  ngOnInit() {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    this.collectionsService.collections$.subscribe(c => this.collections = c);
    this.movieService.getAllMovies().subscribe(f => this.allFilms = f);
  }

  create() {
    if (!this.newName.trim()) return;
    this.collectionsService.create(this.newName.trim());
    this.newName = '';
  }

  filmsFor(col: Collection): FilmeModel[] {
    return this.allFilms.filter(m => col.filmIds.includes(m.id));
  }

  goBack() { this.router.navigate(['/']); }
}
```

```html
<!-- src/components/collections/collections.html -->
<div class="col-page">
  <div class="col-header">
    <button class="back-btn" (click)="goBack()">← Voltar</button>
    <h1>Minhas Coleções</h1>
  </div>

  <div class="new-col">
    <input class="col-input" [(ngModel)]="newName" placeholder="Nome da coleção" (keydown.enter)="create()" />
    <button class="col-btn" (click)="create()">Criar</button>
  </div>

  <div *ngIf="collections.length === 0" class="col-empty">Nenhuma coleção ainda. Crie sua primeira!</div>

  <div *ngFor="let col of collections" class="col-section">
    <div class="col-name-row">
      <div class="col-name">{{ col.name }} <span class="col-count">({{ col.filmIds.length }})</span></div>
      <button class="col-delete" (click)="collectionsService.delete(col.id)">Excluir</button>
    </div>
    <div *ngIf="filmsFor(col).length === 0" class="col-hint">Adicione filmes usando o botão nas cards.</div>
    <div class="col-grid">
      <app-movie-card *ngFor="let film of filmsFor(col)" [film]="film"></app-movie-card>
    </div>
  </div>
</div>
```

```css
/* src/components/collections/collections.css */
.col-page { min-height: 100vh; background: var(--bg); padding: 100px 52px 80px; }
.col-header { display: flex; align-items: center; gap: 20px; margin-bottom: 40px; }
.col-header h1 { font-family: 'Bebas Neue', sans-serif; font-size: 48px; letter-spacing: 0.04em; }
.back-btn { background: none; border: 1px solid var(--border); color: var(--fg); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; }
.new-col { display: flex; gap: 12px; margin-bottom: 40px; }
.col-input { flex: 1; background: var(--card); border: 1px solid var(--border); border-radius: 6px; padding: 10px 16px; color: var(--fg); font-size: 14px; }
.col-input:focus { outline: none; border-color: var(--primary); }
.col-btn { background: var(--primary); border: none; color: #fff; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.col-empty, .col-hint { color: var(--muted); font-size: 14px; padding: 20px 0; }
.col-section { margin-bottom: 48px; }
.col-name-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.col-name { font-family: 'Bebas Neue', sans-serif; font-size: 28px; }
.col-count { font-size: 16px; color: var(--muted); }
.col-delete { background: none; border: 1px solid var(--border); color: var(--muted); padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; }
.col-delete:hover { border-color: var(--primary); color: var(--primary); }
.col-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
```

- [ ] **Step 5: Add /colecoes route**

In `src/app/app.routes.ts`:

```typescript
import { Collections } from '../components/collections/collections';

// add to routes array:
{ path: 'colecoes', component: Collections },
```

- [ ] **Step 6: Add "Adicionar à coleção" to MovieCard**

Replace `src/shared/movie-card/movie-card.ts`:

```typescript
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FilmeModel } from '../../models/filme-model';
import { CollectionsService } from '../../services/collections-service';

const PALETTES = [
  { c1: '#0e0818', c2: '#1a0e2e' },
  { c1: '#0d1520', c2: '#153050' },
  { c1: '#120c08', c2: '#2e1c0c' },
  { c1: '#0a0c10', c2: '#182030' },
  { c1: '#0f0c06', c2: '#2e2810' },
  { c1: '#060e14', c2: '#0c2040' },
];

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './movie-card.html',
  styleUrl: './movie-card.css'
})
export class MovieCard {
  @Input() film!: FilmeModel;
  showActions = false;

  constructor(private router: Router, public collectionsService: CollectionsService) {}

  get palette() { return PALETTES[this.film.id % 6]; }
  navigate() { this.router.navigate([`/movie/${this.film.id}`]); }

  addToFirstCollection(e: Event) {
    e.stopPropagation();
    const cols = this.collectionsService.getAll();
    if (!cols.length) { this.router.navigate(['/colecoes']); return; }
    this.collectionsService.addFilm(cols[0].id, this.film.id);
  }
}
```

Replace `src/shared/movie-card/movie-card.html`:

```html
<div class="browse-card" (mouseenter)="showActions=true" (mouseleave)="showActions=false" (click)="navigate()">
  <div class="browse-poster">
    <img *ngIf="film.imagem_url" [src]="film.imagem_url" [alt]="film.titulo" />
    <svg *ngIf="!film.imagem_url"
         viewBox="0 0 160 240" xmlns="http://www.w3.org/2000/svg"
         style="width:100%;height:100%;display:block">
      <defs>
        <linearGradient [id]="'bg'+film.id" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" [attr.stop-color]="palette.c1"/>
          <stop offset="100%" [attr.stop-color]="palette.c2"/>
        </linearGradient>
      </defs>
      <rect width="160" height="240" [attr.fill]="'url(#bg'+film.id+')'"/>
      <text x="80" y="120" text-anchor="middle" dominant-baseline="middle"
            font-family="Georgia" font-style="italic" font-size="9"
            fill="rgba(255,255,255,0.15)" letter-spacing="1">
        {{ film.titulo.toUpperCase().slice(0, 12) }}
      </text>
    </svg>
    <div class="poster-shine"></div>
    <div class="card-actions" *ngIf="showActions" (click)="$event.stopPropagation()">
      <button (click)="addToFirstCollection($event)" title="Adicionar à coleção">+</button>
    </div>
  </div>
  <div class="card-name">{{ film.titulo }}</div>
  <div class="card-genre">{{ film.genero }}</div>
</div>
```

Append to `src/shared/movie-card/movie-card.css`:

```css
.card-actions {
  position: absolute; bottom: 6px; right: 6px;
  display: flex; gap: 4px;
}
.card-actions button {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--primary); border: none; color: #fff;
  font-size: 18px; line-height: 1; cursor: pointer; font-weight: 700;
  transition: transform 0.15s;
}
.card-actions button:hover { transform: scale(1.1); }
```

Also add "Coleções" link to header nav (`header.html`):
```html
<a routerLink="/colecoes" class="nav-link">Coleções</a>
```

- [ ] **Step 7: Run tests**

```bash
cd frontend && ng test --include="src/services/collections-service.spec.ts" --watch=false --browsers=ChromeHeadless
```
Expected: 5 specs, 0 failures

- [ ] **Step 8: Commit**

```bash
cd frontend && git add src/services/collections-service.ts src/services/collections-service.spec.ts src/components/collections/ src/shared/movie-card/ src/app/app.routes.ts src/shared/header/ && git commit -m "feat: collections personalizadas"
```

---

## Task 7: Comparação de Filmes

> Sequential after Task 6 (both touch MovieCard — Task 7 extends Task 6's version).

**Files:**
- Create: `src/services/compare-service.ts`
- Create: `src/services/compare-service.spec.ts`
- Create: `src/shared/compare-bar/compare-bar.ts` + `.html` + `.css`
- Create: `src/components/compare/compare.ts` + `.html` + `.css`
- Modify: `src/shared/movie-card/movie-card.ts`
- Modify: `src/shared/movie-card/movie-card.html`
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/app.ts`
- Modify: `src/app/app.html`

- [ ] **Step 1: Write failing CompareService test**

```typescript
// src/services/compare-service.spec.ts
import { CompareService } from './compare-service';

describe('CompareService', () => {
  let service: CompareService;

  beforeEach(() => { sessionStorage.clear(); service = new CompareService(); });

  it('starts empty', () => { expect(service.ids.length).toBe(0); });

  it('add stores filmId', () => { service.add(1); expect(service.ids).toContain(1); });

  it('add ignores duplicate', () => { service.add(1); service.add(1); expect(service.ids.length).toBe(1); });

  it('add ignores third film', () => { service.add(1); service.add(2); service.add(3); expect(service.ids.length).toBe(2); });

  it('remove drops filmId', () => { service.add(1); service.add(2); service.remove(1); expect(service.ids).not.toContain(1); });

  it('canAdd is false when 2 films stored', () => { service.add(1); service.add(2); expect(service.canAdd).toBeFalse(); });

  it('clear empties list', () => { service.add(1); service.add(2); service.clear(); expect(service.ids.length).toBe(0); });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd frontend && ng test --include="src/services/compare-service.spec.ts" --watch=false --browsers=ChromeHeadless
```

- [ ] **Step 3: Implement CompareService**

```typescript
// src/services/compare-service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const KEY = 'looker:compare';

@Injectable({ providedIn: 'root' })
export class CompareService {
  private ids$ = new BehaviorSubject<number[]>(this.load());
  ids$ Obs = this.ids$.asObservable();

  get ids(): number[] { return this.ids$.value; }
  get canAdd(): boolean { return this.ids$.value.length < 2; }

  add(id: number): void {
    if (!this.canAdd || this.ids$.value.includes(id)) return;
    this.save([...this.ids$.value, id]);
  }

  remove(id: number): void { this.save(this.ids$.value.filter(i => i !== id)); }

  clear(): void { this.save([]); }

  isSelected(id: number): boolean { return this.ids$.value.includes(id); }

  private load(): number[] {
    try { return JSON.parse(sessionStorage.getItem(KEY) ?? '[]'); }
    catch { return []; }
  }

  private save(ids: number[]): void {
    this.ids$.next(ids);
    try { sessionStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* ignore */ }
  }
}
```

**Note:** `ids$Obs` (remove the space — typo above):
```typescript
ids$Obs = this.ids$.asObservable();
```

- [ ] **Step 4: Create CompareBarComponent**

```typescript
// src/shared/compare-bar/compare-bar.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CompareService } from '../../services/compare-service';

@Component({
  selector: 'app-compare-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compare-bar.html',
  styleUrl: './compare-bar.css'
})
export class CompareBar {
  constructor(public compareService: CompareService, private router: Router) {}

  go() { this.router.navigate(['/comparar']); }
  clear() { this.compareService.clear(); }
}
```

```html
<!-- src/shared/compare-bar/compare-bar.html -->
<div class="compare-bar" *ngIf="compareService.ids.length > 0">
  <span class="cbar-text">
    {{ compareService.ids.length === 1 ? 'Selecione outro filme para comparar' : '2 filmes selecionados' }}
  </span>
  <button class="cbar-btn" (click)="go()" [disabled]="compareService.ids.length < 2">Comparar</button>
  <button class="cbar-clear" (click)="clear()">×</button>
</div>
```

```css
/* src/shared/compare-bar/compare-bar.css */
.compare-bar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 500;
  background: var(--card); border-top: 1px solid var(--border);
  padding: 14px 52px; display: flex; align-items: center; gap: 16px;
}
.cbar-text { flex: 1; font-size: 14px; color: var(--fg); }
.cbar-btn {
  background: var(--primary); border: none; color: #fff;
  padding: 9px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;
}
.cbar-btn:disabled { opacity: 0.4; cursor: default; }
.cbar-clear { background: none; border: 1px solid var(--border); color: var(--muted); padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 18px; }
```

- [ ] **Step 5: Create CompareComponent**

```typescript
// src/components/compare/compare.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CompareService } from '../../services/compare-service';
import { MovieService } from '../../services/movie-service';
import { Rent } from '../../services/rent';
import { FilmeModel } from '../../models/filme-model';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compare.html',
  styleUrl: './compare.css'
})
export class Compare implements OnInit {
  films: FilmeModel[] = [];
  rentLoading: Record<number, boolean> = {};

  constructor(
    public compareService: CompareService,
    private movieService: MovieService,
    private rentService: Rent,
    private router: Router
  ) {}

  ngOnInit() {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    const ids = this.compareService.ids;
    if (ids.length < 2) { this.router.navigate(['/']); return; }
    this.movieService.getAllMovies().subscribe(all => {
      this.films = ids.map(id => all.find(m => m.id === id)!).filter(Boolean);
    });
  }

  rent(film: FilmeModel) {
    this.rentLoading[film.id] = true;
    this.rentService.getRents(film.id).subscribe({
      next: (d: any) => { alert(`Alugado! R$ ${d.pagamento?.amount ?? film.preco_aluguel}`); },
      error: () => alert('Erro ao alugar.'),
      complete: () => { this.rentLoading[film.id] = false; }
    });
  }

  get filmYear(): (f: FilmeModel) => number {
    return f => f.ano instanceof Date ? f.ano.getFullYear() : new Date(f.ano).getFullYear();
  }

  goBack() { this.router.navigate(['/']); }
}
```

```html
<!-- src/components/compare/compare.html -->
<div class="cmp-page">
  <div class="cmp-header">
    <button class="back-btn" (click)="goBack()">← Voltar</button>
    <h1>Comparação</h1>
    <button class="cmp-clear" (click)="compareService.clear(); goBack()">Limpar</button>
  </div>

  <div class="cmp-grid" *ngIf="films.length === 2">
    <!-- Posters -->
    <div class="cmp-row cmp-posters">
      <div class="cmp-cell cmp-label-cell"></div>
      <div class="cmp-cell" *ngFor="let f of films">
        <img *ngIf="f.imagem_url" [src]="f.imagem_url" [alt]="f.titulo" class="cmp-poster" />
      </div>
    </div>

    <!-- Title -->
    <div class="cmp-row">
      <div class="cmp-cell cmp-label">Título</div>
      <div class="cmp-cell" *ngFor="let f of films">{{ f.titulo }}</div>
    </div>

    <!-- Genre -->
    <div class="cmp-row">
      <div class="cmp-cell cmp-label">Gênero</div>
      <div class="cmp-cell" *ngFor="let f of films">{{ f.genero }}</div>
    </div>

    <!-- Year -->
    <div class="cmp-row">
      <div class="cmp-cell cmp-label">Ano</div>
      <div class="cmp-cell" *ngFor="let f of films">{{ filmYear(f) }}</div>
    </div>

    <!-- Duration -->
    <div class="cmp-row">
      <div class="cmp-cell cmp-label">Duração</div>
      <div class="cmp-cell" *ngFor="let f of films">{{ f.duracao_minutos }} min</div>
    </div>

    <!-- Rating -->
    <div class="cmp-row">
      <div class="cmp-cell cmp-label">Classificação</div>
      <div class="cmp-cell" *ngFor="let f of films">{{ f.classificacao_indicativa }}</div>
    </div>

    <!-- Director -->
    <div class="cmp-row">
      <div class="cmp-cell cmp-label">Diretor</div>
      <div class="cmp-cell" *ngFor="let f of films">{{ f.diretor }}</div>
    </div>

    <!-- Price -->
    <div class="cmp-row">
      <div class="cmp-cell cmp-label">Preço</div>
      <div class="cmp-cell" *ngFor="let f of films">R$ {{ f.preco_aluguel.toFixed(2) }}</div>
    </div>

    <!-- Available -->
    <div class="cmp-row">
      <div class="cmp-cell cmp-label">Disponíveis</div>
      <div class="cmp-cell" *ngFor="let f of films">{{ f.copias_disponiveis }} / {{ f.total_copias }}</div>
    </div>

    <!-- Rent -->
    <div class="cmp-row cmp-rent-row">
      <div class="cmp-cell cmp-label"></div>
      <div class="cmp-cell" *ngFor="let f of films">
        <button class="rent-btn" (click)="rent(f)" [disabled]="rentLoading[f.id] || f.copias_disponiveis === 0">
          {{ f.copias_disponiveis === 0 ? 'Indisponível' : rentLoading[f.id] ? '…' : 'Alugar' }}
        </button>
      </div>
    </div>
  </div>
</div>
```

```css
/* src/components/compare/compare.css */
.cmp-page { min-height: 100vh; background: var(--bg); padding: 100px 52px 80px; }
.cmp-header { display: flex; align-items: center; gap: 20px; margin-bottom: 48px; }
.cmp-header h1 { font-family: 'Bebas Neue', sans-serif; font-size: 48px; flex: 1; }
.back-btn, .cmp-clear { background: none; border: 1px solid var(--border); color: var(--fg); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; }

.cmp-grid { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.cmp-row { display: grid; grid-template-columns: 160px 1fr 1fr; border-bottom: 1px solid var(--border); }
.cmp-row:last-child { border-bottom: none; }
.cmp-cell { padding: 16px 20px; font-size: 14px; color: var(--fg); }
.cmp-label { color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; display: flex; align-items: center; background: var(--bg-elev); }
.cmp-posters { background: var(--card); }
.cmp-poster { width: 100%; max-width: 160px; aspect-ratio: 2/3; object-fit: cover; border-radius: 6px; }
.cmp-rent-row .cmp-cell { padding: 20px; }
.rent-btn { background: var(--primary); border: none; color: #fff; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; width: 100%; }
.rent-btn:disabled { opacity: 0.4; cursor: default; }
```

- [ ] **Step 6: Add compare button to MovieCard**

In `src/shared/movie-card/movie-card.ts`, add `CompareService` import and injection:

```typescript
import { CompareService } from '../../services/compare-service';
// in constructor:
public compareService: CompareService
// add method:
toggleCompare(e: Event) {
  e.stopPropagation();
  if (this.compareService.isSelected(this.film.id)) {
    this.compareService.remove(this.film.id);
  } else {
    this.compareService.add(this.film.id);
  }
}
```

In `movie-card.html`, add to `.card-actions`:

```html
<button (click)="toggleCompare($event)"
        [class.active]="compareService.isSelected(film.id)"
        title="Comparar">⚖</button>
```

Append to `movie-card.css`:

```css
.card-actions button.active { background: #fff; color: var(--primary); }
```

- [ ] **Step 7: Register route and wire CompareBar into app**

In `app.routes.ts` add:
```typescript
import { Compare } from '../components/compare/compare';
// add:
{ path: 'comparar', component: Compare },
```

In `src/app/app.ts`, add `CompareBar` to imports:

```typescript
import { CompareBar } from '../shared/compare-bar/compare-bar';
// in @Component imports array: add CompareBar
```

In `src/app/app.html`:

```html
<canvas id="grain"></canvas>
<app-header></app-header>
<router-outlet></router-outlet>
<app-compare-bar></app-compare-bar>
```

- [ ] **Step 8: Run tests**

```bash
cd frontend && ng test --include="src/services/compare-service.spec.ts" --watch=false --browsers=ChromeHeadless
```
Expected: 7 specs, 0 failures

- [ ] **Step 9: Commit**

```bash
cd frontend && git add src/services/compare-service.ts src/services/compare-service.spec.ts src/shared/compare-bar/ src/components/compare/ src/shared/movie-card/ src/app/ && git commit -m "feat: comparação de filmes side-by-side"
```

---

## Self-Review

**Spec coverage:**
- ✅ Dark Mode — Task 2
- ✅ Grid/Lista Toggle — Task 3
- ✅ Filtros Avançados — Task 3
- ✅ Trending — Task 4
- ✅ Recomendações — Task 4
- ✅ Trailer — Task 5
- ✅ Coleções — Task 6
- ✅ Comparação — Task 7
- ✅ PreferenceStore + TmdbService — Task 1

**Placeholder scan:** None found. All steps have complete code.

**Type consistency:**
- `FilmFilters.generos: string[]` — consistent Tasks 3, 3
- `Collection.filmIds: number[]` — consistent Tasks 6, 6
- `CompareService.ids: number[]` — consistent Tasks 7, 7
- `TmdbService.getTrailerKey(titulo)` — consistent Tasks 1, 5
- `ViewModeService.setMode('grid'|'list')` — consistent Tasks 3, 3
- `RecommendationService.recommend(all, recentFilms)` — consistent Tasks 4, 4
- `TrendingService.topByRentalRate(films, limit)` — consistent Tasks 4, 4

**Note on `ids$Obs`:** In CompareService the property should be `idsObs$` or `ids$Obs` — remove the space typo.

**Note on Trailer:** TMDB API key must be set in `src/environments/environment.ts`. Without a key, trailers will silently fail (section hidden).

**Note on Movie component `recommendationService`:** Task 4 Step 8 instructs adding `RecommendationService` to `movie.ts`. Ensure the same constructor injection is used consistently.
