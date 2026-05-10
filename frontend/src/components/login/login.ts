import {
  Component, EventEmitter, HostListener, Input, Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegisterModel } from '../../models/register-model';

export type LoginTab = 'login' | 'register';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  @Input()  startVisible = false;
  @Output() loginSubmit    = new EventEmitter<{ username: string; password: string; remember: boolean }>();
  @Output() registerSubmit = new EventEmitter<RegisterModel>();
  @Output() closed         = new EventEmitter<void>();

  activeTab: LoginTab = 'login';

  loginForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    remember: new FormControl(false)
  });

  registerForm = new FormGroup({
    username:    new FormControl('', Validators.required),
    email:       new FormControl('', [Validators.required, Validators.email]),
    password:    new FormControl('', [Validators.required, Validators.minLength(8)]),
    cpf:         new FormControl('', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]),
    phone:       new FormControl('', [Validators.required, Validators.minLength(10)]),
    dateOfBirth: new FormControl('', Validators.required),
  });

  setTab(tab: LoginTab) { this.activeTab = tab; }

  closeModal() {
    this.loginForm.reset();
    this.registerForm.reset();
    this.activeTab = 'login';
    this.closed.emit();
  }

  onOverlayClick(e: Event) {
    if (e.target === e.currentTarget) this.closeModal();
  }

  @HostListener('document:keydown.escape')
  onEscape() { this.closeModal(); }

  onLoginSubmit() {
    if (!this.loginForm.valid) return;
    const v = this.loginForm.value;
    this.loginSubmit.emit({
      username: v.username!, password: v.password!, remember: v.remember ?? false
    });
    this.closeModal();
  }

  onRegisterSubmit() {
    if (!this.registerForm.valid) return;
    const v = this.registerForm.value;
    const data: RegisterModel = {
      nome:            v.username   ?? '',
      email:           v.email      ?? '',
      senha:           v.password   ?? '',
      cpf:             v.cpf        ?? '',
      telefone:        v.phone      ?? '',
      data_nascimento: new Date(v.dateOfBirth ?? ''),
      role:            'user'
    };
    this.registerSubmit.emit(data);
    this.closeModal();
  }
}
