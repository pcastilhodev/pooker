import {
  Component, Input, AfterViewInit, OnDestroy, ElementRef, NgZone, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FilmeModel } from '../../models/filme-model';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const PALETTES = [
  { c1: '#0e0818', c2: '#1a0e2e', c3: '#2a1240', accent: 'rgba(120,80,200,0.28)' },
  { c1: '#0d1520', c2: '#0a2035', c3: '#153050', accent: 'rgba(40,100,180,0.25)' },
  { c1: '#120c08', c2: '#1e1208', c3: '#2e1c0c', accent: 'rgba(160,80,20,0.2)'  },
  { c1: '#0a0c10', c2: '#101520', c3: '#182030', accent: 'rgba(60,80,120,0.2)'  },
  { c1: '#0f0c06', c2: '#1c1808', c3: '#2e2810', accent: 'rgba(180,140,40,0.2)' },
  { c1: '#060e14', c2: '#08182a', c3: '#0c2040', accent: 'rgba(20,80,140,0.3)'  },
];

@Component({
  selector: 'app-film-snap-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './film-snap-section.html',
  styleUrl: './film-snap-section.css'
})
export class FilmSnapSection implements AfterViewInit, OnDestroy {
  @Input() film!: FilmeModel;
  @Input() index = 0;
  @Input() scroller = '#scroll-container';

  @ViewChild('bg')      bgEl!: ElementRef;
  @ViewChild('label')   labelEl!: ElementRef;
  @ViewChild('title')   titleEl!: ElementRef;
  @ViewChild('meta')    metaEl!: ElementRef;
  @ViewChild('actions') actionsEl!: ElementRef;
  @ViewChild('section') sectionEl!: ElementRef;

  private ctx: gsap.Context | undefined;

  constructor(private router: Router, private zone: NgZone) {}

  get palette() { return PALETTES[this.film.id % 6]; }
  get gradId()  { return 'fg' + this.film.id; }
  get radId()   { return 'rg' + this.film.id; }

  get filmYear(): number {
    const d = this.film.ano;
    return d instanceof Date ? d.getFullYear() : new Date(d).getFullYear();
  }

  navigateToDetail() { this.router.navigate([`/movie/${this.film.id}`]); }

  animate() {
    if (!this.bgEl) return;
    this.zone.runOutsideAngular(() => {
      const bg      = this.bgEl.nativeElement;
      const label   = this.labelEl.nativeElement;
      const title   = this.titleEl.nativeElement;
      const meta    = this.metaEl.nativeElement;
      const actions = this.actionsEl.nativeElement;

      gsap.fromTo(bg,
        { scale: 1.14, filter: 'blur(14px)' },
        { scale: 1, filter: 'blur(0px)', duration: 1.05, ease: 'power4.out' }
      );
      gsap.fromTo(label,
        { opacity: 0, x: -36 },
        { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out', delay: 0.08 }
      );
      gsap.fromTo(title,
        { opacity: 0, y: 72, scale: 0.93, transformOrigin: 'left bottom' },
        { opacity: 1, y: 0, scale: 1, duration: 0.68, ease: 'power4.out', delay: 0.14 }
      );
      gsap.fromTo(meta,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.3 }
      );
      gsap.fromTo(actions,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.4 }
      );
    });
  }

  leave() {
    this.zone.runOutsideAngular(() => {
      const label   = this.labelEl?.nativeElement;
      const title   = this.titleEl?.nativeElement;
      const meta    = this.metaEl?.nativeElement;
      const actions = this.actionsEl?.nativeElement;
      gsap.to([label, meta, actions], { opacity: 0, y: -16, duration: 0.35, ease: 'power2.in' });
      gsap.to(title, { opacity: 0, y: -30, duration: 0.4, ease: 'power2.in' });
    });
  }

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      this.ctx = gsap.context(() => {
        gsap.to(this.bgEl.nativeElement, {
          yPercent: 15,
          ease: 'none',
          scrollTrigger: {
            trigger: this.sectionEl.nativeElement,
            scroller: this.scroller,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          }
        });
      });
    });
  }

  ngOnDestroy() { this.ctx?.revert(); }
}
