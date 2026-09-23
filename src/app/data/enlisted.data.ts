export interface EnlistedSector {
    id: string;
    code: string;
    name: string;
    nameAr: string;
    region: string;
    commander: string;
    strength: number;
    capacity: number;
    readiness: number;
    color: string;
    icon: string;
    established: string;
}

export interface EnlistedUnit {
    id: string;
    code: string;
    name: string;
    sectorId: string;
    type: 'infantry' | 'armored' | 'artillery' | 'signals' | 'medical' | 'engineering' | 'special' | 'logistics' | 'training';
    commander: string;
    strength: number;
    personnelTarget: number;
}

export interface EnlistedSoldier {
    id: string;
    nationalId: string;
    name: string;
    nameAr: string;
    rank: string;
    rankAr: string;
    rankLevel: number;
    sectorId: string;
    unitId: string;
    squad: string;
    status: 'Active' | 'Training' | 'Transfer' | 'Leave' | 'Medical' | 'Reserve' | 'Retired';
    speciality: string;
    specialityAr: string;
    bloodType: string;
    phone: string;
    emergencyContact: string;
    emergencyPhone: string;
    birthDate: string;
    age: number;
    city: string;
    governorate: string;
    enlistedDate: string;
    yearsOfService: number;
    contractType: 'Regular' | 'Reserve' | 'Volunteer';
    missions: number;
    medals: number;
    fitnessScore: number;
    educationLevel: 'Primary' | 'Secondary' | 'Diploma' | 'Bachelor' | 'Master';
    maritalStatus: 'Single' | 'Married' | 'Divorced';
    childrenCount: number;
    medicalStatus: 'Fit' | 'Temporary Exemption' | 'Permanent Exemption' | 'Under Review';
    trainingStatus: 'Completed' | 'In Progress' | 'Pending' | 'Not Required';
    lastEvaluation: number;
    notes: string[];
}

export interface ImportBatch {
    id: string;
    fileName: string;
    fileSize: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    status: 'completed' | 'processing' | 'failed' | 'pending';
    importedAt: string;
    importedBy: string;
    duration: string;
    errors: { row: number; reason: string; }[];
}

