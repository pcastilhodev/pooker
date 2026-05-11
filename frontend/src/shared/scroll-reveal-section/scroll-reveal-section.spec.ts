import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ScrollRevealSection } from './scroll-reveal-section';

@Component({
  standalone: true,
  imports: [ScrollRevealSection],
  template: `<app-scroll-reveal-section><p class="child">hello</p></app-scroll-reveal-section>`
})
class HostComponent {}

describe('ScrollRevealSection', () => {
  let fixture: ComponentFixture<HostComponent>;
  let observerCallback: IntersectionObserverCallback;
  let mockObserver: jasmine.SpyObj<IntersectionObserver>;

  beforeEach(async () => {
    mockObserver = jasmine.createSpyObj('IntersectionObserver', ['observe', 'disconnect']);

    spyOn(window, 'IntersectionObserver').and.callFake((cb: IntersectionObserverCallback) => {
      observerCallback = cb;
      return mockObserver;
    });

    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should project content', () => {
    expect(fixture.nativeElement.querySelector('.child')).not.toBeNull();
  });

  it('should set children to opacity 0 initially', () => {
    const child = fixture.nativeElement.querySelector('.child') as HTMLElement;
    expect(child.style.opacity).toBe('0');
  });

  it('should set children transform initially', () => {
    const child = fixture.nativeElement.querySelector('.child') as HTMLElement;
    expect(child.style.transform).toBe('translateY(40px)');
  });

  it('should start observing the host element', () => {
    expect(mockObserver.observe).toHaveBeenCalled();
  });

  it('should reveal children when intersection occurs', (done) => {
    const child = fixture.nativeElement.querySelector('.child') as HTMLElement;
    const host  = fixture.nativeElement.querySelector('app-scroll-reveal-section') as HTMLElement;

    observerCallback([{ isIntersecting: true, target: host } as IntersectionObserverEntry], mockObserver);

    setTimeout(() => {
      expect(child.style.opacity).toBe('1');
      expect(child.style.transform).toBe('translateY(0)');
      done();
    }, 150);
  });

  it('should not reveal children when not intersecting', () => {
    const child = fixture.nativeElement.querySelector('.child') as HTMLElement;
    const host  = fixture.nativeElement.querySelector('app-scroll-reveal-section') as HTMLElement;

    observerCallback([{ isIntersecting: false, target: host } as IntersectionObserverEntry], mockObserver);

    expect(child.style.opacity).toBe('0');
  });

  it('should disconnect observer after revealing', (done) => {
    const host = fixture.nativeElement.querySelector('app-scroll-reveal-section') as HTMLElement;

    observerCallback([{ isIntersecting: true, target: host } as IntersectionObserverEntry], mockObserver);

    setTimeout(() => {
      expect(mockObserver.disconnect).toHaveBeenCalled();
      done();
    }, 150);
  });
});
