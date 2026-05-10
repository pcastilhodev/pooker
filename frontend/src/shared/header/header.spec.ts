import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Header } from './header';
import { Router, provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LoginService } from '../../services/login-service';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideRouter([]),
        { provide: LoginService, useValue: jasmine.createSpyObj('LoginService', ['authenticate', 'register']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should start with scrolled = false', () => {
    expect(component.scrolled).toBeFalse();
  });

  it('should set scrolled = true when scrollY > 40', () => {
    component.onScroll({ scrollTop: 50 } as any);
    expect(component.scrolled).toBeTrue();
  });

  it('should hide header when scrolling down past threshold', () => {
    component.onScroll({ scrollTop: 100 } as any);
    component.onScroll({ scrollTop: 200 } as any);
    expect(component.hidden).toBeTrue();
  });

  it('should show header when scrolling up', () => {
    component.onScroll({ scrollTop: 200 } as any);
    component.onScroll({ scrollTop: 100 } as any);
    expect(component.hidden).toBeFalse();
  });

  it('should open login modal when openLogin() is called', () => {
    component.openLogin();
    expect(component.loginVisible).toBeTrue();
  });
});
