# Looker Frontend Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar o frontend Angular do Looker para uma experiência cinemática com hero parallax, cards 3D tilt, scroll storytelling e paleta vermelho→violeta.

**Architecture:** Refatoração cirúrgica — serviços, modelos, guards e roteamento permanecem intocados. Templates e estilos são reescritos. Novos componentes compartilhados (HeroSection, ScrollSection, MovieCard, TiltDirective) são criados em `src/shared/`. LoginComponent absorve o RegisterComponent via tabs, eliminando a necessidade de `app-register` no header.

**Tech Stack:** Angular 20 (standalone), GSAP 3 + ScrollTrigger, vanilla-tilt, TypeScript 5.9, CSS (component-scoped).

**Spec:** `docs/superpowers/specs/2026-04-20-looker-frontend-redesign-design.md`

---

## File Map

```
frontend/looker/
├── package.json                                    MOD — add gsap, vanilla-tilt
├── src/
│   ├── styles.scss                                 MOD — updated tokens + animation utilities
│   ├── app/
│   │   └── app.ts                                  MOD — register GSAP plugins
│   ├── shared/
│   │   ├── tilt/
│   │   │   ├── tilt.directive.ts                   NEW — vanilla-tilt wrapper directive
│   │   │   └── tilt.directive.spec.ts              NEW
│   │   ├── scroll-section/
│   │   │   ├── scroll-section.ts                   NEW — GSAP ScrollTrigger reveal wrapper
│   │   │   └── scroll-section.spec.ts              NEW
│   │   ├── movie-card/
│   │   │   ├── movie-card.ts                       NEW — standalone card with tilt
│   │   │   ├── movie-card.html                     NEW
│   │   │   ├── movie-card.css                      NEW
│   │   │   └── movie-card.spec.ts                  NEW
│   │   ├── hero-section/
│   │   │   ├── hero-section.ts                     NEW — full-viewport hero with parallax
│   │   │   ├── hero-section.html                   NEW
│   │   │   ├── hero-section.css                    NEW
│   │   │   └── hero-section.spec.ts                NEW
│   │   └── header/
│   │       ├── header.ts                           MOD — smart hide scroll logic
│   │       ├── header.html                         MOD — glassmorphism + remove app-register
│   │       ├── header.css                          MOD — new styles
│   │       └── header.spec.ts                      MOD — scroll behavior tests
│   └── components/
│       ├── dashboard/
│       │   ├── dashboard.ts                        MOD — uses HeroSection + new components
│       │   ├── dashboard.html                      MOD — hero + scroll sections
│       │   ├── dashboard.css                       MOD — section layout
│       │   └── dashboard.spec.ts                   MOD — mock HTTP + featuredMovie test
│       ├── movie/
│       │   ├── movie.ts                            MOD — GSAP init + similarMovies
│       │   ├── movie.html                          MOD — fullscreen hero layout
│       │   ├── movie.css                           MOD — new styles
│       │   └── movie.spec.ts                       MOD — mock services
│       └── login/
│           ├── login.ts                            MOD — add tabs + register form + registerSubmit output
│           ├── login.html                          MOD — glassmorphism + tabs
│           ├── login.css                           MOD — new styles
│           └── login.spec.ts                       MOD — tab switch + registerSubmit tests
```

---

## Task 1: Install Dependencies and Configure GSAP

**Files:**
- Modify: `frontend/looker/package.json` (via npm install)
- Modify: `frontend/looker/src/app/app.ts`

- [ ] **Step 1: Install packages**

```bash
cd frontend/looker
npm install gsap vanilla-tilt
npm install --save-dev @types/vanilla-tilt
```

Expected: no errors, `gsap` and `vanilla-tilt` appear in `package.json` dependencies.

- [ ] **Step 2: Register GSAP ScrollTrigger plugin in app.ts**

Replace the contents of `frontend/looker/src/app/app.ts`:

```typescript
import { Component, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { Header } from '../shared/header/header';
import { RouterOutlet } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-root',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    FormsModule,
    CommonModule,
    Header,
    RouterOutlet,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('looker');
}
```

- [ ] **Step 3: Verify build compiles**

```bash
cd frontend/looker
npx ng build --configuration development 2>&1 | tail -20
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/looker/package.json frontend/looker/package-lock.json frontend/looker/src/app/app.ts
git commit -m "feat: install gsap + vanilla-tilt, register ScrollTrigger plugin"
```

---

## Task 2: Update Global Style Tokens

**Files:**
- Modify: `frontend/looker/src/styles.scss`

- [ ] **Step 1: Replace styles.scss with updated tokens and utilities**

```scss
/* ====== Tokens ====== */
:root {
  --bg:             #060608;
  --bg-elev:        #0f0c16;
  --card:           #13101a;
  --border:         rgba(255, 255, 255, 0.06);
  --text:           #eaeaea;
  --muted:          rgba(255, 255, 255, 0.45);
  --primary:        #e11d48;
  --primary-end:    #7c3aed;
  --gradient:       linear-gradient(90deg, #e11d48, #7c3aed);
  --glow-red:       rgba(225, 29, 72, 0.15);
  --glow-purple:    rgba(124, 58, 237, 0.15);
  --focus:          #22d3ee;
  --shadow:         0 8px 24px rgba(0, 0, 0, 0.4);
  --ease-out:       cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast:  150ms;
  --duration-base:  300ms;
  --duration-slow:  600ms;
}

* { box-sizing: border-box; }
html, body { height: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}

/* ====== Botões globais ====== */
.btn-primary {
  padding: 13px 28px;
  background: var(--gradient);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(225, 29, 72, 0.35);
  transition: transform var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 32px rgba(225, 29, 72, 0.45);
}

.btn-ghost {
  padding: 13px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  font-size: 14px;
  color: var(--muted);
  cursor: pointer;
  transition: background var(--duration-base) ease, border-color var(--duration-base) ease;
}
.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.2);
}

/* ====== Seção ====== */
.section-header {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 32px;
}
.section-label {
  font-size: 11px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--primary);
}
.section-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text);
}
.section-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(225, 29, 72, 0.3), transparent);
}

/* ====== Scrollbar ====== */
*::-webkit-scrollbar { width: 8px; height: 8px; }
*::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 8px; }
*::-webkit-scrollbar-thumb:hover { background: #353535; }
*::-webkit-scrollbar-track { background: transparent; }

/* ====== Foco acessível ====== */
button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  border-radius: 6px;
}

/* ====== Reduced motion ====== */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Verify build**

```bash
cd frontend/looker
npx ng build --configuration development 2>&1 | tail -5
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/looker/src/styles.scss
git commit -m "feat: update global style tokens for cinematic dark luxury redesign"
```

---

## Task 3: Create TiltDirective

**Files:**
- Create: `frontend/looker/src/shared/tilt/tilt.directive.ts`
- Create: `frontend/looker/src/shared/tilt/tilt.directive.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/looker/src/shared/tilt/tilt.directive.spec.ts`:

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TiltDirective } from './tilt.directive';

@Component({
  standalone: true,
  imports: [TiltDirective],
  template: `<div appTilt></div>`,
})
class TestHostComponent {}

describe('TiltDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should create the directive', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should attach vanillaTilt instance to the host element', () => {
    const el = fixture.nativeElement.querySelector('div') as any;
    expect(el.vanillaTilt).toBeDefined();
  });

  it('should call vanillaTilt.destroy on component destroy', () => {
    const el = fixture.nativeElement.querySelector('div') as any;
    const destroySpy = spyOn(el.vanillaTilt, 'destroy');
    fixture.destroy();
    expect(destroySpy).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend/looker
npx ng test --include="**/tilt.directive.spec.ts" --watch=false --browsers=ChromeHeadless 2>&1 | tail -20
```

