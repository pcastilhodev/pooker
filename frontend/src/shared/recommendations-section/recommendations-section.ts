import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FilmeModel } from '../../models/filme-model';

@Component({
  selector: 'app-recommendations-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recommendations-section.html',
  styleUrl: './recommendations-section.css'
})
export class RecommendationsSection {
  private readonly router = inject(Router);

  @Input() films: FilmeModel[] = [];
  go(id: number) { this.router.navigate(['/movie', id]); }
}
