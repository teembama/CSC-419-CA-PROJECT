# CityCare EHR - Development PRD

## Document Purpose
This document serves as the comprehensive technical Product Requirements Document (PRD) for the CityCare Healthcare EHR system. It is designed to be used by developers (human or AI/LLM) to understand the full project scope, current implementation status, and remaining tasks for project completion.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Database Schema](#3-database-schema)
4. [Current Implementation Status](#4-current-implementation-status)
5. [Complete Backend API Requirements](#5-complete-backend-api-requirements)
6. [Team Assignments & Dependencies](#6-team-assignments--dependencies)
7. [Detailed Task Breakdown by Developer](#7-detailed-task-breakdown-by-developer)
8. [Testing Plan for Therese](#8-testing-plan-for-therese)
9. [API Endpoint Specifications](#9-api-endpoint-specifications)
10. [Security Requirements](#10-security-requirements)

---

## 1. Project Overview

### 1.1 Application Description
CityCare EHR is a Healthcare Appointment & Electronic Health Records (EHR) Lite system that enables:
- **Patients** to manage profiles, book appointments, view medical records, prescriptions, lab results, and billing
- **Clinicians** to manage schedules, conduct patient encounters, write prescriptions, order lab tests
- **Lab Technicians** to process lab orders and upload results
- **Administrators** to manage users, roles, time slots, and generate invoices

### 1.2 User Roles
| Role | Description |
|------|-------------|
| Patient | End users who book appointments and view their health records |
| Clinician | Doctors/nurses who conduct encounters and manage patient care |
| Lab Technician | Staff who process lab orders and upload results |
| Staff | Front desk personnel who register walk-ins, manage billing, verify insurance |
| Admin | System administrators who manage users, roles, permissions, and audit logs |

### 1.3 Domain-Driven Design Architecture
CityCare follows **Domain-Driven Design (DDD)** with five bounded contexts:

| Domain Type | Module | Description |
|-------------|--------|-------------|
| **Core** | Clinical EHR | Patient care, diagnoses, prescriptions - requires most custom logic |
| **Core** | Laboratory | Test lifecycle from order to verified result |
| **Supporting** | Scheduling | Clinician availability, booking, walk-ins |
| **Generic** | Billing | Invoice generation, payments |
| **Generic** | IAM | Authentication, authorization, roles |

### 1.4 Ubiquitous Language (Glossary)
| Term | Definition |
|------|------------|
| **Encounter** | A medical interaction between a Patient and Clinician (not "visit") |
| **Slot** | A specific block of time available for booking |
| **Chart** | The patient's medical record (patient_charts) |
| **SOAP Note** | Clinical documentation: Subjective, Objective, Assessment, Plan |
| **Verified Result** | Lab result reviewed and approved by clinician - patients only see verified results |
| **Access Delegation** | Temporary permission granted by one clinician to another to view a patient's chart |
| **Walk-in** | Patient without appointment, registered by front desk staff |

### 1.5 Core Epics (from User Stories)
1. **Patient Management** - Profile creation, updates, OTP verification
2. **Appointment & Scheduling** - Booking, rescheduling, cancellation, walk-ins, slot management
3. **Medical Records & Visits** - Encounters, diagnoses, treatment plans, SOAP notes, prescriptions
4. **Lab Orders & Results** - Test ordering, sample tracking, result upload, clinician verification
5. **Billing & Insurance** - Invoices, insurance verification, payments
6. **Access Control & Audit** - Role-based permissions, access delegation, audit logging
7. **Notifications** - Appointment reminders, lab result alerts

### 1.6 Domain Services (Critical Business Logic)

These services encapsulate core business rules. **All work with existing schema unless noted:**

| Service | Module | Purpose | DB Change? |
|---------|--------|---------|------------|
| **PrescriptionSafetyService** | Clinical | Cross-references new prescriptions against patient allergies; throws error if conflict | No - uses `patient_allergies` |
| **ResultVerificationService** | Laboratory | Gatekeeper that hides results from patients until clinician verifies | No - uses `is_verified` field |
| **SlotAvailabilityService** | Scheduling | Prevents double-booking by checking requested time against existing slots | No - uses `appt_slots` |
| **WalkInManagerService** | Scheduling | Allows staff to force-book emergency walk-ins, overriding normal slot rules | No - uses `is_walk_in` field |
| **InvoiceGenerationService** | Billing | Listens for "Encounter Closed" events and auto-generates invoices | No - uses existing tables |
| **ChartAuditService** | Clinical | Prevents deletion/archival of charts containing finalized records | No - uses `system_audit_logs` |
| **AccessDelegationService** | IAM | Time-bound access for clinicians to view another's patient data | **OPTIONAL - needs new table** |

### 1.7 Domain Events (Event-Driven Architecture)

Modules communicate via events, not direct database access:

| Event | Source | Subscribers | Action |
|-------|--------|-------------|--------|
| `PatientRegistered` | IAM | EHR | Creates empty PatientChart automatically |
| `AppointmentBooked` | Scheduling | Billing, Notification | Check outstanding balances; send confirmation SMS/email |
| `AppointmentReminder` | Scheduling | Notification | Send reminder 24h and 1h before appointment |
| `LabOrderPlaced` | EHR | Laboratory | Generate LabRequisition on technician dashboard |
| `LabResultUploaded` | Laboratory | EHR | Notify clinician that results are ready for review |
| `LabResultVerified` | EHR | Notification | Alert patient: "Your CityCare results are ready" |
| `EncounterClosed` | EHR | Billing | Generate invoice based on services provided |

---

## 2. Technology Stack

### 2.1 Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 11.0.1 | Backend framework |
| Prisma | 5.22.0 | ORM for PostgreSQL |
| PostgreSQL | 16+ | Database with UUID, CITEXT extensions |
| Passport | 0.7.0 | Authentication middleware |
| passport-jwt | 4.0.1 | JWT authentication strategy |
| @nestjs/jwt | 11.0.2 | JWT token handling |
| bcrypt | 6.0.0 | Password hashing |
| class-validator | 0.14.3 | DTO validation |
| class-transformer | 0.5.1 | Object transformation |

### 2.2 Frontend (Patient Dashboard - COMPLETE)
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI framework |
| TypeScript | 5.7.x | Type safety |
| Vite | 7.x | Build tool |
| React Router | 7.x | Client-side routing |
| CSS Modules | - | Component styling |

### 2.3 Frontend (Clinician/Admin - IN PROGRESS)
- Being developed separately from this backend work
- Wireframes completed
- Code conversion in progress

### 2.4 Authentication Flow (Frontend)

The application uses separate authentication screens to provide appropriate messaging for each user type:

#### Sign-Up Screens
| Screen | Route | Target Users | Role Selection |
|--------|-------|--------------|----------------|
| Patient Sign-Up | `/signup` | Patients | None (auto-assigned "Patient" role) |
| Staff Sign-Up | `/clinician/signup` | Hospital Staff | Dropdown: Clinician, Lab Technician, Admin |

**Rationale:** Patients should never have to pick a role - their role is implicitly "Patient". Hospital staff (clinicians, lab technicians, admins) use a separate sign-up flow where they select their role.

#### Sign-In Screens
| Screen | Route | Target Users | Notes |
|--------|-------|--------------|-------|
| Patient Sign-In | `/login` | Patients | Includes health data security messaging |
| Staff Sign-In | `/clinician/signin` | Hospital Staff | Portal-focused messaging |

**Note:** Both sign-in screens authenticate against the same backend `/auth/login` endpoint. The backend returns the user's role, and the frontend redirects to the appropriate dashboard.

---

## 3. Database Schema

**Source:** `CityCareFinalDatabase` (PostgreSQL 15+)

### 3.1 Entity Relationship Overview
```
users (1) -----> (1) roles
  |
  |---> (1) patient_charts (1)
  |           |
  |           |---> (*) patient_allergies
  |           |---> (*) patient_encounters
  |
  |---> (*) appt_slots (clinician availability)
  |           |
  |           |---> (*) appt_bookings
  |
  |---> (*) patient_encounters (as clinician)
            |
            |---> (1) patient_notes_soap (SOAP notes, vitals)
            |---> (*) patient_prescriptions
            |---> (*) lab_orders
            |           |
            |           |---> (*) lab_test_items
            |                       |
            |                       |---> (*) lab_results
            |
            |---> (*) billing_invoices
                      |
                      |---> (*) billing_line_items
```

### 3.2 Table Definitions

#### `users`
Primary user table for all roles.
```sql
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name text NOT NULL,
    last_name text NOT NULL,
    email citext UNIQUE NOT NULL,
    phone_number text UNIQUE,
    password_hash text NOT NULL,
    role_id integer REFERENCES roles(id) ON DELETE RESTRICT,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    profile_image bytea
);
```

#### `roles`
System roles definition.
```sql
CREATE TABLE roles (
    id serial PRIMARY KEY,
    name text UNIQUE NOT NULL
);
-- Values: Patient, Clinician, Lab Technician, Admin, Staff
```

#### `patient_charts`
Patient medical chart (one-to-one with users).
```sql
CREATE TABLE patient_charts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    blood_type varchar(5),
    dob date NOT NULL
);
```

#### `patient_allergies`
Patient allergy records.
```sql
CREATE TABLE patient_allergies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    chart_id uuid REFERENCES patient_charts(id) ON DELETE CASCADE,
    allergen_name text NOT NULL,
    severity text -- Mild, Moderate, Severe
);
```

#### `appt_slots`
Clinician availability windows with exclusion constraint.
```sql
CREATE TABLE appt_slots (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinician_id uuid REFERENCES users(id) ON DELETE CASCADE,
    time_range tstzrange NOT NULL,
    status text DEFAULT 'Available', -- Available, Booked, Blocked
    version integer DEFAULT 1,
    EXCLUDE USING gist (clinician_id WITH =, time_range WITH &&)
);
```
**Note:** Uses PostgreSQL `tstzrange` for time ranges and GiST exclusion constraint to prevent overlapping slots.

#### `appt_bookings`
Patient appointment bookings.
```sql
CREATE TABLE appt_bookings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id uuid REFERENCES users(id) ON DELETE CASCADE,
    slot_id uuid REFERENCES appt_slots(id) ON DELETE CASCADE,
    status text DEFAULT 'Pending', -- Pending, Confirmed, Cancelled, Completed, No-Show
    is_walk_in boolean DEFAULT false,
    reason_for_visit text
);
```

#### `patient_encounters`
Patient-clinician visit records.
```sql
CREATE TABLE patient_encounters (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    chart_id uuid REFERENCES patient_charts(id) ON DELETE CASCADE,
    clinician_id uuid REFERENCES users(id) ON DELETE SET NULL,
    date timestamptz DEFAULT now(),
    status text DEFAULT 'Open' -- Open, Completed, Cancelled
);
```

#### `patient_notes_soap`
SOAP notes and clinical details.
```sql
CREATE TABLE patient_notes_soap (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id uuid REFERENCES patient_encounters(id) ON DELETE CASCADE,
    subjective text,
    objective text,
    assessment text,
    plan text,
    vitals jsonb -- {bp, heart_rate, temperature, weight, height, etc.}
);
```

#### `patient_prescriptions`
Medication prescriptions.
```sql
CREATE TABLE patient_prescriptions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id uuid REFERENCES patient_encounters(id) ON DELETE CASCADE,
    medication_name text NOT NULL,
    dosage text,
    frequency text,
    duration text
);
```

#### `lab_orders`
Lab test orders from clinicians.
```sql
CREATE TABLE lab_orders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id uuid REFERENCES patient_encounters(id) ON DELETE CASCADE,
    priority text DEFAULT 'Routine', -- Routine, Urgent, STAT
    status text DEFAULT 'Ordered' -- Ordered, In Progress, Completed, Cancelled
);
```

#### `lab_test_items`
Individual tests within a lab order.
```sql
CREATE TABLE lab_test_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id uuid REFERENCES lab_orders(id) ON DELETE CASCADE,
    test_name text NOT NULL
);
```

#### `lab_results`
Lab test results.
```sql
CREATE TABLE lab_results (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_item_id uuid REFERENCES lab_test_items(id) ON DELETE CASCADE,
    result_value text,
    abnormality_flag text, -- Normal, Low, High, Critical
    file_url text,
    is_verified boolean DEFAULT false,
    verified_by uuid REFERENCES users(id) ON DELETE SET NULL
);
```

#### `billing_invoices`
Patient billing invoices.
```sql
CREATE TABLE billing_invoices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id uuid REFERENCES users(id) ON DELETE CASCADE,
    encounter_id uuid REFERENCES patient_encounters(id) ON DELETE SET NULL,
    total_amount numeric(12,2) DEFAULT 0.00,
    status text DEFAULT 'Draft' -- Draft, Unpaid, Paid, Overdue
);
```

#### `billing_line_items`
Invoice line items.
```sql
CREATE TABLE billing_line_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id uuid REFERENCES billing_invoices(id) ON DELETE CASCADE,
    description text NOT NULL,
    cost numeric(10,2) NOT NULL
);
```

#### `system_audit_logs`
System audit trail.
```sql
CREATE TABLE system_audit_logs (
    id bigserial PRIMARY KEY,
    table_name text,
    record_id uuid,
    action text,
    changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
    old_data jsonb,
    new_data jsonb,
    changed_at timestamptz DEFAULT now()
);
```

### 3.3 Required PostgreSQL Extensions
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- UUID generation
CREATE EXTENSION IF NOT EXISTS "citext";     -- Case-insensitive text
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- GiST index for exclusion constraints
```

---

## 4. Current Implementation Status

### 4.1 Backend Modules Status

| Module | Status | Implementation % | Notes |
|--------|--------|------------------|-------|
| **PrismaModule** | COMPLETE | 100% | Database connection and service working |
| **IamModule** | PARTIAL | 70% | Register, Login, GetMe working. Missing: role assignment on register, password reset, refresh token |
| **SchedulingModule** | COMPLETE | 100% | All PRD endpoints implemented + walk-ins, slot blocking. IAM integrated. |
| **ClinicalModule** | PARTIAL | 55% | Encounters, SOAP notes, prescriptions with allergy check working. Missing: chart CRUD, allergy CRUD, patient search, encounter/prescription history endpoints |
| **LabModule** | COMPLETE | 100% | All PRD endpoints implemented + verification queue, stats. IAM integrated. |
| **BillingModule** | COMPLETE | 100% | All PRD endpoints implemented + auto-invoice on encounter close. IAM integrated. |

### 4.1.1 Developer Completion Status (Updated: January 2025)

| Developer | Module | Status | Notes |
|-----------|--------|--------|-------|
| **Leela** | Scheduling | ✅ COMPLETE | All endpoints, walk-ins, slot management, IAM integrated |
| **Paula** | Lab | ✅ COMPLETE | Full lab workflow, result verification, IAM integrated |
| **Ugochukwu** | Billing | ✅ COMPLETE | Invoice CRUD, line items, event-driven auto-invoice, IAM integrated |
| **Tomisin** | Clinical | ⚠️ IN PROGRESS | Has: encounters, SOAP, prescriptions. Needs: chart CRUD, allergies CRUD, patient search, history endpoints |
| **Ruth** | IAM | ⚠️ IN PROGRESS | Has: register, login, getMe, guards. Needs: role assignment, password reset, refresh tokens |

### 4.2 What EXISTS (Already Implemented)

#### Scheduling Module - WORKING:
- `POST /scheduling/bookings` - Create appointment booking with slot locking
- `GET /scheduling/clinicians/:id/slots` - Get available slots for clinician
- `SlotService.createSlot()` - Create availability slot with conflict detection
- `BookingService.createBooking()` - Atomic booking with transaction
- `SlotAvailabilityService.getAvailableSlots()` - Query available slots
- `CreateBookingDto` - Validated DTO for booking creation

#### Prisma Module - WORKING:
- `PrismaService` - Database connection with lifecycle hooks
- Global module export for all other modules

### 4.3 What NEEDS TO BE BUILT

#### IAM Module - CRITICAL PATH (blocks all other work):
- [ ] User registration with password hashing
- [ ] User login with JWT token generation
- [ ] JWT authentication strategy
- [ ] AuthGuard for protected routes
- [ ] RolesGuard for authorization
- [ ] Refresh token mechanism
- [ ] Get current user endpoint
- [ ] Password reset flow
- [ ] DTOs: RegisterDto, LoginDto, TokenResponseDto

#### Scheduling Module - REMAINING:
- [ ] Cancel appointment endpoint
- [ ] Reschedule appointment endpoint
- [ ] Get patient appointments endpoint
- [ ] Get clinician schedule endpoint
- [ ] Admin slot management (CRUD)
- [ ] Walk-in appointment support

#### Clinical Module - FULL IMPLEMENTATION:
- [ ] Patient profile CRUD
- [ ] Patient search (by ID, name, phone)
- [ ] Patient allergies CRUD
- [ ] Encounter creation and management
- [ ] SOAP notes (encounter_details) CRUD
- [ ] Prescription creation
- [ ] Patient medical history view
- [ ] Vitals recording

#### Lab Module - FULL IMPLEMENTATION:
- [ ] Create lab order
- [ ] Get lab orders (by patient, by encounter)
- [ ] Upload lab result
- [ ] Verify lab result
- [ ] Get lab results for patient
- [ ] Lab order status updates

#### Billing Module - FULL IMPLEMENTATION:
- [ ] Generate invoice from encounter
- [ ] Get patient invoices
- [ ] Update invoice status
- [ ] Create insurance claim
- [ ] Update claim status
- [ ] Payment recording

#### Shared Infrastructure:
- [ ] Audit logging interceptor
- [ ] Exception filters
- [ ] Request logging middleware
- [ ] API documentation (Swagger)

---

## 5. Complete Backend API Requirements

### 5.1 IAM Module Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /auth/register | Register new user | No |
| POST | /auth/login | Authenticate user | No |
| POST | /auth/refresh | Refresh access token | Yes (refresh token) |
| GET | /auth/me | Get current user profile | Yes |
| POST | /auth/logout | Invalidate tokens | Yes |
| POST | /auth/forgot-password | Request password reset | No |
| POST | /auth/reset-password | Reset password with token | No |

### 5.2 Scheduling Module Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | /scheduling/clinicians/:id/slots | Get clinician availability | Yes | Any |
| POST | /scheduling/bookings | Book appointment | Yes | Patient |
| GET | /scheduling/bookings/:id | Get booking details | Yes | Owner/Clinician |
| PATCH | /scheduling/bookings/:id | Update booking | Yes | Owner/Admin |
| DELETE | /scheduling/bookings/:id | Cancel booking | Yes | Owner/Admin |
| GET | /scheduling/patients/:id/appointments | Get patient appointments | Yes | Owner/Clinician |
| GET | /scheduling/clinicians/:id/schedule | Get clinician schedule | Yes | Owner/Admin |
| POST | /scheduling/slots | Create availability slot | Yes | Clinician |
| PATCH | /scheduling/slots/:id | Update slot | Yes | Owner/Admin |
| DELETE | /scheduling/slots/:id | Delete slot | Yes | Owner/Admin |

### 5.3 Clinical Module Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | /clinical/patients | Search patients | Yes | Clinician/Admin |
| GET | /clinical/patients/:id/chart | Get patient chart | Yes | Owner/Clinician |
| POST | /clinical/patients/:id/chart | Create patient chart | Yes | Patient (self) |
| PATCH | /clinical/patients/:id/chart | Update patient chart | Yes | Owner/Admin |
| GET | /clinical/charts/:chartId/allergies | Get patient allergies | Yes | Owner/Clinician |
| POST | /clinical/charts/:chartId/allergies | Add allergy | Yes | Clinician |
| DELETE | /clinical/allergies/:allergyId | Remove allergy | Yes | Clinician |
| GET | /clinical/charts/:chartId/encounters | Get patient encounters | Yes | Owner/Clinician |
| POST | /clinical/encounters | Create encounter | Yes | Clinician |
| GET | /clinical/encounters/:id | Get encounter details | Yes | Clinician |
| PATCH | /clinical/encounters/:id | Update encounter | Yes | Clinician |
| POST | /clinical/encounters/:id/notes | Add SOAP notes | Yes | Clinician |
| PATCH | /clinical/encounters/:id/notes | Update SOAP notes | Yes | Clinician |
| POST | /clinical/encounters/:id/prescriptions | Create prescription | Yes | Clinician |
| GET | /clinical/charts/:chartId/prescriptions | Get patient prescriptions | Yes | Owner/Clinician |

### 5.4 Lab Module Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | /lab/orders | Create lab order | Yes | Clinician |
| GET | /lab/orders | Get lab orders (filtered) | Yes | Clinician/Lab Tech |
| GET | /lab/orders/:id | Get order details with test items | Yes | Clinician/Lab Tech |
| PATCH | /lab/orders/:id/status | Update order status | Yes | Lab Tech |
| POST | /lab/orders/:id/test-items | Add test item to order | Yes | Clinician |
| POST | /lab/test-items/:testItemId/results | Upload result for test item | Yes | Lab Tech |
| PATCH | /lab/results/:id/verify | Verify result | Yes | Clinician |
| GET | /lab/charts/:chartId/results | Get patient lab results | Yes | Owner/Clinician |

### 5.5 Billing Module Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | /billing/invoices | Generate invoice | Yes | Admin |
| GET | /billing/invoices | Get invoices (filtered) | Yes | Admin |
| GET | /billing/invoices/:id | Get invoice with line items | Yes | Owner/Admin |
| PATCH | /billing/invoices/:id | Update invoice status | Yes | Admin |
| GET | /billing/patients/:id/invoices | Get patient invoices | Yes | Owner/Admin |
| POST | /billing/invoices/:id/line-items | Add line item to invoice | Yes | Admin |
| DELETE | /billing/line-items/:id | Remove line item | Yes | Admin |

---

## 6. Team Assignments & Dependencies

### 6.1 Team Members
| Name | Role | Primary Assignment |
|------|------|-------------------|
| Ruth | Developer | IAM Module |
| Dimeji | Project Manager | Coordination, Code Review |
| Leela | Developer | Scheduling Module |
| Tomisin | Developer | Clinical Module |
| Paula | Developer | Lab Module |
| Tega | Developer | Billing Module |
| Leke | Developer | Frontend Integration |
| Therese | QA Lead | Testing & Quality |

### 6.2 Dependency Matrix

```
                    BLOCKS
        Ruth  Leela  Tomisin  Paula  Tega  Leke
Ruth     -     YES    YES     YES    YES   YES
Leela    NO     -     YES     NO     NO    YES
Tomisin  NO    NO      -      YES    YES   YES
Paula    NO    NO     NO       -     NO    YES
Tega     NO    NO     NO      NO      -    YES
Leke     NO    NO     NO      NO     NO     -
```

### 6.3 Development Order (Critical Path)

```
Phase 1 (CRITICAL - Must Complete First):
┌─────────────────────────────────────────┐
│  Ruth: IAM Module                       │
│  - Authentication                       │
│  - Authorization                        │
│  - Guards & Decorators                  │
└─────────────────────────────────────────┘
                    │
                    ▼
Phase 2 (Can Start After IAM Guards Ready):
┌─────────────────────────────────────────┐
│  Leela: Scheduling (remaining)          │
│  Tomisin: Clinical (full)               │
│  These can run in PARALLEL              │
└─────────────────────────────────────────┘
                    │
                    ▼
Phase 3 (Depends on Clinical):
┌─────────────────────────────────────────┐
│  Paula: Lab Module                      │
│  (needs encounters from Clinical)       │
│                                         │
│  Tega: Billing Module                   │
│  (needs encounters from Clinical)       │
│  These can run in PARALLEL              │
└─────────────────────────────────────────┘
                    │
                    ▼
Phase 4 (Integration):
┌─────────────────────────────────────────┐
│  Leke: Frontend-Backend Integration     │
│  Therese: Full System Testing           │
└─────────────────────────────────────────┘
```

### 6.4 Parallel Work Opportunities

**While Ruth works on IAM:**
- Leela can review Scheduling code and plan enhancements
- Tomisin can design Clinical DTOs and write unit tests
- Paula can design Lab DTOs and write unit tests
- Tega can design Billing DTOs and write unit tests
- Therese can prepare test plans and test data

**Once IAM is complete:**
- Leela + Tomisin can work in parallel
- Paula + Tega wait for Clinical encounter endpoints

---

## 7. Detailed Task Breakdown by Developer

### 7.1 Ruth - IAM Module

#### Files to Create:
```
src/iam/
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   ├── token-response.dto.ts
│   └── access-delegation.dto.ts
├── strategies/
│   └── jwt.strategy.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
├── decorators/
│   ├── roles.decorator.ts
│   └── current-user.decorator.ts
├── services/
│   └── access-delegation.service.ts
├── iam.controller.ts (update)
├── iam.service.ts (update)
└── iam.module.ts (update)
```

#### Tasks:
1. **Create RegisterDto** (`dto/register.dto.ts`)
   - Fields: email, password, firstName, lastName, phoneNumber, role
   - Validation: email format, password strength (min 8 chars), required fields
   - Phone number uniqueness check

2. **Create LoginDto** (`dto/login.dto.ts`)
   - Fields: email, password
   - Validation: required fields

3. **Create JWT Strategy** (`strategies/jwt.strategy.ts`)
   - Extend PassportStrategy
   - Validate JWT token and extract user
   - Check if user is_active

4. **Create JwtAuthGuard** (`guards/jwt-auth.guard.ts`)
   - Extend AuthGuard('jwt')
   - Handle unauthorized access

5. **Create RolesGuard** (`guards/roles.guard.ts`)
   - Check user roles against required roles
   - Use with @Roles() decorator
   - Support multiple roles: Patient, Clinician, Lab Technician, Staff, Admin

6. **Create Decorators**
   - `@Roles()` - specify required roles for endpoint
   - `@CurrentUser()` - inject current user into handler

7. **Implement IamService**
   - `register()` - hash password, create user, assign role, emit PatientRegistered event
   - `login()` - validate credentials, generate JWT
   - `validateUser()` - find user by ID for JWT strategy
   - `refreshToken()` - generate new access token
   - `getProfile()` - get current user with role

8. **Update IamController**
   - POST /auth/register
   - POST /auth/login
   - POST /auth/refresh
   - GET /auth/me

9. **(OPTIONAL - Future) Implement AccessDelegationService**
   - Requires new `access_delegations` table
   - `grantAccess()` - clinician grants temporary access to another clinician
   - `revokeAccess()` - remove delegation before expiry
   - `checkAccess()` - verify if delegation is active and not expired
   - Skip for MVP, implement later if needed

10. **Update IamModule**
    - Import JwtModule, PassportModule
    - Configure JWT secret and expiration
    - Export guards for other modules

#### Acceptance Criteria:
- [ ] User can register with email/password
- [ ] Passwords are hashed with bcrypt (10+ rounds)
- [ ] JWT tokens are generated on login
- [ ] Protected routes require valid JWT
- [ ] Role-based access control works for all 5 roles (Patient, Clinician, Lab Technician, Staff, Admin)
- [ ] Token refresh mechanism works
- [ ] PatientRegistered event is emitted on patient registration

---

### 7.2 Leela - Scheduling Module

#### Files to Create/Update:
```
src/scheduling/
├── dto/
│   ├── create-booking.dto.ts (exists)
│   ├── update-booking.dto.ts
│   ├── create-slot.dto.ts
│   ├── create-walkin.dto.ts
│   └── schedule-query.dto.ts
├── services/
│   ├── booking.service.ts (update)
│   ├── slot.service.ts (update)
│   ├── slot-availability.service.ts (exists)
│   └── walkin-manager.service.ts (new - Domain Service)
├── scheduling.controller.ts (update)
└── scheduling.module.ts (update)
```

#### Tasks:
1. **Create UpdateBookingDto**
   - Fields: status, reasonForVisit
   - Allow partial updates

2. **Create CreateSlotDto**
   - Fields: clinicianId, startTime, endTime
   - Validation: future dates only, valid time range

3. **Create CreateWalkInDto**
   - Fields: patientId, clinicianId, reasonForVisit
   - For Staff to register walk-in patients

4. **Extend BookingService**
   - `cancelBooking()` - set status to Cancelled, free slot
   - `rescheduleBooking()` - cancel old, create new
   - `getPatientAppointments()` - list patient bookings
   - `getBookingById()` - get single booking
   - Emit `AppointmentBooked` event on successful booking

5. **Extend SlotService**
   - `getClinicianSchedule()` - all slots for date range
   - `updateSlot()` - modify slot times/status
   - `deleteSlot()` - remove availability
   - `blockSlot()` - mark as unavailable

6. **Create WalkInManagerService** (Domain Service)
   - `registerWalkIn()` - force-book without slot, set `is_walk_in=true`
   - Override normal slot rules for emergencies
   - Only Staff/Admin can use this

7. **Update Controller**
   - Add all new endpoints
   - POST /scheduling/walk-ins (Staff only)
   - Apply AuthGuard and RolesGuard
   - Use @CurrentUser() decorator

#### Dependencies:
- **Waits for:** Ruth's AuthGuard, RolesGuard, @CurrentUser decorator

#### Acceptance Criteria:
- [ ] Patients can cancel appointments
- [ ] Patients can reschedule appointments
- [ ] Clinicians can view their schedule
- [ ] Admins can manage all slots
- [ ] Slot conflicts are prevented (uses existing exclusion constraint)
- [ ] Staff can register walk-in patients with `is_walk_in=true`
- [ ] AppointmentBooked event is emitted

---

### 7.3 Tomisin - Clinical Module

#### Files to Create:
```
src/clinical/
├── dto/
│   ├── create-patient-chart.dto.ts
│   ├── update-patient-chart.dto.ts
│   ├── create-allergy.dto.ts
│   ├── create-encounter.dto.ts
│   ├── update-encounter.dto.ts
│   ├── create-soap-notes.dto.ts
│   ├── create-prescription.dto.ts
│   └── patient-search.dto.ts
├── services/
│   ├── patient-chart.service.ts
│   ├── encounter.service.ts
│   ├── prescription.service.ts
│   └── prescription-safety.service.ts  # Domain Service
├── clinical.controller.ts (update)
├── clinical.service.ts (update)
└── clinical.module.ts (update)
```

#### Tasks:
1. **Create PatientChartService**
   - `createChart()` - create patient_charts record
   - `updateChart()` - update patient chart info
   - `getChart()` - get chart by patient ID
   - `searchPatients()` - search by name, phone, ID
   - `addAllergy()` - add patient_allergies record
   - `removeAllergy()` - delete allergy
   - `getAllergies()` - get allergies by chart_id

2. **Create EncounterService**
   - `createEncounter()` - start new patient_encounters record
   - `updateEncounter()` - update status
   - `getEncounter()` - get encounter with SOAP notes
   - `getPatientEncounters()` - encounter history by chart_id
   - `addSoapNotes()` - create patient_notes_soap
   - `updateSoapNotes()` - update notes
   - `recordVitals()` - update vitals jsonb field

3. **Create PrescriptionService**
   - `createPrescription()` - add patient_prescriptions to encounter
   - `getPatientPrescriptions()` - prescription history
   - `getPrescription()` - single prescription

4. **Create PrescriptionSafetyService** (Domain Service)
   - `checkAllergyInteractions(chartId, medicationName)` - cross-reference against `patient_allergies`
   - `validatePrescription(chartId, prescription)` - run safety checks before saving
   - Should be called by PrescriptionService before creating prescriptions
   - Returns warnings/errors if medication matches known allergies

5. **Create All DTOs with validation**

6. **Update Controller with all endpoints**

7. **Emit Domain Events**
   - `LabOrderPlaced` - when clinician orders a lab test
   - `EncounterClosed` - when encounter status changes to 'Closed' (triggers billing)

#### Dependencies:
- **Waits for:** Ruth's AuthGuard, RolesGuard
- **Blocks:** Paula (needs encounters), Tega (needs encounters)

#### Acceptance Criteria:
- [ ] Patient charts can be created and updated
- [ ] Patient search works by ID, name, and phone
- [ ] Allergies can be managed via chart_id
- [ ] Encounters can be created for a patient chart
- [ ] SOAP notes can be recorded
- [ ] Vitals can be recorded (JSON format)
- [ ] Prescriptions can be created
- [ ] PrescriptionSafetyService warns if medication matches patient allergies
- [ ] LabOrderPlaced event emitted when ordering labs
- [ ] EncounterClosed event emitted when closing encounter
- [ ] Only clinicians can create/update clinical data

---

### 7.4 Paula - Lab Module

#### Files to Create:
```
src/lab/
├── dto/
│   ├── create-lab-order.dto.ts
│   ├── create-test-item.dto.ts
│   ├── update-order-status.dto.ts
│   ├── upload-result.dto.ts
│   └── verify-result.dto.ts
├── services/
│   ├── lab-order.service.ts
│   ├── lab-test-item.service.ts
│   ├── lab-result.service.ts
│   └── result-verification.service.ts  # Domain Service
├── lab.controller.ts (update)
├── lab.service.ts (update)
└── lab.module.ts (update)
```

#### Tasks:
1. **Create LabOrderService**
   - `createOrder()` - create lab_orders from encounter_id
   - `getOrders()` - filtered list (by status, encounter, date)
   - `getOrder()` - single order with lab_test_items and lab_results
   - `updateStatus()` - change order status

2. **Create LabTestItemService**
   - `addTestItem()` - add lab_test_items to order
   - `getTestItems()` - get all test items for an order
   - `removeTestItem()` - delete test item

3. **Create LabResultService**
   - `uploadResult()` - create lab_results for test_item_id
   - `verifyResult()` - set is_verified=true, verified_by=userId
   - `getPatientResults()` - all results for patient (via chart)
   - `getResultsForOrder()` - results for specific order

4. **Create ResultVerificationService** (Domain Service)
   - `verifyResult(resultId, clinicianId)` - sets `is_verified=true`, `verified_by`
   - `getUnverifiedResults(clinicianId)` - results awaiting clinician verification
   - `getVerifiedResultsForPatient(patientId)` - only returns `is_verified=true` results
   - **Critical Rule**: Patients ONLY see results where `is_verified=true`
   - Emits `LabResultVerified` event on verification

5. **Create All DTOs**
   - CreateLabOrderDto: encounterId, priority
   - CreateTestItemDto: orderId, testName
   - UploadResultDto: testItemId, resultValue, abnormalityFlag, fileUrl
   - VerifyResultDto: isVerified

6. **Update Controller**

7. **Emit Domain Events**
   - `LabResultUploaded` - when lab tech uploads result
   - `LabResultVerified` - when clinician verifies (triggers patient notification)

#### Dependencies:
- **Waits for:** Ruth's guards, Tomisin's encounters

#### Acceptance Criteria:
- [ ] Clinicians can create lab orders with test items
- [ ] Lab technicians can upload results per test item
- [ ] Clinicians can verify results
- [ ] Patients can ONLY view verified results (`is_verified=true`)
- [ ] Order status workflow works (Ordered → In Progress → Completed)
- [ ] LabResultVerified event emitted on verification
- [ ] Unverified results hidden from patient view

---

### 7.5 Tega - Billing Module

#### Files to Create:
```
src/billing/
├── dto/
│   ├── create-invoice.dto.ts
│   ├── update-invoice.dto.ts
│   └── create-line-item.dto.ts
├── services/
│   ├── invoice.service.ts
│   ├── line-item.service.ts
│   └── invoice-generation.service.ts  # Domain Service
├── events/
│   └── billing-events.listener.ts  # Listens for EncounterClosed
├── billing.controller.ts (update)
├── billing.service.ts (update)
└── billing.module.ts (update)
```

#### Tasks:
1. **Create InvoiceService**
   - `generateInvoice()` - create billing_invoices from encounter
   - `getInvoices()` - filtered list
   - `getInvoice()` - single invoice with billing_line_items
   - `updateInvoice()` - update status
   - `getPatientInvoices()` - patient's invoices
   - `calculateTotal()` - sum line items and update total_amount

2. **Create LineItemService**
   - `addLineItem()` - add billing_line_items to invoice
   - `removeLineItem()` - delete line item
   - `getLineItems()` - get all line items for invoice

3. **Create InvoiceGenerationService** (Domain Service)
   - `generateFromEncounter(encounterId)` - auto-generate invoice from closed encounter
   - `calculateLineItemsFromServices(encounterId)` - derive line items from services rendered
   - Called automatically when `EncounterClosed` event is received

4. **Create BillingEventsListener**
   - Listen for `EncounterClosed` event from Clinical module
   - Auto-generate invoice using InvoiceGenerationService
   - Listen for `AppointmentBooked` event to check outstanding balances

5. **Create All DTOs**
   - CreateInvoiceDto: patientId, encounterId
   - UpdateInvoiceDto: status
   - CreateLineItemDto: invoiceId, description, cost

6. **Update Controller**

#### Dependencies:
- **Waits for:** Ruth's guards, Tomisin's encounters
- **Listens to:** EncounterClosed, AppointmentBooked events

#### Acceptance Criteria:
- [ ] Admins/Staff can generate invoices from encounters
- [ ] Line items can be added to invoices
- [ ] Invoice total is calculated from line items
- [ ] Invoice status workflow works (Draft → Unpaid → Paid)
- [ ] Patients can view their invoices
- [ ] Invoice auto-generated when EncounterClosed event received
- [ ] Outstanding balance check on AppointmentBooked

---

### 7.6 Leke - Frontend Integration

#### Tasks:
1. **API Client Setup**
   - Create axios instance with base URL
   - Add JWT token interceptor
   - Handle token refresh on 401

2. **Authentication Integration**
   - Connect SignIn page to /auth/login
   - Connect SignUp page to /auth/register
   - Store JWT in localStorage/secure storage
   - Implement logout

3. **Patient Dashboard Integration**
   - Connect Appointments page to /scheduling endpoints
   - Connect Prescriptions page to /clinical/prescriptions
   - Connect MedicalRecords page to /clinical/encounters
   - Connect LabResults page to /lab/results
   - Connect Billing page to /billing/invoices
   - Connect Profile page to /clinical/patients

4. **API Service Files to Create:**
```
src/services/
├── api.ts (axios instance)
├── auth.service.ts
├── appointments.service.ts
├── clinical.service.ts
├── lab.service.ts
└── billing.service.ts
```

#### Dependencies:
- **Waits for:** All backend modules to be complete

---

### 7.7 Dimeji - Project Manager

#### Responsibilities:
1. **Sprint Planning**
   - Break tasks into 1-2 day sprints
   - Assign priorities based on dependencies

2. **Code Review**
   - Review all PRs before merge
   - Ensure coding standards are followed
   - Check for security vulnerabilities

3. **Coordination**
   - Daily standups to track progress
   - Identify and resolve blockers
   - Communicate between team members

4. **Documentation**
   - Keep this PRD updated
   - Maintain API documentation
   - Track completion status

5. **Quality Gates**
   - Ensure tests pass before merge
   - Verify acceptance criteria met
   - Sign off on module completion

---

### 7.8 Shared - Notification System (Infrastructure)

> **Note:** This is shared infrastructure. Can be owned by Ruth (extends IAM) or distributed.

#### Files to Create:
```
src/notifications/
├── dto/
│   └── send-notification.dto.ts
├── services/
│   ├── notification.service.ts
│   ├── email.service.ts
│   └── sms.service.ts (optional)
├── events/
│   └── notification-events.listener.ts
├── templates/
│   ├── appointment-confirmation.template.ts
│   ├── appointment-reminder.template.ts
│   └── lab-result-ready.template.ts
└── notifications.module.ts
```

#### Tasks:
1. **Create NotificationService**
   - `sendEmail(to, subject, body)` - send email notification
   - `sendSMS(to, message)` - optional SMS integration
   - `scheduleReminder(appointmentId, reminderTime)` - schedule future notification

2. **Create NotificationEventsListener**
   - Listen for `AppointmentBooked` → send confirmation email
   - Listen for `AppointmentReminder` → send reminder 24h before
   - Listen for `LabResultVerified` → alert patient results are ready
   - Listen for `PatientRegistered` → welcome email (optional)

3. **Email Templates**
   - Appointment confirmation with date/time/clinician
   - Reminder template with appointment details
   - Lab results ready notification

4. **Scheduler Setup (Optional)**
   - Use `@nestjs/schedule` for reminder cron jobs
   - Schedule reminders when appointments are booked
   - Cancel scheduled reminders when appointments are cancelled

#### Integration Points:
| Event | Source Module | Notification Action |
|-------|---------------|---------------------|
| `AppointmentBooked` | Scheduling | Confirmation email with details |
| `AppointmentReminder` | Scheduler | "Your appointment is in 24 hours" |
| `LabResultVerified` | Lab | "Your CityCare results are ready" |
| `EncounterClosed` | Clinical | "Visit summary available" (optional) |

#### Dependencies:
- **Waits for:** Ruth's auth (for user email lookup)
- **Integrates with:** All modules via EventEmitter

#### Acceptance Criteria:
- [ ] Confirmation email sent on appointment booking
- [ ] Reminder notifications scheduled for appointments
- [ ] Lab result notification sent when clinician verifies
- [ ] Email templates render correctly with dynamic data
- [ ] Notification failures logged but don't break main flow

---

## 8. Testing Plan for Therese

### 8.1 Testing Strategy Overview

| Test Type | Responsibility | Tools |
|-----------|----------------|-------|
| Unit Tests | Each Developer | Jest |
| Integration Tests | Therese + Developer | Jest + Supertest |
| E2E Tests | Therese | Playwright/Cypress |
| Manual Testing | Therese + Team | Test Cases |
| Performance Testing | Therese | k6/Artillery |

### 8.2 Test Coverage Requirements

| Module | Minimum Coverage | Critical Paths |
|--------|-----------------|----------------|
| IAM | 90% | Login, Registration, Token Validation |
| Scheduling | 85% | Booking, Cancellation, Conflicts |
| Clinical | 85% | Patient CRUD, Encounters, Prescriptions |
| Lab | 80% | Order workflow, Result upload |
| Billing | 80% | Invoice generation, Status updates |

### 8.3 Test Cases by Module

#### IAM Module Tests (Therese leads, Ruth supports)

| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| IAM-01 | Register with valid data | Integration | Critical |
| IAM-02 | Register with duplicate email | Integration | Critical |
| IAM-03 | Register with weak password | Unit | High |
| IAM-04 | Login with valid credentials | Integration | Critical |
| IAM-05 | Login with invalid password | Integration | Critical |
| IAM-06 | Login with non-existent email | Integration | High |
| IAM-07 | Access protected route without token | Integration | Critical |
| IAM-08 | Access protected route with invalid token | Integration | Critical |
| IAM-09 | Access protected route with expired token | Integration | Critical |
| IAM-10 | Token refresh with valid refresh token | Integration | High |
| IAM-11 | Role-based access - patient accessing admin route | Integration | Critical |
| IAM-12 | Password hash is not returned in responses | Security | Critical |

#### Scheduling Module Tests (Therese leads, Leela supports)

| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| SCH-01 | Get available slots for clinician | Integration | High |
| SCH-02 | Book available slot | Integration | Critical |
| SCH-03 | Book already booked slot | Integration | Critical |
| SCH-04 | Double booking prevention (race condition) | Integration | Critical |
| SCH-05 | Cancel appointment | Integration | High |
| SCH-06 | Reschedule appointment | Integration | High |
| SCH-07 | Create overlapping slots (should fail) | Integration | High |
| SCH-08 | Get patient appointments | Integration | High |
| SCH-09 | Get clinician schedule | Integration | High |
| SCH-10 | Patient can only cancel own appointments | Security | Critical |
| SCH-11 | Staff can register walk-in with is_walk_in=true | Integration | High |
| SCH-12 | AppointmentBooked event emitted on booking | Integration | High |
| SCH-13 | WalkInManagerService bypasses slot availability | Unit | High |

#### Clinical Module Tests (Therese leads, Tomisin supports)

| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| CLN-01 | Create patient chart | Integration | Critical |
| CLN-02 | Update patient chart | Integration | High |
| CLN-03 | Search patient by name | Integration | High |
| CLN-04 | Search patient by phone | Integration | High |
| CLN-05 | Add patient allergy to chart | Integration | High |
| CLN-06 | Create encounter for chart | Integration | Critical |
| CLN-07 | Add SOAP notes to encounter | Integration | Critical |
| CLN-08 | Record vitals (JSON format) | Integration | High |
| CLN-09 | Create prescription for encounter | Integration | Critical |
| CLN-10 | Get patient encounter history | Integration | High |
| CLN-11 | Patient can view own records only | Security | Critical |
| CLN-12 | Clinician can view assigned patients | Security | High |
| CLN-13 | PrescriptionSafetyService warns on allergy match | Unit | Critical |
| CLN-14 | LabOrderPlaced event emitted on lab order | Integration | High |
| CLN-15 | EncounterClosed event emitted when status changes | Integration | High |

#### Lab Module Tests (Therese leads, Paula supports)

| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| LAB-01 | Create lab order | Integration | Critical |
| LAB-02 | Upload lab result | Integration | Critical |
| LAB-03 | Verify lab result | Integration | High |
| LAB-04 | Get patient lab results | Integration | High |
| LAB-05 | Order status workflow | Integration | High |
| LAB-06 | Only lab tech can upload results | Security | Critical |
| LAB-07 | Only clinician can verify results | Security | Critical |
| LAB-08 | Patient can only see verified results | Security | Critical |
| LAB-09 | ResultVerificationService hides unverified from patients | Unit | Critical |
| LAB-10 | LabResultVerified event emitted on verification | Integration | High |

#### Billing Module Tests (Therese leads, Tega supports)

| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| BIL-01 | Generate invoice from encounter | Integration | Critical |
| BIL-02 | Add line items to invoice | Integration | High |
| BIL-03 | Update invoice status | Integration | High |
| BIL-04 | Get patient invoices | Integration | High |
| BIL-05 | Invoice total calculated from line items | Integration | High |
| BIL-06 | Only admin can generate invoices | Security | Critical |
| BIL-07 | Patient can view own invoices only | Security | Critical |
| BIL-08 | Invoice auto-generated on EncounterClosed event | Integration | High |

#### Notification Module Tests (Therese leads)

| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| NTF-01 | Confirmation email sent on AppointmentBooked | Integration | High |
| NTF-02 | Email contains correct appointment details | Unit | High |
| NTF-03 | LabResultVerified triggers patient notification | Integration | High |
| NTF-04 | Notification failures don't break main flow | Integration | High |
| NTF-05 | Email templates render with dynamic data | Unit | Medium |

### 8.4 E2E Test Scenarios

| ID | Scenario | Steps |
|----|----------|-------|
| E2E-01 | Patient Registration to Booking | Register → Login → View Slots → Book Appointment |
| E2E-02 | Complete Patient Visit | Login (Clinician) → Start Encounter → Add Notes → Prescribe → Order Lab → Complete |
| E2E-03 | Lab Result Flow | Order Created → Tech Uploads → Clinician Verifies → Patient Views |
| E2E-04 | Billing Flow | Encounter Complete → Invoice Generated → Patient Views → Payment |

### 8.5 Test Delegation Matrix

| Test Category | Primary Owner | Support |
|---------------|---------------|---------|
| IAM Unit Tests | Ruth | Therese |
| IAM Integration Tests | Therese | Ruth |
| Scheduling Unit Tests | Leela | Therese |
| Scheduling Integration Tests | Therese | Leela |
| Clinical Unit Tests | Tomisin | Therese |
| Clinical Integration Tests | Therese | Tomisin |
| Lab Unit Tests | Paula | Therese |
| Lab Integration Tests | Therese | Paula |
| Billing Unit Tests | Tega | Therese |
| Billing Integration Tests | Therese | Tega |
| Notification Unit Tests | Therese | Ruth |
| Notification Integration Tests | Therese | All |
| E2E Tests | Therese | Leke |
| Security Tests | Therese | Ruth |
| Performance Tests | Therese | All |

### 8.6 Test Environment Setup

```bash
# Test database (separate from development)
DATABASE_URL="postgresql://postgres:password@localhost:5432/citycare_test"

# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run specific module tests
npm run test -- --testPathPattern=iam
npm run test -- --testPathPattern=scheduling
```

### 8.7 Test Data Requirements

Therese should create seed data for testing:
```typescript
// test/fixtures/users.fixture.ts
export const testUsers = {
  patient: { email: 'patient@test.com', password: 'Test123!', role: 'Patient' },
  clinician: { email: 'doctor@test.com', password: 'Test123!', role: 'Clinician' },
  labTech: { email: 'lab@test.com', password: 'Test123!', role: 'Lab Technician' },
  staff: { email: 'staff@test.com', password: 'Test123!', role: 'Staff' },
  admin: { email: 'admin@test.com', password: 'Test123!', role: 'Admin' },
};
```

---

## 9. API Endpoint Specifications

### 9.1 Authentication Endpoints

#### POST /auth/register
**Request:**
```json
{
  "email": "patient@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "role": "Patient"
}
```
**Response (201):**
```json
{
  "id": "uuid",
  "email": "patient@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "Patient",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### POST /auth/login
**Request:**
```json
{
  "email": "patient@example.com",
  "password": "SecurePass123!"
}
```
**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "email": "patient@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "Patient"
  }
}
```

#### GET /auth/me
**Headers:** `Authorization: Bearer <accessToken>`
**Response (200):**
```json
{
  "id": "uuid",
  "email": "patient@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "role": "Patient",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### 9.2 Scheduling Endpoints

#### POST /scheduling/bookings
**Headers:** `Authorization: Bearer <accessToken>`
**Request:**
```json
{
  "patientId": "uuid",
  "clinicianId": "uuid",
  "startTime": "2024-01-20T09:00:00Z",
  "endTime": "2024-01-20T09:30:00Z",
  "reasonForVisit": "Annual checkup"
}
```
**Response (201):**
```json
{
  "id": "uuid",
  "patientId": "uuid",
  "slotId": "uuid",
  "status": "Confirmed",
  "reasonForVisit": "Annual checkup",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### GET /scheduling/clinicians/:clinicianId/slots
**Headers:** `Authorization: Bearer <accessToken>`
**Query:** `?date=2024-01-20`
**Response (200):**
```json
{
  "clinicianId": "uuid",
  "date": "2024-01-20",
  "slots": [
    {
      "id": "uuid",
      "startTime": "2024-01-20T09:00:00Z",
      "endTime": "2024-01-20T09:30:00Z",
      "status": "Available"
    },
    {
      "id": "uuid",
      "startTime": "2024-01-20T09:30:00Z",
      "endTime": "2024-01-20T10:00:00Z",
      "status": "Booked"
    }
  ]
}
```

### 9.3 Clinical Endpoints

#### POST /clinical/patients/:userId/chart
**Headers:** `Authorization: Bearer <accessToken>`
**Request:**
```json
{
  "bloodType": "O+",
  "dob": "1990-05-15"
}
```
**Response (201):**
```json
{
  "id": "uuid",
  "patientId": "uuid",
  "bloodType": "O+",
  "dob": "1990-05-15"
}
```

#### POST /clinical/encounters
**Headers:** `Authorization: Bearer <accessToken>`
**Request:**
```json
{
  "chartId": "uuid"
}
```
**Response (201):**
```json
{
  "id": "uuid",
  "chartId": "uuid",
  "clinicianId": "uuid",
  "status": "Open",
  "date": "2024-01-20T09:00:00Z"
}
```

#### POST /clinical/encounters/:id/notes
**Headers:** `Authorization: Bearer <accessToken>`
**Request:**
```json
{
  "subjective": "Patient reports headache for 3 days",
  "objective": "BP 120/80, Temp 98.6F",
  "assessment": "Tension headache",
  "plan": "OTC pain relief, follow up if persists",
  "vitals": {
    "bloodPressure": "120/80",
    "heartRate": 72,
    "temperature": 98.6,
    "weight": 150,
    "height": 68
  }
}
```

#### POST /clinical/encounters/:id/prescriptions
**Headers:** `Authorization: Bearer <accessToken>`
**Request:**
```json
{
  "medicationName": "Ibuprofen",
  "dosage": "400mg",
  "frequency": "Every 6 hours",
  "duration": "7 days"
}
```

### 9.4 Lab Endpoints

#### POST /lab/orders
**Headers:** `Authorization: Bearer <accessToken>`
**Request:**
```json
{
  "encounterId": "uuid",
  "priority": "Routine"
}
```
**Response (201):**
```json
{
  "id": "uuid",
  "encounterId": "uuid",
  "priority": "Routine",
  "status": "Ordered"
}
```

#### POST /lab/orders/:orderId/test-items
**Headers:** `Authorization: Bearer <accessToken>`
**Request:**
```json
{
  "testName": "Complete Blood Count"
}
```
**Response (201):**
```json
{
  "id": "uuid",
  "orderId": "uuid",
  "testName": "Complete Blood Count"
}
```

#### POST /lab/test-items/:testItemId/results
**Headers:** `Authorization: Bearer <accessToken>`
**Request:**
```json
{
  "resultValue": "WBC: 7.5, RBC: 4.8, Hemoglobin: 14.2",
  "abnormalityFlag": "Normal",
  "fileUrl": "https://storage.example.com/results/abc123.pdf"
}
```
**Response (201):**
```json
{
  "id": "uuid",
  "testItemId": "uuid",
  "resultValue": "WBC: 7.5, RBC: 4.8, Hemoglobin: 14.2",
  "abnormalityFlag": "Normal",
  "fileUrl": "https://storage.example.com/results/abc123.pdf",
  "isVerified": false,
  "verifiedBy": null
}
```

### 9.5 Billing Endpoints

#### POST /billing/invoices
**Headers:** `Authorization: Bearer <accessToken>`
**Request:**
```json
{
  "patientId": "uuid",
  "encounterId": "uuid"
}
```
**Response (201):**
```json
{
  "id": "uuid",
  "patientId": "uuid",
  "encounterId": "uuid",
  "totalAmount": 0.00,
  "status": "Draft"
}
```

#### POST /billing/invoices/:invoiceId/line-items
**Headers:** `Authorization: Bearer <accessToken>`
**Request:**
```json
{
  "description": "Office Visit",
  "cost": 150.00
}
```
**Response (201):**
```json
{
  "id": "uuid",
  "invoiceId": "uuid",
  "description": "Office Visit",
  "cost": 150.00
}
```

---

## 10. Security Requirements

### 10.1 Authentication Security
- Passwords must be hashed with bcrypt (minimum 10 rounds)
- JWT access tokens expire in 1 hour
- JWT refresh tokens expire in 7 days
- Tokens must be invalidated on logout
- Failed login attempts should be rate-limited

### 10.2 Authorization Rules
| Resource | Patient | Clinician | Lab Tech | Admin |
|----------|---------|-----------|----------|-------|
| Own Profile | RW | RW | RW | RW |
| Other Profiles | - | R | - | RW |
| Own Appointments | RW | R | - | RW |
| All Appointments | - | R (assigned) | - | RW |
| Own Medical Records | R | - | - | R |
| Patient Medical Records | - | RW (assigned) | - | R |
| Lab Orders | - | RW | R | R |
| Lab Results | R (verified) | RW | W | R |
| Own Invoices | R | - | - | RW |
| All Invoices | - | - | - | RW |

### 10.3 Data Protection
- All API endpoints must use HTTPS
- Sensitive data (SSN, full DOB) must be encrypted at rest
- Audit logs must capture all data access
- PII must not be logged in plain text

### 10.4 Input Validation
- All inputs must be validated using class-validator
- SQL injection prevention via Prisma parameterized queries
- XSS prevention via proper output encoding
- File uploads must be validated (type, size, content)

---

## Appendix A: Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/citycare_db"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_REFRESH_EXPIRES_IN="7d"

# Application
PORT=3000
NODE_ENV="development"

# File Storage (for lab results)
STORAGE_BUCKET="citycare-files"
STORAGE_REGION="us-east-1"
```

---

## Appendix B: Quick Start for Developers

```bash
# 1. Clone and install
git clone <repo>
cd citycare-backend
npm install

# 2. Setup database
# Create PostgreSQL database named citycare_db
# Run migrations
npx prisma migrate dev

# 3. Create .env file
cp .env.example .env
# Edit .env with your database credentials

# 4. Generate Prisma client
npx prisma generate

# 5. Start development server
npm run start:dev

# 6. Run tests
npm run test
```

---

## Appendix C: Git Branch Strategy

```
main
  └── develop
        ├── feature/iam-authentication (Ruth)
        ├── feature/scheduling-enhancements (Leela)
        ├── feature/clinical-module (Tomisin)
        ├── feature/lab-module (Paula)
        ├── feature/billing-module (Tega)
        └── feature/frontend-integration (Leke)
```

**Branch Rules:**
1. All work happens in feature branches
2. PRs require code review by Dimeji
3. PRs require passing tests
4. Merge to develop, then to main for releases

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-15 | Claude | Initial PRD creation |

---

*This document should be updated as requirements change or new information becomes available.*
