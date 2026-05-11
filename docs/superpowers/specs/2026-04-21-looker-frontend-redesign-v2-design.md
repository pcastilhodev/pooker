# Looker Frontend Redesign v2 — Design Spec

**Data:** 2026-04-21
**Status:** Aprovado
**Escopo:** Refatoração do frontend Angular para experiência cinemática com GSAP, baseada nos arquivos de referência `Looker v2.html` e `Looker Film.html`
**Substitui:** `docs/superpowers/specs/2026-04-20-looker-frontend-redesign-design.md`

---

## Visão Geral

Traduzir os arquivos de referência HTML vanilla (`Looker v2.html` e `Looker Film.html`) para Angular 20 standalone, mantendo toda a lógica existente (services, models, guards, routing) e adicionando a estética cinemática via GSAP + ScrollTrigger. A paleta mescla o fundo/estrutura dos references com o accent vermelho→violeta da identidade Looker.

---

## O que permanece intocado

- `services/` — chamadas de API, lógica de negócio
- `models/` — interfaces TypeScript
- `security/` — interceptor HTTP, guards
- `app.routes.ts` — rotas existentes
- `app.config.ts` — configuração Angular

---

## Identidade Visual e Tokens

### Paleta de Cores

```scss
// ─── FUNDO / ESTRUTURA (dos references) ───
--bg:          #090810;   // preto azulado profundo
--bg-elev:     #0c0b18;   // superfícies elevadas
--card:        #0f0e1c;   // cards e painéis
--border:      rgba(255, 255, 255, 0.06);
--fg:          #f0eee8;   // texto principal
--muted:       #6a6870;   // texto secundário

// ─── ACCENT (identidade Looker) ───
--primary:     #e11d48;
--primary-end: #7c3aed;
--gradient:    linear-gradient(90deg, #e11d48, #7c3aed);
--glow-red:    rgba(225, 29, 72, 0.18);
--glow-purple: rgba(124, 58, 237, 0.18);

// ─── ANIMAÇÃO ───
--ease-out:      cubic-bezier(0.16, 1, 0.3, 1);
--duration-fast: 150ms;
--duration-base: 300ms;
--duration-slow: 600ms;
```

### Tipografia

| Uso | Fonte |
|---|---|
| Títulos grandes, logo, contadores | `Bebas Neue` (Google Fonts) |
| Corpo, UI, labels, botões | `DM Sans` (Google Fonts) |

Adicionado ao `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap" rel="stylesheet">
```

### Grain Canvas

Canvas fixo com `position: fixed; inset: 0; pointer-events: none; z-index: 9000; opacity: 0.06; mix-blend-mode: overlay`. Renderizado via `requestAnimationFrame` com pixels aleatórios — efeito de película cinematográfica. Implementado uma vez em `app.html`.

---

## Arquitetura de Componentes

### Novos componentes standalone em `src/shared/`

| Componente | Propósito |
|---|---|
| `film-snap-section` | Seção 100vh de um filme no dashboard — fundo SVG, parallax, entrada animada |
| `scroll-reveal-section` | Wrapper genérico — anima filhos ao entrar na viewport via ScrollTrigger |
| `movie-card` | Card de catálogo (browse grid e similares) com poster SVG placeholder |
| `film-intro` | Sequência de intro: logo wipe + tagline + hint de scroll + dismiss |

### Componentes existentes refatorados

| Componente | Mudanças |
|---|---|
| `dashboard` | Orquestra `film-snap-section` + browse grid + `film-intro`; gerencia snap e counter |
| `movie` | Seções encadeadas com GSAP ScrollTrigger |
| `login` | Modal glassmorphism com tabs Login / Cadastro; absorve formulário de registro |
| `shared/header` | Smart hide + transparente→glassmorphism no scroll |
| `shared/register` | **Removido** — funcionalidade migra para tab do login modal |

### Dependências

```bash
npm install gsap
# vanilla-tilt removido — não está nos references
```

---

## Design por Página

### Dashboard

**Estrutura:**
1. `film-intro` — animação de abertura (logo wipe, tagline, hint). Clique ou tecla dispensa.
2. N × `film-snap-section` — um por filme em destaque (dados da API via `movie-service.getFilmes()`), empilhados em scroll-snap.
3. Browse grid — scroll livre, grid 6 colunas com todos os filmes (`movie-card`), revela com ScrollTrigger.

