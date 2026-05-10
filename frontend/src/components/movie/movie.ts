import {
  Component, OnInit, AfterViewInit, OnDestroy, NgZone, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FilmeModel } from '../../models/filme-model';
import { MovieService } from '../../services/movie-service';
import { Rent } from '../../services/rent';
import { ScrollRevealSection } from '../../shared/scroll-reveal-section/scroll-reveal-section';
import { MovieCard } from '../../shared/movie-card/movie-card';
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
  imports: [CommonModule, RouterModule, ScrollRevealSection, MovieCard],
  templateUrl: './movie.html',
  styleUrl: './movie.css'
})
export class Movie implements OnInit, AfterViewInit, OnDestroy {
  film:         FilmeModel | undefined;
  similarFilms: FilmeModel[] = [];
  rentLoading   = false;

  readonly castMock    = CAST_MOCK;
  readonly reviewsMock = REVIEWS_MOCK;

  private ctx: gsap.Context | undefined;

  constructor(
    private route:        ActivatedRoute,
    private router:       Router,
    private movieService: MovieService,
    private rentService:  Rent,
    private zone:         NgZone,
    private el:           ElementRef
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.movieService.getMovie(id).subscribe((data: any) => {
        this.film = data as FilmeModel;
        this.loadSimilar();
      });
    });
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
      next: (data: any) => {
        const iso = data.aluguel.data_prevista_devolucao.replace(/(\.\d{3})\d+/, '$1');
        alert(`Aluguel realizado! Código: ${data.pagamento.aluguel_id} — R$ ${data.pagamento.amount}`);
        alert(`Devolução prevista: ${new Date(iso).toLocaleDateString('pt-BR')}`);
      },
      error: (err: any) => {
        this.rentLoading = false;
        if (err.status === 401) { alert('Faça login para alugar.'); return; }
        alert('Erro ao alugar. Tente novamente.');
      },
      complete: () => { this.rentLoading = false; }
    });
  }

  goBack() { this.router.navigate(['/']); }

  ngAfterViewInit() {
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

  ngOnDestroy() { this.ctx?.revert(); }
}