Expected: FAILED — `TiltDirective` not found.

- [ ] **Step 3: Implement TiltDirective**

Create `frontend/looker/src/shared/tilt/tilt.directive.ts`:

```typescript
import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import VanillaTilt from 'vanilla-tilt';

@Directive({
  selector: '[appTilt]',
  standalone: true,
})
export class TiltDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);

  ngOnInit(): void {
    VanillaTilt.init(this.el.nativeElement, {
      max: 12,
      speed: 400,
      glare: true,
      'max-glare': 0.15,
    });
  }

  ngOnDestroy(): void {
    (this.el.nativeElement as any).vanillaTilt?.destroy();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend/looker
npx ng test --include="**/tilt.directive.spec.ts" --watch=false --browsers=ChromeHeadless 2>&1 | tail -10
```

Expected: 3 specs, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add frontend/looker/src/shared/tilt/
git commit -m "feat: create TiltDirective wrapping vanilla-tilt"
```

---

## Task 4: Create ScrollSectionComponent

**Files:**
- Create: `frontend/looker/src/shared/scroll-section/scroll-section.ts`
- Create: `frontend/looker/src/shared/scroll-section/scroll-section.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/looker/src/shared/scroll-section/scroll-section.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrollSection } from './scroll-section';
import gsap from 'gsap';

describe('ScrollSection', () => {
  let fixture: ComponentFixture<ScrollSection>;

  beforeEach(async () => {
    spyOn(gsap, 'from').and.returnValue({} as any);
    await TestBed.configureTestingModule({
      imports: [ScrollSection],
    }).compileComponents();
    fixture = TestBed.createComponent(ScrollSection);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render as a block element', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.tagName.toLowerCase()).toBe('app-scroll-section');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend/looker
npx ng test --include="**/scroll-section.spec.ts" --watch=false --browsers=ChromeHeadless 2>&1 | tail -10
```

Expected: FAILED — `ScrollSection` not found.

- [ ] **Step 3: Implement ScrollSectionComponent**

Create `frontend/looker/src/shared/scroll-section/scroll-section.ts`:

```typescript
import {
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-scroll-section',
  standalone: true,
  template: `<ng-content></ng-content>`,
  styles: [`:host { display: block; }`],
})
export class ScrollSection implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  private triggers: ScrollTrigger[] = [];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const children = Array.from(this.el.nativeElement.children) as Element[];
    if (children.length === 0) return;

    const tween = gsap.from(children, {
      scrollTrigger: { trigger: this.el.nativeElement, start: 'top 85%' },
      opacity: 0,
      y: 40,
      stagger: 0.08,
      duration: 0.7,
      ease: 'power3.out',
    });

    if (tween.scrollTrigger) this.triggers.push(tween.scrollTrigger);
  }

  ngOnDestroy(): void {
    this.triggers.forEach((t) => t.kill());
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend/looker
npx ng test --include="**/scroll-section.spec.ts" --watch=false --browsers=ChromeHeadless 2>&1 | tail -10
```

Expected: 2 specs, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add frontend/looker/src/shared/scroll-section/
git commit -m "feat: create ScrollSection component with GSAP ScrollTrigger reveal"
```

---

## Task 5: Create MovieCardComponent

**Files:**
- Create: `frontend/looker/src/shared/movie-card/movie-card.ts`
- Create: `frontend/looker/src/shared/movie-card/movie-card.html`
- Create: `frontend/looker/src/shared/movie-card/movie-card.css`
- Create: `frontend/looker/src/shared/movie-card/movie-card.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/looker/src/shared/movie-card/movie-card.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovieCard } from './movie-card';
import { FilmeModel } from '../../models/filme-model';

const mockMovie: FilmeModel = {
  id: 42,
  titulo: 'Oppenheimer',
  genero: 'Drama',
  ano: new Date('2023'),
  preco_aluguel: 12.9,
  sinopse: 'Sinopse aqui.',
  imagem_url: 'https://example.com/poster.jpg',
  duracao_minutos: 180,
  classificacao_indicativa: '14',
  data_lancamento: new Date('2023-07-21'),
  total_copias: 10,
  diretor: 'Christopher Nolan',
  copias_disponiveis: 5,
};

describe('MovieCard', () => {
  let fixture: ComponentFixture<MovieCard>;
  let component: MovieCard;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieCard],
    }).compileComponents();
    fixture = TestBed.createComponent(MovieCard);
    component = fixture.componentInstance;
    component.movie = mockMovie;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the movie title', () => {
    const title: HTMLElement = fixture.nativeElement.querySelector('.card-title');
    expect(title.textContent).toContain('Oppenheimer');
  });

  it('should display the movie genre', () => {
    const genre: HTMLElement = fixture.nativeElement.querySelector('.card-genre');
    expect(genre.textContent).toContain('Drama');
  });

  it('should emit the movie id when the card is clicked', () => {
    let emittedId: number | undefined;
    component.cardClick.subscribe((id: number) => (emittedId = id));
    fixture.nativeElement.querySelector('.movie-card').click();
    expect(emittedId).toBe(42);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend/looker
npx ng test --include="**/movie-card.spec.ts" --watch=false --browsers=ChromeHeadless 2>&1 | tail -10
```

Expected: FAILED — `MovieCard` not found.

- [ ] **Step 3: Implement MovieCard TypeScript**

Create `frontend/looker/src/shared/movie-card/movie-card.ts`:

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FilmeModel } from '../../models/filme-model';
import { TiltDirective } from '../tilt/tilt.directive';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [TiltDirective],
  templateUrl: './movie-card.html',
  styleUrl: './movie-card.css',
})
export class MovieCard {
  @Input() movie!: FilmeModel;
  @Output() cardClick = new EventEmitter<number>();

  onClick(): void {
    this.cardClick.emit(this.movie.id);
  }

  getYear(): string {
    return new Date(this.movie.data_lancamento).getFullYear().toString();
  }
}
```

- [ ] **Step 4: Create movie-card.html**

```html
<div class="movie-card" appTilt (click)="onClick()">
  <div class="card-poster">
    <img [src]="movie.imagem_url" [alt]="movie.titulo" loading="lazy" />
    <div class="card-overlay">
      <div class="play-btn">▶</div>
    </div>
  </div>
  <div class="card-info">
    <h3 class="card-title">{{ movie.titulo }}</h3>
    <p class="card-year">{{ getYear() }}</p>
    <span class="card-genre">{{ movie.genero }}</span>
  </div>
