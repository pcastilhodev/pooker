import { Injectable } from '@angular/core';
import { FilmeModel } from '../models/filme-model';

export interface FilmFilters {
  generos: string[];
  minAno: number;
  maxAno: number;
  minPreco: number;
  maxPreco: number;
  minDuracao: number;
  maxDuracao: number;
  apenasDisponivel: boolean;
}

@Injectable({ providedIn: 'root' })
export class FilterService {
  empty(): FilmFilters {
    return {
      generos: [], minAno: 0, maxAno: 9999,
      minPreco: 0, maxPreco: 9999,
      minDuracao: 0, maxDuracao: 9999,
      apenasDisponivel: false
    };
  }

  apply(films: FilmeModel[], f: FilmFilters): FilmeModel[] {
    return films.filter(m => {
      const ano = m.ano instanceof Date ? m.ano.getFullYear() : new Date(m.ano).getFullYear();
      if (f.generos.length && !f.generos.includes(m.genero)) return false;
      if (ano < f.minAno || ano > f.maxAno) return false;
      if (m.preco_aluguel < f.minPreco || m.preco_aluguel > f.maxPreco) return false;
      if ((m.duracao_minutos ?? 0) < f.minDuracao || (m.duracao_minutos ?? 0) > f.maxDuracao) return false;
      if (f.apenasDisponivel && m.copias_disponiveis <= 0) return false;
      return true;
    });
  }

  extractGenres(films: FilmeModel[]): string[] {
    return [...new Set(films.map(m => m.genero))].sort();
  }

  bounds(films: FilmeModel[]): { minAno: number; maxAno: number; maxPreco: number; maxDuracao: number } {
    const anos = films.map(m => m.ano instanceof Date ? m.ano.getFullYear() : new Date(m.ano).getFullYear());
    return {
      minAno: Math.min(...anos),
      maxAno: Math.max(...anos),
      maxPreco: Math.max(...films.map(m => m.preco_aluguel)),
      maxDuracao: Math.max(...films.map(m => m.duracao_minutos ?? 0)),
    };
  }
}
