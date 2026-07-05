import { Component, OnInit, OnDestroy, NgZone, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FilmeModel, CastMember } from '../../models/filme-model';
import { MovieService } from '../../services/movie-service';
import { Rent, RentResponse } from '../../services/rent';
import { ToastService } from '../../services/toast-service';
import { ScrollRevealSection } from '../../shared/scroll-reveal-section/scroll-reveal-section';
import { MovieCard } from '../../shared/movie-card/movie-card';
import { StarRating } from '../../shared/star-rating/star-rating';
import { FavoritesService } from '../../services/favorites-service';
import { RatingsService, RatingStats } from '../../services/ratings-service';
import { AuthService } from '../../services/auth-service';
import { RecentService } from '../../services/recent-service';
import { CommentsService, MovieComment } from '../../services/comments-service';
import { RecommendationService } from '../../services/recommendation-service';
import { TmdbService } from '../../services/tmdb-service';
import { SafeUrlPipe } from '../../shared/safe-url.pipe';
import { Subscription } from 'rxjs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);


const PALETTES = [
  { c1: '#0e0818', c2: '#1a0e2e', c3: '#2a1240', accent: 'rgba(120,80,200,0.28)' },
  { c1: '#0d1520', c2: '#0a2035', c3: '#153050', accent: 'rgba(40,100,180,0.25)' },
  { c1: '#120c08', c2: '#1e1208', c3: '#2e1c0c', accent: 'rgba(160,80,20,0.2)'  },
  { c1: '#0a0c10', c2: '#101520', c3: '#182030', accent: 'rgba(60,80,120,0.2)'  },
  { c1: '#0f0c06', c2: '#1c1808', c3: '#2e2810', accent: 'rgba(180,140,40,0.2)' },
  { c1: '#060e14', c2: '#08182a', c3: '#0c2040', accent: 'rgba(20,80,140,0.3)'  },
];

const CAST_MOCK = [
  { name: 'Ator Principal',    char: 'Personagem 1' },
  { name: 'Ator Secundário',   char: 'Personagem 2' },
  { name: 'Atriz Principal',   char: 'Personagem 3' },
  { name: 'Ator de Apoio',     char: 'Personagem 4' },
];

const REVIEWS_MOCK = [
  { outlet: 'Folha de S.Paulo', score: '★★★★', text: 'Uma obra marcante do cinema contemporâneo.' },
  { outlet: 'O Globo',          score: 'A-',    text: 'Fascinante e perturbador na medida certa.' },
  { outlet: 'Variety Brasil',   score: '4/5',   text: 'Direção impecável, atuações memoráveis.'  },
];

