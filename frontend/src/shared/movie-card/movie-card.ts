import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FilmeModel } from '../../models/filme-model';
import { CollectionsService } from '../../services/collections-service';
import { CompareService } from '../../services/compare-service';

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
export class MovieCard {
  private router = inject(Router);
  collectionsService = inject(CollectionsService);
  compareService = inject(CompareService);

  @Input() film!: FilmeModel;
  showActions = false;

  get palette() { return PALETTES[this.film.id % 6]; }
  navigate() { this.router.navigate([`/movie/${this.film.id}`]); }

  addToFirstCollection(e: Event) {
    e.stopPropagation();
    const cols = this.collectionsService.getAll();
    if (!cols.length) { this.router.navigate(['/colecoes']); return; }
    this.collectionsService.addFilm(cols[0].id, this.film.id);
  }

  toggleCompare(e: Event) {
    e.stopPropagation();
    if (this.compareService.isSelected(this.film.id)) {
      this.compareService.remove(this.film.id);
    } else {
      this.compareService.add(this.film.id);
    }
  }
}
