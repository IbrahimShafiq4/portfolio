import { Service, computed, signal } from '@angular/core';
import { COMPANIES, CONTACT, PROJECTS, SKILLS } from '../../data/projects.data';
import { Company, Project, ProjectCategory, Tech } from '../models/project.model';

@Service()
export class ProjectsService {
    readonly companies = COMPANIES;
    readonly projects = PROJECTS;
    readonly skills = SKILLS;
    readonly contact = CONTACT;

    readonly search = signal('');
    readonly filterCompany = signal<string>('all');
    readonly filterTech = signal<Tech | 'all'>('all');
    readonly filterCategory = signal<ProjectCategory | 'all'>('all');

    readonly filtered = computed(() => {
        const q = this.search().trim().toLowerCase();
        const c = this.filterCompany();
        const t = this.filterTech();
        const cat = this.filterCategory();

        return this.projects.filter(p => {
            if (c !== 'all' && p.companyId !== c) return false;
            if (t !== 'all' && p.tech !== t) return false;
            if (cat !== 'all' && p.category !== cat) return false;
            if (!q) return true;
            return (
                p.name.toLowerCase().includes(q) ||
                p.summary.toLowerCase().includes(q) ||
                p.stack.some(s => s.toLowerCase().includes(q))
            );
        });
    });

    byId(id: string): Project | undefined {
        return this.projects.find(p => p.id === id);
    }

    companyById(id: string): Company | undefined {
        return this.companies.find(c => c.id === id);
    }

    countByCompany(companyId: string): number {
        return this.projects.filter(p => p.companyId === companyId).length;
    }

    countByCategory(category: ProjectCategory): number {
        return this.projects.filter(p => p.category === category).length;
    }
}