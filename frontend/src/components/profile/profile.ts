import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, combineLatest, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService, AuthUser } from '../../services/auth-service';
import { FavoritesService } from '../../services/favorites-service';
import { WatchlistService } from '../../services/watchlist-service';
import { RatingsService } from '../../services/ratings-service';
import { MovieService } from '../../services/movie-service';
import { Rent, RentalItem } from '../../services/rent';
import { FilmeModel } from '../../models/filme-model';
import { AchievementsService, ACHIEVEMENTS, Achievement } from '../../services/achievements-service';
import { CommentsService } from '../../services/comments-service';
import { RecentService } from '../../services/recent-service';

interface ProfileStats {
  rentalsTotal: number;
  rentalsActive: number;
  totalSpent: number;
  favoritesCount: number;
  watchlistCount: number;
  ratingsCount: number;
  ratingsAverage: number;
  topGenre: string | null;
}

const EMPTY_STATS: ProfileStats = {
  rentalsTotal: 0,
  rentalsActive: 0,
  totalSpent: 0,
  favoritesCount: 0,
  watchlistCount: 0,
  ratingsCount: 0,
  ratingsAverage: 0,
  topGenre: null,
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit, OnDestroy {
  user: AuthUser | null = null;
  stats: ProfileStats = { ...EMPTY_STATS };
  statsLoading = true;
  private subs = new Subscription();

  constructor(
    private auth: AuthService,
    private router: Router,
    private favorites: FavoritesService,
    private watchlist: WatchlistService,
    private ratings: RatingsService,
    private movies: MovieService,
    private rent: Rent,
    private achievementsService: AchievementsService,
    private commentsService: CommentsService,
    private recentService: RecentService,
  ) {}

  allAchievements: Achievement[] = ACHIEVEMENTS;
  unlockedIds = new Set<string>();

  ngOnInit() {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    this.subs.add(this.auth.user$.subscribe(u => {
      this.user = u;
      if (!u) this.router.navigate(['']);
      else this.loadStats();
    }));
    this.subs.add(this.achievementsService.achievements$.subscribe(s => (this.unlockedIds = s)));
  }

  hasAchievement(id: string): boolean { return this.unlockedIds.has(id); }

  ngOnDestroy() {
    this.subs.unsubscribe();
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  private loadStats() {
    this.statsLoading = true;
    const rentals$ = this.rent.listMyRents().pipe(
      catchError(() => of([] as RentalItem[])),
    );
    const movies$ = this.movies.getAllMovies().pipe(
      catchError(() => of([] as FilmeModel[])),
    );

    this.subs.add(
      combineLatest([
        rentals$,
        movies$,
        this.favorites.favorites$,
        this.watchlist.watchlist$,
        this.ratings.ratings$,
      ]).pipe(
        map(([rentals, movies, favs, watch, ratings]) => {
          const userEmail = this.auth.user?.email ?? 'guest';
          const userRatings = ratings.filter(r => r.user === userEmail);
          const ratingsCount = userRatings.length;
          const ratingsAverage = ratingsCount > 0
            ? Math.round((userRatings.reduce((acc, r) => acc + r.stars, 0) / ratingsCount) * 10) / 10
            : 0;

          const totalSpent = rentals.reduce((acc, r) => acc + (Number(r.valor_aluguel) || 0), 0);
          const rentalsActive = rentals.filter(r => r.status === 'ativo' || r.status === 'atrasado').length;

          const genreScore = new Map<string, number>();
          const idx = new Map(movies.map(m => [m.id, m]));
          const bump = (id: number, weight: number) => {
            const film = idx.get(id);
            if (!film?.genero) return;
            genreScore.set(film.genero, (genreScore.get(film.genero) ?? 0) + weight);
          };
          favs.forEach(id => bump(id, 2));
          watch.forEach(e => bump(e.id, 1));
          userRatings.forEach(r => bump(r.filmeId, r.stars));
          rentals.forEach(r => bump(r.filme_id, 3));

          let topGenre: string | null = null;
          let topScore = 0;
          genreScore.forEach((score, g) => {
            if (score > topScore) { topScore = score; topGenre = g; }
          });

          const stats: ProfileStats = {
            rentalsTotal: rentals.length,
            rentalsActive,
            totalSpent,
            favoritesCount: favs.size,
            watchlistCount: watch.length,
            ratingsCount,
            ratingsAverage,
            topGenre,
          };
          return stats;
        }),
      ).subscribe(s => {
        this.stats = s;
        this.statsLoading = false;
        const userEmail = this.auth.user?.email;
        const commentsCount = userEmail ? this.commentsService.byUser(userEmail).length : 0;
        this.achievementsService.evaluate({
          rentalsCount:   s.rentalsTotal,
          favoritesCount: s.favoritesCount,
          ratingsCount:   s.ratingsCount,
          totalSpent:     s.totalSpent,
          commentsCount,
          moviesVisited:  this.recentService.list.length,
        });
      })
    );
  }

  get initials(): string {
    if (!this.user?.nome) return '?';
    const parts = this.user.nome.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last  = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase() || '?';
  }

  get maskedCpf(): string {
    const cpf = this.user?.cpf;
    if (!cpf) return '—';
    const digits = cpf.replace(/\D/g, '').padStart(11, '*');
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }

  get birthDateFormatted(): string {
    const raw = this.user?.data_nascimento;
    if (!raw) return '—';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  get totalSpentFormatted(): string {
    return this.stats.totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  goToRentals() { this.router.navigate(['/meus-alugueis']); }
  goToFavorites() { this.router.navigate(['/favoritos']); }
  goToWatchlist() { this.router.navigate(['/watchlist']); }

  logout() {
    this.auth.logout();
    this.router.navigate(['']);
  }
}
