export interface JobPosting {
    id: string;
    title: string;
    titleAr: string;
    company: string;
    companyLogo: string;
    location: string;
    type: 'full-time' | 'part-time' | 'contract' | 'remote';
    salaryMin: number;
    salaryMax: number;
    currency: string;
    category: string;
    postedAt: string;
    applicants: number;
    views: number;
    tags: string[];
    description: string;
    requirements: string[];
    benefits: string[];
    status: 'active' | 'paused' | 'closed';
}

export interface JobApplication {
    id: string;
    jobId: string;
    candidate: string;
    candidateEmail: string;
    avatar: string;
    stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
    appliedAt: string;
    rating: number;
    resumeUrl: string;
    notes: string[];
}

export interface Candidate {
    id: string;
    name: string;
    title: string;
    location: string;
    email: string;
    phone: string;
    avatar: string;
    experience: number;
    skills: string[];
    resumeUrl: string;
    savedAt?: string;
}

export const AFKAR_JOBS: JobPosting[] = [
    { id: 'JOB-101', title: 'Senior Angular Developer', titleAr: 'مطور أنجولار أول', company: 'TechCorp', companyLogo: '🚀', location: 'Cairo, Egypt', type: 'full-time', salaryMin: 35000, salaryMax: 55000, currency: 'EGP', category: 'Frontend', postedAt: '2024-12-08', applicants: 42, views: 1240, tags: ['Angular', 'TypeScript', 'RxJS', 'NgRx'], description: 'Build scalable Angular applications for enterprise clients', requirements: ['5+ years Angular', 'Expert in RxJS', 'NgRx production experience'], benefits: ['Health insurance', 'Remote 2 days/week', 'Annual bonus'], status: 'active' },
    { id: 'JOB-102', title: '.NET Backend Engineer', titleAr: 'مهندس .NET Backend', company: 'StartupX', companyLogo: '⚙️', location: 'Remote', type: 'remote', salaryMin: 30000, salaryMax: 48000, currency: 'EGP', category: 'Backend', postedAt: '2024-12-07', applicants: 28, views: 892, tags: ['C#', '.NET 9', 'EF Core', 'SQL Server'], description: 'Design and build RESTful APIs with .NET 9', requirements: ['3+ years .NET', 'EF Core', 'SQL Server'], benefits: ['Full remote', 'Flexible hours', 'Learning budget'], status: 'active' },
    { id: 'JOB-103', title: 'Full-Stack Engineer', titleAr: 'مهندس Full-Stack', company: 'FinBank', companyLogo: '🏦', location: 'Hybrid, Cairo', type: 'full-time', salaryMin: 45000, salaryMax: 65000, currency: 'EGP', category: 'FullStack', postedAt: '2024-12-05', applicants: 67, views: 2104, tags: ['Angular', 'ASP.NET', 'SQL Server'], description: 'Ship features end-to-end for banking platform', requirements: ['Full-stack experience', 'Banking domain knowledge', 'Security awareness'], benefits: ['Top-tier salary', 'Stock options', 'Health insurance'], status: 'active' },
    { id: 'JOB-104', title: 'Frontend Contract', titleAr: 'عقد تطوير واجهات', company: 'Design Studio', companyLogo: '🎨', location: 'Cairo', type: 'contract', salaryMin: 20000, salaryMax: 30000, currency: 'EGP', category: 'Frontend', postedAt: '2024-12-03', applicants: 15, views: 412, tags: ['Angular', 'SCSS', 'Figma'], description: 'Build a marketing website for a design studio', requirements: ['Pixel-perfect CSS', 'Figma-to-code', 'Responsive'], benefits: ['Short engagement', 'Flexible schedule'], status: 'active' },
    { id: 'JOB-105', title: 'Angular Team Lead', titleAr: 'قائد فريق Angular', company: 'BigCo', companyLogo: '🏢', location: 'New Cairo', type: 'full-time', salaryMin: 60000, salaryMax: 90000, currency: 'EGP', category: 'Frontend', postedAt: '2024-12-01', applicants: 12, views: 687, tags: ['Angular', 'Leadership', 'Architecture'], description: 'Lead a team of 6 Angular engineers', requirements: ['Team lead experience', 'Architecture skills'], benefits: ['Leadership role', 'Car allowance'], status: 'paused' },
];

