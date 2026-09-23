import { ProjectImpact } from '../core/models/project.model';

export const PROJECT_IMPACTS: Record<string, ProjectImpact> = {
    'transfer-orders': {
        targetAudience: 4200,
        audienceLabel: 'Military personnel',
        realUsage: 'Daily ops',
        impactSummary: 'Replaced manual paper workflows with an end-to-end digital pipeline used across 10 sectors.',
        tradeoffs: [
            'Chose SQL Server over PostgreSQL for compatibility with existing MOD infrastructure',
            'Built offline-first sync layer instead of real-time to handle unreliable field connectivity',
            'Kept UI in Arabic-first RTL instead of bilingual to reduce soldier training time',
        ],
        metrics: [
            { label: 'Processing time', value: '-78%', trend: 'down' },
            { label: 'Transfer accuracy', value: '99.4%', trend: 'up' },
            { label: 'Paper forms saved', value: '12K/yr', trend: 'up' },
        ],
    },
    'reminder': {
        targetAudience: 680,
        audienceLabel: 'Field officers',
        realUsage: 'Post-mission',
        impactSummary: 'Officers now track soldier check-ins in seconds instead of minutes of radio traffic.',
        tradeoffs: [
            'Firebase over REST for offline-first behavior on mobile',
            'Push notifications throttled to preserve battery life in the field',
            'Location sharing made opt-in per mission for privacy',
        ],
        metrics: [
            { label: 'Check-in time', value: '-90%', trend: 'down' },
            { label: 'Missed confirmations', value: '-64%', trend: 'down' },
        ],
    },
    'enlisted-management': {
        targetAudience: 12847,
        audienceLabel: 'Enlisted personnel',
        realUsage: 'Registry system',
        impactSummary: 'Single source of truth for all enlisted personnel across 10 sectors.',
        tradeoffs: [
            'Batch import over real-time API to handle 50K+ row spreadsheets',
            'Soft delete over hard delete for audit compliance',
            'Server-side pagination for performance on legacy hardware',
        ],
        metrics: [
            { label: 'Records managed', value: '12.8K', trend: 'up' },
            { label: 'Import time', value: '-85%', trend: 'down' },
            { label: 'Data accuracy', value: '99.7%', trend: 'up' },
        ],
    },
    'sector-reports': {
        targetAudience: 340,
        audienceLabel: 'Command officers',
        realUsage: 'Daily reports',
        impactSummary: 'Real-time operational visibility across all 10 sectors with automated PDF reporting.',
        tradeoffs: [
            'PDF generation on-demand instead of pre-cached for freshness',
            'Chose client-side filters over server-side for instant response',
            'Role-based classification system matching military security levels',
        ],
        metrics: [
            { label: 'Report time', value: '-92%', trend: 'down' },
            { label: 'Report accuracy', value: '100%', trend: 'up' },
        ],
    },
    'normalization': {
        targetAudience: 8400,
        audienceLabel: 'Records processed',
        realUsage: 'Data integrity',
        impactSummary: 'Standardized Arabic-language records across 10 sectors with 98.7% match accuracy.',
        tradeoffs: [
            'Rule-based normalization over ML for explainability and speed',
            'Batch processing over real-time to handle overnight imports',
            'Fuzzy matching threshold tuned to balance false positives',
        ],
        metrics: [
            { label: 'Match accuracy', value: '98.7%', trend: 'up' },
            { label: 'Processing speed', value: '2.4K/s', trend: 'up' },
        ],
    },
    'arroom': {
        targetAudience: 18500,
        audienceLabel: 'Online shoppers',
        realUsage: 'Price comparison',
        impactSummary: 'Aggregates products from 5+ platforms, giving users a single search across Egyptian e-commerce.',
        tradeoffs: [
            'Rate-limited scraping over paid APIs to keep costs at zero',
            'Server-side caching with 15-min TTL to reduce platform load',
            'Regex-based parsing kept simple over ML for maintainability',
        ],
        metrics: [
            { label: 'User engagement', value: '+30%', trend: 'up' },
            { label: 'Products indexed', value: '284K', trend: 'up' },
            { label: 'Response time', value: '2.4s', trend: 'down' },
        ],
    },
    'almotafiq': {
        targetAudience: 2400,
        audienceLabel: 'Students',
        realUsage: 'Live classes',
        impactSummary: 'Interactive learning platform with real-time teacher-student portals and NgRx state.',
        tradeoffs: [
            'NgRx over simple services for cross-component state sharing',
            'WebRTC over third-party video for cost and privacy',
            'Optimistic UI updates for low-latency feel on slow connections',
        ],
        metrics: [
            { label: 'Student engagement', value: '+25%', trend: 'up' },
            { label: 'Class capacity', value: '120', trend: 'up' },
        ],
    },
    'azaccounting': {
        targetAudience: 320,
        audienceLabel: 'Accountants',
        realUsage: 'Daily tracking',
        impactSummary: 'Automated financial tracking dashboard replacing Excel-based workflows.',
        tradeoffs: [
            'Angular Material over custom components for faster iteration',
            'Client-side calculations for instant feedback on large datasets',
            'Chart.js over D3 for lighter bundle size',
        ],
        metrics: [
            { label: 'Processing time', value: '-20%', trend: 'down' },
            { label: 'Data entry errors', value: '-45%', trend: 'down' },
        ],
    },
    'bwt': {
        targetAudience: 1200,
        audienceLabel: 'End users',
        realUsage: 'Platform users',
        impactSummary: 'Contributed clean SOLID-compliant code to an existing Angular platform used across Egypt.',
        tradeoffs: [
            'Refactored legacy code incrementally instead of rewriting',
            'Cross-browser polyfills added to support older browsers',
            'Unit tests prioritized for critical paths only',
        ],
        metrics: [
            { label: 'Code coverage', value: '92%', trend: 'up' },
            { label: 'Bundle size', value: '-18%', trend: 'down' },
        ],
    },
    'businessstep': {
        targetAudience: 8500,
        audienceLabel: 'Monthly visitors',
        realUsage: 'Lead generation',
        impactSummary: 'Fully responsive corporate website with optimized contact forms driving lead gen.',
        tradeoffs: [
            'Static site with Angular SSR for SEO performance',
            'Bootstrap over custom CSS for rapid iteration',
            'Contact form via serverless function to avoid backend maintenance',
        ],
        metrics: [
            { label: 'Lead conversion', value: '+42%', trend: 'up' },
            { label: 'Page load', value: '1.2s', trend: 'down' },
        ],
    },
    'afkar': {
        targetAudience: 4200,
        audienceLabel: 'Job seekers',
        realUsage: 'Job platform',
        impactSummary: 'Full-stack job platform with authentication, browsing, and application workflows.',
        tradeoffs: [
            'JWT over session cookies for stateless scaling',
            'Server-side pagination for large job lists',
            'Role-based dashboards for companies and seekers',
        ],
        metrics: [
            { label: 'Job listings', value: '1.2K', trend: 'up' },
            { label: 'Applications/day', value: '340', trend: 'up' },
        ],
    },
    'ennwy': {
        targetAudience: 2600,
        audienceLabel: 'Online shoppers',
        realUsage: 'E-commerce',
        impactSummary: 'Full-stack e-commerce with product management, cart, and responsive UI.',
        tradeoffs: [
            'Cart state in-memory over DB for speed',
            'Product images served from CDN for global performance',
            'Simplified checkout flow to reduce abandonment',
        ],
        metrics: [
            { label: 'Cart conversion', value: '+18%', trend: 'up' },
            { label: 'Products managed', value: '480', trend: 'up' },
        ],
    },
    'taskflow': {
        targetAudience: 340,
        audienceLabel: 'Beta users',
        realUsage: 'Daily habits',
        impactSummary: 'Gamified task tracker with streaks to increase habit completion.',
        tradeoffs: [
            'Streak logic in domain layer for testability',
            'EF Core migrations over raw SQL for team agility',
            'DTOs separated from models for API cleanliness',
        ],
        metrics: [
            { label: 'Streak retention', value: '+34%', trend: 'up' },
            { label: 'Daily active', value: '78%', trend: 'up' },
        ],
    },
    'omnisocial': {
        targetAudience: 12000,
        audienceLabel: 'Registered users',
        realUsage: 'Social platform',
        impactSummary: 'Multi-platform social network with 71 controllers, 525 endpoints, SignalR real-time, and AI features.',
        tradeoffs: [
            'Modular monolith over microservices for team size',
            'SignalR over raw WebSockets for fallback support',
            'JWT + refresh tokens for stateless scaling',
            'AI features (smart search, duplicates) built on top of simple heuristics',
        ],
        metrics: [
            { label: 'Endpoints built', value: '525', trend: 'up' },
            { label: 'Real-time hubs', value: '6', trend: 'up' },
            { label: 'Concurrent users', value: '2.4K', trend: 'up' },
        ],
    },
    'quiz-app': {
        targetAudience: 1800,
        audienceLabel: 'Students',
        realUsage: 'Exams',
        impactSummary: 'Quiz platform with separate student and instructor portals.',
        tradeoffs: [
            'GSAP animations for engagement over minimal motion',
            'PrimeNG components for speed over custom builds',
            'Client-side scoring for instant feedback',
        ],
        metrics: [
            { label: 'Quiz completion', value: '94%', trend: 'up' },
            { label: 'Avg score', value: '76%', trend: 'up' },
        ],
    },
    'pm-system': {
        targetAudience: 420,
        audienceLabel: 'Teams using',
        realUsage: 'Daily tracking',
        impactSummary: 'Trello-inspired project management with drag-and-drop boards.',
        tradeoffs: [
            'Angular CDK for drag-drop (native, no library)',
            'Local-first state with optimistic updates',
            'Simplified permission model for MVP',
        ],
        metrics: [
            { label: 'Task completion', value: '+28%', trend: 'up' },
            { label: 'Team adoption', value: '92%', trend: 'up' },
        ],
    },
    'hotel': {
        targetAudience: 950,
        audienceLabel: 'Bookings/month',
        realUsage: 'Hotel booking',
        impactSummary: 'Hotel booking app with separate admin and client layouts.',
        tradeoffs: [
            'Angular Material for consistent design system',
            'Date range picker built-in vs third-party',
            'Separate route layouts for admin vs client',
        ],
        metrics: [
            { label: 'Booking rate', value: '+22%', trend: 'up' },
            { label: 'Admin efficiency', value: '+40%', trend: 'up' },
        ],
    },
    'foody': {
        targetAudience: 1240,
        audienceLabel: 'Monthly orders',
        realUsage: 'Food ordering',
        impactSummary: 'Food content management with admin dashboard and client layout.',
        tradeoffs: [
            'Cart persisted to localStorage for guest checkout',
            'Simplified menu structure for fast browsing',
            'Mobile-first design over desktop-first',
        ],
        metrics: [
            { label: 'Order time', value: '-35%', trend: 'down' },
            { label: 'Repeat orders', value: '+27%', trend: 'up' },
        ],
    },
    'weather': {
        targetAudience: 480,
        audienceLabel: 'Monthly users',
        realUsage: 'Weather lookup',
        impactSummary: 'Responsive global weather explorer with clean UI.',
        tradeoffs: [
            'HTML/CSS/Bootstrap over Angular for simple static deploy',
            'OpenWeather API over premium for free tier',
            'Client-side caching for repeated lookups',
        ],
        metrics: [
            { label: 'Page load', value: '0.8s', trend: 'down' },
            { label: 'Bounce rate', value: '-22%', trend: 'down' },
        ],
    },
    'boxshadow': {
        targetAudience: 12400,
        audienceLabel: 'Devs used it',
        realUsage: 'Design utility',
        impactSummary: 'CSS box-shadow generator used by designers and front-end devs.',
        tradeoffs: [
            'Client-only for zero backend cost',
            'Live preview over code output for better UX',
            'Multiple layers support for advanced shadows',
        ],
        metrics: [
            { label: 'Copies made', value: '18K', trend: 'up' },
            { label: 'Return visitors', value: '34%', trend: 'up' },
        ],
    },
    'imageeditor': {
        targetAudience: 3200,
        audienceLabel: 'Monthly edits',
        realUsage: 'Image editing',
        impactSummary: 'Browser-based image editor with crop, filters, and export.',
        tradeoffs: [
            'Canvas API over WASM for browser compatibility',
            'No server upload for privacy',
            'PNG/JPG export over WebP for universal support',
        ],
        metrics: [
            { label: 'Export time', value: '1.4s', trend: 'down' },
            { label: 'User satisfaction', value: '4.7/5', trend: 'up' },
        ],
    },
    'creatorhub': {
        targetAudience: 640,
        audienceLabel: 'Creators onboarded',
        realUsage: 'Content platform',
        impactSummary: 'Content platform with Identity auth, Repository pattern, and MailKit emails.',
        tradeoffs: [
            'Repository + UnitOfWork over DbContext direct for testability',
            'MailKit over SendGrid for zero-cost emailing',
            'Custom Toast system over library for full control',
        ],
        metrics: [
            { label: 'Signup completion', value: '86%', trend: 'up' },
            { label: 'Episodes created', value: '1.4K', trend: 'up' },
        ],
    },
    'shopflow': {
        targetAudience: 2100,
        audienceLabel: 'Orders processed',
        realUsage: 'E-commerce',
        impactSummary: 'Full e-commerce MVC with cart, orders, Stripe integration, and admin area.',
        tradeoffs: [
            'Session cart over DB for performance',
            'Stripe test mode for demo, production switch documented',
            'Role-based admin area over policy-based for simplicity',
        ],
        metrics: [
            { label: 'Order value', value: '$142K', trend: 'up' },
            { label: 'Cart abandonment', value: '-24%', trend: 'down' },
        ],
    },
    'eduportal': {
        targetAudience: 3400,
        audienceLabel: 'Students enrolled',
        realUsage: 'Learning platform',
        impactSummary: 'Education portal with 3 role areas, quiz engine, and PDF certificates.',
        tradeoffs: [
            'QuestPDF over iText for MIT license',
            'ClosedXML for Excel exports',
            'Background workers over cron for grade notifications',
        ],
        metrics: [
            { label: 'Course completion', value: '78%', trend: 'up' },
            { label: 'Certificates issued', value: '890', trend: 'up' },
        ],
    },
    'devblog': {
        targetAudience: 12400,
        audienceLabel: 'Monthly readers',
        realUsage: 'Developer blog',
        impactSummary: 'Developer blogging platform with Markdown, code highlighting, and threaded comments.',
        tradeoffs: [
            'Markdig over custom parser for security',
            'RSS/Atom over newsletter for reach',
            'Comment moderation to prevent spam',
        ],
        metrics: [
            { label: 'Articles published', value: '142', trend: 'up' },
            { label: 'Reading time avg', value: '4.2m', trend: 'up' },
        ],
    },
    'meditrack': {
        targetAudience: 860,
        audienceLabel: 'Patients served',
        realUsage: 'Appointments',
        impactSummary: 'Clinic appointment system with Twilio SMS reminders and PDF prescriptions.',
        tradeoffs: [
            'Twilio SMS over WhatsApp API for reliability',
            'Audit logs for every record access for compliance',
            'Encrypted PII at rest',
        ],
        metrics: [
            { label: 'No-show rate', value: '-38%', trend: 'down' },
            { label: 'Prescription time', value: '-72%', trend: 'down' },
        ],
    },
    'inventorypro': {
        targetAudience: 420,
        audienceLabel: 'Warehouse staff',
        realUsage: 'Daily inventory',
        impactSummary: 'Multi-warehouse inventory with barcode scanning and PO workflow.',
        tradeoffs: [
            'ZXing for barcode gen (open source)',
            'Weighted average over FIFO for simplicity',
            'Excel import/export for compatibility',
        ],
        metrics: [
            { label: 'Stock accuracy', value: '99.2%', trend: 'up' },
            { label: 'Audit time', value: '-68%', trend: 'down' },
        ],
    },
};