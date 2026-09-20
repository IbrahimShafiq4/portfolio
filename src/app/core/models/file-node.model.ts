export interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder';
    icon: string;
    language?: string;
    content?: string;
    projectId?: string;
    children?: FileNode[];
    expanded?: boolean;
}