# 11 Features Looker — Frontend Only

**Date:** 2026-05-19  
**Scope:** Angular frontend only. Zero backend changes.  
**Strategy:** Abordagem A (high-value first) com 3 batches paralelos.

---

## Shared Infrastructure (Batch 0 — sequential, prerequisite)

### ThemeService
- `src/services/theme-service.ts`
- Toggles `data-theme="dark"|"light"` on `<html>`
- Persists to localStorage key `looker:theme`
- Exposes `theme$: Observable<string>` and `toggle()`

### PreferenceStore
- `src/services/preference-store.ts`
- Generic typed localStorage wrapper: `get<T>(key, default)`, `set<T>(key, val)`, `clear(key)`
- Used by: ThemeService, ViewModeService, CollectionsService, LoyaltyService

### TmdbService
- `src/services/tmdb-service.ts`
- Calls TMDB API v3 via `environment.tmdbApiKey`
- `getTrailerKey(titulo: string): Observable<string | null>`
- Searches movie by title → gets videos → returns YouTube key of first "Trailer"
- Caches results in memory map to avoid duplicate calls

---

## Batch 1 — Parallel (4 features)

### 1. Dark Mode / Light Mode
**Files:** `theme-service.ts`, `styles.scss`, `header` component  
**Design:**
- CSS custom properties on `:root` for all colors (background, surface, text, accent)
- `[data-theme="dark"]` overrides on `:root`
- Toggle button in header (moon/sun icon)
- Applies on app init from localStorage

**SCSS structure:**
```scss
:root {
  --bg: #0d0d0d;
  --surface: #1a1a2e;
  --text: #e0e0e0;
  --accent: #e50914;
}
[data-theme="light"] {
  --bg: #f5f5f5;
  --surface: #ffffff;
  --text: #1a1a1a;
  --accent: #e50914;
}
```
All existing color literals in component SCSS replaced with var(--*).

---

### 2. Grid / Lista Toggle
**Files:** `src/services/view-mode-service.ts`, `dashboard` component  
**Design:**
- `ViewModeService`: `mode$: Observable<'grid'|'list'>`, `toggle()`
- PreferenceStore key `looker:view-mode`, default `'grid'`
- Dashboard: two icon buttons (grid/list), `[class.list-view]` on film container
- List view: compact row (poster thumb + title + genre + price + rent button)
- Grid view: existing card layout

---

### 3. Filtros Avançados
**Files:** `src/shared/filter-panel/`, `dashboard` component  
**Design:**
- `FilterPanelComponent` — collapsible panel above film grid
- Filters (all client-side on full film array):
  - Gênero: multi-select chips (extracted from film list dynamically)
  - Ano: range slider (min/max from dataset)
  - Preço: range slider (R$0 – max from dataset)
  - Duração: range slider (minutes)
  - Disponível agora: toggle (copias_disponiveis > 0)
- `FilterService`: holds `activeFilters$`, `applyFilters(films, filters): FilmeModel[]`
- Dashboard subscribes to both `films$` and `activeFilters$`, passes result to display
- Active filter count badge on panel toggle button

---

### 4. Busca por Voz
**Files:** `src/services/voice-search-service.ts`, `header` component  
**Design:**
- `VoiceSearchService`: wraps `window.SpeechRecognition || window.webkitSpeechRecognition`
- `isSupported(): boolean`, `start(): Observable<string>` (emits transcript on result)
- `isListening$: Observable<boolean>` for UI state
- Mic icon button in header search area
- On result: sets search input value and triggers search
- On unsupported: button hidden, no error shown
- Language: `pt-BR`

---

## Batch 2 — Parallel (3 features)

### 5. Trending & Estatísticas
**Files:** `src/shared/trending-section/`, `dashboard` component  
**Design:**
- `TrendingService`: computes rental rate = `(total_copias - copias_disponiveis) / total_copias`
- Returns top N films sorted by rental rate descending
- `TrendingSectionComponent`: horizontal scroll row in dashboard
  - "Em Alta" tab: top 5 by rental rate
  - "Mais Caros" tab: top 5 by preco_aluguel
  - "Mais Longos" tab: top 5 by duracao_minutos
- Position in dashboard: after hero, before main grid
- Uses existing `MovieCardComponent`

---

### 6. Trailer Integrado
**Files:** `src/services/tmdb-service.ts` (infra), `movie` component  
**Design:**
- `movie` component calls `TmdbService.getTrailerKey(filme.titulo)` on load
- If key found: renders YouTube embed `https://www.youtube.com/embed/{key}?autoplay=0`
- Shown in a collapsible "Assistir Trailer" section above sinopse
- Skeleton loader while fetching
- If no trailer found: section hidden entirely
- `environment.ts` gains `tmdbApiKey: string` (empty string default, configured via env)
- Note: TMDB API key must be set in `src/environments/environment.ts`

---

### 7. Recomendações Inteligentes
**Files:** `src/services/recommendation-service.ts`, `src/shared/recommendations-section/`, dashboard  
**Design:**
- `RecommendationService`:
  1. Reads favorite film IDs from `FavoritesService`
  2. Reads recent film IDs from `RecentService`
  3. Maps IDs to full film objects, extracts genres
  4. Scores each film in catalog: +2 per genre match in favorites, +1 per genre match in recent
  5. Excludes films already in favorites or recently rented
  6. Returns top 10 by score, min score > 0
