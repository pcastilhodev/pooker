# Looker Frontend Redesign v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Traduzir os arquivos de referência cinemáticos (`Looker v2.html` + `Looker Film.html`) para Angular 20, preservando a lógica de API existente e adicionando GSAP para animações cinematográficas.

**Architecture:** Componentes atômicos standalone em `src/shared/` (ScrollRevealSection, MovieCard, FilmSnapSection, FilmIntro) são compostos pelo Dashboard e pela página de detalhe. GSAP roda fora do NgZone via `gsap.context()` para cleanup automático ao destruir componentes. `components/register` e `shared/register` são deletados — lógica absorvida pelo modal de login.

**Tech Stack:** Angular 20 standalone, GSAP 3 + ScrollTrigger, Bebas Neue + DM Sans (Google Fonts), TypeScript 5.9.

**Spec:** `docs/superpowers/specs/2026-04-21-looker-frontend-redesign-v2-design.md`

---

## File Map

```
frontend/looker/
├── package.json                                          MOD — add gsap
├── src/
│   ├── index.html                                        MOD — Google Fonts Bebas Neue + DM Sans
│   ├── styles.scss                                       MOD — design tokens v2, grain base, utilitários
│   ├── app/
│   │   ├── app.ts                                        MOD — GSAP register + grain canvas loop + reduced-motion
│   │   └── app.html                                      MOD — adiciona <canvas id="grain">
│   ├── shared/
│   │   ├── scroll-reveal-section/
│   │   │   ├── scroll-reveal-section.ts                  NEW — ScrollTrigger reveal wrapper (inline template)
│   │   │   └── scroll-reveal-section.spec.ts             NEW
│   │   ├── movie-card/
│   │   │   ├── movie-card.ts                             NEW — card do catálogo com imagem/SVG fallback
│   │   │   ├── movie-card.html                           NEW
│   │   │   ├── movie-card.css                            NEW
│   │   │   └── movie-card.spec.ts                        NEW
│   │   ├── film-snap-section/
│   │   │   ├── film-snap-section.ts                      NEW — seção 100vh com GSAP entrance
│   │   │   ├── film-snap-section.html                    NEW
│   │   │   ├── film-snap-section.css                     NEW
│   │   │   └── film-snap-section.spec.ts                 NEW
│   │   ├── film-intro/
│   │   │   ├── film-intro.ts                             NEW — overlay de intro animado
│   │   │   ├── film-intro.html                           NEW
│   │   │   ├── film-intro.css                            NEW
│   │   │   └── film-intro.spec.ts                        NEW
│   │   ├── header/
│   │   │   ├── header.ts                                 MOD — smart hide + abre login modal
│   │   │   ├── header.html                               MOD — novo template
│   │   │   ├── header.css                                MOD — glassmorphism
│   │   │   └── header.spec.ts                            MOD
│   │   └── register/                                     DELETED
│   └── components/
│       ├── dashboard/
│       │   ├── dashboard.ts                              MOD — snap logic + counter + browse grid
│       │   ├── dashboard.html                            MOD — novo template
│       │   ├── dashboard.css                             MOD — snap container + counter + UI
│       │   └── dashboard.spec.ts                         MOD
│       ├── movie/
│       │   ├── movie.ts                                  MOD — standalone + GSAP + similar + mock data
│       │   ├── movie.html                                MOD — 7 seções encadeadas
│       │   ├── movie.css                                 MOD — layout completo
│       │   └── movie.spec.ts                             MOD
│       ├── login/
│       │   ├── login.ts                                  MOD — tabs + register form absorvido
│       │   ├── login.html                                MOD — glassmorphism + tabs
│       │   ├── login.css                                 MOD — modal styles
│       │   └── login.spec.ts                             MOD
│       └── register/                                     DELETED
```

---

## Task 1: Setup — GSAP, Fontes, Tokens, Grain Canvas

**Files:**
- Modify: `frontend/looker/package.json` (via npm)
- Modify: `frontend/looker/src/index.html`
- Modify: `frontend/looker/src/styles.scss`
- Modify: `frontend/looker/src/app/app.ts`
- Modify: `frontend/looker/src/app/app.html`

- [ ] **Step 1: Instalar GSAP**

```bash
cd frontend/looker
npm install gsap
```

Expected: `gsap` aparece em `dependencies` no `package.json`.

- [ ] **Step 2: Adicionar fontes ao `src/index.html`**

Substituir o conteúdo de `src/index.html`:

```html
<!doctype html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <title>Looker</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap" rel="stylesheet">
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

- [ ] **Step 3: Reescrever `src/styles.scss` com tokens v2**

```scss
/* ====== Reset ====== */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ====== Tokens ====== */
:root {
  --bg:          #090810;
  --bg-elev:     #0c0b18;
  --card:        #0f0e1c;
  --border:      rgba(255, 255, 255, 0.06);
  --fg:          #f0eee8;
  --muted:       #6a6870;
  --primary:     #e11d48;
  --primary-end: #7c3aed;
  --gradient:    linear-gradient(90deg, #e11d48, #7c3aed);
  --glow-red:    rgba(225, 29, 72, 0.18);
  --glow-purple: rgba(124, 58, 237, 0.18);
  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
}

html, body {
  height: 100%;
  background: var(--bg);
  color: var(--fg);
  font-family: 'DM Sans', sans-serif;
  overflow: hidden;
}

/* ====== Grain ====== */
#grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9000;
  opacity: 0.06;
  mix-blend-mode: overlay;
}

/* ====== Focus ====== */
button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* ====== Scrollbar ====== */
*::-webkit-scrollbar { width: 6px; height: 6px; }
*::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
*::-webkit-scrollbar-track { background: transparent; }

/* ====== Reduced motion ====== */
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 4: Atualizar `src/app/app.html` para adicionar canvas do grain**

```html
<canvas id="grain"></canvas>
<app-header></app-header>
<router-outlet></router-outlet>
```

- [ ] **Step 5: Atualizar `src/app/app.ts` — registrar GSAP, iniciar grain canvas**

```typescript
import { Component, AfterViewInit, NgZone } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../shared/header/header';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit {
  constructor(private zone: NgZone) {}

  ngAfterViewInit() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.globalTimeline.timeScale(0);
    }
    this.zone.runOutsideAngular(() => this.startGrain());
  }

  private startGrain() {
    const canvas = document.getElementById('grain') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    let w = 0, h = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const tick = () => {
      if (!w || !h) { requestAnimationFrame(tick); return; }
      const d = ctx.createImageData(w, h);
      const b = d.data;
      for (let i = 0; i < b.length; i += 4) {
        const v = Math.random() * 255;
        b[i] = b[i + 1] = b[i + 2] = v;
        b[i + 3] = 16 + Math.random() * 22;
      }
      ctx.putImageData(d, 0, 0);
      requestAnimationFrame(tick);
    };
    tick();
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/looker/package.json frontend/looker/package-lock.json \
        frontend/looker/src/index.html frontend/looker/src/styles.scss \
        frontend/looker/src/app/app.ts frontend/looker/src/app/app.html
git commit -m "feat: setup GSAP, Bebas Neue/DM Sans fonts, design tokens v2, grain canvas"
```

---

## Task 2: `scroll-reveal-section` Shared Component

**Files:**
- Create: `frontend/looker/src/shared/scroll-reveal-section/scroll-reveal-section.ts`
- Create: `frontend/looker/src/shared/scroll-reveal-section/scroll-reveal-section.spec.ts`

- [ ] **Step 1: Escrever o teste**

```typescript
// scroll-reveal-section.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ScrollRevealSection } from './scroll-reveal-section';

@Component({
  standalone: true,
  imports: [ScrollRevealSection],
  template: `<app-scroll-reveal-section><p class="child">hello</p></app-scroll-reveal-section>`
})
class HostComponent {}

describe('ScrollRevealSection', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should project content', () => {
    expect(fixture.nativeElement.querySelector('.child')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```bash
cd frontend/looker
npx ng test --include="**/scroll-reveal-section.spec.ts" --watch=false
```

Expected: FAILED — `ScrollRevealSection` não encontrado.

- [ ] **Step 3: Implementar o componente**

```typescript
// scroll-reveal-section.ts
import { Component, ElementRef, NgZone, AfterViewInit, OnDestroy } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-scroll-reveal-section',
  standalone: true,
  template: `<ng-content />`,
  styles: [`:host { display: block; }`]
})
export class ScrollRevealSection implements AfterViewInit, OnDestroy {
  private ctx!: gsap.Context;

  constructor(private el: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      const host = this.el.nativeElement;
      const children = Array.from(host.children) as Element[];
      if (!children.length) return;

      this.ctx = gsap.context(() => {
        gsap.from(children, {
          scrollTrigger: { trigger: host, start: 'top 85%' },
          opacity: 0,
          y: 40,
          stagger: 0.08,
          duration: 0.7,
          ease: 'power3.out'
        });
      });
    });
  }

  ngOnDestroy() { this.ctx?.revert(); }
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

```bash
npx ng test --include="**/scroll-reveal-section.spec.ts" --watch=false
```

