import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef,
  HostListener, computed, inject, signal, viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TerminalService } from '../../core/services/terminal.service';
import { LayoutService } from '../../core/services/layout.service';
import { ProjectsService } from '../../core/services/projects.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-ctx]': '"terminal"' },
  template: `
    <div class="term" [style.height.px]="layout.terminalHeight()">
      <header class="term-bar">
        <div class="tabs">
          <button class="tab active">
            <span class="dot-status"></span>
            <span>bash</span>
          </button>
        </div>
        <div class="actions">
          <button class="icon-btn" (click)="svc.clear()" title="Clear">⌫</button>
          <button class="icon-btn" (click)="layout.toggleTerminal()" title="Close">✕</button>
        </div>
      </header>

      <div class="term-body" #body (click)="focusInput()">
        @for (line of svc.lines(); track line.id) {
          <div class="line" [class]="line.kind">{{ line.text || '&nbsp;' }}</div>
        }
      </div>

      @if (showSuggestions()) {
        <div class="suggestions">
          @for (s of suggestions(); track s; let i = $index) {
            <button
              class="suggestion"
              [class.active]="i === suggestionIdx()"
              (click)="applySuggestion(s)"
              (mouseenter)="suggestionIdx.set(i)"
            >
              <span class="s-icon">{{ iconFor(s) }}</span>
              <span>{{ s }}</span>
            </button>
          }
        </div>
      }

      <div class="term-input">
        <span class="prompt">{{ svc.cwd() }} $</span>
        <input
          #input
          type="text"
          spellcheck="false"
          autocomplete="off"
          autocapitalize="off"
          [(ngModel)]="value"
          (keydown)="onKeydown($event)"
          placeholder="type a command… (Tab for autocomplete)"
        />
      </div>

      <div class="resize-handle" (mousedown)="startResize($event)"></div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .term {
      display: flex;
      flex-direction: column;
      background: var(--bg-terminal);
      color: var(--bg-terminal-text);
      font-family: var(--sf-mono);
      font-size: 12.5px;
      line-height: 1.55;
      border-top: 0.5px solid var(--separator);
      position: relative;
      min-height: 140px;
      animation: termIn 260ms var(--ease-spring);
    }
    @keyframes termIn {
      from { transform: translateY(12px); opacity: 0.6; }
      to   { transform: translateY(0); opacity: 1; }
    }
    .term-bar {
      display: flex; justify-content: space-between; align-items: center;
      height: 34px; padding: 0 8px;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 0.5px solid rgba(255, 255, 255, 0.06);
      flex-shrink: 0;
    }
    .tabs { display: flex; gap: 2px; }
    .tab {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 12px;
      border-radius: var(--r-xs);
      font-size: 11.5px;
      font-family: var(--sf);
      color: rgba(255, 255, 255, 0.65);
    }
    .tab.active { background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.95); }
    .dot-status {
      width: 7px; height: 7px; border-radius: 50%;
      background: #34c759;
      box-shadow: 0 0 0 2px rgba(52, 199, 89, 0.15);
    }
    .actions { display: flex; gap: 2px; }
    .icon-btn {
      width: 26px; height: 26px;
      display: grid; place-items: center;
      border-radius: var(--r-xs);
      font-size: 13px;
      color: rgba(255, 255, 255, 0.55);
      transition: all var(--t-fast) var(--ease-smooth);
    }
    .icon-btn:hover { background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.9); }
    .term-body { flex: 1; overflow-y: auto; padding: 10px 14px 4px; scroll-behavior: smooth; }
    .line {
      white-space: pre-wrap;
      word-break: break-word;
      animation: lineIn 160ms var(--ease-out);
    }
    @keyframes lineIn {
      from { opacity: 0; transform: translateY(2px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .line.input   { color: #7ec699; }
    .line.output  { color: var(--bg-terminal-text); }
    .line.error   { color: #ff7b72; }
    .line.success { color: #7ee787; }
    .line.muted   { color: rgba(255, 255, 255, 0.42); }
    .suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 8px 14px;
      background: rgba(255, 255, 255, 0.02);
      border-top: 0.5px solid rgba(255, 255, 255, 0.06);
      animation: slideUp 180ms var(--ease-spring);
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .suggestion {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.75);
      border-radius: var(--r-pill);
      font-size: 11px;
      font-family: var(--sf-mono);
      transition: all var(--t-fast);
    }
    .suggestion:hover, .suggestion.active {
      background: var(--accent);
      color: var(--accent-contrast);
    }
    .s-icon { font-size: 11px; }
    .term-input {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 14px 12px;
      flex-shrink: 0;
      border-top: 0.5px solid rgba(255, 255, 255, 0.04);
    }
    .prompt { color: #7ec699; flex-shrink: 0; }
    .term-input input {
      flex: 1;
      background: transparent;
      border: 0;
      outline: none;
      color: var(--bg-terminal-text);
      font-family: inherit;
      font-size: inherit;
      caret-color: #7ec699;
    }
    .term-input input::placeholder { color: rgba(255, 255, 255, 0.28); }
    .resize-handle {
      position: absolute;
      top: -3px; left: 0; right: 0;
      height: 6px;
      cursor: ns-resize;
      z-index: 10;
    }
    .resize-handle:hover { background: var(--accent); opacity: 0.35; }
  `],
})
export class TerminalComponent implements AfterViewInit {
  readonly svc = inject(TerminalService);
  readonly layout = inject(LayoutService);
  private projects = inject(ProjectsService);
  private theme = inject(ThemeService);