- `RecommendationsSectionComponent`: horizontal scroll row "Recomendados para você"
- Shown only when user is logged in and has ≥1 favorite or recent film
- Position: between Trending and main grid in dashboard

---

## Batch 3 — Parallel (4 features)

### 8. Notificações de Vencimento
**Files:** `src/services/notification-service.ts`, `header` component, `src/shared/notification-panel/`  
**Design:**
- `NotificationService`:
  - Loads user rentals on login via `RentService`
  - Computes days until `data_prevista_devolucao` for ATIVO rentals
  - Emits `notifications$: Observable<Notification[]>`
  - `Notification`: `{ type: 'due-today'|'due-soon'|'overdue', aluguelId, filmeTitulo, daysLeft }`
  - due-today: daysLeft === 0; due-soon: daysLeft 1–2; overdue: daysLeft < 0
- Header: bell icon with red badge count
- `NotificationPanelComponent`: dropdown on bell click, lists notifications with icons
- Existing `DueBannerComponent` remains unchanged (different UX)

---

### 9. Coleções Personalizadas
**Files:** `src/services/collections-service.ts`, `src/components/collections/`, `app.routes.ts`  
**Design:**
- `CollectionsService` (localStorage, key `looker:collections:{userId}`):
  - `Collection`: `{ id: string, name: string, filmIds: number[], createdAt: string }`
  - `collections$: Observable<Collection[]>`
  - `create(name)`, `delete(id)`, `addFilm(collectionId, filmId)`, `removeFilm(collectionId, filmId)`
- Route `/colecoes`: `CollectionsComponent` — lists user collections, CRUD modal for create/rename/delete
- Route `/colecoes/:id`: `CollectionDetailComponent` — film grid for collection, remove button per card
- `MovieCardComponent`: "Adicionar à coleção" option in card actions menu
- Shown only when logged in

---

### 10. Pontos de Fidelidade
**Files:** `src/services/loyalty-service.ts`, `profile` component  
**Design:**
- `LoyaltyService` (localStorage, key `looker:loyalty:{userId}`):
  - Reads rental history from `RentService`
  - Points: 1 point per R$1.00 spent (floor of valor_aluguel)
  - `points$: Observable<number>`
  - `tier$: Observable<'Bronze'|'Prata'|'Ouro'|'Platina'>` (0/50/150/300 pts)
  - `recalculate()`: recomputes from full rental history
- Profile page: new "Fidelidade" card showing points, tier badge, progress bar to next tier
- Tier perks shown as text (visual only, no backend discount)
- `AchievementsService.evaluate()` extended: `loyaltyTier` context → new achievement `'gold-member'` at Ouro

---

### 11. Comparação de Filmes
**Files:** `src/services/compare-service.ts`, `src/components/compare/`, `app.routes.ts`, `movie-card` component  
**Design:**
- `CompareService`:
  - Holds up to 2 film IDs in BehaviorSubject
  - `add(filmId)`, `remove(filmId)`, `clear()`, `canAdd$`, `films$`
  - Persists to sessionStorage (cleared on tab close, intentional)
- `MovieCardComponent` + `Movie` page: "Comparar" button; active state if film already in compare
- Floating compare bar at bottom of screen when 1 film selected: "Selecione outro filme"
- Route `/comparar`: `CompareComponent`
  - Side-by-side table: título, gênero, ano, duração, classificação, preço, diretor, nota média, cópias disponíveis
  - "Alugar" button per film
  - "Limpar comparação" button

---

## Data Flow

```
Existing APIs (filmes-service, alugueis-service)
        ↓
Angular Services (MovieService, RentService, FavoritesService, RecentService)
        ↓
New Feature Services (RecommendationService, TrendingService, LoyaltyService, etc.)
        ↓
New Components (dashboard sections, routes, header additions)
        ↓
User
```

No new HTTP endpoints. All features consume existing API responses.

---

## Error Handling

- TMDB failures: trailer section hidden, no error thrown to user
- Speech API unsupported: mic button hidden
- localStorage full: catch + toast warning (reuse ToastService)
- Empty states: all new sections/routes handle zero-data gracefully with placeholder text

---

## Testing

- Unit tests for: `ThemeService`, `FilterService`, `RecommendationService`, `TrendingService`, `LoyaltyService`, `CompareService`, `CollectionsService`, `NotificationService`
- Use existing mock patterns from `src/mocks/mock-data.ts`
- No E2E tests in scope

---

## Implementation Order (Approach A)

| Wave | Features | Parallelism |
|------|----------|-------------|
| 0 | ThemeService, PreferenceStore, TmdbService | 1 subagent |
| 1 | Dark Mode, Grid Toggle, Filtros, Voz | 4 subagents |
| 2 | Trending, Trailer, Recomendações | 3 subagents |
| 3 | Notificações, Coleções, Pontos, Comparação | 4 subagents |

**Total waves: 4. Max concurrent subagents: 4.**
