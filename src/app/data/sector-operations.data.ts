export interface OpsSector {
    id: string;
    code: string;
    name: string;
    nameAr: string;
    region: string;
    commander: string;
    activeOps: number;
    personnelDeployed: number;
    readiness: number;
    color: string;
    icon: string;
}

export interface Operation {
    id: string;
    code: string;
    name: string;
    nameAr: string;
    sectorId: string;
    type: 'patrol' | 'recon' | 'training' | 'logistics' | 'medical' | 'security' | 'emergency' | 'special';
    priority: 'low' | 'normal' | 'high' | 'critical';
    status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';
    commander: string;
    personnel: number;
    vehicles: number;
    startDate: string;
    endDate: string;
    progress: number;
    location: string;
    coordinates: { lat: number; lng: number };
    objectives: string[];
    description: string;
    resources: string[];
    createdAt: string;
    updatedAt: string;
}

export interface Incident {
    id: string;
    operationId: string;
    sectorId: string;
    type: 'security' | 'medical' | 'equipment' | 'weather' | 'hostile' | 'accident' | 'other';
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    title: string;
    description: string;
    location: string;
    reportedBy: string;
    reportedAt: string;
    status: 'reported' | 'investigating' | 'resolved' | 'closed';
    resolvedAt?: string;
}

export interface SectorReport {
    id: string;
    title: string;
    titleAr: string;
    sectorId: string;
    operationId?: string;
    type: 'daily' | 'weekly' | 'monthly' | 'incident' | 'assessment' | 'special';
    status: 'draft' | 'submitted' | 'approved' | 'archived';
    author: string;
    createdAt: string;
    submittedAt?: string;
    approvedAt?: string;
    summary: string;
    pages: number;
    classification: 'public' | 'internal' | 'confidential' | 'top-secret';
}

export interface SectorResource {
    id: string;
    sectorId: string;
    type: 'vehicle' | 'weapon' | 'equipment' | 'medical' | 'communication' | 'fuel';
    name: string;
    quantity: number;
    available: number;
    deployed: number;
    maintenance: number;
    status: 'operational' | 'limited' | 'critical' | 'maintenance';
}

export interface OpsLogEntry {
    id: string;
    timestamp: string;
    sectorId: string;
    operationId?: string;
    action: 'created' | 'started' | 'completed' | 'incident' | 'resumed' | 'paused' | 'report' | 'resource';
    description: string;
    by: string;
    icon: string;
    color: string;
}

export const OPS_SECTORS: OpsSector[] = [
    { id: 'sector_1', code: 'SEC-01', name: 'Cairo HQ', nameAr: 'القاهرة', region: 'Central', commander: 'Col. Ahmed Hassan', activeOps: 12, personnelDeployed: 842, readiness: 96, color: '#ff3b30', icon: '🏛' },
    { id: 'sector_2', code: 'SEC-02', name: 'Giza Division', nameAr: 'الجيزة', region: 'Central', commander: 'Col. Youssef Kamal', activeOps: 8, personnelDeployed: 512, readiness: 92, color: '#ff9500', icon: '🏢' },
    { id: 'sector_3', code: 'SEC-03', name: 'Alexandria Base', nameAr: 'الإسكندرية', region: 'Coastal', commander: 'Col. Karim Adel', activeOps: 10, personnelDeployed: 687, readiness: 89, color: '#007aff', icon: '⚓' },
    { id: 'sector_4', code: 'SEC-04', name: 'Delta Command', nameAr: 'الدلتا', region: 'Delta', commander: 'Col. Tarek Sami', activeOps: 7, personnelDeployed: 421, readiness: 88, color: '#34c759', icon: '🌾' },
    { id: 'sector_5', code: 'SEC-05', name: 'Canal Zone', nameAr: 'القناة', region: 'Canal', commander: 'Col. Omar Ibrahim', activeOps: 9, personnelDeployed: 593, readiness: 95, color: '#5856d6', icon: '🚢' },
    { id: 'sector_6', code: 'SEC-06', name: 'Sinai Command', nameAr: 'سيناء', region: 'Eastern', commander: 'Col. Nabil Mostafa', activeOps: 18, personnelDeployed: 934, readiness: 98, color: '#af52de', icon: '🏜' },
    { id: 'sector_7', code: 'SEC-07', name: 'Upper Egypt', nameAr: 'الصعيد', region: 'Southern', commander: 'Col. Hany Reda', activeOps: 11, personnelDeployed: 728, readiness: 87, color: '#ffcc00', icon: '🏺' },
    { id: 'sector_8', code: 'SEC-08', name: 'Red Sea Command', nameAr: 'البحر الأحمر', region: 'Eastern', commander: 'Col. Sami Hosny', activeOps: 6, personnelDeployed: 342, readiness: 90, color: '#00c7be', icon: '🌊' },
    { id: 'sector_9', code: 'SEC-09', name: 'Matrouh Division', nameAr: 'مطروح', region: 'Western', commander: 'Col. Khaled Rashad', activeOps: 5, personnelDeployed: 287, readiness: 84, color: '#ff2d55', icon: '🏖' },
    { id: 'sector_10', code: 'SEC-10', name: 'Reserve Command', nameAr: 'الاحتياطي', region: 'National', commander: 'Gen. Mostafa Fahmy', activeOps: 15, personnelDeployed: 1247, readiness: 100, color: '#8e8e93', icon: '⭐' },
];

