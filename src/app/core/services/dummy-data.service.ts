import { Service, computed, signal } from '@angular/core';

export interface DummyRecord {
    id: string;
    [key: string]: string | number | boolean | undefined;
}

export interface DummySchema {
    projectId: string;
    label: string;
    confidential: boolean;
    columns: { key: string; label: string; type: 'text' | 'number' | 'select'; options?: string[] }[];
    records: DummyRecord[];
}

const SEED: Record<string, DummySchema> = {
    'transfer-orders': {
        projectId: 'transfer-orders',
        label: 'Transfer Orders',
        confidential: true,
        columns: [
            { key: 'orderId', label: 'Order ID', type: 'text' },
            { key: 'soldier', label: 'Soldier', type: 'text' },
            { key: 'from', label: 'From', type: 'text' },
            { key: 'to', label: 'To', type: 'text' },
            { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Approved', 'Executed'] },
        ],
        records: [
            { id: '1', orderId: 'A-1029', soldier: 'Mohamed A. Kamal', from: 'Battalion 3', to: 'Battalion 7', status: 'Pending' },
            { id: '2', orderId: 'A-1030', soldier: 'Youssef K. Adel', from: 'Battalion 5', to: 'Battalion 2', status: 'Approved' },
            { id: '3', orderId: 'A-1031', soldier: 'Omar S. Hassan', from: 'Battalion 1', to: 'Battalion 4', status: 'Executed' },
        ],
    },
    'reminder': {
        projectId: 'reminder',
        label: 'Reminder Notifications',
        confidential: true,
        columns: [
            { key: 'soldier', label: 'Soldier', type: 'text' },
            { key: 'note', label: 'Note', type: 'text' },
            { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Confirmed'] },
        ],
        records: [
            { id: '1', soldier: 'Sgt. Kamal', note: 'Returned from mission', status: 'Pending' },
            { id: '2', soldier: 'Cpl. Adel', note: 'Sector B confirmed', status: 'Confirmed' },
        ],
    },
    'enlisted': {
        projectId: 'enlisted',
        label: 'Enlisted Personnel',
        confidential: true,
        columns: [
            { key: 'id_', label: 'Military ID', type: 'text' },
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'rank', label: 'Rank', type: 'text' },
            { key: 'sector', label: 'Sector', type: 'text' },
            { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Transfer', 'Leave', 'Training'] },
        ],
        records: [
            { id: '1', id_: 'M-001', name: 'Ahmed M. Kamal', rank: 'Sgt.', sector: 'Cairo', status: 'Active' },
            { id: '2', id_: 'M-002', name: 'Youssef K. Adel', rank: 'Cpl.', sector: 'Giza', status: 'Active' },
            { id: '3', id_: 'M-003', name: 'Omar S. Hassan', rank: 'Pvt.', sector: 'Alex', status: 'Transfer' },
        ],
    },
    'sectorreports': {
        projectId: 'sectorreports',
        label: 'Sector Reports',
        confidential: true,
        columns: [
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'sector', label: 'Sector', type: 'text' },
            { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Completed', 'Alert'] },
        ],
        records: [
            { id: '1', title: 'Sector B — Night patrol', sector: 'Sector B', status: 'Completed' },
            { id: '2', title: 'Civilian affairs Q4', sector: 'Sector A', status: 'Alert' },
        ],
    },
    'normalization': {
        projectId: 'normalization',
        label: 'Arabic Records',
        confidential: true,
        columns: [
            { key: 'raw', label: 'Raw', type: 'text' },
            { key: 'normalized', label: 'Normalized', type: 'text' },
            { key: 'status', label: 'Status', type: 'select', options: ['Matched', 'Fuzzy', 'Failed'] },
        ],
        records: [
            { id: '1', raw: 'محمّــد  أحـمــد', normalized: 'محمد احمد', status: 'Matched' },
            { id: '2', raw: 'خالـد    سمير', normalized: 'خالد سمير', status: 'Fuzzy' },
        ],
    },
};

@Service()
export class DummyDataService {
    private readonly store = signal<Record<string, DummySchema>>(
        structuredClone(SEED)
    );

    readonly schemas = computed(() => this.store());
    private nextId = 100;

    schema(projectId: string): DummySchema | undefined {
        return this.store()[projectId];
    }

    get(projectId: string): DummyRecord[] {
        return this.store()[projectId]?.records ?? [];
    }

    add(projectId: string, record: Partial<DummyRecord>): void {
        const s = this.store()[projectId];
        if (!s) return;
        const row: DummyRecord = { id: `dm-${this.nextId++}`, ...record } as DummyRecord;
        this.store.update(all => ({
            ...all,
            [projectId]: { ...s, records: [...s.records, row] },
        }));
    }

    update(projectId: string, id: string, patch: Partial<DummyRecord>): void {
        const s = this.store()[projectId];
        if (!s) return;
        this.store.update(all => ({
            ...all,
            [projectId]: {
                ...s,
                records: s.records.map(r => r.id === id ? { ...r, ...patch } : r),
            },
        }));
    }

    remove(projectId: string, id: string): void {
        const s = this.store()[projectId];
        if (!s) return;
        this.store.update(all => ({
            ...all,
            [projectId]: { ...s, records: s.records.filter(r => r.id !== id) },
        }));
    }

    reset(projectId: string): void {
        if (!SEED[projectId]) return;
        this.store.update(all => ({
            ...all,
            [projectId]: structuredClone(SEED[projectId]),
        }));
    }
}