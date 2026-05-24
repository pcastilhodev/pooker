import { Injectable } from '@angular/core';
import { FilmeModel } from '../models/filme-model';

@Injectable({ providedIn: 'root' })
export class TrendingService {
  topByRentalRate(films: FilmeModel[], limit: number): FilmeModel[] {
    return [...films]
      .filter(m => m.total_copias > 0)
      .sort((a, b) => this.rate(b) - this.rate(a))
      .slice(0, limit);
  }

  topByPrice(films: FilmeModel[], limit: number): FilmeModel[] {
    return [...films].sort((a, b) => b.preco_aluguel - a.preco_aluguel).slice(0, limit);
  }

  topByDuration(films: FilmeModel[], limit: number): FilmeModel[] {
    return [...films].sort((a, b) => (b.duracao_minutos ?? 0) - (a.duracao_minutos ?? 0)).slice(0, limit);
  }

  private rate(m: FilmeModel): number {
    return (m.total_copias - m.copias_disponiveis) / m.total_copias;
  }
}
