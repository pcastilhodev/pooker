# Looker Frontend Redesign — Design Spec

**Data:** 2026-04-20
**Status:** Aprovado
**Escopo:** Refatoração cirúrgica do frontend Angular para experiência next-gen

---

## Visão Geral

Transformar o frontend do Looker (plataforma de aluguel de filmes em Angular 20) de um CRUD visual básico para uma experiência cinemática imersiva com efeitos de scroll, animações 3D e identidade visual premium.

---

## Decisões de Design

### Estética
- **Estilo:** Cinemático / Dark Luxury — inspirado em Apple TV+, Netflix premium
- **Tipografia títulos:** Georgia (serif) para peso cinematográfico
- **Tipografia corpo:** system-ui / sans-serif
- **Tom:** Sofisticado, imersivo, escuro

### Paleta de Cores
```
--bg:           #060608         /* preto azulado profundo */
--bg-elev:      #0f0c16         /* superfícies elevadas */
--card:         #13101a         /* cards */
--border:       rgba(255,255,255,0.06)
--text:         #eaeaea
--muted:        rgba(255,255,255,0.45)
--primary:      #e11d48         /* vermelho */
--primary-end:  #7c3aed         /* violeta (gradiente) */
--gradient:     linear-gradient(90deg, #e11d48, #7c3aed)
--glow-red:     rgba(225,29,72,0.15)
--glow-purple:  rgba(124,58,237,0.15)
```

### Bibliotecas Adicionadas
| Lib | Uso | Tamanho aprox. |
|-----|-----|----------------|
| `gsap` + `@gsap/scrolltrigger` | Animações de scroll, parallax, revelar seções | ~65kb gzip |
| `vanilla-tilt` | Efeito 3D tilt nos cards de filme | ~5kb gzip |
| `@types/vanilla-tilt` | Tipagem TypeScript | dev only |

---

## Arquitetura

### O que permanece intocado
- `services/` — chamadas de API, lógica de negócio
- `models/` — interfaces TypeScript
- `security/` — interceptor HTTP, guards
- `app.routes.ts` — rotas existentes
- `app.config.ts` — configuração Angular

### Componentes Refatorados (template + estilos reescritos)
| Componente | Mudanças |
|---|---|
| `dashboard` | Novo template: HeroSection + ScrollSections + MovieGrid |
| `movie` | Novo template: FullscreenHero + ScrollReveal sections |
| `login` | Modal glassmorphism com tabs Login/Cadastro |
| `register` | Unificado no modal de login via tabs |
| `header` | Smart Hide + transparente→glassmorphism no scroll |
| `styles.scss` | Tokens de cor atualizados + utilitários de animação |

### Novos Componentes Criados
| Componente | Propósito |
|---|---|
| `hero-section` | Hero full-viewport com parallax GSAP + filme em destaque |
| `scroll-section` | Wrapper que anima entrada de conteúdo via ScrollTrigger |
| `movie-card` | Card standalone com Vanilla-tilt integrado |

---

## Design por Página

### Dashboard

**Estrutura vertical:**
1. **Hero full-viewport** — filme em destaque ocupa 100vh
   - Fundo: gradiente escuro com glows radiais vermelho/violeta
   - Poster 3D à direita: `perspective() rotateY(-8deg)`, acompanha mouse
   - Conteúdo à esquerda: badge "Em destaque", título em Georgia, sinopse, botões
   - Botão primário: `linear-gradient(#e11d48, #7c3aed)` com glow
   - Parallax: poster move a 0.4x velocidade do scroll (GSAP ScrollTrigger)
   - Indicador de scroll animado na base
2. **Seção "Adicionados Recentemente"** — grid de cards, revela com fade+translateY no scroll
3. **Seção "Por Gênero"** — scroll horizontal, cards de categoria com hover scale
4. Seções adicionais seguem o mesmo padrão com `scroll-section` wrapper

**Comportamento do header no Dashboard:**
- Posição `fixed`, começa `transparent`
- Ao scrollar >40px: `background: rgba(6,6,8,0.82)`, `backdrop-filter: blur(18px)`, borda sutil
- Smart Hide: translateY(-100%) ao scrollar para baixo, translateY(0) ao subir

### Página de Detalhe do Filme

