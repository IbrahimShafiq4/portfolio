export interface Zone {
    id: string;
    code: string;
    name: string;
    nameAr: string;
    sectorId: string;
    type: 'urban' | 'rural' | 'desert' | 'coastal' | 'border' | 'industrial';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    population: number;
    activeSoldiers: number;
    lastActivity: string;
    coordinates: { lat: number; lng: number };
    color: string;
    icon: string;
}

export interface ReminderSoldier {
    id: string;
    name: string;
    nameAr: string;
    rank: string;
    rankAr: string;
    sectorId: string;
    zoneId: string;
    unit: string;
    phone: string;
    status: 'Active' | 'On Mission' | 'Returning' | 'Missing' | 'Medical' | 'Rest';
    currentMission: string;
    lastKnownAt: string;
    expectedReturn: string;
    bloodType: string;
    squad: string;
}

export interface ReminderOfficer {
    id: string;
    name: string;
    nameAr: string;
    rank: string;
    rankAr: string;
    sectorId: string;
    role: string;
    phone: string;
    email: string;
    online: boolean;
    workload: number;
    todayActions: number;
    yearsOfService: number;
}

export interface Reminder {
    id: string;
    soldierId: string;
    officerId: string;
    sectorId: string;
    zoneId: string;
    type: 'mission_return' | 'location_update' | 'check_in' | 'emergency' | 'medical' | 'equipment';
    priority: 'low' | 'normal' | 'high' | 'critical';
    status: 'pending' | 'confirmed' | 'overdue' | 'escalated' | 'dismissed';
    title: string;
    description: string;
    location: string;
    coordinates: { lat: number; lng: number };
    createdAt: string;
    confirmedAt?: string;
    escalatedAt?: string;
    dueAt: string;
    notes: { author: string; text: string; at: string; }[];
}

export const REMINDER_ZONES: Zone[] = [
    { id: 'zone_1a', code: 'Z-1A', name: 'Downtown Nasr City', nameAr: 'وسط مدينة نصر', sectorId: 'sector_1', type: 'urban', riskLevel: 'medium', population: 850000, activeSoldiers: 42, lastActivity: '2m ago', coordinates: { lat: 30.0561, lng: 31.3445 }, color: '#007aff', icon: '🏙' },
    { id: 'zone_1b', code: 'Z-1B', name: 'Heliopolis District', nameAr: 'مصر الجديدة', sectorId: 'sector_1', type: 'urban', riskLevel: 'low', population: 620000, activeSoldiers: 28, lastActivity: '15m ago', coordinates: { lat: 30.0853, lng: 31.3375 }, color: '#007aff', icon: '🏛' },
    { id: 'zone_2a', code: 'Z-2A', name: 'Dokki Center', nameAr: 'الدقي', sectorId: 'sector_2', type: 'urban', riskLevel: 'low', population: 480000, activeSoldiers: 24, lastActivity: '5m ago', coordinates: { lat: 30.0380, lng: 31.2120 }, color: '#ff9500', icon: '🏢' },
    { id: 'zone_2b', code: 'Z-2B', name: 'Pyramids Zone', nameAr: 'منطقة الأهرامات', sectorId: 'sector_2', type: 'rural', riskLevel: 'medium', population: 320000, activeSoldiers: 38, lastActivity: '1h ago', coordinates: { lat: 29.9792, lng: 31.1342 }, color: '#ff9500', icon: '🔺' },
    { id: 'zone_3a', code: 'Z-3A', name: 'Sidi Gaber', nameAr: 'سيدي جابر', sectorId: 'sector_3', type: 'urban', riskLevel: 'medium', population: 540000, activeSoldiers: 51, lastActivity: '3m ago', coordinates: { lat: 31.2165, lng: 29.9445 }, color: '#ff3b30', icon: '⚓' },
    { id: 'zone_3b', code: 'Z-3B', name: 'Corniche Zone', nameAr: 'الكورنيش', sectorId: 'sector_3', type: 'coastal', riskLevel: 'high', population: 280000, activeSoldiers: 47, lastActivity: '30s ago', coordinates: { lat: 31.2040, lng: 29.9180 }, color: '#ff3b30', icon: '🌊' },
    { id: 'zone_4a', code: 'Z-4A', name: 'Tanta Central', nameAr: 'طنطا المركزية', sectorId: 'sector_4', type: 'urban', riskLevel: 'low', population: 420000, activeSoldiers: 22, lastActivity: '10m ago', coordinates: { lat: 30.7865, lng: 31.0004 }, color: '#34c759', icon: '🏙' },
    { id: 'zone_4b', code: 'Z-4B', name: 'Agriculture Belt', nameAr: 'الحزام الزراعي', sectorId: 'sector_4', type: 'rural', riskLevel: 'low', population: 180000, activeSoldiers: 15, lastActivity: '2h ago', coordinates: { lat: 30.8200, lng: 31.0500 }, color: '#34c759', icon: '🌾' },
    { id: 'zone_5a', code: 'Z-5A', name: 'Ismailia Port', nameAr: 'ميناء الإسماعيلية', sectorId: 'sector_5', type: 'industrial', riskLevel: 'high', population: 380000, activeSoldiers: 62, lastActivity: '1m ago', coordinates: { lat: 30.6043, lng: 32.2638 }, color: '#5856d6', icon: '🚢' },
    { id: 'zone_5b', code: 'Z-5B', name: 'Canal West Bank', nameAr: 'الضفة الغربية للقناة', sectorId: 'sector_5', type: 'industrial', riskLevel: 'critical', population: 250000, activeSoldiers: 55, lastActivity: '20s ago', coordinates: { lat: 30.5800, lng: 32.2500 }, color: '#5856d6', icon: '⚓' },
    { id: 'zone_6a', code: 'Z-6A', name: 'Arish Command', nameAr: 'قيادة العريش', sectorId: 'sector_6', type: 'urban', riskLevel: 'high', population: 290000, activeSoldiers: 84, lastActivity: '5s ago', coordinates: { lat: 31.1249, lng: 33.7983 }, color: '#af52de', icon: '🏜' },
    { id: 'zone_6b', code: 'Z-6B', name: 'Border Zone 1', nameAr: 'المنطقة الحدودية 1', sectorId: 'sector_6', type: 'border', riskLevel: 'critical', population: 42000, activeSoldiers: 78, lastActivity: '10s ago', coordinates: { lat: 31.0500, lng: 34.0000 }, color: '#af52de', icon: '🛡' },
    { id: 'zone_6c', code: 'Z-6C', name: 'Central Sinai', nameAr: 'وسط سيناء', sectorId: 'sector_6', type: 'desert', riskLevel: 'critical', population: 65000, activeSoldiers: 71, lastActivity: '15s ago', coordinates: { lat: 30.5000, lng: 33.8000 }, color: '#af52de', icon: '🏜' },
    { id: 'zone_7a', code: 'Z-7A', name: 'Assiut Central', nameAr: 'أسيوط المركزية', sectorId: 'sector_7', type: 'urban', riskLevel: 'medium', population: 620000, activeSoldiers: 34, lastActivity: '8m ago', coordinates: { lat: 27.1809, lng: 31.1837 }, color: '#ffcc00', icon: '🏙' },
    { id: 'zone_7b', code: 'Z-7B', name: 'Upper Egypt Rural', nameAr: 'ريف الصعيد', sectorId: 'sector_7', type: 'rural', riskLevel: 'low', population: 380000, activeSoldiers: 21, lastActivity: '45m ago', coordinates: { lat: 27.0000, lng: 31.2000 }, color: '#ffcc00', icon: '🌾' },
    { id: 'zone_8a', code: 'Z-8A', name: 'Hurghada Port', nameAr: 'ميناء الغردقة', sectorId: 'sector_8', type: 'coastal', riskLevel: 'high', population: 210000, activeSoldiers: 41, lastActivity: '2m ago', coordinates: { lat: 27.2579, lng: 33.8116 }, color: '#00c7be', icon: '🌊' },
    { id: 'zone_8b', code: 'Z-8B', name: 'Red Sea Islands', nameAr: 'جزر البحر الأحمر', sectorId: 'sector_8', type: 'coastal', riskLevel: 'high', population: 35000, activeSoldiers: 28, lastActivity: '20m ago', coordinates: { lat: 27.0000, lng: 34.0000 }, color: '#00c7be', icon: '🏝' },
    { id: 'zone_9a', code: 'Z-9A', name: 'Marsa Matrouh', nameAr: 'مرسى مطروح', sectorId: 'sector_9', type: 'coastal', riskLevel: 'medium', population: 145000, activeSoldiers: 32, lastActivity: '4m ago', coordinates: { lat: 31.3543, lng: 27.2373 }, color: '#ff2d55', icon: '🏖' },
    { id: 'zone_9b', code: 'Z-9B', name: 'Western Desert', nameAr: 'الصحراء الغربية', sectorId: 'sector_9', type: 'desert', riskLevel: 'high', population: 18000, activeSoldiers: 24, lastActivity: '35m ago', coordinates: { lat: 30.5000, lng: 27.0000 }, color: '#ff2d55', icon: '🏜' },
    { id: 'zone_10a', code: 'Z-10A', name: 'Central Reserve', nameAr: 'الاحتياطي المركزي', sectorId: 'sector_10', type: 'urban', riskLevel: 'low', population: 85000, activeSoldiers: 145, lastActivity: '1m ago', coordinates: { lat: 30.0500, lng: 31.3000 }, color: '#8e8e93', icon: '⭐' },
    { id: 'zone_10b', code: 'Z-10B', name: 'Special Ops HQ', nameAr: 'قيادة العمليات الخاصة', sectorId: 'sector_10', type: 'urban', riskLevel: 'critical', population: 12000, activeSoldiers: 187, lastActivity: '10s ago', coordinates: { lat: 30.0600, lng: 31.3200 }, color: '#8e8e93', icon: '🎖' },
];

