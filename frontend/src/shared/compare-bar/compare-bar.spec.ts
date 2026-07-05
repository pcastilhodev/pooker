import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { CompareBar } from './compare-bar';
import { CompareService } from '../../services/compare-service';

describe('CompareBar', () => {
  let component: CompareBar;
  let fixture: ComponentFixture<CompareBar>;
  let routerSpy: jasmine.SpyObj<Router>;
  let compareSpy: jasmine.SpyObj<CompareService>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    compareSpy = jasmine.createSpyObj('CompareService', ['clear'], {
      idsObs$: new BehaviorSubject<number[]>([1, 2]).asObservable(),
      ids: [1, 2],
    });

    await TestBed.configureTestingModule({
      imports: [CompareBar],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: CompareService, useValue: compareSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompareBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('go navigates to the compare page', () => {
    component.go();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/comparar']);
  });

  it('clear delegates to CompareService', () => {
    component.clear();
    expect(compareSpy.clear).toHaveBeenCalled();
  });
});
