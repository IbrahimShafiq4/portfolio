export interface Sector {
    id: string;
    code: string;
    name: string;
    nameAr: string;
    region: string;
    commander: string;
    units: number;
    strength: number;
    readiness: number;
    location: string;
    established: string;
    color: string;
    icon: string;
}

export interface Soldier {
    id: string;
    name: string;
    nameAr: string;
    rank: string;
    rankAr: string;
    rankLevel: number;
    sectorId: string;
    unit: string;
    status: 'Active' | 'Transfer' | 'Leave' | 'Training' | 'Medical' | 'Retired';
    bloodType: string;
    phone: string;
    enlisted: string;
    missions: number;
    medals: number;
    lastCheckIn: string;
    age: number;
    city: string;
    speciality: string;
}

export interface TransferOrder {
    id: string;
    soldierId: string;
    fromSector: string;
    toSector: string;
    fromUnit: string;
    toUnit: string;
    status: 'pending' | 'approved' | 'executed' | 'rejected' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    reason: string;
    createdBy: string;
    approvedBy?: string;
    executedBy?: string;
    createdAt: string;
    approvedAt?: string;
    executedAt?: string;
    effectiveDate: string;
    notes?: string;
}

export interface Officer {
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
    yearsOfService: number;
}

export const SECTORS: Sector[] = [
    { id: 'sector_1', code: 'SEC-01', name: 'Cairo HQ', nameAr: 'القاهرة - القيادة', region: 'Central', commander: 'Col. Ahmed Hassan', units: 12, strength: 842, readiness: 96, location: 'Nasr City', established: '1967', color: '#ff3b30', icon: '🏛' },
    { id: 'sector_2', code: 'SEC-02', name: 'Giza Division', nameAr: 'الجيزة', region: 'Central', commander: 'Col. Youssef Kamal', units: 8, strength: 512, readiness: 92, location: 'Dokki', established: '1971', color: '#ff9500', icon: '🏢' },
    { id: 'sector_3', code: 'SEC-03', name: 'Alexandria Base', nameAr: 'الإسكندرية', region: 'Coastal', commander: 'Col. Karim Adel', units: 10, strength: 687, readiness: 89, location: 'Sidi Gaber', established: '1969', color: '#007aff', icon: '⚓' },
    { id: 'sector_4', code: 'SEC-04', name: 'Delta Command', nameAr: 'الدلتا', region: 'Delta', commander: 'Col. Tarek Sami', units: 7, strength: 421, readiness: 88, location: 'Tanta', established: '1973', color: '#34c759', icon: '🌾' },
    { id: 'sector_5', code: 'SEC-05', name: 'Canal Zone', nameAr: 'القناة', region: 'Canal', commander: 'Col. Omar Ibrahim', units: 9, strength: 593, readiness: 95, location: 'Ismailia', established: '1975', color: '#5856d6', icon: '🚢' },
    { id: 'sector_6', code: 'SEC-06', name: 'Sinai Command', nameAr: 'سيناء', region: 'Eastern', commander: 'Col. Nabil Mostafa', units: 14, strength: 934, readiness: 98, location: 'Arish', established: '1982', color: '#af52de', icon: '🏜' },
    { id: 'sector_7', code: 'SEC-07', name: 'Upper Egypt', nameAr: 'الصعيد', region: 'Southern', commander: 'Col. Hany Reda', units: 11, strength: 728, readiness: 87, location: 'Assiut', established: '1968', color: '#ffcc00', icon: '🏺' },
    { id: 'sector_8', code: 'SEC-08', name: 'Red Sea Command', nameAr: 'البحر الأحمر', region: 'Eastern', commander: 'Col. Sami Hosny', units: 6, strength: 342, readiness: 90, location: 'Hurghada', established: '1987', color: '#00c7be', icon: '🌊' },
    { id: 'sector_9', code: 'SEC-09', name: 'Matrouh Division', nameAr: 'مطروح', region: 'Western', commander: 'Col. Khaled Rashad', units: 5, strength: 287, readiness: 84, location: 'Marsa Matrouh', established: '1979', color: '#ff2d55', icon: '🏖' },
    { id: 'sector_10', code: 'SEC-10', name: 'Reserve Command', nameAr: 'الاحتياطي المركزي', region: 'National', commander: 'Gen. Mostafa Fahmy', units: 18, strength: 1247, readiness: 100, location: 'Classified', established: '1965', color: '#8e8e93', icon: '⭐' },
];

export const RANKS: { name: string; nameAr: string; level: number; }[] = [
    { name: 'Private', nameAr: 'جندي', level: 1 },
    { name: 'Corporal', nameAr: 'عريف', level: 2 },
    { name: 'Sergeant', nameAr: 'رقيب', level: 3 },
    { name: 'Staff Sergeant', nameAr: 'رقيب أول', level: 4 },
    { name: 'Warrant Officer', nameAr: 'مساعد', level: 5 },
    { name: 'Lieutenant', nameAr: 'ملازم', level: 6 },
    { name: 'First Lieutenant', nameAr: 'ملازم أول', level: 7 },
    { name: 'Captain', nameAr: 'نقيب', level: 8 },
    { name: 'Major', nameAr: 'رائد', level: 9 },
    { name: 'Lieutenant Colonel', nameAr: 'مقدم', level: 10 },
    { name: 'Colonel', nameAr: 'عقيد', level: 11 },
];