export const REMINDER_SOLDIERS: ReminderSoldier[] = [
    { id: 'RM-001', name: 'Ahmed Mohamed Kamal', nameAr: 'أحمد محمد كمال', rank: 'Sergeant', rankAr: 'رقيب', sectorId: 'sector_1', zoneId: 'zone_1a', unit: 'Squad Alpha', phone: '+20 100 555 0001', status: 'On Mission', currentMission: 'Patrol Route 14', lastKnownAt: '2m ago', expectedReturn: '22:00', bloodType: 'O+', squad: 'A-1' },
    { id: 'RM-002', name: 'Youssef Khaled Adel', nameAr: 'يوسف خالد عادل', rank: 'Corporal', rankAr: 'عريف', sectorId: 'sector_1', zoneId: 'zone_1b', unit: 'Squad Bravo', phone: '+20 100 555 0002', status: 'Returning', currentMission: 'Recon Alpha', lastKnownAt: '5m ago', expectedReturn: '19:30', bloodType: 'A+', squad: 'B-2' },
    { id: 'RM-003', name: 'Omar Samir Hassan', nameAr: 'عمر سمير حسن', rank: 'Private', rankAr: 'جندي', sectorId: 'sector_2', zoneId: 'zone_2a', unit: 'Squad Charlie', phone: '+20 100 555 0003', status: 'Missing', currentMission: 'Night Watch', lastKnownAt: '4h ago', expectedReturn: '16:00', bloodType: 'B+', squad: 'C-3' },
    { id: 'RM-004', name: 'Karim Hany Tarek', nameAr: 'كريم هاني طارق', rank: 'Sergeant', rankAr: 'رقيب', sectorId: 'sector_3', zoneId: 'zone_3a', unit: 'Squad Delta', phone: '+20 100 555 0004', status: 'On Mission', currentMission: 'Coastal Patrol', lastKnownAt: '1m ago', expectedReturn: '21:00', bloodType: 'AB+', squad: 'D-1' },
    { id: 'RM-005', name: 'Tarek Nabil Sami', nameAr: 'طارق نبيل سامي', rank: 'Private', rankAr: 'جندي', sectorId: 'sector_4', zoneId: 'zone_4a', unit: 'Squad Echo', phone: '+20 100 555 0005', status: 'Active', currentMission: 'Training Drill', lastKnownAt: '15m ago', expectedReturn: '20:00', bloodType: 'O-', squad: 'E-2' },
    { id: 'RM-006', name: 'Hassan Mohamed Ali', nameAr: 'حسن محمد علي', rank: 'Corporal', rankAr: 'عريف', sectorId: 'sector_5', zoneId: 'zone_5a', unit: 'Squad Foxtrot', phone: '+20 100 555 0006', status: 'Returning', currentMission: 'Port Security', lastKnownAt: '3m ago', expectedReturn: '19:00', bloodType: 'A-', squad: 'F-1' },
    { id: 'RM-007', name: 'Sami Ibrahim Adel', nameAr: 'سامي إبراهيم عادل', rank: 'Sergeant', rankAr: 'رقيب', sectorId: 'sector_6', zoneId: 'zone_6a', unit: 'Squad Golf', phone: '+20 100 555 0007', status: 'On Mission', currentMission: 'Border Patrol', lastKnownAt: '30s ago', expectedReturn: '23:00', bloodType: 'B+', squad: 'G-1' },
    { id: 'RM-008', name: 'Mostafa Ayman Hosny', nameAr: 'مصطفى أيمن حسني', rank: 'Major', rankAr: 'رائد', sectorId: 'sector_1', zoneId: 'zone_1a', unit: 'Command', phone: '+20 100 555 0008', status: 'Active', currentMission: 'HQ Briefing', lastKnownAt: '1m ago', expectedReturn: '18:30', bloodType: 'O+', squad: 'HQ' },
    { id: 'RM-009', name: 'Amr Hossam Salah', nameAr: 'عمرو حسام صلاح', rank: 'Corporal', rankAr: 'عريف', sectorId: 'sector_3', zoneId: 'zone_3b', unit: 'Squad Hotel', phone: '+20 100 555 0009', status: 'On Mission', currentMission: 'Marine Recon', lastKnownAt: '45s ago', expectedReturn: '22:30', bloodType: 'A+', squad: 'H-3' },
    { id: 'RM-010', name: 'Mahmoud Reda Fathy', nameAr: 'محمود رضا فتحي', rank: 'Private', rankAr: 'جندي', sectorId: 'sector_7', zoneId: 'zone_7a', unit: 'Squad India', phone: '+20 100 555 0010', status: 'Medical', currentMission: 'Recovery', lastKnownAt: '30m ago', expectedReturn: '——', bloodType: 'AB-', squad: 'I-1' },
    { id: 'RM-011', name: 'Mohamed Adel Rashad', nameAr: 'محمد عادل رشاد', rank: 'Staff Sergeant', rankAr: 'رقيب أول', sectorId: 'sector_1', zoneId: 'zone_1a', unit: 'Special Forces', phone: '+20 100 555 0011', status: 'On Mission', currentMission: 'Classified Op', lastKnownAt: '10s ago', expectedReturn: '——', bloodType: 'O+', squad: 'SF-1' },
    { id: 'RM-012', name: 'Rami Sherif Yehia', nameAr: 'رامي شريف يحيى', rank: 'Lieutenant', rankAr: 'ملازم', sectorId: 'sector_6', zoneId: 'zone_6b', unit: 'Squad Juliet', phone: '+20 100 555 0012', status: 'On Mission', currentMission: 'Border Recon', lastKnownAt: '20s ago', expectedReturn: '00:00', bloodType: 'A+', squad: 'J-1' },
    { id: 'RM-013', name: 'Wael Gamal Eldin', nameAr: 'وائل جمال الدين', rank: 'Captain', rankAr: 'نقيب', sectorId: 'sector_2', zoneId: 'zone_2b', unit: 'Command', phone: '+20 100 555 0013', status: 'Active', currentMission: 'Site Inspection', lastKnownAt: '3m ago', expectedReturn: '19:45', bloodType: 'B+', squad: 'HQ' },
    { id: 'RM-014', name: 'Sherif Tarek Mansour', nameAr: 'شريف طارق منصور', rank: 'Sergeant', rankAr: 'رقيب', sectorId: 'sector_4', zoneId: 'zone_4b', unit: 'Squad Kilo', phone: '+20 100 555 0014', status: 'Returning', currentMission: 'Farm Patrol', lastKnownAt: '2m ago', expectedReturn: '20:15', bloodType: 'O-', squad: 'K-2' },
    { id: 'RM-015', name: 'Bassem Nader Aziz', nameAr: 'باسم نادر عزيز', rank: 'Corporal', rankAr: 'عريف', sectorId: 'sector_5', zoneId: 'zone_5b', unit: 'Squad Lima', phone: '+20 100 555 0015', status: 'On Mission', currentMission: 'Canal Watch', lastKnownAt: '15s ago', expectedReturn: '23:30', bloodType: 'A-', squad: 'L-1' },
    { id: 'RM-016', name: 'Islam Fathy Mahmoud', nameAr: 'إسلام فتحي محمود', rank: 'Private', rankAr: 'جندي', sectorId: 'sector_8', zoneId: 'zone_8a', unit: 'Squad Mike', phone: '+20 100 555 0016', status: 'Active', currentMission: 'Dock Guard', lastKnownAt: '8m ago', expectedReturn: '21:00', bloodType: 'B+', squad: 'M-1' },
    { id: 'RM-017', name: 'Hazem Yasser Galal', nameAr: 'حازم ياسر جلال', rank: 'First Lieutenant', rankAr: 'ملازم أول', sectorId: 'sector_9', zoneId: 'zone_9a', unit: 'Command', phone: '+20 100 555 0017', status: 'On Mission', currentMission: 'Coastal Survey', lastKnownAt: '50s ago', expectedReturn: '22:45', bloodType: 'O+', squad: 'HQ' },
    { id: 'RM-019', name: 'Khaled Said Ramadan', nameAr: 'خالد سعيد رمضان', rank: 'Sergeant', rankAr: 'رقيب', sectorId: 'sector_7', zoneId: 'zone_7b', unit: 'Squad November', phone: '+20 100 555 0019', status: 'Returning', currentMission: 'Village Patrol', lastKnownAt: '4m ago', expectedReturn: '19:15', bloodType: 'A+', squad: 'N-2' },
    { id: 'RM-020', name: 'Nader Hossam Adly', nameAr: 'نادر حسام عدلي', rank: 'Corporal', rankAr: 'عريف', sectorId: 'sector_3', zoneId: 'zone_3a', unit: 'Squad Oscar', phone: '+20 100 555 0020', status: 'Active', currentMission: 'Radar Station', lastKnownAt: '12m ago', expectedReturn: '20:30', bloodType: 'B-', squad: 'O-1' },
    { id: 'RM-021', name: 'Ayman Hatem Sobhy', nameAr: 'أيمن حاتم صبحي', rank: 'Lieutenant', rankAr: 'ملازم', sectorId: 'sector_1', zoneId: 'zone_1a', unit: 'Squad Papa', phone: '+20 100 555 0021', status: 'On Mission', currentMission: 'Logistics Escort', lastKnownAt: '2m ago', expectedReturn: '22:15', bloodType: 'O+', squad: 'P-1' },
    { id: 'RM-022', name: 'Yasser Mahmoud Helmy', nameAr: 'ياسر محمود حلمي', rank: 'Private', rankAr: 'جندي', sectorId: 'sector_6', zoneId: 'zone_6c', unit: 'Squad Quebec', phone: '+20 100 555 0022', status: 'Missing', currentMission: 'Mountain Patrol', lastKnownAt: '6h ago', expectedReturn: '14:00', bloodType: 'A+', squad: 'Q-1' },
    { id: 'RM-023', name: 'Hossam Nabil Ahmed', nameAr: 'حسام نبيل أحمد', rank: 'Captain', rankAr: 'نقيب', sectorId: 'sector_5', zoneId: 'zone_5a', unit: 'Command', phone: '+20 100 555 0023', status: 'Active', currentMission: 'Port Authority', lastKnownAt: '1m ago', expectedReturn: '19:00', bloodType: 'AB+', squad: 'HQ' },
    { id: 'RM-024', name: 'Adel Rizk Younis', nameAr: 'عادل رزق يونس', rank: 'Staff Sergeant', rankAr: 'رقيب أول', sectorId: 'sector_4', zoneId: 'zone_4a', unit: 'Squad Romeo', phone: '+20 100 555 0024', status: 'Returning', currentMission: 'Patrol Route 7', lastKnownAt: '5m ago', expectedReturn: '19:00', bloodType: 'B+', squad: 'R-1' },
    { id: 'RM-025', name: 'Fady Emad Soliman', nameAr: 'فادي عماد سليمان', rank: 'Sergeant', rankAr: 'رقيب', sectorId: 'sector_10', zoneId: 'zone_10b', unit: 'Special Ops', phone: '+20 100 555 0025', status: 'On Mission', currentMission: 'Sniper Overwatch', lastKnownAt: '15s ago', expectedReturn: '——', bloodType: 'O-', squad: 'SO-2' },
    { id: 'RM-026', name: 'Magdy Hamdy Amin', nameAr: 'مجدي حمدي أمين', rank: 'Major', rankAr: 'رائد', sectorId: 'sector_2', zoneId: 'zone_2b', unit: 'Command', phone: '+20 100 555 0026', status: 'Active', currentMission: 'Operations Brief', lastKnownAt: '2m ago', expectedReturn: '20:00', bloodType: 'A+', squad: 'HQ' },
    { id: 'RM-027', name: 'Ashraf Kamal Zaki', nameAr: 'أشرف كمال زكي', rank: 'Warrant Officer', rankAr: 'مساعد', sectorId: 'sector_8', zoneId: 'zone_8b', unit: 'Squad Sierra', phone: '+20 100 555 0027', status: 'On Mission', currentMission: 'Island Recon', lastKnownAt: '40s ago', expectedReturn: '23:00', bloodType: 'B+', squad: 'S-1' },
    { id: 'RM-028', name: 'Reda Fathy Ghanem', nameAr: 'رضا فتحي غانم', rank: 'Corporal', rankAr: 'عريف', sectorId: 'sector_3', zoneId: 'zone_3b', unit: 'Squad Tango', phone: '+20 100 555 0028', status: 'On Mission', currentMission: 'Naval Artillery', lastKnownAt: '1m ago', expectedReturn: '21:30', bloodType: 'O+', squad: 'T-1' },
    { id: 'RM-029', name: 'Sameh Yousry Melek', nameAr: 'سامح يسري ملك', rank: 'First Lieutenant', rankAr: 'ملازم أول', sectorId: 'sector_1', zoneId: 'zone_1b', unit: 'Cyber Unit', phone: '+20 100 555 0029', status: 'Active', currentMission: 'Cyber Ops', lastKnownAt: '20s ago', expectedReturn: '——', bloodType: 'AB-', squad: 'CY-1' },
    { id: 'RM-030', name: 'Essam Zaki Moawad', nameAr: 'عصام زكي معوض', rank: 'Sergeant', rankAr: 'رقيب', sectorId: 'sector_9', zoneId: 'zone_9b', unit: 'Squad Uniform', phone: '+20 100 555 0030', status: 'On Mission', currentMission: 'Desert Recon', lastKnownAt: '25s ago', expectedReturn: '00:30', bloodType: 'O+', squad: 'U-1' },
];

