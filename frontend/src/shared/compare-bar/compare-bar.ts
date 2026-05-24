import { Component } from '@angular/core';
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
  constructor(public compareService: CompareService, private router: Router) {}

  go() { this.router.navigate(['/comparar']); }
  clear() { this.compareService.clear(); }
}
