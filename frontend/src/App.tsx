import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  SignUp,
  SignIn,
  ForgotPassword,
  Home,
  Prescriptions,
  MedicalRecords,
  Appointments,
  BookAppointment,
  Billing,
  LabResults,
  Profile,
  ClinicianSignIn,
  ClinicianSignUp,
  ClinicianDashboard,
  ClinicianLabs,
  ClinicianPatients,
  ClinicianAppointments,
  ClinicianProfile,
  ClinicianProfileSecurity,
} from './pages';
import { DashboardLayout } from './layouts';
import { ProtectedRoute } from './components';
import './styles/global.css';

// Placeholder component for pages your teammates will implement
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    gap: '16px',
  }}>
    <h2 style={{ color: '#4A4A4A', margin: 0 }}>{title}</h2>
    <p style={{ color: '#9EA2AD', margin: 0 }}>This page is ready for your teammates to implement.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Patient Authentication Routes (no sidebar/header) */}
        <Route path="/login" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Clinician Authentication Routes (no sidebar/header) */}
        <Route path="/clinician/signin" element={<ClinicianSignIn />} />
        <Route path="/clinician/signup" element={<ClinicianSignUp />} />

        {/* Clinician Dashboard Routes (each page has its own embedded sidebar/header) */}
        <Route path="/clinician/dashboard" element={
          <ProtectedRoute requiredRole="Clinician">
            <ClinicianDashboard />
          </ProtectedRoute>
        } />
        <Route path="/clinician/labs" element={
          <ProtectedRoute requiredRole="Clinician">
            <ClinicianLabs />
          </ProtectedRoute>
        } />
        <Route path="/clinician/patients" element={
          <ProtectedRoute requiredRole="Clinician">
            <ClinicianPatients />
          </ProtectedRoute>
        } />
        <Route path="/clinician/appointments" element={
          <ProtectedRoute requiredRole="Clinician">
            <ClinicianAppointments />
          </ProtectedRoute>
        } />
        <Route path="/clinician/profile" element={
          <ProtectedRoute requiredRole="Clinician">
            <ClinicianProfile />
          </ProtectedRoute>
        } />
        <Route path="/clinician/profile/security" element={
          <ProtectedRoute requiredRole="Clinician">
            <ClinicianProfileSecurity />
          </ProtectedRoute>
        } />

        {/* Patient Dashboard Routes (with sidebar/header) */}
        <Route element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          {/* Implemented pages */}
          <Route path="/prescriptions" element={<Prescriptions />} />
          <Route path="/medical-records" element={<MedicalRecords />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/appointments/book" element={<BookAppointment />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/lab-results" element={<LabResults />} />
          <Route path="/profile" element={<Profile />} />

          {/* Home route */}
          <Route path="/" element={<Home />} />

          {/* Placeholder routes for teammates to implement */}
          <Route path="/help" element={<PlaceholderPage title="Help / Support" />} />
        </Route>

        {/* Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
