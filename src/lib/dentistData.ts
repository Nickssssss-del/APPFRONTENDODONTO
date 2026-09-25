import type { AgendaPatient, ClinicalEntry, CalendarView, DaySchedule, MonthSchedule, PatientClinicalRecord } from '@/types';

export const DENTIST_AVATAR = 'https://images.pexels.com/photos/37458046/pexels-photo-37458046.jpeg?auto=compress&cs=tinysrgb&h=200&w=200';
export const DENTIST_NAME = 'Carlos Mendoza';

// Unique patients per day — NO repetition across days
export const WEEK_SCHEDULE: DaySchedule[] = [
  {
    dayLabel: 'Lun', dateNumber: '15', fullDate: 'Lunes 15 Sep',
    patients: [
      { id: 'p1', name: 'Ana Flores Quispe', dni: '87654321', age: '34', time: '09:00', treatment: 'Limpieza Dental Profunda', status: 'CONFIRMED', guaranteePaid: true, photo: 'https://images.pexels.com/photos/33369429/pexels-photo-33369429.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '999 111 222', email: 'ana.flores@gmail.com', whatsapp: '999111222', strikes: 0, lateArrivals: 0, reputationStatus: 'GOOD_STANDING' },
      { id: 'p2', name: 'Roberto Silva Nakamura', dni: '23456789', age: '41', time: '10:30', treatment: 'Consulta General', status: 'CONFIRMED', guaranteePaid: true, photo: 'https://images.pexels.com/photos/5308640/pexels-photo-5308640.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '998 222 333', email: 'roberto.silva@gmail.com', whatsapp: '998222333' },
      { id: 'p3', name: 'Carmen Díaz Vargas', dni: '45678901', age: '26', time: '14:00', treatment: 'Limpieza Dental Profunda', status: 'PENDING_PAYMENT', guaranteePaid: false, photo: 'https://images.pexels.com/photos/33680700/pexels-photo-33680700.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '997 333 444', email: 'carmen.diaz@gmail.com', whatsapp: '997333444' },
      { id: 'p4', name: 'Jorge Mendoza Ríos', dni: '56789012', age: '52', time: '16:00', treatment: 'Urgencia / Dolor Agudo', status: 'CONFIRMED', guaranteePaid: true, photo: 'https://images.pexels.com/photos/30269649/pexels-photo-30269649.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '996 444 555', email: 'jorge.mendoza@gmail.com', whatsapp: '996444555' },
    ],
  },
  {
    dayLabel: 'Mar', dateNumber: '16', fullDate: 'Martes 16 Sep',
    patients: [
      { id: 'p5', name: 'Carlos Ruiz Paredes', dni: '34567890', age: '38', time: '09:00', treatment: 'Consulta General', status: 'CONFIRMED', guaranteePaid: true, photo: 'https://images.pexels.com/photos/35681211/pexels-photo-35681211.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '995 555 666', email: 'carlos.ruiz@gmail.com', whatsapp: '995555666' },
      { id: 'p6', name: 'Lucía Mendoza Cruz', dni: '67890123', age: '29', time: '11:00', treatment: 'Limpieza Dental Profunda', status: 'CONFIRMED', guaranteePaid: true, photo: 'https://images.pexels.com/photos/11701102/pexels-photo-11701102.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '994 666 777', email: 'lucia.mendoza@gmail.com', whatsapp: '994666777' },
      { id: 'p7', name: 'Diego Flores Ríos', dni: '78901234', age: '45', time: '15:00', treatment: 'Urgencia / Dolor Agudo', status: 'IN_PROGRESS', guaranteePaid: true, photo: 'https://images.pexels.com/photos/28442318/pexels-photo-28442318.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '993 777 888', email: 'diego.flores@gmail.com', whatsapp: '993777888' },
    ],
  },
  {
    dayLabel: 'Mié', dateNumber: '17', fullDate: 'Miércoles 17 Sep',
    patients: [
      { id: 'p8', name: 'Patricia Romero Soto', dni: '12345678', age: '31', time: '08:30', treatment: 'Limpieza Dental Profunda', status: 'CONFIRMED', guaranteePaid: true, photo: 'https://images.pexels.com/photos/7752788/pexels-photo-7752788.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '992 888 999', email: 'patricia.romero@gmail.com', whatsapp: '992888999' },
      { id: 'p9', name: 'Fernando Quispe Huamán', dni: '23456780', age: '37', time: '10:00', treatment: 'Consulta General', status: 'CONFIRMED', guaranteePaid: true, photo: 'https://images.pexels.com/photos/14950779/pexels-photo-14950779.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '991 999 000', email: 'fernando.quispe@gmail.com', whatsapp: '991999000' },
      { id: 'p10', name: 'Rosa Vargas López', dni: '34567891', age: '44', time: '13:00', treatment: 'Limpieza Dental Profunda', status: 'PENDING_PAYMENT', guaranteePaid: false, photo: 'https://images.pexels.com/photos/38707525/pexels-photo-38707525.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '990 000 111', email: 'rosa.vargas@gmail.com', whatsapp: '990000111' },
      { id: 'p11', name: 'Miguel Ángel Torres', dni: '45678902', age: '33', time: '17:00', treatment: 'Urgencia / Dolor Agudo', status: 'CONFIRMED', guaranteePaid: true, photo: 'https://images.pexels.com/photos/13392786/pexels-photo-13392786.png?auto=compress&cs=tinysrgb&h=120&w=120', phone: '989 111 222', email: 'miguel.torres@gmail.com', whatsapp: '989111222' },
    ],
  },
  {
    dayLabel: 'Jue', dateNumber: '18', fullDate: 'Jueves 18 Sep',
    patients: [
      { id: 'p12', name: 'Sofía Castro Vega', dni: '56789013', age: '27', time: '09:30', treatment: 'Consulta General', status: 'CONFIRMED', guaranteePaid: true, photo: 'https://images.pexels.com/photos/35721594/pexels-photo-35721594.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '988 222 333', email: 'sofia.castro@gmail.com', whatsapp: '988222333' },
      { id: 'p13', name: 'Andrés Paredes Soto', dni: '67890124', age: '50', time: '12:00', treatment: 'Limpieza Dental Profunda', status: 'CONFIRMED', guaranteePaid: true, photo: 'https://images.pexels.com/photos/38740728/pexels-photo-38740728.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '987 333 444', email: 'andres.paredes@gmail.com', whatsapp: '987333444' },
      { id: 'p14', name: 'Mónica Salazar Ríos', dni: '78901235', age: '36', time: '15:30', treatment: 'Urgencia / Dolor Agudo', status: 'CONFIRMED', guaranteePaid: true, photo: 'https://images.pexels.com/photos/8312669/pexels-photo-8312669.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '986 444 555', email: 'monica.salazar@gmail.com', whatsapp: '986444555' },
    ],
  },
  {
    dayLabel: 'Vie', dateNumber: '19', fullDate: 'Viernes 19 Sep',
    patients: [
      { id: 'p15', name: 'Eduardo Ramírez Quispe', dni: '89012346', age: '42', time: '08:00', treatment: 'Limpieza Dental Profunda', status: 'CONFIRMED', guaranteePaid: true, photo: 'https://images.pexels.com/photos/31420959/pexels-photo-31420959.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '985 555 666', email: 'eduardo.ramirez@gmail.com', whatsapp: '985555666' },
      { id: 'p16', name: 'Valentina Rojas Cruz', dni: '90123457', age: '25', time: '10:00', treatment: 'Consulta General', status: 'CONFIRMED', guaranteePaid: true, photo: 'https://images.pexels.com/photos/34930167/pexels-photo-34930167.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '984 666 777', email: 'valentina.rojas@gmail.com', whatsapp: '984666777' },
      { id: 'p17', name: 'Hernán Cáceres López', dni: '01234568', age: '48', time: '14:30', treatment: 'Urgencia / Dolor Agudo', status: 'CONFIRMED', guaranteePaid: true, photo: 'https://images.pexels.com/photos/5197205/pexels-photo-5197205.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '983 777 888', email: 'hernan.caceres@gmail.com', whatsapp: '983777888' },
      { id: 'p18', name: 'Daniela Pinto Vargas', dni: '12345679', age: '30', time: '16:30', treatment: 'Limpieza Dental Profunda', status: 'PENDING_PAYMENT', guaranteePaid: false, photo: 'https://images.pexels.com/photos/25651531/pexels-photo-25651531.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '982 888 999', email: 'daniela.pinto@gmail.com', whatsapp: '982888999' },
    ],
  },
  {
    dayLabel: 'Sáb', dateNumber: '20', fullDate: 'Sábado 20 Sep',
    patients: [
      { id: 'p19', name: 'Ricardo Soto Fernández', dni: '23456791', age: '39', time: '09:00', treatment: 'Consulta General', status: 'CONFIRMED', guaranteePaid: true, photo: 'https://images.pexels.com/photos/11156392/pexels-photo-11156392.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '981 999 000', email: 'ricardo.soto@gmail.com', whatsapp: '981999000' },
      { id: 'p20', name: 'Gabriela Núñez Cruz', dni: '34567892', age: '35', time: '11:30', treatment: 'Limpieza Dental Profunda', status: 'CONFIRMED', guaranteePaid: true, photo: 'https://images.pexels.com/photos/35725749/pexels-photo-35725749.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '980 000 111', email: 'gabriela.nunez@gmail.com', whatsapp: '980000111' },
    ],
  },
  {
    dayLabel: 'Dom', dateNumber: '21', fullDate: 'Domingo 21 Sep',
    patients: [],
  },
];

// Month overview — counts per day for the month view
export const MONTH_SCHEDULE: MonthSchedule[] = WEEK_SCHEDULE.map((d) => ({
  dayLabel: d.dayLabel,
  dateNumber: d.dateNumber,
  appointmentCount: d.patients.length,
}));

// Time slots for the calendar grid
export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00',
];

// Flatten all patients for lookup
export const ALL_PATIENTS: AgendaPatient[] = WEEK_SCHEDULE.flatMap((d) => d.patients);

export function getPatientById(id: string): AgendaPatient | undefined {
  return ALL_PATIENTS.find((p) => p.id === id);
}

export function getPatientsByDay(dayIndex: number): AgendaPatient[] {
  return WEEK_SCHEDULE[dayIndex]?.patients ?? [];
}

// Clinical histories — unique per patient, simulating API REST data
const XRAY_IMG_1 = 'https://images.pexels.com/photos/6501868/pexels-photo-6501868.jpeg?auto=compress&cs=tinysrgb&h=400&w=400';
const XRAY_IMG_2 = 'https://images.pexels.com/photos/6501862/pexels-photo-6501862.jpeg?auto=compress&cs=tinysrgb&h=400&w=400';
const XRAY_IMG_3 = 'https://images.pexels.com/photos/7800665/pexels-photo-7800665.jpeg?auto=compress&cs=tinysrgb&h=400&w=400';
const CLINIC_IMG_1 = 'https://images.pexels.com/photos/6502543/pexels-photo-6502543.jpeg?auto=compress&cs=tinysrgb&h=400&w=400';
const CLINIC_IMG_2 = 'https://images.pexels.com/photos/532786/pexels-photo-532786.jpeg?auto=compress&cs=tinysrgb&h=400&w=400';

function makeRecord(
  name: string,
  dni: string,
  age: string,
  photo: string,
  totalVisits: number,
  lastVisit: string,
  treatment: string,
  entries: ClinicalEntry[],
): PatientClinicalRecord {
  return { id: '', name, dni, age, photo, totalVisits, lastVisit, currentTreatment: treatment, history: entries };
}

export const PATIENT_RECORDS: Record<string, PatientClinicalRecord> = {
  p1: makeRecord(
    'Ana Flores Quispe', '87654321', '34',
    'https://images.pexels.com/photos/33369429/pexels-photo-33369429.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    6, '15 Sep 2026, 09:00 AM', 'Limpieza Dental Profunda',
    [
      { id: 'p1-e1', date: '15 Sep 2026', time: '09:00', type: 'evolution', title: 'Evolución clínica', description: 'Paciente refiere sensibilidad dental en cuadrante superior derecho. Se realiza profilaxis con ultrasonido y pulido coronario. Se recomienda uso de pasta desensibilizante por 15 días.', attachments: [] },
      { id: 'p1-e2', date: '02 Sep 2026', time: '10:30', type: 'odontogram', title: 'Odontograma inicial', description: 'Registro inicial de piezas dentales. Se observa caries en pieza 16 (oclusal) y 26 (mesial). Resto de piezas en buen estado.', attachments: [CLINIC_IMG_1] },
      { id: 'p1-e3', date: '20 Ago 2026', time: '14:00', type: 'xray', title: 'Radiografía panorámica', description: 'Placa panorámica solicitada para evaluación de terceras molares. Se observa impactación de pieza 38 y 48.', attachments: [XRAY_IMG_1, XRAY_IMG_2] },
      { id: 'p1-e4', date: '10 Ago 2026', time: '11:00', type: 'prescription', title: 'Receta emitida', description: 'Ibuprofeno 600mg c/8h por 5 días. Clorhexidina 0.12% bucal c/12h por 10 días.', attachments: [] },
    ],
  ),
  p2: makeRecord(
    'Roberto Silva Nakamura', '23456789', '41',
    'https://images.pexels.com/photos/5308640/pexels-photo-5308640.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    3, '15 Sep 2026, 10:30 AM', 'Consulta General',
    [
      { id: 'p2-e1', date: '15 Sep 2026', time: '10:30', type: 'evolution', title: 'Evolución clínica', description: 'Paciente acude por dolor en pieza 36. Se diagnosticó pulpitis reversible. Se colocó restauración temporal con hidróxido de calcio.', attachments: [] },
      { id: 'p2-e2', date: '15 Sep 2026', time: '10:45', type: 'xray', title: 'Radiografía periapical', description: 'Radiografía de pieza 36 muestra lesión cariosa profunda sin compromiso periapical evidente.', attachments: [XRAY_IMG_3] },
      { id: 'p2-e3', date: '15 Sep 2026', time: '11:00', type: 'prescription', title: 'Receta emitida', description: 'Amoxicilina 500mg c/8h por 7 días. Paracetamol 500mg si dolor.', attachments: [] },
    ],
  ),
  p3: makeRecord(
    'Carmen Díaz Vargas', '45678901', '26',
    'https://images.pexels.com/photos/33680700/pexels-photo-33680700.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    2, '15 Sep 2026, 14:00 PM', 'Limpieza Dental Profunda',
    [
      { id: 'p3-e1', date: '15 Sep 2026', time: '14:00', type: 'evolution', title: 'Primera consulta', description: 'Paciente joven sin antecedentes relevantes. Se solicita limpieza dental profunda y se programa para próxima cita.', attachments: [] },
      { id: 'p3-e2', date: '15 Sep 2026', time: '14:15', type: 'odontogram', title: 'Odontograma inicial', description: 'Piezas dentales en buen estado general. Ligera pigmentación por café en piezas anteriores. Sin caries activas.', attachments: [CLINIC_IMG_2] },
    ],
  ),
  p4: makeRecord(
    'Jorge Mendoza Ríos', '56789012', '52',
    'https://images.pexels.com/photos/30269649/pexels-photo-30269649.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    8, '15 Sep 2026, 16:00 PM', 'Urgencia / Dolor Agudo',
    [
      { id: 'p4-e1', date: '15 Sep 2026', time: '16:00', type: 'evolution', title: 'Atención de urgencia', description: 'Paciente acude por dolor agudo en pieza 47. Se diagnosticó absceso periapical. Se realizó drenaje y se prescribió antibioticoterapia.', attachments: [] },
      { id: 'p4-e2', date: '15 Sep 2026', time: '16:20', type: 'xray', title: 'Radiografía periapical', description: 'Lesión radiolúcida en ápice de pieza 47 compatible con absceso periapical.', attachments: [XRAY_IMG_1] },
      { id: 'p4-e3', date: '15 Sep 2026', time: '16:30', type: 'prescription', title: 'Receta emitida', description: 'Amoxicilina 875mg c/12h por 7 días. Ibuprofeno 600mg c/8h por 5 días. Metronidazol 500mg c/8h por 5 días.', attachments: [] },
      { id: 'p4-e4', date: '01 Ago 2026', time: '09:00', type: 'evolution', title: 'Control de tratamiento', description: 'Control de endodoncia en pieza 36. Evolución favorable, sin signos de inflamación.', attachments: [] },
      { id: 'p4-e5', date: '15 Jul 2026', time: '10:00', type: 'tomography', title: 'Tomografía Cone Beam', description: 'Tomografía solicitada para evaluación de implante en pieza 36. Hueso adecuado para implante de 10mm.', attachments: [XRAY_IMG_2] },
    ],
  ),
  p5: makeRecord(
    'Carlos Ruiz Paredes', '34567890', '38',
    'https://images.pexels.com/photos/35681211/pexels-photo-35681211.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    4, '16 Sep 2026, 09:00 AM', 'Consulta General',
    [
      { id: 'p5-e1', date: '16 Sep 2026', time: '09:00', type: 'evolution', title: 'Evolución clínica', description: 'Paciente refiere sangrado gingival al cepillado. Se diagnostica gingivitis leve. Se recomienda mejora en higiene y uso de enjuague bucal.', attachments: [] },
      { id: 'p5-e2', date: '16 Sep 2026', time: '09:15', type: 'odontogram', title: 'Odontograma de control', description: 'Actualización de odontograma. Sin nuevas caries. Restauraciones en pieza 16 y 46 en buen estado.', attachments: [CLINIC_IMG_1] },
      { id: 'p5-e3', date: '05 Ago 2026', time: '11:00', type: 'prescription', title: 'Receta emitida', description: 'Clorhexidina 0.12% bucal c/12h por 15 días. Vitamina C 1g diario.', attachments: [] },
    ],
  ),
  p6: makeRecord(
    'Lucía Mendoza Cruz', '67890123', '29',
    'https://images.pexels.com/photos/11701102/pexels-photo-11701102.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    5, '16 Sep 2026, 11:00 AM', 'Limpieza Dental Profunda',
    [
      { id: 'p6-e1', date: '16 Sep 2026', time: '11:00', type: 'evolution', title: 'Evolución clínica', description: 'Profilaxis completa con ultrasonido. Remoción de cálculo supragingival y subgingival. Pulido coronario con pasta profiláctica.', attachments: [] },
      { id: 'p6-e2', date: '16 Sep 2026', time: '11:30', type: 'xray', title: 'Radiografía panorámica', description: 'Placa panorámica de control. Terceras molares erupcionadas correctamente. Sin patologías observables.', attachments: [XRAY_IMG_2] },
      { id: 'p6-e3', date: '10 Jul 2026', time: '15:00', type: 'prescription', title: 'Receta emitida', description: 'Ketoprofeno 100mg si dolor post-limpieza. Enjuague con agua tibia y sal.', attachments: [] },
    ],
  ),
  p7: makeRecord(
    'Diego Flores Ríos', '78901234', '45',
    'https://images.pexels.com/photos/28442318/pexels-photo-28442318.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    7, '16 Sep 2026, 15:00 PM', 'Urgencia / Dolor Agudo',
    [
      { id: 'p7-e1', date: '16 Sep 2026', time: '15:00', type: 'evolution', title: 'Atención de urgencia', description: 'Paciente con trauma dental en pieza 11 por accidente deportivo. Se evalúa vitalidad pulpar y se estabiliza.', attachments: [] },
      { id: 'p7-e2', date: '16 Sep 2026', time: '15:20', type: 'xray', title: 'Radiografía periapical', description: 'Radiografía de pieza 11 muestra fractura de esmalte sin compromiso radicular. Sin luxación.', attachments: [XRAY_IMG_3] },
      { id: 'p7-e3', date: '16 Sep 2026', time: '15:35', type: 'prescription', title: 'Receta emitida', description: 'Ibuprofeno 600mg c/8h por 5 días. Dieta blanda por 7 días. Control en 7 días.', attachments: [] },
      { id: 'p7-e4', date: '01 Jul 2026', time: '10:00', type: 'evolution', title: 'Control mensual', description: 'Control de ortodoncia. Ajuste de arco y cambio de ligaduras. Progreso satisfactorio.', attachments: [] },
    ],
  ),
  p8: makeRecord(
    'Patricia Romero Soto', '12345678', '31',
    'https://images.pexels.com/photos/7752788/pexels-photo-7752788.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    4, '17 Sep 2026, 08:30 AM', 'Limpieza Dental Profunda',
    [
      { id: 'p8-e1', date: '17 Sep 2026', time: '08:30', type: 'evolution', title: 'Evolución clínica', description: 'Limpieza profunda con técnica de raspaje. Se observa mejora en encías desde última visita.', attachments: [] },
      { id: 'p8-e2', date: '17 Sep 2026', time: '09:00', type: 'odontogram', title: 'Odontograma actualizado', description: 'Pieza 36 con restauración de amalgama en buen estado. Pieza 46 con composite reciente.', attachments: [CLINIC_IMG_2] },
      { id: 'p8-e3', date: '12 Ago 2026', time: '14:00', type: 'xray', title: 'Radiografía de control', description: 'Radiografía bite-wing de control. Sin nuevas lesiones cariosas.', attachments: [XRAY_IMG_1] },
    ],
  ),
  p9: makeRecord(
    'Fernando Quispe Huamán', '23456780', '37',
    'https://images.pexels.com/photos/14950779/pexels-photo-14950779.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    2, '17 Sep 2026, 10:00 AM', 'Consulta General',
    [
      { id: 'p9-e1', date: '17 Sep 2026', time: '10:00', type: 'evolution', title: 'Primera consulta', description: 'Paciente refiere sensibilidad al frío en piezas anteriores. Se diagnostica abrasión cervical por cepillado agresivo.', attachments: [] },
      { id: 'p9-e2', date: '17 Sep 2026', time: '10:20', type: 'prescription', title: 'Receta emitida', description: 'Pasta desensibilizante con nitrato de potasio 5%. Uso diario por 30 días.', attachments: [] },
    ],
  ),
  p10: makeRecord(
    'Rosa Vargas López', '34567891', '44',
    'https://images.pexels.com/photos/38707525/pexels-photo-38707525.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    9, '17 Sep 2026, 13:00 PM', 'Limpieza Dental Profunda',
    [
      { id: 'p10-e1', date: '17 Sep 2026', time: '13:00', type: 'evolution', title: 'Evolución clínica', description: 'Paciente con periodontitis crónica. Se realiza raspaje y alisado radicular en cuadrantes 1 y 2.', attachments: [] },
      { id: 'p10-e2', date: '17 Sep 2026', time: '13:30', type: 'xray', title: 'Radiografía panorámica', description: 'Pérdida ósea horizontal moderada en sector posterior. Bolsas periodontales de 4-5mm en piezas 16, 26, 36 y 46.', attachments: [XRAY_IMG_2, XRAY_IMG_3] },
      { id: 'p10-e3', date: '20 Ago 2026', time: '09:00', type: 'prescription', title: 'Receta emitida', description: 'Doxiciclina 100mg c/12h por 14 días. Clorhexidina 0.12% c/12h por 21 días.', attachments: [] },
      { id: 'p10-e4', date: '05 Ago 2026', time: '11:00', type: 'evolution', title: 'Control periodontal', description: 'Mejora significativa en sondaje. Reducción de bolsas a 3mm. Se mantiene plan de mantenimiento.', attachments: [] },
      { id: 'p10-e5', date: '10 Jul 2026', time: '15:00', type: 'tomography', title: 'Tomografía Cone Beam', description: 'Evaluación de pérdida ósea en sector anterior inferior. Hueso remanente suficiente para tratamiento regenerativo.', attachments: [XRAY_IMG_1] },
    ],
  ),
  p11: makeRecord(
    'Miguel Ángel Torres', '45678902', '33',
    'https://images.pexels.com/photos/13392786/pexels-photo-13392786.png?auto=compress&cs=tinysrgb&h=200&w=200',
    3, '17 Sep 2026, 17:00 PM', 'Urgencia / Dolor Agudo',
    [
      { id: 'p11-e1', date: '17 Sep 2026', time: '17:00', type: 'evolution', title: 'Atención de urgencia', description: 'Dolor agudo en pieza 38 (molar del juicio inferior). Se diagnostica pericoronitis. Se prescribió antibioticoterapia y se programó exodoncia.', attachments: [] },
      { id: 'p11-e2', date: '17 Sep 2026', time: '17:15', type: 'xray', title: 'Radiografía periapical', description: 'Pieza 38 impactada mesial, con signos de infección pericoronaria. Se recomienda extracción.', attachments: [XRAY_IMG_3] },
      { id: 'p11-e3', date: '17 Sep 2026', time: '17:30', type: 'prescription', title: 'Receta emitida', description: 'Amoxicilina 500mg c/8h por 7 días. Ibuprofeno 600mg c/8h por 5 días. Compresas frías externas.', attachments: [] },
    ],
  ),
  p12: makeRecord(
    'Sofía Castro Vega', '56789013', '27',
    'https://images.pexels.com/photos/35721594/pexels-photo-35721594.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    5, '18 Sep 2026, 09:30 AM', 'Consulta General',
    [
      { id: 'p12-e1', date: '18 Sep 2026', time: '09:30', type: 'evolution', title: 'Evolución clínica', description: 'Paciente en tratamiento de ortodoncia con alineadores invisibles. Se entregó juego 8 de 14. Progreso satisfactorio.', attachments: [] },
      { id: 'p12-e2', date: '18 Sep 2026', time: '10:00', type: 'odontogram', title: 'Odontograma de seguimiento', description: 'Movimiento dental según plan. Pieza 23 rotó 3mm como se esperaba. Alineadores en buen estado.', attachments: [CLINIC_IMG_1] },
      { id: 'p12-e3', date: '20 Ago 2026', time: '14:00', type: 'xray', title: 'Radiografía panorámica de control', description: 'Control de tratamiento ortodóncico. Sin complicaciones. Alineación según proyección.', attachments: [XRAY_IMG_1] },
    ],
  ),
  p13: makeRecord(
    'Andrés Paredes Soto', '67890124', '50',
    'https://images.pexels.com/photos/38740728/pexels-photo-38740728.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    11, '18 Sep 2026, 12:00 PM', 'Limpieza Dental Profunda',
    [
      { id: 'p13-e1', date: '18 Sep 2026', time: '12:00', type: 'evolution', title: 'Evolución clínica', description: 'Paciente con múltiples restauraciones. Profilaxis y pulido. Se revisan restauraciones existentes, todas en buen estado.', attachments: [] },
      { id: 'p13-e2', date: '18 Sep 2026', time: '12:30', type: 'xray', title: 'Radiografía panorámica anual', description: 'Control anual. Múltiples restauraciones coronales en piezas 14, 16, 24, 26, 36 y 46. Sin nuevas lesiones.', attachments: [XRAY_IMG_2] },
      { id: 'p13-e3', date: '15 Ago 2026', time: '09:00', type: 'prescription', title: 'Receta emitida', description: 'Flúor tópico semanal. Pasta dental con flúor 1450ppm.', attachments: [] },
      { id: 'p13-e4', date: '10 Jun 2026', time: '11:00', type: 'evolution', title: 'Cambio de restauración', description: 'Se reemplazó restauración desgastada en pieza 46. Se utilizó composite nanoparticulado.', attachments: [] },
    ],
  ),
  p14: makeRecord(
    'Mónica Salazar Ríos', '78901235', '36',
    'https://images.pexels.com/photos/8312669/pexels-photo-8312669.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    4, '18 Sep 2026, 15:30 PM', 'Urgencia / Dolor Agudo',
    [
      { id: 'p14-e1', date: '18 Sep 2026', time: '15:30', type: 'evolution', title: 'Atención de urgencia', description: 'Paciente con dolor en pieza 25. Se diagnostica pulpitis irreversible. Se inicia tratamiento de conductos.', attachments: [] },
      { id: 'p14-e2', date: '18 Sep 2026', time: '15:45', type: 'xray', title: 'Radiografía periapical', description: 'Caries profunda en pieza 25 con compromiso pulpar. Lesión periapical incipiente.', attachments: [XRAY_IMG_3] },
      { id: 'p14-e3', date: '18 Sep 2026', time: '16:30', type: 'prescription', title: 'Receta emitida', description: 'Amoxicilina 500mg c/8h por 7 días. Ibuprofeno 600mg c/8h por 5 días. Se cita para segunda sesión de endodoncia.', attachments: [] },
    ],
  ),
  p15: makeRecord(
    'Eduardo Ramírez Quispe', '89012346', '42',
    'https://images.pexels.com/photos/31420959/pexels-photo-31420959.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    6, '19 Sep 2026, 08:00 AM', 'Limpieza Dental Profunda',
    [
      { id: 'p15-e1', date: '19 Sep 2026', time: '08:00', type: 'evolution', title: 'Evolución clínica', description: 'Profilaxis completa. Paciente con hábito de tabaquismo, se observa tinción en piezas anteriores. Se realizó pulido con técnica de aire abrasivo.', attachments: [] },
      { id: 'p15-e2', date: '19 Sep 2026', time: '08:30', type: 'odontogram', title: 'Odontograma actualizado', description: 'Tinción por tabaco en piezas 11, 21, 31 y 41. Sin caries nuevas. Se recomienda cesación tabáquica.', attachments: [CLINIC_IMG_2] },
      { id: 'p15-e3', date: '05 Ago 2026', time: '10:00', type: 'xray', title: 'Radiografía panorámica', description: 'Control general. Sin patologías nuevas. Tinción dentaria visible pero sin compromiso estructural.', attachments: [XRAY_IMG_1] },
      { id: 'p15-e4', date: '10 Jul 2026', time: '14:00', type: 'prescription', title: 'Receta emitida', description: 'Pasta blanqueadora con peróxido de hidrógeno 10%. Uso nocturno por 14 días con férula.', attachments: [] },
    ],
  ),
  p16: makeRecord(
    'Valentina Rojas Cruz', '90123457', '25',
    'https://images.pexels.com/photos/34930167/pexels-photo-34930167.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    2, '19 Sep 2026, 10:00 AM', 'Consulta General',
    [
      { id: 'p16-e1', date: '19 Sep 2026', time: '10:00', type: 'evolution', title: 'Consulta inicial', description: 'Paciente joven interesada en blanqueamiento dental. Se evalúa viabilidad y se explica opciones de tratamiento.', attachments: [] },
      { id: 'p16-e2', date: '19 Sep 2026', time: '10:15', type: 'odontogram', title: 'Odontograma inicial', description: 'Piezas en excelente estado. Sin caries. Adecuada para blanqueamiento dental.', attachments: [CLINIC_IMG_1] },
    ],
  ),
  p17: makeRecord(
    'Hernán Cáceres López', '01234568', '48',
    'https://images.pexels.com/photos/5197205/pexels-photo-5197205.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    8, '19 Sep 2026, 14:30 PM', 'Urgencia / Dolor Agudo',
    [
      { id: 'p17-e1', date: '19 Sep 2026', time: '14:30', type: 'evolution', title: 'Atención de urgencia', description: 'Paciente con fractura coronaria en pieza 21 por mordida dura. Se realiza restauración con composite.', attachments: [] },
      { id: 'p17-e2', date: '19 Sep 2026', time: '14:45', type: 'xray', title: 'Radiografía periapical', description: 'Fractura coronaria sin compromiso radicular en pieza 21. Pulpa expuesta, se realizó tratamiento pulpar parcial.', attachments: [XRAY_IMG_3] },
      { id: 'p17-e3', date: '19 Sep 2026', time: '15:15', type: 'prescription', title: 'Receta emitida', description: 'Amoxicilina 500mg c/8h por 5 días. Paracetamol 500mg si dolor. Control en 15 días.', attachments: [] },
      { id: 'p17-e4', date: '01 Ago 2026', time: '09:00', type: 'evolution', title: 'Control de implante', description: 'Control de implante en pieza 36. Osteointegración correcta. Se programó colocación de corona.', attachments: [] },
      { id: 'p17-e5', date: '15 Jun 2026', time: '10:00', type: 'tomography', title: 'Tomografía Cone Beam', description: 'Evaluación post-extracción pieza 36. Volumen óseo adecuado para implante de 11mm.', attachments: [XRAY_IMG_2] },
    ],
  ),
  p18: makeRecord(
    'Daniela Pinto Vargas', '12345679', '30',
    'https://images.pexels.com/photos/25651531/pexels-photo-25651531.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    3, '19 Sep 2026, 16:30 PM', 'Limpieza Dental Profunda',
    [
      { id: 'p18-e1', date: '19 Sep 2026', time: '16:30', type: 'evolution', title: 'Evolución clínica', description: 'Paciente con brackets. Profilaxis con énfasis en higiene alrededor de brackets. Se refuerza técnica de cepillado.', attachments: [] },
      { id: 'p18-e2', date: '19 Sep 2026', time: '17:00', type: 'odontogram', title: 'Odontograma de control', description: 'Brackets en piezas 14-24 y 34-44. Sin caries alrededor de brackets. Higiene mejorada desde última visita.', attachments: [CLINIC_IMG_2] },
      { id: 'p18-e3', date: '10 Ago 2026', time: '11:00', type: 'prescription', title: 'Receta emitida', description: 'Clorhexidina 0.12% c/12h por 7 días. Cepillo ortodóncico e hilo super floss.', attachments: [] },
    ],
  ),
  p19: makeRecord(
    'Ricardo Soto Fernández', '23456791', '39',
    'https://images.pexels.com/photos/11156392/pexels-photo-11156392.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    5, '20 Sep 2026, 09:00 AM', 'Consulta General',
    [
      { id: 'p19-e1', date: '20 Sep 2026', time: '09:00', type: 'evolution', title: 'Evolución clínica', description: 'Paciente acude por consulta de rutina. Se evalúa estado general, todo en orden. Se recomienda control en 6 meses.', attachments: [] },
      { id: 'p19-e2', date: '20 Sep 2026', time: '09:20', type: 'xray', title: 'Radiografía panorámica anual', description: 'Control anual sin hallazgos patológicos. Terceras molares erupcionadas y funcionales.', attachments: [XRAY_IMG_1] },
      { id: 'p19-e3', date: '15 Jul 2026', time: '14:00', type: 'prescription', title: 'Receta emitida', description: 'Pasta con flúor 1450ppm. Enjuague bucal sin alcohol para uso diario.', attachments: [] },
    ],
  ),
  p20: makeRecord(
    'Gabriela Núñez Cruz', '34567892', '35',
    'https://images.pexels.com/photos/35725749/pexels-photo-35725749.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    4, '20 Sep 2026, 11:30 AM', 'Limpieza Dental Profunda',
    [
      { id: 'p20-e1', date: '20 Sep 2026', time: '11:30', type: 'evolution', title: 'Evolución clínica', description: 'Profilaxis profunda con detartraje supragingival y subgingival. Aplicación de flúor tópico al finalizar.', attachments: [] },
      { id: 'p20-e2', date: '20 Sep 2026', time: '12:00', type: 'odontogram', title: 'Odontograma actualizado', description: 'Piezas en buen estado. Se observa leve tinción por té en piezas anteriores. Sin caries activas.', attachments: [CLINIC_IMG_1] },
      { id: 'p20-e3', date: '05 Ago 2026', time: '10:00', type: 'prescription', title: 'Receta emitida', description: 'Pasta blanqueadora tópica. Reducir consumo de té y café.', attachments: [] },
    ],
  ),
};

export function getPatientRecord(id: string): PatientClinicalRecord | undefined {
  const record = PATIENT_RECORDS[id];
  if (record) {
    return { ...record, id };
  }
  return undefined;
}

export const DEFAULT_VIEW: CalendarView = 'day';
