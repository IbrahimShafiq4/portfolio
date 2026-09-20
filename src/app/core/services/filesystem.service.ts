import { Service, signal } from '@angular/core';
import { FileNode } from '../models/file-node.model';
import { COMPANIES, PROJECTS } from '../../data/projects.data';

@Service()
export class FileSystemService {
    readonly tree = signal<FileNode[]>(this.build());

    private build(): FileNode[] {
        const projectsByCompany = (companyId: string): FileNode[] =>
            PROJECTS.filter(p => p.companyId === companyId).map(p => ({
                id: `file-${p.id}`,
                name: `${p.name}.ts`,
                type: 'file',
                icon: '📄',
                language: 'typescript',
                projectId: p.id,
            }));

        const experienceFolders: FileNode[] = COMPANIES.map(c => ({
            id: `folder-co-${c.id}`,
            name: `${c.icon} ${c.name}`,
            type: 'folder',
            icon: '📂',
            expanded: c.id === 'military' || c.id === 'xblend' || c.id === 'freelance',
            children: projectsByCompany(c.id),
        }));

        return [
            {
                id: 'root',
                name: 'IBRAHIM-SHAFIQ',
                type: 'folder',
                icon: '📁',
                expanded: true,
                children: [
                    { id: 'welcome', name: 'welcome.md', type: 'file', icon: '📘', language: 'markdown' },
                    { id: 'about', name: 'about.ts', type: 'file', icon: '🟦', language: 'typescript' },
                    { id: 'contact', name: 'contact.json', type: 'file', icon: '🟨', language: 'json' },
                    {
                        id: 'experience',
                        name: 'experience',
                        type: 'folder',
                        icon: '📂',
                        expanded: true,
                        children: experienceFolders,
                    },
                    {
                        id: 'skills',
                        name: 'skills',
                        type: 'folder',
                        icon: '📂',
                        expanded: false,
                        children: [
                            { id: 'skills-frontend', name: 'frontend.json', type: 'file', icon: '🅰️', language: 'json' },
                            { id: 'skills-backend', name: 'backend.json', type: 'file', icon: '🟪', language: 'json' },
                            { id: 'skills-architecture', name: 'architecture.json', type: 'file', icon: '🏛️', language: 'json' },
                            { id: 'skills-ui', name: 'ui.json', type: 'file', icon: '🎨', language: 'json' },
                            { id: 'skills-tools', name: 'tools.json', type: 'file', icon: '🔧', language: 'json' },
                        ],
                    },
                    {
                        id: 'config',
                        name: '.config',
                        type: 'folder',
                        icon: '📂',
                        expanded: false,
                        children: [
                            { id: 'cv', name: 'cv.pdf', type: 'file', icon: '📄' },
                            { id: 'themes-cfg', name: 'themes.json', type: 'file', icon: '🎨', language: 'json' },
                            { id: 'gitignore', name: '.gitignore', type: 'file', icon: '🚫' },
                            { id: 'readme', name: 'README.md', type: 'file', icon: '📘', language: 'markdown' },
                        ],
                    },
                ],
            },
        ];
    }

    toggle(node: FileNode): void {
        node.expanded = !node.expanded;
        this.tree.update(t => [...t]);
    }
}