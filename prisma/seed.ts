import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...\n');

  // Create roles
  console.log('Creating roles...');
  const roles = await Promise.all([
    prisma.roles.upsert({
      where: { name: 'Patient' },
      update: {},
      create: { name: 'Patient' },
    }),
    prisma.roles.upsert({
      where: { name: 'Clinician' },
      update: {},
      create: { name: 'Clinician' },
    }),
    prisma.roles.upsert({
      where: { name: 'Admin' },
      update: {},
      create: { name: 'Admin' },
    }),
    prisma.roles.upsert({
      where: { name: 'LabTechnician' },
      update: {},
      create: { name: 'LabTechnician' },
    }),
  ]);
  console.log('✅ Roles created\n');

  const patientRole = roles.find(r => r.name === 'Patient')!;
  const clinicianRole = roles.find(r => r.name === 'Clinician')!;
  const adminRole = roles.find(r => r.name === 'Admin')!;
  const labTechnicianRole = roles.find(r => r.name === 'LabTechnician')!;

  // Create permissions
  console.log('Creating permissions...');
  const permissionsData = [
    // Dashboard
    { name: 'view_dashboard', description: 'Access to view the dashboard', category: 'dashboard' },
    { name: 'view_analytics', description: 'Access to view analytics and reports', category: 'dashboard' },
    // User Management
    { name: 'view_users', description: 'View user list and details', category: 'users' },
    { name: 'manage_users', description: 'Create, edit, and manage user accounts', category: 'users' },
    { name: 'deactivate_users', description: 'Activate or deactivate user accounts', category: 'users' },
    { name: 'assign_roles', description: 'Assign roles to users', category: 'users' },
    // Appointments
    { name: 'view_appointments', description: 'View appointment schedules', category: 'appointments' },
    { name: 'create_appointments', description: 'Create new appointments', category: 'appointments' },
    { name: 'edit_appointments', description: 'Modify existing appointments', category: 'appointments' },
    { name: 'cancel_appointments', description: 'Cancel appointments', category: 'appointments' },
    { name: 'manage_slots', description: 'Create and manage appointment slots', category: 'appointments' },
    // Patient Records
    { name: 'view_patient_records', description: 'View patient medical records', category: 'patients' },
    { name: 'edit_patient_records', description: 'Edit patient medical records', category: 'patients' },
    { name: 'view_own_records', description: 'View own medical records (patients)', category: 'patients' },
    { name: 'create_encounters', description: 'Create new patient encounters', category: 'patients' },
    { name: 'add_soap_notes', description: 'Add SOAP notes to encounters', category: 'patients' },
    { name: 'prescribe_medications', description: 'Create prescriptions for patients', category: 'patients' },
    // Lab
    { name: 'view_lab_orders', description: 'View lab orders', category: 'lab' },
    { name: 'create_lab_orders', description: 'Create new lab orders', category: 'lab' },
    { name: 'process_lab_results', description: 'Enter and process lab results', category: 'lab' },
    { name: 'verify_lab_results', description: 'Verify and approve lab results', category: 'lab' },
    { name: 'view_own_lab_results', description: 'View own lab results (patients)', category: 'lab' },
    // Billing
    { name: 'view_invoices', description: 'View billing invoices', category: 'billing' },
    { name: 'create_invoices', description: 'Create new invoices', category: 'billing' },
    { name: 'edit_invoices', description: 'Edit existing invoices', category: 'billing' },
    { name: 'process_payments', description: 'Process invoice payments', category: 'billing' },
    { name: 'view_own_invoices', description: 'View own invoices (patients)', category: 'billing' },
    // System
    { name: 'view_audit_logs', description: 'View system audit logs', category: 'system' },
    { name: 'manage_roles', description: 'Create and edit roles', category: 'system' },
    { name: 'manage_permissions', description: 'Assign permissions to roles', category: 'system' },
    { name: 'system_settings', description: 'Access system configuration settings', category: 'system' },
  ];

  const createdPermissions: { id: string; name: string }[] = [];
  for (const perm of permissionsData) {
    // Check if permission exists
    const existing = await prisma.permissions.findUnique({
      where: { name: perm.name },
    });

    let permission;
    if (existing) {
      permission = await prisma.permissions.update({
        where: { name: perm.name },
        data: { description: perm.description, category: perm.category },
      });
    } else {
      permission = await prisma.permissions.create({
        data: {
          id: randomUUID(),
          ...perm,
        },
      });
    }
    createdPermissions.push({ id: permission.id, name: permission.name });
  }
  console.log('✅ Permissions created\n');

  // Assign permissions to roles
  console.log('Assigning permissions to roles...');

  // Helper to get permission IDs by names
  const getPermIds = (names: string[]) =>
    createdPermissions.filter(p => names.includes(p.name)).map(p => p.id);

  // Admin gets ALL permissions
  const adminPermIds = createdPermissions.map(p => p.id);

  // Clinician permissions
  const clinicianPermNames = [
    'view_dashboard', 'view_analytics',
    'view_appointments', 'create_appointments', 'edit_appointments', 'cancel_appointments', 'manage_slots',
    'view_patient_records', 'edit_patient_records', 'create_encounters', 'add_soap_notes', 'prescribe_medications',
    'view_lab_orders', 'create_lab_orders', 'verify_lab_results',
    'view_invoices', 'create_invoices',
  ];
  const clinicianPermIds = getPermIds(clinicianPermNames);

  // Patient permissions (limited to own data)
  const patientPermNames = [
    'view_dashboard',
    'view_appointments', 'create_appointments', 'cancel_appointments',
    'view_own_records',
    'view_own_lab_results',
    'view_own_invoices',
  ];
  const patientPermIds = getPermIds(patientPermNames);

  // Lab Technician permissions
  const labTechPermNames = [
    'view_dashboard',
    'view_lab_orders', 'process_lab_results',
    'view_patient_records',
  ];
  const labTechPermIds = getPermIds(labTechPermNames);

  // Clear existing role_permissions and insert new ones
  await prisma.role_permissions.deleteMany({});

  const rolePermData = [
    ...adminPermIds.map(pid => ({ id: randomUUID(), role_id: adminRole.id, permission_id: pid })),
    ...clinicianPermIds.map(pid => ({ id: randomUUID(), role_id: clinicianRole.id, permission_id: pid })),
    ...patientPermIds.map(pid => ({ id: randomUUID(), role_id: patientRole.id, permission_id: pid })),
    ...labTechPermIds.map(pid => ({ id: randomUUID(), role_id: labTechnicianRole.id, permission_id: pid })),
  ];

  await prisma.role_permissions.createMany({
    data: rolePermData,
    skipDuplicates: true,
  });
  console.log('✅ Role permissions assigned\n');

  // Hash password
  const passwordHash = await bcrypt.hash('password123', 10);

  // Create demo users
  console.log('Creating demo users...');

  // Helper function for user upsert with explicit ID
  async function upsertUser(email: string, data: {
    password_hash: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    role_id: number;
    is_active?: boolean;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  }) {
    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return existing;
    }
    return prisma.users.create({
      data: {
        id: randomUUID(),
        email,
        password_hash: data.password_hash,
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number,
        role_id: data.role_id,
        is_active: data.is_active,
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
      },
    });
  }

  // Patient
  const patient = await upsertUser('patient@citycare.com', {
    password_hash: passwordHash,
    first_name: 'Demo',
    last_name: 'Patient',
    phone_number: '+1234567890',
    role_id: patientRole.id,
    is_active: true,
    address: '123 Health Avenue',
    city: 'Lagos',
    state: 'Lagos State',
    zip_code: '100001',
  });
  console.log(`  ✅ Patient: patient@citycare.com`);

  // Additional patients
  const patient2 = await upsertUser('john.doe@citycare.com', {
    password_hash: passwordHash,
    first_name: 'John',
    last_name: 'Doe',
    phone_number: '+1234567891',
    role_id: patientRole.id,
    is_active: true,
  });
  console.log(`  ✅ Patient: john.doe@citycare.com`);

  const patient3 = await upsertUser('jane.smith@citycare.com', {
    password_hash: passwordHash,
    first_name: 'Jane',
    last_name: 'Smith',
    phone_number: '+1234567892',
    role_id: patientRole.id,
    is_active: true,
  });
  console.log(`  ✅ Patient: jane.smith@citycare.com`);

  // Clinicians
  const clinician = await upsertUser('clinician@citycare.com', {
    password_hash: passwordHash,
    first_name: 'Dr. Sarah',
    last_name: 'Johnson',
    phone_number: '+1987654321',
    role_id: clinicianRole.id,
    is_active: true,
  });
  console.log(`  ✅ Clinician: clinician@citycare.com`);

  const clinician2 = await upsertUser('dr.williams@citycare.com', {
    password_hash: passwordHash,
    first_name: 'Dr. Michael',
    last_name: 'Williams',
    phone_number: '+1987654322',
    role_id: clinicianRole.id,
    is_active: true,
  });
  console.log(`  ✅ Clinician: dr.williams@citycare.com`);

  // Admin
  const admin = await upsertUser('admin@citycare.com', {
    password_hash: passwordHash,
    first_name: 'System',
    last_name: 'Admin',
    phone_number: '+1555555555',
    role_id: adminRole.id,
    is_active: true,
  });
  console.log(`  ✅ Admin: admin@citycare.com`);

  // Lab Technician
  const labTechnician = await upsertUser('technician@citycare.com', {
    password_hash: passwordHash,
    first_name: 'Peter',
    last_name: 'Parker',
    phone_number: '+1666666666',
    role_id: labTechnicianRole.id,
    is_active: true,
  });
  console.log(`  ✅ LabTechnician: technician@citycare.com\n`);

  // Create patient charts
  console.log('Creating patient charts...');

  // Helper function for chart upsert with explicit ID
  async function upsertChart(patientId: string, data: { blood_type: string; dob: Date }) {
    const existing = await prisma.patient_charts.findUnique({ where: { patient_id: patientId } });
    if (existing) {
      return existing;
    }
    return prisma.patient_charts.create({
      data: {
        id: randomUUID(),
        patient_id: patientId,
        ...data,
      },
    });
  }

  const chart1 = await upsertChart(patient.id, {
    blood_type: 'O+',
    dob: new Date('1990-05-15'),
  });

  const chart2 = await upsertChart(patient2.id, {
    blood_type: 'A+',
    dob: new Date('1985-08-22'),
  });

  const chart3 = await upsertChart(patient3.id, {
    blood_type: 'B-',
    dob: new Date('1992-03-10'),
  });
  console.log('✅ Patient charts created\n');

  // Create allergies
  console.log('Creating allergies...');
  await prisma.patient_allergies.createMany({
    data: [
      { id: randomUUID(), chart_id: chart1.id, allergen_name: 'Penicillin', severity: 'High' },
      { id: randomUUID(), chart_id: chart1.id, allergen_name: 'Peanuts', severity: 'Moderate' },
      { id: randomUUID(), chart_id: chart2.id, allergen_name: 'Sulfa drugs', severity: 'High' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Allergies created\n');

  // Create appointment slots for clinicians
  console.log('Creating appointment slots...');
  const today = new Date();
  const slots: { clinician_id: string; start: Date; end: Date; isToday: boolean }[] = [];

  // TODAY's slots (so clinicians see appointments on their dashboard)
  const todaySlots = [
    { hour: 9, minute: 0, clinicianRef: clinician },
    { hour: 10, minute: 0, clinicianRef: clinician },
    { hour: 11, minute: 0, clinicianRef: clinician },
    { hour: 14, minute: 0, clinicianRef: clinician },
    { hour: 15, minute: 0, clinicianRef: clinician2 },
    { hour: 16, minute: 0, clinicianRef: clinician2 },
  ];

  for (const ts of todaySlots) {
    const startTime = new Date(today);
    startTime.setHours(ts.hour, ts.minute, 0, 0);
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + 30);

    slots.push({
      clinician_id: ts.clinicianRef.id,
      start: startTime,
      end: endTime,
      isToday: true,
    });
  }

  // Create slots for the next 7 days
  for (let day = 1; day <= 7; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);

    // Morning slots (9 AM - 12 PM)
    for (let hour = 9; hour < 12; hour++) {
      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(30);

      slots.push({
        clinician_id: clinician.id,
        start: startTime,
        end: endTime,
        isToday: false,
      });

      const startTime2 = new Date(date);
      startTime2.setHours(hour, 30, 0, 0);
      const endTime2 = new Date(startTime2);
      endTime2.setMinutes(60);

      slots.push({
        clinician_id: clinician.id,
        start: startTime2,
        end: endTime2,
        isToday: false,
      });
    }

    // Afternoon slots (2 PM - 5 PM)
    for (let hour = 14; hour < 17; hour++) {
      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(30);

      slots.push({
        clinician_id: clinician2.id,
        start: startTime,
        end: endTime,
        isToday: false,
      });
    }
  }

  // Insert slots using raw SQL due to tstzrange type
  const insertedSlotIds: string[] = [];
  for (const slot of slots.slice(0, 30)) { // Limit to 30 slots for demo
    try {
      const slotId = randomUUID();
      const startIso = slot.start.toISOString();
      const endIso = slot.end.toISOString();
      const result = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO appt_slots (id, clinician_id, time_range, status)
        VALUES (${slotId}::uuid, ${slot.clinician_id}::uuid, tstzrange(${startIso}::timestamptz, ${endIso}::timestamptz), 'Available')
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      if (result.length > 0) {
        insertedSlotIds.push(result[0].id);
      }
    } catch (e) {
      console.error('Error inserting slot:', e);
    }
  }
  console.log(`✅ Appointment slots created (${insertedSlotIds.length} slots)\n`);

  // Create bookings - multiple for today so dashboards are populated
  console.log('Creating sample bookings...');
  const availableSlots = await prisma.$queryRaw<any[]>`
    SELECT id, clinician_id FROM appt_slots WHERE status = 'Available' ORDER BY time_range LIMIT 6
  `;

  const bookingData = [
    { patientRef: patient, reason: 'Annual checkup', status: 'Confirmed' },
    { patientRef: patient2, reason: 'Follow-up consultation', status: 'Confirmed' },
    { patientRef: patient3, reason: 'Prescription refill', status: 'Pending' },
    { patientRef: patient, reason: 'Blood pressure monitoring', status: 'Confirmed' },
    { patientRef: patient2, reason: 'Diabetes management', status: 'Pending' },
  ];

  for (let i = 0; i < Math.min(availableSlots.length, bookingData.length); i++) {
    try {
      await prisma.appt_bookings.create({
        data: {
          id: randomUUID(),
          patient_id: bookingData[i].patientRef.id,
          slot_id: availableSlots[i].id,
          status: bookingData[i].status,
          reason_for_visit: bookingData[i].reason,
          is_walk_in: false,
        },
      });
      await prisma.$executeRaw`UPDATE appt_slots SET status = 'Booked' WHERE id = ${availableSlots[i].id}::uuid`;
    } catch (e) {
      // Skip if booking already exists
    }
  }
  console.log('✅ Sample bookings created\n');

  // Create encounters - including one "Open" for active patient visibility
  console.log('Creating patient encounters...');
  const encounter1 = await prisma.patient_encounters.create({
    data: {
      id: randomUUID(),
      chart_id: chart1.id,
      clinician_id: clinician.id,
      status: 'Closed',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
  });

  const encounter2 = await prisma.patient_encounters.create({
    data: {
      id: randomUUID(),
      chart_id: chart2.id,
      clinician_id: clinician.id,
      status: 'Closed',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  });

  // Open encounter for active patient (shows in clinician's current patients)
  const encounter3 = await prisma.patient_encounters.create({
    data: {
      id: randomUUID(),
      chart_id: chart3.id,
      clinician_id: clinician.id,
      status: 'Open',
      date: new Date(), // Today
    },
  });

  // Another recent encounter
  const encounter4 = await prisma.patient_encounters.create({
    data: {
      id: randomUUID(),
      chart_id: chart1.id,
      clinician_id: clinician2.id,
      status: 'Closed',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
    },
  });
  console.log('✅ Encounters created\n');

  // Create SOAP notes
  console.log('Creating SOAP notes...');
  await prisma.patient_notes_soap.createMany({
    data: [
      {
        id: randomUUID(),
        encounter_id: encounter1.id,
        subjective: 'Patient reports mild headache and fatigue for the past 3 days.',
        objective: 'Vitals: BP 120/80, HR 72, Temp 98.6°F. Alert and oriented.',
        assessment: 'Tension headache, likely stress-related.',
        plan: 'Recommended OTC pain relief, stress management, follow-up in 2 weeks if symptoms persist.',
        vitals: { bloodPressure: '120/80', heartRate: '72', temperature: '98.6', weight: '70' },
      },
      {
        id: randomUUID(),
        encounter_id: encounter2.id,
        subjective: 'Patient here for diabetes management follow-up.',
        objective: 'Vitals: BP 130/85, HR 78. Recent A1C: 7.2%',
        assessment: 'Type 2 Diabetes Mellitus - moderately controlled.',
        plan: 'Continue current medication. Diet and exercise counseling provided.',
        vitals: { bloodPressure: '130/85', heartRate: '78', temperature: '98.4', weight: '82' },
      },
      {
        id: randomUUID(),
        encounter_id: encounter3.id,
        subjective: 'New patient presenting with persistent cough for 1 week.',
        objective: 'Vitals: BP 118/76, HR 80, Temp 99.1°F. Lungs clear, mild throat erythema.',
        assessment: 'Upper respiratory infection, likely viral.',
        plan: 'Rest, fluids, symptomatic treatment. Return if fever persists or symptoms worsen.',
        vitals: { bloodPressure: '118/76', heartRate: '80', temperature: '99.1', weight: '65' },
      },
      {
        id: randomUUID(),
        encounter_id: encounter4.id,
        subjective: 'Follow-up for medication adjustment.',
        objective: 'Vitals: BP 125/82, HR 70, Temp 98.4°F.',
        assessment: 'Hypertension - well controlled on current regimen.',
        plan: 'Continue current medications. Recheck BP in 3 months.',
        vitals: { bloodPressure: '125/82', heartRate: '70', temperature: '98.4', weight: '71' },
      },
    ],
  });
  console.log('✅ SOAP notes created\n');

  // Create prescriptions
  console.log('Creating prescriptions...');
  await prisma.patient_prescriptions.createMany({
    data: [
      {
        id: randomUUID(),
        encounter_id: encounter1.id,
        medication_name: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'Every 6 hours as needed',
        duration: '7 days',
      },
      {
        id: randomUUID(),
        encounter_id: encounter2.id,
        medication_name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily with meals',
        duration: '90 days',
      },
      {
        id: randomUUID(),
        encounter_id: encounter2.id,
        medication_name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '90 days',
      },
    ],
  });
  console.log('✅ Prescriptions created\n');

  // Create lab orders - variety for lab dashboard (pending, STAT, completed)
  console.log('Creating lab orders...');
  const labOrder1 = await prisma.lab_orders.create({
    data: {
      id: randomUUID(),
      encounter_id: encounter1.id,
      priority: 'Routine',
      status: 'Completed',
    },
  });

  const labOrder2 = await prisma.lab_orders.create({
    data: {
      id: randomUUID(),
      encounter_id: encounter2.id,
      priority: 'STAT',
      status: 'Pending',
    },
  });

  const labOrder3 = await prisma.lab_orders.create({
    data: {
      id: randomUUID(),
      encounter_id: encounter2.id,
      priority: 'Routine',
      status: 'Ordered',
    },
  });

  // Additional lab orders for more dashboard data
  const labOrder4 = await prisma.lab_orders.create({
    data: {
      id: randomUUID(),
      encounter_id: encounter3.id,
      priority: 'STAT',
      status: 'InProgress',
    },
  });

  const labOrder5 = await prisma.lab_orders.create({
    data: {
      id: randomUUID(),
      encounter_id: encounter4.id,
      priority: 'Routine',
      status: 'Completed',
    },
  });

  const labOrder6 = await prisma.lab_orders.create({
    data: {
      id: randomUUID(),
      encounter_id: encounter3.id,
      priority: 'Routine',
      status: 'Pending',
    },
  });
  console.log('✅ Lab orders created\n');

  // Create lab test items
  console.log('Creating lab test items...');
  const testItem1 = await prisma.lab_test_items.create({
    data: { id: randomUUID(), order_id: labOrder1.id, test_name: 'Complete Blood Count (CBC)' },
  });
  const testItem2 = await prisma.lab_test_items.create({
    data: { id: randomUUID(), order_id: labOrder1.id, test_name: 'Basic Metabolic Panel' },
  });
  const testItem3 = await prisma.lab_test_items.create({
    data: { id: randomUUID(), order_id: labOrder2.id, test_name: 'Hemoglobin A1C' },
  });
  const testItem4 = await prisma.lab_test_items.create({
    data: { id: randomUUID(), order_id: labOrder2.id, test_name: 'Lipid Panel' },
  });
  const testItem5 = await prisma.lab_test_items.create({
    data: { id: randomUUID(), order_id: labOrder3.id, test_name: 'Urinalysis' },
  });
  // Additional test items for new lab orders
  const testItem6 = await prisma.lab_test_items.create({
    data: { id: randomUUID(), order_id: labOrder4.id, test_name: 'COVID-19 PCR' },
  });
  const testItem7 = await prisma.lab_test_items.create({
    data: { id: randomUUID(), order_id: labOrder4.id, test_name: 'Influenza A/B' },
  });
  const testItem8 = await prisma.lab_test_items.create({
    data: { id: randomUUID(), order_id: labOrder5.id, test_name: 'Comprehensive Metabolic Panel' },
  });
  const testItem9 = await prisma.lab_test_items.create({
    data: { id: randomUUID(), order_id: labOrder6.id, test_name: 'Thyroid Panel (TSH, T3, T4)' },
  });
  console.log('✅ Lab test items created\n');

  // Create lab results - mix of verified and unverified for lab dashboard
  console.log('Creating lab results...');
  await prisma.lab_results.createMany({
    data: [
      {
        id: randomUUID(),
        test_item_id: testItem1.id,
        result_value: 'WBC: 7.5, RBC: 4.8, Hgb: 14.2, Hct: 42%',
        abnormality_flag: 'Normal',
        is_verified: true,
        verified_by: clinician.id,
      },
      {
        id: randomUUID(),
        test_item_id: testItem2.id,
        result_value: 'Glucose: 95, BUN: 15, Creatinine: 1.0',
        abnormality_flag: 'Normal',
        is_verified: true,
        verified_by: clinician.id,
      },
      {
        id: randomUUID(),
        test_item_id: testItem3.id,
        result_value: '7.2%',
        abnormality_flag: 'High',
        is_verified: false,
      },
      {
        id: randomUUID(),
        test_item_id: testItem8.id,
        result_value: 'Glucose: 110, BUN: 18, Creatinine: 0.9, Na: 140, K: 4.2',
        abnormality_flag: 'Normal',
        is_verified: true,
        verified_by: clinician2.id,
      },
      {
        id: randomUUID(),
        test_item_id: testItem4.id,
        result_value: 'Total Chol: 220, LDL: 140, HDL: 45, Triglycerides: 175',
        abnormality_flag: 'High',
        is_verified: false,
      },
    ],
  });
  console.log('✅ Lab results created\n');

  // Create invoices
  console.log('Creating billing invoices...');
  const invoice1 = await prisma.billing_invoices.create({
    data: {
      id: randomUUID(),
      patient_id: patient.id,
      encounter_id: encounter1.id,
      total_amount: 150.00,
      status: 'Paid',
    },
  });

  const invoice2 = await prisma.billing_invoices.create({
    data: {
      id: randomUUID(),
      patient_id: patient2.id,
      encounter_id: encounter2.id,
      total_amount: 275.00,
      status: 'Unpaid',
    },
  });

  const invoice3 = await prisma.billing_invoices.create({
    data: {
      id: randomUUID(),
      patient_id: patient.id,
      total_amount: 50.00,
      status: 'Unpaid',
    },
  });
  console.log('✅ Invoices created\n');

  // Create line items
  console.log('Creating billing line items...');
  await prisma.billing_line_items.createMany({
    data: [
      { id: randomUUID(), invoice_id: invoice1.id, description: 'Office Visit', cost: 100.00 },
      { id: randomUUID(), invoice_id: invoice1.id, description: 'Lab Work - CBC', cost: 50.00 },
      { id: randomUUID(), invoice_id: invoice2.id, description: 'Office Visit', cost: 100.00 },
      { id: randomUUID(), invoice_id: invoice2.id, description: 'Lab Work - A1C', cost: 75.00 },
      { id: randomUUID(), invoice_id: invoice2.id, description: 'Lab Work - Lipid Panel', cost: 100.00 },
      { id: randomUUID(), invoice_id: invoice3.id, description: 'Prescription Refill Fee', cost: 50.00 },
    ],
  });
  console.log('✅ Line items created\n');

  // Create audit logs
  console.log('Creating audit logs...');
  const now = new Date();
  await prisma.system_audit_logs.createMany({
    data: [
      {
        table_name: 'users',
        record_id: patient.id,
        action: 'INSERT',
        old_data: Prisma.JsonNull,
        new_data: { email: 'patient@citycare.com', first_name: 'Demo', last_name: 'Patient', role: 'Patient' },
        changed_by: admin.id,
        changed_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        table_name: 'users',
        record_id: clinician.id,
        action: 'INSERT',
        old_data: Prisma.JsonNull,
        new_data: { email: 'clinician@citycare.com', first_name: 'Dr. Sarah', last_name: 'Johnson', role: 'Clinician' },
        changed_by: admin.id,
        changed_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        table_name: 'users',
        record_id: patient2.id,
        action: 'UPDATE',
        old_data: { is_active: false },
        new_data: { is_active: true },
        changed_by: admin.id,
        changed_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        table_name: 'appt_bookings',
        record_id: patient.id, // Using patient ID as placeholder
        action: 'INSERT',
        old_data: Prisma.JsonNull,
        new_data: { patient: 'Demo Patient', clinician: 'Dr. Sarah Johnson', status: 'Confirmed' },
        changed_by: patient.id,
        changed_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
      {
        table_name: 'lab_orders',
        record_id: labOrder1.id,
        action: 'INSERT',
        old_data: Prisma.JsonNull,
        new_data: { priority: 'Routine', status: 'Ordered', tests: ['CBC', 'BMP'] },
        changed_by: clinician.id,
        changed_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        table_name: 'lab_orders',
        record_id: labOrder1.id,
        action: 'UPDATE',
        old_data: { status: 'Ordered' },
        new_data: { status: 'Completed' },
        changed_by: labTechnician.id,
        changed_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        table_name: 'lab_results',
        record_id: labOrder1.id, // Using lab order ID as placeholder
        action: 'INSERT',
        old_data: Prisma.JsonNull,
        new_data: { test: 'CBC', result: 'Normal', verified: true },
        changed_by: labTechnician.id,
        changed_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        table_name: 'patient_prescriptions',
        record_id: encounter1.id, // Using encounter ID as placeholder
        action: 'INSERT',
        old_data: Prisma.JsonNull,
        new_data: { medication: 'Ibuprofen', dosage: '400mg', frequency: 'Every 6 hours' },
        changed_by: clinician.id,
        changed_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        table_name: 'users',
        record_id: labTechnician.id,
        action: 'UPDATE',
        old_data: { phone_number: '+1666666666' },
        new_data: { phone_number: '+1666666667' },
        changed_by: labTechnician.id,
        changed_at: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
      },
      {
        table_name: 'appt_bookings',
        record_id: patient2.id, // Using patient2 ID as placeholder
        action: 'UPDATE',
        old_data: { status: 'Pending' },
        new_data: { status: 'Confirmed' },
        changed_by: clinician.id,
        changed_at: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
      },
      {
        table_name: 'lab_orders',
        record_id: labOrder2.id,
        action: 'UPDATE',
        old_data: { status: 'Pending' },
        new_data: { status: 'InProgress' },
        changed_by: labTechnician.id,
        changed_at: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
      },
      {
        table_name: 'billing_invoices',
        record_id: invoice1.id,
        action: 'UPDATE',
        old_data: { status: 'Unpaid' },
        new_data: { status: 'Paid' },
        changed_by: admin.id,
        changed_at: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        table_name: 'patient_encounters',
        record_id: encounter3.id,
        action: 'INSERT',
        old_data: Prisma.JsonNull,
        new_data: { patient: 'Jane Smith', clinician: 'Dr. Sarah Johnson', status: 'Open' },
        changed_by: clinician.id,
        changed_at: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      {
        table_name: 'users',
        record_id: admin.id,
        action: 'UPDATE',
        old_data: { last_login: 'none' },
        new_data: { last_login: new Date().toISOString() },
        changed_by: admin.id,
        changed_at: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
      },
    ],
  });
  console.log('✅ Audit logs created\n');

  console.log('========================================');
  console.log('🎉 Seed completed successfully!');
  console.log('========================================\n');
  console.log('Demo Accounts (password: password123):');
  console.log('----------------------------------------');
  console.log('Patient:   patient@citycare.com');
  console.log('Patient:   john.doe@citycare.com');
  console.log('Patient:       jane.smith@citycare.com');
  console.log('Clinician:     clinician@citycare.com');
  console.log('Clinician:     dr.williams@citycare.com');
  console.log('Admin:         admin@citycare.com');
  console.log('LabTechnician: technician@citycare.com');
  console.log('----------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