export const SOLDIERS: Soldier[] = [
    { id: 'M-001', name: 'Ahmed Mohamed Kamal', nameAr: 'أحمد محمد كمال', rank: 'Sergeant', rankAr: 'رقيب', rankLevel: 3, sectorId: 'sector_1', unit: 'Battalion 3', status: 'Active', bloodType: 'O+', phone: '+20 100 111 0001', enlisted: '2022-03', missions: 42, medals: 3, lastCheckIn: '2h ago', age: 26, city: 'Cairo', speciality: 'Infantry' },
    { id: 'M-002', name: 'Youssef Khaled Adel', nameAr: 'يوسف خالد عادل', rank: 'Corporal', rankAr: 'عريف', rankLevel: 2, sectorId: 'sector_1', unit: 'Battalion 5', status: 'Active', bloodType: 'A+', phone: '+20 100 111 0002', enlisted: '2022-09', missions: 38, medals: 2, lastCheckIn: '5h ago', age: 24, city: 'Giza', speciality: 'Communications' },
    { id: 'M-003', name: 'Omar Samir Hassan', nameAr: 'عمر سمير حسن', rank: 'Private', rankAr: 'جندي', rankLevel: 1, sectorId: 'sector_2', unit: 'Battalion 1', status: 'Transfer', bloodType: 'B+', phone: '+20 100 111 0003', enlisted: '2023-01', missions: 24, medals: 1, lastCheckIn: '1d ago', age: 22, city: 'Giza', speciality: 'Logistics' },
    { id: 'M-004', name: 'Karim Hany Tarek', nameAr: 'كريم هاني طارق', rank: 'Sergeant', rankAr: 'رقيب', rankLevel: 3, sectorId: 'sector_3', unit: 'Battalion 7', status: 'Active', bloodType: 'AB+', phone: '+20 100 111 0004', enlisted: '2022-06', missions: 51, medals: 4, lastCheckIn: '3h ago', age: 27, city: 'Alexandria', speciality: 'Armored' },
    { id: 'M-005', name: 'Tarek Nabil Sami', nameAr: 'طارق نبيل سامي', rank: 'Private', rankAr: 'جندي', rankLevel: 1, sectorId: 'sector_4', unit: 'Battalion 2', status: 'Training', bloodType: 'O-', phone: '+20 100 111 0005', enlisted: '2023-04', missions: 12, medals: 0, lastCheckIn: '30m ago', age: 21, city: 'Tanta', speciality: 'Signals' },
    { id: 'M-006', name: 'Hassan Mohamed Ali', nameAr: 'حسن محمد علي', rank: 'Corporal', rankAr: 'عريف', rankLevel: 2, sectorId: 'sector_5', unit: 'Battalion 3', status: 'Leave', bloodType: 'A-', phone: '+20 100 111 0006', enlisted: '2022-11', missions: 33, medals: 2, lastCheckIn: '2d ago', age: 25, city: 'Ismailia', speciality: 'Engineering' },
    { id: 'M-007', name: 'Sami Ibrahim Adel', nameAr: 'سامي إبراهيم عادل', rank: 'Sergeant', rankAr: 'رقيب', rankLevel: 3, sectorId: 'sector_6', unit: 'Battalion 6', status: 'Active', bloodType: 'B+', phone: '+20 100 111 0007', enlisted: '2022-07', missions: 47, medals: 3, lastCheckIn: '1h ago', age: 26, city: 'Arish', speciality: 'Recon' },
    { id: 'M-008', name: 'Mostafa Ayman Hosny', nameAr: 'مصطفى أيمن حسني', rank: 'Major', rankAr: 'رائد', rankLevel: 9, sectorId: 'sector_1', unit: 'Command', status: 'Active', bloodType: 'O+', phone: '+20 100 111 0008', enlisted: '2015-05', missions: 68, medals: 8, lastCheckIn: '15m ago', age: 34, city: 'Cairo', speciality: 'Strategy' },
    { id: 'M-009', name: 'Amr Hossam Salah', nameAr: 'عمرو حسام صلاح', rank: 'Corporal', rankAr: 'عريف', rankLevel: 2, sectorId: 'sector_3', unit: 'Battalion 5', status: 'Active', bloodType: 'A+', phone: '+20 100 111 0009', enlisted: '2022-10', missions: 29, medals: 1, lastCheckIn: '4h ago', age: 25, city: 'Alexandria', speciality: 'Medical' },
    { id: 'M-010', name: 'Mahmoud Reda Fathy', nameAr: 'محمود رضا فتحي', rank: 'Private', rankAr: 'جندي', rankLevel: 1, sectorId: 'sector_7', unit: 'Battalion 1', status: 'Transfer', bloodType: 'AB-', phone: '+20 100 111 0010', enlisted: '2023-02', missions: 18, medals: 0, lastCheckIn: '6h ago', age: 22, city: 'Assiut', speciality: 'Infantry' },
    { id: 'M-011', name: 'Mohamed Adel Rashad', nameAr: 'محمد عادل رشاد', rank: 'Staff Sergeant', rankAr: 'رقيب أول', rankLevel: 4, sectorId: 'sector_1', unit: 'Battalion 4', status: 'Active', bloodType: 'O+', phone: '+20 100 111 0011', enlisted: '2019-08', missions: 87, medals: 6, lastCheckIn: '1h ago', age: 29, city: 'Cairo', speciality: 'Special Forces' },
    { id: 'M-012', name: 'Rami Sherif Yehia', nameAr: 'رامي شريف يحيى', rank: 'Lieutenant', rankAr: 'ملازم', rankLevel: 6, sectorId: 'sector_6', unit: 'Battalion 2', status: 'Active', bloodType: 'A+', phone: '+20 100 111 0012', enlisted: '2020-03', missions: 54, medals: 5, lastCheckIn: '45m ago', age: 28, city: 'Arish', speciality: 'Intel' },
    { id: 'M-013', name: 'Wael Gamal Eldin', nameAr: 'وائل جمال الدين', rank: 'Captain', rankAr: 'نقيب', rankLevel: 8, sectorId: 'sector_2', unit: 'Command', status: 'Active', bloodType: 'B+', phone: '+20 100 111 0013', enlisted: '2017-01', missions: 92, medals: 7, lastCheckIn: '20m ago', age: 32, city: 'Giza', speciality: 'Operations' },
    { id: 'M-014', name: 'Sherif Tarek Mansour', nameAr: 'شريف طارق منصور', rank: 'Sergeant', rankAr: 'رقيب', rankLevel: 3, sectorId: 'sector_4', unit: 'Battalion 3', status: 'Active', bloodType: 'O-', phone: '+20 100 111 0014', enlisted: '2021-06', missions: 45, medals: 3, lastCheckIn: '3h ago', age: 25, city: 'Mansoura', speciality: 'Artillery' },
    { id: 'M-015', name: 'Bassem Nader Aziz', nameAr: 'باسم نادر عزيز', rank: 'Corporal', rankAr: 'عريف', rankLevel: 2, sectorId: 'sector_5', unit: 'Battalion 4', status: 'Active', bloodType: 'A-', phone: '+20 100 111 0015', enlisted: '2022-05', missions: 36, medals: 2, lastCheckIn: '2h ago', age: 24, city: 'Port Said', speciality: 'Navy' },
    { id: 'M-016', name: 'Islam Fathy Mahmoud', nameAr: 'إسلام فتحي محمود', rank: 'Private', rankAr: 'جندي', rankLevel: 1, sectorId: 'sector_8', unit: 'Battalion 1', status: 'Active', bloodType: 'B+', phone: '+20 100 111 0016', enlisted: '2023-05', missions: 8, medals: 0, lastCheckIn: '1h ago', age: 21, city: 'Hurghada', speciality: 'Infantry' },
    { id: 'M-017', name: 'Hazem Yasser Galal', nameAr: 'حازم ياسر جلال', rank: 'First Lieutenant', rankAr: 'ملازم أول', rankLevel: 7, sectorId: 'sector_9', unit: 'Command', status: 'Active', bloodType: 'O+', phone: '+20 100 111 0017', enlisted: '2019-11', missions: 61, medals: 5, lastCheckIn: '10m ago', age: 30, city: 'Matrouh', speciality: 'Desert Warfare' },
    { id: 'M-018', name: 'Mahmoud Samy Ibrahim', nameAr: 'محمود سامي إبراهيم', rank: 'Warrant Officer', rankAr: 'مساعد', rankLevel: 5, sectorId: 'sector_10', unit: 'Special Ops', status: 'Active', bloodType: 'AB+', phone: '+20 100 111 0018', enlisted: '2010-04', missions: 187, medals: 14, lastCheckIn: '5m ago', age: 39, city: 'Cairo', speciality: 'Counter-Terror' },
    { id: 'M-019', name: 'Khaled Said Ramadan', nameAr: 'خالد سعيد رمضان', rank: 'Sergeant', rankAr: 'رقيب', rankLevel: 3, sectorId: 'sector_7', unit: 'Battalion 5', status: 'Active', bloodType: 'A+', phone: '+20 100 111 0019', enlisted: '2021-09', missions: 41, medals: 3, lastCheckIn: '2h ago', age: 25, city: 'Luxor', speciality: 'Tank Crew' },
    { id: 'M-020', name: 'Nader Hossam Adly', nameAr: 'نادر حسام عدلي', rank: 'Corporal', rankAr: 'عريف', rankLevel: 2, sectorId: 'sector_3', unit: 'Battalion 2', status: 'Active', bloodType: 'B-', phone: '+20 100 111 0020', enlisted: '2022-08', missions: 34, medals: 2, lastCheckIn: '3h ago', age: 24, city: 'Alexandria', speciality: 'Radar' },
    { id: 'M-021', name: 'Ayman Hatem Sobhy', nameAr: 'أيمن حاتم صبحي', rank: 'Lieutenant', rankAr: 'ملازم', rankLevel: 6, sectorId: 'sector_1', unit: 'Battalion 8', status: 'Active', bloodType: 'O+', phone: '+20 100 111 0021', enlisted: '2020-07', missions: 47, medals: 4, lastCheckIn: '30m ago', age: 27, city: 'Cairo', speciality: 'Logistics' },
    { id: 'M-022', name: 'Yasser Mahmoud Helmy', nameAr: 'ياسر محمود حلمي', rank: 'Private', rankAr: 'جندي', rankLevel: 1, sectorId: 'sector_6', unit: 'Battalion 5', status: 'Active', bloodType: 'A+', phone: '+20 100 111 0022', enlisted: '2023-06', missions: 6, medals: 0, lastCheckIn: '4h ago', age: 21, city: 'Arish', speciality: 'Infantry' },
    { id: 'M-023', name: 'Hossam Nabil Ahmed', nameAr: 'حسام نبيل أحمد', rank: 'Captain', rankAr: 'نقيب', rankLevel: 8, sectorId: 'sector_5', unit: 'Command', status: 'Active', bloodType: 'AB+', phone: '+20 100 111 0023', enlisted: '2017-10', missions: 89, medals: 7, lastCheckIn: '15m ago', age: 33, city: 'Suez', speciality: 'Engineering' },
    { id: 'M-024', name: 'Adel Rizk Younis', nameAr: 'عادل رزق يونس', rank: 'Staff Sergeant', rankAr: 'رقيب أول', rankLevel: 4, sectorId: 'sector_4', unit: 'Battalion 1', status: 'Active', bloodType: 'B+', phone: '+20 100 111 0024', enlisted: '2018-03', missions: 82, medals: 6, lastCheckIn: '2h ago', age: 30, city: 'Tanta', speciality: 'Communications' },
    { id: 'M-025', name: 'Fady Emad Soliman', nameAr: 'فادي عماد سليمان', rank: 'Sergeant', rankAr: 'رقيب', rankLevel: 3, sectorId: 'sector_10', unit: 'Special Ops', status: 'Active', bloodType: 'O-', phone: '+20 100 111 0025', enlisted: '2020-02', missions: 103, medals: 9, lastCheckIn: '45m ago', age: 27, city: 'Cairo', speciality: 'Sniper' },
    { id: 'M-026', name: 'Magdy Hamdy Amin', nameAr: 'مجدي حمدي أمين', rank: 'Major', rankAr: 'رائد', rankLevel: 9, sectorId: 'sector_2', unit: 'Battalion 3', status: 'Active', bloodType: 'A+', phone: '+20 100 111 0026', enlisted: '2015-09', missions: 74, medals: 8, lastCheckIn: '1h ago', age: 35, city: 'Giza', speciality: 'Intel' },
    { id: 'M-027', name: 'Ashraf Kamal Zaki', nameAr: 'أشرف كمال زكي', rank: 'Warrant Officer', rankAr: 'مساعد', rankLevel: 5, sectorId: 'sector_8', unit: 'Battalion 2', status: 'Active', bloodType: 'B+', phone: '+20 100 111 0027', enlisted: '2012-11', missions: 141, medals: 11, lastCheckIn: '20m ago', age: 37, city: 'Hurghada', speciality: 'Diving' },
    { id: 'M-028', name: 'Reda Fathy Ghanem', nameAr: 'رضا فتحي غانم', rank: 'Corporal', rankAr: 'عريف', rankLevel: 2, sectorId: 'sector_3', unit: 'Battalion 7', status: 'Active', bloodType: 'O+', phone: '+20 100 111 0028', enlisted: '2022-04', missions: 42, medals: 3, lastCheckIn: '2h ago', age: 25, city: 'Alexandria', speciality: 'Naval Artillery' },
    { id: 'M-029', name: 'Sameh Yousry Melek', nameAr: 'سامح يسري ملك', rank: 'First Lieutenant', rankAr: 'ملازم أول', rankLevel: 7, sectorId: 'sector_1', unit: 'Battalion 6', status: 'Active', bloodType: 'AB-', phone: '+20 100 111 0029', enlisted: '2019-03', missions: 63, medals: 5, lastCheckIn: '35m ago', age: 29, city: 'Cairo', speciality: 'Cyber' },
    { id: 'M-030', name: 'Essam Zaki Moawad', nameAr: 'عصام زكي معوض', rank: 'Sergeant', rankAr: 'رقيب', rankLevel: 3, sectorId: 'sector_9', unit: 'Battalion 3', status: 'Active', bloodType: 'O+', phone: '+20 100 111 0030', enlisted: '2021-05', missions: 49, medals: 4, lastCheckIn: '1h ago', age: 26, city: 'Matrouh', speciality: 'Desert Recon' },
    { id: 'M-031', name: 'Amr Ibrahim Shakweer', nameAr: 'عمرو إبراهيم شكوي', rank: 'Private', rankAr: 'جندي', rankLevel: 1, sectorId: 'sector_7', unit: 'Battalion 4', status: 'Training', bloodType: 'A+', phone: '+20 100 111 0031', enlisted: '2023-07', missions: 4, medals: 0, lastCheckIn: '15m ago', age: 21, city: 'Sohag', speciality: 'Basic' },
    { id: 'M-032', name: 'Tamer Wael Hafez', nameAr: 'تامر وائل حافظ', rank: 'Corporal', rankAr: 'عريف', rankLevel: 2, sectorId: 'sector_5', unit: 'Battalion 2', status: 'Active', bloodType: 'B+', phone: '+20 100 111 0032', enlisted: '2022-07', missions: 37, medals: 2, lastCheckIn: '3h ago', age: 24, city: 'Ismailia', speciality: 'Signals' },
    { id: 'M-033', name: 'Ehab Samir Ghoneim', nameAr: 'إيهاب سمير غنيم', rank: 'Lieutenant', rankAr: 'ملازم', rankLevel: 6, sectorId: 'sector_6', unit: 'Battalion 4', status: 'Active', bloodType: 'O-', phone: '+20 100 111 0033', enlisted: '2020-05', missions: 51, medals: 4, lastCheckIn: '25m ago', age: 28, city: 'Arish', speciality: 'Border Patrol' },
    { id: 'M-034', name: 'Alaa Nabil Selim', nameAr: 'علاء نبيل سليم', rank: 'Sergeant', rankAr: 'رقيب', rankLevel: 3, sectorId: 'sector_4', unit: 'Battalion 5', status: 'Active', bloodType: 'A-', phone: '+20 100 111 0034', enlisted: '2021-02', missions: 44, medals: 3, lastCheckIn: '2h ago', age: 25, city: 'Zagazig', speciality: 'Mechanic' },
    { id: 'M-035', name: 'Bahaa Adel Kamel', nameAr: 'بهاء عادل كامل', rank: 'Captain', rankAr: 'نقيب', rankLevel: 8, sectorId: 'sector_10', unit: 'Command', status: 'Active', bloodType: 'O+', phone: '+20 100 111 0035', enlisted: '2016-08', missions: 97, medals: 8, lastCheckIn: '10m ago', age: 32, city: 'Classified', speciality: 'Special Ops' },
    { id: 'M-036', name: 'Nour Eldin Mahmoud', nameAr: 'نور الدين محمود', rank: 'Private', rankAr: 'جندي', rankLevel: 1, sectorId: 'sector_2', unit: 'Battalion 6', status: 'Active', bloodType: 'B+', phone: '+20 100 111 0036', enlisted: '2023-08', missions: 3, medals: 0, lastCheckIn: '1h ago', age: 21, city: 'Fayoum', speciality: 'Basic' },
    { id: 'M-037', name: 'Atef Hosny Barakat', nameAr: 'عاطف حسني بركات', rank: 'Staff Sergeant', rankAr: 'رقيب أول', rankLevel: 4, sectorId: 'sector_3', unit: 'Battalion 4', status: 'Active', bloodType: 'A+', phone: '+20 100 111 0037', enlisted: '2018-11', missions: 79, medals: 6, lastCheckIn: '30m ago', age: 30, city: 'Alexandria', speciality: 'Diving' },
    { id: 'M-038', name: 'Ramy Sherif Fawzy', nameAr: 'رامي شريف فوزي', rank: 'Sergeant', rankAr: 'رقيب', rankLevel: 3, sectorId: 'sector_8', unit: 'Battalion 3', status: 'Active', bloodType: 'AB+', phone: '+20 100 111 0038', enlisted: '2021-03', missions: 45, medals: 3, lastCheckIn: '1h ago', age: 25, city: 'Hurghada', speciality: 'Coastal Defense' },
    { id: 'M-039', name: 'Hany Maher Zaki', nameAr: 'هاني ماهر زكي', rank: 'Corporal', rankAr: 'عريف', rankLevel: 2, sectorId: 'sector_1', unit: 'Battalion 2', status: 'Medical', bloodType: 'O+', phone: '+20 100 111 0039', enlisted: '2022-01', missions: 31, medals: 2, lastCheckIn: '5d ago', age: 24, city: 'Cairo', speciality: 'Infantry' },
    { id: 'M-040', name: 'Walid Nabil Khedr', nameAr: 'وليد نبيل خضر', rank: 'Lieutenant', rankAr: 'ملازم', rankLevel: 6, sectorId: 'sector_9', unit: 'Battalion 1', status: 'Active', bloodType: 'A+', phone: '+20 100 111 0040', enlisted: '2020-09', missions: 48, medals: 4, lastCheckIn: '45m ago', age: 28, city: 'Marsa Matrouh', speciality: 'Recon' },
];