</div>
```

- [ ] **Step 5: Create movie-card.css**

```css
.movie-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color var(--duration-base) ease, box-shadow var(--duration-base) ease;
  transform-style: preserve-3d;
}
.movie-card:hover {
  border-color: rgba(225, 29, 72, 0.3);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(225, 29, 72, 0.08);
}

.card-poster {
  position: relative;
  height: 220px;
  overflow: hidden;
}
.card-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: #0a0a0a;
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(13, 10, 20, 1) 0%, transparent 60%);
  opacity: 0;
  transition: opacity var(--duration-base) ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.movie-card:hover .card-overlay { opacity: 1; }

.play-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(225, 29, 72, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  box-shadow: 0 0 20px rgba(225, 29, 72, 0.5);
}

.card-info { padding: 12px 14px 14px; }
.card-title {
  margin: 0 0 4px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1.2;
}
.card-year {
  margin: 0;
  font-size: 0.78rem;
  color: var(--muted);
}
.card-genre {
  display: inline-block;
  margin-top: 6px;
  padding: 2px 8px;
  background: rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 4px;
  font-size: 10px;
  color: rgba(124, 58, 237, 0.8);
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd frontend/looker
npx ng test --include="**/movie-card.spec.ts" --watch=false --browsers=ChromeHeadless 2>&1 | tail -10
```

Expected: 4 specs, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add frontend/looker/src/shared/movie-card/
git commit -m "feat: create MovieCard standalone component with tilt 3D effect"
```

---

## Task 6: Create HeroSectionComponent

**Files:**
- Create: `frontend/looker/src/shared/hero-section/hero-section.ts`
- Create: `frontend/looker/src/shared/hero-section/hero-section.html`
- Create: `frontend/looker/src/shared/hero-section/hero-section.css`
- Create: `frontend/looker/src/shared/hero-section/hero-section.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/looker/src/shared/hero-section/hero-section.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeroSection } from './hero-section';
import { FilmeModel } from '../../models/filme-model';
import gsap from 'gsap';

const mockMovie: FilmeModel = {
  id: 1,
  titulo: 'Duna: Parte II',
  genero: 'Ficção Científica',
  ano: new Date('2024'),
  preco_aluguel: 9.9,
  sinopse: 'Paul Atreides une forças com os Fremen.',
  imagem_url: 'https://example.com/duna.jpg',
  duracao_minutos: 166,
  classificacao_indicativa: '14',
  data_lancamento: new Date('2024-03-01'),
  total_copias: 10,
  diretor: 'Denis Villeneuve',
  copias_disponiveis: 5,
};

describe('HeroSection', () => {
  let fixture: ComponentFixture<HeroSection>;
  let component: HeroSection;

  beforeEach(async () => {
    spyOn(gsap, 'to').and.returnValue({} as any);
    await TestBed.configureTestingModule({
      imports: [HeroSection],
    }).compileComponents();
    fixture = TestBed.createComponent(HeroSection);
    component = fixture.componentInstance;
    component.movie = mockMovie;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display movie title', () => {
    const title: HTMLElement = fixture.nativeElement.querySelector('.hero-title');
    expect(title.textContent).toContain('Duna: Parte II');
  });

  it('should display movie sinopse', () => {
    const desc: HTMLElement = fixture.nativeElement.querySelector('.hero-description');
    expect(desc.textContent).toContain('Paul Atreides');
  });

  it('should emit movie id when rent button is clicked', () => {
    let emittedId: number | undefined;
    component.rentMovie.subscribe((id: number) => (emittedId = id));
    fixture.nativeElement.querySelector('.btn-rent').click();
    expect(emittedId).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend/looker
npx ng test --include="**/hero-section.spec.ts" --watch=false --browsers=ChromeHeadless 2>&1 | tail -10
```

Expected: FAILED — `HeroSection` not found.

- [ ] **Step 3: Implement HeroSection TypeScript**

Create `frontend/looker/src/shared/hero-section/hero-section.ts`:

```typescript
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  NgZone,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FilmeModel } from '../../models/filme-model';
import { TiltDirective } from '../tilt/tilt.directive';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [TiltDirective],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.css',
})
export class HeroSection implements AfterViewInit, OnDestroy {
  @Input() movie!: FilmeModel;
  @Output() rentMovie = new EventEmitter<number>();

  @ViewChild('heroEl') heroEl!: ElementRef<HTMLElement>;
  @ViewChild('posterEl') posterEl!: ElementRef<HTMLElement>;
  @ViewChild('contentEl') contentEl!: ElementRef<HTMLElement>;

  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private triggers: ScrollTrigger[] = [];

  onRent(): void {
    this.rentMovie.emit(this.movie.id);
  }

  getYear(): string {
    return new Date(this.movie.data_lancamento).getFullYear().toString();
  }

  getPrice(): string {
    return this.movie.preco_aluguel.toFixed(2).replace('.', ',');
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.ngZone.runOutsideAngular(() => {
      const posterTween = gsap.to(this.posterEl.nativeElement, {
        scrollTrigger: { trigger: this.heroEl.nativeElement, scrub: true },
        y: '30%',
        ease: 'none',
      });
      const contentTween = gsap.to(this.contentEl.nativeElement, {
        scrollTrigger: { trigger: this.heroEl.nativeElement, scrub: true },
        y: '-15%',
        ease: 'none',
      });
      if (posterTween.scrollTrigger) this.triggers.push(posterTween.scrollTrigger);
      if (contentTween.scrollTrigger) this.triggers.push(contentTween.scrollTrigger);
    });
  }

  ngOnDestroy(): void {
    this.triggers.forEach((t) => t.kill());
  }
}
```

- [ ] **Step 4: Create hero-section.html**

```html
<section class="hero" #heroEl>
  <div class="hero-bg"></div>
  <div class="hero-glow"></div>
  <div class="hero-vignette"></div>

  <div class="hero-poster" #posterEl appTilt>
    <img [src]="movie.imagem_url" [alt]="movie.titulo" />
    <div class="poster-shine"></div>
  </div>

  <div class="hero-content" #contentEl>
    <div class="hero-badge">Em destaque</div>
    <h1 class="hero-title">{{ movie.titulo }}</h1>
    <div class="hero-meta">
      {{ getYear() }} · {{ movie.duracao_minutos }} min · {{ movie.genero }}
    </div>
    <p class="hero-description">{{ movie.sinopse }}</p>
    <div class="hero-actions">
      <button class="btn-rent" (click)="onRent()">
        Alugar por R$ {{ getPrice() }}
      </button>
    </div>
  </div>

  <div class="hero-scroll-indicator">
    <span>Scroll</span>
    <div class="scroll-line"></div>
  </div>
</section>
```

- [ ] **Step 5: Create hero-section.css**

```css
.hero {
  position: relative;
  height: 100vh;
  min-height: 600px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1a0820 0%, #0a0514 40%, #0f0820 100%);
}

.hero-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 70% 40%, var(--glow-purple) 0%, transparent 55%),
    radial-gradient(ellipse at 80% 70%, var(--glow-red) 0%, transparent 50%);
}

.hero-vignette {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to right, rgba(6, 6, 8, 0.95) 0%, rgba(6, 6, 8, 0.5) 55%, rgba(6, 6, 8, 0.1) 100%),
    linear-gradient(to top, rgba(6, 6, 8, 1) 0%, transparent 45%);
}

.hero-poster {
  position: absolute;
  right: 7%;
  top: 50%;
  transform: translateY(-50%) perspective(900px) rotateY(-8deg) rotateX(2deg);
  width: 240px;
  height: 360px;
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    -24px 24px 70px rgba(0, 0, 0, 0.75),
    0 0 90px rgba(124, 58, 237, 0.12);
  border: 1px solid rgba(124, 58, 237, 0.2);
}
.hero-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.poster-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, transparent 50%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 2;
  padding: 0 56px 80px;
  max-width: 580px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: rgba(225, 29, 72, 0.12);
  border: 1px solid rgba(225, 29, 72, 0.3);
  border-radius: 20px;
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(225, 29, 72, 0.9);
  margin-bottom: 20px;
}
.hero-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  background: var(--primary);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--primary);
}

.hero-title {
  font-size: clamp(2.4rem, 5vw, 3.8rem);
  font-weight: 900;
  line-height: 1.05;
  color: #fff;
  font-family: Georgia, serif;
  margin: 0 0 14px;
  text-shadow: 0 4px 40px rgba(0, 0, 0, 0.5);
}

.hero-meta {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 16px;
}

.hero-description {
  font-size: 15px;
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 32px;
  max-width: 460px;
}

.hero-actions { display: flex; gap: 12px; }

.btn-rent {
  padding: 14px 30px;
  background: var(--gradient);
  border: none;
  border-radius: 11px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 28px rgba(225, 29, 72, 0.38);
  transition: transform var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}
.btn-rent:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 40px rgba(225, 29, 72, 0.5);
}

.hero-scroll-indicator {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 3;
}
.hero-scroll-indicator span {
  font-size: 10px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
}
.scroll-line {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, rgba(225, 29, 72, 0.6), transparent);
  animation: scrollPulse 2s ease-in-out infinite;
}
@keyframes scrollPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd frontend/looker
npx ng test --include="**/hero-section.spec.ts" --watch=false --browsers=ChromeHeadless 2>&1 | tail -10
```

Expected: 4 specs, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add frontend/looker/src/shared/hero-section/
git commit -m "feat: create HeroSection component with parallax GSAP and poster 3D"
```

---

## Task 7: Refactor HeaderComponent

**Files:**
- Modify: `frontend/looker/src/shared/header/header.ts`
- Modify: `frontend/looker/src/shared/header/header.html`
- Modify: `frontend/looker/src/shared/header/header.css`
- Modify: `frontend/looker/src/shared/header/header.spec.ts`

- [ ] **Step 1: Write failing tests**

Replace `frontend/looker/src/shared/header/header.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Header } from './header';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let component: Header;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();
    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set isScrolled to true when scrollY > 40', () => {
    Object.defineProperty(window, 'scrollY', { value: 50, configurable: true });
    component.handleScroll();
    expect(component.isScrolled).toBeTrue();
  });

  it('should set isScrolled to false when scrollY <= 40', () => {
    Object.defineProperty(window, 'scrollY', { value: 20, configurable: true });
    component.handleScroll();
    expect(component.isScrolled).toBeFalse();
  });

  it('should hide header when scrolling down past 80px', () => {
    (component as any).lastScrollY = 0;
    Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });
    component.handleScroll();
    expect(component.isHidden).toBeTrue();
  });

  it('should show header when scrolling up', () => {
    (component as any).lastScrollY = 200;
    Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });
    component.handleScroll();
    expect(component.isHidden).toBeFalse();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend/looker
