import { Component, OnInit, OnDestroy, AfterViewInit, ViewChildren, QueryList, ElementRef, NgZone, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, Observable, Subscription } from 'rxjs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FilmeModel } from '../../models/filme-model';
import { MovieService } from '../../services/movie-service';
import { ViewModeService, ViewMode } from '../../services/view-mode-service';
import { FilterService, FilmFilters } from '../../services/filter-service';
import { FilmSnapSection } from '../../shared/film-snap-section/film-snap-section';
import { FilmIntro } from '../../shared/film-intro/film-intro';
import { MovieCard } from '../../shared/movie-card/movie-card';
import { ScrollRevealSection } from '../../shared/scroll-reveal-section/scroll-reveal-section';
import { FavoritesService } from '../../services/favorites-service';
import { Rent, RentalItem } from '../../services/rent';
import { AuthService } from '../../services/auth-service';
import { RecentService } from '../../services/recent-service';
import { FilterPanel } from '../../shared/filter-panel/filter-panel';
import { TrendingSection } from '../../shared/trending-section/trending-section';
import { RecommendationsSection } from '../../shared/recommendations-section/recommendations-section';
import { TrendingService } from '../../services/trending-service';
import { RecommendationService } from '../../services/recommendation-service';

const MAX_SNAP = 6;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FilmSnapSection, FilmIntro, MovieCard, ScrollRevealSection, FilterPanel, TrendingSection, RecommendationsSection],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  private movieService = inject(MovieService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private zone = inject(NgZone);
  private favorites = inject(FavoritesService);
  private rentService = inject(Rent);
  private auth = inject(AuthService);
  private recentService = inject(RecentService);
  viewModeService = inject(ViewModeService);
  private filterService = inject(FilterService);
  private trendingService = inject(TrendingService);
  private recommendationService = inject(RecommendationService);

  allFilms: FilmeModel[]       = [];
  films: FilmeModel[]          = [];
  filteredFilms: FilmeModel[]  = [];
  snapFilms: FilmeModel[]      = [];
  recommended: FilmeModel[]    = [];
  recommendations: FilmeModel[] = [];
  recentFilms: FilmeModel[]    = [];
  genres: string[]             = [];
  activeGenre: string | null   = null;
  currentIndex                 = 0;
  showIntro                    = true;
  navVisible                   = false;
  activeFilters!: FilmFilters;
  viewMode$!: Observable<ViewMode>;

  @ViewChild('scrollContainer') scrollContainerRef!: ElementRef<HTMLElement>;
  @ViewChildren(FilmSnapSection) snapSections!: QueryList<FilmSnapSection>;

  private subs       = new Subscription();
  private ctx:         gsap.Context | undefined;
  private wheelTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.activeFilters = this.filterService.empty();
    this.viewMode$ = this.viewModeService.modeObs$;
  }

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
      this.ctx = gsap.context(() => { ScrollTrigger.refresh(); });
    });
  }

  loadMovies() {
    this.movieService.getAllMovies().subscribe((data: FilmeModel[]) => {
      const q = this.route.snapshot.queryParams['q'];
      this.allFilms = q
        ? data.filter(m => m.titulo.toLowerCase().includes(q.toLowerCase()))
        : data;
      this.genres = Array.from(new Set(this.allFilms.map(f => f.genero).filter(Boolean))).sort();
      this.applyFilters();
      this.applyGenre();
      this.snapFilms = this.allFilms.slice(0, MAX_SNAP);
      this.computeRecommendations(data);
      this.computeRecent(data);
      const recentIds = this.recommendationService.recentIds();
      const recentFilms = data.filter(m => recentIds.includes(m.id));
      this.recommendations = this.recommendationService.recommend(data, recentFilms);
    });
  }

  onFiltersChange(f: FilmFilters) {
    this.activeFilters = f;
    this.applyFilters();
  }

  private applyFilters() {
    this.films = this.filterService.apply(this.allFilms, this.activeFilters);
    this.applyGenre();
  }

  private computeRecent(all: FilmeModel[]) {
    const ids = this.recentService.list;
    const byId = new Map(all.map(f => [f.id, f] as const));
    this.recentFilms = ids.map(id => byId.get(id)).filter((f): f is FilmeModel => !!f);
  }

  selectGenre(genre: string | null) {
    this.activeGenre = this.activeGenre === genre ? null : genre;
    this.applyGenre();
  }

  private applyGenre() {
    this.filteredFilms = this.activeGenre
      ? this.films.filter(f => f.genero === this.activeGenre)
      : this.films;
  }

  private computeRecommendations(all: FilmeModel[]) {
    if (!this.auth.isLoggedIn) { this.recommended = []; return; }

    const favIds = new Set(this.favorites.list);
    const genreScore = new Map<string, number>();
    const seenIds   = new Set<number>(favIds);

    all.filter(f => favIds.has(f.id)).forEach(f => {
      if (f.genero) genreScore.set(f.genero, (genreScore.get(f.genero) ?? 0) + 2);
    });

    this.rentService.listMyRents().subscribe({
      next: (rentals: RentalItem[]) => {
        rentals.forEach(r => {
          seenIds.add(r.filme_id);
          const film = all.find(f => f.id === r.filme_id);
          if (film?.genero) genreScore.set(film.genero, (genreScore.get(film.genero) ?? 0) + 3);
        });
        this.applyRecommendations(all, genreScore, seenIds);
      },
      error: () => this.applyRecommendations(all, genreScore, seenIds)
    });
  }

  private applyRecommendations(
    all: FilmeModel[],
    scores: Map<string, number>,
    seen: Set<number>
  ) {
    if (scores.size === 0) { this.recommended = []; return; }
    this.recommended = all
      .filter(f => !seen.has(f.id) && f.genero && scores.has(f.genero))
      .sort((a, b) => (scores.get(b.genero!) ?? 0) - (scores.get(a.genero!) ?? 0))
      .slice(0, 8);
  }

  onIntroDismissed() {
    this.showIntro  = false;
    this.navVisible = true;
    setTimeout(() => { this.snapSections?.toArray()?.[0]?.animate(); }, 50);
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