Expected: 2 specs, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add frontend/looker/src/shared/scroll-reveal-section/
git commit -m "feat: add scroll-reveal-section shared component"
```

---

## Task 3: `movie-card` Shared Component

**Files:**
- Create: `frontend/looker/src/shared/movie-card/movie-card.ts`
- Create: `frontend/looker/src/shared/movie-card/movie-card.html`
- Create: `frontend/looker/src/shared/movie-card/movie-card.css`
- Create: `frontend/looker/src/shared/movie-card/movie-card.spec.ts`

- [ ] **Step 1: Escrever o teste**

```typescript
// movie-card.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovieCard } from './movie-card';
import { FilmeModel } from '../../models/filme-model';
import { Router } from '@angular/router';

const mockFilm: FilmeModel = {
  id: 1, titulo: 'The Brutalist', genero: 'Drama', ano: new Date('2024-01-01'),
  preco_aluguel: 12.90, sinopse: 'Test', imagem_url: '', duracao_minutos: 215,
  classificacao_indicativa: '16', data_lancamento: new Date('2024-01-01'),
  total_copias: 10, diretor: 'Brady Corbet', copias_disponiveis: 5
};

describe('MovieCard', () => {
  let component: MovieCard;
  let fixture: ComponentFixture<MovieCard>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    await TestBed.configureTestingModule({
      imports: [MovieCard],
      providers: [{ provide: Router, useValue: routerSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(MovieCard);
    component = fixture.componentInstance;
    component.film = mockFilm;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should display film title', () => {
    expect(fixture.nativeElement.querySelector('.card-name').textContent.trim()).toBe('The Brutalist');
  });

  it('should navigate to film detail on click', () => {
    fixture.nativeElement.querySelector('.browse-card').click();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/movie/1']);
  });

  it('should use gradient SVG when imagem_url is empty', () => {
    expect(fixture.nativeElement.querySelector('svg')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('should use img when imagem_url is set', () => {
    component.film = { ...mockFilm, imagem_url: 'https://example.com/poster.jpg' };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Rodar teste para confirmar que falha**

```bash
npx ng test --include="**/movie-card.spec.ts" --watch=false
```

Expected: FAILED.

- [ ] **Step 3: Implementar `movie-card.ts`**

```typescript
// movie-card.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FilmeModel } from '../../models/filme-model';

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

  constructor(private router: Router) {}

  get palette() { return PALETTES[this.film.id % 6]; }

  navigate() { this.router.navigate([`/movie/${this.film.id}`]); }
}
```

- [ ] **Step 4: Implementar `movie-card.html`**

```html
<div class="browse-card" (click)="navigate()">
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
        <pattern [id]="'pat'+film.id" patternUnits="userSpaceOnUse" width="4" height="4">
          <line x1="0" y1="4" x2="4" y2="0" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="160" height="240" [attr.fill]="'url(#bg'+film.id+')'"/>
      <rect width="160" height="240" [attr.fill]="'url(#pat'+film.id+')'"/>
      <text x="80" y="120" text-anchor="middle" dominant-baseline="middle"
            font-family="Georgia" font-style="italic" font-size="9"
            fill="rgba(255,255,255,0.15)" letter-spacing="1">
        {{ film.titulo.toUpperCase().slice(0, 12) }}
      </text>
    </svg>
    <div class="poster-shine"></div>
  </div>
  <div class="card-name">{{ film.titulo }}</div>
  <div class="card-genre">{{ film.genero }}</div>
</div>
```

- [ ] **Step 5: Implementar `movie-card.css`**

```css
.browse-card {
  cursor: pointer;
}

.browse-poster {
  width: 100%;
  aspect-ratio: 2/3;
  overflow: hidden;
  margin-bottom: 10px;
  position: relative;
  background: var(--card);
}

.browse-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.browse-poster:hover .poster-shine {
  opacity: 1;
  transform: translateX(100%);
}

.poster-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%);
  transform: translateX(-100%);
  opacity: 0;
  transition: transform 0.5s, opacity 0.3s;
}

.card-name {
  font-size: 12px;
  font-weight: 500;
  color: rgba(240,238,232,0.75);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-genre {
  font-size: 10px;
  color: var(--muted);
  margin-top: 3px;
  letter-spacing: 0.05em;
}
```

- [ ] **Step 6: Rodar testes**

```bash
npx ng test --include="**/movie-card.spec.ts" --watch=false
```

Expected: 5 specs, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add frontend/looker/src/shared/movie-card/
git commit -m "feat: add movie-card shared component with image/SVG fallback"
```

---

## Task 4: `film-snap-section` Shared Component

**Files:**
- Create: `frontend/looker/src/shared/film-snap-section/film-snap-section.ts`
- Create: `frontend/looker/src/shared/film-snap-section/film-snap-section.html`
- Create: `frontend/looker/src/shared/film-snap-section/film-snap-section.css`
- Create: `frontend/looker/src/shared/film-snap-section/film-snap-section.spec.ts`

- [ ] **Step 1: Escrever o teste**

```typescript
// film-snap-section.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilmSnapSection } from './film-snap-section';
import { FilmeModel } from '../../models/filme-model';
import { Router } from '@angular/router';

const mockFilm: FilmeModel = {
  id: 2, titulo: 'ANORA', genero: 'Romance', ano: new Date('2024-01-01'),
  preco_aluguel: 9.90, sinopse: 'Test', imagem_url: '', duracao_minutos: 139,
  classificacao_indicativa: '18', data_lancamento: new Date('2024-01-01'),
  total_copias: 8, diretor: 'Sean Baker', copias_disponiveis: 3
};

describe('FilmSnapSection', () => {
  let component: FilmSnapSection;
  let fixture: ComponentFixture<FilmSnapSection>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    await TestBed.configureTestingModule({
      imports: [FilmSnapSection],
      providers: [{ provide: Router, useValue: routerSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(FilmSnapSection);
    component = fixture.componentInstance;
    component.film = mockFilm;
    component.index = 0;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should display film title', () => {
    const title = fixture.nativeElement.querySelector('.film-title');
    expect(title.textContent.trim()).toContain('ANORA');
  });

  it('should display director', () => {
    expect(fixture.nativeElement.querySelector('.film-director').textContent).toContain('Sean Baker');
  });

  it('should navigate to movie detail on primary button click', () => {
    fixture.nativeElement.querySelector('.film-action-primary').click();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/movie/2']);
  });
});
```

- [ ] **Step 2: Rodar teste para confirmar que falha**

```bash
npx ng test --include="**/film-snap-section.spec.ts" --watch=false
```

Expected: FAILED.

- [ ] **Step 3: Implementar `film-snap-section.ts`**

```typescript
// film-snap-section.ts
import {
  Component, Input, Output, EventEmitter,
  AfterViewInit, OnDestroy, ElementRef, NgZone, ViewChild
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FilmeModel } from '../../models/filme-model';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const PALETTES = [
  { c1: '#0e0818', c2: '#1a0e2e', c3: '#2a1240', accent: 'rgba(120,80,200,0.28)' },
  { c1: '#0d1520', c2: '#0a2035', c3: '#153050', accent: 'rgba(40,100,180,0.25)' },
  { c1: '#120c08', c2: '#1e1208', c3: '#2e1c0c', accent: 'rgba(160,80,20,0.2)'  },
  { c1: '#0a0c10', c2: '#101520', c3: '#182030', accent: 'rgba(60,80,120,0.2)'  },
  { c1: '#0f0c06', c2: '#1c1808', c3: '#2e2810', accent: 'rgba(180,140,40,0.2)' },
  { c1: '#060e14', c2: '#08182a', c3: '#0c2040', accent: 'rgba(20,80,140,0.3)'  },
];

@Component({
  selector: 'app-film-snap-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './film-snap-section.html',
  styleUrl: './film-snap-section.css'
})
export class FilmSnapSection implements AfterViewInit, OnDestroy {
  @Input() film!: FilmeModel;
  @Input() index = 0;
  @Input() scroller = '#scroll-container';

  @ViewChild('bg')      bgEl!: ElementRef;
  @ViewChild('label')   labelEl!: ElementRef;
  @ViewChild('title')   titleEl!: ElementRef;
  @ViewChild('meta')    metaEl!: ElementRef;
  @ViewChild('actions') actionsEl!: ElementRef;
  @ViewChild('section') sectionEl!: ElementRef;

  private ctx!: gsap.Context;

  constructor(private router: Router, private zone: NgZone) {}

  get palette() { return PALETTES[this.film.id % 6]; }
  get gradId()  { return 'fg' + this.film.id; }
  get radId()   { return 'rg' + this.film.id; }

  get filmYear(): number {
    const d = this.film.ano;
    return d instanceof Date ? d.getFullYear() : new Date(d).getFullYear();
  }

  navigateToDetail() { this.router.navigate([`/movie/${this.film.id}`]); }

  animate() {
    if (!this.bgEl) return;
    this.zone.runOutsideAngular(() => {
      const bg      = this.bgEl.nativeElement;
      const label   = this.labelEl.nativeElement;
      const title   = this.titleEl.nativeElement;
      const meta    = this.metaEl.nativeElement;
      const actions = this.actionsEl.nativeElement;

      gsap.fromTo(bg,
        { scale: 1.14, filter: 'blur(14px)' },
        { scale: 1, filter: 'blur(0px)', duration: 1.05, ease: 'power4.out' }
      );
      gsap.fromTo(label,
        { opacity: 0, x: -36 },
        { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out', delay: 0.08 }
      );
      gsap.fromTo(title,
        { opacity: 0, y: 72, scale: 0.93, transformOrigin: 'left bottom' },
        { opacity: 1, y: 0, scale: 1, duration: 0.68, ease: 'power4.out', delay: 0.14 }
      );
      gsap.fromTo(meta,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.3 }
      );
      gsap.fromTo(actions,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.4 }
      );
    });
  }

  leave() {
    const label   = this.labelEl?.nativeElement;
    const title   = this.titleEl?.nativeElement;
    const meta    = this.metaEl?.nativeElement;
    const actions = this.actionsEl?.nativeElement;
    gsap.to([label, meta, actions], { opacity: 0, y: -16, duration: 0.35, ease: 'power2.in' });
    gsap.to(title, { opacity: 0, y: -30, duration: 0.4, ease: 'power2.in' });
  }

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      this.ctx = gsap.context(() => {
        gsap.to(this.bgEl.nativeElement, {
          yPercent: 15,
          ease: 'none',
          scrollTrigger: {
            trigger: this.sectionEl.nativeElement,
            scroller: this.scroller,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          }
        });
      });
    });
  }

  ngOnDestroy() { this.ctx?.revert(); }
}
```

- [ ] **Step 4: Implementar `film-snap-section.html`**

```html
<div class="film-section" #section>
  <div class="film-bg" #bg>
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient [id]="gradId" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   [attr.stop-color]="palette.c1"/>
          <stop offset="60%"  [attr.stop-color]="palette.c2"/>
          <stop offset="100%" [attr.stop-color]="palette.c3"/>
        </linearGradient>
        <radialGradient [id]="radId" cx="70%" cy="35%" r="65%">
          <stop offset="0%"   [attr.stop-color]="palette.accent"/>
          <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="900" [attr.fill]="'url(#'+gradId+')'"/>
      <rect width="1600" height="900" [attr.fill]="'url(#'+radId+')'"/>
      <line x1="10%" y1="20%" x2="90%" y2="80%" stroke="rgba(255,255,255,0.025)" stroke-width="1"/>
      <line x1="30%" y1="0"   x2="70%" y2="100%" stroke="rgba(255,255,255,0.018)" stroke-width="1"/>
      <text x="1050" y="480" text-anchor="middle" dominant-baseline="middle"
            font-family="Georgia,serif" font-style="italic" font-size="200"
            fill="rgba(255,255,255,0.012)" letter-spacing="-5">
        {{ film.titulo.slice(0,8).toUpperCase() }}
      </text>
    </svg>
  </div>

  <div class="film-vignette"></div>

  <div class="film-content">
    <div class="film-label" #label>
      {{ film.genero }}
    </div>
    <h2 class="film-title" #title>{{ film.titulo.toUpperCase() }}</h2>
    <div class="film-meta" #meta>
      <span class="film-year">{{ filmYear }}</span>
      <span class="film-sep">·</span>
      <span class="film-director">{{ film.diretor }}</span>
      <span class="film-sep">·</span>
      <span class="film-class">{{ film.classificacao_indicativa }}</span>
    </div>
    <div class="film-actions" #actions>
      <button class="film-action-primary" (click)="navigateToDetail()">
        Ver Detalhes
      </button>
      <button class="film-action-secondary">+ Watchlist</button>
    </div>
  </div>
</div>
```

- [ ] **Step 5: Implementar `film-snap-section.css`**

```css
.film-section {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  will-change: transform;
}

.film-bg {
  position: absolute;
  inset: 0;
  will-change: transform;
}

.film-bg svg { width: 100%; height: 100%; display: block; }

.film-vignette {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at center, transparent 30%, rgba(9,8,16,0.55) 100%),
    linear-gradient(to top, rgba(9,8,16,0.96) 0%, rgba(9,8,16,0.3) 30%, transparent 60%),
    linear-gradient(to right, rgba(9,8,16,0.7) 0%, transparent 50%);
}

.film-content {
  position: relative;
  z-index: 2;
  padding: 0 52px 72px;
  max-width: 780px;
}

.film-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  opacity: 0;
}

.film-label::after {
  content: '';
  display: block;
  width: 36px;
  height: 1px;
  background: var(--primary);
  opacity: 0.6;
  -webkit-text-fill-color: initial;
}

.film-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(72px, 9vw, 140px);
  line-height: 0.9;
  letter-spacing: 0.01em;
  margin-bottom: 20px;
  opacity: 0;
  transform: translateY(50px);
  color: var(--fg);
}

.film-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
  opacity: 0;
  transform: translateY(20px);
  font-size: 12px;
  color: rgba(240,238,232,0.4);
}

.film-sep { opacity: 0.3; }

.film-actions {
  display: flex;
  gap: 28px;
  align-items: center;
  opacity: 0;
  transform: translateY(20px);
}

.film-action-primary {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--fg);
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: gap 0.25s;
}

.film-action-primary::after { content: '→'; font-size: 14px; }
.film-action-primary:hover { gap: 18px; }

.film-action-secondary {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(240,238,232,0.4);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
}

.film-action-secondary:hover { color: var(--fg); }
```

- [ ] **Step 6: Rodar testes**

```bash
npx ng test --include="**/film-snap-section.spec.ts" --watch=false
```

Expected: 4 specs, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add frontend/looker/src/shared/film-snap-section/
git commit -m "feat: add film-snap-section shared component with GSAP parallax entrance"
```

---

## Task 5: `film-intro` Shared Component

**Files:**
- Create: `frontend/looker/src/shared/film-intro/film-intro.ts`
- Create: `frontend/looker/src/shared/film-intro/film-intro.html`
- Create: `frontend/looker/src/shared/film-intro/film-intro.css`
- Create: `frontend/looker/src/shared/film-intro/film-intro.spec.ts`

- [ ] **Step 1: Escrever o teste**

```typescript
// film-intro.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilmIntro } from './film-intro';

describe('FilmIntro', () => {
  let component: FilmIntro;
  let fixture: ComponentFixture<FilmIntro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FilmIntro] }).compileComponents();
    fixture = TestBed.createComponent(FilmIntro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should emit dismissed when dismiss() is called', () => {
    let emitted = false;
    component.dismissed.subscribe(() => emitted = true);
    component.dismiss();
    expect(emitted).toBeTrue();
  });

  it('should emit dismissed when overlay is clicked', () => {
    let emitted = false;
    component.dismissed.subscribe(() => emitted = true);
    fixture.nativeElement.querySelector('#intro').click();
    expect(emitted).toBeTrue();
  });
});
```

- [ ] **Step 2: Rodar teste para confirmar que falha**

```bash
npx ng test --include="**/film-intro.spec.ts" --watch=false
```

Expected: FAILED.

- [ ] **Step 3: Implementar `film-intro.ts`**

```typescript
// film-intro.ts
import {
  Component, Output, EventEmitter, AfterViewInit, OnDestroy, NgZone, HostListener
} from '@angular/core';
import { gsap } from 'gsap';

@Component({
  selector: 'app-film-intro',
  standalone: true,
  templateUrl: './film-intro.html',
  styleUrl: './film-intro.css'
})
export class FilmIntro implements AfterViewInit, OnDestroy {
  @Output() dismissed = new EventEmitter<void>();

  private tl!: gsap.core.Timeline;
  private dismissed$ = false;

  constructor(private zone: NgZone) {}

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => this.play());
  }

  private play() {
    this.tl = gsap.timeline({ onComplete: () => this.dismiss() });

    this.tl.to('#intro-line-fill', { width: '100%', duration: 0.7, ease: 'power2.inOut' }, 0.3);
    this.tl.to('#intro-logo', { clipPath: 'inset(0 0% 0 0)', duration: 1.0, ease: 'power4.out' }, 0.55);
    this.tl.to('#intro-tagline', { opacity: 1, duration: 0.7, ease: 'power2.out' }, 1.3);
    this.tl.to('#intro-hint', { opacity: 1, duration: 0.6, ease: 'power2.out' }, 1.75);
    this.tl.add(() => {}, '+=1.2');
  }

  dismiss() {
    if (this.dismissed$) return;
    this.dismissed$ = true;
    this.tl?.kill();
    gsap.to('#intro', {
      scale: 1.06, opacity: 0, duration: 0.6, ease: 'power3.in',
      onComplete: () => this.dismissed.emit()
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) { this.dismiss(); }

  ngOnDestroy() { this.tl?.kill(); }
}
```

- [ ] **Step 4: Implementar `film-intro.html`**

```html
<div id="intro" (click)="dismiss()">
  <div id="intro-line-wrap"><div id="intro-line-fill"></div></div>
  <div id="intro-logo">LOOKER</div>
  <div id="intro-tagline">Cada frame. Cada emoção.</div>
  <div id="intro-hint">— Role para explorar —</div>
</div>
```

- [ ] **Step 5: Implementar `film-intro.css`**

```css
#intro {
  position: fixed;
  inset: 0;
  background: var(--bg);
  z-index: 8000;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  cursor: pointer;
}

#intro-line-wrap {
  width: 80px;
  height: 1px;
  overflow: hidden;
  margin-bottom: 36px;
  position: relative;
  background: rgba(255,255,255,0.08);
}

#intro-line-fill {
  position: absolute;
  top: 0; left: 0;
  height: 100%;
  width: 0%;
  background: var(--gradient);
}

#intro-logo {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(90px, 12vw, 160px);
  letter-spacing: 0.18em;
  color: var(--fg);
  clip-path: inset(0 100% 0 0);
  line-height: 0.9;
  text-align: center;
}

#intro-tagline {
  font-size: 12px;
  font-weight: 300;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(240,238,232,0.4);
  margin-top: 22px;
  opacity: 0;
}

#intro-hint {
  position: absolute;
  bottom: 52px;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(240,238,232,0.28);
  opacity: 0;
}
```

- [ ] **Step 6: Rodar testes**

```bash
npx ng test --include="**/film-intro.spec.ts" --watch=false
```

Expected: 3 specs, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add frontend/looker/src/shared/film-intro/
git commit -m "feat: add film-intro animated overlay component"
```

---

## Task 6: Header Refactor

**Files:**
- Modify: `frontend/looker/src/shared/header/header.ts`
- Modify: `frontend/looker/src/shared/header/header.html`
- Modify: `frontend/looker/src/shared/header/header.css`
- Modify: `frontend/looker/src/shared/header/header.spec.ts`

- [ ] **Step 1: Escrever os testes**

```typescript
// header.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Header } from './header';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [{ provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) }]
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should start with scrolled = false', () => {
    expect(component.scrolled).toBeFalse();
  });

  it('should set scrolled = true when scrollY > 40', () => {
    component.onScroll({ scrollTop: 50 } as any);
    expect(component.scrolled).toBeTrue();
  });

  it('should hide header when scrolling down past threshold', () => {
    component.onScroll({ scrollTop: 100 } as any);
    component.onScroll({ scrollTop: 200 } as any);
    expect(component.hidden).toBeTrue();
  });

  it('should show header when scrolling up', () => {
    component.onScroll({ scrollTop: 200 } as any);
    component.onScroll({ scrollTop: 100 } as any);
    expect(component.hidden).toBeFalse();
  });

  it('should open login modal when openLogin() is called', () => {
    component.openLogin();
    expect(component.loginVisible).toBeTrue();
  });
});
```

- [ ] **Step 2: Rodar testes para confirmar que falham**

```bash
npx ng test --include="**/header.spec.ts" --watch=false
```

Expected: múltiplos failures.

- [ ] **Step 3: Implementar `header.ts`**

```typescript
// header.ts
import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Login } from '../../components/login/login';
import { LoginService } from '../../services/login-service';
import { RegisterModel } from '../../models/register-model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, Login],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  scrolled  = false;
  hidden    = false;
  loginVisible = false;

  private lastScrollTop = 0;
  private readonly SCROLL_THRESHOLD = 40;
  private readonly HIDE_THRESHOLD   = 80;

  constructor(private router: Router, private loginService: LoginService) {}

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

  handleLogin(event: { username: string; password: string; remember: boolean }) {
    this.loginService.authenticate(event.username, event.password).subscribe({
      next: (res: any) => {
        localStorage.setItem('jwt', String(res.token));
        this.closeLogin();
      },
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

- [ ] **Step 4: Implementar `header.html`**

```html
<nav [class.scrolled]="scrolled" [class.hidden]="hidden">
  <div class="nav-logo" (click)="router.navigate([''])">LOOKER</div>
  <div class="nav-right">
    <a routerLink="/" class="nav-link">Filmes</a>
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

- [ ] **Step 5: Implementar `header.css`**

```css
nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 200;
  padding: 28px 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.3s, transform 0.3s;
}

nav.scrolled {
  background: rgba(9,8,16,0.88);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--border);
  padding: 18px 52px;
}

nav.hidden { transform: translateY(-100%); }

.nav-logo {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 22px;
  letter-spacing: 0.2em;
  color: var(--fg);
  cursor: pointer;
  opacity: 0.9;
}

.nav-right {
  display: flex;
  gap: 32px;
  align-items: center;
}

.nav-link {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(240,238,232,0.4);
  text-decoration: none;
  transition: color 0.2s;
}

.nav-link:hover { color: var(--fg); }

.nav-enter {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(240,238,232,0.6);
  background: none;
  border: 1px solid rgba(240,238,232,0.15);
  padding: 9px 22px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-enter:hover {
  color: var(--fg);
  border-color: rgba(240,238,232,0.5);
}
```

- [ ] **Step 6: Rodar testes**

```bash
npx ng test --include="**/header.spec.ts" --watch=false
```

Expected: 6 specs, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add frontend/looker/src/shared/header/
git commit -m "feat: refactor header with smart hide and glassmorphism"
```

---

## Task 7: Dashboard Refactor

**Files:**
- Modify: `frontend/looker/src/components/dashboard/dashboard.ts`
- Modify: `frontend/looker/src/components/dashboard/dashboard.html`
- Modify: `frontend/looker/src/components/dashboard/dashboard.css`
- Modify: `frontend/looker/src/components/dashboard/dashboard.spec.ts`

- [ ] **Step 1: Escrever os testes**

```typescript
// dashboard.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { MovieService } from '../../services/movie-service';
import { of } from 'rxjs';
import { FilmeModel } from '../../models/filme-model';
import { ActivatedRoute, Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

const makeFilm = (id: number): FilmeModel => ({
  id, titulo: `Filme ${id}`, genero: 'Drama', ano: new Date('2024-01-01'),
  preco_aluguel: 10, sinopse: '', imagem_url: '', duracao_minutos: 120,
  classificacao_indicativa: '12', data_lancamento: new Date('2024-01-01'),
  total_copias: 5, diretor: 'Dir', copias_disponiveis: 3
});

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
        { provide: MovieService, useValue: movieSpy },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
});
```

- [ ] **Step 2: Rodar testes para confirmar que falham**

```bash
npx ng test --include="**/dashboard.spec.ts" --watch=false
```

Expected: FAILED.

- [ ] **Step 3: Implementar `dashboard.ts`**

```typescript
// dashboard.ts
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
import { FilmSnapSection } from '../../shared/film-snap-section/film-snap-section';
import { FilmIntro } from '../../shared/film-intro/film-intro';
import { MovieCard } from '../../shared/movie-card/movie-card';
import { ScrollRevealSection } from '../../shared/scroll-reveal-section/scroll-reveal-section';

const MAX_SNAP = 6;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FilmSnapSection, FilmIntro, MovieCard, ScrollRevealSection],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  films: FilmeModel[]       = [];
  snapFilms: FilmeModel[]   = [];
  currentIndex              = 0;
  showIntro                 = true;
  navVisible                = false;

  @ViewChild('scrollContainer') scrollContainerRef!: ElementRef<HTMLElement>;
  @ViewChildren(FilmSnapSection) snapSections!: QueryList<FilmSnapSection>;

  private subs      = new Subscription();
  private ctx!:       gsap.Context;
  private isAnimating = false;
  private wheelTimer: any;

  constructor(
    private movieService: MovieService,
    private router:       Router,
    private route:        ActivatedRoute,
    private zone:         NgZone
  ) {}

  ngOnInit() {
    this.loadMovies();
    this.subs.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => this.loadMovies())
    );
  }

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      this.ctx = gsap.context(() => {
        ScrollTrigger.refresh();
      });
    });
  }

  loadMovies() {
    this.movieService.getAllMovies().subscribe((data: FilmeModel[]) => {
      const q = this.route.snapshot.queryParams['q'];
      this.films = q
        ? data.filter(m => m.titulo.toLowerCase().includes(q.toLowerCase()))
        : data;
      this.snapFilms = this.films.slice(0, MAX_SNAP);
    });
  }

  onIntroDismissed() {
    this.showIntro   = false;
    this.navVisible  = true;
    setTimeout(() => {
      const sections = this.snapSections.toArray();
      if (sections[0]) sections[0].animate();
    }, 50);
  }

  snapToSection(index: number) {
    const max = this.snapFilms.length - 1;
    if (index < 0) index = 0;
    if (index > max) index = max;
    if (index === this.currentIndex) return;

    const sections = this.snapSections.toArray();
    sections[this.currentIndex]?.leave();
    this.currentIndex = index;

    const sc = this.scrollContainerRef?.nativeElement;
    if (sc) sc.scrollTo({ top: index * window.innerHeight, behavior: 'smooth' });

    setTimeout(() => sections[index]?.animate(), 300);
  }

  onWheel(e: WheelEvent) {
    e.preventDefault();
    clearTimeout(this.wheelTimer);
    this.wheelTimer = setTimeout(() => {
      const dir = e.deltaY > 0 ? 1 : -1;
      const browseTop = document.getElementById('browseSection')?.getBoundingClientRect().top ?? 0;

      if (this.currentIndex < this.snapFilms.length - 1 || dir < 0) {
        this.snapToSection(this.currentIndex + dir);
      } else {
        this.scrollContainerRef.nativeElement.scrollBy({ top: e.deltaY * 3, behavior: 'smooth' });
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

- [ ] **Step 4: Implementar `dashboard.html`**

```html
<app-film-intro *ngIf="showIntro" (dismissed)="onIntroDismissed()"></app-film-intro>

<div id="scroll-container" #scrollContainer
     (wheel)="onWheel($event)">

  <!-- SNAP SECTIONS -->
  <div id="films-container">
    <app-film-snap-section
      *ngFor="let film of snapFilms; let i = index"
      [film]="film"
      [index]="i"
      scroller="#scroll-container">
    </app-film-snap-section>
  </div>

  <!-- BROWSE GRID -->
  <div class="browse-section" id="browseSection">
    <div class="browse-sub">Catálogo completo</div>
    <div class="browse-title">TODOS OS FILMES</div>
    <app-scroll-reveal-section>
      <div class="browse-grid">
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
         class="counter-dot"
         [class.active]="i === currentIndex"
         (click)="snapToSection(i)">
    </div>
  </div>
</div>

<!-- SCROLL HINT -->
<div id="scroll-hint"
     [style.opacity]="navVisible ? '1' : '0'"
     [class.hidden]="currentIndex > 1">
  <div class="scroll-line"></div>
  Rolar
</div>
```

- [ ] **Step 5: Implementar `dashboard.css`**

```css
#scroll-container {
  position: fixed;
  inset: 0;
  overflow-y: scroll;
  scrollbar-width: none;
}

#scroll-container::-webkit-scrollbar { display: none; }

#films-container { position: relative; }

/* ─── BROWSE ─── */
.browse-section {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: var(--bg);
  padding: 100px 52px 80px;
}

.browse-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 56px;
  letter-spacing: 0.04em;
  color: var(--fg);
  margin-bottom: 8px;
}