npx ng test --include="**/header.spec.ts" --watch=false --browsers=ChromeHeadless 2>&1 | tail -15
```

Expected: FAILED — `isScrolled`, `isHidden`, `handleScroll` not defined.

- [ ] **Step 3: Update header.ts**

```typescript
import {
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Login } from '../../components/login/login';
import { LoginService } from '../../services/login-service';
import { RegisterModel } from '../../models/register-model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule, Login],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
  menuOpen = false;
  searchQuery = '';
  isScrolled = false;
  isHidden = false;

  private lastScrollY = 0;
  private ngZone = inject(NgZone);
  private scrollListener!: () => void;

  constructor(private router: Router, private loginService: LoginService) {}

  ngOnInit(): void {
    this.scrollListener = () => this.ngZone.run(() => this.handleScroll());
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.scrollListener, { passive: true });
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollListener);
  }

  handleScroll(): void {
    const currentY = window.scrollY;
    this.isScrolled = currentY > 40;
    this.isHidden = currentY > this.lastScrollY && currentY > 80;
    this.lastScrollY = currentY;
  }

  onSearch(): void {
    this.router.navigate([''], { queryParams: { q: this.searchQuery } });
  }

  handleLogin($event: { username: string; password: string; remember: boolean }): void {
    this.loginService.authenticate($event.username, $event.password).subscribe({
      next: (response: any) => {
        localStorage.setItem('jwt', String(response.token));
        alert('Login realizado com sucesso!');
      },
      error: () => alert('Falha no login, tente novamente mais tarde!'),
    });
  }

  handleRegister($event: RegisterModel): void {
    this.loginService.register($event).subscribe({
      next: () => alert('Registro Concluído!'),
      error: () => alert('Falha no Registro'),
    });
  }
}
```

- [ ] **Step 4: Update header.html**

```html
<header
  class="main-header"
  [class.scrolled]="isScrolled"
  [class.hidden]="isHidden"
>
  <div class="logo">LOOKER</div>

  <nav class="main-menu" [class.open]="menuOpen">
    <a routerLink="/">Início</a>
    <a (click)="loginModal.openModal()">Login</a>
    <a (click)="loginModal.openModal(); loginModal.switchTab('register')">Cadastrar</a>
  </nav>

  <form class="search-bar" (ngSubmit)="onSearch()">
    <input
      placeholder="Pesquisar filme..."
      type="search"
      class="search-input"
      [(ngModel)]="searchQuery"
      name="search"
    />
  </form>

  <app-login
    #loginModal
    (loginSubmit)="handleLogin($event)"
    (registerSubmit)="handleRegister($event)"
  ></app-login>
</header>
```

- [ ] **Step 5: Update header.css**

```css
.main-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 32px;
  gap: 32px;
  background: transparent;
  border-bottom: 1px solid transparent;
  z-index: 1000;
  transition:
    background var(--duration-slow) ease,
    backdrop-filter var(--duration-slow) ease,
    border-color var(--duration-slow) ease,
    transform var(--duration-base) ease;
}
.main-header.scrolled {
  background: rgba(6, 6, 8, 0.82);
  backdrop-filter: blur(18px);
  border-color: rgba(255, 255, 255, 0.06);
}
.main-header.hidden {
  transform: translateY(-100%);
}

.logo {
  font-size: 1.2rem;
  font-weight: 900;
  letter-spacing: 2px;
  background: linear-gradient(90deg, #e11d48, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  flex-shrink: 0;
}

.main-menu {
  display: flex;
  gap: 4px;
  flex: 1;
}
.main-menu a {
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--muted);
  text-decoration: none;
  cursor: pointer;
  transition: color var(--duration-base) ease, background var(--duration-base) ease;
}
.main-menu a:hover {
  color: var(--text);
  background: rgba(255, 255, 255, 0.05);
}

