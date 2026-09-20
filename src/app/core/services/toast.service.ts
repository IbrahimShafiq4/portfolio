import { Service, signal } from '@angular/core';

export interface Toast {
    id: number;
    kind: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message?: string;
    icon?: string;
    duration?: number;
    action?: { label: string; run: () => void };
}

@Service()
export class ToastService {
    readonly toasts = signal<Toast[]>([]);
    private nextId = 1;

    success(title: string, message?: string, icon = '✓'): void {
        this.push({ kind: 'success', title, message, icon });
    }
    error(title: string, message?: string, icon = '✕'): void {
        this.push({ kind: 'error', title, message, icon });
    }
    info(title: string, message?: string, icon = 'ℹ'): void {
        this.push({ kind: 'info', title, message, icon });
    }
    warning(title: string, message?: string, icon = '⚠'): void {
        this.push({ kind: 'warning', title, message, icon });
    }

    private push(partial: Omit<Toast, 'id'>): void {
        const toast: Toast = {
            id: this.nextId++,
            duration: partial.duration ?? 3200,
            ...partial,
        };
        this.toasts.update(list => [...list, toast]);
        if (toast.duration && toast.duration > 0) {
            setTimeout(() => this.dismiss(toast.id), toast.duration);
        }
    }

    dismiss(id: number): void {
        this.toasts.update(list => list.filter(t => t.id !== id));
    }

    clear(): void {
        this.toasts.set([]);
    }
}