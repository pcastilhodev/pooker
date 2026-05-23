import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilmeModel } from '../../models/filme-model';
import { FilterService, FilmFilters } from '../../services/filter-service';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.css'
})
export class FilterPanel implements OnChanges {
  @Input() films: FilmeModel[] = [];
  @Output() filtersChange = new EventEmitter<FilmFilters>();

  genres: string[] = [];
  filters!: FilmFilters;
  bounds = { minAno: 2000, maxAno: 2025, maxPreco: 50, maxDuracao: 240 };
  open = false;

  constructor(private filterService: FilterService) {
    this.filters = this.filterService.empty();
  }

  ngOnChanges() {
    if (!this.films.length) return;
    this.genres = this.filterService.extractGenres(this.films);
    this.bounds = this.filterService.bounds(this.films);
    if (!this.filters.maxAno || this.filters.maxAno === 9999) {
      this.filters = {
        ...this.filterService.empty(),
        maxAno: this.bounds.maxAno,
        minAno: this.bounds.minAno,
        maxPreco: this.bounds.maxPreco,
        maxDuracao: this.bounds.maxDuracao
      };
    }
  }

  toggleGenre(g: string) {
    const idx = this.filters.generos.indexOf(g);
    this.filters = {
      ...this.filters,
      generos: idx >= 0 ? this.filters.generos.filter(x => x !== g) : [...this.filters.generos, g]
    };
    this.emit();
  }

  emit() { this.filtersChange.emit({ ...this.filters }); }

  get activeCount(): number {
    let n = this.filters.generos.length;
    if (this.filters.apenasDisponivel) n++;
    if (this.filters.maxPreco < this.bounds.maxPreco) n++;
    return n;
  }

  reset() {
    this.filters = {
      ...this.filterService.empty(),
      maxAno: this.bounds.maxAno,
      minAno: this.bounds.minAno,
      maxPreco: this.bounds.maxPreco,
      maxDuracao: this.bounds.maxDuracao
    };
    this.emit();
  }
}