.search-bar { display: flex; align-items: center; }
.search-input {
  padding: 7px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text);
  outline: none;
  width: 180px;
  transition: border-color var(--duration-base), box-shadow var(--duration-base), width var(--duration-base);
}
.search-input:focus {
  border-color: rgba(225, 29, 72, 0.4);
  box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.08);
  width: 220px;
}
.search-input::placeholder { color: rgba(255, 255, 255, 0.2); }

@media (max-width: 900px) {
  .main-menu {
    position: fixed;
    inset: 56px 0 0 0;
    background: rgba(6, 6, 8, 0.96);
    backdrop-filter: blur(8px);
    border-top: 1px solid var(--border);
    padding: 16px;
    flex-direction: column;
    transform: translateY(-4%);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--duration-base) ease, transform var(--duration-base) ease;
  }
  .main-menu.open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd frontend/looker
npx ng test --include="**/header.spec.ts" --watch=false --browsers=ChromeHeadless 2>&1 | tail -10
```

Expected: 5 specs, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add frontend/looker/src/shared/header/
git commit -m "feat: refactor Header with smart hide scroll behavior and glassmorphism"
```

---

## Task 8: Refactor DashboardComponent

**Files:**
- Modify: `frontend/looker/src/components/dashboard/dashboard.ts`
- Modify: `frontend/looker/src/components/dashboard/dashboard.html`
- Modify: `frontend/looker/src/components/dashboard/dashboard.css`
- Modify: `frontend/looker/src/components/dashboard/dashboard.spec.ts`

- [ ] **Step 1: Write failing tests**

Replace `frontend/looker/src/components/dashboard/dashboard.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { MovieService } from '../../services/movie-service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { FilmeModel } from '../../models/filme-model';
import gsap from 'gsap';

const mockMovies: FilmeModel[] = [
  {
    id: 1, titulo: 'Duna: Parte II', genero: 'Ficção', ano: new Date('2024'),
    preco_aluguel: 9.9, sinopse: 'Sinopse', imagem_url: 'img1.jpg',
    duracao_minutos: 166, classificacao_indicativa: '14',
    data_lancamento: new Date('2024-03-01'), total_copias: 10,
    diretor: 'Villeneuve', copias_disponiveis: 5,
  },
  {
    id: 2, titulo: 'Oppenheimer', genero: 'Drama', ano: new Date('2023'),
    preco_aluguel: 12.9, sinopse: 'Sinopse', imagem_url: 'img2.jpg',
    duracao_minutos: 180, classificacao_indicativa: '14',
    data_lancamento: new Date('2023-07-21'), total_copias: 10,
    diretor: 'Nolan', copias_disponiveis: 3,
  },
];

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let component: Dashboard;
  let movieServiceSpy: jasmine.SpyObj<MovieService>;

  beforeEach(async () => {
    spyOn(gsap, 'from').and.returnValue({} as any);
    spyOn(gsap, 'to').and.returnValue({} as any);
    movieServiceSpy = jasmine.createSpyObj('MovieService', ['getAllMovies']);
    movieServiceSpy.getAllMovies.and.returnValue(of(mockMovies));

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: MovieService, useValue: movieServiceSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load movies on init', () => {
    expect(movieServiceSpy.getAllMovies).toHaveBeenCalled();
    expect(component.movies?.length).toBe(2);
  });

  it('should set featuredMovie to the first movie in the list', () => {
    expect(component.featuredMovie?.id).toBe(1);
    expect(component.featuredMovie?.titulo).toBe('Duna: Parte II');
  });

  it('should navigate to movie detail on card click', () => {
    const navigateSpy = spyOn(component['router'], 'navigate');
    component.openMovieInfo(2);
    expect(navigateSpy).toHaveBeenCalledWith(['/movie/2']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend/looker
npx ng test --include="**/dashboard.spec.ts" --watch=false --browsers=ChromeHeadless 2>&1 | tail -15
```

Expected: FAILED — `featuredMovie` not defined.

