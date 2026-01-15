// Authentication Pages
export { SignUp } from './SignUp/SignUp';
export { SignIn } from './SignIn/SignIn';
export { ForgotPassword } from './ForgotPassword/ForgotPassword';
export { ResetPassword } from './ResetPassword/ResetPassword';

// Dashboard Pages (Patient)
export { Home } from './Home/Home';
export { Prescriptions } from './Prescriptions/Prescriptions';
export { MedicalRecords } from './MedicalRecords/MedicalRecords';
export { Appointments } from './Appointments/Appointments';
export { BookAppointment } from './BookAppointment/BookAppointment';
export { Billing } from './Billing/Billing';
export { LabResults } from './LabResults/LabResults';
export { Profile } from './Profile/Profile';

// Clinician Pages
export {
  ClinicianSignIn,
  ClinicianSignUp,
  ClinicianDashboard,
  ClinicianLabs,
  ClinicianPatients,
  ClinicianAppointments,
  ClinicianProfile,
} from './Clinician';

// Admin Pages
export {
  AdminSignIn,
  AdminDashboard,
  AdminUserManagement,
  AdminRolesPermissions,
  AdminAuditLogs,
  AdminProfile,
} from './Admin';

// Technician Pages
export {
  TechnicianSignIn,
  TechnicianSignUp,
  TechnicianDashboard,
  TechnicianLabOrders,
  TechnicianResults,
  TechnicianProfile,
} from './Technician';