export const OPERATIONS: Operation[] = [
    { id: 'OP-2001', code: 'OP-DW-01', name: 'Desert Wind', nameAr: 'ريح الصحراء', sectorId: 'sector_6', type: 'recon', priority: 'high', status: 'active', commander: 'Col. Nabil Mostafa', personnel: 42, vehicles: 8, startDate: '2024-12-01', endDate: '2024-12-15', progress: 68, location: 'Central Sinai Grid 9C', coordinates: { lat: 30.5000, lng: 33.8000 }, objectives: ['Perimeter reconnaissance', 'Threat assessment', 'Intelligence gathering'], description: 'Night reconnaissance across sector B perimeter', resources: ['4x armored vehicles', '2x drones', 'Signal equipment'], createdAt: '2024-11-25', updatedAt: '2024-12-08' },
    { id: 'OP-2002', code: 'OP-ER-02', name: 'Emergency Response Alpha', nameAr: 'استجابة طارئة ألف', sectorId: 'sector_1', type: 'emergency', priority: 'critical', status: 'active', commander: 'Maj. Mostafa Ayman', personnel: 24, vehicles: 5, startDate: '2024-12-08', endDate: '2024-12-09', progress: 22, location: 'Nasr City District 4', coordinates: { lat: 30.0561, lng: 31.3445 }, objectives: ['Immediate deployment', 'Civilian evacuation', 'Perimeter security'], description: 'Emergency deployment following sector alert', resources: ['2x ambulances', '3x armored vehicles'], createdAt: '2024-12-08', updatedAt: '2024-12-08' },
    { id: 'OP-2003', code: 'OP-LT-03', name: 'Logistics Transfer', nameAr: 'نقل الإمدادات', sectorId: 'sector_4', type: 'logistics', priority: 'normal', status: 'active', commander: 'Maj. Sherif Gamal', personnel: 18, vehicles: 12, startDate: '2024-12-05', endDate: '2024-12-10', progress: 78, location: 'Delta Highway Corridor', coordinates: { lat: 30.7865, lng: 31.0004 }, objectives: ['Equipment transfer', 'Secure convoy', 'Delivery to Sector 6'], description: 'Equipment movement from HQ to Delta region', resources: ['12x transport trucks', '2x escort vehicles'], createdAt: '2024-12-01', updatedAt: '2024-12-08' },
    { id: 'OP-2004', code: 'OP-TE-04', name: 'Training Exercise Bravo', nameAr: 'تمرين ب', sectorId: 'sector_1', type: 'training', priority: 'normal', status: 'completed', commander: 'Maj. Hassan Ali', personnel: 87, vehicles: 15, startDate: '2024-11-20', endDate: '2024-12-01', progress: 100, location: 'Cairo Training Camp', coordinates: { lat: 30.0561, lng: 31.3445 }, objectives: ['Combat readiness', 'Weapons proficiency', 'Squad coordination'], description: 'Quarterly readiness exercise', resources: ['Training equipment', 'Simulation rounds'], createdAt: '2024-11-15', updatedAt: '2024-12-01' },
    { id: 'OP-2005', code: 'OP-SC-05', name: 'Coastal Patrol', nameAr: 'الدورية الساحلية', sectorId: 'sector_3', type: 'patrol', priority: 'high', status: 'active', commander: 'Col. Karim Adel', personnel: 51, vehicles: 6, startDate: '2024-12-03', endDate: '2024-12-20', progress: 42, location: 'Alexandria Corniche', coordinates: { lat: 31.2040, lng: 29.9180 }, objectives: ['Coastal security', 'Maritime surveillance'], description: 'Ongoing coastal security patrol', resources: ['Patrol boats', 'Radar units'], createdAt: '2024-12-01', updatedAt: '2024-12-08' },
    { id: 'OP-2006', code: 'OP-BP-06', name: 'Border Patrol Sierra', nameAr: 'دورية الحدود س', sectorId: 'sector_6', type: 'security', priority: 'high', status: 'active', commander: 'Lt. Rami Sherif', personnel: 38, vehicles: 4, startDate: '2024-12-02', endDate: '2024-12-18', progress: 55, location: 'Border Zone 1', coordinates: { lat: 31.0500, lng: 34.0000 }, objectives: ['Border surveillance', 'Perimeter control'], description: 'Continuous border security operation', resources: ['2x drones', 'Night vision gear'], createdAt: '2024-11-28', updatedAt: '2024-12-08' },
    { id: 'OP-2007', code: 'OP-MR-07', name: 'Medical Relief Delta', nameAr: 'الإغاثة الطبية', sectorId: 'sector_4', type: 'medical', priority: 'high', status: 'active', commander: 'Maj. Ayman Samir', personnel: 32, vehicles: 6, startDate: '2024-12-06', endDate: '2024-12-12', progress: 45, location: 'Tanta Rural Communities', coordinates: { lat: 30.7865, lng: 31.0004 }, objectives: ['Medical check-ups', 'Supply distribution'], description: 'Medical relief operation in rural Delta', resources: ['2x mobile clinics', 'Medical supplies'], createdAt: '2024-12-04', updatedAt: '2024-12-08' },
    { id: 'OP-2008', code: 'OP-SF-08', name: 'Special Ops Delta', nameAr: 'العمليات الخاصة د', sectorId: 'sector_10', type: 'special', priority: 'critical', status: 'active', commander: 'Maj. Bahaa Adel', personnel: 24, vehicles: 4, startDate: '2024-12-04', endDate: '2024-12-10', progress: 62, location: 'Classified', coordinates: { lat: 30.0600, lng: 31.3200 }, objectives: ['Classified objectives'], description: 'Special operations — details classified', resources: ['Special equipment'], createdAt: '2024-12-02', updatedAt: '2024-12-08' },
    { id: 'OP-2009', code: 'OP-CZ-09', name: 'Canal Security Watch', nameAr: 'حراسة القناة', sectorId: 'sector_5', type: 'security', priority: 'high', status: 'active', commander: 'Capt. Hossam Nabil', personnel: 62, vehicles: 8, startDate: '2024-11-28', endDate: '2025-01-15', progress: 35, location: 'Canal West Bank', coordinates: { lat: 30.5800, lng: 32.2500 }, objectives: ['Ship security', 'Canal surveillance'], description: 'Extended canal security operation', resources: ['Radar stations', 'Patrol boats'], createdAt: '2024-11-25', updatedAt: '2024-12-08' },
    { id: 'OP-2010', code: 'OP-DT-10', name: 'Desert Training', nameAr: 'تدريب صحراوي', sectorId: 'sector_9', type: 'training', priority: 'normal', status: 'active', commander: 'Lt. Hazem Yasser', personnel: 47, vehicles: 6, startDate: '2024-12-01', endDate: '2024-12-22', progress: 38, location: 'Western Desert Camp', coordinates: { lat: 30.5000, lng: 27.0000 }, objectives: ['Desert survival', 'Navigation training'], description: 'Advanced desert warfare training', resources: ['Training equipment', 'Survival kits'], createdAt: '2024-11-28', updatedAt: '2024-12-08' },
    { id: 'OP-2011', code: 'OP-NP-11', name: 'Night Patrol Route 14', nameAr: 'دورية ليلية 14', sectorId: 'sector_1', type: 'patrol', priority: 'high', status: 'active', commander: 'Sgt. Ahmed Kamal', personnel: 18, vehicles: 3, startDate: '2024-12-07', endDate: '2024-12-14', progress: 28, location: 'Nasr City Grid 5', coordinates: { lat: 30.0561, lng: 31.3445 }, objectives: ['Night security', 'Crime prevention'], description: 'Night patrol in urban district', resources: ['Night vision', 'Radar'], createdAt: '2024-12-06', updatedAt: '2024-12-08' },
    { id: 'OP-2012', code: 'OP-RS-12', name: 'Red Sea Survey', nameAr: 'مسح البحر الأحمر', sectorId: 'sector_8', type: 'recon', priority: 'normal', status: 'active', commander: 'W.O. Ashraf Kamal', personnel: 28, vehicles: 4, startDate: '2024-12-03', endDate: '2024-12-17', progress: 48, location: 'Red Sea Islands', coordinates: { lat: 27.0000, lng: 34.0000 }, objectives: ['Island survey', 'Maritime recon'], description: 'Coastal and island reconnaissance mission', resources: ['Survey boats', 'Diving gear'], createdAt: '2024-11-30', updatedAt: '2024-12-08' },
    { id: 'OP-2013', code: 'OP-UE-13', name: 'Upper Egypt Patrol', nameAr: 'دورية الصعيد', sectorId: 'sector_7', type: 'patrol', priority: 'normal', status: 'active', commander: 'Sgt. Khaled Said', personnel: 34, vehicles: 5, startDate: '2024-12-04', endDate: '2024-12-20', progress: 52, location: 'Assiut Rural Areas', coordinates: { lat: 27.1809, lng: 31.1837 }, objectives: ['Rural security', 'Community engagement'], description: 'Extended rural patrol operation', resources: ['Patrol vehicles', 'Communication gear'], createdAt: '2024-12-01', updatedAt: '2024-12-08' },
    { id: 'OP-2014', code: 'OP-GZ-14', name: 'Giza Security Sweep', nameAr: 'تمشيط الجيزة', sectorId: 'sector_2', type: 'security', priority: 'high', status: 'paused', commander: 'Maj. Magdy Hamdy', personnel: 55, vehicles: 8, startDate: '2024-12-05', endDate: '2024-12-12', progress: 42, location: 'Pyramids Zone', coordinates: { lat: 29.9792, lng: 31.1342 }, objectives: ['Tourist security', 'Site protection'], description: 'Tourist site security operation — paused for review', resources: ['Security barriers', 'Checkpoint equipment'], createdAt: '2024-12-01', updatedAt: '2024-12-07' },
    { id: 'OP-2015', code: 'OP-AL-15', name: 'Alexandria Port Guard', nameAr: 'حراسة الميناء', sectorId: 'sector_3', type: 'security', priority: 'high', status: 'active', commander: 'Capt. Omar Samir', personnel: 68, vehicles: 6, startDate: '2024-12-01', endDate: '2024-12-31', progress: 25, location: 'Alexandria Port', coordinates: { lat: 31.2165, lng: 29.9445 }, objectives: ['Port security', 'Cargo inspection'], description: 'Port security operation', resources: ['X-ray equipment', 'Security personnel'], createdAt: '2024-11-28', updatedAt: '2024-12-08' },
    { id: 'OP-2016', code: 'OP-MH-16', name: 'Medical Air Evacuation', nameAr: 'الإخلاء الطبي', sectorId: 'sector_6', type: 'medical', priority: 'critical', status: 'completed', commander: 'Maj. Ayman Samir', personnel: 12, vehicles: 2, startDate: '2024-12-06', endDate: '2024-12-07', progress: 100, location: 'Sinai Forward Base', coordinates: { lat: 31.1249, lng: 33.7983 }, objectives: ['Emergency evacuation', 'Medical transport'], description: 'Emergency medical evacuation completed', resources: ['2x helicopters', 'Medical team'], createdAt: '2024-12-06', updatedAt: '2024-12-07' },
    { id: 'OP-2017', code: 'OP-EM-17', name: 'Equipment Maintenance', nameAr: 'صيانة المعدات', sectorId: 'sector_1', type: 'logistics', priority: 'low', status: 'active', commander: 'Maj. Sherif Gamal', personnel: 22, vehicles: 0, startDate: '2024-12-01', endDate: '2024-12-20', progress: 55, location: 'Cairo Workshop', coordinates: { lat: 30.0561, lng: 31.3445 }, objectives: ['Weapons overhaul', 'Vehicle service'], description: 'Annual equipment maintenance cycle', resources: ['Workshop tools', 'Spare parts'], createdAt: '2024-11-25', updatedAt: '2024-12-08' },
    { id: 'OP-2018', code: 'OP-CS-18', name: 'Cyber Security Audit', nameAr: 'تدقيق سيبراني', sectorId: 'sector_1', type: 'special', priority: 'high', status: 'active', commander: 'Lt. Sameh Yousry', personnel: 8, vehicles: 0, startDate: '2024-12-05', endDate: '2024-12-15', progress: 40, location: 'Cyber Unit HQ', coordinates: { lat: 30.0853, lng: 31.3375 }, objectives: ['Network audit', 'Vulnerability assessment'], description: 'Quarterly cyber security assessment', resources: ['Specialized hardware'], createdAt: '2024-12-03', updatedAt: '2024-12-08' },
    { id: 'OP-2019', code: 'OP-BR-19', name: 'Bridge Reinforcement', nameAr: 'تعزيز الجسر', sectorId: 'sector_5', type: 'logistics', priority: 'normal', status: 'planned', commander: 'Capt. Hossam Nabil', personnel: 35, vehicles: 8, startDate: '2024-12-15', endDate: '2024-12-28', progress: 0, location: 'Canal Bridge 3', coordinates: { lat: 30.5800, lng: 32.2500 }, objectives: ['Structural reinforcement'], description: 'Bridge structural upgrade', resources: ['Engineering equipment', 'Construction materials'], createdAt: '2024-12-05', updatedAt: '2024-12-05' },
    { id: 'OP-2020', code: 'OP-NT-20', name: 'Naval Training Drills', nameAr: 'تدريبات بحرية', sectorId: 'sector_3', type: 'training', priority: 'normal', status: 'planned', commander: 'Col. Karim Adel', personnel: 95, vehicles: 3, startDate: '2024-12-18', endDate: '2025-01-05', progress: 0, location: 'Alexandria Naval Base', coordinates: { lat: 31.2165, lng: 29.9445 }, objectives: ['Naval readiness', 'Combat drills'], description: 'Quarterly naval readiness exercise', resources: ['Training ships', 'Simulation gear'], createdAt: '2024-12-02', updatedAt: '2024-12-02' },
    { id: 'OP-2021', code: 'OP-SW-21', name: 'Sinai Well Project', nameAr: 'مشروع آبار سيناء', sectorId: 'sector_6', type: 'logistics', priority: 'normal', status: 'active', commander: 'Maj. Ehab Samir', personnel: 45, vehicles: 10, startDate: '2024-11-25', endDate: '2024-12-25', progress: 72, location: 'Central Sinai Villages', coordinates: { lat: 30.5000, lng: 33.8000 }, objectives: ['Water well construction', 'Community support'], description: 'Water infrastructure project in Sinai', resources: ['Drilling equipment', 'Engineering team'], createdAt: '2024-11-20', updatedAt: '2024-12-08' },
    { id: 'OP-2022', code: 'OP-HP-22', name: 'Highway Patrol Tango', nameAr: 'دورية الطريق السريع', sectorId: 'sector_4', type: 'patrol', priority: 'normal', status: 'active', commander: 'Sgt. Alaa Nabil', personnel: 24, vehicles: 6, startDate: '2024-12-02', endDate: '2024-12-16', progress: 62, location: 'Delta Highway', coordinates: { lat: 30.7865, lng: 31.0004 }, objectives: ['Traffic control', 'Highway security'], description: 'Highway patrol operation', resources: ['Patrol cars', 'Radar guns'], createdAt: '2024-12-01', updatedAt: '2024-12-08' },
    { id: 'OP-2023', code: 'OP-WD-23', name: 'Western Desert Survey', nameAr: 'مسح الصحراء الغربية', sectorId: 'sector_9', type: 'recon', priority: 'high', status: 'active', commander: 'Lt. Hazem Yasser', personnel: 32, vehicles: 5, startDate: '2024-12-04', endDate: '2024-12-19', progress: 48, location: 'Western Desert Grid 5', coordinates: { lat: 30.5000, lng: 27.0000 }, objectives: ['Terrain survey', 'Route mapping'], description: 'Extended desert reconnaissance', resources: ['Desert vehicles', 'Survey equipment'], createdAt: '2024-12-02', updatedAt: '2024-12-08' },
    { id: 'OP-2024', code: 'OP-LX-24', name: 'Luxor Heritage Guard', nameAr: 'حراسة الأقصر', sectorId: 'sector_7', type: 'security', priority: 'high', status: 'active', commander: 'Maj. Hany Reda', personnel: 42, vehicles: 4, startDate: '2024-12-01', endDate: '2024-12-31', progress: 30, location: 'Luxor Temple Complex', coordinates: { lat: 25.6872, lng: 32.6396 }, objectives: ['Heritage protection', 'Tourist security'], description: 'Archaeological site security', resources: ['Security systems', 'Guard posts'], createdAt: '2024-11-28', updatedAt: '2024-12-08' },
    { id: 'OP-2025', code: 'OP-AF-25', name: 'Aswan Dam Watch', nameAr: 'حراسة السد العالي', sectorId: 'sector_7', type: 'security', priority: 'critical', status: 'active', commander: 'Maj. Hany Reda', personnel: 78, vehicles: 8, startDate: '2024-11-20', endDate: '2025-02-28', progress: 22, location: 'Aswan Dam', coordinates: { lat: 23.9706, lng: 32.8775 }, objectives: ['Infrastructure security', 'Perimeter control'], description: 'Critical infrastructure protection', resources: ['Security barriers', 'Surveillance systems'], createdAt: '2024-11-15', updatedAt: '2024-12-08' },
    { id: 'OP-2026', code: 'OP-HR-26', name: 'Hurghada Resort Patrol', nameAr: 'دورية الغردقة', sectorId: 'sector_8', type: 'patrol', priority: 'normal', status: 'active', commander: 'Capt. Sami Hosny', personnel: 28, vehicles: 4, startDate: '2024-12-03', endDate: '2024-12-20', progress: 50, location: 'Hurghada Coast', coordinates: { lat: 27.2579, lng: 33.8116 }, objectives: ['Tourist security', 'Coastal patrol'], description: 'Tourist area security operation', resources: ['Patrol cars', 'Communication gear'], createdAt: '2024-12-01', updatedAt: '2024-12-08' },
    { id: 'OP-2027', code: 'OP-IS-27', name: 'Ismailia Canal Sweep', nameAr: 'تمشيط الإسماعيلية', sectorId: 'sector_5', type: 'security', priority: 'high', status: 'active', commander: 'Capt. Hossam Nabil', personnel: 48, vehicles: 6, startDate: '2024-12-02', endDate: '2024-12-14', progress: 58, location: 'Ismailia Canal Zone', coordinates: { lat: 30.6043, lng: 32.2638 }, objectives: ['Security sweep', 'Route inspection'], description: 'Canal security sweep operation', resources: ['Patrol boats', 'Drone support'], createdAt: '2024-11-30', updatedAt: '2024-12-08' },
    { id: 'OP-2028', code: 'OP-MT-28', name: 'Matrouh Coastal Watch', nameAr: 'حراسة مطروح', sectorId: 'sector_9', type: 'patrol', priority: 'normal', status: 'active', commander: 'Col. Khaled Rashad', personnel: 34, vehicles: 5, startDate: '2024-12-01', endDate: '2024-12-25', progress: 38, location: 'Matrouh Coast', coordinates: { lat: 31.3543, lng: 27.2373 }, objectives: ['Coastal surveillance'], description: 'Extended coastal patrol', resources: ['Patrol vehicles', 'Radar'], createdAt: '2024-11-28', updatedAt: '2024-12-08' },
    { id: 'OP-2029', code: 'OP-RA-29', name: 'Reserve Activation Drill', nameAr: 'تدريب الاحتياطي', sectorId: 'sector_10', type: 'training', priority: 'normal', status: 'planned', commander: 'Gen. Mostafa Fahmy', personnel: 245, vehicles: 28, startDate: '2024-12-20', endDate: '2025-01-10', progress: 0, location: 'Reserve Central Command', coordinates: { lat: 30.0500, lng: 31.3000 }, objectives: ['Rapid mobilization', 'Command chain test'], description: 'National reserve activation exercise', resources: ['Full reserve equipment'], createdAt: '2024-12-01', updatedAt: '2024-12-01' },
    { id: 'OP-2030', code: 'OP-BD-30', name: 'Border Drone Sweep', nameAr: 'مسح الطائرات المسيرة', sectorId: 'sector_6', type: 'recon', priority: 'critical', status: 'active', commander: 'Lt. Rami Sherif', personnel: 18, vehicles: 0, startDate: '2024-12-05', endDate: '2024-12-12', progress: 62, location: 'Sinai Border Zone', coordinates: { lat: 31.0500, lng: 34.0000 }, objectives: ['Drone surveillance', 'Threat detection'], description: 'Drone-based border surveillance', resources: ['8x military drones', 'Control station'], createdAt: '2024-12-03', updatedAt: '2024-12-08' },
];

