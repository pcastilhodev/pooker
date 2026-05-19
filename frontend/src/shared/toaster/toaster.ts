import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Toast, ToastService } from '../../services/toast-service';

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toaster.html',
  styleUrl: './toaster.css'
})
export class Toaster implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private sub?: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.sub = this.toastService.stream.subscribe(list => (this.toasts = list));
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  dismiss(id: number) { this.toastService.dismiss(id); }

  iconFor(kind: string): string {
    switch (kind) {
      case 'success': return '✓';
      case 'error':   return '✕';
      case 'warn':    return '!';
      default:        return 'i';
    }
  }

  trackById = (_: number, t: Toast) => t.id;
}
