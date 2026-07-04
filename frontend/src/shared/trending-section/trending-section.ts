import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FilmeModel } from '../../models/filme-model';
import { TrendingService } from '../../services/trending-service';

type TrendTab = 'rate' | 'price' | 'duration';

@Component({
  selector: 'app-trending-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trending-section.html',
  styleUrl: './trending-section.css'
})
export class TrendingSection {
  private readonly trending = inject(TrendingService);
  private readonly router = inject(Router);

  @Input() set films(val: FilmeModel[]) { this._films = val; this.refresh(); }
  private _films: FilmeModel[] = [];
  activeTab: TrendTab = 'rate';
  items: FilmeModel[] = [];

  setTab(t: TrendTab) { this.activeTab = t; this.refresh(); }

  private refresh() {
    const f = this._films;
    if (!f.length) return;
    const byPriceOrDuration = this.activeTab === 'price' ? this.trending.topByPrice(f, 5) : this.trending.topByDuration(f, 5);
    this.items = this.activeTab === 'rate' ? this.trending.topByRentalRate(f, 5) : byPriceOrDuration;
  }

  go(id: number) { this.router.navigate(['/movie', id]); }
}
