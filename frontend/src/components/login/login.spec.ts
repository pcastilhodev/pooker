import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    component.startVisible = true;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should start on login tab', () => {
    expect(component.activeTab).toBe('login');
  });

  it('should switch to register tab on setTab("register")', () => {
    component.setTab('register');
    expect(component.activeTab).toBe('register');
  });

  it('should emit closed when closeModal is called', () => {
    let emitted = false;
    component.closed.subscribe(() => emitted = true);
    component.closeModal();
    expect(emitted).toBeTrue();
  });

  it('should not emit loginSubmit when login form is invalid', () => {
    let emitted = false;
    component.loginSubmit.subscribe(() => emitted = true);
    component.onLoginSubmit();
    expect(emitted).toBeFalse();
  });

  it('should emit loginSubmit when login form is valid', () => {
    let emitted = false;
    component.loginSubmit.subscribe(() => emitted = true);
    component.loginForm.setValue({ username: 'user@test.com', password: 'pass123', remember: false });
    component.onLoginSubmit();
    expect(emitted).toBeTrue();
  });

  it('should not emit registerSubmit when register form is invalid', () => {
    let emitted = false;
    component.registerSubmit.subscribe(() => emitted = true);
    component.onRegisterSubmit();
    expect(emitted).toBeFalse();
  });
});