export const AFKAR_APPLICATIONS: JobApplication[] = [
    { id: 'APP-001', jobId: 'JOB-101', candidate: 'Ahmed Mohamed', candidateEmail: 'ahmed@example.com', avatar: '🅰', stage: 'interview', appliedAt: '2024-12-06', rating: 4.5, resumeUrl: '/resumes/ahmed.pdf', notes: ['Strong RxJS skills', 'Good communication'] },
    { id: 'APP-002', jobId: 'JOB-101', candidate: 'Youssef Khaled', candidateEmail: 'youssef@example.com', avatar: '🅱', stage: 'screening', appliedAt: '2024-12-07', rating: 4.0, resumeUrl: '/resumes/youssef.pdf', notes: ['Needs more NgRx experience'] },
    { id: 'APP-003', jobId: 'JOB-101', candidate: 'Sara Ahmed', candidateEmail: 'sara@example.com', avatar: '🅲', stage: 'offer', appliedAt: '2024-12-04', rating: 5.0, resumeUrl: '/resumes/sara.pdf', notes: ['Excellent', 'Fast learner'] },
    { id: 'APP-004', jobId: 'JOB-102', candidate: 'Omar Samir', candidateEmail: 'omar@example.com', avatar: '🅳', stage: 'applied', appliedAt: '2024-12-08', rating: 0, resumeUrl: '/resumes/omar.pdf', notes: [] },
    { id: 'APP-005', jobId: 'JOB-102', candidate: 'Layla Hassan', candidateEmail: 'layla@example.com', avatar: '🅴', stage: 'interview', appliedAt: '2024-12-05', rating: 4.3, resumeUrl: '/resumes/layla.pdf', notes: ['Good SQL knowledge'] },
    { id: 'APP-006', jobId: 'JOB-103', candidate: 'Khaled Mostafa', candidateEmail: 'khaled@example.com', avatar: '🅵', stage: 'hired', appliedAt: '2024-11-28', rating: 5.0, resumeUrl: '/resumes/khaled.pdf', notes: ['Perfect fit'] },
    { id: 'APP-007', jobId: 'JOB-103', candidate: 'Nour Ibrahim', candidateEmail: 'nour@example.com', avatar: '🅶', stage: 'rejected', appliedAt: '2024-11-30', rating: 2.5, resumeUrl: '/resumes/nour.pdf', notes: ['Missing backend experience'] },
];

export const AFKAR_CANDIDATES: Candidate[] = [
    { id: 'C-001', name: 'Sara Ahmed', title: 'Senior Angular Developer', location: 'Cairo', email: 'sara@example.com', phone: '+20 100 555 0001', avatar: '👩‍💻', experience: 6, skills: ['Angular', 'TypeScript', 'NgRx', 'RxJS', 'SCSS'], resumeUrl: '/resumes/sara.pdf', savedAt: '2024-12-04' },
    { id: 'C-002', name: 'Ahmed Mohamed', title: 'Full-Stack Engineer', location: 'Giza', email: 'ahmed@example.com', phone: '+20 100 555 0002', avatar: '👨‍💻', experience: 4, skills: ['Angular', '.NET', 'SQL Server', 'Docker'], resumeUrl: '/resumes/ahmed.pdf', savedAt: '2024-12-06' },
    { id: 'C-003', name: 'Khaled Mostafa', title: 'Backend Engineer', location: 'Remote', email: 'khaled@example.com', phone: '+20 100 555 0003', avatar: '👨‍🔧', experience: 7, skills: ['C#', '.NET 9', 'EF Core', 'Azure', 'Kubernetes'], resumeUrl: '/resumes/khaled.pdf', savedAt: '2024-11-28' },
];