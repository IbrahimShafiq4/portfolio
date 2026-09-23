import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export type CodeLanguage = 'typescript' | 'csharp' | 'html' | 'scss' | 'json' | 'bash' | 'sql' | 'yaml';

@Component({
  selector: 'app-code-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cv">
      <header class="cv-head">
        <div class="cv-tabs">
          @for (f of files(); track f.name) {
            <button
              class="cv-tab"
              [class.active]="activeFile() === f.name"
              (click)="activeFile.set(f.name)"
            >
              <span class="cv-tab-icon">{{ fileIcon(f.language) }}</span>
              <span class="cv-tab-name">{{ f.name }}</span>
            </button>
          }
        </div>

        <div class="cv-actions">
          <span class="cv-lang">{{ activeFileData()?.language }}</span>
          <button class="cv-copy" (click)="copy()">
            {{ copied() ? '✓ COPIED' : '📋 COPY' }}
          </button>
        </div>
      </header>

      <div class="cv-body">
        <div class="cv-gutter">
          @for (n of lineNumbers(); track n) {
            <span class="cv-line-num">{{ n }}</span>
          }
        </div>
        <pre class="cv-code"><code [innerHTML]="highlighted()"></code></pre>
      </div>

      <footer class="cv-foot">
        <span class="cv-foot-item">UTF-8</span>
        <span class="cv-foot-item">{{ lineCount() }} lines</span>
        <span class="cv-foot-item">Ln 1, Col 1</span>
        <span class="cv-foot-item cv-foot-right">{{ activeFileData()?.language }}</span>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .cv {
      background: var(--bg-code);
      border: 1px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
      font-family: var(--sf-mono);
    }

    .cv-head {
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      background: var(--bg-chrome);
      border-bottom: 1px solid var(--separator);
      min-height: 38px;
    }

    .cv-tabs {
      display: flex;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .cv-tabs::-webkit-scrollbar { display: none; }

    .cv-tab {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 14px;
      background: transparent;
      border: 0;
      border-right: 1px solid var(--separator);
      color: var(--label-2);
      font-size: 11.5px;
      font-family: var(--sf-mono);
      cursor: pointer;
      white-space: nowrap;
      transition: all 140ms ease;
    }

    .cv-tab:hover { background: var(--bg-hover); color: var(--label); }
    .cv-tab.active {
      background: var(--bg-code);
      color: var(--label);
      border-top: 2px solid var(--accent);
    }

    .cv-tab-icon { font-size: 11px; }
    .cv-tab-name { font-size: 11px; }

    .cv-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
    }

    .cv-lang {
      font-size: 10px;
      padding: 3px 8px;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: var(--r-pill);
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .cv-copy {
      padding: 4px 10px;
      background: var(--bg-fill-2);
      border: 1px solid var(--separator);
      border-radius: var(--r-xs);
      color: var(--label);
      font-size: 10px;
      font-family: var(--sf-mono);
      font-weight: 700;
      cursor: pointer;
      transition: all 140ms ease;
    }

    .cv-copy:hover {
      background: var(--accent);
      color: var(--accent-contrast);
      border-color: var(--accent);
    }

    .cv-body {
      display: grid;
      grid-template-columns: auto 1fr;
      max-height: 500px;
      overflow-y: auto;
      font-size: 12.5px;
      line-height: 1.65;
    }

    .cv-gutter {
      display: flex;
      flex-direction: column;
      padding: 12px 0;
      background: var(--bg-fill-2);
      border-right: 1px solid var(--separator);
      user-select: none;
      min-width: 44px;
    }

    .cv-line-num {
      padding: 0 12px;
      text-align: right;
      color: var(--label-3);
      font-size: 11px;
    }

    .cv-code {
      padding: 12px 16px;
      white-space: pre;
      overflow-x: auto;
      color: var(--label);
      tab-size: 2;
      margin: 0;
    }

    :host ::ng-deep .t-kw { color: #c586c0; font-weight: 600; }
    :host ::ng-deep .t-str { color: #ce9178; }
    :host ::ng-deep .t-num { color: #b5cea8; }
    :host ::ng-deep .t-cmt { color: #6a9955; font-style: italic; }
    :host ::ng-deep .t-fn { color: #dcdcaa; }
    :host ::ng-deep .t-type { color: #4ec9b0; }
    :host ::ng-deep .t-dec { color: #569cd6; }
    :host ::ng-deep .t-att { color: #9cdcfe; }
    :host ::ng-deep .t-tag { color: #569cd6; }

    :host-context([data-theme='default-light']) ::ng-deep .t-kw { color: #af00db; }
    :host-context([data-theme='default-light']) ::ng-deep .t-str { color: #a31515; }
    :host-context([data-theme='default-light']) ::ng-deep .t-num { color: #098658; }
    :host-context([data-theme='default-light']) ::ng-deep .t-cmt { color: #008000; }
    :host-context([data-theme='default-light']) ::ng-deep .t-fn { color: #795e26; }
    :host-context([data-theme='default-light']) ::ng-deep .t-type { color: #267f99; }

    .cv-foot {
      display: flex;
      gap: 16px;
      padding: 6px 14px;
      background: var(--bg-chrome);
      border-top: 1px solid var(--separator);
      font-size: 10px;
      color: var(--label-2);
    }

    .cv-foot-right { margin-left: auto; }

    @media (max-width: 640px) {
      .cv-body { max-height: 400px; font-size: 11px; }
      .cv-code { padding: 10px 12px; }
      .cv-gutter { min-width: 36px; }
      .cv-line-num { padding: 0 8px; font-size: 10px; }
    }
  `],
})
export class CodeViewerComponent {
  files = input.required<{ name: string; language: CodeLanguage; code: string; }[]>();

  readonly activeFile = signal<string>('');
  readonly copied = signal(false);

  readonly activeFileData = computed(() => {
    const list = this.files();
    return list.find(f => f.name === this.activeFile()) ?? list[0];
  });

  readonly lineCount = computed(() => (this.activeFileData()?.code ?? '').split('\n').length);

  readonly lineNumbers = computed(() =>
    Array.from({ length: this.lineCount() }, (_, i) => i + 1)
  );

  readonly highlighted = computed(() => this.highlight(this.activeFileData()?.code ?? ''));

  constructor() {
    queueMicrotask(() => {
      const list = this.files();
      if (list.length && !this.activeFile()) this.activeFile.set(list[0].name);
    });
  }

  fileIcon(lang: CodeLanguage): string {
    const map: Record<CodeLanguage, string> = {
      typescript: '🟦', csharp: '🟪', html: '🟧', scss: '🟪',
      json: '🟨', bash: '⬛', sql: '🟦', yaml: '🟨',
    };
    return map[lang];
  }

  copy(): void {
    navigator.clipboard?.writeText(this.activeFileData()?.code ?? '');
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1600);
  }

  private highlight(src: string): string {
    let out = src
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    out = out.replace(/(\/\/[^\n]*|#(?!\{)[^\n]*)/g, '<span class="t-cmt">$1</span>');
    out = out.replace(/(&quot;[^&\n]*?&quot;|"[^"\n]*?"|'[^'\n]*?')/g, '<span class="t-str">$1</span>');
    out = out.replace(/\b(true|false|null|undefined|this|new|typeof|async|await)\b/g, '<span class="t-kw">$1</span>');
    out = out.replace(/\b(export|import|from|const|let|var|function|return|if|else|for|while|class|interface|type|extends|implements|public|private|protected|readonly|static|async|await|new|throw|try|catch|using|namespace|record|enum|switch|case|break|default|void)\b/g, '<span class="t-kw">$1</span>');
    out = out.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="t-num">$1</span>');
    out = out.replace(/\b([A-Z][a-zA-Z0-9_]+)\b/g, '<span class="t-type">$1</span>');
    out = out.replace(/([a-zA-Z_][\w]*)\s*\(/g, '<span class="t-fn">$1</span>(');
    out = out.replace(/@([a-zA-Z]+)/g, '<span class="t-dec">@$1</span>');

    return out;
  }
}