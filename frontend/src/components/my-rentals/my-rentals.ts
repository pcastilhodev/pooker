import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Rent, RentalItem } from '../../services/rent';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-my-rentals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-rentals.html',
  styleUrl: './my-rentals.css'
})
export class MyRentals implements OnInit, OnDestroy {
  rentals: RentalItem[] = [];
  loading = true;
  errorMsg = '';

  constructor(
    private rentService: Rent,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';

    if (!this.auth.isLoggedIn) {
      this.router.navigate(['']);
      return;
    }

    this.rentService.listMyRents().subscribe({
      next: data => {
        this.rentals = Array.isArray(data) ? data : [];
        this.loading = false;
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
    if (isNaN(d.getTime())) return '—';
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
