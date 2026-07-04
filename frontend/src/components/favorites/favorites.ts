import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { FilmeModel } from '../../models/filme-model';
import { MovieService } from '../../services/movie-service';
import { FavoritesService } from '../../services/favorites-service';
import { AuthService } from '../../services/auth-service';
import { MovieCard } from '../../shared/movie-card/movie-card';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, MovieCard],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css'
})
export class Favorites implements OnInit, OnDestroy {
  private readonly movies = inject(MovieService);
  private readonly favorites = inject(FavoritesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  films: FilmeModel[] = [];
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
      this.favorites.favorites$,
    ]).subscribe(([all, favs]) => {
      this.films = all.filter(m => favs.has(m.id));
      this.loading = false;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  goExplore() { this.router.navigate(['']); }

  trackById = (_: number, f: FilmeModel) => f.id;
}