.browse-sub {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 4px;
}

.browse-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-top: 40px;
}

/* ─── COUNTER ─── */
#counter {
  position: fixed;
  bottom: 36px;
  right: 52px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 20px;
  transition: opacity 0.5s;
}

.counter-num {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 13px;
  letter-spacing: 0.15em;
  color: rgba(240,238,232,0.3);
  line-height: 1;
}

.counter-dots {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.counter-dot {
  width: 1px;
  height: 24px;
  background: rgba(240,238,232,0.2);
  transition: all 0.4s;
  cursor: pointer;
}

.counter-dot.active {
  background: var(--primary);
  height: 40px;
}

/* ─── SCROLL HINT ─── */
#scroll-hint {
  position: fixed;
  bottom: 36px;
  left: 52px;
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(240,238,232,0.25);
  transition: opacity 0.5s;
}

#scroll-hint.hidden { opacity: 0 !important; }

.scroll-line {
  width: 32px;
  height: 1px;
  background: rgba(240,238,232,0.25);
  position: relative;
  overflow: hidden;
}

.scroll-line::after {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: var(--fg);
  animation: scanline 2s ease-in-out infinite;
}

@keyframes scanline {
  0% { left: -100%; }
  100% { left: 100%; }
}
```

- [ ] **Step 6: Rodar testes**

```bash
npx ng test --include="**/dashboard.spec.ts" --watch=false
```

Expected: 7 specs, 0 failures.

- [ ] **Step 7: Notificar o header sobre scroll do scroll-container**

O header precisa ouvir eventos de scroll do `#scroll-container`, não do `window`. Adicionar o listener no `header.ts` dentro de `ngAfterViewInit`:

```typescript
// Adicionar ao header.ts

ngAfterViewInit() {
  const sc = document.getElementById('scroll-container');
  if (sc) {
    sc.addEventListener('scroll', () => {
      this.onScroll({ scrollTop: sc.scrollTop });
    }, { passive: true });
  }
}
```

Adicionar `AfterViewInit` ao `implements` do `Header`.

- [ ] **Step 8: Commit**

```bash
git add frontend/looker/src/components/dashboard/ frontend/looker/src/shared/header/
git commit -m "feat: refactor dashboard with cinematic snap-scroll, film intro, browse grid"
```

---

## Task 8: Film Detail Page Refactor

**Files:**
- Modify: `frontend/looker/src/components/movie/movie.ts`
- Modify: `frontend/looker/src/components/movie/movie.html`
- Modify: `frontend/looker/src/components/movie/movie.css`
- Modify: `frontend/looker/src/components/movie/movie.spec.ts`

- [ ] **Step 1: Escrever os testes**

```typescript
// movie.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Movie } from './movie';
import { MovieService } from '../../services/movie-service';
import { Rent } from '../../services/rent';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FilmeModel } from '../../models/filme-model';

const makeFilm = (id: number, genero = 'Drama'): FilmeModel => ({
  id, titulo: `Filme ${id}`, genero, ano: new Date('2024-01-01'),
  preco_aluguel: 10, sinopse: 'Uma sinopse.', imagem_url: '', duracao_minutos: 120,
  classificacao_indicativa: '12', data_lancamento: new Date('2024-01-01'),
  total_copias: 5, diretor: 'Diretor Teste', copias_disponiveis: 3
});

describe('Movie', () => {
  let component: Movie;
  let fixture: ComponentFixture<Movie>;
  let movieSpy: jasmine.SpyObj<MovieService>;
  let rentSpy:  jasmine.SpyObj<Rent>;

  beforeEach(async () => {
    movieSpy = jasmine.createSpyObj('MovieService', ['getMovie', 'getAllMovies']);
    rentSpy  = jasmine.createSpyObj('Rent', ['getRents']);

    movieSpy.getMovie.and.returnValue(of(makeFilm(1)));
    movieSpy.getAllMovies.and.returnValue(of([makeFilm(1), makeFilm(2), makeFilm(3, 'Comédia')]));

    await TestBed.configureTestingModule({
      imports: [Movie],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: MovieService, useValue: movieSpy },
        { provide: Rent, useValue: rentSpy },
        { provide: ActivatedRoute, useValue: { params: of({ id: '1' }) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Movie);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
    rentSpy.getRents.and.returnValue(of({ aluguel: { data_prevista_devolucao: new Date().toISOString() }, pagamento: { aluguel_id: 1, amount: 10 } }));
    component.rentMovie();
    expect(rentSpy.getRents).toHaveBeenCalledWith(1);
  });

  it('filmYear should return year as number', () => {
    expect(component.filmYear).toBe(2024);
  });
});
```

