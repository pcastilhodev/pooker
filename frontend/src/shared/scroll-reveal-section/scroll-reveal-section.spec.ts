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

  beforeEach(async () => {
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
});
