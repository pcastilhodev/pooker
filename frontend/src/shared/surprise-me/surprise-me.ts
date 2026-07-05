import { Component, EventEmitter, HostListener, OnDestroy, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MovieService } from '../../services/movie-service';
import { FilmeModel } from '../../models/filme-model';
import { AchievementsService } from '../../services/achievements-service';

const TICK_MS = 70;
const SPIN_MS = 1800;

@Component({
  selector: 'app-surprise-me',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './surprise-me.html',
  styleUrl: './surprise-me.css'
})
export class SurpriseMe implements OnDestroy {
  private movies = inject(MovieService);
  private router = inject(Router);
  private achievements = inject(AchievementsService);

  @Output() closed = new EventEmitter<void>();

  spinning = false;
  finished = false;
  displayed: FilmeModel | null = null;
  pool: FilmeModel[] = [];

  private tickHandle?: ReturnType<typeof setInterval>;

  constructor() {
    this.achievements.unlock('lucky');
    this.movies.getAllMovies().subscribe(list => {
      this.pool = list;
      if (list.length) this.start();
    });
  }

  start() {
    this.finished = false;
    this.spinning = true;
    this.displayed = this.pickRandom();

    this.tickHandle = setInterval(() => {
      this.displayed = this.pickRandom();
    }, TICK_MS);

    setTimeout(() => this.stop(), SPIN_MS);
  }

  stop() {
    if (this.tickHandle) clearInterval(this.tickHandle);
    this.spinning = false;
    this.finished = true;
  }

  rerun() { this.start(); }

  watchNow() {
    if (!this.displayed) return;
    this.router.navigate(['/movie', this.displayed.id]);
    this.close();
  }

  close() {
    this.stop();
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEsc() { this.close(); }

  onBackdrop(e: Event) {
    if (e.target === e.currentTarget) this.close();
  }

  ngOnDestroy() {
    if (this.tickHandle) clearInterval(this.tickHandle);
  }

  private pickRandom(): FilmeModel {
    // eslint-disable-next-line sonarjs/pseudo-random -- UI random selection, not security-sensitive
    return this.pool[Math.floor(Math.random() * this.pool.length)];
  }
}