export const TRANSFER_ORDERS: TransferOrder[] = [
    { id: 'A-1029', soldierId: 'M-003', fromSector: 'sector_2', toSector: 'sector_1', fromUnit: 'Battalion 1', toUnit: 'Battalion 7', status: 'pending', priority: 'high', reason: 'Operational need', createdBy: 'Capt. Wael Gamal', approvedBy: undefined, executedBy: undefined, createdAt: '2024-12-08', approvedAt: undefined, executedAt: undefined, effectiveDate: '2024-12-15', notes: 'Priority transfer for HQ support' },
    { id: 'A-1030', soldierId: 'M-010', fromSector: 'sector_7', toSector: 'sector_4', fromUnit: 'Battalion 1', toUnit: 'Battalion 3', status: 'approved', priority: 'normal', reason: 'Skills match', createdBy: 'Lt. Mahmoud Reda', approvedBy: 'Col. Hany Reda', executedBy: undefined, createdAt: '2024-12-07', approvedAt: '2024-12-08', executedAt: undefined, effectiveDate: '2024-12-14', notes: undefined },
    { id: 'A-1031', soldierId: 'M-012', fromSector: 'sector_6', toSector: 'sector_5', fromUnit: 'Battalion 2', toUnit: 'Battalion 4', status: 'executed', priority: 'normal', reason: 'Career progression', createdBy: 'Maj. Mostafa', approvedBy: 'Col. Nabil Mostafa', executedBy: 'Maj. Mostafa', createdAt: '2024-12-05', approvedAt: '2024-12-06', executedAt: '2024-12-07', effectiveDate: '2024-12-10', notes: 'Completed successfully' },
    { id: 'A-1032', soldierId: 'M-014', fromSector: 'sector_4', toSector: 'sector_6', fromUnit: 'Battalion 3', toUnit: 'Battalion 5', status: 'pending', priority: 'urgent', reason: 'Emergency deployment', createdBy: 'Gen. Mostafa Fahmy', approvedBy: undefined, executedBy: undefined, createdAt: '2024-12-08', approvedAt: undefined, executedAt: undefined, effectiveDate: '2024-12-09', notes: 'Critical - requires immediate approval' },
    { id: 'A-1033', soldierId: 'M-016', fromSector: 'sector_8', toSector: 'sector_3', fromUnit: 'Battalion 1', toUnit: 'Battalion 7', status: 'rejected', priority: 'normal', reason: 'Personal request', createdBy: 'Capt. Sami Hosny', approvedBy: 'Col. Karim Adel', executedBy: undefined, createdAt: '2024-12-03', approvedAt: '2024-12-04', executedAt: undefined, effectiveDate: '2024-12-12', notes: 'Rejected - operational needs' },
    { id: 'A-1034', soldierId: 'M-019', fromSector: 'sector_7', toSector: 'sector_1', fromUnit: 'Battalion 5', toUnit: 'Battalion 8', status: 'approved', priority: 'normal', reason: 'Promotion transfer', createdBy: 'Capt. Khaled', approvedBy: 'Gen. Mostafa Fahmy', executedBy: undefined, createdAt: '2024-12-06', approvedAt: '2024-12-07', executedAt: undefined, effectiveDate: '2024-12-13', notes: undefined },
    { id: 'A-1035', soldierId: 'M-020', fromSector: 'sector_3', toSector: 'sector_5', fromUnit: 'Battalion 2', toUnit: 'Battalion 2', status: 'pending', priority: 'high', reason: 'Technical expertise', createdBy: 'Lt. Nader Hossam', approvedBy: undefined, executedBy: undefined, createdAt: '2024-12-08', approvedAt: undefined, executedAt: undefined, effectiveDate: '2024-12-16', notes: 'Radar specialist needed' },
    { id: 'A-1036', soldierId: 'M-022', fromSector: 'sector_6', toSector: 'sector_10', fromUnit: 'Battalion 5', toUnit: 'Special Ops', status: 'executed', priority: 'urgent', reason: 'Special selection', createdBy: 'Gen. Mostafa Fahmy', approvedBy: 'Gen. Mostafa Fahmy', executedBy: 'Maj. Bahaa Adel', createdAt: '2024-12-01', approvedAt: '2024-12-02', executedAt: '2024-12-03', effectiveDate: '2024-12-05', notes: 'Excellent performance' },
    { id: 'A-1037', soldierId: 'M-024', fromSector: 'sector_4', toSector: 'sector_7', fromUnit: 'Battalion 1', toUnit: 'Battalion 4', status: 'approved', priority: 'normal', reason: 'Family reunification', createdBy: 'Sgt. Adel Rizk', approvedBy: 'Col. Tarek Sami', executedBy: undefined, createdAt: '2024-12-04', approvedAt: '2024-12-05', executedAt: undefined, effectiveDate: '2024-12-12', notes: undefined },
    { id: 'A-1038', soldierId: 'M-028', fromSector: 'sector_3', toSector: 'sector_8', fromUnit: 'Battalion 7', toUnit: 'Battalion 3', status: 'pending', priority: 'low', reason: 'Coastal rotation', createdBy: 'Col. Karim Adel', approvedBy: undefined, executedBy: undefined, createdAt: '2024-12-08', approvedAt: undefined, executedAt: undefined, effectiveDate: '2024-12-20', notes: undefined },
    { id: 'A-1039', soldierId: 'M-030', fromSector: 'sector_9', toSector: 'sector_6', fromUnit: 'Battalion 3', toUnit: 'Battalion 4', status: 'cancelled', priority: 'normal', reason: 'Changed plans', createdBy: 'Lt. Hazem Yasser', approvedBy: undefined, executedBy: undefined, createdAt: '2024-12-02', approvedAt: undefined, executedAt: undefined, effectiveDate: '2024-12-11', notes: 'Cancelled by requester' },
    { id: 'A-1040', soldierId: 'M-032', fromSector: 'sector_5', toSector: 'sector_2', fromUnit: 'Battalion 2', toUnit: 'Battalion 6', status: 'approved', priority: 'high', reason: 'HQ requirements', createdBy: 'Capt. Hossam Nabil', approvedBy: 'Col. Youssef Kamal', executedBy: undefined, createdAt: '2024-12-07', approvedAt: '2024-12-08', executedAt: undefined, effectiveDate: '2024-12-14', notes: undefined },
    { id: 'A-1041', soldierId: 'M-033', fromSector: 'sector_6', toSector: 'sector_10', fromUnit: 'Battalion 4', toUnit: 'Command', status: 'pending', priority: 'urgent', reason: 'Command assignment', createdBy: 'Gen. Mostafa Fahmy', approvedBy: undefined, executedBy: undefined, createdAt: '2024-12-08', approvedAt: undefined, executedAt: undefined, effectiveDate: '2024-12-10', notes: 'Strategic importance' },
    { id: 'A-1042', soldierId: 'M-034', fromSector: 'sector_4', toSector: 'sector_3', fromUnit: 'Battalion 5', toUnit: 'Battalion 4', status: 'executed', priority: 'normal', reason: 'Rotation', createdBy: 'Col. Tarek Sami', approvedBy: 'Col. Tarek Sami', executedBy: 'Col. Karim Adel', createdAt: '2024-11-28', approvedAt: '2024-11-29', executedAt: '2024-11-30', effectiveDate: '2024-12-02', notes: undefined },
    { id: 'A-1043', soldierId: 'M-036', fromSector: 'sector_2', toSector: 'sector_7', fromUnit: 'Battalion 6', toUnit: 'Battalion 1', status: 'pending', priority: 'low', reason: 'Training opportunity', createdBy: 'Capt. Magdy Hamdy', approvedBy: undefined, executedBy: undefined, createdAt: '2024-12-08', approvedAt: undefined, executedAt: undefined, effectiveDate: '2024-12-22', notes: undefined },
    { id: 'A-1044', soldierId: 'M-037', fromSector: 'sector_3', toSector: 'sector_9', fromUnit: 'Battalion 4', toUnit: 'Battalion 1', status: 'approved', priority: 'normal', reason: 'Skills development', createdBy: 'Col. Karim Adel', approvedBy: 'Col. Karim Adel', executedBy: undefined, createdAt: '2024-12-05', approvedAt: '2024-12-06', executedAt: undefined, effectiveDate: '2024-12-13', notes: undefined },
    { id: 'A-1045', soldierId: 'M-038', fromSector: 'sector_8', toSector: 'sector_5', fromUnit: 'Battalion 3', toUnit: 'Battalion 4', status: 'pending', priority: 'normal', reason: 'Rotation schedule', createdBy: 'Capt. Sami Hosny', approvedBy: undefined, executedBy: undefined, createdAt: '2024-12-08', approvedAt: undefined, executedAt: undefined, effectiveDate: '2024-12-18', notes: undefined },
    { id: 'A-1046', soldierId: 'M-040', fromSector: 'sector_9', toSector: 'sector_6', fromUnit: 'Battalion 1', toUnit: 'Battalion 2', status: 'approved', priority: 'high', reason: 'Tactical needs', createdBy: 'Col. Khaled Rashad', approvedBy: 'Col. Khaled Rashad', executedBy: undefined, createdAt: '2024-12-06', approvedAt: '2024-12-07', executedAt: undefined, effectiveDate: '2024-12-14', notes: 'Sinai deployment' },
    { id: 'A-1047', soldierId: 'M-011', fromSector: 'sector_1', toSector: 'sector_10', fromUnit: 'Battalion 4', toUnit: 'Special Ops', status: 'executed', priority: 'urgent', reason: 'Elite selection', createdBy: 'Gen. Mostafa Fahmy', approvedBy: 'Gen. Mostafa Fahmy', executedBy: 'Maj. Bahaa Adel', createdAt: '2024-11-25', approvedAt: '2024-11-26', executedAt: '2024-11-27', effectiveDate: '2024-12-01', notes: 'Top performer' },
    { id: 'A-1048', soldierId: 'M-013', fromSector: 'sector_2', toSector: 'sector_10', fromUnit: 'Command', toUnit: 'Command', status: 'approved', priority: 'urgent', reason: 'Strategic transfer', createdBy: 'Gen. Mostafa Fahmy', approvedBy: 'Gen. Mostafa Fahmy', executedBy: undefined, createdAt: '2024-12-07', approvedAt: '2024-12-08', executedAt: undefined, effectiveDate: '2024-12-11', notes: 'Command level reassignment' },
    { id: 'A-1049', soldierId: 'M-017', fromSector: 'sector_9', toSector: 'sector_1', fromUnit: 'Command', toUnit: 'Battalion 3', status: 'pending', priority: 'high', reason: 'HQ rotation', createdBy: 'Gen. Mostafa Fahmy', approvedBy: undefined, executedBy: undefined, createdAt: '2024-12-08', approvedAt: undefined, executedAt: undefined, effectiveDate: '2024-12-17', notes: undefined },
    { id: 'A-1050', soldierId: 'M-021', fromSector: 'sector_1', toSector: 'sector_6', fromUnit: 'Battalion 8', toUnit: 'Battalion 5', status: 'approved', priority: 'normal', reason: 'Field experience', createdBy: 'Lt. Ayman Hatem', approvedBy: 'Gen. Mostafa Fahmy', executedBy: undefined, createdAt: '2024-12-04', approvedAt: '2024-12-05', executedAt: undefined, effectiveDate: '2024-12-12', notes: undefined },
    { id: 'A-1051', soldierId: 'M-025', fromSector: 'sector_10', toSector: 'sector_6', fromUnit: 'Special Ops', toUnit: 'Battalion 2', status: 'executed', priority: 'urgent', reason: 'Mission deployment', createdBy: 'Gen. Mostafa Fahmy', approvedBy: 'Gen. Mostafa Fahmy', executedBy: 'Col. Nabil Mostafa', createdAt: '2024-12-01', approvedAt: '2024-12-02', executedAt: '2024-12-03', effectiveDate: '2024-12-05', notes: 'Classified operation' },
    { id: 'A-1052', soldierId: 'M-027', fromSector: 'sector_8', toSector: 'sector_5', fromUnit: 'Battalion 2', toUnit: 'Battalion 2', status: 'approved', priority: 'normal', reason: 'Maritime ops', createdBy: 'Col. Sami Hosny', approvedBy: 'Col. Sami Hosny', executedBy: undefined, createdAt: '2024-12-06', approvedAt: '2024-12-07', executedAt: undefined, effectiveDate: '2024-12-15', notes: undefined },
    { id: 'A-1053', soldierId: 'M-029', fromSector: 'sector_1', toSector: 'sector_10', fromUnit: 'Battalion 6', toUnit: 'Command', status: 'pending', priority: 'urgent', reason: 'Cyber command', createdBy: 'Gen. Mostafa Fahmy', approvedBy: undefined, executedBy: undefined, createdAt: '2024-12-08', approvedAt: undefined, executedAt: undefined, effectiveDate: '2024-12-11', notes: 'Cyber division transfer' },
    { id: 'A-1054', soldierId: 'M-035', fromSector: 'sector_10', toSector: 'sector_6', fromUnit: 'Command', toUnit: 'Command', status: 'approved', priority: 'urgent', reason: 'Mission assignment', createdBy: 'Gen. Mostafa Fahmy', approvedBy: 'Gen. Mostafa Fahmy', executedBy: undefined, createdAt: '2024-12-07', approvedAt: '2024-12-08', executedAt: undefined, effectiveDate: '2024-12-10', notes: 'Sinai command post' },
    { id: 'A-1055', soldierId: 'M-006', fromSector: 'sector_5', toSector: 'sector_1', fromUnit: 'Battalion 3', toUnit: 'Battalion 4', status: 'pending', priority: 'low', reason: 'Return from leave', createdBy: 'Capt. Hossam Nabil', approvedBy: undefined, executedBy: undefined, createdAt: '2024-12-08', approvedAt: undefined, executedAt: undefined, effectiveDate: '2024-12-25', notes: 'After leave period' },
];