- [ ] **Step 2: Rodar testes para confirmar que falham**

```bash
npx ng test --include="**/movie.spec.ts" --watch=false
```

Expected: FAILED.

- [ ] **Step 3: Implementar `movie.ts`**

```typescript
// movie.ts
import {
  Component, OnInit, AfterViewInit, OnDestroy, NgZone, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FilmeModel } from '../../models/filme-model';
import { MovieService } from '../../services/movie-service';
import { Rent } from '../../services/rent';
import { ScrollRevealSection } from '../../shared/scroll-reveal-section/scroll-reveal-section';
import { MovieCard } from '../../shared/movie-card/movie-card';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const PALETTES = [
  { c1: '#0e0818', c2: '#1a0e2e', c3: '#2a1240', accent: 'rgba(120,80,200,0.28)' },
  { c1: '#0d1520', c2: '#0a2035', c3: '#153050', accent: 'rgba(40,100,180,0.25)' },
  { c1: '#120c08', c2: '#1e1208', c3: '#2e1c0c', accent: 'rgba(160,80,20,0.2)'  },
  { c1: '#0a0c10', c2: '#101520', c3: '#182030', accent: 'rgba(60,80,120,0.2)'  },
  { c1: '#0f0c06', c2: '#1c1808', c3: '#2e2810', accent: 'rgba(180,140,40,0.2)' },
  { c1: '#060e14', c2: '#08182a', c3: '#0c2040', accent: 'rgba(20,80,140,0.3)'  },
];

const CAST_MOCK = [
  { name: 'Ator Principal',    char: 'Personagem 1' },
  { name: 'Ator Secundário',   char: 'Personagem 2' },
  { name: 'Atriz Principal',   char: 'Personagem 3' },
  { name: 'Ator de Apoio',     char: 'Personagem 4' },
];

const REVIEWS_MOCK = [
  { outlet: 'Folha de S.Paulo', score: '★★★★', text: 'Uma obra marcante do cinema contemporâneo.' },
  { outlet: 'O Globo',          score: 'A-',    text: 'Fascinante e perturbador na medida certa.' },
  { outlet: 'Variety Brasil',   score: '4/5',   text: 'Direção impecável, atuações memoráveis.'  },
];

@Component({
  selector: 'app-movie',
  standalone: true,
  imports: [CommonModule, RouterModule, ScrollRevealSection, MovieCard],
  templateUrl: './movie.html',
  styleUrl: './movie.css'
})
export class Movie implements OnInit, AfterViewInit, OnDestroy {
  film:         FilmeModel | undefined;
  similarFilms: FilmeModel[] = [];
  rentLoading   = false;

  readonly castMock    = CAST_MOCK;
  readonly reviewsMock = REVIEWS_MOCK;

  private allFilms: FilmeModel[] = [];
  private ctx!: gsap.Context;
  private activeDot = 0;

  constructor(
    private route:        ActivatedRoute,
    private router:       Router,
    private movieService: MovieService,
    private rentService:  Rent,
    private zone:         NgZone,
    private el:           ElementRef
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.movieService.getMovie(id).subscribe((data: any) => {
        this.film = data as FilmeModel;
        this.loadSimilar();
      });
    });
  }

  private loadSimilar() {
    this.movieService.getAllMovies().subscribe((all: FilmeModel[]) => {
      this.allFilms = all;
      this.similarFilms = all
        .filter(m => m.genero === this.film?.genero && m.id !== this.film?.id)
        .slice(0, 7);
    });
  }

  get palette()  { return PALETTES[(this.film?.id ?? 0) % 6]; }
  get gradId()   { return 'fg' + (this.film?.id ?? 0); }
  get radId()    { return 'rg' + (this.film?.id ?? 0); }

  get filmYear(): number {
    const d = this.film?.ano;
    if (!d) return 0;
    return d instanceof Date ? d.getFullYear() : new Date(d).getFullYear();
  }

  get durationFormatted(): string {
    const min = this.film?.duracao_minutos ?? 0;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  rentMovie() {
    if (!this.film) return;
    this.rentLoading = true;
    this.rentService.getRents(this.film.id).subscribe({
      next: (data: any) => {
        const iso = data.aluguel.data_prevista_devolucao.replace(/(\.\d{3})\d+/, '$1');
        alert(`Aluguel realizado! Código: ${data.pagamento.aluguel_id} — R$ ${data.pagamento.amount}`);
        alert(`Devolução prevista: ${new Date(iso).toLocaleDateString('pt-BR')}`);
      },
      error: (err: any) => {
        if (err.status === 401) { alert('Faça login para alugar.'); return; }
        alert('Erro ao alugar. Tente novamente.');
      },
      complete: () => { this.rentLoading = false; }
    });
  }

  goBack() { this.router.navigate(['/']); }

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      this.ctx = gsap.context(() => {
        const hero = this.el.nativeElement.querySelector('.hero');
        const bg   = this.el.nativeElement.querySelector('.hero-bg');

        if (hero && bg) {
          // Hero entrance
          gsap.fromTo(bg,
            { scale: 1.12, filter: 'blur(12px)' },
            { scale: 1, filter: 'blur(0px)', duration: 1.1, ease: 'power4.out' }
          );
          gsap.to(this.el.nativeElement.querySelector('.film-eyebrow'), {
            clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: 0.65, ease: 'power3.out', delay: 0.2
          });
          gsap.to(this.el.nativeElement.querySelector('.film-title'), {
            opacity: 1, y: 0, scale: 1, duration: 0.72, ease: 'power4.out', delay: 0.3
          });
          gsap.to(this.el.nativeElement.querySelector('.film-bottom-row'), {
            opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', delay: 0.5
          });
          // Hero parallax
          gsap.to(bg, {
            yPercent: 18, ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
          });
        }

        // Progress dots
        this.setupProgressDots();
      }, this.el.nativeElement);
    });
  }

  private setupProgressDots() {
    const sections = this.el.nativeElement.querySelectorAll('[data-section]');
    const dots     = this.el.nativeElement.querySelectorAll('.prog-dot');
    sections.forEach((sec: Element, i: number) => {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (st) => {
          if (st.isActive) {
            dots.forEach((d: Element) => d.classList.remove('active'));
            dots[i]?.classList.add('active');
          }
        }
      });
    });
  }

  ngOnDestroy() { this.ctx?.revert(); }
}
```

