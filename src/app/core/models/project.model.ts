export type Tech = 'angular' | 'dotnet' | 'both';

export type CompanyType = 'military' | 'startup' | 'freelance' | 'personal';

export type ProjectCategory = 'FullStack' | 'Frontend' | 'Backend' | 'MVC';

export type DemoKind =
    | 'transferorders' | 'reminder' | 'enlisted' | 'sectorreports' | 'normalization'
    | 'arroom' | 'almotafiq' | 'azaccounting' | 'bwt' | 'businessstep'
    | 'afkar' | 'ennwy'
    | 'taskflow' | 'omnisocial'
    | 'quiz' | 'pm' | 'hotel' | 'foody' | 'weather' | 'boxshadow' | 'imageeditor'
    | 'mvc';

export interface Company {
    id: string;
    name: string;
    type: CompanyType;
    icon: string;
    color: string;
    period?: string;
    location?: string;
    note?: string;
}

export interface Project {
    id: string;
    name: string;
    tech: Tech;
    category: ProjectCategory;
    companyId: string;
    summary: string;
    description: string;
    features: string[];
    stack: string[];
    demo?: DemoKind;
    status: 'live' | 'archived' | 'practice' | 'confidential';
}