export interface TrainingRecord {
    id: string;
    title: string;
    titleAr: string;
    type: 'basic' | 'advanced' | 'specialization' | 'refresher' | 'weapons' | 'medical';
    startDate: string;
    endDate: string;
    duration: string;
    capacity: number;
    enrolled: number;
    completed: number;
    location: string;
    instructor: string;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

export interface ActivityLogEntry {
    id: string;
    timestamp: string;
    soldierId: string;
    action: 'enlisted' | 'promoted' | 'transferred' | 'trained' | 'medaled' | 'medical' | 'retired' | 'leave';
    description: string;
    by: string;
    icon: string;
    color: string;
}

export const ENLISTED_SECTORS: EnlistedSector[] = [
    { id: 'sector_1', code: 'SEC-01', name: 'Cairo HQ', nameAr: 'القاهرة - القيادة', region: 'Central', commander: 'Col. Ahmed Hassan', strength: 1247, capacity: 1400, readiness: 96, color: '#ff3b30', icon: '🏛', established: '1967' },
    { id: 'sector_2', code: 'SEC-02', name: 'Giza Division', nameAr: 'الجيزة', region: 'Central', commander: 'Col. Youssef Kamal', strength: 842, capacity: 1000, readiness: 92, color: '#ff9500', icon: '🏢', established: '1971' },
    { id: 'sector_3', code: 'SEC-03', name: 'Alexandria Base', nameAr: 'الإسكندرية', region: 'Coastal', commander: 'Col. Karim Adel', strength: 1087, capacity: 1200, readiness: 89, color: '#007aff', icon: '⚓', established: '1969' },
    { id: 'sector_4', code: 'SEC-04', name: 'Delta Command', nameAr: 'الدلتا', region: 'Delta', commander: 'Col. Tarek Sami', strength: 721, capacity: 900, readiness: 88, color: '#34c759', icon: '🌾', established: '1973' },
    { id: 'sector_5', code: 'SEC-05', name: 'Canal Zone', nameAr: 'القناة', region: 'Canal', commander: 'Col. Omar Ibrahim', strength: 893, capacity: 1100, readiness: 95, color: '#5856d6', icon: '🚢', established: '1975' },
    { id: 'sector_6', code: 'SEC-06', name: 'Sinai Command', nameAr: 'سيناء', region: 'Eastern', commander: 'Col. Nabil Mostafa', strength: 1334, capacity: 1400, readiness: 98, color: '#af52de', icon: '🏜', established: '1982' },
    { id: 'sector_7', code: 'SEC-07', name: 'Upper Egypt', nameAr: 'الصعيد', region: 'Southern', commander: 'Col. Hany Reda', strength: 1028, capacity: 1200, readiness: 87, color: '#ffcc00', icon: '🏺', established: '1968' },
    { id: 'sector_8', code: 'SEC-08', name: 'Red Sea Command', nameAr: 'البحر الأحمر', region: 'Eastern', commander: 'Col. Sami Hosny', strength: 542, capacity: 700, readiness: 90, color: '#00c7be', icon: '🌊', established: '1987' },
    { id: 'sector_9', code: 'SEC-09', name: 'Matrouh Division', nameAr: 'مطروح', region: 'Western', commander: 'Col. Khaled Rashad', strength: 487, capacity: 700, readiness: 84, color: '#ff2d55', icon: '🏖', established: '1979' },
    { id: 'sector_10', code: 'SEC-10', name: 'Reserve Command', nameAr: 'الاحتياطي المركزي', region: 'National', commander: 'Gen. Mostafa Fahmy', strength: 1947, capacity: 2200, readiness: 100, color: '#8e8e93', icon: '⭐', established: '1965' },
];

export const ENLISTED_UNITS: EnlistedUnit[] = [
    { id: 'unit_1_1', code: 'B-101', name: 'Battalion 1', sectorId: 'sector_1', type: 'infantry', commander: 'Maj. Hassan Ali', strength: 180, personnelTarget: 200 },
    { id: 'unit_1_2', code: 'B-102', name: 'Battalion 2', sectorId: 'sector_1', type: 'infantry', commander: 'Maj. Tarek Mostafa', strength: 165, personnelTarget: 200 },
    { id: 'unit_1_3', code: 'B-103', name: 'Battalion 3', sectorId: 'sector_1', type: 'special', commander: 'Maj. Omar Khaled', strength: 142, personnelTarget: 150 },
    { id: 'unit_1_4', code: 'B-104', name: 'Battalion 4', sectorId: 'sector_1', type: 'logistics', commander: 'Maj. Sherif Gamal', strength: 178, personnelTarget: 180 },
    { id: 'unit_1_5', code: 'B-105', name: 'Battalion 5', sectorId: 'sector_1', type: 'signals', commander: 'Capt. Amr Fathy', strength: 124, personnelTarget: 150 },
    { id: 'unit_1_6', code: 'B-106', name: 'Battalion 6', sectorId: 'sector_1', type: 'medical', commander: 'Maj. Ayman Samir', strength: 98, personnelTarget: 120 },
    { id: 'unit_1_7', code: 'B-107', name: 'Battalion 7', sectorId: 'sector_1', type: 'armored', commander: 'Maj. Nabil Hossam', strength: 187, personnelTarget: 200 },
    { id: 'unit_1_8', code: 'B-108', name: 'Battalion 8', sectorId: 'sector_1', type: 'artillery', commander: 'Capt. Rami Yehia', strength: 173, personnelTarget: 200 },
    { id: 'unit_2_1', code: 'B-201', name: 'Battalion 1', sectorId: 'sector_2', type: 'infantry', commander: 'Maj. Hany Rashad', strength: 195, personnelTarget: 200 },
    { id: 'unit_2_2', code: 'B-202', name: 'Battalion 2', sectorId: 'sector_2', type: 'engineering', commander: 'Capt. Tarek Reda', strength: 142, personnelTarget: 180 },
    { id: 'unit_2_3', code: 'B-203', name: 'Battalion 3', sectorId: 'sector_2', type: 'logistics', commander: 'Maj. Ashraf Kamal', strength: 167, personnelTarget: 180 },
    { id: 'unit_2_4', code: 'B-204', name: 'Battalion 4', sectorId: 'sector_2', type: 'signals', commander: 'Capt. Bahaa Adel', strength: 138, personnelTarget: 150 },
    { id: 'unit_3_1', code: 'B-301', name: 'Battalion 1', sectorId: 'sector_3', type: 'infantry', commander: 'Maj. Sameh Yousry', strength: 198, personnelTarget: 200 },
    { id: 'unit_3_2', code: 'B-302', name: 'Battalion 2', sectorId: 'sector_3', type: 'armored', commander: 'Maj. Reda Fathy', strength: 178, personnelTarget: 200 },
    { id: 'unit_3_3', code: 'B-303', name: 'Battalion 3', sectorId: 'sector_3', type: 'special', commander: 'Maj. Essam Zaki', strength: 142, personnelTarget: 150 },
    { id: 'unit_3_4', code: 'B-304', name: 'Battalion 4', sectorId: 'sector_3', type: 'medical', commander: 'Capt. Nader Adly', strength: 118, personnelTarget: 120 },
    { id: 'unit_3_5', code: 'B-305', name: 'Battalion 5', sectorId: 'sector_3', type: 'artillery', commander: 'Maj. Atef Hosny', strength: 182, personnelTarget: 200 },
    { id: 'unit_6_1', code: 'B-601', name: 'Battalion 1', sectorId: 'sector_6', type: 'special', commander: 'Maj. Magdy Hamdy', strength: 148, personnelTarget: 150 },
    { id: 'unit_6_2', code: 'B-602', name: 'Battalion 2', sectorId: 'sector_6', type: 'infantry', commander: 'Maj. Ehab Samir', strength: 192, personnelTarget: 200 },
    { id: 'unit_6_3', code: 'B-603', name: 'Battalion 3', sectorId: 'sector_6', type: 'armored', commander: 'Capt. Alaa Nabil', strength: 178, personnelTarget: 200 },
    { id: 'unit_6_4', code: 'B-604', name: 'Battalion 4', sectorId: 'sector_6', type: 'signals', commander: 'Capt. Bahaa Kamel', strength: 142, personnelTarget: 150 },
    { id: 'unit_6_5', code: 'B-605', name: 'Battalion 5', sectorId: 'sector_6', type: 'medical', commander: 'Maj. Adel Rizk', strength: 108, personnelTarget: 120 },
    { id: 'unit_10_1', code: 'B-1001', name: 'Special Ops', sectorId: 'sector_10', type: 'special', commander: 'Maj. Bahaa Adel', strength: 187, personnelTarget: 200 },
    { id: 'unit_10_2', code: 'B-1002', name: 'Command', sectorId: 'sector_10', type: 'special', commander: 'Lt.Col. Mostafa Fahmy', strength: 145, personnelTarget: 150 },
];

export const ENLISTED_SOLDIERS: EnlistedSoldier[] = [
    { id: 'M-001', nationalId: '29805121100001', name: 'Ahmed Mohamed Kamal', nameAr: 'أحمد محمد كمال', rank: 'Sergeant', rankAr: 'رقيب', rankLevel: 3, sectorId: 'sector_1', unitId: 'unit_1_1', squad: 'Squad A-1', status: 'Active', speciality: 'Infantry', specialityAr: 'مشاة', bloodType: 'O+', phone: '+20 100 555 0001', emergencyContact: 'Mohamed Kamal', emergencyPhone: '+20 111 222 0001', birthDate: '1998-05-12', age: 26, city: 'Cairo', governorate: 'Cairo', enlistedDate: '2022-03-15', yearsOfService: 2, contractType: 'Regular', missions: 42, medals: 3, fitnessScore: 92, educationLevel: 'Secondary', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 87, notes: [] },
    { id: 'M-002', nationalId: '29808221100002', name: 'Youssef Khaled Adel', nameAr: 'يوسف خالد عادل', rank: 'Corporal', rankAr: 'عريف', rankLevel: 2, sectorId: 'sector_1', unitId: 'unit_1_2', squad: 'Squad B-2', status: 'Active', speciality: 'Communications', specialityAr: 'اتصالات', bloodType: 'A+', phone: '+20 100 555 0002', emergencyContact: 'Khaled Adel', emergencyPhone: '+20 111 222 0002', birthDate: '1998-08-22', age: 26, city: 'Giza', governorate: 'Giza', enlistedDate: '2022-09-10', yearsOfService: 2, contractType: 'Regular', missions: 38, medals: 2, fitnessScore: 89, educationLevel: 'Diploma', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 84, notes: [] },
    { id: 'M-003', nationalId: '29911101100003', name: 'Omar Samir Hassan', nameAr: 'عمر سمير حسن', rank: 'Private', rankAr: 'جندي', rankLevel: 1, sectorId: 'sector_2', unitId: 'unit_2_1', squad: 'Squad C-3', status: 'Transfer', speciality: 'Logistics', specialityAr: 'إمداد', bloodType: 'B+', phone: '+20 100 555 0003', emergencyContact: 'Samir Hassan', emergencyPhone: '+20 111 222 0003', birthDate: '1999-11-10', age: 25, city: 'Giza', governorate: 'Giza', enlistedDate: '2023-01-05', yearsOfService: 1, contractType: 'Regular', missions: 24, medals: 1, fitnessScore: 85, educationLevel: 'Secondary', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 78, notes: ['Transferring to Sector 6'] },
    { id: 'M-004', nationalId: '29706201100004', name: 'Karim Hany Tarek', nameAr: 'كريم هاني طارق', rank: 'Sergeant', rankAr: 'رقيب', rankLevel: 3, sectorId: 'sector_3', unitId: 'unit_3_1', squad: 'Squad D-1', status: 'Active', speciality: 'Armored', specialityAr: 'مدرعات', bloodType: 'AB+', phone: '+20 100 555 0004', emergencyContact: 'Hany Tarek', emergencyPhone: '+20 111 222 0004', birthDate: '1997-06-20', age: 27, city: 'Alexandria', governorate: 'Alexandria', enlistedDate: '2022-06-20', yearsOfService: 2, contractType: 'Regular', missions: 51, medals: 4, fitnessScore: 94, educationLevel: 'Bachelor', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 91, notes: [] },
    { id: 'M-005', nationalId: '30004211100005', name: 'Tarek Nabil Sami', nameAr: 'طارق نبيل سامي', rank: 'Private', rankAr: 'جندي', rankLevel: 1, sectorId: 'sector_4', unitId: 'unit_2_2', squad: 'Squad E-2', status: 'Training', speciality: 'Signals', specialityAr: 'إشارة', bloodType: 'O-', phone: '+20 100 555 0005', emergencyContact: 'Nabil Sami', emergencyPhone: '+20 111 222 0005', birthDate: '2000-04-21', age: 24, city: 'Tanta', governorate: 'Gharbia', enlistedDate: '2023-04-12', yearsOfService: 1, contractType: 'Regular', missions: 12, medals: 0, fitnessScore: 88, educationLevel: 'Diploma', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'In Progress', lastEvaluation: 82, notes: ['Currently in signals specialization'] },
    { id: 'M-006', nationalId: '29812011100006', name: 'Hassan Mohamed Ali', nameAr: 'حسن محمد علي', rank: 'Corporal', rankAr: 'عريف', rankLevel: 2, sectorId: 'sector_5', unitId: 'unit_3_2', squad: 'Squad F-1', status: 'Leave', speciality: 'Engineering', specialityAr: 'هندسة', bloodType: 'A-', phone: '+20 100 555 0006', emergencyContact: 'Mohamed Ali', emergencyPhone: '+20 111 222 0006', birthDate: '1998-12-01', age: 26, city: 'Ismailia', governorate: 'Ismailia', enlistedDate: '2022-11-08', yearsOfService: 2, contractType: 'Regular', missions: 33, medals: 2, fitnessScore: 86, educationLevel: 'Diploma', maritalStatus: 'Married', childrenCount: 1, medicalStatus: 'Temporary Exemption', trainingStatus: 'Completed', lastEvaluation: 79, notes: ['On approved leave until 2024-12-20'] },
    { id: 'M-007', nationalId: '29707071100007', name: 'Sami Ibrahim Adel', nameAr: 'سامي إبراهيم عادل', rank: 'Sergeant', rankAr: 'رقيب', rankLevel: 3, sectorId: 'sector_6', unitId: 'unit_6_2', squad: 'Squad G-1', status: 'Active', speciality: 'Recon', specialityAr: 'استطلاع', bloodType: 'B+', phone: '+20 100 555 0007', emergencyContact: 'Ibrahim Adel', emergencyPhone: '+20 111 222 0007', birthDate: '1997-07-07', age: 27, city: 'Arish', governorate: 'North Sinai', enlistedDate: '2022-07-20', yearsOfService: 2, contractType: 'Regular', missions: 47, medals: 3, fitnessScore: 95, educationLevel: 'Secondary', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 93, notes: [] },
    { id: 'M-008', nationalId: '29005051100008', name: 'Mostafa Ayman Hosny', nameAr: 'مصطفى أيمن حسني', rank: 'Major', rankAr: 'رائد', rankLevel: 9, sectorId: 'sector_1', unitId: 'unit_1_3', squad: 'Command', status: 'Active', speciality: 'Strategy', specialityAr: 'استراتيجيا', bloodType: 'O+', phone: '+20 100 555 0008', emergencyContact: 'Ayman Hosny', emergencyPhone: '+20 111 222 0008', birthDate: '1990-05-05', age: 34, city: 'Cairo', governorate: 'Cairo', enlistedDate: '2015-05-05', yearsOfService: 9, contractType: 'Regular', missions: 68, medals: 8, fitnessScore: 88, educationLevel: 'Master', maritalStatus: 'Married', childrenCount: 2, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 96, notes: ['Sector 1 deputy commander'] },
    { id: 'M-009', nationalId: '29910071100009', name: 'Amr Hossam Salah', nameAr: 'عمرو حسام صلاح', rank: 'Corporal', rankAr: 'عريف', rankLevel: 2, sectorId: 'sector_3', unitId: 'unit_3_4', squad: 'Squad H-3', status: 'Active', speciality: 'Medical', specialityAr: 'طبي', bloodType: 'A+', phone: '+20 100 555 0009', emergencyContact: 'Hossam Salah', emergencyPhone: '+20 111 222 0009', birthDate: '1999-10-07', age: 25, city: 'Alexandria', governorate: 'Alexandria', enlistedDate: '2022-10-15', yearsOfService: 2, contractType: 'Regular', missions: 29, medals: 1, fitnessScore: 87, educationLevel: 'Bachelor', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 85, notes: [] },
    { id: 'M-010', nationalId: '30002111100010', name: 'Mahmoud Reda Fathy', nameAr: 'محمود رضا فتحي', rank: 'Private', rankAr: 'جندي', rankLevel: 1, sectorId: 'sector_7', unitId: 'unit_2_1', squad: 'Squad I-1', status: 'Transfer', speciality: 'Infantry', specialityAr: 'مشاة', bloodType: 'AB-', phone: '+20 100 555 0010', emergencyContact: 'Reda Fathy', emergencyPhone: '+20 111 222 0010', birthDate: '2000-02-11', age: 24, city: 'Assiut', governorate: 'Assiut', enlistedDate: '2023-02-20', yearsOfService: 1, contractType: 'Regular', missions: 18, medals: 0, fitnessScore: 84, educationLevel: 'Secondary', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 76, notes: ['Transferring to Delta Command'] },
    { id: 'M-011', nationalId: '29508081100011', name: 'Mohamed Adel Rashad', nameAr: 'محمد عادل رشاد', rank: 'Staff Sergeant', rankAr: 'رقيب أول', rankLevel: 4, sectorId: 'sector_1', unitId: 'unit_1_3', squad: 'SF-1', status: 'Active', speciality: 'Special Forces', specialityAr: 'قوات خاصة', bloodType: 'O+', phone: '+20 100 555 0011', emergencyContact: 'Adel Rashad', emergencyPhone: '+20 111 222 0011', birthDate: '1995-08-08', age: 29, city: 'Cairo', governorate: 'Cairo', enlistedDate: '2019-08-15', yearsOfService: 5, contractType: 'Regular', missions: 87, medals: 6, fitnessScore: 97, educationLevel: 'Diploma', maritalStatus: 'Married', childrenCount: 1, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 95, notes: ['Top tier special forces'] },
    { id: 'M-012', nationalId: '29603121100012', name: 'Rami Sherif Yehia', nameAr: 'رامي شريف يحيى', rank: 'Lieutenant', rankAr: 'ملازم', rankLevel: 6, sectorId: 'sector_6', unitId: 'unit_6_1', squad: 'J-1', status: 'Active', speciality: 'Intel', specialityAr: 'استخبارات', bloodType: 'A+', phone: '+20 100 555 0012', emergencyContact: 'Sherif Yehia', emergencyPhone: '+20 111 222 0012', birthDate: '1996-03-12', age: 28, city: 'Arish', governorate: 'North Sinai', enlistedDate: '2020-03-12', yearsOfService: 4, contractType: 'Regular', missions: 54, medals: 5, fitnessScore: 91, educationLevel: 'Bachelor', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 92, notes: [] },
    { id: 'M-013', nationalId: '29201011100013', name: 'Wael Gamal Eldin', nameAr: 'وائل جمال الدين', rank: 'Captain', rankAr: 'نقيب', rankLevel: 8, sectorId: 'sector_2', unitId: 'unit_2_1', squad: 'Command', status: 'Active', speciality: 'Operations', specialityAr: 'عمليات', bloodType: 'B+', phone: '+20 100 555 0013', emergencyContact: 'Gamal Eldin', emergencyPhone: '+20 111 222 0013', birthDate: '1992-01-01', age: 32, city: 'Giza', governorate: 'Giza', enlistedDate: '2017-01-10', yearsOfService: 7, contractType: 'Regular', missions: 92, medals: 7, fitnessScore: 89, educationLevel: 'Bachelor', maritalStatus: 'Married', childrenCount: 2, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 94, notes: [] },
    { id: 'M-014', nationalId: '29906061100014', name: 'Sherif Tarek Mansour', nameAr: 'شريف طارق منصور', rank: 'Sergeant', rankAr: 'رقيب', rankLevel: 3, sectorId: 'sector_4', unitId: 'unit_2_2', squad: 'K-2', status: 'Active', speciality: 'Artillery', specialityAr: 'مدفعية', bloodType: 'O-', phone: '+20 100 555 0014', emergencyContact: 'Tarek Mansour', emergencyPhone: '+20 111 222 0014', birthDate: '1999-06-06', age: 25, city: 'Mansoura', governorate: 'Dakahlia', enlistedDate: '2021-06-15', yearsOfService: 3, contractType: 'Regular', missions: 45, medals: 3, fitnessScore: 90, educationLevel: 'Secondary', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 88, notes: [] },
    { id: 'M-015', nationalId: '29805051100015', name: 'Bassem Nader Aziz', nameAr: 'باسم نادر عزيز', rank: 'Corporal', rankAr: 'عريف', rankLevel: 2, sectorId: 'sector_5', unitId: 'unit_3_3', squad: 'L-1', status: 'Active', speciality: 'Navy', specialityAr: 'بحري', bloodType: 'A-', phone: '+20 100 555 0015', emergencyContact: 'Nader Aziz', emergencyPhone: '+20 111 222 0015', birthDate: '1998-05-05', age: 26, city: 'Port Said', governorate: 'Port Said', enlistedDate: '2022-05-10', yearsOfService: 2, contractType: 'Regular', missions: 36, medals: 2, fitnessScore: 93, educationLevel: 'Diploma', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 86, notes: [] },
    { id: 'M-016', nationalId: '30005051100016', name: 'Islam Fathy Mahmoud', nameAr: 'إسلام فتحي محمود', rank: 'Private', rankAr: 'جندي', rankLevel: 1, sectorId: 'sector_8', unitId: 'unit_1_1', squad: 'M-1', status: 'Active', speciality: 'Infantry', specialityAr: 'مشاة', bloodType: 'B+', phone: '+20 100 555 0016', emergencyContact: 'Fathy Mahmoud', emergencyPhone: '+20 111 222 0016', birthDate: '2000-05-05', age: 24, city: 'Hurghada', governorate: 'Red Sea', enlistedDate: '2023-05-05', yearsOfService: 1, contractType: 'Regular', missions: 8, medals: 0, fitnessScore: 82, educationLevel: 'Secondary', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 74, notes: [] },
    { id: 'M-017', nationalId: '29411091100017', name: 'Hazem Yasser Galal', nameAr: 'حازم ياسر جلال', rank: 'First Lieutenant', rankAr: 'ملازم أول', rankLevel: 7, sectorId: 'sector_9', unitId: 'unit_3_5', squad: 'Command', status: 'Active', speciality: 'Desert Warfare', specialityAr: 'حرب صحراء', bloodType: 'O+', phone: '+20 100 555 0017', emergencyContact: 'Yasser Galal', emergencyPhone: '+20 111 222 0017', birthDate: '1994-11-09', age: 30, city: 'Marsa Matrouh', governorate: 'Matrouh', enlistedDate: '2019-11-15', yearsOfService: 5, contractType: 'Regular', missions: 61, medals: 5, fitnessScore: 94, educationLevel: 'Bachelor', maritalStatus: 'Married', childrenCount: 1, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 90, notes: [] },
    { id: 'M-018', nationalId: '28504041100018', name: 'Mahmoud Samy Ibrahim', nameAr: 'محمود سامي إبراهيم', rank: 'Warrant Officer', rankAr: 'مساعد', rankLevel: 5, sectorId: 'sector_10', unitId: 'unit_10_1', squad: 'SO-1', status: 'Active', speciality: 'Counter-Terror', specialityAr: 'مكافحة إرهاب', bloodType: 'AB+', phone: '+20 100 555 0018', emergencyContact: 'Samy Ibrahim', emergencyPhone: '+20 111 222 0018', birthDate: '1985-04-04', age: 39, city: 'Cairo', governorate: 'Cairo', enlistedDate: '2010-04-10', yearsOfService: 14, contractType: 'Regular', missions: 187, medals: 14, fitnessScore: 96, educationLevel: 'Bachelor', maritalStatus: 'Married', childrenCount: 3, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 98, notes: ['Counter-terrorism specialist'] },
    { id: 'M-019', nationalId: '29809091100019', name: 'Khaled Said Ramadan', nameAr: 'خالد سعيد رمضان', rank: 'Sergeant', rankAr: 'رقيب', rankLevel: 3, sectorId: 'sector_7', unitId: 'unit_1_7', squad: 'N-2', status: 'Active', speciality: 'Tank Crew', specialityAr: 'طقم دبابة', bloodType: 'A+', phone: '+20 100 555 0019', emergencyContact: 'Said Ramadan', emergencyPhone: '+20 111 222 0019', birthDate: '1998-09-09', age: 26, city: 'Luxor', governorate: 'Luxor', enlistedDate: '2021-09-10', yearsOfService: 3, contractType: 'Regular', missions: 41, medals: 3, fitnessScore: 89, educationLevel: 'Diploma', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 87, notes: [] },
    { id: 'M-020', nationalId: '29808081100020', name: 'Nader Hossam Adly', nameAr: 'نادر حسام عدلي', rank: 'Corporal', rankAr: 'عريف', rankLevel: 2, sectorId: 'sector_3', unitId: 'unit_3_2', squad: 'O-1', status: 'Active', speciality: 'Radar', specialityAr: 'رادار', bloodType: 'B-', phone: '+20 100 555 0020', emergencyContact: 'Hossam Adly', emergencyPhone: '+20 111 222 0020', birthDate: '1998-08-08', age: 26, city: 'Alexandria', governorate: 'Alexandria', enlistedDate: '2022-08-15', yearsOfService: 2, contractType: 'Regular', missions: 34, medals: 2, fitnessScore: 91, educationLevel: 'Diploma', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 84, notes: [] },
    { id: 'M-021', nationalId: '29607071100021', name: 'Ayman Hatem Sobhy', nameAr: 'أيمن حاتم صبحي', rank: 'Lieutenant', rankAr: 'ملازم', rankLevel: 6, sectorId: 'sector_1', unitId: 'unit_1_8', squad: 'P-1', status: 'Active', speciality: 'Logistics', specialityAr: 'إمداد', bloodType: 'O+', phone: '+20 100 555 0021', emergencyContact: 'Hatem Sobhy', emergencyPhone: '+20 111 222 0021', birthDate: '1996-07-07', age: 28, city: 'Cairo', governorate: 'Cairo', enlistedDate: '2020-07-15', yearsOfService: 4, contractType: 'Regular', missions: 47, medals: 4, fitnessScore: 88, educationLevel: 'Bachelor', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 89, notes: [] },
    { id: 'M-022', nationalId: '30006061100022', name: 'Yasser Mahmoud Helmy', nameAr: 'ياسر محمود حلمي', rank: 'Private', rankAr: 'جندي', rankLevel: 1, sectorId: 'sector_6', unitId: 'unit_6_2', squad: 'Q-1', status: 'Active', speciality: 'Infantry', specialityAr: 'مشاة', bloodType: 'A+', phone: '+20 100 555 0022', emergencyContact: 'Mahmoud Helmy', emergencyPhone: '+20 111 222 0022', birthDate: '2000-06-06', age: 24, city: 'Arish', governorate: 'North Sinai', enlistedDate: '2023-06-10', yearsOfService: 1, contractType: 'Regular', missions: 6, medals: 0, fitnessScore: 86, educationLevel: 'Secondary', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 73, notes: [] },
    { id: 'M-023', nationalId: '29110011100023', name: 'Hossam Nabil Ahmed', nameAr: 'حسام نبيل أحمد', rank: 'Captain', rankAr: 'نقيب', rankLevel: 8, sectorId: 'sector_5', unitId: 'unit_3_3', squad: 'Command', status: 'Active', speciality: 'Engineering', specialityAr: 'هندسة', bloodType: 'AB+', phone: '+20 100 555 0023', emergencyContact: 'Nabil Ahmed', emergencyPhone: '+20 111 222 0023', birthDate: '1991-10-01', age: 33, city: 'Suez', governorate: 'Suez', enlistedDate: '2017-10-15', yearsOfService: 7, contractType: 'Regular', missions: 89, medals: 7, fitnessScore: 90, educationLevel: 'Bachelor', maritalStatus: 'Married', childrenCount: 2, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 93, notes: [] },
    { id: 'M-024', nationalId: '29403031100024', name: 'Adel Rizk Younis', nameAr: 'عادل رزق يونس', rank: 'Staff Sergeant', rankAr: 'رقيب أول', rankLevel: 4, sectorId: 'sector_4', unitId: 'unit_2_2', squad: 'R-1', status: 'Active', speciality: 'Communications', specialityAr: 'اتصالات', bloodType: 'B+', phone: '+20 100 555 0024', emergencyContact: 'Rizk Younis', emergencyPhone: '+20 111 222 0024', birthDate: '1994-03-03', age: 30, city: 'Tanta', governorate: 'Gharbia', enlistedDate: '2018-03-15', yearsOfService: 6, contractType: 'Regular', missions: 82, medals: 6, fitnessScore: 92, educationLevel: 'Diploma', maritalStatus: 'Married', childrenCount: 2, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 91, notes: [] },
    { id: 'M-025', nationalId: '29702021100025', name: 'Fady Emad Soliman', nameAr: 'فادي عماد سليمان', rank: 'Sergeant', rankAr: 'رقيب', rankLevel: 3, sectorId: 'sector_10', unitId: 'unit_10_1', squad: 'SO-2', status: 'Active', speciality: 'Sniper', specialityAr: 'قناصة', bloodType: 'O-', phone: '+20 100 555 0025', emergencyContact: 'Emad Soliman', emergencyPhone: '+20 111 222 0025', birthDate: '1997-02-02', age: 27, city: 'Cairo', governorate: 'Cairo', enlistedDate: '2020-02-15', yearsOfService: 4, contractType: 'Regular', missions: 103, medals: 9, fitnessScore: 97, educationLevel: 'Diploma', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 96, notes: ['Sniper specialist'] },
    { id: 'M-026', nationalId: '28909091100026', name: 'Magdy Hamdy Amin', nameAr: 'مجدي حمدي أمين', rank: 'Major', rankAr: 'رائد', rankLevel: 9, sectorId: 'sector_2', unitId: 'unit_2_1', squad: 'Command', status: 'Active', speciality: 'Intel', specialityAr: 'استخبارات', bloodType: 'A+', phone: '+20 100 555 0026', emergencyContact: 'Hamdy Amin', emergencyPhone: '+20 111 222 0026', birthDate: '1989-09-09', age: 35, city: 'Giza', governorate: 'Giza', enlistedDate: '2015-09-10', yearsOfService: 9, contractType: 'Regular', missions: 74, medals: 8, fitnessScore: 87, educationLevel: 'Master', maritalStatus: 'Married', childrenCount: 3, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 95, notes: [] },
    { id: 'M-027', nationalId: '28711011100027', name: 'Ashraf Kamal Zaki', nameAr: 'أشرف كمال زكي', rank: 'Warrant Officer', rankAr: 'مساعد', rankLevel: 5, sectorId: 'sector_8', unitId: 'unit_1_1', squad: 'S-1', status: 'Active', speciality: 'Diving', specialityAr: 'غطس', bloodType: 'B+', phone: '+20 100 555 0027', emergencyContact: 'Kamal Zaki', emergencyPhone: '+20 111 222 0027', birthDate: '1987-11-01', age: 37, city: 'Hurghada', governorate: 'Red Sea', enlistedDate: '2012-11-10', yearsOfService: 12, contractType: 'Regular', missions: 141, medals: 11, fitnessScore: 94, educationLevel: 'Diploma', maritalStatus: 'Married', childrenCount: 2, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 94, notes: ['Elite diver'] },
    { id: 'M-028', nationalId: '29804041100028', name: 'Reda Fathy Ghanem', nameAr: 'رضا فتحي غانم', rank: 'Corporal', rankAr: 'عريف', rankLevel: 2, sectorId: 'sector_3', unitId: 'unit_3_5', squad: 'T-1', status: 'Active', speciality: 'Naval Artillery', specialityAr: 'مدفعية بحرية', bloodType: 'O+', phone: '+20 100 555 0028', emergencyContact: 'Fathy Ghanem', emergencyPhone: '+20 111 222 0028', birthDate: '1998-04-04', age: 26, city: 'Alexandria', governorate: 'Alexandria', enlistedDate: '2022-04-10', yearsOfService: 2, contractType: 'Regular', missions: 42, medals: 3, fitnessScore: 90, educationLevel: 'Diploma', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 86, notes: [] },
    { id: 'M-029', nationalId: '29603031100029', name: 'Sameh Yousry Melek', nameAr: 'سامح يسري ملك', rank: 'First Lieutenant', rankAr: 'ملازم أول', rankLevel: 7, sectorId: 'sector_1', unitId: 'unit_1_5', squad: 'CY-1', status: 'Active', speciality: 'Cyber', specialityAr: 'سيبراني', bloodType: 'AB-', phone: '+20 100 555 0029', emergencyContact: 'Yousry Melek', emergencyPhone: '+20 111 222 0029', birthDate: '1996-03-03', age: 28, city: 'Cairo', governorate: 'Cairo', enlistedDate: '2019-03-15', yearsOfService: 5, contractType: 'Regular', missions: 63, medals: 5, fitnessScore: 85, educationLevel: 'Master', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 97, notes: ['Cyber warfare specialist'] },
    { id: 'M-030', nationalId: '29805051100030', name: 'Essam Zaki Moawad', nameAr: 'عصام زكي معوض', rank: 'Sergeant', rankAr: 'رقيب', rankLevel: 3, sectorId: 'sector_9', unitId: 'unit_3_5', squad: 'U-1', status: 'Active', speciality: 'Desert Recon', specialityAr: 'استطلاع صحراء', bloodType: 'O+', phone: '+20 100 555 0030', emergencyContact: 'Zaki Moawad', emergencyPhone: '+20 111 222 0030', birthDate: '1998-05-05', age: 26, city: 'Marsa Matrouh', governorate: 'Matrouh', enlistedDate: '2021-05-10', yearsOfService: 3, contractType: 'Regular', missions: 49, medals: 4, fitnessScore: 93, educationLevel: 'Secondary', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 89, notes: [] },
    { id: 'M-031', nationalId: '30007071100031', name: 'Amr Ibrahim Shakweer', nameAr: 'عمرو إبراهيم شكوي', rank: 'Private', rankAr: 'جندي', rankLevel: 1, sectorId: 'sector_7', unitId: 'unit_2_3', squad: 'V-2', status: 'Training', speciality: 'Basic', specialityAr: 'أساسي', bloodType: 'A+', phone: '+20 100 555 0031', emergencyContact: 'Ibrahim Shakweer', emergencyPhone: '+20 111 222 0031', birthDate: '2000-07-07', age: 24, city: 'Sohag', governorate: 'Sohag', enlistedDate: '2023-07-15', yearsOfService: 1, contractType: 'Volunteer', missions: 4, medals: 0, fitnessScore: 80, educationLevel: 'Secondary', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Under Review', trainingStatus: 'In Progress', lastEvaluation: 68, notes: ['Currently in basic training'] },
    { id: 'M-032', nationalId: '29807071100032', name: 'Tamer Wael Hafez', nameAr: 'تامر وائل حافظ', rank: 'Corporal', rankAr: 'عريف', rankLevel: 2, sectorId: 'sector_5', unitId: 'unit_3_4', squad: 'W-3', status: 'Active', speciality: 'Signals', specialityAr: 'إشارة', bloodType: 'B+', phone: '+20 100 555 0032', emergencyContact: 'Wael Hafez', emergencyPhone: '+20 111 222 0032', birthDate: '1998-07-07', age: 26, city: 'Ismailia', governorate: 'Ismailia', enlistedDate: '2022-07-20', yearsOfService: 2, contractType: 'Regular', missions: 37, medals: 2, fitnessScore: 88, educationLevel: 'Diploma', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 82, notes: [] },
    { id: 'M-033', nationalId: '29605051100033', name: 'Ehab Samir Ghoneim', nameAr: 'إيهاب سمير غنيم', rank: 'Lieutenant', rankAr: 'ملازم', rankLevel: 6, sectorId: 'sector_6', unitId: 'unit_6_4', squad: 'X-1', status: 'Active', speciality: 'Border Patrol', specialityAr: 'دوريات حدودية', bloodType: 'O-', phone: '+20 100 555 0033', emergencyContact: 'Samir Ghoneim', emergencyPhone: '+20 111 222 0033', birthDate: '1996-05-05', age: 28, city: 'Arish', governorate: 'North Sinai', enlistedDate: '2020-05-15', yearsOfService: 4, contractType: 'Regular', missions: 51, medals: 4, fitnessScore: 92, educationLevel: 'Bachelor', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 88, notes: [] },
    { id: 'M-034', nationalId: '29702021100034', name: 'Alaa Nabil Selim', nameAr: 'علاء نبيل سليم', rank: 'Sergeant', rankAr: 'رقيب', rankLevel: 3, sectorId: 'sector_4', unitId: 'unit_2_3', squad: 'Y-1', status: 'Active', speciality: 'Mechanic', specialityAr: 'ميكانيكا', bloodType: 'A-', phone: '+20 100 555 0034', emergencyContact: 'Nabil Selim', emergencyPhone: '+20 111 222 0034', birthDate: '1997-02-02', age: 27, city: 'Zagazig', governorate: 'Sharqia', enlistedDate: '2021-02-10', yearsOfService: 3, contractType: 'Regular', missions: 44, medals: 3, fitnessScore: 89, educationLevel: 'Diploma', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 85, notes: [] },
    { id: 'M-035', nationalId: '29008081100035', name: 'Bahaa Adel Kamel', nameAr: 'بهاء عادل كامل', rank: 'Captain', rankAr: 'نقيب', rankLevel: 8, sectorId: 'sector_10', unitId: 'unit_10_2', squad: 'Command', status: 'Active', speciality: 'Special Ops', specialityAr: 'عمليات خاصة', bloodType: 'O+', phone: '+20 100 555 0035', emergencyContact: 'Adel Kamel', emergencyPhone: '+20 111 222 0035', birthDate: '1990-08-08', age: 34, city: 'Cairo', governorate: 'Cairo', enlistedDate: '2016-08-10', yearsOfService: 8, contractType: 'Regular', missions: 97, medals: 8, fitnessScore: 95, educationLevel: 'Bachelor', maritalStatus: 'Married', childrenCount: 2, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 97, notes: ['Special ops commander'] },
    { id: 'M-036', nationalId: '30008081100036', name: 'Nour Eldin Mahmoud', nameAr: 'نور الدين محمود', rank: 'Private', rankAr: 'جندي', rankLevel: 1, sectorId: 'sector_2', unitId: 'unit_2_4', squad: 'Z-1', status: 'Active', speciality: 'Basic', specialityAr: 'أساسي', bloodType: 'B+', phone: '+20 100 555 0036', emergencyContact: 'Mahmoud Nour', emergencyPhone: '+20 111 222 0036', birthDate: '2000-08-08', age: 24, city: 'Fayoum', governorate: 'Fayoum', enlistedDate: '2023-08-15', yearsOfService: 1, contractType: 'Regular', missions: 3, medals: 0, fitnessScore: 78, educationLevel: 'Secondary', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 72, notes: [] },
    { id: 'M-037', nationalId: '29411011100037', name: 'Atef Hosny Barakat', nameAr: 'عاطف حسني بركات', rank: 'Staff Sergeant', rankAr: 'رقيب أول', rankLevel: 4, sectorId: 'sector_3', unitId: 'unit_3_4', squad: 'AA-1', status: 'Active', speciality: 'Diving', specialityAr: 'غطس', bloodType: 'A+', phone: '+20 100 555 0037', emergencyContact: 'Hosny Barakat', emergencyPhone: '+20 111 222 0037', birthDate: '1994-11-01', age: 30, city: 'Alexandria', governorate: 'Alexandria', enlistedDate: '2018-11-10', yearsOfService: 6, contractType: 'Regular', missions: 79, medals: 6, fitnessScore: 93, educationLevel: 'Diploma', maritalStatus: 'Married', childrenCount: 1, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 90, notes: ['Elite combat diver'] },
    { id: 'M-038', nationalId: '29703031100038', name: 'Ramy Sherif Fawzy', nameAr: 'رامي شريف فوزي', rank: 'Sergeant', rankAr: 'رقيب', rankLevel: 3, sectorId: 'sector_8', unitId: 'unit_1_6', squad: 'AB-1', status: 'Active', speciality: 'Coastal Defense', specialityAr: 'دفاع ساحلي', bloodType: 'AB+', phone: '+20 100 555 0038', emergencyContact: 'Sherif Fawzy', emergencyPhone: '+20 111 222 0038', birthDate: '1997-03-03', age: 27, city: 'Hurghada', governorate: 'Red Sea', enlistedDate: '2021-03-15', yearsOfService: 3, contractType: 'Regular', missions: 45, medals: 3, fitnessScore: 91, educationLevel: 'Diploma', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 87, notes: [] },
    { id: 'M-039', nationalId: '29801011100039', name: 'Hany Maher Zaki', nameAr: 'هاني ماهر زكي', rank: 'Corporal', rankAr: 'عريف', rankLevel: 2, sectorId: 'sector_1', unitId: 'unit_1_2', squad: 'AC-2', status: 'Medical', speciality: 'Infantry', specialityAr: 'مشاة', bloodType: 'O+', phone: '+20 100 555 0039', emergencyContact: 'Maher Zaki', emergencyPhone: '+20 111 222 0039', birthDate: '1998-01-01', age: 26, city: 'Cairo', governorate: 'Cairo', enlistedDate: '2022-01-15', yearsOfService: 2, contractType: 'Regular', missions: 31, medals: 2, fitnessScore: 65, educationLevel: 'Diploma', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Temporary Exemption', trainingStatus: 'Not Required', lastEvaluation: 76, notes: ['Medical recovery - 4 weeks'] },
    { id: 'M-040', nationalId: '29609091100040', name: 'Walid Nabil Khedr', nameAr: 'وليد نبيل خضر', rank: 'Lieutenant', rankAr: 'ملازم', rankLevel: 6, sectorId: 'sector_9', unitId: 'unit_3_5', squad: 'AD-1', status: 'Active', speciality: 'Recon', specialityAr: 'استطلاع', bloodType: 'A+', phone: '+20 100 555 0040', emergencyContact: 'Nabil Khedr', emergencyPhone: '+20 111 222 0040', birthDate: '1996-09-09', age: 28, city: 'Marsa Matrouh', governorate: 'Matrouh', enlistedDate: '2020-09-10', yearsOfService: 4, contractType: 'Regular', missions: 48, medals: 4, fitnessScore: 92, educationLevel: 'Bachelor', maritalStatus: 'Single', childrenCount: 0, medicalStatus: 'Fit', trainingStatus: 'Completed', lastEvaluation: 89, notes: [] },
];

export const IMPORT_BATCHES: ImportBatch[] = [
    { id: 'IMP-2024-001', fileName: 'soldiers_batch_01.xlsx', fileSize: '2.4 MB', totalRows: 1200, validRows: 1195, invalidRows: 5, status: 'completed', importedAt: '2024-11-15T10:23:00Z', importedBy: 'Maj. Hassan Ali', duration: '1m 24s', errors: [] },
    { id: 'IMP-2024-002', fileName: 'soldiers_batch_02.xlsx', fileSize: '3.1 MB', totalRows: 1850, validRows: 1848, invalidRows: 2, status: 'completed', importedAt: '2024-11-22T14:15:00Z', importedBy: 'Capt. Amr Fathy', duration: '2m 12s', errors: [{ row: 245, reason: 'Duplicate national ID' }, { row: 1120, reason: 'Missing required field' }] },
    { id: 'IMP-2024-003', fileName: 'soldiers_batch_03.xlsx', fileSize: '4.7 MB', totalRows: 2847, validRows: 2842, invalidRows: 5, status: 'completed', importedAt: '2024-12-01T09:45:00Z', importedBy: 'Gen. Mostafa Fahmy', duration: '3m 08s', errors: [] },
    { id: 'IMP-2024-004', fileName: 'soldiers_batch_04.csv', fileSize: '1.8 MB', totalRows: 892, validRows: 890, invalidRows: 2, status: 'completed', importedAt: '2024-12-05T16:30:00Z', importedBy: 'Col. Nabil Mostafa', duration: '58s', errors: [] },
    { id: 'IMP-2024-005', fileName: 'soldiers_batch_05.xlsx', fileSize: '5.2 MB', totalRows: 3200, validRows: 0, invalidRows: 0, status: 'processing', importedAt: '2024-12-08T10:00:00Z', importedBy: 'Maj. Bahaa Adel', duration: '—', errors: [] },
    { id: 'IMP-2024-006', fileName: 'soldiers_batch_06.csv', fileSize: '2.1 MB', totalRows: 1050, validRows: 0, invalidRows: 1050, status: 'failed', importedAt: '2024-12-07T11:20:00Z', importedBy: 'Capt. Bahaa Kamel', duration: '12s', errors: [{ row: 1, reason: 'Invalid CSV format — missing header' }] },
];

export const TRAINING_RECORDS: TrainingRecord[] = [
    { id: 'TR-001', title: 'Basic Infantry Course', titleAr: 'دورة المشاة الأساسية', type: 'basic', startDate: '2024-11-01', endDate: '2024-12-15', duration: '6 weeks', capacity: 120, enrolled: 118, completed: 0, location: 'Cairo Training Camp', instructor: 'Maj. Hassan Ali', status: 'ongoing' },
    { id: 'TR-002', title: 'Advanced Marksmanship', titleAr: 'الرماية المتقدمة', type: 'weapons', startDate: '2024-10-15', endDate: '2024-11-20', duration: '5 weeks', capacity: 80, enrolled: 76, completed: 74, location: 'Sector 6 Range', instructor: 'Capt. Sami Hosny', status: 'completed' },
    { id: 'TR-003', title: 'Special Forces Selection', titleAr: 'انتقاء القوات الخاصة', type: 'specialization', startDate: '2024-09-01', endDate: '2024-12-01', duration: '13 weeks', capacity: 40, enrolled: 38, completed: 32, location: 'Special Ops HQ', instructor: 'Maj. Bahaa Adel', status: 'completed' },
    { id: 'TR-004', title: 'Cyber Warfare Fundamentals', titleAr: 'أساسيات الحرب السيبرانية', type: 'specialization', startDate: '2024-12-01', endDate: '2025-01-15', duration: '6 weeks', capacity: 25, enrolled: 24, completed: 0, location: 'Cyber Unit — Heliopolis', instructor: 'Lt. Sameh Yousry', status: 'ongoing' },
    { id: 'TR-005', title: 'Combat Medic Refresher', titleAr: 'تجديد المسعف القتالي', type: 'medical', startDate: '2025-01-10', endDate: '2025-01-24', duration: '2 weeks', capacity: 60, enrolled: 0, completed: 0, location: 'Medical Corps HQ', instructor: 'Maj. Ayman Samir', status: 'scheduled' },
    { id: 'TR-006', title: 'Desert Survival Advanced', titleAr: 'النجاة الصحراوية المتقدمة', type: 'advanced', startDate: '2025-02-01', endDate: '2025-03-15', duration: '6 weeks', capacity: 50, enrolled: 0, completed: 0, location: 'Western Desert', instructor: 'Lt. Hazem Yasser', status: 'scheduled' },
];

export const ACTIVITY_LOG: ActivityLogEntry[] = [
    { id: 'ACT-001', timestamp: '2024-12-08T14:30:00Z', soldierId: 'M-011', action: 'transferred', description: 'Transferred to Special Ops — Reserve Command', by: 'Gen. Mostafa Fahmy', icon: '🔀', color: '#007aff' },
    { id: 'ACT-002', timestamp: '2024-12-08T13:15:00Z', soldierId: 'M-025', action: 'medaled', description: 'Awarded Medal of Excellence — Sniper proficiency', by: 'Col. Nabil Mostafa', icon: '🏅', color: '#ffcc00' },
    { id: 'ACT-003', timestamp: '2024-12-08T12:00:00Z', soldierId: 'M-018', action: 'promoted', description: 'Promoted to Warrant Officer', by: 'Gen. Mostafa Fahmy', icon: '⬆', color: '#34c759' },
    { id: 'ACT-004', timestamp: '2024-12-08T10:45:00Z', soldierId: 'M-031', action: 'enlisted', description: 'New recruit enlisted — volunteer program', by: 'Capt. Khaled Said', icon: '📝', color: '#af52de' },
    { id: 'ACT-005', timestamp: '2024-12-08T09:20:00Z', soldierId: 'M-006', action: 'leave', description: 'Approved leave — 2 weeks family visit', by: 'Col. Omar Ibrahim', icon: '🏖', color: '#ff9500' },
    { id: 'ACT-006', timestamp: '2024-12-08T08:30:00Z', soldierId: 'M-022', action: 'trained', description: 'Completed basic infantry training', by: 'Maj. Ehab Samir', icon: '🎓', color: '#5856d6' },
    { id: 'ACT-007', timestamp: '2024-12-07T17:00:00Z', soldierId: 'M-013', action: 'promoted', description: 'Promoted to Captain — outstanding service', by: 'Col. Youssef Kamal', icon: '⬆', color: '#34c759' },
    { id: 'ACT-008', timestamp: '2024-12-07T15:30:00Z', soldierId: 'M-024', action: 'medaled', description: 'Awarded Service Medal — 6 years of service', by: 'Col. Tarek Sami', icon: '🏅', color: '#ffcc00' },
    { id: 'ACT-009', timestamp: '2024-12-07T11:45:00Z', soldierId: 'M-039', action: 'medical', description: 'Temporary medical exemption — 4 weeks recovery', by: 'Maj. Ayman Samir', icon: '⚕️', color: '#ff3b30' },
    { id: 'ACT-010', timestamp: '2024-12-07T09:15:00Z', soldierId: 'M-016', action: 'enlisted', description: 'Enlisted in Red Sea Command', by: 'Col. Sami Hosny', icon: '📝', color: '#af52de' },
    { id: 'ACT-011', timestamp: '2024-12-06T18:00:00Z', soldierId: 'M-037', action: 'trained', description: 'Completed elite diving course', by: 'Col. Karim Adel', icon: '🎓', color: '#5856d6' },
    { id: 'ACT-012', timestamp: '2024-12-06T16:30:00Z', soldierId: 'M-029', action: 'medaled', description: 'Awarded Cyber Excellence Medal', by: 'Gen. Mostafa Fahmy', icon: '🏅', color: '#ffcc00' },
    { id: 'ACT-013', timestamp: '2024-12-06T14:00:00Z', soldierId: 'M-008', action: 'promoted', description: 'Promoted to Major', by: 'Gen. Mostafa Fahmy', icon: '⬆', color: '#34c759' },
    { id: 'ACT-014', timestamp: '2024-12-06T11:30:00Z', soldierId: 'M-030', action: 'transferred', description: 'Transferred to Sinai Command — desert recon', by: 'Col. Khaled Rashad', icon: '🔀', color: '#007aff' },
    { id: 'ACT-015', timestamp: '2024-12-06T09:00:00Z', soldierId: 'M-014', action: 'enlisted', description: 'Re-enlisted for 3-year extended contract', by: 'Col. Tarek Sami', icon: '📝', color: '#af52de' },
];

export const RANK_FILTERS = ['all', 'Private', 'Corporal', 'Sergeant', 'Staff Sergeant', 'Warrant Officer', 'Lieutenant', 'First Lieutenant', 'Captain', 'Major', 'Lieutenant Colonel', 'Colonel'];

export const SPECIALITY_FILTERS = [
    { id: 'all', label: 'All', icon: '📁' },
    { id: 'Infantry', label: 'Infantry', icon: '🪖' },
    { id: 'Armored', label: 'Armored', icon: '🚙' },
    { id: 'Artillery', label: 'Artillery', icon: '💥' },
    { id: 'Signals', label: 'Signals', icon: '📡' },
    { id: 'Medical', label: 'Medical', icon: '⚕️' },
    { id: 'Engineering', label: 'Engineering', icon: '🔧' },
    { id: 'Recon', label: 'Recon', icon: '🔍' },
    { id: 'Special Forces', label: 'Special Forces', icon: '🎖' },
    { id: 'Cyber', label: 'Cyber', icon: '💻' },
    { id: 'Logistics', label: 'Logistics', icon: '📦' },
    { id: 'Communications', label: 'Communications', icon: '📻' },
    { id: 'Diving', label: 'Diving', icon: '🤿' },
    { id: 'Intel', label: 'Intel', icon: '🕵' },
];