- [ ] **Step 4: Implementar `movie.html`**

```html
<div class="movie-page">
  <!-- NAV -->
  <nav class="film-nav" id="filmNav">
    <button class="nav-back" (click)="goBack()">← Voltar</button>
    <div class="nav-logo">LOOKER</div>
    <button class="nav-watchlist">+ Watchlist</button>
  </nav>

  <!-- PROGRESS DOTS -->
  <div id="progress-line">
    <div class="prog-dot active" title="Hero"></div>
    <div class="prog-dot" title="Sinopse"></div>
    <div class="prog-dot" title="Stats"></div>
    <div class="prog-dot" title="Diretor"></div>
    <div class="prog-dot" title="Elenco"></div>
    <div class="prog-dot" title="Críticas"></div>
    <div class="prog-dot" title="Similares"></div>
  </div>

  <div *ngIf="film">

    <!-- ── SEC 1: HERO ── -->
    <section class="panel hero" data-section="hero">
      <div class="hero-bg panel-bg">
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient [id]="gradId" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   [attr.stop-color]="palette.c1"/>
              <stop offset="55%"  [attr.stop-color]="palette.c2"/>
              <stop offset="100%" [attr.stop-color]="palette.c3"/>
            </linearGradient>
            <radialGradient [id]="radId" cx="68%" cy="38%" r="62%">
              <stop offset="0%"   [attr.stop-color]="palette.accent"/>
              <stop offset="100%" stop-color="transparent"/>
            </radialGradient>
          </defs>
          <rect width="1600" height="900" [attr.fill]="'url(#'+gradId+')'"/>
          <rect width="1600" height="900" [attr.fill]="'url(#'+radId+')'"/>
          <line x1="900" y1="0" x2="1200" y2="900" stroke="rgba(255,255,255,0.02)" stroke-width="1"/>
        </svg>
      </div>
      <div class="vignette-lr"></div>
      <div class="hero-content">
        <div class="film-eyebrow">{{ film.genero }} · {{ filmYear }}</div>
        <h1 class="film-title">{{ film.titulo.toUpperCase() }}</h1>
        <div class="film-bottom-row">
          <span class="film-chip">{{ durationFormatted }}</span>
          <div class="vbar"></div>
          <span class="film-chip">{{ film.diretor }}</span>
          <div class="vbar"></div>
          <span class="film-chip">{{ film.classificacao_indicativa }}</span>
        </div>
        <button class="btn-rent" (click)="rentMovie()" [disabled]="rentLoading">
          {{ rentLoading ? 'Processando…' : 'Alugar — R$ ' + film.preco_aluguel.toFixed(2) }}
        </button>
      </div>
    </section>

    <!-- ── SEC 2: SINOPSE ── -->
    <section class="synopsis-panel" data-section="synopsis">
      <app-scroll-reveal-section>
        <div class="synopsis-inner">
          <div class="panel-label">Sinopse</div>
          <p class="synopsis-text">{{ film.sinopse || 'Sinopse não disponível.' }}</p>
        </div>
      </app-scroll-reveal-section>
    </section>

    <!-- ── SEC 3: STATS ── -->
    <div class="stats-row" data-section="stats">
      <app-scroll-reveal-section>
        <div class="stat-cell"><div class="stat-k">Diretor</div><div class="stat-v">{{ film.diretor }}</div></div>
        <div class="stat-cell"><div class="stat-k">Ano</div><div class="stat-v">{{ filmYear }}</div></div>
        <div class="stat-cell"><div class="stat-k">Duração</div><div class="stat-v">{{ durationFormatted }}</div></div>
        <div class="stat-cell"><div class="stat-k">Gênero</div><div class="stat-v">{{ film.genero }}</div></div>
        <div class="stat-cell"><div class="stat-k">Classificação</div><div class="stat-v">{{ film.classificacao_indicativa }}</div></div>
        <div class="stat-cell"><div class="stat-k">Preço</div><div class="stat-v gold">R$ {{ film.preco_aluguel.toFixed(2) }}</div></div>
      </app-scroll-reveal-section>
    </div>

    <!-- ── SEC 4: DIRETOR ── -->
    <div class="director-panel" data-section="director">
      <div class="director-visual">
        <svg viewBox="0 0 800 560" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;position:absolute;inset:0">
          <rect width="800" height="560" [attr.fill]="palette.c1"/>
          <text x="400" y="280" text-anchor="middle" dominant-baseline="middle" font-family="Georgia" font-style="italic" font-size="11" fill="rgba(255,255,255,0.08)" letter-spacing="2">FOTO · {{ film.diretor.toUpperCase() }}</text>
        </svg>
      </div>
      <app-scroll-reveal-section>
        <div class="director-info-block">
          <div class="director-role">Direção</div>
          <div class="director-name">{{ film.diretor.toUpperCase() }}</div>
          <p class="director-bio">Informações sobre o diretor em breve.</p>
        </div>
      </app-scroll-reveal-section>
    </div>

    <!-- ── SEC 5: ELENCO ── -->
    <section class="cast-panel" data-section="cast">
      <app-scroll-reveal-section>
        <div class="cast-header">
          <div class="sec-sub">Elenco principal</div>
          <div class="sec-title">Intérpretes</div>
        </div>
      </app-scroll-reveal-section>
      <div class="cast-track" id="castTrack">
        <div class="cast-card" *ngFor="let p of castMock; let i = index">
          <div class="cast-img">
            <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
              <rect width="200" height="300" [attr.fill]="palette.c1"/>
              <text x="100" y="150" text-anchor="middle" dominant-baseline="middle" font-family="Georgia" font-style="italic" font-size="9" fill="rgba(255,255,255,0.12)">{{ p.name.split(' ')[0].toUpperCase() }}</text>
            </svg>
          </div>
          <div class="cast-name">{{ p.name }}</div>
          <div class="cast-char">{{ p.char }}</div>
        </div>
      </div>
    </section>

    <!-- ── SEC 6: CRÍTICAS ── -->
    <section class="reviews-panel" data-section="reviews">
      <app-scroll-reveal-section>
        <div class="reviews-header">
          <div class="sec-sub">Imprensa especializada</div>
          <div class="sec-title">Críticas</div>
        </div>
      </app-scroll-reveal-section>
      <div class="reviews-track">
        <div class="review-card" *ngFor="let r of reviewsMock">
          <div class="review-outlet">{{ r.outlet }}</div>
          <div class="review-score">{{ r.score }}</div>
          <p class="review-text">{{ r.text }}</p>
        </div>
      </div>
    </section>

    <!-- ── SEC 7: SIMILARES ── -->
    <section class="similar-panel" data-section="similar">
      <app-scroll-reveal-section>
        <div class="similar-header">
          <div class="sec-sub">Você também pode gostar</div>
          <div class="sec-title">Similares</div>
        </div>
      </app-scroll-reveal-section>
      <div class="similar-track">
        <app-movie-card *ngFor="let f of similarFilms" [film]="f"></app-movie-card>
      </div>
    </section>

  </div>
</div>
```

- [ ] **Step 5: Implementar `movie.css`**

