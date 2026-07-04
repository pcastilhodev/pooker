import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Rent, RentalItem } from '../../services/rent';
import { MovieService } from '../../services/movie-service';
import { FilmeModel } from '../../models/filme-model';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-my-rentals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-rentals.html',
  styleUrl: './my-rentals.css'
})
export class MyRentals implements OnInit, OnDestroy {
  private readonly rentService = inject(Rent);
  private readonly movieService = inject(MovieService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  rentals: RentalItem[] = [];
  loading = true;
  errorMsg = '';

  ngOnInit() {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';

    if (!this.auth.isLoggedIn) {
      this.router.navigate(['']);
      return;
    }

    this.rentService.listMyRents().subscribe({
      next: rentals => {
        if (rentals.length === 0) {
          this.rentals = [];
          this.loading = false;
          return;
        }
        const filmRequests = rentals.map(r =>
          this.movieService.getMovie(r.filme_id).pipe(catchError(() => of(null)))
        );
        forkJoin(filmRequests).subscribe(films => {
          const filmMap = new Map<number, FilmeModel>(
            (films.filter(f => f !== null) as FilmeModel[]).map(f => [f.id, f])
          );
          this.rentals = rentals.map(r => ({
            ...r,
            filme_titulo:     filmMap.get(r.filme_id)?.titulo,
            filme_imagem_url: filmMap.get(r.filme_id)?.imagem_url,
          }));
          this.loading = false;
        });
      },
      error: () => {
        this.errorMsg = 'Não foi possível carregar seus aluguéis.';
        this.loading = false;
      }
    });
  }

  ngOnDestroy() {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  openMovie(id: number) { this.router.navigate(['/movie', id]); }

  goExplore() { this.router.navigate(['']); }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR');
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'ativo':     return 'Em curso';
      case 'devolvido': return 'Devolvido';
      case 'atrasado':  return 'Atrasado';
      default:          return status || '—';
    }
  }

  trackById = (_: number, r: RentalItem) => r.id;
}