export const OFFICERS: Officer[] = [
    { id: 'O-001', name: 'Ahmed Hassan', nameAr: 'أحمد حسن', rank: 'Colonel', rankAr: 'عقيد', sectorId: 'sector_1', role: 'Sector Commander', phone: '+20 100 200 0001', email: 'ahmed.hassan@mil.eg', online: true, yearsOfService: 24 },
    { id: 'O-002', name: 'Youssef Kamal', nameAr: 'يوسف كمال', rank: 'Colonel', rankAr: 'عقيد', sectorId: 'sector_2', role: 'Sector Commander', phone: '+20 100 200 0002', email: 'youssef.kamal@mil.eg', online: true, yearsOfService: 22 },
    { id: 'O-003', name: 'Karim Adel', nameAr: 'كريم عادل', rank: 'Colonel', rankAr: 'عقيد', sectorId: 'sector_3', role: 'Sector Commander', phone: '+20 100 200 0003', email: 'karim.adel@mil.eg', online: false, yearsOfService: 25 },
    { id: 'O-004', name: 'Tarek Sami', nameAr: 'طارق سامي', rank: 'Colonel', rankAr: 'عقيد', sectorId: 'sector_4', role: 'Sector Commander', phone: '+20 100 200 0004', email: 'tarek.sami@mil.eg', online: true, yearsOfService: 21 },
    { id: 'O-005', name: 'Omar Ibrahim', nameAr: 'عمر إبراهيم', rank: 'Colonel', rankAr: 'عقيد', sectorId: 'sector_5', role: 'Sector Commander', phone: '+20 100 200 0005', email: 'omar.ibrahim@mil.eg', online: true, yearsOfService: 23 },
    { id: 'O-006', name: 'Nabil Mostafa', nameAr: 'نبيل مصطفى', rank: 'Colonel', rankAr: 'عقيد', sectorId: 'sector_6', role: 'Sector Commander', phone: '+20 100 200 0006', email: 'nabil.mostafa@mil.eg', online: true, yearsOfService: 26 },
    { id: 'O-007', name: 'Hany Reda', nameAr: 'هاني رضا', rank: 'Colonel', rankAr: 'عقيد', sectorId: 'sector_7', role: 'Sector Commander', phone: '+20 100 200 0007', email: 'hany.reda@mil.eg', online: false, yearsOfService: 22 },
    { id: 'O-008', name: 'Sami Hosny', nameAr: 'سامي حسني', rank: 'Colonel', rankAr: 'عقيد', sectorId: 'sector_8', role: 'Sector Commander', phone: '+20 100 200 0008', email: 'sami.hosny@mil.eg', online: true, yearsOfService: 20 },
    { id: 'O-009', name: 'Khaled Rashad', nameAr: 'خالد رشاد', rank: 'Colonel', rankAr: 'عقيد', sectorId: 'sector_9', role: 'Sector Commander', phone: '+20 100 200 0009', email: 'khaled.rashad@mil.eg', online: true, yearsOfService: 21 },
    { id: 'O-010', name: 'Mostafa Fahmy', nameAr: 'مصطفى فهمي', rank: 'Lieutenant Colonel', rankAr: 'مقدم', sectorId: 'sector_10', role: 'National Commander', phone: '+20 100 200 0010', email: 'mostafa.fahmy@mil.eg', online: true, yearsOfService: 32 },
    { id: 'O-011', name: 'Wael Gamal', nameAr: 'وائل جمال', rank: 'Captain', rankAr: 'نقيب', sectorId: 'sector_2', role: 'Operations', phone: '+20 100 200 0011', email: 'wael.gamal@mil.eg', online: true, yearsOfService: 8 },
    { id: 'O-012', name: 'Bahaa Adel', nameAr: 'بهاء عادل', rank: 'Major', rankAr: 'رائد', sectorId: 'sector_10', role: 'Special Ops Lead', phone: '+20 100 200 0012', email: 'bahaa.adel@mil.eg', online: true, yearsOfService: 14 },
];