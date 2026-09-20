import { Injectable, Service, signal } from '@angular/core';
import { TabsService } from './tabs.service';
import { ThemeService } from './theme.service';
import { LayoutService } from './layout.service';
import { ProjectsService } from './projects.service';
import { CommandPaletteService } from './command-palette.service';

export interface TermLine {
    id: number;
    kind: 'input' | 'output' | 'error' | 'success' | 'muted';
    text: string;
}

const BANNER = [
    'ibrahim-portfolio shell — v3.0',
    'Type `help` to see available commands.',
];

const HELP = [
    'COMMANDS',
    '  help                Show this help',
    '  clear               Clear the terminal',
    '  whoami              About Ibrahim',
    '  pwd                 Print current directory',
    '  ls                  List all projects',
    '  ls companies        List companies',
    '  cd <project-id>     Navigate to a project (opens it)',
    '  cd ~                Return to workspace root',
    '  open <project-id>   Open project preview (same as cd)',
    '  cv                  Open CV in a new tab',
    '  theme <id>          Change theme',
    '  accent <color>      Change accent',
    '  sidebar <panel>     Open sidebar',
    '  sidebar close       Collapse sidebar',
    '  terminal            Toggle terminal',
    '  date                Show current date/time',
    '  echo <text>         Print text',
    '  js <expression>     Evaluate JavaScript',
    '',
    'SHORTCUTS',
    '  ⌘K / Ctrl+K         Command palette',
    '  ⌘` / Ctrl+`         Toggle terminal',
    '  Esc                 Close palette',
];

@Injectable({providedIn: 'root'})
export class TerminalService {
    readonly lines = signal<TermLine[]>([]);
    readonly cwd = signal<string>('~');
    private history: string[] = [];
    private historyIdx = -1;

    constructor(
        private tabs: TabsService,
        private theme: ThemeService,
        private layout: LayoutService,
        private projects: ProjectsService,
        private palette: CommandPaletteService,
    ) {
        this.boot();
    }

    private boot(): void {
        BANNER.forEach(t => this.push('muted', t));
        this.push('muted', '');
    }

    push(kind: TermLine['kind'], text: string): void {
        this.lines.update(list => [...list, { id: Date.now() + Math.random(), kind, text }]);
    }

    clear(): void { this.lines.set([]); }

    historyPrev(): string {
        if (!this.history.length) return '';
        this.historyIdx = Math.min(this.historyIdx + 1, this.history.length - 1);
        return this.history[this.history.length - 1 - this.historyIdx];
    }

    historyNext(): string {
        if (!this.history.length) return '';
        this.historyIdx = Math.max(this.historyIdx - 1, -1);
        return this.historyIdx < 0 ? '' : this.history[this.history.length - 1 - this.historyIdx];
    }

    async run(raw: string): Promise<void> {
        const input = raw.trim();
        if (!input) return;
        this.push('input', `${this.cwd()} $ ${input}`);
        this.history.push(input);
        this.historyIdx = -1;

        const [cmd, ...args] = input.split(/\s+/);

        switch (cmd.toLowerCase()) {
            case 'help': HELP.forEach(l => this.push('output', l)); break;
            case 'clear': this.clear(); break;
            case 'whoami': this.whoami(); break;
            case 'pwd': this.push('output', this.cwd()); break;
            case 'ls': this.ls(args[0]); break;
            case 'cd': this.cd(args.join(' ')); break;
            case 'open': this.open(args[0]); break;
            case 'cv': this.openCv(); break;
            case 'theme': this.setTheme(args[0]); break;
            case 'accent': this.setAccent(args[0]); break;
            case 'sidebar': this.sidebar(args[0]); break;
            case 'terminal': this.layout.toggleTerminal(); this.push('success', '✓ Terminal toggled'); break;
            case 'date': this.push('output', new Date().toString()); break;
            case 'echo': this.push('output', args.join(' ')); break;
            case 'js': this.evalJs(args.join(' ')); break;
            default:
                this.push('error', `command not found: ${cmd}`);
                this.push('muted', 'Type `help` for available commands.');
        }
    }

    private whoami(): void {
        const c = this.projects.contact;
        [
            c.name,
            c.title,
            c.location,
            `${c.email} · ${c.phone}`,
            '',
            c.summary,
        ].forEach(l => this.push('output', l));
    }

