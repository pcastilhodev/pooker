import { Component, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-scroll-reveal-section',
  standalone: true,
  template: `<ng-content />`,
  styles: [`:host { display: block; }`]
})
export class ScrollRevealSection implements AfterViewInit, OnDestroy {
  private observer: IntersectionObserver | undefined;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit() {
    const host = this.el.nativeElement;
    const children = Array.from(host.children) as HTMLElement[];
    if (!children.length) return;

    children.forEach(child => {
      child.style.opacity = '0';
      child.style.transform = 'translateY(40px)';
      child.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    });

    this.observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        children.forEach((child, i) => {
          setTimeout(() => {
            child.style.opacity = '1';
            child.style.transform = 'translateY(0)';
          }, i * 80);
        });
        this.observer?.disconnect();
      }
    }, { threshold: 0.15 });

    this.observer.observe(host);
  }

  ngOnDestroy() { this.observer?.disconnect(); }
}