**`film-snap-section`:**
- Fundo: gradiente SVG gerado a partir de cores por filme (sem depender de imagem de poster)
- Vignette: gradiente escuro nas bordas esquerda e inferior
- Conteúdo bottom-left: badge de gênero (gradiente vermelho→violeta) → título Bebas Neue (clamp 72px–140px) → rating + ano + diretor → botões "Ver Detalhes" / "+ Watchlist"
- Entrada: bg scale 1.14→1 + blur 14px→0, label slide da esquerda, título throw y+72→0, meta e actions em stagger
- Parallax: bg `yPercent: 15` ao sair da viewport (scrub)

**Navegação snap:**
- Wheel event com debounce 40ms — snap para próximo/anterior
- Counter fixo bottom-right: `01 / 06` + dots verticais (ativo = gradiente vermelho/violeta 40px; inativo = branco 20% 24px)
- Scroll hint bottom-left some após 2º filme
- Nav fixa: opacity 0 durante intro, aparece após dismiss

**Distribuição de filmes:**
- Os primeiros 6 filmes do response `getFilmes()` viram seções snap (se a API retornar menos de 6, usa todos)
- Todos os filmes (incluindo os 6 do snap) aparecem no browse grid

**Browse grid:**
- `movie-service.getFilmes()` alimenta os cards
- `movie-card` com `imagem_url` como background, fallback para gradiente SVG
- Reveal stagger via ScrollTrigger ao entrar na viewport

---

### Página de Detalhe do Filme (`/movie/:id`)

**Seções encadeadas (scroll livre):**

| # | Seção | Dados |
|---|---|---|
| 1 | Hero | API: `titulo`, `genero`, `ano`, `diretor`, `classificacao_indicativa` |
| 2 | Sinopse | API: `sinopse` |
| 3 | Stats row | API: `diretor`, `ano`, `duracao_minutos`, `classificacao_indicativa`, `preco_aluguel` |
| 4 | Diretor | Mock estático: nome (repete `diretor`) + bio placeholder |
| 5 | Elenco | Mock estático: carrossel drag |
| 6 | Críticas | Mock estático: 3 cards |
| 7 | Similares | API: `getFilmes()` filtrado por `genero`, excluindo o filme atual |

**Poster:** O modelo tem `imagem_url`. Usar como `background-image` no hero e nos cards quando disponível; fallback para gradiente SVG gerado por `id % paleta` quando a URL estiver vazia.

**Hero (sec 1):**
- 100vh, fundo SVG com gradiente + glows vermelho/violeta
- Nav: "← Voltar" à esquerda, logo centro, "+ Watchlist" direita
- Conteúdo bottom-left: eyebrow (gênero) com clip-path wipe → título Bebas Neue (clamp 88px–160px) → row com stars + score + chips (duração, diretor)
- Entrada GSAP: bg blur→nitidez + scale, eyebrow wipe, título throw y+80→0, row fade-up

**Seções 2–7:**
- Cada uma envolvida por `scroll-reveal-section`
- Sinopse: texto grande, peso 300, cor muted — `opacity 0 + y 40 → visible`
- Stats row: 6 células com borda, stagger por célula
- Diretor: grid 2 colunas — visual SVG à esquerda, info à direita
- Elenco: cards 200px × 300px aspect-ratio 2/3, drag com mousedown/mousemove
- Críticas: 3 cards flex, `flex: 0 0 calc(33.33% - 2px)`
- Similares: `movie-card` em carrossel drag

**Progress dots:**
- Fixos à direita, 1 por seção
- Dot ativo = gradiente vermelho→violeta, 36px; inativo = branco 15%, 20px
- Atualiza com `scroll` listener + IntersectionObserver

**Botão "Alugar":**
- Chama `rent.service` existente
- Gradiente vermelho→violeta + glow + hover `translateY(-2px)`

---

### Login Modal

