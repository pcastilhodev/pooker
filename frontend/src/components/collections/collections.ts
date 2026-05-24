import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CollectionsService, Collection } from '../../services/collections-service';
import { MovieService } from '../../services/movie-service';
import { FilmeModel } from '../../models/filme-model';
import { MovieCard } from '../../shared/movie-card/movie-card';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [CommonModule, FormsModule, MovieCard],
  templateUrl: './collections.html',
  styleUrl: './collections.css'
})
export class Collections implements OnInit {
  collections: Collection[] = [];
  allFilms: FilmeModel[] = [];
  newName = '';
  selectedId: string | null = null;

  constructor(
    public collectionsService: CollectionsService,
    private movieService: MovieService,
    private router: Router
  ) {}

  ngOnInit() {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    this.collectionsService.collections$.subscribe(c => this.collections = c);
    this.movieService.getAllMovies().subscribe(f => this.allFilms = f);
  }

  create() {
    if (!this.newName.trim()) return;
    this.collectionsService.create(this.newName.trim());
    this.newName = '';
  }

  filmsFor(col: Collection): FilmeModel[] {
    return this.allFilms.filter(m => col.filmIds.includes(m.id));
  }

  goBack() { this.router.navigate(['/']); }
}
