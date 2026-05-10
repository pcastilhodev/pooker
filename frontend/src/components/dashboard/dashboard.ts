import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChildren, QueryList, ElementRef, NgZone, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FilmeModel } from '../../models/filme-model';
import { MovieService } from '../../services/movie-service';
import { FilmSnapSection } from '../../shared/film-snap-section/film-snap-section';
import { FilmIntro } from '../../shared/film-intro/film-intro';
import { MovieCard } from '../../shared/movie-card/movie-card';
import { ScrollRevealSection } from '../../shared/scroll-reveal-section/scroll-reveal-section';

const MAX_SNAP = 6;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FilmSnapSection, FilmIntro, MovieCard, ScrollRevealSection],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  films: FilmeModel[]       = [];
  snapFilms: FilmeModel[]   = [];
  currentIndex              = 0;
  showIntro                 = true;
  navVisible                = false;

  @ViewChild('scrollContainer') scrollContainerRef!: ElementRef<HTMLElement>;
  @ViewChildren(FilmSnapSection) snapSections!: QueryList<FilmSnapSection>;

  private subs       = new Subscription();
  private ctx:         gsap.Context | undefined;
  private wheelTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private movieService: MovieService,
    private router:       Router,
    private route:        ActivatedRoute,
    private zone:         NgZone
  ) {}

  ngOnInit() {
    this.loadMovies();
    if (this.router.events) {
      this.subs.add(
        this.router.events
          .pipe(filter(e => e instanceof NavigationEnd))
          .subscribe(() => this.loadMovies())
      );
    }
  }

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      this.ctx = gsap.context(() => {
        ScrollTrigger.refresh();
      });
    });
  }

  loadMovies() {
    this.movieService.getAllMovies().subscribe((data: FilmeModel[]) => {
      const q = this.route.snapshot.queryParams['q'];
      this.films = q
        ? data.filter(m => m.titulo.toLowerCase().includes(q.toLowerCase()))
        : data;
      this.snapFilms = this.films.slice(0, MAX_SNAP);
    });
  }

  onIntroDismissed() {
    this.showIntro  = false;
    this.navVisible = true;
    setTimeout(() => {
      const sections = this.snapSections?.toArray();
      if (sections?.[0]) sections[0].animate();
    }, 50);
  }

  snapToSection(index: number) {
    const max = this.snapFilms.length - 1;
    if (index < 0) index = 0;
    if (index > max) index = max;
    if (index === this.currentIndex) return;

    const sections = this.snapSections?.toArray();
    sections?.[this.currentIndex]?.leave();
    this.currentIndex = index;

    const sc = this.scrollContainerRef?.nativeElement;
    if (sc) sc.scrollTo({ top: index * window.innerHeight, behavior: 'smooth' });

    setTimeout(() => sections?.[index]?.animate(), 300);
  }

  onWheel(e: WheelEvent) {
    e.preventDefault();
    clearTimeout(this.wheelTimer);
    this.wheelTimer = setTimeout(() => {
      const dir = e.deltaY > 0 ? 1 : -1;
      if (this.currentIndex < this.snapFilms.length - 1 || dir < 0) {
        this.snapToSection(this.currentIndex + dir);
      } else {
        this.scrollContainerRef?.nativeElement.scrollBy({ top: e.deltaY * 3, behavior: 'smooth' });
      }
    }, 40);
  }

  get counterLabel() {
    return `${String(this.currentIndex + 1).padStart(2, '0')} / ${String(this.snapFilms.length).padStart(2, '0')}`;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.ctx?.revert();
    clearTimeout(this.wheelTimer);
  }
}
