import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StarRating } from './star-rating';

describe('StarRating', () => {
  let component: StarRating;
  let fixture: ComponentFixture<StarRating>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarRating]
    }).compileComponents();

    fixture = TestBed.createComponent(StarRating);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onHover', () => {
    it('should set hover to n when not readonly', () => {
      component.readonly = false;
      component.onHover(3);
      expect(component.hover).toBe(3);
    });

    it('should not change hover when readonly', () => {
      component.readonly = true;
      component.onHover(3);
      expect(component.hover).toBe(0);
    });
  });

  describe('onLeave', () => {
    it('should reset hover to 0', () => {
      component.hover = 4;
      component.onLeave();
      expect(component.hover).toBe(0);
    });
  });

  describe('select', () => {
    it('should do nothing when readonly', () => {
      component.readonly = true;
      spyOn(component.rated, 'emit');
      component.select(4);
      expect(component.value).toBe(0);
      expect(component.rated.emit).not.toHaveBeenCalled();
    });

    it('should set value and emit rated when not readonly', () => {
      component.readonly = false;
      spyOn(component.rated, 'emit');
      component.select(4);
      expect(component.value).toBe(4);
      expect(component.rated.emit).toHaveBeenCalledWith(4);
    });
  });

  describe('isFilled', () => {
    it('should use value as reference when hover is 0', () => {
      component.hover = 0;
      component.value = 3;
      expect(component.isFilled(3)).toBe(true);
      expect(component.isFilled(4)).toBe(false);
    });

    it('should use hover as reference when hover is set, overriding value', () => {
      component.hover = 2;
      component.value = 5;
      expect(component.isFilled(2)).toBe(true);
      expect(component.isFilled(3)).toBe(false);
    });
  });

  describe('template interactions', () => {
    it('should render one button per star', () => {
      const buttons = fixture.nativeElement.querySelectorAll('.star');
      expect(buttons.length).toBe(5);
    });

    it('should call select when a star button is clicked', () => {
      spyOn(component, 'select').and.callThrough();
      const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.star');
      buttons[2].click();
      expect(component.select).toHaveBeenCalledWith(3);
    });

    it('should call onHover when a star button is hovered', () => {
      spyOn(component, 'onHover').and.callThrough();
      const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.star');
      buttons[1].dispatchEvent(new Event('mouseenter'));
      expect(component.onHover).toHaveBeenCalledWith(2);
    });

    it('should call onLeave when the mouse leaves the stars container', () => {
      spyOn(component, 'onLeave').and.callThrough();
      const container: HTMLElement = fixture.nativeElement.querySelector('.stars');
      container.dispatchEvent(new Event('mouseleave'));
      expect(component.onLeave).toHaveBeenCalled();
    });
  });
});
