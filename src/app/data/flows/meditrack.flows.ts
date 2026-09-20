import { Flow } from '../../core/models/flow.model';

export const MEDITRACK_FLOWS: Flow[] = [
    {
        id: 'patient-booking',
        name: 'Patient Books Appointment',
        description: 'Search doctors, book slot, get SMS confirmation.',
        icon: '🏥',
        actor: 'Patient',
        difficulty: 'intermediate',
        tags: ['booking', 'sms', 'calendar'],
        steps: [
            {
                id: 's1',
                title: 'Browse doctors',
                description: 'Filter by specialty',
                uiDescription: 'Doctor cards with photo, rating, availability badge.',
                actor: 'Patient',
                request: { method: 'GET', route: '/Doctors?specialty=Cardiology', auth: 'Anonymous' },
                response: {
                    status: 200, statusText: 'OK',
                    body: { doctors: [{ id: 5, name: 'Dr. Ahmed Ali', specialty: 'Cardiology', rating: 4.9, fee: 200 }] },
                    timeMs: 78, size: '20 KB',
                },
            },
            {
                id: 's2',
                title: 'View availability',
                description: 'GET available slots for next 7 days',
                uiDescription: 'Calendar widget loads. Greyed-out = booked.',
                actor: 'Patient',
                request: { method: 'GET', route: '/Doctors/5/Availability?week=2024-12-09', auth: 'Anonymous' },
                response: {
                    status: 200, statusText: 'OK',
                    body: { slots: [{ date: '2024-12-09', time: '09:00', available: true }, { date: '2024-12-09', time: '09:30', available: false }] },
                    timeMs: 62, size: '1.8 KB',
                },
            },
            {
                id: 's3',
                title: 'Book slot',
                description: 'POST /Appointments/Book',
                uiDescription: 'Confirm dialog. On success → SMS confirmation. Redirect to /Appointments/My.',
                actor: 'Patient',
                request: {
                    method: 'POST', route: '/Appointments/Book', auth: 'Authorize(Patient)',
                    body: { doctorId: 5, scheduledAt: '2024-12-09T09:00:00Z', reason: 'Chest pain checkup' },
                },
                response: {
                    status: 302, statusText: 'Redirect',
                    headers: { Location: '/Appointments/Confirmation/88' },
                    body: null, timeMs: 420, size: '0.4 KB',
                },
                sideEffects: [
                    'INSERT Appointments (Status="Confirmed")',
                    'Twilio SMS to patient: "Your appointment is confirmed"',
                    'Send email reminder',
                    'Update doctor calendar',
                ],
            },
            {
                id: 's4',
                title: 'Confirmation page',
                description: 'View booking details',
                uiDescription: 'Card with doctor photo, appointment time, address, and "Add to calendar" button.',
                actor: 'Patient',
                request: { method: 'GET', route: '/Appointments/Confirmation/88', auth: 'Authorize(Patient)' },
                response: {
                    status: 200, statusText: 'OK',
                    body: { appointmentId: 88, doctor: 'Dr. Ahmed Ali', time: '2024-12-09 09:00', location: 'Clinic A, Room 205' },
                    timeMs: 48, size: '18 KB',
                },
            },
        ],
    },
    {
        id: 'doctor-prescription',
        name: 'Doctor Issues Prescription',
        description: 'After appointment, doctor creates digital prescription.',
        icon: '💊',
        actor: 'Doctor',
        difficulty: 'intermediate',
        tags: ['prescription', 'pdf', 'audit'],
        steps: [
            {
                id: 's1',
                title: 'Open schedule',
                description: 'Doctor views today',
                uiDescription: 'Timeline view: 09:00 Sara (done), 09:30 Omar (in progress), 10:00 Layla.',
                actor: 'Doctor',
                request: { method: 'GET', route: '/Doctor/Schedule', auth: 'Authorize(Roles=Doctor)' },
                response: {
                    status: 200, statusText: 'OK',
                    body: { today: [{ id: 88, patient: 'Sara', time: '09:00', status: 'Completed' }] },
                    timeMs: 92, size: '24 KB',
                },
            },
            {
                id: 's2',
                title: 'Open patient record',
                description: 'Full medical history',
                uiDescription: 'Patient card with allergies, previous visits, prescriptions.',
                actor: 'Doctor',
                request: { method: 'GET', route: '/Doctor/Patients/42', auth: 'Authorize(Roles=Doctor)' },
                response: {
                    status: 200, statusText: 'OK',
                    body: { patient: { id: 42, name: 'Sara', allergies: ['penicillin'], history: [] } },
                    timeMs: 82, size: '32 KB',
                },
                sideEffects: ['INSERT AuditLogs (DoctorId, PatientId, Action="Viewed")'],
            },
            {
                id: 's3',
                title: 'Create prescription',
                description: 'POST medications',
                uiDescription: 'Form with medication picker, dosage, frequency, duration, notes.',
                actor: 'Doctor',
                request: {
                    method: 'POST', route: '/Prescriptions/Create', auth: 'Authorize(Roles=Doctor)',
                    body: {
                        appointmentId: 88,
                        medications: [
                            { name: 'Amoxicillin', dosage: '500mg', frequency: '3x daily', days: 7 },
                            { name: 'Ibuprofen', dosage: '400mg', frequency: '2x daily', days: 3 },
                        ],
                        instructions: 'Take with food. Complete full course.',
                    },
                },
                response: {
                    status: 302, statusText: 'Redirect',
                    headers: { Location: '/Prescriptions/144' },
                    body: null, timeMs: 620, size: '0.4 KB',
                },
                sideEffects: [
                    'QuestPDF: generate signed prescription',
                    'INSERT Prescriptions (SignedAt=NOW())',
                    'Send PDF to patient email',
                    'INSERT AuditLogs',
                ],
            },
        ],
    },
];