import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RecommendationsSection } from './recommendations-section';

describe('RecommendationsSection', () => {
  let component: RecommendationsSection;
  let fixture: ComponentFixture<RecommendationsSection>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    await TestBed.configureTestingModule({
      imports: [RecommendationsSection],
      providers: [{ provide: Router, useValue: routerSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(RecommendationsSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('go navigates to the movie detail page', () => {
    component.go(42);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/movie', 42]);
  });
});
