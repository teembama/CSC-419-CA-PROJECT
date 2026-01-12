// Authentication Pages
export { SignUp } from './SignUp/SignUp';
export { SignIn } from './SignIn/SignIn';
export { ForgotPassword } from './ForgotPassword/ForgotPassword';

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
  ClinicianProfileSecurity,
} from './Clinician';

// Placeholder pages for teammates to implement
// Export these as your teammates create them:
// export { Help } from './Help/Help';
