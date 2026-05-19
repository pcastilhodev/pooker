import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth-service';
import { ToastService } from './toast-service';

const PREFIX = 'looker:achievements:';

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-login',   icon: '🎬', title: 'Iniciado',          description: 'Primeiro login no Looker.' },
  { id: 'first-rent',    icon: '🍿', title: 'Primeira sessão',   description: 'Você alugou seu primeiro filme.' },
  { id: 'movie-buff',    icon: '🎟️', title: 'Cinéfilo',           description: '5 filmes alugados.' },
  { id: 'marathoner',    icon: '🏃', title: 'Maratonista',       description: '10 filmes alugados.' },
  { id: 'fav-collector', icon: '❤️', title: 'Colecionador',      description: '5 filmes nos favoritos.' },
  { id: 'big-spender',   icon: '💎', title: 'Investidor',        description: 'Gastou R$ 100 em aluguéis.' },
  { id: 'critic',        icon: '⭐', title: 'Crítico',            description: 'Deu 3 avaliações.' },
  { id: 'community',     icon: '💬', title: 'Voz da comunidade', description: 'Publicou seu primeiro comentário.' },
  { id: 'explorer',      icon: '🧭', title: 'Explorador',        description: 'Visitou páginas de 10 filmes.' },
  { id: 'lucky',         icon: '🎲', title: 'Sortudo',           description: 'Usou o Surpreenda-me.' },
];

@Injectable({ providedIn: 'root' })
export class AchievementsService {
  private unlocked$ = new BehaviorSubject<Set<string>>(new Set());

  achievements$: Observable<Set<string>> = this.unlocked$.asObservable();

  constructor(private auth: AuthService, private toast: ToastService) {
    this.reload();
    this.auth.user$.subscribe(() => this.reload());
  }

  get list(): string[] { return Array.from(this.unlocked$.value); }

  has(id: string): boolean { return this.unlocked$.value.has(id); }

  unlock(id: string): boolean {
    if (this.has(id)) return false;
    const meta = ACHIEVEMENTS.find(a => a.id === id);
    if (!meta) return false;
    const set = new Set(this.unlocked$.value);
    set.add(id);
    this.unlocked$.next(set);
    this.persist();
    this.toast.success(`${meta.icon} ${meta.title} — ${meta.description}`, 'Conquista desbloqueada!');
    return true;
  }

  evaluate(ctx: {
    rentalsCount?: number;
    favoritesCount?: number;
    ratingsCount?: number;
    totalSpent?: number;
    commentsCount?: number;
    moviesVisited?: number;
  }) {
    if (this.auth.isLoggedIn) this.unlock('first-login');
    if ((ctx.rentalsCount ?? 0) >= 1)  this.unlock('first-rent');
    if ((ctx.rentalsCount ?? 0) >= 5)  this.unlock('movie-buff');
    if ((ctx.rentalsCount ?? 0) >= 10) this.unlock('marathoner');
    if ((ctx.favoritesCount ?? 0) >= 5) this.unlock('fav-collector');
    if ((ctx.totalSpent ?? 0) >= 100)   this.unlock('big-spender');
    if ((ctx.ratingsCount ?? 0) >= 3)   this.unlock('critic');
    if ((ctx.commentsCount ?? 0) >= 1)  this.unlock('community');
    if ((ctx.moviesVisited ?? 0) >= 10) this.unlock('explorer');
  }

  private key(): string { return PREFIX + (this.auth.user?.email ?? 'guest'); }

  private reload() {
    try {
      const raw = localStorage.getItem(this.key());
      const arr = raw ? JSON.parse(raw) as string[] : [];
      this.unlocked$.next(new Set(arr));
    } catch { this.unlocked$.next(new Set()); }
  }

  private persist() {
    try { localStorage.setItem(this.key(), JSON.stringify(Array.from(this.unlocked$.value))); }
    catch { /* ignore */ }
  }
}
