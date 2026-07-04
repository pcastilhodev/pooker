import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CompareService } from '../../services/compare-service';

@Component({
  selector: 'app-compare-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compare-bar.html',
  styleUrl: './compare-bar.css'
})
export class CompareBar {
  compareService = inject(CompareService);
  private readonly router = inject(Router);


  go() { this.router.navigate(['/comparar']); }
  clear() { this.compareService.clear(); }
}