export const REMINDER_OFFICERS: ReminderOfficer[] = [
    { id: 'RO-001', name: 'Ahmed Hassan', nameAr: 'أحمد حسن', rank: 'Colonel', rankAr: 'عقيد', sectorId: 'sector_1', role: 'Sector Commander', phone: '+20 100 700 0001', email: 'ahmed.hassan@mil.eg', online: true, workload: 68, todayActions: 24, yearsOfService: 24 },
    { id: 'RO-002', name: 'Youssef Kamal', nameAr: 'يوسف كمال', rank: 'Colonel', rankAr: 'عقيد', sectorId: 'sector_2', role: 'Sector Commander', phone: '+20 100 700 0002', email: 'youssef.kamal@mil.eg', online: true, workload: 42, todayActions: 18, yearsOfService: 22 },
    { id: 'RO-003', name: 'Karim Adel', nameAr: 'كريم عادل', rank: 'Colonel', rankAr: 'عقيد', sectorId: 'sector_3', role: 'Sector Commander', phone: '+20 100 700 0003', email: 'karim.adel@mil.eg', online: true, workload: 81, todayActions: 32, yearsOfService: 25 },
    { id: 'RO-004', name: 'Tarek Sami', nameAr: 'طارق سامي', rank: 'Colonel', rankAr: 'عقيد', sectorId: 'sector_4', role: 'Sector Commander', phone: '+20 100 700 0004', email: 'tarek.sami@mil.eg', online: true, workload: 35, todayActions: 14, yearsOfService: 21 },
    { id: 'RO-005', name: 'Omar Ibrahim', nameAr: 'عمر إبراهيم', rank: 'Colonel', rankAr: 'عقيد', sectorId: 'sector_5', role: 'Sector Commander', phone: '+20 100 700 0005', email: 'omar.ibrahim@mil.eg', online: true, workload: 94, todayActions: 41, yearsOfService: 23 },
    { id: 'RO-006', name: 'Nabil Mostafa', nameAr: 'نبيل مصطفى', rank: 'Colonel', rankAr: 'عقيد', sectorId: 'sector_6', role: 'Sector Commander', phone: '+20 100 700 0006', email: 'nabil.mostafa@mil.eg', online: true, workload: 100, todayActions: 52, yearsOfService: 26 },
    { id: 'RO-007', name: 'Hany Reda', nameAr: 'هاني رضا', rank: 'Colonel', rankAr: 'عقيد', sectorId: 'sector_7', role: 'Sector Commander', phone: '+20 100 700 0007', email: 'hany.reda@mil.eg', online: true, workload: 51, todayActions: 22, yearsOfService: 22 },
    { id: 'RO-008', name: 'Sami Hosny', nameAr: 'سامي حسني', rank: 'Colonel', rankAr: 'عقيد', sectorId: 'sector_8', role: 'Sector Commander', phone: '+20 100 700 0008', email: 'sami.hosny@mil.eg', online: true, workload: 63, todayActions: 27, yearsOfService: 20 },
    { id: 'RO-009', name: 'Khaled Rashad', nameAr: 'خالد رشاد', rank: 'Colonel', rankAr: 'عقيد', sectorId: 'sector_9', role: 'Sector Commander', phone: '+20 100 700 0009', email: 'khaled.rashad@mil.eg', online: false, workload: 47, todayActions: 19, yearsOfService: 21 },
    { id: 'RO-010', name: 'Mostafa Fahmy', nameAr: 'مصطفى فهمي', rank: 'Lieutenant Colonel', rankAr: 'مقدم', sectorId: 'sector_10', role: 'National Commander', phone: '+20 100 700 0010', email: 'mostafa.fahmy@mil.eg', online: true, workload: 72, todayActions: 29, yearsOfService: 32 },
    { id: 'RO-011', name: 'Wael Gamal', nameAr: 'وائل جمال', rank: 'Captain', rankAr: 'نقيب', sectorId: 'sector_2', role: 'Operations Lead', phone: '+20 100 700 0011', email: 'wael.gamal@mil.eg', online: true, workload: 56, todayActions: 21, yearsOfService: 8 },
    { id: 'RO-012', name: 'Bahaa Adel', nameAr: 'بهاء عادل', rank: 'Major', rankAr: 'رائد', sectorId: 'sector_10', role: 'Special Ops Lead', phone: '+20 100 700 0012', email: 'bahaa.adel@mil.eg', online: true, workload: 88, todayActions: 37, yearsOfService: 14 },
];