- [ ] **Step 3: Update dashboard.ts**

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FilmeModel } from '../../models/filme-model';
import { MovieService } from '../../services/movie-service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { HeroSection } from '../../shared/hero-section/hero-section';
import { ScrollSection } from '../../shared/scroll-section/scroll-section';
import { MovieCard } from '../../shared/movie-card/movie-card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [HeroSection, ScrollSection, MovieCard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  movies: FilmeModel[] | undefined;
  private subscriptions = new Subscription();

  constructor(
    private movieService: MovieService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  get featuredMovie(): FilmeModel | undefined {
    return this.movies?.[0];
  }

  get remainingMovies(): FilmeModel[] {
    return this.movies?.slice(1) ?? [];
  }

  ngOnInit(): void {
    this.loadMovies();
    this.subscriptions.add(
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => this.loadMovies()),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadMovies(): void {
    this.movieService.getAllMovies().subscribe((data: FilmeModel[]) => {
      const query = this.route.snapshot.queryParams['q'];
      this.movies = query
        ? data.filter((m) => m.titulo.toLowerCase().includes(query.toLowerCase()))
        : data;
    });
  }

  openMovieInfo(id: number): void {
    this.router.navigate([`/movie/${id}`]);
  }
}
```

- [ ] **Step 4: Update dashboard.html**

```html
@if (featuredMovie) {
  <app-hero-section
    [movie]="featuredMovie"
    (rentMovie)="openMovieInfo($event)"
  ></app-hero-section>
}

<app-scroll-section>
  <div class="movies-section">
    <div class="section-header">
      <span class="section-label">Catálogo</span>
      <h2 class="section-title">Todos os Filmes</h2>
      <div class="section-line"></div>
    </div>
    <div class="movie-grid">
      @for (movie of remainingMovies; track movie.id) {
        <app-movie-card
          [movie]="movie"
          (cardClick)="openMovieInfo($event)"
        ></app-movie-card>
      }
    </div>
  </div>
</app-scroll-section>
```

- [ ] **Step 5: Update dashboard.css**

```css
.movies-section {
  padding: 80px 56px;
  max-width: 1300px;
  margin: 0 auto;
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 20px;
}

@media (max-width: 600px) {
  .movies-section { padding: 40px 16px; }
  .movie-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd frontend/looker
npx ng test --include="**/dashboard.spec.ts" --watch=false --browsers=ChromeHeadless 2>&1 | tail -10
```

Expected: 4 specs, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add frontend/looker/src/components/dashboard/
git commit -m "feat: refactor Dashboard with HeroSection, MovieCard, and scroll sections"
```

---

## Task 9: Refactor Movie Detail Component

**Files:**
- Modify: `frontend/looker/src/components/movie/movie.ts`
- Modify: `frontend/looker/src/components/movie/movie.html`
- Modify: `frontend/looker/src/components/movie/movie.css`
- Modify: `frontend/looker/src/components/movie/movie.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `frontend/looker/src/components/movie/movie.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Movie } from './movie';
import { MovieService } from '../../services/movie-service';
import { Rent } from '../../services/rent';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { FilmeModel } from '../../models/filme-model';
import gsap from 'gsap';

const mockMovie: FilmeModel = {
  id: 5, titulo: 'Interestelar', genero: 'Ficção Científica', ano: new Date('2014'),
  preco_aluguel: 8.9, sinopse: 'Um grupo de astronautas viaja pelo espaço.',
  imagem_url: 'interstellar.jpg', duracao_minutos: 169, classificacao_indicativa: '10',
  data_lancamento: new Date('2014-11-07'), total_copias: 8,
  diretor: 'Christopher Nolan', copias_disponiveis: 4,
};

describe('Movie', () => {
  let fixture: ComponentFixture<Movie>;
  let component: Movie;
  let movieServiceSpy: jasmine.SpyObj<MovieService>;
  let rentServiceSpy: jasmine.SpyObj<Rent>;

  beforeEach(async () => {
    spyOn(gsap, 'from').and.returnValue({} as any);
    spyOn(gsap, 'to').and.returnValue({} as any);
    movieServiceSpy = jasmine.createSpyObj('MovieService', ['getMovie', 'getAllMovies']);
    rentServiceSpy = jasmine.createSpyObj('Rent', ['getRents']);
    movieServiceSpy.getMovie.and.returnValue(of(mockMovie));
    movieServiceSpy.getAllMovies.and.returnValue(of([mockMovie]));

    await TestBed.configureTestingModule({
      imports: [Movie],
      providers: [
        { provide: MovieService, useValue: movieServiceSpy },
        { provide: Rent, useValue: rentServiceSpy },
        { provide: ActivatedRoute, useValue: { params: of({ id: '5' }) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Movie);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load movie by id from route params', () => {
    expect(movieServiceSpy.getMovie).toHaveBeenCalledWith(5);
    expect(component.movie?.titulo).toBe('Interestelar');
  });

  it('should display movie title', () => {
    const title: HTMLElement = fixture.nativeElement.querySelector('.movie-hero-title');
    expect(title.textContent).toContain('Interestelar');
  });

  it('should display rent button with price', () => {
    const btn: HTMLElement = fixture.nativeElement.querySelector('.btn-rent-detail');
    expect(btn.textContent).toContain('8');
  });

  it('should call rentService.getRents when rent button clicked', () => {
    rentServiceSpy.getRents.and.returnValue(of({}));
    component.rentMovie();
    expect(rentServiceSpy.getRents).toHaveBeenCalledWith(5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend/looker
npx ng test --include="**/movie.spec.ts" --watch=false --browsers=ChromeHeadless 2>&1 | tail -15
```

Expected: FAILED — `.movie-hero-title` not found, `getAllMovies` not called.

- [ ] **Step 3: Update movie.ts**

```typescript
import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  NgZone,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FilmeModel } from '../../models/filme-model';
import { MovieService } from '../../services/movie-service';
import { ActivatedRoute } from '@angular/router';
import { Rent } from '../../services/rent';
import { ScrollSection } from '../../shared/scroll-section/scroll-section';
import { MovieCard } from '../../shared/movie-card/movie-card';
import { TiltDirective } from '../../shared/tilt/tilt.directive';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-movie',
  standalone: true,
  imports: [ScrollSection, MovieCard, TiltDirective, RouterLink],
  templateUrl: './movie.html',
  styleUrl: './movie.css',
})
export class Movie implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('heroEl') heroEl!: ElementRef<HTMLElement>;
  @ViewChild('posterEl') posterEl!: ElementRef<HTMLElement>;
  @ViewChild('rentBtn') rentBtn!: ElementRef<HTMLButtonElement>;

  movie: FilmeModel | undefined;
  similarMovies: FilmeModel[] = [];

  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private triggers: ScrollTrigger[] = [];

  constructor(
    private route: ActivatedRoute,
    private movieService: MovieService,
    private rentService: Rent,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = +params['id'];
      this.movieService.getMovie(id).subscribe((data) => {
        this.movie = data as FilmeModel;
      });
      this.movieService.getAllMovies().subscribe((movies) => {
        this.similarMovies = movies.filter((m) => m.id !== id).slice(0, 4);
      });
    });
  }

  navigate(id: number): void {
    this.router.navigate(['/movie', id]);
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!this.posterEl) return;

    this.ngZone.runOutsideAngular(() => {
      const tween = gsap.to(this.posterEl.nativeElement, {
        scrollTrigger: { trigger: this.heroEl.nativeElement, scrub: true },
        y: '20%',
        ease: 'none',
      });
      if (tween.scrollTrigger) this.triggers.push(tween.scrollTrigger);
    });
  }

  ngOnDestroy(): void {
    this.triggers.forEach((t) => t.kill());
  }

  getYear(): string {
    return this.movie ? new Date(this.movie.data_lancamento).getFullYear().toString() : '';
  }

  getPrice(): string {
    return this.movie?.preco_aluguel.toFixed(2).replace('.', ',') ?? '';
  }

  rentMovie(): void {
    if (!this.movie) return;
    if (this.rentBtn) this.rentBtn.nativeElement.disabled = true;

    this.rentService.getRents(this.movie.id).subscribe({
      next: (data: any) => {
        const iso = data.aluguel?.data_prevista_devolucao?.replace(/(\.\d{3})\d+/, '$1');
        alert(`Aluguel realizado! Código: ${data.pagamento?.aluguel_id} — Valor: R$ ${data.pagamento?.amount}`);
        if (iso) alert(`Previsão de devolução: ${new Date(iso)}`);
      },
      error: (error: any) => {
        if (error.status === 401) { alert('Usuário não autenticado'); return; }
        alert('Aluguel não realizado, tente novamente mais tarde');
      },
      complete: () => {
        if (this.rentBtn) this.rentBtn.nativeElement.disabled = false;
      },
    });
  }
}
```

- [ ] **Step 4: Update movie.html**

```html
@if (movie) {
  <section class="movie-hero" #heroEl>
    <div class="movie-hero-bg"></div>
    <div class="movie-hero-glow"></div>
    <div class="movie-hero-vignette"></div>

    <div class="movie-poster-float" #posterEl appTilt>
      <img [src]="movie.imagem_url" [alt]="movie.titulo" />
      <div class="poster-shine"></div>
    </div>

    <div class="movie-hero-content">
      <a class="back-link" routerLink="/">← Voltar</a>

      <div class="genre-tags">
        <span class="genre-tag primary">{{ movie.genero }}</span>
        <span class="genre-tag neutral">{{ getYear() }}</span>
        <span class="genre-tag neutral">{{ movie.duracao_minutos }} min</span>
      </div>

      <h1 class="movie-hero-title">{{ movie.titulo }}</h1>

      <div class="movie-meta">
        <span>{{ movie.diretor }}</span>
        <span class="sep">·</span>
        <span>{{ movie.classificacao_indicativa }}+</span>
      </div>

      <p class="movie-synopsis">{{ movie.sinopse }}</p>

      <div class="movie-actions">
        <button class="btn-rent-detail" (click)="rentMovie()" #rentBtn>
          Alugar por R$ {{ getPrice() }}
        </button>
      </div>
      <p class="access-note">Acesso por 48 horas após o aluguel</p>
    </div>
  </section>

  <app-scroll-section>
    <section class="details-section">
      <div class="details-grid">
        <div class="detail-block">
          <div class="detail-label">Direção</div>
          <div class="detail-value">{{ movie.diretor }}</div>
        </div>
        <div class="detail-block">
          <div class="detail-label">Gênero</div>
          <div class="detail-value">{{ movie.genero }}</div>
        </div>
        <div class="detail-block">
          <div class="detail-label">Duração</div>
          <div class="detail-value">{{ movie.duracao_minutos }} minutos</div>
        </div>
        <div class="detail-block">
          <div class="detail-label">Aluguel</div>
          <div class="detail-value">R$ {{ getPrice() }} · Acesso por 48h</div>
        </div>
      </div>
    </section>
  </app-scroll-section>

  @if (similarMovies.length > 0) {
    <app-scroll-section>
      <section class="similar-section">
        <div class="section-header">
          <span class="section-label">Você também pode gostar</span>
          <h2 class="section-title">Filmes Similares</h2>
          <div class="section-line"></div>
        </div>
        <div class="similar-grid">
          @for (m of similarMovies; track m.id) {
            <app-movie-card [movie]="m" (cardClick)="navigate($event)"></app-movie-card>
          }
        </div>
      </section>
    </app-scroll-section>
  }
}
```


- [ ] **Step 5: Update movie.css**

```css
.movie-hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.movie-hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1a0820 0%, #0a0514 40%, #0f0820 100%);
}

.movie-hero-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 40%, rgba(225, 29, 72, 0.18) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 60%, rgba(124, 58, 237, 0.2) 0%, transparent 55%);
}

