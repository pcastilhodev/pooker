import { Component, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../shared/header/header';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnDestroy {
  private resizeHandler!: () => void;
  private rafHandle = 0;

  constructor(private zone: NgZone) {}

  ngAfterViewInit() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.defaults({ duration: 0 });
    }
    this.zone.runOutsideAngular(() => this.startGrain());
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
  }
}
