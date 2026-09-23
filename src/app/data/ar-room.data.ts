export interface ScrapedSource {
    id: string;
    name: string;
    icon: string;
    status: 'online' | 'rate-limited' | 'offline';
    products: number;
    latency: number;
    uptime: number;
    color: string;
}

export interface ScrapedProduct {
    id: string;
    name: string;
    nameAr: string;
    price: number;
    oldPrice?: number;
    currency: string;
    sourceId: string;
    category: string;
    rating: number;
    reviews: number;
    inStock: boolean;
    matchScore: number;
    image: string;
    url: string;
    scrapedAt: string;
}

export interface ScrapeJob {
    id: string;
    query: string;
    status: 'queued' | 'running' | 'completed' | 'failed';
    progress: number;
    sources: string[];
    productsFound: number;
    startedAt: string;
    duration: string;
    errors: number;
}

export interface ProductMatch {
    id: string;
    masterProduct: string;
    matchedProducts: { sourceId: string; productId: string; score: number; }[];
    confidence: number;
}

export const AR_SOURCES: ScrapedSource[] = [
    { id: 'amazon', name: 'Amazon Egypt', icon: '🛒', status: 'online', products: 18420, latency: 240, uptime: 99.8, color: '#ff9900' },
    { id: 'noon', name: 'Noon', icon: '📦', status: 'online', products: 12104, latency: 180, uptime: 99.5, color: '#feee00' },
    { id: 'jumia', name: 'Jumia', icon: '🏬', status: 'online', products: 8902, latency: 320, uptime: 98.2, color: '#f68b1e' },
    { id: 'souq', name: 'Souq', icon: '🛍️', status: 'rate-limited', products: 4210, latency: 480, uptime: 94.1, color: '#f7a200' },
    { id: 'olx', name: 'OLX Egypt', icon: '📱', status: 'online', products: 23810, latency: 210, uptime: 99.2, color: '#23e5db' },
    { id: 'btech', name: 'B.TECH', icon: '⚡', status: 'online', products: 6740, latency: 290, uptime: 97.8, color: '#e30613' },
    { id: '2b', name: '2B', icon: '🏪', status: 'offline', products: 3180, latency: 0, uptime: 88.4, color: '#ff2d55' },
];

export const AR_PRODUCTS: ScrapedProduct[] = [
    { id: 'P-001', name: 'Sony WH-1000XM5 Headphones', nameAr: 'سماعة سوني WH-1000XM5', price: 12499, oldPrice: 14999, currency: 'EGP', sourceId: 'amazon', category: 'Headphones', rating: 4.8, reviews: 2847, inStock: true, matchScore: 98, image: '🎧', url: 'https://amazon.eg/dp/B09XS7JWHH', scrapedAt: '2024-12-08T10:30:00Z' },
    { id: 'P-002', name: 'Sony WH-1000XM5 Wireless', nameAr: 'سوني WH-1000XM5 لاسلكي', price: 12750, oldPrice: 14500, currency: 'EGP', sourceId: 'noon', category: 'Headphones', rating: 4.7, reviews: 1923, inStock: true, matchScore: 96, image: '🎧', url: 'https://noon.com/eg-en/sony/...', scrapedAt: '2024-12-08T10:32:00Z' },
    { id: 'P-003', name: 'Sony WH1000XM5 Noise Cancelling', nameAr: 'سوني WH1000XM5 عازل ضجيج', price: 12999, currency: 'EGP', sourceId: 'jumia', category: 'Headphones', rating: 4.6, reviews: 892, inStock: true, matchScore: 94, image: '🎧', url: 'https://jumia.com.eg/...', scrapedAt: '2024-12-08T10:34:00Z' },
    { id: 'P-004', name: 'Sony WH-1000XM5 Black', nameAr: 'سوني WH-1000XM5 أسود', price: 13200, currency: 'EGP', sourceId: 'btech', category: 'Headphones', rating: 4.9, reviews: 512, inStock: false, matchScore: 92, image: '🎧', url: 'https://btech.com/...', scrapedAt: '2024-12-08T10:36:00Z' },
    { id: 'P-005', name: 'Sony WH1000XM5 (Used)', nameAr: 'سوني WH1000XM5 مستعمل', price: 8500, currency: 'EGP', sourceId: 'olx', category: 'Headphones', rating: 4.2, reviews: 48, inStock: true, matchScore: 78, image: '🎧', url: 'https://olx.com.eg/...', scrapedAt: '2024-12-08T10:38:00Z' },
    { id: 'P-006', name: 'Apple AirPods Pro 2', nameAr: 'إيربودز برو 2', price: 9999, currency: 'EGP', sourceId: 'amazon', category: 'Earbuds', rating: 4.9, reviews: 4521, inStock: true, matchScore: 100, image: '🎵', url: 'https://amazon.eg/dp/B0BDHWDR12', scrapedAt: '2024-12-08T10:40:00Z' },
    { id: 'P-007', name: 'Samsung Galaxy Buds 2 Pro', nameAr: 'سامسونج جالاكسي بادز 2 برو', price: 6499, currency: 'EGP', sourceId: 'noon', category: 'Earbuds', rating: 4.5, reviews: 1284, inStock: true, matchScore: 100, image: '🎵', url: 'https://noon.com/eg-en/samsung/...', scrapedAt: '2024-12-08T10:42:00Z' },
    { id: 'P-008', name: 'Sony WF-1000XM5', nameAr: 'سوني WF-1000XM5', price: 8999, currency: 'EGP', sourceId: 'amazon', category: 'Earbuds', rating: 4.7, reviews: 2104, inStock: true, matchScore: 100, image: '🎵', url: 'https://amazon.eg/...', scrapedAt: '2024-12-08T10:44:00Z' },
];

export const AR_JOBS: ScrapeJob[] = [
    { id: 'J-001', query: 'Sony WH-1000XM5', status: 'completed', progress: 100, sources: ['amazon', 'noon', 'jumia'], productsFound: 47, startedAt: '2024-12-08T10:30:00Z', duration: '3.4s', errors: 0 },
    { id: 'J-002', query: 'iPhone 15 Pro', status: 'completed', progress: 100, sources: ['amazon', 'noon', 'jumia', 'btech'], productsFound: 128, startedAt: '2024-12-08T10:15:00Z', duration: '5.2s', errors: 1 },
    { id: 'J-003', query: 'PS5 Controller', status: 'running', progress: 68, sources: ['amazon', 'noon', 'olx', 'btech'], productsFound: 34, startedAt: '2024-12-08T10:45:00Z', duration: '—', errors: 0 },
    { id: 'J-004', query: 'Air Fryer', status: 'queued', progress: 0, sources: ['amazon', 'noon'], productsFound: 0, startedAt: '2024-12-08T10:48:00Z', duration: '—', errors: 0 },
    { id: 'J-005', query: 'Running Shoes Nike', status: 'failed', progress: 42, sources: ['amazon', 'souq'], productsFound: 12, startedAt: '2024-12-08T10:00:00Z', duration: '2.1s', errors: 3 },
];

export const AR_MATCHES: ProductMatch[] = [
    {
        id: 'M-001', masterProduct: 'Sony WH-1000XM5', matchedProducts: [
            { sourceId: 'amazon', productId: 'P-001', score: 98 },
            { sourceId: 'noon', productId: 'P-002', score: 96 },
            { sourceId: 'jumia', productId: 'P-003', score: 94 },
            { sourceId: 'btech', productId: 'P-004', score: 92 },
            { sourceId: 'olx', productId: 'P-005', score: 78 },
        ], confidence: 94
    },
];