.movie-hero-vignette {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to right, rgba(6, 6, 8, 0.97) 0%, rgba(6, 6, 8, 0.55) 55%, rgba(6, 6, 8, 0.1) 100%),
    linear-gradient(to top, rgba(6, 6, 8, 1) 0%, transparent 40%);
}

.movie-poster-float {
  position: absolute;
  right: 8%;
  top: 50%;
  transform: translateY(-50%) perspective(900px) rotateY(-10deg) rotateX(3deg);
  width: 260px;
  height: 390px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: -28px 28px 80px rgba(0, 0, 0, 0.8), 0 0 100px rgba(124, 58, 237, 0.14);
  border: 1px solid rgba(124, 58, 237, 0.2);
}
.movie-poster-float img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.poster-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, transparent 50%);
  pointer-events: none;
}

.movie-hero-content {
  position: relative;
  z-index: 2;
  padding: 0 60px 80px;
  max-width: 620px;
}

.back-link {
  display: inline-block;
  margin-bottom: 28px;
  font-size: 13px;
  color: var(--muted);
  text-decoration: none;
  transition: color var(--duration-base);
}
.back-link:hover { color: var(--text); }

.genre-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
.genre-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
.genre-tag.primary {
  background: rgba(225, 29, 72, 0.12);
  border: 1px solid rgba(225, 29, 72, 0.3);
  color: rgba(225, 29, 72, 0.9);
}
.genre-tag.neutral {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--muted);
}

.movie-hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 900;
  line-height: 1.05;
  color: #fff;
  font-family: Georgia, serif;
  margin: 0 0 12px;
  text-shadow: 0 4px 40px rgba(0, 0, 0, 0.6);
}

.movie-meta {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 16px;
  display: flex;
  gap: 10px;
}
.sep { color: rgba(255, 255, 255, 0.2); }

.movie-synopsis {
  font-size: 15px;
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 32px;
  max-width: 480px;
}

.movie-actions { margin-bottom: 12px; }
.btn-rent-detail {
  padding: 15px 36px;
  background: var(--gradient);
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 30px rgba(225, 29, 72, 0.4);
  transition: transform var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}
.btn-rent-detail:hover { transform: translateY(-2px); box-shadow: 0 8px 40px rgba(225, 29, 72, 0.5); }
.btn-rent-detail:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.access-note { font-size: 12px; color: rgba(255, 255, 255, 0.25); }

/* Details section */
.details-section {
  padding: 70px 60px;
  max-width: 1100px;
  margin: 0 auto;
}
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.detail-block {
  padding: 24px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  transition: border-color var(--duration-base);
}
.detail-block:hover { border-color: rgba(225, 29, 72, 0.2); }
.detail-label {
  font-size: 10px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--primary);
  margin-bottom: 8px;
}
.detail-value { font-size: 15px; color: rgba(255, 255, 255, 0.75); }

/* Similar section */
.similar-section {
  padding: 20px 60px 80px;
  max-width: 1100px;
  margin: 0 auto;
}
.similar-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 900px) {
  .similar-grid { grid-template-columns: repeat(2, 1fr); }
  .movie-hero-content { padding: 0 24px 60px; }
  .details-section, .similar-section { padding-left: 24px; padding-right: 24px; }
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd frontend/looker
npx ng test --include="**/movie.spec.ts" --watch=false --browsers=ChromeHeadless 2>&1 | tail -10
```

Expected: 5 specs, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add frontend/looker/src/components/movie/
git commit -m "feat: refactor Movie detail page with fullscreen hero and scroll reveal sections"
```

---

## Task 10: Refactor LoginComponent with Register Tabs

**Files:**
- Modify: `frontend/looker/src/components/login/login.ts`
- Modify: `frontend/looker/src/components/login/login.html`
- Modify: `frontend/looker/src/components/login/login.css`
- Modify: `frontend/looker/src/components/login/login.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `frontend/looker/src/components/login/login.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { RegisterModel } from '../../models/register-model';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let component: Login;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Login] }).compileComponents();
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should start on login tab', () => expect(component.activeTab).toBe('login'));

  it('should switch to register tab', () => {
    component.switchTab('register');
    expect(component.activeTab).toBe('register');
  });

  it('should switch back to login tab', () => {
    component.switchTab('register');
    component.switchTab('login');
    expect(component.activeTab).toBe('login');
  });

  it('should emit loginSubmit with credentials when login form is valid', () => {
    component.openModal();
    component.loginForm.setValue({ username: 'user@test.com', password: 'pass123', remember: false });
    let emitted: any;
    component.loginSubmit.subscribe((v: any) => (emitted = v));
    component.onSubmit();
    expect(emitted.username).toBe('user@test.com');
  });

  it('should not emit loginSubmit when form is invalid', () => {
    component.openModal();
    component.loginForm.setValue({ username: '', password: '', remember: false });
    let emitted = false;
    component.loginSubmit.subscribe(() => (emitted = true));
    component.onSubmit();
    expect(emitted).toBeFalse();
  });

  it('should emit registerSubmit with register data when register form is valid', () => {
    component.openModal();
    component.switchTab('register');
    component.registerForm.setValue({
      username: 'João', password: 'senha123456', email: 'joao@test.com',
      cpf: '12345678901', phone: '11999999999', dateOfBirth: '1990-01-01',
    });
    let emitted: RegisterModel | undefined;
    component.registerSubmit.subscribe((v: RegisterModel) => (emitted = v));
    component.onRegisterSubmit();
    expect(emitted?.email).toBe('joao@test.com');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend/looker
npx ng test --include="**/login.spec.ts" --watch=false --browsers=ChromeHeadless 2>&1 | tail -15
```

Expected: FAILED — `activeTab`, `switchTab`, `registerForm`, `onRegisterSubmit`, `registerSubmit` not defined.

- [ ] **Step 3: Update login.ts**

```typescript
import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RegisterModel } from '../../models/register-model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  @Output() loginSubmit = new EventEmitter<{ username: string; password: string; remember: boolean }>();
  @Output() registerSubmit = new EventEmitter<RegisterModel>();

  isVisible = false;
  activeTab: 'login' | 'register' = 'login';

  loginForm = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
    remember: new FormControl(false),
  });

  registerForm = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    cpf: new FormControl('', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]),
    phone: new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(11)]),
    dateOfBirth: new FormControl('', Validators.required),
  });

  openModal(): void {
    this.isVisible = true;
    setTimeout(() => document.getElementById('login-username')?.focus(), 300);
  }

  closeModal(): void {
    this.isVisible = false;
    this.loginForm.reset();
    this.registerForm.reset();
    this.activeTab = 'login';
  }

  switchTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loginSubmit.emit(this.loginForm.value as { username: string; password: string; remember: boolean });
      this.closeModal();
    }
  }

  onRegisterSubmit(): void {
    if (this.registerForm.valid) {
      const v = this.registerForm.value;
      const data: RegisterModel = {
        nome: v.username?.toString(),
        senha: v.password?.toString(),
        email: v.email?.toString(),
        cpf: v.cpf?.toString(),
        telefone: v.phone?.toString(),
        data_nascimento: new Date(v.dateOfBirth?.toString() ?? ''),
      };
      this.registerSubmit.emit(data);
      this.closeModal();
    }
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) this.closeModal();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isVisible) this.closeModal();
  }
}
```

- [ ] **Step 4: Update login.html**

```html
<div
  class="modal-overlay"
  [class.active]="isVisible"
  (click)="onOverlayClick($event)"