export const INCIDENTS: Incident[] = [
    { id: 'INC-2001', operationId: 'OP-2002', sectorId: 'sector_1', type: 'security', severity: 'major', title: 'Unauthorized access detected', description: 'Unknown personnel attempted to breach perimeter security', location: 'Nasr City Checkpoint 3', reportedBy: 'Sgt. Ahmed Kamal', reportedAt: '2024-12-08T14:30:00Z', status: 'investigating' },
    { id: 'INC-2002', operationId: 'OP-2006', sectorId: 'sector_6', type: 'hostile', severity: 'critical', title: 'Hostile contact at border', description: 'Armed contact reported near border zone', location: 'Border Zone 1 East', reportedBy: 'Lt. Rami Sherif', reportedAt: '2024-12-08T13:15:00Z', status: 'investigating' },
    { id: 'INC-2003', operationId: 'OP-2005', sectorId: 'sector_3', type: 'equipment', severity: 'moderate', title: 'Patrol vehicle breakdown', description: 'Patrol vehicle #4 stopped due to engine failure', location: 'Corniche Route 2', reportedBy: 'Sgt. Karim Hany', reportedAt: '2024-12-08T11:45:00Z', status: 'resolved', resolvedAt: '2024-12-08T13:00:00Z' },
    { id: 'INC-2004', operationId: 'OP-2007', sectorId: 'sector_4', type: 'medical', severity: 'minor', title: 'Minor injury during relief', description: 'Soldier sustained minor hand injury during supply distribution', location: 'Tanta Rural Clinic', reportedBy: 'Maj. Ayman Samir', reportedAt: '2024-12-08T10:30:00Z', status: 'resolved', resolvedAt: '2024-12-08T11:15:00Z' },
    { id: 'INC-2005', operationId: 'OP-2001', sectorId: 'sector_6', type: 'equipment', severity: 'moderate', title: 'Drone signal loss', description: 'Drone lost signal briefly during recon — recovered', location: 'Central Sinai Grid 4', reportedBy: 'Col. Nabil Mostafa', reportedAt: '2024-12-08T09:20:00Z', status: 'resolved', resolvedAt: '2024-12-08T09:45:00Z' },
    { id: 'INC-2006', operationId: 'OP-2009', sectorId: 'sector_5', type: 'weather', severity: 'minor', title: 'Strong winds delayed patrol', description: 'Adverse weather delayed scheduled patrol by 2 hours', location: 'Canal West Bank', reportedBy: 'Capt. Hossam Nabil', reportedAt: '2024-12-08T08:00:00Z', status: 'closed' },
    { id: 'INC-2007', operationId: 'OP-2012', sectorId: 'sector_8', type: 'medical', severity: 'moderate', title: 'Diver decompression issue', description: 'Diver required decompression treatment after deep survey', location: 'Red Sea Survey Point 3', reportedBy: 'W.O. Ashraf Kamal', reportedAt: '2024-12-08T07:30:00Z', status: 'investigating' },
    { id: 'INC-2008', operationId: 'OP-2004', sectorId: 'sector_1', type: 'accident', severity: 'minor', title: 'Training accident during drill', description: 'Minor injury during training exercise — treated on site', location: 'Cairo Training Camp', reportedBy: 'Maj. Hassan Ali', reportedAt: '2024-12-01T15:00:00Z', status: 'closed' },
    { id: 'INC-2009', operationId: 'OP-2015', sectorId: 'sector_3', type: 'security', severity: 'moderate', title: 'Suspicious cargo detected', description: 'Unregistered cargo containers flagged for inspection', location: 'Alexandria Port — Dock 5', reportedBy: 'Capt. Omar Samir', reportedAt: '2024-12-08T06:15:00Z', status: 'investigating' },
    { id: 'INC-2010', operationId: 'OP-2010', sectorId: 'sector_9', type: 'weather', severity: 'moderate', title: 'Sandstorm warning', description: 'Approaching sandstorm — training paused', location: 'Western Desert Camp', reportedBy: 'Lt. Hazem Yasser', reportedAt: '2024-12-08T05:00:00Z', status: 'resolved', resolvedAt: '2024-12-08T09:00:00Z' },
    { id: 'INC-2011', operationId: 'OP-2008', sectorId: 'sector_10', type: 'security', severity: 'critical', title: 'Perimeter alert triggered', description: 'Classified perimeter alert — response deployed', location: 'Special Ops HQ (Classified)', reportedBy: 'Maj. Bahaa Adel', reportedAt: '2024-12-08T04:30:00Z', status: 'closed' },
    { id: 'INC-2012', operationId: 'OP-2013', sectorId: 'sector_7', type: 'medical', severity: 'minor', title: 'Soldier illness during patrol', description: 'Soldier reported heat exhaustion — treated on site', location: 'Assiut Rural Route', reportedBy: 'Sgt. Khaled Said', reportedAt: '2024-12-08T03:45:00Z', status: 'resolved', resolvedAt: '2024-12-08T04:30:00Z' },
    { id: 'INC-2013', operationId: 'OP-2003', sectorId: 'sector_4', type: 'equipment', severity: 'moderate', title: 'Convoy tire puncture', description: 'Transport truck #7 tire puncture — repaired on route', location: 'Delta Highway km 45', reportedBy: 'Maj. Sherif Gamal', reportedAt: '2024-12-07T22:15:00Z', status: 'resolved', resolvedAt: '2024-12-07T23:00:00Z' },
    { id: 'INC-2014', operationId: 'OP-2022', sectorId: 'sector_4', type: 'accident', severity: 'moderate', title: 'Vehicle collision during patrol', description: 'Patrol vehicle involved in minor collision', location: 'Delta Highway km 30', reportedBy: 'Sgt. Alaa Nabil', reportedAt: '2024-12-07T20:00:00Z', status: 'investigating' },
    { id: 'INC-2015', operationId: 'OP-2021', sectorId: 'sector_6', type: 'equipment', severity: 'minor', title: 'Drilling equipment malfunction', description: 'Well drilling equipment required repair', location: 'Central Sinai Project Site', reportedBy: 'Maj. Ehab Samir', reportedAt: '2024-12-07T18:30:00Z', status: 'resolved', resolvedAt: '2024-12-07T21:00:00Z' },
    { id: 'INC-2016', operationId: 'OP-2017', sectorId: 'sector_1', type: 'equipment', severity: 'minor', title: 'Workshop power outage', description: 'Brief power outage delayed maintenance work', location: 'Cairo Workshop', reportedBy: 'Maj. Sherif Gamal', reportedAt: '2024-12-07T16:45:00Z', status: 'resolved', resolvedAt: '2024-12-07T17:30:00Z' },
    { id: 'INC-2017', operationId: 'OP-2018', sectorId: 'sector_1', type: 'security', severity: 'major', title: 'Network intrusion attempt', description: 'Detected and blocked intrusion attempt on internal network', location: 'Cyber Unit HQ', reportedBy: 'Lt. Sameh Yousry', reportedAt: '2024-12-07T14:20:00Z', status: 'resolved', resolvedAt: '2024-12-07T15:00:00Z' },
    { id: 'INC-2018', operationId: 'OP-2019', sectorId: 'sector_5', type: 'other', severity: 'minor', title: 'Permit documentation delay', description: 'Construction permits required additional documentation', location: 'Ismailia Admin Office', reportedBy: 'Capt. Hossam Nabil', reportedAt: '2024-12-07T12:00:00Z', status: 'closed' },
    { id: 'INC-2019', operationId: 'OP-2024', sectorId: 'sector_7', type: 'security', severity: 'moderate', title: 'Unauthorized filming incident', description: 'Tourist filmed restricted archaeological area', location: 'Luxor Temple Complex', reportedBy: 'Maj. Hany Reda', reportedAt: '2024-12-07T10:15:00Z', status: 'closed' },
    { id: 'INC-2020', operationId: 'OP-2025', sectorId: 'sector_7', type: 'equipment', severity: 'minor', title: 'Surveillance camera offline', description: 'Camera #12 offline — scheduled for maintenance', location: 'Aswan Dam Perimeter', reportedBy: 'Maj. Hany Reda', reportedAt: '2024-12-07T08:30:00Z', status: 'resolved', resolvedAt: '2024-12-07T11:00:00Z' },
    { id: 'INC-2021', operationId: 'OP-2011', sectorId: 'sector_1', type: 'security', severity: 'minor', title: 'Suspicious activity reported', description: 'Civilian reported suspicious activity — investigated', location: 'Nasr City Grid 7', reportedBy: 'Sgt. Ahmed Kamal', reportedAt: '2024-12-07T02:00:00Z', status: 'closed' },
    { id: 'INC-2022', operationId: 'OP-2023', sectorId: 'sector_9', type: 'weather', severity: 'moderate', title: 'Extreme heat warning', description: 'Temperature exceeded safe limits — patrol adjusted', location: 'Western Desert Grid 5', reportedBy: 'Lt. Hazem Yasser', reportedAt: '2024-12-06T13:00:00Z', status: 'resolved', resolvedAt: '2024-12-06T17:00:00Z' },
    { id: 'INC-2023', operationId: 'OP-2027', sectorId: 'sector_5', type: 'equipment', severity: 'moderate', title: 'Radar station glitch', description: 'Temporary radar station malfunction — backup activated', location: 'Ismailia Radar Post 2', reportedBy: 'Capt. Hossam Nabil', reportedAt: '2024-12-06T10:45:00Z', status: 'resolved', resolvedAt: '2024-12-06T12:30:00Z' },
    { id: 'INC-2024', operationId: 'OP-2026', sectorId: 'sector_8', type: 'medical', severity: 'minor', title: 'Tourist minor injury', description: 'Tourist sustained minor injury — first aid provided', location: 'Hurghada Beach Zone', reportedBy: 'Capt. Sami Hosny', reportedAt: '2024-12-06T09:15:00Z', status: 'closed' },
    { id: 'INC-2025', operationId: 'OP-2014', sectorId: 'sector_2', type: 'other', severity: 'minor', title: 'Operation paused for review', description: 'Operation paused pending command review of methodology', location: 'Pyramids Zone Command', reportedBy: 'Maj. Magdy Hamdy', reportedAt: '2024-12-07T15:30:00Z', status: 'investigating' },
];