@Component({
  selector: 'app-movie',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ScrollRevealSection, MovieCard, StarRating, SafeUrlPipe],
  templateUrl: './movie.html',
  styleUrl: './movie.css'
})
export class Movie implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private movieService = inject(MovieService);
  private rentService = inject(Rent);
  private zone = inject(NgZone);
  private el = inject(ElementRef);
  private toast = inject(ToastService);
  private favorites = inject(FavoritesService);
  private ratings = inject(RatingsService);
  private auth = inject(AuthService);
  private recent = inject(RecentService);
  private commentsSvc = inject(CommentsService);
  private tmdbService = inject(TmdbService);
  private recommendationService = inject(RecommendationService);

  film:         FilmeModel | undefined;
  similarFilms: FilmeModel[] = [];
  rentLoading   = false;
  isFavorite    = false;
  ratingStats:  RatingStats = { count: 0, average: 0, userStars: 0 };
  trailerKey: string | null = null;
  trailerLoading = false;

  readonly castMock    = CAST_MOCK;
  readonly reviewsMock = REVIEWS_MOCK;

  private ctx: gsap.Context | undefined;
  private favSub?: Subscription;

  comments: MovieComment[] = [];
  newComment = '';

  get currentUserEmail(): string | undefined { return this.auth.user?.email; }

  refreshComments() {
    if (!this.film) return;
    this.comments = this.commentsSvc.for(this.film.id);
  }

  addComment() {
    if (!this.film) return;
    if (!this.auth.isLoggedIn) {
      this.toast.warn('Faça login para comentar.', 'Acesso necessário');
      return;
    }
    const created = this.commentsSvc.add(this.film.id, this.newComment);
    if (!created) {
      this.toast.warn('Escreva algo antes de publicar.');
      return;
    }
    this.newComment = '';
    this.refreshComments();
    this.toast.success('Comentário publicado.');
  }

  removeComment(id: number) {
    this.commentsSvc.remove(id);
    this.refreshComments();
  }

  shareMovie() {
    if (!this.film) return;
    const url = window.location.href;
    const data = { title: this.film.titulo, text: `Veja "${this.film.titulo}" no Looker`, url };
    if (navigator.share) {
      navigator.share(data).catch(() => { /* user cancelled */ });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => this.toast.success('Link copiado!'));
    } else {
      this.toast.info(url);
    }
  }

  ngOnInit() {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';

    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.ctx?.revert();
      this.ctx = undefined;
      ScrollTrigger.getAll().forEach(t => t.kill());
      window.scrollTo(0, 0);
      this.recommendationService.trackView(id);
      this.movieService.getMovie(id).subscribe((data: FilmeModel) => {
        this.film = data;
        this.recent.track(id);
        this.loadSimilar();
        this.refreshRating();
        this.refreshComments();
        this.favSub?.unsubscribe();
        this.favSub = this.favorites.favorites$.subscribe(set => {
          this.isFavorite = !!this.film && set.has(this.film.id);
        });
        setTimeout(() => this.initAfterLoad(), 0);
        this.trailerKey = null;
        this.trailerLoading = true;
        this.tmdbService.getTrailerKey(this.film.titulo).subscribe(key => {
          this.trailerKey = key;
          this.trailerLoading = false;
        });
      });
    });
  }

  toggleFavorite() {
    if (!this.film) return;
    if (!this.auth.isLoggedIn) {
      this.toast.warn('Faça login para salvar nos favoritos.', 'Acesso necessário');
      return;
    }
    const now = this.favorites.toggle(this.film.id);
    this.toast.info(now ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
  }

  rate(stars: number) {
    if (!this.film) return;
    if (!this.auth.isLoggedIn) {
      this.toast.warn('Faça login para avaliar este filme.', 'Acesso necessário');
      return;
    }
    this.ratingStats = this.ratings.rate(this.film.id, stars);
    this.toast.success(`Você avaliou com ${stars} estrela${stars > 1 ? 's' : ''}.`, 'Avaliação registrada');
  }

  private refreshRating() {
    if (!this.film) return;
    this.ratingStats = this.ratings.statsFor(this.film.id);
  }

  private loadSimilar() {
    this.movieService.getAllMovies().subscribe((all: FilmeModel[]) => {
      this.similarFilms = all
        .filter(m => m.genero === this.film?.genero && m.id !== this.film?.id)
        .slice(0, 7);
    });
  }

  get palette()  { return PALETTES[(this.film?.id ?? 0) % 6]; }
  get gradId()   { return 'fg' + (this.film?.id ?? 0); }
  get radId()    { return 'rg' + (this.film?.id ?? 0); }

  get cast(): CastMember[] {
    if (!this.film?.elenco) return [];
    try { return JSON.parse(this.film.elenco); }
    catch { return []; }
  }

  get filmYear(): number {
    const d = this.film?.ano;
    if (!d) return 0;
    const date = d instanceof Date ? d : new Date(d);
    return date.getUTCFullYear();
  }

  get durationFormatted(): string {
    const min = this.film?.duracao_minutos ?? 0;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  rentMovie() {
    if (!this.film) return;
    this.rentLoading = true;
    this.rentService.getRents(this.film.id).subscribe({
      next: (data: RentResponse) => {
        const iso = data.aluguel.data_prevista_devolucao.replace(/(\.\d{3})\d+/, '$1');
        const devolucao = new Date(iso).toLocaleDateString('pt-BR');
        this.toast.success(
          `Código ${data.pagamento.aluguel_id} — R$ ${data.pagamento.amount}. Devolução até ${devolucao}.`,
          'Aluguel confirmado'
        );
      },
      error: (err: HttpErrorResponse) => {
        this.rentLoading = false;
        if (err.status === 401) { this.toast.warn('Faça login para alugar este filme.', 'Acesso necessário'); return; }
        this.toast.error('Não foi possível concluir o aluguel. Tente novamente.', 'Erro');
      },
      complete: () => { this.rentLoading = false; }
    });
  }

  goBack() { this.router.navigate(['/']); }

  private initAfterLoad(): void {
    window.scrollTo(0, 0);
    requestAnimationFrame(() => this.runAnimations());
  }

  private runAnimations() {
    this.ctx?.revert();
    this.zone.runOutsideAngular(() => {
      this.ctx = gsap.context(() => {
        const hero = this.el.nativeElement.querySelector('.hero');
        const bg   = this.el.nativeElement.querySelector('.hero-bg');

        if (hero && bg) {
          gsap.fromTo(bg,
            { scale: 1.12, filter: 'blur(12px)' },
            { scale: 1, filter: 'blur(0px)', duration: 1.1, ease: 'power4.out' }
          );
          gsap.to(this.el.nativeElement.querySelector('.film-eyebrow'), {
            clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: 0.65, ease: 'power3.out', delay: 0.2
          });
          gsap.to(this.el.nativeElement.querySelector('.film-title'), {
            opacity: 1, y: 0, scale: 1, duration: 0.72, ease: 'power4.out', delay: 0.3
          });
          gsap.to(this.el.nativeElement.querySelector('.film-bottom-row'), {
            opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', delay: 0.5
          });
          gsap.to(bg, {
            yPercent: 18, ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
          });
        }

        this.setupProgressDots();
      }, this.el.nativeElement);
    });
  }

  private setupProgressDots() {
    const sections = this.el.nativeElement.querySelectorAll('[data-section]');
    const dots     = this.el.nativeElement.querySelectorAll('.prog-dot');
    sections.forEach((sec: Element, i: number) => {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (st) => {
          if (st.isActive) {
            dots.forEach((d: Element) => d.classList.remove('active'));
            dots[i]?.classList.add('active');
          }
        }
      });
    });
  }

  ngOnDestroy() {
    this.ctx?.revert();
    this.favSub?.unsubscribe();
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
}
