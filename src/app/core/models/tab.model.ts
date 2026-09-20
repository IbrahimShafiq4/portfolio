export type SidebarPanel =
    | 'explorer' | 'search' | 'companies' | 'projects'
    | 'skills' | 'themes' | 'contact' | 'dotnet';

export type TabType = 'welcome' | 'project' | 'file' | 'cv';

export interface EditorTab {
    id: string;
    title: string;
    icon: string;
    type: TabType;
    projectId?: string;
    fileId?: string;
    language?: string;
    closable: boolean;
}