export const REPORTS: SectorReport[] = [
    { id: 'RPT-3001', title: 'Daily Operations Summary — Sector 6', titleAr: 'ملخص العمليات اليومي — سيناء', sectorId: 'sector_6', type: 'daily', status: 'approved', author: 'Col. Nabil Mostafa', createdAt: '2024-12-08T08:00:00Z', submittedAt: '2024-12-08T09:00:00Z', approvedAt: '2024-12-08T10:00:00Z', summary: 'Summary of all active operations in Sinai command including Operation Desert Wind and Border Patrol', pages: 12, classification: 'confidential' },
    { id: 'RPT-3002', title: 'Incident Report — Border Contact', titleAr: 'تقرير حادث — الحدود', sectorId: 'sector_6', type: 'incident', status: 'submitted', author: 'Lt. Rami Sherif', createdAt: '2024-12-08T13:20:00Z', submittedAt: '2024-12-08T13:25:00Z', summary: 'Detailed report on hostile contact incident at Border Zone 1', pages: 6, classification: 'top-secret' },
    { id: 'RPT-3003', title: 'Weekly Readiness Assessment', titleAr: 'تقييم الجاهزية الأسبوعي', sectorId: 'sector_1', type: 'weekly', status: 'approved', author: 'Col. Ahmed Hassan', createdAt: '2024-12-07T14:00:00Z', submittedAt: '2024-12-07T16:00:00Z', approvedAt: '2024-12-08T08:00:00Z', summary: 'Weekly readiness assessment for Cairo HQ', pages: 18, classification: 'internal' },
    { id: 'RPT-3004', title: 'Medical Relief Operation Report', titleAr: 'تقرير عملية الإغاثة الطبية', sectorId: 'sector_4', type: 'special', status: 'submitted', author: 'Maj. Ayman Samir', createdAt: '2024-12-08T11:00:00Z', submittedAt: '2024-12-08T11:30:00Z', summary: 'Medical relief progress and outcome statistics', pages: 8, classification: 'internal' },
    { id: 'RPT-3005', title: 'Monthly Sector Overview — November', titleAr: 'نظرة شهرية — نوفمبر', sectorId: 'sector_1', type: 'monthly', status: 'approved', author: 'Col. Ahmed Hassan', createdAt: '2024-12-01T10:00:00Z', submittedAt: '2024-12-02T10:00:00Z', approvedAt: '2024-12-05T10:00:00Z', summary: 'Comprehensive monthly overview of all Sector 1 operations', pages: 42, classification: 'internal' },
    { id: 'RPT-3006', title: 'Logistics Convoy Status', titleAr: 'حالة القافلة اللوجستية', sectorId: 'sector_4', type: 'daily', status: 'approved', author: 'Maj. Sherif Gamal', createdAt: '2024-12-08T07:30:00Z', submittedAt: '2024-12-08T08:00:00Z', approvedAt: '2024-12-08T08:30:00Z', summary: 'Status update on logistics convoy from HQ to Delta', pages: 4, classification: 'internal' },
    { id: 'RPT-3007', title: 'Sinai Well Project Progress', titleAr: 'تقرير مشروع آبار سيناء', sectorId: 'sector_6', type: 'special', status: 'submitted', author: 'Maj. Ehab Samir', createdAt: '2024-12-08T06:00:00Z', submittedAt: '2024-12-08T06:30:00Z', summary: 'Water well construction progress and community impact', pages: 10, classification: 'public' },
    { id: 'RPT-3008', title: 'Cyber Security Audit — Interim', titleAr: 'التدقيق السيبراني المؤقت', sectorId: 'sector_1', type: 'special', status: 'draft', author: 'Lt. Sameh Yousry', createdAt: '2024-12-08T15:00:00Z', summary: 'Interim findings from quarterly cyber audit', pages: 14, classification: 'top-secret' },
    { id: 'RPT-3009', title: 'Coastal Patrol Weekly Report', titleAr: 'تقرير الدورية الساحلية', sectorId: 'sector_3', type: 'weekly', status: 'approved', author: 'Col. Karim Adel', createdAt: '2024-12-06T18:00:00Z', submittedAt: '2024-12-07T09:00:00Z', approvedAt: '2024-12-07T14:00:00Z', summary: 'Weekly coastal patrol summary for Alexandria', pages: 16, classification: 'internal' },
    { id: 'RPT-3010', title: 'Training Exercise Bravo AAR', titleAr: 'تحليل تمرين ب', sectorId: 'sector_1', type: 'assessment', status: 'approved', author: 'Maj. Hassan Ali', createdAt: '2024-12-02T10:00:00Z', submittedAt: '2024-12-02T15:00:00Z', approvedAt: '2024-12-04T10:00:00Z', summary: 'After Action Review of quarterly readiness exercise', pages: 22, classification: 'internal' },
    { id: 'RPT-3011', title: 'Port Security Incident Report', titleAr: 'تقرير حادث أمن الميناء', sectorId: 'sector_3', type: 'incident', status: 'submitted', author: 'Capt. Omar Samir', createdAt: '2024-12-08T07:00:00Z', submittedAt: '2024-12-08T07:30:00Z', summary: 'Report on suspicious cargo incident at Alexandria Port', pages: 6, classification: 'confidential' },
    { id: 'RPT-3012', title: 'Special Ops Weekly Briefing', titleAr: 'الإحاطة الأسبوعية للعمليات', sectorId: 'sector_10', type: 'weekly', status: 'approved', author: 'Maj. Bahaa Adel', createdAt: '2024-12-07T08:00:00Z', submittedAt: '2024-12-07T08:30:00Z', approvedAt: '2024-12-07T10:00:00Z', summary: 'Weekly briefing for special operations command', pages: 20, classification: 'top-secret' },
    { id: 'RPT-3013', title: 'Desert Training Assessment', titleAr: 'تقييم التدريب الصحراوي', sectorId: 'sector_9', type: 'assessment', status: 'submitted', author: 'Lt. Hazem Yasser', createdAt: '2024-12-08T12:00:00Z', submittedAt: '2024-12-08T12:30:00Z', summary: 'Interim assessment of ongoing desert training', pages: 12, classification: 'internal' },
    { id: 'RPT-3014', title: 'Aswan Dam Security Report', titleAr: 'تقرير أمن السد العالي', sectorId: 'sector_7', type: 'special', status: 'approved', author: 'Maj. Hany Reda', createdAt: '2024-12-06T14:00:00Z', submittedAt: '2024-12-06T16:00:00Z', approvedAt: '2024-12-07T10:00:00Z', summary: 'Critical infrastructure security assessment', pages: 18, classification: 'confidential' },
    { id: 'RPT-3015', title: 'Canal Security Weekly Update', titleAr: 'تحديث أمن القناة', sectorId: 'sector_5', type: 'weekly', status: 'submitted', author: 'Capt. Hossam Nabil', createdAt: '2024-12-08T14:00:00Z', submittedAt: '2024-12-08T14:30:00Z', summary: 'Weekly canal security operation update', pages: 10, classification: 'internal' },
    { id: 'RPT-3016', title: 'Red Sea Survey Interim Report', titleAr: 'تقرير مسح البحر الأحمر', sectorId: 'sector_8', type: 'assessment', status: 'draft', author: 'W.O. Ashraf Kamal', createdAt: '2024-12-08T16:00:00Z', summary: 'Interim findings from ongoing Red Sea survey', pages: 14, classification: 'internal' },
    { id: 'RPT-3017', title: 'Reserve Activation Planning', titleAr: 'تخطيط تفعيل الاحتياطي', sectorId: 'sector_10', type: 'special', status: 'approved', author: 'Gen. Mostafa Fahmy', createdAt: '2024-12-03T10:00:00Z', submittedAt: '2024-12-03T14:00:00Z', approvedAt: '2024-12-05T10:00:00Z', summary: 'Planning document for upcoming reserve activation', pages: 34, classification: 'top-secret' },
    { id: 'RPT-3018', title: 'December Daily Reports Log', titleAr: 'سجل التقارير اليومية', sectorId: 'sector_1', type: 'monthly', status: 'draft', author: 'Col. Ahmed Hassan', createdAt: '2024-12-08T17:00:00Z', summary: 'Compilation of all daily reports for December', pages: 88, classification: 'internal' },
    { id: 'RPT-3019', title: 'Heritage Site Security Review', titleAr: 'مراجعة أمن المواقع الأثرية', sectorId: 'sector_7', type: 'assessment', status: 'submitted', author: 'Maj. Hany Reda', createdAt: '2024-12-05T11:00:00Z', submittedAt: '2024-12-05T15:00:00Z', summary: 'Assessment of security measures for archaeological sites', pages: 16, classification: 'confidential' },
    { id: 'RPT-3020', title: 'Equipment Maintenance Status', titleAr: 'حالة صيانة المعدات', sectorId: 'sector_1', type: 'special', status: 'approved', author: 'Maj. Sherif Gamal', createdAt: '2024-12-07T12:00:00Z', submittedAt: '2024-12-07T14:00:00Z', approvedAt: '2024-12-08T10:00:00Z', summary: 'Status of annual equipment maintenance cycle', pages: 20, classification: 'internal' },
];