>
  <div class="modal" (click)="$event.stopPropagation()">
    <button class="modal-close" (click)="closeModal()">✕</button>

    <div class="modal-logo">LOOKER</div>
    <p class="modal-subtitle">Seu cinema pessoal</p>

    <div class="modal-tabs">
      <button
        class="tab"
        [class.active]="activeTab === 'login'"
        (click)="switchTab('login')"
      >Entrar</button>
      <button
        class="tab"
        [class.active]="activeTab === 'register'"
        (click)="switchTab('register')"
      >Criar conta</button>
    </div>

    @if (activeTab === 'login') {
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label class="form-label" for="login-username">Email</label>
          <input
            id="login-username"
            type="email"
            formControlName="username"
            class="form-input"
            placeholder="seu@email.com"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="login-password">Senha</label>
          <input
            id="login-password"
            type="password"
            formControlName="password"
            class="form-input"
            placeholder="••••••••"
          />
        </div>
        <button type="submit" class="btn-submit" [disabled]="!loginForm.valid">
          Entrar
        </button>
      </form>
    }

    @if (activeTab === 'register') {
      <form [formGroup]="registerForm" (ngSubmit)="onRegisterSubmit()">
        <div class="form-group">
          <label class="form-label" for="reg-name">Nome</label>
          <input id="reg-name" type="text" formControlName="username" class="form-input" placeholder="Seu nome" />
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-email">Email</label>
          <input id="reg-email" type="email" formControlName="email" class="form-input" placeholder="seu@email.com" />
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-password">Senha</label>
          <input id="reg-password" type="password" formControlName="password" class="form-input" placeholder="Mínimo 8 caracteres" />
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-cpf">CPF</label>
          <input id="reg-cpf" type="text" formControlName="cpf" class="form-input" placeholder="Somente números" />
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-phone">Telefone</label>
          <input id="reg-phone" type="tel" formControlName="phone" class="form-input" placeholder="Somente números" />
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-dob">Data de Nascimento</label>
          <input id="reg-dob" type="date" formControlName="dateOfBirth" class="form-input" />
        </div>
        <button type="submit" class="btn-submit" [disabled]="!registerForm.valid">
          Criar conta
        </button>
      </form>
    }
  </div>
</div>
```

- [ ] **Step 5: Update login.css**

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 6, 8, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--duration-base) ease;
}
.modal-overlay.active {
  opacity: 1;
  pointer-events: auto;
}

.modal {
  position: relative;
  width: 420px;
  max-width: calc(100vw - 32px);
  max-height: 90vh;
  overflow-y: auto;
  background: rgba(15, 12, 22, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.7), 0 0 80px rgba(124, 58, 237, 0.08);
  backdrop-filter: blur(20px);
}
.modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(225, 29, 72, 0.6), rgba(124, 58, 237, 0.6), transparent);
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  color: var(--muted);
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: color var(--duration-base), background var(--duration-base);
}
.modal-close:hover { color: var(--text); background: rgba(255, 255, 255, 0.06); }

.modal-logo {
  text-align: center;
  font-size: 1.4rem;
  font-weight: 900;
  letter-spacing: 2px;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 6px;
}
.modal-subtitle {
  text-align: center;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 28px;
}

.modal-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 4px;
  gap: 4px;
  margin-bottom: 24px;
}
.tab {
  flex: 1;
  padding: 9px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: all var(--duration-base) ease;
}
.tab.active {
  background: rgba(225, 29, 72, 0.12);
  border-color: rgba(225, 29, 72, 0.25);
  color: rgba(225, 29, 72, 0.9);
}

.form-group { margin-bottom: 14px; }
.form-label {
  display: block;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 6px;
}
.form-input {
  width: 100%;
  padding: 11px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9px;
  font-size: 14px;
  color: var(--text);
  outline: none;
  transition: border-color var(--duration-base), box-shadow var(--duration-base);
}
.form-input:focus {
  border-color: rgba(225, 29, 72, 0.4);
  box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.08);
}
.form-input::placeholder { color: rgba(255, 255, 255, 0.2); }

.btn-submit {
  width: 100%;
  margin-top: 8px;
  padding: 13px;
  background: var(--gradient);
  border: none;
  border-radius: 11px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(225, 29, 72, 0.3);
  transition: transform var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}
.btn-submit:hover { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(225, 29, 72, 0.4); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd frontend/looker
npx ng test --include="**/login.spec.ts" --watch=false --browsers=ChromeHeadless 2>&1 | tail -10
```

Expected: 7 specs, 0 failures.

- [ ] **Step 7: Run the full test suite**

```bash
cd frontend/looker
npx ng test --watch=false --browsers=ChromeHeadless 2>&1 | tail -20
```

Expected: all specs pass.

- [ ] **Step 8: Verify full build**

```bash
cd frontend/looker
npx ng build --configuration development 2>&1 | tail -10
```

Expected: build succeeds with no errors.

- [ ] **Step 9: Commit**

```bash
git add frontend/looker/src/components/login/
git commit -m "feat: refactor Login modal with glassmorphism and unified register tab"
```

---

## Self-Review Checklist

After completing all tasks, run:

```bash
cd frontend/looker
npx ng test --watch=false --browsers=ChromeHeadless 2>&1 | tail -5
npx ng build --configuration development 2>&1 | tail -5
```

Both must pass with zero errors before considering the implementation complete.
