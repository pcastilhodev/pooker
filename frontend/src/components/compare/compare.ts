import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CompareService } from '../../services/compare-service';
import { MovieService } from '../../services/movie-service';
import { Rent } from '../../services/rent';
import { FilmeModel } from '../../models/filme-model';

interface RentResponse {
  pagamento?: { amount: number };
}

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compare.html',
  styleUrl: './compare.css'
})
export class Compare implements OnInit {
  compareService = inject(CompareService);
  private movieService = inject(MovieService);
  private rentService = inject(Rent);
  private router = inject(Router);

  films: FilmeModel[] = [];
  rentLoading: Record<number, boolean> = {};

  ngOnInit() {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    const ids = this.compareService.ids;
    if (ids.length < 2) { this.router.navigate(['/']); return; }
    this.movieService.getAllMovies().subscribe(all => {
      this.films = ids.map(id => all.find(m => m.id === id)!).filter(Boolean);
    });
  }

  rent(film: FilmeModel) {
    this.rentLoading[film.id] = true;
    this.rentService.getRents(film.id).subscribe({
      next: (d: RentResponse) => { alert(`Alugado! R$ ${d.pagamento?.amount ?? film.preco_aluguel}`); },
      error: () => alert('Erro ao alugar.'),
      complete: () => { this.rentLoading[film.id] = false; }
    });
  }

  get filmYear(): (f: FilmeModel) => number {
    return f => f.ano instanceof Date ? f.ano.getFullYear() : new Date(f.ano).getFullYear();
  }

  goBack() { this.router.navigate(['/']); }
}
