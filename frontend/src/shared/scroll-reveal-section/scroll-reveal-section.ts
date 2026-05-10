import { Component, ElementRef, NgZone, AfterViewInit, OnDestroy } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-scroll-reveal-section',
  standalone: true,
  template: `<ng-content />`,
  styles: [`:host { display: block; }`]
})
export class ScrollRevealSection implements AfterViewInit, OnDestroy {
  private ctx: gsap.Context | undefined;

  constructor(private el: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      const host = this.el.nativeElement;
      const children = Array.from(host.children) as Element[];
      if (!children.length) return;

      this.ctx = gsap.context(() => {
        gsap.from(children, {
          scrollTrigger: { trigger: host, start: 'top 85%' },
          opacity: 0,
          y: 40,
          stagger: 0.08,
          duration: 0.7,
          ease: 'power3.out'
        });
      });
    });
  }

  ngOnDestroy() { this.ctx?.revert(); }
}
