import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.html',
  styleUrl: './star-rating.css'
})
export class StarRating {
  @Input() value = 0;
  @Input() readonly = false;
  @Input() size = 22;
  @Output() rated = new EventEmitter<number>();

  hover = 0;

  readonly stars = [1, 2, 3, 4, 5];

  onHover(n: number) { if (!this.readonly) this.hover = n; }
  onLeave()          { this.hover = 0; }

  select(n: number) {
    if (this.readonly) return;
    this.value = n;
    this.rated.emit(n);
  }

  isFilled(n: number): boolean {
    const ref = this.hover || this.value;
    return n <= ref;
  }
}