**Estrutura:**
1. **Hero full-screen**
   - Fundo: poster do filme desfocado (`filter: blur(40px)`) + vignettes
   - Glows radiais vermelho e violeta nas bordas
   - Poster nítido flutuando à direita com efeito 3D (segue movimento do mouse)
   - Esquerda: voltar, tags de gênero, título Georgia, diretor, sinopse, botão "Alugar"
   - Botão de aluguel: gradiente com `box-shadow` glow, hover levanta 2px
2. **Seção Detalhes** (scroll reveal) — grid 2x2 com diretor, gênero, duração, preço
3. **Filmes Similares** (scroll reveal) — grid de 4 cards com tilt 3D

### Modal Login / Registro

- **Overlay:** `rgba(6,6,8,0.75)` com `backdrop-filter: blur(4px)`
- **Modal:** `background: rgba(15,12,22,0.92)`, border-radius 24px, borda sutil
- **Linha de brilho:** gradiente vermelho→violeta no topo do modal
- **Glows de fundo:** radiais vermelho e violeta animam com mouse
- **Tabs animadas:** Login / Criar conta no mesmo modal, troca com fade GSAP
- **Inputs:** fundo `rgba(255,255,255,0.04)`, focus com glow vermelho
- **Botão submit:** gradiente completo + glow + hover translateY(-1px)
- Register movido para dentro do modal (tab), componente `register` separado removido

### Header

- Logo: gradiente texto vermelho→violeta
- Links: `rgba(255,255,255,0.55)`, hover `#fff`
- Smart Hide implementado via listener `scroll` + threshold de direção
- Transição: `transform 0.3s ease`
- Estado scrolled: `backdrop-filter: blur(18px)` + `border-bottom: 1px solid rgba(255,255,255,0.06)`

---

## Sistema de Animações

### GSAP — configuração global (`app.ts`)
```typescript
gsap.registerPlugin(ScrollTrigger);
// defaults
gsap.defaults({ ease: 'power3.out', duration: 0.8 });
```

### Padrão ScrollReveal (componente `scroll-section`)
```typescript
// Cada filho anima com stagger ao entrar na viewport
gsap.from(children, {
  scrollTrigger: { trigger: host, start: 'top 85%' },
  opacity: 0,
  y: 40,
  stagger: 0.08,
  duration: 0.7
});
```

### Parallax do Hero
```typescript
gsap.to(posterEl, {
  scrollTrigger: { trigger: hero, scrub: true },
  y: '30%',       // poster move mais lento
  ease: 'none'
});
gsap.to(contentEl, {
  scrollTrigger: { trigger: hero, scrub: true },
  y: '-15%',      // conteúdo sobe mais rápido
  ease: 'none'
});
```

### Vanilla-tilt (diretiva Angular `appTilt`)
```typescript
VanillaTilt.init(el, {
  max: 12,
  speed: 400,
  glare: true,
  'max-glare': 0.15
});
```

---

## Tokens de Animação (CSS)
```scss
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--duration-fast: 150ms;
--duration-base: 300ms;
--duration-slow: 600ms;
```

---

## Acessibilidade
- `@media (prefers-reduced-motion: reduce)`: desativa todas as animações GSAP e tilt
- Foco visível: `outline: 2px solid #22d3ee` (ciano) em todos os elementos interativos
- Contraste: texto principal `#eaeaea` sobre `#060608` — ratio >7:1

---

## Arquivos Afetados (resumo)

```
frontend/looker/
├── package.json                          ← adicionar gsap, vanilla-tilt
├── src/
│   ├── styles.scss                       ← tokens atualizados
│   ├── app/
│   │   ├── app.ts                        ← registrar GSAP plugins
│   │   └── app.html                      ← sem mudanças
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── dashboard.html            ← reescrito
│   │   │   ├── dashboard.css             ← reescrito
│   │   │   └── dashboard.ts             ← GSAP hero + scroll sections
│   │   ├── movie/
│   │   │   ├── movie.html               ← reescrito
│   │   │   ├── movie.css                ← reescrito
│   │   │   └── movie.ts                 ← GSAP + poster tilt
│   │   ├── login/
│   │   │   ├── login.html               ← modal unificado com tabs
│   │   │   ├── login.css                ← glassmorphism
│   │   │   └── login.ts                 ← lógica de tabs + register form
│   │   └── header/
│   │       ├── header.html              ← reescrito
│   │       ├── header.css               ← reescrito
│   │       └── header.ts                ← smart hide scroll listener
│   └── shared/
│       ├── hero-section/                ← NOVO componente
│       ├── scroll-section/              ← NOVO componente
│       └── movie-card/                  ← NOVO componente standalone
```
