import {
  Component, Output, EventEmitter, AfterViewInit, OnDestroy, NgZone, HostListener
} from '@angular/core';
import { gsap } from 'gsap';

@Component({
  selector: 'app-film-intro',
  standalone: true,
  templateUrl: './film-intro.html',
  styleUrl: './film-intro.css'
})
export class FilmIntro implements AfterViewInit, OnDestroy {
  @Output() dismissed = new EventEmitter<void>();

  private tl: gsap.core.Timeline | undefined;
  private exitTl: gsap.core.Tween | undefined;
  private isDismissed = false;

  constructor(private zone: NgZone) {}

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => this.play());
  }

  private play() {
    this.tl = gsap.timeline({ onComplete: () => this.dismiss() });

    this.tl.to('#intro-line-fill', { width: '100%', duration: 0.7, ease: 'power2.inOut' }, 0.3);
    this.tl.to('#intro-logo', { clipPath: 'inset(0 0% 0 0)', duration: 1.0, ease: 'power4.out' }, 0.55);
    this.tl.to('#intro-tagline', { opacity: 1, duration: 0.7, ease: 'power2.out' }, 1.3);
    this.tl.to('#intro-hint', { opacity: 1, duration: 0.6, ease: 'power2.out' }, 1.75);
    this.tl.add(() => {}, '+=1.2');
  }

  dismiss() {
    if (this.isDismissed) return;
    this.isDismissed = true;
    this.tl?.kill();
    this.zone.run(() => this.dismissed.emit());
    this.exitTl = gsap.to('#intro', {
      scale: 1.06, opacity: 0, duration: 0.6, ease: 'power3.in'
    });
  }

  @HostListener('document:keydown')
  onKeydown() { this.dismiss(); }

  ngOnDestroy() {
    this.tl?.kill();
    this.exitTl?.kill();
  }
}
