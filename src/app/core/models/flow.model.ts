export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface FlowRequest {
    method: HttpMethod;
    route: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    body?: unknown;
    auth?: string;
}

export interface FlowResponse {
    status: number;
    statusText: string;
    headers?: Record<string, string>;
    body: unknown;
    timeMs?: number;
    size?: string;
}

export interface FlowStep {
    id: string;
    title: string;
    description: string;
    uiDescription: string;
    actor: string;
    request: FlowRequest;
    response: FlowResponse;
    sideEffects?: string[];
}

export interface Flow {
    id: string;
    name: string;
    description: string;
    icon: string;
    actor: string;
    difficulty: 'basic' | 'intermediate' | 'advanced';
    tags: string[];
    steps: FlowStep[];
}