- Trigger: botão "Entrar" no nav
- Overlay: `rgba(9, 8, 16, 0.78)` + `backdrop-filter: blur(4px)`
- Modal: `background: rgba(15, 12, 22, 0.92)`, border-radius 16px
- Linha de brilho no topo: gradiente vermelho→violeta, 2px
- Tabs "Entrar" / "Criar conta": tab ativa com underline gradiente, troca com fade GSAP
- Inputs: fundo `rgba(255,255,255,0.04)`, focus com glow vermelho
- Botão submit: gradiente completo + glow + hover `translateY(-1px)`
- `login.ts` absorve formulário e lógica de registro; `shared/register` é removido

---

### Header

- `position: fixed`, começa transparente
- Ao scrollar >40px: `background: rgba(9,8,16,0.85)` + `backdrop-filter: blur(18px)` + `border-bottom: 1px solid rgba(255,255,255,0.06)`
- Smart hide: `translateY(-100%)` ao scrollar para baixo, `translateY(0)` ao subir
- Logo "LOOKER" em Bebas Neue
- Na página de filme: "← Voltar" substitui os links de navegação

---

## Sistema de Animações

### Setup global

```typescript
// app.ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
```

### Padrão GSAP por componente

```typescript
private ctx!: gsap.Context;

ngAfterViewInit() {
  this.zone.runOutsideAngular(() => {
    this.ctx = gsap.context(() => {
      // todas as animações e ScrollTriggers aqui
    }, this.el.nativeElement);
  });
}

ngOnDestroy() { this.ctx.revert(); }
```

`runOutsideAngular` evita change detection desnecessário. `gsap.context().revert()` faz cleanup automático de animações e ScrollTriggers ao destruir o componente.

### `scroll-reveal-section` — padrão reutilizável

```typescript
gsap.from(children, {
  scrollTrigger: { trigger: host, start: 'top 85%' },
  opacity: 0,
  y: 40,
  stagger: 0.08,
  duration: 0.7,
  ease: 'power3.out'
});
```

### Acessibilidade

```scss
@media (prefers-reduced-motion: reduce) {
  // desativa todas as animações GSAP
}
```

```typescript
// no app.ts, após registrar plugins:
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.globalTimeline.timeScale(0);
}
```

Foco visível: `outline: 2px solid #e11d48` em todos os elementos interativos.

---

## Arquivos Afetados

```
frontend/looker/
├── package.json                                    MOD — add gsap
├── src/
│   ├── index.html                                  MOD — Google Fonts
│   ├── styles.scss                                 MOD — tokens + grain + utilitários
│   ├── app/
│   │   ├── app.ts                                  MOD — registrar GSAP plugins + reduced-motion
│   │   └── app.html                                MOD — adicionar canvas grain
│   ├── shared/
│   │   ├── film-intro/
│   │   │   ├── film-intro.ts                       NEW
│   │   │   ├── film-intro.html                     NEW
│   │   │   └── film-intro.css                      NEW
│   │   ├── film-snap-section/
│   │   │   ├── film-snap-section.ts                NEW
│   │   │   ├── film-snap-section.html              NEW
│   │   │   └── film-snap-section.css               NEW
│   │   ├── scroll-reveal-section/
│   │   │   ├── scroll-reveal-section.ts            NEW
│   │   │   ├── scroll-reveal-section.html          NEW
│   │   │   └── scroll-reveal-section.css           NEW
│   │   ├── movie-card/
│   │   │   ├── movie-card.ts                       NEW
│   │   │   ├── movie-card.html                     NEW
│   │   │   └── movie-card.css                      NEW
│   │   ├── header/
│   │   │   ├── header.ts                           MOD — smart hide
│   │   │   ├── header.html                         MOD — novo layout
│   │   │   └── header.css                          MOD — glassmorphism
│   │   └── register/                               DELETED — migrado para login modal
│   └── components/
│       ├── dashboard/
│       │   ├── dashboard.ts                        MOD — snap logic + counter
│       │   ├── dashboard.html                      MOD — film-intro + snap sections + browse
│       │   └── dashboard.css                       MOD — snap container + counter + hint
│       ├── movie/
│       │   ├── movie.ts                            MOD — GSAP init + mock data
│       │   ├── movie.html                          MOD — 7 seções encadeadas
│       │   └── movie.css                           MOD — layout completo
│       └── login/
│           ├── login.ts                            MOD — tabs + register form
│           ├── login.html                          MOD — glassmorphism + tabs
│           └── login.css                           MOD — modal styles
│       └── register/                               DELETED — migrado para login modal
```
