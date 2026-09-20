import { Service, signal } from '@angular/core';

export interface Command {
    id: string;
    label: string;
    hint?: string;
    icon: string;
    action: () => void;
}

@Service()
export class CommandPaletteService {
    readonly open = signal(false);
    readonly query = signal('');
    readonly commands = signal<Command[]>([]);

    register(commands: Command[]): void {
        this.commands.set(commands);
    }

    toggle(): void {
        this.open.update(v => !v);
        if (!this.open()) this.query.set('');
    }

    close(): void {
        this.open.set(false);
        this.query.set('');
    }
}