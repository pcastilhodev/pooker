import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FilmeModel } from '../../models/filme-model';

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
  @Input() film!: FilmeModel;

  constructor(private router: Router) {}

  get palette() { return PALETTES[this.film.id % 6]; }

  navigate() { this.router.navigate([`/movie/${this.film.id}`]); }
}