    private ls(filter?: string): void {
        if (filter === 'companies') {
            this.push('muted', 'COMPANIES');
            this.projects.companies.forEach(c =>
                this.push('output', `  ${c.icon}  ${c.id.padEnd(12)} ${c.name}`)
            );
            return;
        }
        this.push('muted', 'PROJECTS');
        this.projects.projects.forEach(p => {
            const tag = p.tech === 'both' ? 'A|.NET' : p.tech === 'angular' ? 'Angular' : '.NET';
            this.push('output', `  ${p.id.padEnd(24)} [${tag.padEnd(7)}] ${p.name}`);
        });
        this.push('muted', `${this.projects.projects.length} projects · type \`cd <id>\``);
    }

    private cd(target?: string): void {
        // Handle special paths
        if (
            !target ||
            target === '~' ||
            target === '..' ||
            target === '/' ||
            target === 'home' ||
            target === 'root'
        ) {
            this.cwd.set('~');
            this.push('success', '✓ Back to workspace root');
            return;
        }

        const q = target.toLowerCase().trim();

        // Exact match by id
        let project = this.projects.byId(q);

        // Fuzzy match
        if (!project) {
            const candidates = this.projects.projects.filter(p =>
                p.id.toLowerCase().startsWith(q) ||
                p.id.toLowerCase().includes(q) ||
                p.name.toLowerCase().includes(q)
            );

            if (candidates.length === 1) {
                project = candidates[0];
            } else if (candidates.length > 1) {
                this.push('error', `cd: ambiguous match for "${target}"`);
                this.push('muted', 'Did you mean one of:');
                candidates.slice(0, 8).forEach(p =>
                    this.push('output', `  ${p.id.padEnd(24)} ${p.name}`)
                );
                return;
            }
        }

        if (!project) {
            this.push('error', `cd: no such directory: ${target}`);
            this.push('muted', 'Type `ls` to see all available projects.');
            return;
        }

        // Open the project tab
        this.tabs.open({
            id: `project-${project.id}`,
            title: project.name,
            icon: '🧩',
            type: 'project',
            projectId: project.id,
            closable: true,
        });

        // Update the prompt
        this.cwd.set(`~/projects/${project.id}`);

        // Feedback
        this.push('success', `✓ cd → ${project.name}`);
        this.push('muted', `  ${project.summary}`);
        this.push('muted', `  Stack: ${project.stack.slice(0, 4).join(' · ')}`);
    }

    private open(id?: string): void {
        if (!id) { this.push('error', 'usage: open <project-id>'); return; }
        const p = this.projects.byId(id);
        if (!p) { this.push('error', `project not found: ${id}`); return; }
        this.tabs.open({
            id: `project-${p.id}`,
            title: p.name,
            icon: '🧩',
            type: 'project',
            projectId: p.id,
            closable: true,
        });
        this.push('success', `✓ Opened "${p.name}"`);
    }

    private openCv(): void {
        this.tabs.open({
            id: 'cv',
            title: 'CV.pdf',
            icon: '📄',
            type: 'cv',
            closable: true,
        });
        this.push('success', '✓ CV opened in new tab');
    }

    private setTheme(id?: string): void {
        const found = this.theme.themes.find(t => t.id === id);
        if (!found) {
            this.push('error', `unknown theme: ${id ?? '(none)'}`);
            this.push('muted', this.theme.themes.map(t => t.id).join(' · '));
            return;
        }
        this.theme.setTheme(found.id);
        this.push('success', `✓ Theme → ${found.label}`);
    }

    private setAccent(c?: string): void {
        const found = this.theme.accents.find(a => a.id === c);
        if (!found) {
            this.push('error', `unknown accent: ${c ?? '(none)'}`);
            this.push('muted', this.theme.accents.map(a => a.id).join(' · '));
            return;
        }
        this.theme.setAccent(found.id);
        this.push('success', `✓ Accent → ${found.label}`);
    }

    private sidebar(panel?: string): void {
        if (panel === 'close') {
            this.layout.closeSidebar();
            this.push('success', '✓ Sidebar collapsed');
            return;
        }
        const valid = ['explorer', 'search', 'companies', 'projects', 'skills', 'themes', 'contact'];
        if (!panel || !valid.includes(panel)) {
            this.push('error', 'usage: sidebar <explorer|search|companies|projects|skills|themes|contact|close>');
            return;
        }
        this.layout.showSidebar(panel as any);
        this.push('success', `✓ Sidebar → ${panel}`);
    }

    private evalJs(expr: string): void {
        if (!expr) { this.push('error', 'usage: js <expression>'); return; }
        try {
            const result = Function('"use strict"; return (' + expr + ')')();
            const display = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
            display.split('\n').forEach(l => this.push('output', l));
        } catch (e) {
            this.push('error', String(e));
        }
    }
}