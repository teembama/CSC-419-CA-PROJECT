import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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
  ]);
  console.log('✅ Roles created\n');

  const patientRole = roles.find(r => r.name === 'Patient')!;
  const clinicianRole = roles.find(r => r.name === 'Clinician')!;
  const adminRole = roles.find(r => r.name === 'Admin')!;

  // Hash password
  const passwordHash = await bcrypt.hash('password123', 10);

  // Create demo users
  console.log('Creating demo users...');

  // Patient
  const patient = await prisma.users.upsert({
    where: { email: 'patient@citycare.com' },
    update: {},
    create: {
      email: 'patient@citycare.com',
      password_hash: passwordHash,
      first_name: 'Demo',
      last_name: 'Patient',
      phone_number: '+1234567890',
      role_id: patientRole.id,
      is_active: true,
    },
  });
  console.log(`  ✅ Patient: patient@citycare.com`);

  // Additional patients
  const patient2 = await prisma.users.upsert({
    where: { email: 'john.doe@citycare.com' },
    update: {},
    create: {
      email: 'john.doe@citycare.com',
      password_hash: passwordHash,
      first_name: 'John',
      last_name: 'Doe',
      phone_number: '+1234567891',
      role_id: patientRole.id,
      is_active: true,
    },
  });
  console.log(`  ✅ Patient: john.doe@citycare.com`);

  const patient3 = await prisma.users.upsert({
    where: { email: 'jane.smith@citycare.com' },
    update: {},
    create: {
      email: 'jane.smith@citycare.com',
      password_hash: passwordHash,
      first_name: 'Jane',
      last_name: 'Smith',
      phone_number: '+1234567892',
      role_id: patientRole.id,
      is_active: true,
    },
  });
  console.log(`  ✅ Patient: jane.smith@citycare.com`);

  // Clinicians
  const clinician = await prisma.users.upsert({
    where: { email: 'clinician@citycare.com' },
    update: {},
    create: {
      email: 'clinician@citycare.com',
      password_hash: passwordHash,
      first_name: 'Dr. Sarah',
      last_name: 'Johnson',
      phone_number: '+1987654321',
      role_id: clinicianRole.id,
      is_active: true,
    },
  });
  console.log(`  ✅ Clinician: clinician@citycare.com`);

  const clinician2 = await prisma.users.upsert({
    where: { email: 'dr.williams@citycare.com' },
    update: {},
    create: {
      email: 'dr.williams@citycare.com',
      password_hash: passwordHash,
      first_name: 'Dr. Michael',
      last_name: 'Williams',
      phone_number: '+1987654322',
      role_id: clinicianRole.id,
      is_active: true,
    },
  });
  console.log(`  ✅ Clinician: dr.williams@citycare.com`);

  // Admin
  const admin = await prisma.users.upsert({
    where: { email: 'admin@citycare.com' },
    update: {},
    create: {
      email: 'admin@citycare.com',
      password_hash: passwordHash,
      first_name: 'System',
      last_name: 'Admin',
      phone_number: '+1555555555',
      role_id: adminRole.id,
      is_active: true,
    },
  });
  console.log(`  ✅ Admin: admin@citycare.com\n`);

  // Create patient charts
  console.log('Creating patient charts...');
  const chart1 = await prisma.patient_charts.upsert({
    where: { patient_id: patient.id },
    update: {},
    create: {
      patient_id: patient.id,
      blood_type: 'O+',
      dob: new Date('1990-05-15'),
    },
  });

  const chart2 = await prisma.patient_charts.upsert({
    where: { patient_id: patient2.id },
    update: {},
    create: {
      patient_id: patient2.id,
      blood_type: 'A+',
      dob: new Date('1985-08-22'),
    },
  });

  const chart3 = await prisma.patient_charts.upsert({
    where: { patient_id: patient3.id },
    update: {},
    create: {
      patient_id: patient3.id,
      blood_type: 'B-',
      dob: new Date('1992-03-10'),
    },
  });
  console.log('✅ Patient charts created\n');

  // Create allergies
  console.log('Creating allergies...');
  await prisma.patient_allergies.createMany({
    data: [
      { chart_id: chart1.id, allergen_name: 'Penicillin', severity: 'High' },
      { chart_id: chart1.id, allergen_name: 'Peanuts', severity: 'Moderate' },
      { chart_id: chart2.id, allergen_name: 'Sulfa drugs', severity: 'High' },
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
      const result = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO appt_slots (clinician_id, time_range, status)
        VALUES (${slot.clinician_id}::uuid, tstzrange(${slot.start}, ${slot.end}), 'Available')
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      if (result.length > 0) {
        insertedSlotIds.push(result[0].id);
      }
    } catch (e) {
      // Skip if slot already exists
    }
  }
  console.log('✅ Appointment slots created\n');

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
      chart_id: chart1.id,
      clinician_id: clinician.id,
      status: 'Closed',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
  });

  const encounter2 = await prisma.patient_encounters.create({
    data: {
      chart_id: chart2.id,
      clinician_id: clinician.id,
      status: 'Closed',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  });

  // Open encounter for active patient (shows in clinician's current patients)
  const encounter3 = await prisma.patient_encounters.create({
    data: {
      chart_id: chart3.id,
      clinician_id: clinician.id,
      status: 'Open',
      date: new Date(), // Today
    },
  });

  // Another recent encounter
  const encounter4 = await prisma.patient_encounters.create({
    data: {
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
        encounter_id: encounter1.id,
        subjective: 'Patient reports mild headache and fatigue for the past 3 days.',
        objective: 'Vitals: BP 120/80, HR 72, Temp 98.6°F. Alert and oriented.',
        assessment: 'Tension headache, likely stress-related.',
        plan: 'Recommended OTC pain relief, stress management, follow-up in 2 weeks if symptoms persist.',
        vitals: { bloodPressure: '120/80', heartRate: '72', temperature: '98.6', weight: '70' },
      },
      {
        encounter_id: encounter2.id,
        subjective: 'Patient here for diabetes management follow-up.',
        objective: 'Vitals: BP 130/85, HR 78. Recent A1C: 7.2%',
        assessment: 'Type 2 Diabetes Mellitus - moderately controlled.',
        plan: 'Continue current medication. Diet and exercise counseling provided.',
        vitals: { bloodPressure: '130/85', heartRate: '78', temperature: '98.4', weight: '82' },
      },
      {
        encounter_id: encounter3.id,
        subjective: 'New patient presenting with persistent cough for 1 week.',
        objective: 'Vitals: BP 118/76, HR 80, Temp 99.1°F. Lungs clear, mild throat erythema.',
        assessment: 'Upper respiratory infection, likely viral.',
        plan: 'Rest, fluids, symptomatic treatment. Return if fever persists or symptoms worsen.',
        vitals: { bloodPressure: '118/76', heartRate: '80', temperature: '99.1', weight: '65' },
      },
      {
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
        encounter_id: encounter1.id,
        medication_name: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'Every 6 hours as needed',
        duration: '7 days',
      },
      {
        encounter_id: encounter2.id,
        medication_name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily with meals',
        duration: '90 days',
      },
      {
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
      encounter_id: encounter1.id,
      priority: 'Routine',
      status: 'Completed',
    },
  });

  const labOrder2 = await prisma.lab_orders.create({
    data: {
      encounter_id: encounter2.id,
      priority: 'STAT',
      status: 'Pending',
    },
  });

  const labOrder3 = await prisma.lab_orders.create({
    data: {
      encounter_id: encounter2.id,
      priority: 'Routine',
      status: 'Ordered',
    },
  });

  // Additional lab orders for more dashboard data
  const labOrder4 = await prisma.lab_orders.create({
    data: {
      encounter_id: encounter3.id,
      priority: 'STAT',
      status: 'InProgress',
    },
  });

  const labOrder5 = await prisma.lab_orders.create({
    data: {
      encounter_id: encounter4.id,
      priority: 'Routine',
      status: 'Completed',
    },
  });

  const labOrder6 = await prisma.lab_orders.create({
    data: {
      encounter_id: encounter3.id,
      priority: 'Routine',
      status: 'Pending',
    },
  });
  console.log('✅ Lab orders created\n');

  // Create lab test items
  console.log('Creating lab test items...');
  const testItem1 = await prisma.lab_test_items.create({
    data: { order_id: labOrder1.id, test_name: 'Complete Blood Count (CBC)' },
  });
  const testItem2 = await prisma.lab_test_items.create({
    data: { order_id: labOrder1.id, test_name: 'Basic Metabolic Panel' },
  });
  const testItem3 = await prisma.lab_test_items.create({
    data: { order_id: labOrder2.id, test_name: 'Hemoglobin A1C' },
  });
  const testItem4 = await prisma.lab_test_items.create({
    data: { order_id: labOrder2.id, test_name: 'Lipid Panel' },
  });
  const testItem5 = await prisma.lab_test_items.create({
    data: { order_id: labOrder3.id, test_name: 'Urinalysis' },
  });
  // Additional test items for new lab orders
  const testItem6 = await prisma.lab_test_items.create({
    data: { order_id: labOrder4.id, test_name: 'COVID-19 PCR' },
  });
  const testItem7 = await prisma.lab_test_items.create({
    data: { order_id: labOrder4.id, test_name: 'Influenza A/B' },
  });
  const testItem8 = await prisma.lab_test_items.create({
    data: { order_id: labOrder5.id, test_name: 'Comprehensive Metabolic Panel' },
  });
  const testItem9 = await prisma.lab_test_items.create({
    data: { order_id: labOrder6.id, test_name: 'Thyroid Panel (TSH, T3, T4)' },
  });
  console.log('✅ Lab test items created\n');

  // Create lab results - mix of verified and unverified for lab dashboard
  console.log('Creating lab results...');
  await prisma.lab_results.createMany({
    data: [
      {
        test_item_id: testItem1.id,
        result_value: 'WBC: 7.5, RBC: 4.8, Hgb: 14.2, Hct: 42%',
        abnormality_flag: 'Normal',
        is_verified: true,
        verified_by: clinician.id,
      },
      {
        test_item_id: testItem2.id,
        result_value: 'Glucose: 95, BUN: 15, Creatinine: 1.0',
        abnormality_flag: 'Normal',
        is_verified: true,
        verified_by: clinician.id,
      },
      {
        test_item_id: testItem3.id,
        result_value: '7.2%',
        abnormality_flag: 'High',
        is_verified: false,
      },
      {
        test_item_id: testItem8.id,
        result_value: 'Glucose: 110, BUN: 18, Creatinine: 0.9, Na: 140, K: 4.2',
        abnormality_flag: 'Normal',
        is_verified: true,
        verified_by: clinician2.id,
      },
      {
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
      patient_id: patient.id,
      encounter_id: encounter1.id,
      total_amount: 150.00,
      status: 'Paid',
    },
  });

  const invoice2 = await prisma.billing_invoices.create({
    data: {
      patient_id: patient2.id,
      encounter_id: encounter2.id,
      total_amount: 275.00,
      status: 'Pending',
    },
  });

  const invoice3 = await prisma.billing_invoices.create({
    data: {
      patient_id: patient.id,
      total_amount: 50.00,
      status: 'Pending',
    },
  });
  console.log('✅ Invoices created\n');

  // Create line items
  console.log('Creating billing line items...');
  await prisma.billing_line_items.createMany({
    data: [
      { invoice_id: invoice1.id, description: 'Office Visit', cost: 100.00 },
      { invoice_id: invoice1.id, description: 'Lab Work - CBC', cost: 50.00 },
      { invoice_id: invoice2.id, description: 'Office Visit', cost: 100.00 },
      { invoice_id: invoice2.id, description: 'Lab Work - A1C', cost: 75.00 },
      { invoice_id: invoice2.id, description: 'Lab Work - Lipid Panel', cost: 100.00 },
      { invoice_id: invoice3.id, description: 'Prescription Refill Fee', cost: 50.00 },
    ],
  });
  console.log('✅ Line items created\n');

  console.log('========================================');
  console.log('🎉 Seed completed successfully!');
  console.log('========================================\n');
  console.log('Demo Accounts (password: password123):');
  console.log('----------------------------------------');
  console.log('Patient:   patient@citycare.com');
  console.log('Patient:   john.doe@citycare.com');
  console.log('Patient:   jane.smith@citycare.com');
  console.log('Clinician: clinician@citycare.com');
  console.log('Clinician: dr.williams@citycare.com');
  console.log('Admin:     admin@citycare.com');
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