export const REMINDERS: Reminder[] = [
    { id: 'R-2001', soldierId: 'RM-003', officerId: 'RO-002', sectorId: 'sector_2', zoneId: 'zone_2a', type: 'emergency', priority: 'critical', status: 'escalated', title: 'Soldier missing after Night Watch', description: 'Omar Samir Hassan failed to report back after night watch shift', location: 'Dokki Center · Grid 4B', coordinates: { lat: 30.0380, lng: 31.2120 }, createdAt: '2024-12-08T04:12:00Z', escalatedAt: '2024-12-08T06:30:00Z', dueAt: '2024-12-08T06:00:00Z', notes: [{ author: 'Col. Youssef Kamal', text: 'Search team deployed', at: '2024-12-08T06:35:00Z' }] },
    { id: 'R-2002', soldierId: 'RM-022', officerId: 'RO-006', sectorId: 'sector_6', zoneId: 'zone_6c', type: 'emergency', priority: 'critical', status: 'escalated', title: 'Mountain patrol overdue', description: 'Yasser Mahmoud Helmy 6 hours overdue from Central Sinai patrol', location: 'Central Sinai · Grid 9C', coordinates: { lat: 30.5000, lng: 33.8000 }, createdAt: '2024-12-08T08:00:00Z', escalatedAt: '2024-12-08T09:15:00Z', dueAt: '2024-12-08T08:30:00Z', notes: [{ author: 'Col. Nabil Mostafa', text: 'Air support requested', at: '2024-12-08T09:20:00Z' }] },
    { id: 'R-2003', soldierId: 'RM-011', officerId: 'RO-001', sectorId: 'sector_1', zoneId: 'zone_1a', type: 'mission_return', priority: 'high', status: 'pending', title: 'Classified op return expected', description: 'Mohamed Adel Rashad expected to return from classified operation', location: 'Nasr City · HQ', coordinates: { lat: 30.0561, lng: 31.3445 }, createdAt: '2024-12-08T14:00:00Z', dueAt: '2024-12-08T18:00:00Z', notes: [] },
    { id: 'R-2004', soldierId: 'RM-018', officerId: 'RO-010', sectorId: 'sector_10', zoneId: 'zone_10a', type: 'mission_return', priority: 'high', status: 'pending', title: 'Special Ops return window', description: 'Mahmoud Samy Ibrahim expected return from classified op', location: 'Central Reserve', coordinates: { lat: 30.0500, lng: 31.3000 }, createdAt: '2024-12-08T13:30:00Z', dueAt: '2024-12-08T17:30:00Z', notes: [] },
    { id: 'R-2005', soldierId: 'RM-007', officerId: 'RO-006', sectorId: 'sector_6', zoneId: 'zone_6a', type: 'location_update', priority: 'normal', status: 'confirmed', title: 'Border patrol location confirmed', description: 'Sami Ibrahim Adel confirmed at border patrol checkpoint', location: 'Arish · Checkpoint 7', coordinates: { lat: 31.1249, lng: 33.7983 }, createdAt: '2024-12-08T12:15:00Z', confirmedAt: '2024-12-08T12:20:00Z', dueAt: '2024-12-08T12:30:00Z', notes: [] },
    { id: 'R-2006', soldierId: 'RM-012', officerId: 'RO-006', sectorId: 'sector_6', zoneId: 'zone_6b', type: 'check_in', priority: 'high', status: 'confirmed', title: 'Hourly check-in completed', description: 'Rami Sherif Yehia completed scheduled check-in', location: 'Border Zone 1', coordinates: { lat: 31.0500, lng: 34.0000 }, createdAt: '2024-12-08T11:00:00Z', confirmedAt: '2024-12-08T11:02:00Z', dueAt: '2024-12-08T11:05:00Z', notes: [] },
    { id: 'R-2007', soldierId: 'RM-015', officerId: 'RO-005', sectorId: 'sector_5', zoneId: 'zone_5b', type: 'location_update', priority: 'normal', status: 'confirmed', title: 'Canal watch position confirmed', description: 'Bassem Nader Aziz confirmed at canal west bank', location: 'Canal West Bank · Post 3', coordinates: { lat: 30.5800, lng: 32.2500 }, createdAt: '2024-12-08T10:30:00Z', confirmedAt: '2024-12-08T10:32:00Z', dueAt: '2024-12-08T10:45:00Z', notes: [] },
    { id: 'R-2008', soldierId: 'RM-025', officerId: 'RO-012', sectorId: 'sector_10', zoneId: 'zone_10b', type: 'check_in', priority: 'high', status: 'confirmed', title: 'Sniper overwatch check-in', description: 'Fady Emad Soliman confirmed overwatch position', location: 'Special Ops HQ', coordinates: { lat: 30.0600, lng: 31.3200 }, createdAt: '2024-12-08T10:00:00Z', confirmedAt: '2024-12-08T10:01:00Z', dueAt: '2024-12-08T10:05:00Z', notes: [] },
    { id: 'R-2009', soldierId: 'RM-027', officerId: 'RO-008', sectorId: 'sector_8', zoneId: 'zone_8b', type: 'location_update', priority: 'normal', status: 'confirmed', title: 'Island recon position', description: 'Ashraf Kamal Zaki confirmed at island recon point', location: 'Red Sea Islands · Point 2', coordinates: { lat: 27.0000, lng: 34.0000 }, createdAt: '2024-12-08T09:45:00Z', confirmedAt: '2024-12-08T09:47:00Z', dueAt: '2024-12-08T10:00:00Z', notes: [] },
    { id: 'R-2010', soldierId: 'RM-030', officerId: 'RO-009', sectorId: 'sector_9', zoneId: 'zone_9b', type: 'check_in', priority: 'high', status: 'overdue', title: 'Desert recon overdue', description: 'Essam Zaki Moawad missed scheduled check-in by 30 minutes', location: 'Western Desert · Grid 5', coordinates: { lat: 30.5000, lng: 27.0000 }, createdAt: '2024-12-08T09:00:00Z', dueAt: '2024-12-08T09:30:00Z', notes: [{ author: 'Col. Khaled Rashad', text: 'Attempting contact', at: '2024-12-08T10:00:00Z' }] },
    { id: 'R-2011', soldierId: 'RM-001', officerId: 'RO-001', sectorId: 'sector_1', zoneId: 'zone_1a', type: 'check_in', priority: 'normal', status: 'confirmed', title: 'Patrol check-in', description: 'Ahmed Mohamed Kamal confirmed at patrol route 14', location: 'Nasr City · Route 14', coordinates: { lat: 30.0561, lng: 31.3445 }, createdAt: '2024-12-08T08:30:00Z', confirmedAt: '2024-12-08T08:31:00Z', dueAt: '2024-12-08T08:35:00Z', notes: [] },
    { id: 'R-2012', soldierId: 'RM-002', officerId: 'RO-001', sectorId: 'sector_1', zoneId: 'zone_1b', type: 'mission_return', priority: 'normal', status: 'confirmed', title: 'Recon Alpha returning', description: 'Youssef Khaled Adel returning from recon mission', location: 'Heliopolis District', coordinates: { lat: 30.0853, lng: 31.3375 }, createdAt: '2024-12-08T08:00:00Z', confirmedAt: '2024-12-08T08:05:00Z', dueAt: '2024-12-08T09:00:00Z', notes: [] },
    { id: 'R-2013', soldierId: 'RM-004', officerId: 'RO-003', sectorId: 'sector_3', zoneId: 'zone_3a', type: 'check_in', priority: 'normal', status: 'confirmed', title: 'Coastal patrol check-in', description: 'Karim Hany Tarek confirmed coastal position', location: 'Sidi Gaber · Post 2', coordinates: { lat: 31.2165, lng: 29.9445 }, createdAt: '2024-12-08T07:45:00Z', confirmedAt: '2024-12-08T07:47:00Z', dueAt: '2024-12-08T08:00:00Z', notes: [] },
    { id: 'R-2014', soldierId: 'RM-009', officerId: 'RO-003', sectorId: 'sector_3', zoneId: 'zone_3b', type: 'location_update', priority: 'high', status: 'confirmed', title: 'Marine recon position confirmed', description: 'Amr Hossam Salah confirmed at Corniche position', location: 'Corniche Zone · Point A', coordinates: { lat: 31.2040, lng: 29.9180 }, createdAt: '2024-12-08T07:15:00Z', confirmedAt: '2024-12-08T07:18:00Z', dueAt: '2024-12-08T07:30:00Z', notes: [] },
    { id: 'R-2015', soldierId: 'RM-006', officerId: 'RO-005', sectorId: 'sector_5', zoneId: 'zone_5a', type: 'mission_return', priority: 'normal', status: 'confirmed', title: 'Port security returning', description: 'Hassan Mohamed Ali returning from port security shift', location: 'Ismailia Port', coordinates: { lat: 30.6043, lng: 32.2638 }, createdAt: '2024-12-08T06:30:00Z', confirmedAt: '2024-12-08T06:35:00Z', dueAt: '2024-12-08T07:30:00Z', notes: [] },
    { id: 'R-2016', soldierId: 'RM-010', officerId: 'RO-007', sectorId: 'sector_7', zoneId: 'zone_7a', type: 'medical', priority: 'high', status: 'confirmed', title: 'Medical recovery monitoring', description: 'Mahmoud Reda Fathy in medical recovery', location: 'Assiut · Medical Bay', coordinates: { lat: 27.1809, lng: 31.1837 }, createdAt: '2024-12-08T06:00:00Z', confirmedAt: '2024-12-08T06:05:00Z', dueAt: '2024-12-08T18:00:00Z', notes: [{ author: 'Medical Officer', text: 'Stable condition', at: '2024-12-08T08:00:00Z' }] },
    { id: 'R-2017', soldierId: 'RM-014', officerId: 'RO-004', sectorId: 'sector_4', zoneId: 'zone_4b', type: 'check_in', priority: 'normal', status: 'confirmed', title: 'Farm patrol check-in', description: 'Sherif Tarek Mansour confirmed at agriculture belt', location: 'Agriculture Belt · Post 5', coordinates: { lat: 30.8200, lng: 31.0500 }, createdAt: '2024-12-08T05:45:00Z', confirmedAt: '2024-12-08T05:47:00Z', dueAt: '2024-12-08T06:00:00Z', notes: [] },
    { id: 'R-2018', soldierId: 'RM-016', officerId: 'RO-008', sectorId: 'sector_8', zoneId: 'zone_8a', type: 'check_in', priority: 'normal', status: 'confirmed', title: 'Dock guard check-in', description: 'Islam Fathy Mahmoud confirmed at Hurghada dock', location: 'Hurghada Port · Dock 3', coordinates: { lat: 27.2579, lng: 33.8116 }, createdAt: '2024-12-08T05:15:00Z', confirmedAt: '2024-12-08T05:17:00Z', dueAt: '2024-12-08T05:30:00Z', notes: [] },
    { id: 'R-2019', soldierId: 'RM-019', officerId: 'RO-007', sectorId: 'sector_7', zoneId: 'zone_7b', type: 'mission_return', priority: 'normal', status: 'confirmed', title: 'Village patrol returning', description: 'Khaled Said Ramadan returning from village patrol', location: 'Upper Egypt Rural', coordinates: { lat: 27.0000, lng: 31.2000 }, createdAt: '2024-12-08T04:30:00Z', confirmedAt: '2024-12-08T04:35:00Z', dueAt: '2024-12-08T05:30:00Z', notes: [] },
    { id: 'R-2020', soldierId: 'RM-024', officerId: 'RO-004', sectorId: 'sector_4', zoneId: 'zone_4a', type: 'mission_return', priority: 'normal', status: 'confirmed', title: 'Patrol route 7 returning', description: 'Adel Rizk Younis returning from patrol', location: 'Tanta Central · HQ', coordinates: { lat: 30.7865, lng: 31.0004 }, createdAt: '2024-12-08T04:00:00Z', confirmedAt: '2024-12-08T04:03:00Z', dueAt: '2024-12-08T05:00:00Z', notes: [] },
    { id: 'R-2021', soldierId: 'RM-021', officerId: 'RO-001', sectorId: 'sector_1', zoneId: 'zone_1a', type: 'location_update', priority: 'normal', status: 'confirmed', title: 'Logistics escort location', description: 'Ayman Hatem Sobhy confirmed with logistics convoy', location: 'Nasr City · Route 3', coordinates: { lat: 30.0561, lng: 31.3445 }, createdAt: '2024-12-08T03:45:00Z', confirmedAt: '2024-12-08T03:47:00Z', dueAt: '2024-12-08T04:00:00Z', notes: [] },
    { id: 'R-2022', soldierId: 'RM-029', officerId: 'RO-001', sectorId: 'sector_1', zoneId: 'zone_1b', type: 'check_in', priority: 'normal', status: 'confirmed', title: 'Cyber ops check-in', description: 'Sameh Yousry Melek confirmed in cyber unit', location: 'Heliopolis · Cyber Unit', coordinates: { lat: 30.0853, lng: 31.3375 }, createdAt: '2024-12-08T03:30:00Z', confirmedAt: '2024-12-08T03:31:00Z', dueAt: '2024-12-08T03:35:00Z', notes: [] },
    { id: 'R-2023', soldierId: 'RM-020', officerId: 'RO-003', sectorId: 'sector_3', zoneId: 'zone_3a', type: 'location_update', priority: 'normal', status: 'confirmed', title: 'Radar station position', description: 'Nader Hossam Adly confirmed at radar station', location: 'Sidi Gaber · Radar Post', coordinates: { lat: 31.2165, lng: 29.9445 }, createdAt: '2024-12-08T03:00:00Z', confirmedAt: '2024-12-08T03:02:00Z', dueAt: '2024-12-08T03:15:00Z', notes: [] },
    { id: 'R-2024', soldierId: 'RM-028', officerId: 'RO-003', sectorId: 'sector_3', zoneId: 'zone_3b', type: 'check_in', priority: 'normal', status: 'confirmed', title: 'Naval artillery check', description: 'Reda Fathy Ghanem confirmed at naval artillery position', location: 'Corniche Zone · Naval Post', coordinates: { lat: 31.2040, lng: 29.9180 }, createdAt: '2024-12-08T02:30:00Z', confirmedAt: '2024-12-08T02:32:00Z', dueAt: '2024-12-08T02:45:00Z', notes: [] },
    { id: 'R-2025', soldierId: 'RM-005', officerId: 'RO-004', sectorId: 'sector_4', zoneId: 'zone_4a', type: 'equipment', priority: 'low', status: 'dismissed', title: 'Equipment check completed', description: 'Tarek Nabil Sami completed training equipment check', location: 'Tanta Central · Armory', coordinates: { lat: 30.7865, lng: 31.0004 }, createdAt: '2024-12-08T02:00:00Z', confirmedAt: '2024-12-08T02:05:00Z', dueAt: '2024-12-08T03:00:00Z', notes: [] },
    { id: 'R-2026', soldierId: 'RM-008', officerId: 'RO-001', sectorId: 'sector_1', zoneId: 'zone_1a', type: 'check_in', priority: 'normal', status: 'confirmed', title: 'HQ briefing check-in', description: 'Mostafa Ayman Hosny confirmed at HQ briefing', location: 'Nasr City · HQ Room 5', coordinates: { lat: 30.0561, lng: 31.3445 }, createdAt: '2024-12-08T01:30:00Z', confirmedAt: '2024-12-08T01:32:00Z', dueAt: '2024-12-08T01:45:00Z', notes: [] },
    { id: 'R-2027', soldierId: 'RM-013', officerId: 'RO-002', sectorId: 'sector_2', zoneId: 'zone_2b', type: 'location_update', priority: 'normal', status: 'confirmed', title: 'Site inspection confirmed', description: 'Wael Gamal Eldin confirmed at pyramids zone inspection', location: 'Pyramids Zone · Site A', coordinates: { lat: 29.9792, lng: 31.1342 }, createdAt: '2024-12-08T01:00:00Z', confirmedAt: '2024-12-08T01:02:00Z', dueAt: '2024-12-08T01:15:00Z', notes: [] },
    { id: 'R-2028', soldierId: 'RM-017', officerId: 'RO-009', sectorId: 'sector_9', zoneId: 'zone_9a', type: 'check_in', priority: 'normal', status: 'confirmed', title: 'Coastal survey check-in', description: 'Hazem Yasser Galal confirmed at coastal survey point', location: 'Marsa Matrouh · Point 4', coordinates: { lat: 31.3543, lng: 27.2373 }, createdAt: '2024-12-08T00:45:00Z', confirmedAt: '2024-12-08T00:47:00Z', dueAt: '2024-12-08T01:00:00Z', notes: [] },
    { id: 'R-2029', soldierId: 'RM-023', officerId: 'RO-005', sectorId: 'sector_5', zoneId: 'zone_5a', type: 'check_in', priority: 'normal', status: 'confirmed', title: 'Port authority check-in', description: 'Hossam Nabil Ahmed confirmed at port authority', location: 'Ismailia Port · Admin', coordinates: { lat: 30.6043, lng: 32.2638 }, createdAt: '2024-12-08T00:15:00Z', confirmedAt: '2024-12-08T00:17:00Z', dueAt: '2024-12-08T00:30:00Z', notes: [] },
    { id: 'R-2030', soldierId: 'RM-026', officerId: 'RO-002', sectorId: 'sector_2', zoneId: 'zone_2b', type: 'check_in', priority: 'normal', status: 'confirmed', title: 'Operations briefing check-in', description: 'Magdy Hamdy Amin confirmed at operations briefing', location: 'Pyramids Zone · HQ', coordinates: { lat: 29.9792, lng: 31.1342 }, createdAt: '2024-12-07T23:45:00Z', confirmedAt: '2024-12-07T23:47:00Z', dueAt: '2024-12-08T00:00:00Z', notes: [] },
];

