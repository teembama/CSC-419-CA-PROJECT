import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignUp, SignIn, Prescriptions } from './pages';
import { DashboardLayout } from './layouts';
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
        {/* Authentication Routes (no sidebar/header) */}
        <Route path="/login" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Dashboard Routes (with sidebar/header) */}
        <Route element={<DashboardLayout />}>
          {/* Your implemented page */}
          <Route path="/prescriptions" element={<Prescriptions />} />

          {/* Placeholder routes for teammates to implement */}
          <Route path="/" element={<PlaceholderPage title="Home / Dashboard" />} />
          <Route path="/appointments" element={<PlaceholderPage title="Appointments" />} />
          <Route path="/medical-records" element={<PlaceholderPage title="Medical Records" />} />
          <Route path="/lab-results" element={<PlaceholderPage title="Lab Results" />} />
          <Route path="/billing" element={<PlaceholderPage title="Billing" />} />
          <Route path="/profile" element={<PlaceholderPage title="Profile" />} />
          <Route path="/help" element={<PlaceholderPage title="Help / Support" />} />
        </Route>

        {/* Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