export const RESOURCES: SectorResource[] = [
    { id: 'RES-001', sectorId: 'sector_1', type: 'vehicle', name: 'Armored Personnel Carriers', quantity: 24, available: 18, deployed: 5, maintenance: 1, status: 'operational' },
    { id: 'RES-002', sectorId: 'sector_1', type: 'vehicle', name: 'Transport Trucks', quantity: 36, available: 22, deployed: 12, maintenance: 2, status: 'operational' },
    { id: 'RES-003', sectorId: 'sector_1', type: 'weapon', name: 'Assault Rifles', quantity: 850, available: 620, deployed: 220, maintenance: 10, status: 'operational' },
    { id: 'RES-004', sectorId: 'sector_1', type: 'medical', name: 'Field Medical Kits', quantity: 120, available: 78, deployed: 42, maintenance: 0, status: 'operational' },
    { id: 'RES-005', sectorId: 'sector_1', type: 'communication', name: 'Tactical Radios', quantity: 240, available: 156, deployed: 78, maintenance: 6, status: 'operational' },
    { id: 'RES-006', sectorId: 'sector_1', type: 'equipment', name: 'Night Vision Goggles', quantity: 180, available: 112, deployed: 65, maintenance: 3, status: 'operational' },
    { id: 'RES-007', sectorId: 'sector_1', type: 'fuel', name: 'Diesel (Liters)', quantity: 50000, available: 28000, deployed: 21000, maintenance: 1000, status: 'operational' },
    { id: 'RES-008', sectorId: 'sector_3', type: 'vehicle', name: 'Patrol Boats', quantity: 12, available: 8, deployed: 4, maintenance: 0, status: 'operational' },
    { id: 'RES-009', sectorId: 'sector_3', type: 'weapon', name: 'Naval Guns', quantity: 16, available: 12, deployed: 4, maintenance: 0, status: 'operational' },
    { id: 'RES-010', sectorId: 'sector_3', type: 'communication', name: 'Marine Radios', quantity: 120, available: 82, deployed: 35, maintenance: 3, status: 'operational' },
    { id: 'RES-011', sectorId: 'sector_3', type: 'equipment', name: 'Diving Gear Sets', quantity: 80, available: 45, deployed: 30, maintenance: 5, status: 'limited' },
    { id: 'RES-012', sectorId: 'sector_5', type: 'equipment', name: 'Radar Systems', quantity: 8, available: 5, deployed: 2, maintenance: 1, status: 'operational' },
    { id: 'RES-013', sectorId: 'sector_5', type: 'vehicle', name: 'Patrol Vehicles', quantity: 28, available: 16, deployed: 10, maintenance: 2, status: 'operational' },
    { id: 'RES-014', sectorId: 'sector_5', type: 'weapon', name: 'Heavy Machine Guns', quantity: 32, available: 22, deployed: 8, maintenance: 2, status: 'operational' },
    { id: 'RES-015', sectorId: 'sector_6', type: 'vehicle', name: 'Desert Vehicles', quantity: 42, available: 24, deployed: 16, maintenance: 2, status: 'operational' },
    { id: 'RES-016', sectorId: 'sector_6', type: 'equipment', name: 'Military Drones', quantity: 24, available: 12, deployed: 10, maintenance: 2, status: 'operational' },
    { id: 'RES-017', sectorId: 'sector_6', type: 'weapon', name: 'Sniper Rifles', quantity: 24, available: 18, deployed: 6, maintenance: 0, status: 'operational' },
    { id: 'RES-018', sectorId: 'sector_6', type: 'communication', name: 'Encrypted Comms', quantity: 180, available: 92, deployed: 82, maintenance: 6, status: 'operational' },
    { id: 'RES-019', sectorId: 'sector_6', type: 'medical', name: 'Combat Medic Kits', quantity: 80, available: 42, deployed: 36, maintenance: 2, status: 'operational' },
    { id: 'RES-020', sectorId: 'sector_6', type: 'fuel', name: 'Diesel (Liters)', quantity: 80000, available: 35000, deployed: 42000, maintenance: 3000, status: 'limited' },
    { id: 'RES-021', sectorId: 'sector_7', type: 'vehicle', name: 'Patrol Vehicles', quantity: 32, available: 20, deployed: 11, maintenance: 1, status: 'operational' },
    { id: 'RES-022', sectorId: 'sector_7', type: 'equipment', name: 'Security Cameras', quantity: 240, available: 156, deployed: 78, maintenance: 6, status: 'operational' },
    { id: 'RES-023', sectorId: 'sector_7', type: 'weapon', name: 'Assault Rifles', quantity: 620, available: 420, deployed: 190, maintenance: 10, status: 'operational' },
    { id: 'RES-024', sectorId: 'sector_8', type: 'vehicle', name: 'Survey Boats', quantity: 8, available: 4, deployed: 3, maintenance: 1, status: 'operational' },
    { id: 'RES-025', sectorId: 'sector_8', type: 'equipment', name: 'Diving Gear', quantity: 60, available: 30, deployed: 26, maintenance: 4, status: 'limited' },
    { id: 'RES-026', sectorId: 'sector_9', type: 'vehicle', name: 'Desert Trucks', quantity: 22, available: 14, deployed: 7, maintenance: 1, status: 'operational' },
    { id: 'RES-027', sectorId: 'sector_9', type: 'equipment', name: 'GPS Navigation Units', quantity: 60, available: 38, deployed: 20, maintenance: 2, status: 'operational' },
    { id: 'RES-028', sectorId: 'sector_10', type: 'vehicle', name: 'Special Ops Vehicles', quantity: 32, available: 20, deployed: 11, maintenance: 1, status: 'operational' },
    { id: 'RES-029', sectorId: 'sector_10', type: 'weapon', name: 'Special Ops Rifles', quantity: 240, available: 145, deployed: 88, maintenance: 7, status: 'operational' },
    { id: 'RES-030', sectorId: 'sector_10', type: 'equipment', name: 'Advanced Comms Gear', quantity: 120, available: 62, deployed: 52, maintenance: 6, status: 'operational' },
    { id: 'RES-031', sectorId: 'sector_10', type: 'equipment', name: 'Advanced Surveillance', quantity: 60, available: 24, deployed: 32, maintenance: 4, status: 'limited' },
    { id: 'RES-032', sectorId: 'sector_2', type: 'vehicle', name: 'Patrol Vehicles', quantity: 24, available: 14, deployed: 8, maintenance: 2, status: 'operational' },
    { id: 'RES-033', sectorId: 'sector_2', type: 'weapon', name: 'Assault Rifles', quantity: 480, available: 320, deployed: 150, maintenance: 10, status: 'operational' },
    { id: 'RES-034', sectorId: 'sector_4', type: 'vehicle', name: 'Transport Trucks', quantity: 28, available: 16, deployed: 10, maintenance: 2, status: 'operational' },
    { id: 'RES-035', sectorId: 'sector_4', type: 'equipment', name: 'Engineering Tools', quantity: 80, available: 52, deployed: 24, maintenance: 4, status: 'operational' },
    { id: 'RES-036', sectorId: 'sector_1', type: 'equipment', name: 'Body Armor Sets', quantity: 1200, available: 820, deployed: 360, maintenance: 20, status: 'operational' },
    { id: 'RES-037', sectorId: 'sector_6', type: 'equipment', name: 'Body Armor Sets', quantity: 1400, available: 920, deployed: 460, maintenance: 20, status: 'operational' },
    { id: 'RES-038', sectorId: 'sector_3', type: 'vehicle', name: 'Coast Guard Cutters', quantity: 6, available: 4, deployed: 2, maintenance: 0, status: 'operational' },
    { id: 'RES-039', sectorId: 'sector_5', type: 'medical', name: 'Field Medical Kits', quantity: 90, available: 52, deployed: 35, maintenance: 3, status: 'operational' },
    { id: 'RES-040', sectorId: 'sector_10', type: 'medical', name: 'Advanced Trauma Kits', quantity: 60, available: 32, deployed: 26, maintenance: 2, status: 'operational' },
];