export const STATUS_BREAKDOWN = [
    { label: 'Confirmed', color: '#34c759', icon: '✅' },
    { label: 'Pending', color: '#ff9500', icon: '⏳' },
    { label: 'Overdue', color: '#ff3b30', icon: '⚠️' },
    { label: 'Escalated', color: '#af52de', icon: '🚨' },
    { label: 'Dismissed', color: '#8e8e93', icon: '🚫' },
];

export const TYPE_LABELS = {
    mission_return: { label: 'Mission Return', icon: '🏠', color: '#007aff' },
    location_update: { label: 'Location Update', icon: '📍', color: '#34c759' },
    check_in: { label: 'Check-in', icon: '✓', color: '#5856d6' },
    emergency: { label: 'Emergency', icon: '🚨', color: '#ff3b30' },
    medical: { label: 'Medical', icon: '⚕️', color: '#af52de' },
    equipment: { label: 'Equipment', icon: '🔧', color: '#8e8e93' },
};

export const PRIORITY_COLORS = {
    low: { bg: 'rgba(142, 142, 147, 0.15)', fg: '#8e8e93' },
    normal: { bg: 'rgba(0, 122, 255, 0.15)', fg: '#007aff' },
    high: { bg: 'rgba(255, 149, 0, 0.15)', fg: '#ff9500' },
    critical: { bg: 'rgba(255, 59, 48, 0.15)', fg: '#ff3b30' },
};