```css
.movie-page {
  background: var(--bg);
  color: var(--fg);
  overflow-x: hidden;
}

/* NAV */
.film-nav {
  position: fixed; top: 0; left: 0; right: 0;
  z-index: 200; padding: 24px 52px;
  display: flex; align-items: center; justify-content: space-between;
  transition: background 0.3s;
}

.nav-back {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px; font-weight: 500; letter-spacing: 0.14em;
  text-transform: uppercase; color: rgba(240,238,232,0.35);
  background: none; border: none; cursor: pointer; transition: color 0.2s;
}

.nav-back:hover { color: var(--fg); }

.nav-logo {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 20px; letter-spacing: 0.2em;
}

.nav-watchlist {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px; font-weight: 500; letter-spacing: 0.15em;
  text-transform: uppercase; color: rgba(240,238,232,0.4);
  background: none; border: 1px solid rgba(240,238,232,0.12);
  padding: 8px 20px; cursor: pointer; transition: all 0.2s;
}

.nav-watchlist:hover { color: var(--fg); border-color: rgba(240,238,232,0.4); }

/* PROGRESS DOTS */
#progress-line {
  position: fixed; right: 52px; top: 50%;
  transform: translateY(-50%);
  z-index: 200;
  display: flex; flex-direction: column;
  align-items: flex-end; gap: 8px;
}

.prog-dot {
  width: 1px; height: 20px;
  background: rgba(240,238,232,0.15);
  transition: all 0.4s; cursor: pointer;
}

.prog-dot.active { background: var(--primary); height: 36px; }

/* HERO */
.panel { position: relative; width: 100%; overflow: hidden; }
.panel-bg { position: absolute; inset: 0; will-change: transform; }
.panel-bg svg { width: 100%; height: 100%; display: block; }

.hero { height: 100vh; min-height: 700px; display: flex; align-items: flex-end; }

.vignette-lr {
  position: absolute; inset: 0;
  background:
    linear-gradient(to right, rgba(9,8,16,0.9) 0%, rgba(9,8,16,0.45) 55%, rgba(9,8,16,0.15) 100%),
    linear-gradient(to top, rgba(9,8,16,1) 0%, rgba(9,8,16,0.35) 30%, transparent 60%);
}

.hero-content { position: relative; z-index: 2; padding: 0 52px 72px; }

.film-eyebrow {
  font-size: 10px; font-weight: 600; letter-spacing: 0.22em;
  text-transform: uppercase;
  background: var(--gradient); -webkit-background-clip: text;
  -webkit-text-fill-color: transparent; background-clip: text;
  margin-bottom: 18px;
  clip-path: inset(0 100% 0 0); opacity: 0;
}

.film-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(88px, 11vw, 160px);
  line-height: 0.88; letter-spacing: 0.01em; margin-bottom: 28px;
  opacity: 0; transform: translateY(80px) scale(0.93); transform-origin: left bottom;
}

.film-bottom-row {
  display: flex; align-items: center; gap: 16px;
  margin-bottom: 32px;
  opacity: 0; transform: translateY(20px);
}

.film-chip {
  font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
  text-transform: uppercase;
  border: 1px solid rgba(240,238,232,0.12);
  padding: 4px 12px; color: rgba(240,238,232,0.4);
}

.vbar { width: 1px; height: 14px; background: rgba(240,238,232,0.12); }

.btn-rent {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px; font-weight: 600; letter-spacing: 0.12em;
  text-transform: uppercase;
  background: var(--gradient);
  color: white; border: none; padding: 14px 32px;
  cursor: pointer;
  box-shadow: 0 0 24px var(--glow-red);
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-rent:hover { transform: translateY(-2px); box-shadow: 0 0 36px var(--glow-red); }
.btn-rent:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

/* SYNOPSIS */
.synopsis-panel {
  min-height: 70vh; display: flex; align-items: center;
  padding: 120px 52px; background: var(--bg-elev);
}

.synopsis-inner { max-width: 860px; }

.panel-label {
  font-size: 10px; font-weight: 600; letter-spacing: 0.22em;
  text-transform: uppercase;
  background: var(--gradient); -webkit-background-clip: text;
  -webkit-text-fill-color: transparent; background-clip: text;
  margin-bottom: 32px; display: flex; align-items: center; gap: 16px;
}

.panel-label::after { content: ''; flex: 1; height: 1px; background: rgba(225,29,72,0.2); -webkit-text-fill-color: initial; }

.synopsis-text {
  font-size: clamp(20px, 2.2vw, 32px); line-height: 1.6; font-weight: 300;
  color: rgba(240,238,232,0.65); letter-spacing: -0.01em;
}

/* STATS */
.stats-row {
  display: flex;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--bg);
}

.stat-cell {
  flex: 1; padding: 40px 32px;
  border-right: 1px solid var(--border);
}

.stat-cell:last-child { border-right: none; }

.stat-k {
  font-size: 10px; font-weight: 600; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--muted); margin-bottom: 10px;
}

.stat-v {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 26px; letter-spacing: 0.04em; color: var(--fg);
}

.stat-v.gold { color: var(--primary); }

/* DIRECTOR */
.director-panel {
  display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: #000;
}

.director-visual {
  position: relative; min-height: 560px; overflow: hidden;
  background: var(--card);
}

.director-info-block {
  background: var(--bg-elev); padding: 80px 52px;
  display: flex; flex-direction: column; justify-content: flex-end;
}

.director-role {
  font-size: 10px; font-weight: 600; letter-spacing: 0.2em;
  text-transform: uppercase;
  background: var(--gradient); -webkit-background-clip: text;
  -webkit-text-fill-color: transparent; background-clip: text;
  margin-bottom: 16px;
}

.director-name {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(48px, 5vw, 80px); line-height: 0.9;
  margin-bottom: 20px; color: var(--fg);
}

.director-bio {
  font-size: 14px; line-height: 1.75;
  color: rgba(240,238,232,0.45); max-width: 400px;
}

/* CAST */
.cast-panel { padding: 100px 0; background: var(--bg); }

.cast-header { padding: 0 52px; margin-bottom: 48px; }

.cast-track {
  display: flex; gap: 2px; padding: 0 52px;
  overflow-x: auto; scrollbar-width: none; cursor: grab;
}

.cast-track:active { cursor: grabbing; }
.cast-track::-webkit-scrollbar { display: none; }

.cast-card { flex: 0 0 200px; }

.cast-img { width: 200px; aspect-ratio: 2/3; overflow: hidden; margin-bottom: 14px; }

.cast-name { font-size: 14px; font-weight: 500; color: var(--fg); }
.cast-char { font-size: 12px; color: var(--muted); margin-top: 4px; font-style: italic; }

/* REVIEWS */
.reviews-panel { padding: 100px 0; background: var(--bg-elev); overflow: hidden; }

.reviews-header { padding: 0 52px; margin-bottom: 60px; }

.reviews-track { display: flex; gap: 2px; padding: 0 52px; }

.review-card {
  flex: 0 0 calc(33.33% - 2px); padding: 48px 40px;
  background: rgba(255,255,255,0.02);
  border-top: 1px solid var(--border);
}

.review-outlet {
  font-size: 10px; font-weight: 600; letter-spacing: 0.2em;
  text-transform: uppercase;
  background: var(--gradient); -webkit-background-clip: text;
  -webkit-text-fill-color: transparent; background-clip: text;
  margin-bottom: 12px;
}

.review-score {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 48px; line-height: 1; color: var(--fg); margin-bottom: 20px;
}

.review-text { font-size: 14px; line-height: 1.72; color: rgba(240,238,232,0.5); font-style: italic; }

/* SIMILAR */
.similar-panel { padding: 100px 0 140px; background: var(--bg); }

.similar-header { padding: 0 52px; margin-bottom: 48px; }

.similar-track {
  display: flex; gap: 12px; padding: 0 52px;
  overflow-x: auto; scrollbar-width: none; cursor: grab;
}

.similar-track::-webkit-scrollbar { display: none; }

/* SHARED SECTION TITLES */
.sec-sub {
  font-size: 10px; font-weight: 600; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
}

.sec-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 48px; letter-spacing: 0.04em; line-height: 1; color: var(--fg);
}
```

- [ ] **Step 6: Rodar testes**

```bash
npx ng test --include="**/movie.spec.ts" --watch=false
```

Expected: 5 specs, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add frontend/looker/src/components/movie/
git commit -m "feat: refactor movie detail page with 7 cinematic sections and GSAP"
```

---

## Task 9: Login Modal Refactor — Tabs + Absorção do Register

**Files:**
- Modify: `frontend/looker/src/components/login/login.ts`
- Modify: `frontend/looker/src/components/login/login.html`
- Modify: `frontend/looker/src/components/login/login.css`
- Modify: `frontend/looker/src/components/login/login.spec.ts`

- [ ] **Step 1: Escrever os testes**

```typescript
// login.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    component.startVisible = true;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should start on login tab', () => {
    expect(component.activeTab).toBe('login');
  });

  it('should switch to register tab on setTab("register")', () => {
    component.setTab('register');
    expect(component.activeTab).toBe('register');
  });

  it('should emit closed when closeModal is called', () => {
    let emitted = false;
    component.closed.subscribe(() => emitted = true);
    component.closeModal();
    expect(emitted).toBeTrue();
  });

  it('should not emit loginSubmit when login form is invalid', () => {
    let emitted = false;
    component.loginSubmit.subscribe(() => emitted = true);
    component.onLoginSubmit();
    expect(emitted).toBeFalse();
  });

  it('should emit loginSubmit when login form is valid', () => {
    let emitted = false;
    component.loginSubmit.subscribe(() => emitted = true);
    component.loginForm.setValue({ username: 'user@test.com', password: 'pass123', remember: false });
    component.onLoginSubmit();
    expect(emitted).toBeTrue();
  });

  it('should not emit registerSubmit when register form is invalid', () => {
    let emitted = false;
    component.registerSubmit.subscribe(() => emitted = true);
    component.onRegisterSubmit();
    expect(emitted).toBeFalse();
  });
});
```

- [ ] **Step 2: Rodar testes para confirmar que falham**

```bash
npx ng test --include="**/login.spec.ts" --watch=false
```

Expected: FAILED.

- [ ] **Step 3: Implementar `login.ts`**

```typescript
// login.ts
import {
  Component, EventEmitter, HostListener, Input, Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegisterModel } from '../../models/register-model';

