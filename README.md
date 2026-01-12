# CityCare Healthcare Management System

A full-stack healthcare management system built with NestJS (backend) and React + Vite (frontend).

## Project Structure

```
CSC-419-CA-PROJECT/
├── src/                    # Backend source code (NestJS)
│   ├── iam/               # Identity & Access Management
│   ├── scheduling/        # Appointment scheduling
│   ├── clinical/          # Clinical/patient management
│   ├── billing/           # Billing & invoices
│   ├── lab/               # Laboratory orders & results
│   └── admin/             # Admin functionality
├── frontend/              # Frontend source code (React + Vite)
│   └── src/
│       ├── pages/         # Page components
│       ├── components/    # Reusable components
│       ├── services/      # API services
│       └── context/       # React context
├── prisma/                # Database schema
└── CityCareFinalDatabase  # PostgreSQL database dump
```

## Prerequisites

- **Node.js** v18+ (check with `node --version`)
- **npm** v9+ (check with `npm --version`)
- **PostgreSQL** v15+ (check with `psql --version`)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CSC-419-CA-PROJECT
```

### 2. Database Setup

#### Create the database and restore from dump:

```bash
# Create the database
createdb citycare_db

# Restore the database from the dump file
pg_restore -d citycare_db CityCareFinalDatabase
```

**Alternative: If pg_restore doesn't work, create manually:**

```bash
# Connect to PostgreSQL
psql -U postgres

# In psql, run:
CREATE DATABASE citycare_db;
\c citycare_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
\q
```

Then run Prisma migrations:
```bash
npx prisma db push
```

### 3. Backend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env if needed (default values work for local development)
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/citycare_db"

# Generate Prisma client
npx prisma generate

# Start the backend server
npm run start:dev
```

The backend will run on **http://localhost:3000**

### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the frontend development server
npm run dev
```

The frontend will run on **http://localhost:5173**

## Running the Application

### Start Both Servers

**Terminal 1 - Backend:**
```bash
cd CSC-419-CA-PROJECT
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd CSC-419-CA-PROJECT/frontend
npm run dev
```

### Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000

---

## Demo Accounts

Use these accounts to test the application:

### Patient Account
| Field | Value |
|-------|-------|
| **Email** | `patient@citycare.com` |
| **Password** | `password123` |
| **Role** | Patient |

### Clinician Account
| Field | Value |
|-------|-------|
| **Email** | `clinician@citycare.com` |
| **Password** | `password123` |
| **Role** | Clinician |

### Admin Account
| Field | Value |
|-------|-------|
| **Email** | `admin@citycare.com` |
| **Password** | `password123` |
| **Role** | Admin |

---

## Creating New Demo Accounts

If the demo accounts don't exist in your database, you can create them:

### Option 1: Register via the App
1. Go to http://localhost:5173/signup (Patient) or http://localhost:5173/clinician/signup (Clinician)
2. Fill in the registration form
3. Log in with your new credentials

### Option 2: Create via API
```bash
# Create a Patient account
curl -X POST http://localhost:3000/iam/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@citycare.com",
    "password": "password123",
    "firstName": "Demo",
    "lastName": "Patient",
    "role": "Patient"
  }'

# Create a Clinician account
curl -X POST http://localhost:3000/iam/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "clinician@citycare.com",
    "password": "password123",
    "firstName": "Dr. Demo",
    "lastName": "Clinician",
    "role": "Clinician"
  }'
```

---

## Features

### Patient Features
- View and book appointments
- View medical records
- View lab results
- View and pay bills
- Manage profile

### Clinician Features
- View daily schedule and appointments
- Manage patients
- Create encounters and SOAP notes
- Order lab tests
- Write prescriptions

### Admin Features
- User management
- System audit logs
- Role assignment

---

## API Endpoints

### Authentication
- `POST /iam/register` - Register new user
- `POST /iam/login` - Login
- `POST /iam/refresh` - Refresh token

### Scheduling
- `GET /scheduling/clinicians` - Get all clinicians
- `GET /scheduling/slots/available` - Get available slots
- `POST /scheduling/bookings` - Create booking
- `GET /scheduling/bookings/patient/:id` - Get patient bookings
- `GET /scheduling/clinicians/:id/schedule` - Get clinician schedule

### Clinical
- `GET /clinical/patients/search` - Search patients
- `GET /clinical/charts/:patientId` - Get patient chart
- `POST /clinical/encounters` - Create encounter

### Labs
- `GET /lab/orders` - Get lab orders
- `POST /lab/orders` - Create lab order

### Billing
- `GET /billing/invoices/patient/:id` - Get patient invoices

---

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready

# Check database exists
psql -l | grep citycare_db
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Prisma Issues
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset
```

---

## Tech Stack

### Backend
- **NestJS** - Node.js framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client
- **TypeScript** - Type safety

---

## Team

CSC-419 Course Project

## License

MIT
