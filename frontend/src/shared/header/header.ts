import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Login } from '../../components/login/login';
import { LoginService } from '../../services/login-service';
import { RegisterModel } from '../../models/register-model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, Login],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements AfterViewInit, OnDestroy {
  scrolled     = false;
  hidden       = false;
  loginVisible = false;

  private lastScrollTop = 0;
  private readonly SCROLL_THRESHOLD = 40;
  private readonly HIDE_THRESHOLD   = 80;
  private scrollHandler!: () => void;

  constructor(public router: Router, private loginService: LoginService) {}

  ngAfterViewInit() {
    const sc = document.getElementById('scroll-container');
    if (sc) {
      this.scrollHandler = () => this.onScroll({ scrollTop: sc.scrollTop });
      sc.addEventListener('scroll', this.scrollHandler, { passive: true });
    }
  }

  ngOnDestroy() {
    const sc = document.getElementById('scroll-container');
    if (sc && this.scrollHandler) {
      sc.removeEventListener('scroll', this.scrollHandler);
    }
  }

  onScroll(event: { scrollTop: number }) {
    const st = event.scrollTop;
    this.scrolled = st > this.SCROLL_THRESHOLD;

    if (st > this.lastScrollTop && st > this.HIDE_THRESHOLD) {
      this.hidden = true;
    } else if (st < this.lastScrollTop) {
      this.hidden = false;
    }
    this.lastScrollTop = st;
  }

  openLogin()  { this.loginVisible = true; }
  closeLogin() { this.loginVisible = false; }

  handleLogin(event: { username: string; password: string; remember: boolean }) {
    this.loginService.authenticate(event.username, event.password).subscribe({
      next: (res: any) => {
        localStorage.setItem('jwt', String(res.token));
        this.closeLogin();
      },
      error: () => alert('Falha no login, tente novamente.')
    });
  }

  handleRegister(event: RegisterModel) {
    this.loginService.register(event).subscribe({
      next: () => { alert('Registro concluído!'); this.closeLogin(); },
      error: () => alert('Falha no registro.')
    });
  }
}