export const SECTOR_LOOKUP: Record<string, { name: string; code: string; color: string; icon: string }> = {
    sector_1: { name: 'Cairo HQ', code: 'SEC-01', color: '#ff3b30', icon: '🏛' },
    sector_2: { name: 'Giza Division', code: 'SEC-02', color: '#ff9500', icon: '🏢' },
    sector_3: { name: 'Alexandria Base', code: 'SEC-03', color: '#007aff', icon: '⚓' },
    sector_4: { name: 'Delta Command', code: 'SEC-04', color: '#34c759', icon: '🌾' },
    sector_5: { name: 'Canal Zone', code: 'SEC-05', color: '#5856d6', icon: '🚢' },
    sector_6: { name: 'Sinai Command', code: 'SEC-06', color: '#af52de', icon: '🏜' },
    sector_7: { name: 'Upper Egypt', code: 'SEC-07', color: '#ffcc00', icon: '🏺' },
    sector_8: { name: 'Red Sea Command', code: 'SEC-08', color: '#00c7be', icon: '🌊' },
    sector_9: { name: 'Matrouh Division', code: 'SEC-09', color: '#ff2d55', icon: '🏖' },
    sector_10: { name: 'Reserve Command', code: 'SEC-10', color: '#8e8e93', icon: '⭐' },
};