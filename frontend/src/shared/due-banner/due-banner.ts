import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth-service';
import { Rent, RentalItem } from '../../services/rent';

const DUE_WINDOW_DAYS = 3;
const DISMISS_KEY = 'looker:due-banner-dismissed';

@Component({
  selector: 'app-due-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './due-banner.html',
  styleUrl: './due-banner.css'
})
export class DueBanner implements OnInit, OnDestroy {
  dueSoon: RentalItem[] = [];
  visible = false;
  private sub?: Subscription;

  constructor(private auth: AuthService, private rentService: Rent, private router: Router) {}

  ngOnInit() {
    this.sub = this.auth.user$.subscribe(() => this.refresh());
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  dismiss() {
    this.visible = false;
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  }

  goToRentals() {
    this.router.navigate(['/meus-alugueis']);
    this.dismiss();
  }

  daysUntil(iso: string): number {
    const target = new Date(iso).getTime();
    return Math.max(0, Math.ceil((target - Date.now()) / 86_400_000));
  }

  private refresh() {
    if (!this.auth.isLoggedIn) { this.visible = false; this.dueSoon = []; return; }
    const dismissed = (() => { try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; } })();
    if (dismissed) return;

    this.rentService.listMyRents().subscribe({
      next: items => {
        const now = Date.now();
        const window = DUE_WINDOW_DAYS * 86_400_000;
        this.dueSoon = (items || [])
          .filter(r => r.status === 'ativo')
          .filter(r => {
            const due = new Date(r.data_prevista_devolucao).getTime();
            return due - now <= window && due - now >= -2 * 86_400_000;
          })
          .sort((a, b) => new Date(a.data_prevista_devolucao).getTime() - new Date(b.data_prevista_devolucao).getTime());
        this.visible = this.dueSoon.length > 0;
      },
      error: () => { this.visible = false; }
    });
  }
}
