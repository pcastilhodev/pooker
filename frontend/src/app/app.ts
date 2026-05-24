import { Component, AfterViewInit, OnDestroy, NgZone, HostListener } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Header } from '../shared/header/header';
import { Toaster } from '../shared/toaster/toaster';
import { ShortcutsHelp } from '../shared/shortcuts-help/shortcuts-help';
import { ShortcutsService } from '../services/shortcuts-service';
import { DueBanner } from '../shared/due-banner/due-banner';
import { SurpriseMe } from '../shared/surprise-me/surprise-me';
import { SurpriseService } from '../services/surprise-service';
import { CompareBar } from '../shared/compare-bar/compare-bar';
import { ToastService } from '../services/toast-service';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const G_LEADER_TIMEOUT = 1200;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Header, Toaster, ShortcutsHelp, DueBanner, SurpriseMe, CompareBar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnDestroy {
  private resizeHandler!: () => void;
  private rafHandle = 0;
  private gPending = false;
  private gTimer: ReturnType<typeof setTimeout> | undefined;

  surpriseOpen = false;
  cinemaMode = false;
  private konamiSeq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  private konamiIdx = 0;

  constructor(
    private zone: NgZone,
    private router: Router,
    private shortcuts: ShortcutsService,
    private surprise: SurpriseService,
    private toast: ToastService,
  ) {
    this.surprise.isOpen$.subscribe(v => (this.surpriseOpen = v));
  }

  closeSurprise() { this.surprise.close(); }

  private toggleCinemaMode() {
    this.cinemaMode = !this.cinemaMode;
    document.documentElement.classList.toggle('cinema-classic', this.cinemaMode);
    if (this.cinemaMode) {
      this.toast.success('🎞️ Modo Cinema Clássico ativado', 'Easter egg!');
    } else {
      this.toast.info('Modo Cinema Clássico desativado');
    }
  }

  ngAfterViewInit() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.defaults({ duration: 0 });
    }
    this.zone.runOutsideAngular(() => this.startGrain());
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    this.trackKonami(e.key);
    if (this.isTypingTarget(e.target) && e.key !== 'Escape') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === '?') {
      e.preventDefault();
      this.shortcuts.toggleHelp();
      return;
    }

    if (e.key === '/') {
      e.preventDefault();
      this.shortcuts.requestSearchFocus();
      return;
    }

    if (e.key === 'Escape') {
      this.shortcuts.closeHelp();
      return;
    }

    if (this.gPending && /^[a-z]$/.test(e.key)) {
      e.preventDefault();
      this.handleGLeader(e.key);
      return;
    }

    if (e.key === 'g' && !e.shiftKey) {
      e.preventDefault();
      this.gPending = true;
      clearTimeout(this.gTimer);
      this.gTimer = setTimeout(() => { this.gPending = false; }, G_LEADER_TIMEOUT);
    }
  }

  private handleGLeader(key: string) {
    clearTimeout(this.gTimer);
    this.gPending = false;
    const map: Record<string, string> = {
      h: '/',
      f: '/favoritos',
      w: '/watchlist',
      r: '/meus-alugueis',
      p: '/profile',
    };
    const route = map[key];
    if (route) this.zone.run(() => this.router.navigateByUrl(route));
  }

  private trackKonami(key: string) {
    const expected = this.konamiSeq[this.konamiIdx];
    if (key.toLowerCase() === expected.toLowerCase()) {
      this.konamiIdx++;
      if (this.konamiIdx === this.konamiSeq.length) {
        this.konamiIdx = 0;
        this.zone.run(() => this.toggleCinemaMode());
      }
    } else {
      this.konamiIdx = key.toLowerCase() === this.konamiSeq[0].toLowerCase() ? 1 : 0;
    }
  }

  private isTypingTarget(t: EventTarget | null): boolean {
    if (!(t instanceof HTMLElement)) return false;
    const tag = t.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
  }

  private startGrain() {
    const canvas = document.getElementById('grain') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0;

    this.resizeHandler = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    this.resizeHandler();
    window.addEventListener('resize', this.resizeHandler, { passive: true });

    const tick = () => {
      if (w && h) {
        const d = ctx.createImageData(w, h);
        const b = d.data;
        for (let i = 0; i < b.length; i += 4) {
          const v = Math.random() * 255;
          b[i] = b[i + 1] = b[i + 2] = v;
          b[i + 3] = 16 + Math.random() * 22;
        }
        ctx.putImageData(d, 0, 0);
      }
      this.rafHandle = requestAnimationFrame(tick);
    };
    tick();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeHandler);
    cancelAnimationFrame(this.rafHandle);
    clearTimeout(this.gTimer);
  }
}