export const OPS_LOG: OpsLogEntry[] = [
    { id: 'LOG-001', timestamp: '2024-12-08T14:45:00Z', sectorId: 'sector_6', operationId: 'OP-2001', action: 'incident', description: 'Drone signal loss incident reported', by: 'Col. Nabil Mostafa', icon: '⚠️', color: '#ff9500' },
    { id: 'LOG-002', timestamp: '2024-12-08T14:30:00Z', sectorId: 'sector_1', operationId: 'OP-2002', action: 'incident', description: 'Perimeter breach attempt detected', by: 'Sgt. Ahmed Kamal', icon: '🚨', color: '#ff3b30' },
    { id: 'LOG-003', timestamp: '2024-12-08T14:00:00Z', sectorId: 'sector_4', operationId: 'OP-2003', action: 'report', description: 'Logistics convoy status report submitted', by: 'Maj. Sherif Gamal', icon: '📄', color: '#007aff' },
    { id: 'LOG-004', timestamp: '2024-12-08T13:15:00Z', sectorId: 'sector_6', operationId: 'OP-2006', action: 'incident', description: 'Hostile contact at border zone reported', by: 'Lt. Rami Sherif', icon: '🚨', color: '#ff3b30' },
    { id: 'LOG-005', timestamp: '2024-12-08T12:00:00Z', sectorId: 'sector_1', operationId: 'OP-2018', action: 'started', description: 'Cyber security audit commenced', by: 'Lt. Sameh Yousry', icon: '▶', color: '#34c759' },
    { id: 'LOG-006', timestamp: '2024-12-08T11:30:00Z', sectorId: 'sector_4', operationId: 'OP-2007', action: 'report', description: 'Medical relief operation report submitted', by: 'Maj. Ayman Samir', icon: '📄', color: '#007aff' },
    { id: 'LOG-007', timestamp: '2024-12-08T10:45:00Z', sectorId: 'sector_7', operationId: 'OP-2024', action: 'resource', description: 'Additional security personnel deployed to Luxor', by: 'Maj. Hany Reda', icon: '📦', color: '#af52de' },
    { id: 'LOG-008', timestamp: '2024-12-08T10:00:00Z', sectorId: 'sector_6', operationId: 'OP-2030', action: 'started', description: 'Border drone sweep operation commenced', by: 'Lt. Rami Sherif', icon: '▶', color: '#34c759' },
    { id: 'LOG-009', timestamp: '2024-12-08T09:00:00Z', sectorId: 'sector_1', operationId: undefined, action: 'resource', description: 'Annual equipment maintenance cycle initiated', by: 'Maj. Sherif Gamal', icon: '📦', color: '#af52de' },
    { id: 'LOG-010', timestamp: '2024-12-08T08:30:00Z', sectorId: 'sector_5', operationId: 'OP-2009', action: 'report', description: 'Canal security weekly report submitted', by: 'Capt. Hossam Nabil', icon: '📄', color: '#007aff' },
    { id: 'LOG-011', timestamp: '2024-12-08T07:00:00Z', sectorId: 'sector_3', operationId: 'OP-2015', action: 'incident', description: 'Suspicious cargo detected at port', by: 'Capt. Omar Samir', icon: '⚠️', color: '#ff9500' },
    { id: 'LOG-012', timestamp: '2024-12-08T06:00:00Z', sectorId: 'sector_9', operationId: 'OP-2010', action: 'paused', description: 'Desert training paused due to sandstorm warning', by: 'Lt. Hazem Yasser', icon: '⏸', color: '#ff9500' },
    { id: 'LOG-013', timestamp: '2024-12-07T22:00:00Z', sectorId: 'sector_4', operationId: 'OP-2003', action: 'incident', description: 'Convoy tire puncture resolved', by: 'Maj. Sherif Gamal', icon: '🔧', color: '#8e8e93' },
    { id: 'LOG-014', timestamp: '2024-12-07T20:00:00Z', sectorId: 'sector_4', operationId: 'OP-2022', action: 'incident', description: 'Vehicle collision during highway patrol', by: 'Sgt. Alaa Nabil', icon: '⚠️', color: '#ff9500' },
    { id: 'LOG-015', timestamp: '2024-12-07T18:00:00Z', sectorId: 'sector_6', operationId: 'OP-2021', action: 'resource', description: 'Drilling equipment repaired — project resumes', by: 'Maj. Ehab Samir', icon: '🔧', color: '#34c759' },
    { id: 'LOG-016', timestamp: '2024-12-07T16:00:00Z', sectorId: 'sector_1', operationId: 'OP-2017', action: 'resource', description: 'Workshop power restored — maintenance continues', by: 'Maj. Sherif Gamal', icon: '🔧', color: '#34c759' },
    { id: 'LOG-017', timestamp: '2024-12-07T15:00:00Z', sectorId: 'sector_2', operationId: 'OP-2014', action: 'paused', description: 'Security sweep paused pending command review', by: 'Maj. Magdy Hamdy', icon: '⏸', color: '#ff9500' },
    { id: 'LOG-018', timestamp: '2024-12-07T14:00:00Z', sectorId: 'sector_1', operationId: 'OP-2018', action: 'incident', description: 'Network intrusion attempt blocked', by: 'Lt. Sameh Yousry', icon: '🚨', color: '#ff3b30' },
    { id: 'LOG-019', timestamp: '2024-12-07T10:00:00Z', sectorId: 'sector_7', operationId: 'OP-2024', action: 'incident', description: 'Unauthorized filming incident resolved', by: 'Maj. Hany Reda', icon: '✓', color: '#34c759' },
    { id: 'LOG-020', timestamp: '2024-12-07T08:00:00Z', sectorId: 'sector_10', operationId: 'OP-2008', action: 'started', description: 'Special operations mission commenced', by: 'Maj. Bahaa Adel', icon: '▶', color: '#34c759' },
    { id: 'LOG-021', timestamp: '2024-12-06T18:00:00Z', sectorId: 'sector_3', operationId: 'OP-2005', action: 'report', description: 'Coastal patrol weekly report submitted', by: 'Col. Karim Adel', icon: '📄', color: '#007aff' },
    { id: 'LOG-022', timestamp: '2024-12-06T14:00:00Z', sectorId: 'sector_7', operationId: 'OP-2025', action: 'resource', description: 'Aswan Dam security personnel reinforced', by: 'Maj. Hany Reda', icon: '📦', color: '#af52de' },
    { id: 'LOG-023', timestamp: '2024-12-05T10:00:00Z', sectorId: 'sector_6', operationId: 'OP-2001', action: 'started', description: 'Operation Desert Wind commenced', by: 'Col. Nabil Mostafa', icon: '▶', color: '#34c759' },
    { id: 'LOG-024', timestamp: '2024-12-05T09:00:00Z', sectorId: 'sector_5', operationId: 'OP-2009', action: 'started', description: 'Canal security watch operation commenced', by: 'Capt. Hossam Nabil', icon: '▶', color: '#34c759' },
    { id: 'LOG-025', timestamp: '2024-12-04T08:00:00Z', sectorId: 'sector_10', operationId: 'OP-2008', action: 'created', description: 'Special operations mission created', by: 'Gen. Mostafa Fahmy', icon: '📝', color: '#af52de' },
];