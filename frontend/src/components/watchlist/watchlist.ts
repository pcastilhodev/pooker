import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { FilmeModel } from '../../models/filme-model';
import { MovieService } from '../../services/movie-service';
import { WatchlistService, WatchlistEntry } from '../../services/watchlist-service';
import { AuthService } from '../../services/auth-service';
import { ToastService } from '../../services/toast-service';
import { MovieCard } from '../../shared/movie-card/movie-card';

interface WatchRow { film: FilmeModel; addedAt: number; }

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, MovieCard],
  templateUrl: './watchlist.html',
  styleUrl: './watchlist.css'
})
export class Watchlist implements OnInit, OnDestroy {
  private readonly movies = inject(MovieService);
  private readonly watchlist = inject(WatchlistService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  rows: WatchRow[] = [];
  loading = true;
  private sub?: Subscription;

  ngOnInit() {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';

    if (!this.auth.isLoggedIn) {
      this.router.navigate(['']);
      return;
    }

    this.sub = combineLatest([
      this.movies.getAllMovies(),
      this.watchlist.watchlist$,
    ]).subscribe(([all, entries]) => {
      const idx = new Map(all.map(f => [f.id, f]));
      this.rows = entries
        .map((e: WatchlistEntry) => {
          const film = idx.get(e.id);
          return film ? { film, addedAt: e.addedAt } : null;
        })
        .filter((r): r is WatchRow => r !== null);
      this.loading = false;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  clearAll() {
    if (!this.rows.length) return;
    this.watchlist.clear();
    this.toast.info('Watchlist esvaziada.');
  }

  goExplore() { this.router.navigate(['']); }

  trackById = (_: number, row: WatchRow) => row.film.id;

  daysAgo(ts: number): string {
    const diff = Math.max(0, Date.now() - ts);
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    if (days <= 0) return 'hoje';
    if (days === 1) return 'ontem';
    if (days < 7) return `${days} dias`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} sem`;
    const months = Math.floor(days / 30);
    return `${months} mês${months > 1 ? 'es' : ''}`;
  }
}
