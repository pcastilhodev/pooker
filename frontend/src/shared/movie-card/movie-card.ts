import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FilmeModel } from '../../models/filme-model';
import { FavoritesService } from '../../services/favorites-service';
import { WatchlistService } from '../../services/watchlist-service';
import { ToastService } from '../../services/toast-service';
import { AuthService } from '../../services/auth-service';

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
export class MovieCard implements OnInit, OnDestroy {
  @Input() film!: FilmeModel;

  isFavorite   = false;
  inWatchlist  = false;
  private subs = new Subscription();

  constructor(
    private router: Router,
    private favorites: FavoritesService,
    private watchlist: WatchlistService,
    private toast: ToastService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.subs.add(this.favorites.favorites$.subscribe(set => {
      this.isFavorite = !!this.film && set.has(this.film.id);
    }));
    this.subs.add(this.watchlist.watchlist$.subscribe(entries => {
      this.inWatchlist = !!this.film && entries.some(e => e.id === this.film.id);
    }));
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  get palette() { return PALETTES[this.film.id % 6]; }

  navigate() { this.router.navigate([`/movie/${this.film.id}`]); }

  toggleFav(event: Event) {
    event.stopPropagation();
    if (!this.auth.isLoggedIn) {
      this.toast.warn('Faça login para salvar nos favoritos.', 'Acesso necessário');
      return;
    }
    const now = this.favorites.toggle(this.film.id);
    this.toast.info(now ? `${this.film.titulo} adicionado aos favoritos` : `${this.film.titulo} removido dos favoritos`);
  }

  toggleWatch(event: Event) {
    event.stopPropagation();
    if (!this.auth.isLoggedIn) {
      this.toast.warn('Faça login para usar a watchlist.', 'Acesso necessário');
      return;
    }
    const now = this.watchlist.toggle(this.film.id);
    this.toast.info(now ? `${this.film.titulo} salvo na watchlist` : `${this.film.titulo} removido da watchlist`);
  }
}
