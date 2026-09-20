import { Flow } from '../../core/models/flow.model';

export const TASKFLOW_FLOWS: Flow[] = [
    {
        id: 'daily-task-flow',
        name: 'Daily Task + Streak',
        description: 'Complete tasks and watch streak counter grow.',
        icon: '🔥',
        actor: 'User',
        difficulty: 'basic',
        tags: ['crud', 'streak', 'realtime'],
        steps: [
            {
                id: 's1',
                title: 'GET /api/tasks/today',
                description: 'Load today\'s tasks',
                uiDescription: 'Task list renders with current streak badge.',
                actor: 'User',
                request: { method: 'GET', route: '/api/tasks/today', auth: 'Bearer ...' },
                response: {
                    status: 200, statusText: 'OK',
                    body: { tasks: [{ id: 1, title: 'Workout', done: true }, { id: 2, title: 'Read 20 pages', done: false }], streak: 11 },
                    timeMs: 62, size: '1.2 KB',
                },
            },
            {
                id: 's2',
                title: 'POST /api/tasks',
                description: 'Add new task',
                uiDescription: 'New row appears at top of list.',
                actor: 'User',
                request: { method: 'POST', route: '/api/tasks', auth: 'Bearer ...', body: { title: 'Write blog post', priority: 'mid' } },
                response: { status: 201, statusText: 'Created', body: { id: 3, title: 'Write blog post', done: false }, timeMs: 128, size: '0.2 KB' },
            },
            {
                id: 's3',
                title: 'PATCH /api/tasks/3/complete',
                description: 'Toggle done',
                uiDescription: 'Checkbox fills. Task fades. Streak counter animates.',
                actor: 'User',
                request: { method: 'PATCH', route: '/api/tasks/3/complete', auth: 'Bearer ...' },
                response: {
                    status: 200, statusText: 'OK',
                    body: { taskId: 3, done: true, newStreak: 12, milestone: 'twelve_days' },
                    timeMs: 88, size: '0.3 KB',
                },
                sideEffects: ['UPDATE Tasks SET Done=1', 'INSERT TaskCompletions', 'UPDATE UserStreak SET CurrentStreak=12'],
            },
            {
                id: 's4',
                title: 'GET /api/streak/leaderboard',
                description: 'Fetch global streak leaderboard',
                uiDescription: 'Leaderboard modal opens. User\'s row highlighted at rank #47.',
                actor: 'User',
                request: { method: 'GET', route: '/api/streak/leaderboard?limit=50', auth: 'Bearer ...' },
                response: {
                    status: 200, statusText: 'OK',
                    body: { entries: [{ user: 'sara', streak: 47 }, { user: 'ahmed', streak: 12 }], userRank: 47 },
                    timeMs: 92, size: '3.4 KB',
                },
            },
        ],
    },
];