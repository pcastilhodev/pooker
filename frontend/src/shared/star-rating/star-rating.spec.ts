import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StarRating } from './star-rating';

describe('StarRating', () => {
  let component: StarRating;
  let fixture: ComponentFixture<StarRating>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StarRating] }).compileComponents();
    fixture = TestBed.createComponent(StarRating);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('onHover sets hover when not readonly', () => {
    component.onHover(3);
    expect(component.hover).toBe(3);
  });

  it('onHover does nothing when readonly', () => {
    component.readonly = true;
    component.onHover(3);
    expect(component.hover).toBe(0);
  });

  it('onLeave resets hover to 0', () => {
    component.onHover(4);
    component.onLeave();
    expect(component.hover).toBe(0);
  });

  it('select updates value and emits rated event', () => {
    let emitted = -1;
    component.rated.subscribe((n: number) => (emitted = n));
    component.select(4);

    expect(component.value).toBe(4);
    expect(emitted).toBe(4);
  });

  it('select does nothing when readonly', () => {
    component.readonly = true;
    component.select(5);
    expect(component.value).toBe(0);
  });

  it('isFilled uses hover over value when hovering', () => {
    component.value = 1;
    component.onHover(3);
    expect(component.isFilled(3)).toBeTrue();
    expect(component.isFilled(4)).toBeFalse();
  });

  it('isFilled falls back to value when not hovering', () => {
    component.value = 2;
    expect(component.isFilled(2)).toBeTrue();
    expect(component.isFilled(3)).toBeFalse();
  });
});
