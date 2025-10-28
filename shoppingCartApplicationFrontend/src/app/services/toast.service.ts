import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private toasts: Toast[] = [];
  private toastSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastSubject.asObservable();
  private toastId = 0;

  constructor() { }

  showSuccess(message: string, duration: number = 5000) {
    this.show('success', message, duration);
  }

  showError(message: string, duration: number = 5000) {
    this.show('error', message, duration);
  }

  showWarning(message: string, duration: number = 5000) {
    this.show('warning', message, duration);
  }

  showInfo(message: string, duration: number = 5000) {
    this.show('info', message, duration);
  }

  success(message: string, duration: number = 5000) {
    this.show('success', message, duration);
  }

  error(message: string, duration: number = 5000) {
    this.show('error', message, duration);
  }

  warning(message: string, duration: number = 5000) {
    this.show('warning', message, duration);
  }

  info(message: string, duration: number = 5000) {
    this.show('info', message, duration);
  }

  private show(type: 'success' | 'error' | 'warning' | 'info', message: string, duration: number) {
    const toast: Toast = {
      id: this.toastId++,
      type,
      message,
      duration
    };

    this.toasts.push(toast);
    this.toastSubject.next([...this.toasts]);

    setTimeout(() => {
      this.remove(toast.id);
    }, duration);
  }

  remove(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.toastSubject.next([...this.toasts]);
  }

  clear() {
    this.toasts = [];
    this.toastSubject.next([]);
  }
}
