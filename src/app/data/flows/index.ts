import { CREATORHUB_FLOWS } from './creatorhub.flows';
import { SHOPFLOW_FLOWS } from './shopflow.flows';
import { EDUPORTAL_FLOWS } from './eduportal.flows';
import { DEVBLOG_FLOWS } from './devblog.flows';
import { MEDITRACK_FLOWS } from './meditrack.flows';
import { INVENTORYPRO_FLOWS } from './inventorypro.flows';
import { OMNISOCIAL_FLOWS } from './omnisocial.flows';
import { TRANSFER_ORDERS_FLOWS } from './transfer-orders.flows';
import { TASKFLOW_FLOWS } from './taskflow.flows';
import { Flow } from '../../core/models/flow.model';

export const FLOWS_BY_PROJECT: Record<string, Flow[]> = {
    'creatorhub': CREATORHUB_FLOWS,
    'shopflow': SHOPFLOW_FLOWS,
    'eduportal': EDUPORTAL_FLOWS,
    'devblog': DEVBLOG_FLOWS,
    'meditrack': MEDITRACK_FLOWS,
    'inventorypro': INVENTORYPRO_FLOWS,
    'omnisocial': OMNISOCIAL_FLOWS,
    'transfer-orders': TRANSFER_ORDERS_FLOWS,
    'taskflow': TASKFLOW_FLOWS,
};

export function getFlowsFor(projectId: string): Flow[] {
    return FLOWS_BY_PROJECT[projectId] ?? [];
}

export function hasFlows(projectId: string): boolean {
    return (FLOWS_BY_PROJECT[projectId]?.length ?? 0) > 0;
}