  readonly bodyRef = viewChild.required<ElementRef<HTMLElement>>('body');
  readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');

  value = '';
  private resizing = false;

  readonly suggestionIdx = signal(0);

  readonly suggestions = computed(() => {
    const v = this.value.trim().toLowerCase();
    if (!v) return [];

    const commands = [
      'help', 'clear', 'whoami', 'pwd', 'ls', 'ls companies',
      'cd ~', 'cv', 'sidebar close', 'terminal', 'date',
      ...this.theme.themes.map(t => `theme ${t.id}`),
      ...this.theme.accents.map(a => `accent ${a.id}`),
      ...this.projects.projects.map(p => `cd ${p.id}`),
      ...this.projects.projects.map(p => `open ${p.id}`),
      ...['explorer', 'search', 'companies', 'projects', 'skills', 'themes', 'contact']
        .map(s => `sidebar ${s}`),
    ];

    return commands.filter(c => c.startsWith(v) && c !== v).slice(0, 8);
  });

  readonly showSuggestions = computed(() => this.suggestions().length > 0);

  ngAfterViewInit(): void {
    this.focusInput();
    queueMicrotask(() => this.scrollToBottom());
  }

  async onKeydown(ev: KeyboardEvent): Promise<void> {
    if (ev.key === 'Tab' && this.showSuggestions()) {
      ev.preventDefault();
      const s = this.suggestions()[this.suggestionIdx()];
      if (s) this.value = s;
      return;
    }
    if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      if (this.showSuggestions()) {
        this.suggestionIdx.update(i => Math.max(0, i - 1));
      } else {
        this.value = this.svc.historyPrev();
      }
      return;
    }
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      if (this.showSuggestions()) {
        this.suggestionIdx.update(i => Math.min(this.suggestions().length - 1, i + 1));
      } else {
        this.value = this.svc.historyNext();
      }
      return;
    }
    if (ev.key === 'Enter') {
      ev.preventDefault();
      await this.submit();
    }
  }

  async submit(): Promise<void> {
    const v = this.value;
    this.value = '';
    this.suggestionIdx.set(0);
    await this.svc.run(v);
    setTimeout(() => this.scrollToBottom(), 20);
    this.focusInput();
  }

  applySuggestion(s: string): void {
    this.value = s;
    this.suggestionIdx.set(0);
    this.focusInput();
  }

  iconFor(s: string): string {
    if (s.startsWith('cd ') || s.startsWith('open ')) return '🧩';
    if (s.startsWith('theme ') || s.startsWith('accent ')) return '🎨';
    if (s.startsWith('sidebar ')) return '📁';
    if (s === 'cv') return '📄';
    return '⌘';
  }

  focusInput(): void { this.inputRef()?.nativeElement.focus(); }

  private scrollToBottom(): void {
    const el = this.bodyRef()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  startResize(ev: MouseEvent): void {
    ev.preventDefault();
    this.resizing = true;
    const startY = ev.clientY;
    const startH = this.layout.terminalHeight();

    const move = (e: MouseEvent) => {
      if (!this.resizing) return;
      const delta = startY - e.clientY;
      this.layout.setTerminalHeight(startH + delta);
    };
    const up = () => {
      this.resizing = false;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }

  @HostListener('document:keydown', ['$event'])
  onDocKey(ev: KeyboardEvent): void {
    const meta = ev.ctrlKey || ev.metaKey;
    if (meta && ev.key === '`') {
      ev.preventDefault();
      if (this.layout.terminalOpen()) setTimeout(() => this.focusInput(), 50);
    }
  }
}