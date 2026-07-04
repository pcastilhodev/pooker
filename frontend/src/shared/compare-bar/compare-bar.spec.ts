import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CompareBar } from './compare-bar';
import { CompareService } from '../../services/compare-service';

describe('CompareBar', () => {
  let component: CompareBar;
  let fixture: ComponentFixture<CompareBar>;
  let routerSpy: jasmine.SpyObj<Router>;
  let compareSpy: jasmine.SpyObj<CompareService>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    compareSpy = jasmine.createSpyObj('CompareService', ['clear'], { ids: [1, 2] });

    await TestBed.configureTestingModule({
      imports: [CompareBar],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: CompareService, useValue: compareSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CompareBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('go', () => {
    it('should navigate to /comparar', () => {
      component.go();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/comparar']);
    });
  });

  describe('clear', () => {
    it('should delegate to compareService.clear()', () => {
      component.clear();
      expect(compareSpy.clear).toHaveBeenCalled();
    });
  });

  describe('template interactions', () => {
    it('should render the bar when there are selected ids', () => {
      expect(fixture.nativeElement.querySelector('.compare-bar')).not.toBeNull();
    });

    it('should call go() when the compare button is clicked', () => {
      spyOn(component, 'go');
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.cbar-btn');
      btn.click();
      expect(component.go).toHaveBeenCalled();
    });

    it('should call clear() when the clear button is clicked', () => {
      spyOn(component, 'clear');
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.cbar-clear');
      btn.click();
      expect(component.clear).toHaveBeenCalled();
    });
  });
});