export type LoginTab = 'login' | 'register';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  @Input()  startVisible = false;
  @Output() loginSubmit    = new EventEmitter<{ username: string; password: string; remember: boolean }>();
  @Output() registerSubmit = new EventEmitter<RegisterModel>();
  @Output() closed         = new EventEmitter<void>();

  activeTab: LoginTab = 'login';

  loginForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    remember: new FormControl(false)
  });

  registerForm = new FormGroup({
    username:    new FormControl('', Validators.required),
    email:       new FormControl('', [Validators.required, Validators.email]),
    password:    new FormControl('', [Validators.required, Validators.minLength(8)]),
    cpf:         new FormControl('', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]),
    phone:       new FormControl('', [Validators.required, Validators.minLength(10)]),
    dateOfBirth: new FormControl('', Validators.required),
  });

  setTab(tab: LoginTab) { this.activeTab = tab; }

  closeModal() {
    this.loginForm.reset();
    this.registerForm.reset();
    this.activeTab = 'login';
    this.closed.emit();
  }

  onOverlayClick(e: Event) {
    if (e.target === e.currentTarget) this.closeModal();
  }

  @HostListener('document:keydown.escape')
  onEscape() { this.closeModal(); }

  onLoginSubmit() {
    if (!this.loginForm.valid) return;
    const v = this.loginForm.value;
    this.loginSubmit.emit({
      username: v.username!, password: v.password!, remember: v.remember ?? false
    });
    this.closeModal();
  }

  onRegisterSubmit() {
    if (!this.registerForm.valid) return;
    const v = this.registerForm.value;
    const data: RegisterModel = {
      nome:            v.username   ?? '',
      email:           v.email      ?? '',
      senha:           v.password   ?? '',
      cpf:             v.cpf        ?? '',
      telefone:        v.phone      ?? '',
      data_nascimento: new Date(v.dateOfBirth ?? ''),
      role:            'user'
    };
    this.registerSubmit.emit(data);
    this.closeModal();
  }
}
```

- [ ] **Step 4: Implementar `login.html`**

```html
<div class="modal-overlay" (click)="onOverlayClick($event)">
  <div class="modal">
    <div class="modal-shine"></div>

    <!-- TABS -->
    <div class="modal-tabs">
      <button class="tab" [class.active]="activeTab === 'login'"    (click)="setTab('login')">Entrar</button>
      <button class="tab" [class.active]="activeTab === 'register'" (click)="setTab('register')">Criar conta</button>
    </div>

    <!-- LOGIN FORM -->
    <form *ngIf="activeTab === 'login'" [formGroup]="loginForm" (ngSubmit)="onLoginSubmit()" class="modal-form">
      <div class="form-group">
        <label class="form-label">E-mail</label>
        <input class="form-input" type="email" formControlName="username" placeholder="seu@email.com" autocomplete="email" />
      </div>
      <div class="form-group">
        <label class="form-label">Senha</label>
        <input class="form-input" type="password" formControlName="password" placeholder="••••••••" autocomplete="current-password" />
      </div>
      <button class="btn-submit" type="submit">Entrar</button>
    </form>

    <!-- REGISTER FORM -->
    <form *ngIf="activeTab === 'register'" [formGroup]="registerForm" (ngSubmit)="onRegisterSubmit()" class="modal-form">
      <div class="form-group">
        <label class="form-label">Nome completo</label>
        <input class="form-input" type="text" formControlName="username" placeholder="Seu nome" />
      </div>
      <div class="form-group">
        <label class="form-label">E-mail</label>
        <input class="form-input" type="email" formControlName="email" placeholder="seu@email.com" autocomplete="email" />
      </div>
      <div class="form-group">
        <label class="form-label">Senha</label>
        <input class="form-input" type="password" formControlName="password" placeholder="Mínimo 8 caracteres" autocomplete="new-password" />
      </div>
      <div class="form-group">
        <label class="form-label">CPF</label>
        <input class="form-input" type="text" formControlName="cpf" placeholder="00000000000" maxlength="11" />
      </div>
      <div class="form-group">
        <label class="form-label">Telefone</label>
        <input class="form-input" type="tel" formControlName="phone" placeholder="00000000000" />
      </div>
      <div class="form-group">
        <label class="form-label">Data de nascimento</label>
        <input class="form-input" type="date" formControlName="dateOfBirth" />
      </div>
      <button class="btn-submit" type="submit">Criar conta</button>
    </form>

    <button class="modal-close" (click)="closeModal()" aria-label="Fechar">✕</button>
  </div>
</div>
```

- [ ] **Step 5: Implementar `login.css`**

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(9, 8, 16, 0.78);
  backdrop-filter: blur(4px);
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  position: relative;
  background: rgba(15, 12, 22, 0.96);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: 420px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  padding: 40px 36px 36px;
}

.modal-shine {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--gradient);
  border-radius: 16px 16px 0 0;
}

.modal-close {
  position: absolute;
  top: 16px; right: 16px;
  background: none;
  border: none;
  color: var(--muted);
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.2s;
}

.modal-close:hover { color: var(--fg); }

.modal-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 32px;
  border-bottom: 1px solid var(--border);
}

.tab {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  background: none;
  border: none;
  padding: 0 0 14px;
  margin-right: 28px;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.tab.active { color: var(--fg); }

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px; left: 0; right: 0;
  height: 2px;
  background: var(--gradient);
}

.modal-form { display: flex; flex-direction: column; gap: 16px; }

.form-group { display: flex; flex-direction: column; gap: 6px; }

.form-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}

.form-input {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: var(--fg);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  padding: 12px 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input::placeholder { color: var(--muted); }

.form-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--glow-red);
}

.btn-submit {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: white;
  background: var(--gradient);
  border: none;
  padding: 14px;
  cursor: pointer;
  margin-top: 8px;
  box-shadow: 0 0 20px var(--glow-red);
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-submit:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 32px var(--glow-red);
}
```

- [ ] **Step 6: Rodar testes**

```bash
npx ng test --include="**/login.spec.ts" --watch=false
```

Expected: 7 specs, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add frontend/looker/src/components/login/
git commit -m "feat: refactor login modal with glassmorphism tabs and register form"
```

---

## Task 10: Remover Componentes Register Obsoletos

**Files:**
- Delete: `frontend/looker/src/shared/register/` (todos os arquivos)
- Delete: `frontend/looker/src/components/register/` (todos os arquivos)

- [ ] **Step 1: Remover os diretórios**

```bash
rm -rf frontend/looker/src/shared/register
rm -rf frontend/looker/src/components/register
```

- [ ] **Step 2: Verificar que não há imports quebrados**

```bash
cd frontend/looker
npx ng build --configuration=development 2>&1 | grep -i "error"
```

Expected: nenhum erro de compilação. Se aparecer erro de import, localizar o arquivo e remover o import manualmente.

- [ ] **Step 3: Rodar todos os testes**

```bash
npx ng test --watch=false
```

Expected: todos os specs passam, 0 failures.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove obsolete register components (merged into login modal)"
```

---

## Self-Review

### Cobertura do spec

| Requisito do spec | Task que cobre |
|---|---|
| Design tokens v2 (bg/fg/gradient) | Task 1 |
| Fontes Bebas Neue + DM Sans | Task 1 |
| Grain canvas | Task 1 |
| GSAP register + reduced-motion | Task 1 |
| `scroll-reveal-section` | Task 2 |
| `movie-card` com imagem/SVG fallback | Task 3 |
| `film-snap-section` com GSAP entrance + parallax | Task 4 |
| `film-intro` com dismiss | Task 5 |
| Header smart hide + glassmorphism | Task 6 |
| Dashboard snap-scroll + counter + browse | Task 7 |
| Header ouvir scroll do scroll-container | Task 7 step 7 |
| Filme detalhe: 7 seções | Task 8 |
| Similar films filtrado por gênero | Task 8 (movie.ts `loadSimilar`) |
| Login modal glassmorphism + tabs | Task 9 |
| Register absorvido no login | Task 9 |
| `shared/register` e `components/register` deletados | Task 10 |

### Consistência de tipos

- `FilmeModel.getAllMovies()` → correto: `MovieService.getAllMovies()` em todos os usos
- `FilmSnapSection.animate()` e `.leave()` chamados no dashboard ✓
- `Login` recebe `startVisible: boolean` e emite `closed`, `loginSubmit`, `registerSubmit` — header consome todos ✓
- `MovieCard` recebe `film: FilmeModel` e usa `film.id`, `film.titulo`, `film.imagem_url`, `film.genero` — todos campos do modelo ✓
- `FilmIntro` emite `dismissed` — dashboard consome com `onIntroDismissed()` ✓
