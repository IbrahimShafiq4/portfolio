import { Flow } from '../../core/models/flow.model';

export const TRANSFER_ORDERS_FLOWS: Flow[] = [
    {
        id: 'create-approve-execute',
        name: 'Create → Approve → Execute',
        description: 'Full lifecycle of a transfer order from creation to execution.',
        icon: '🎖',
        actor: 'Officer → Commander',
        difficulty: 'intermediate',
        tags: ['workflow', 'approval', 'document'],
        steps: [
            {
                id: 's1',
                title: 'GET /TransferOrders/Create',
                description: 'Open new order form',
                uiDescription: 'Officer sees form with soldier picker, from/to units, and effective date.',
                actor: 'Officer',
                request: { method: 'GET', route: '/TransferOrders/Create', auth: 'Authorize(Officer)' },
                response: { status: 200, statusText: 'OK', body: { view: 'Create.cshtml', units: [] }, timeMs: 62, size: '18 KB' },
            },
            {
                id: 's2',
                title: 'POST /TransferOrders/Create',
                description: 'Submit order',
                uiDescription: 'Success toast. Redirect to order details. Status = PENDING.',
                actor: 'Officer',
                request: {
                    method: 'POST', route: '/TransferOrders/Create', auth: 'Authorize(Officer)',
                    body: { SoldierId: 'M-88102', FromUnit: 'Battalion 3', ToUnit: 'Battalion 7', Reason: 'Operational need' },
                },
                response: { status: 302, statusText: 'Redirect', body: null, timeMs: 240, size: '0.4 KB' },
                sideEffects: ['INSERT TransferOrders (Status="pending")', 'INSERT AuditLog (Action="Created")'],
            },
            {
                id: 's3',
                title: 'POST /TransferOrders/{id}/Approve',
                description: 'Commander approves order',
                uiDescription: 'PDF preview generates. Approval modal confirms.',
                actor: 'Commander',
                request: { method: 'POST', route: '/TransferOrders/A-1029/Approve', auth: 'Authorize(Commander)' },
                response: { status: 200, statusText: 'OK', body: { status: 'approved', pdfUrl: '/orders/A-1029.pdf' }, timeMs: 480, size: '0.6 KB' },
                sideEffects: ['UPDATE TransferOrders SET Status="approved"', 'Generate PDF order document', 'Send notification to officer'],
            },
            {
                id: 's4',
                title: 'POST /TransferOrders/{id}/Execute',
                description: 'Final execution',
                uiDescription: 'Confirmation toast. Order locked permanently. Soldier unit updated.',
                actor: 'Commander',
                request: { method: 'POST', route: '/TransferOrders/A-1029/Execute', auth: 'Authorize(Commander)' },
                response: { status: 200, statusText: 'OK', body: { status: 'executed', executedAt: '2024-12-08T10:42:00Z' }, timeMs: 320, size: '0.4 KB' },
                sideEffects: ['UPDATE TransferOrders SET Status="executed"', 'UPDATE Soldiers SET CurrentUnit="Battalion 7"', 'INSERT AuditLog (Action="Executed")'],
            },
        ],
    },
    {
        id: 'arabic-normalization',
        name: 'Arabic Data Normalization',
        description: 'Compare raw Arabic text against normalized form.',
        icon: '🔤',
        actor: 'Data Officer',
        difficulty: 'basic',
        tags: ['nlp', 'data-quality'],
        steps: [
            {
                id: 's1',
                title: 'POST /Normalization/Compare',
                description: 'Submit raw Arabic text',
                uiDescription: 'Dual-pane compare view. Left = input, right = live normalized output.',
                actor: 'Officer',
                request: {
                    method: 'POST', route: '/Normalization/Compare', auth: 'Authorize',
                    body: { text: 'محمّــد  أحـمــد' },
                },
                response: {
                    status: 200, statusText: 'OK',
                    body: { normalized: 'محمد احمد', match: 98, changes: ['removed_diacritics', 'collapsed_whitespace', 'normalized_alif'] },
                    timeMs: 42, size: '0.3 KB',
                },
            },
        ],
    },
];