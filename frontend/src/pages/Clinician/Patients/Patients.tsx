import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Patients.css';
import { clinicalAPI, schedulingAPI } from '../../../services/api';
import { useAuth } from '../../../context';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  chartId?: string;
}

interface PatientDetails {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  patientId: string;
  tags: string[];
  vitals: {
    bp: string;
    heartRate: string;
    weight: string;
    temperature: string;
  };
  prescriptions: Array<{
    medication: string;
    status: string;
    dosage: string;
    frequency: string;
  }>;
  labRequests: Array<{
    name: string;
    date: string;
    status: string;
  }>;
}

const Patients: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // Search for patients (empty query returns all)
        const patientsData = await clinicalAPI.searchPatients('').catch(() => []);
        setPatients(patientsData || []);

        // Select first patient by default
        if (patientsData && patientsData.length > 0) {
          await loadPatientDetails(patientsData[0].id);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const loadPatientDetails = async (patientId: string) => {
    try {
      const chart = await clinicalAPI.getPatientChart(patientId).catch(() => null);

      if (chart) {
        // Get prescriptions from chart
        const prescriptions = chart.prescriptions?.map((p: any) => ({
          medication: p.medication_name || 'Unknown',
          status: 'Active',
          dosage: p.dosage || 'N/A',
          frequency: p.frequency || 'N/A',
        })) || [];

        // Get lab requests from chart
        const labRequests = chart.labOrders?.map((l: any) => ({
          name: l.testItems?.[0]?.testName || 'Lab Test',
          date: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'N/A',
          status: l.status || 'Pending',
        })) || [];

        // Get vitals from latest encounter
        const latestEncounter = chart.encounters?.[0];
        const vitals = latestEncounter?.soapNotes?.vitals || {
          bp: 'N/A',
          heartRate: 'N/A',
          weight: 'N/A',
          temperature: 'N/A',
        };

        setSelectedPatient({
          id: patientId,
          name: `${chart.patient?.first_name || ''} ${chart.patient?.last_name || ''}`,
          age: chart.dob ? Math.floor((Date.now() - new Date(chart.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined,
          gender: chart.patient?.gender,
          patientId: patientId.slice(0, 5),
          tags: chart.allergies?.map((a: any) => a.allergen_name) || [],
          vitals: {
            bp: vitals.bloodPressure || vitals.bp || '120/80',
            heartRate: vitals.heartRate || '72',
            weight: vitals.weight || '70',
            temperature: vitals.temperature || '36.6',
          },
          prescriptions,
          labRequests,
        });
      }
    } catch (error) {
      console.error('Error loading patient details:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const results = await clinicalAPI.searchPatients(searchQuery);
      setPatients(results || []);
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="labs-page">
      {/* Top bar */}
      <header className="labs-topbar">
        <div className="labs-brand">
          <img
            src="/images/citycare-logo-icon.png"
            alt="CityCare logo"
            className="labs-logoImage"
          />
          <span className="labs-brandName">CityCare</span>
        </div>

        <div className="labs-search">
          <span className="labs-searchIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm6.2-1.1 4.3 4.3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input className="labs-searchInput" placeholder="Search..." />
        </div>

        <div className="labs-topRight">
          <button
            className="labs-iconBtn"
            type="button"
            aria-label="Notifications"
          >
            <img
              className="labs-bellImg"
              src="/images/notification-bell.png"
              alt="Notifications"
            />
            <span className="labs-dot" aria-hidden="true" />
          </button>

          <div className="labs-user">
            <div className="labs-avatar">
              <img
                className="labs-avatarImg"
                src="/images/justin.jpg"
                alt={`${user?.first_name} ${user?.last_name}`}
              />
            </div>

            <div className="labs-userMeta">
              <div className="labs-userName">{user?.first_name} {user?.last_name}</div>
              <div className="labs-userRole">{user?.roles?.name || 'Clinician'}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="labs-body">
        {/* Sidebar */}
        <aside className="labs-sidebar">
          <div className="labs-sidebarBox">
            <div className="labs-navHeader">
              <div className="labs-navHeaderPanel">
                <img
                  className="labs-navHeaderCollapse"
                  src="/images/sidebar-collapse.png"
                  alt="Collapse sidebar"
                />
                <span className="labs-navHeaderTitle">Navigation</span>
              </div>
            </div>

            <div className="labs-sectionTitle">Main</div>

            <nav className="labs-nav">
              <button className="labs-navItem" type="button" onClick={() => handleNavigation('/clinician/dashboard')}>
                <span className="labs-navItemIcon">
                  <img className="labs-navImg" src="/images/home.png" alt="" />
                </span>
                Home
              </button>

              <button className="labs-navItem" type="button" onClick={() => handleNavigation('/clinician/appointments')}>
                <span className="labs-navItemIcon">
                  <img className="labs-navImg" src="/images/appointments.png" alt="" />
                </span>
                Appointments
              </button>

              <button className="labs-navItem labs-navItem--active" type="button">
                <span className="labs-navItemIcon">
                  <img className="labs-navImg" src="/images/patients.png" alt="" />
                </span>
                Patients
              </button>

              <button className="labs-navItem" type="button" onClick={() => handleNavigation('/clinician/labs')}>
                <span className="labs-navItemIcon">
                  <img className="labs-navImg" src="/images/labs.png" alt="" />
                </span>
                Labs
              </button>
            </nav>

            <div className="labs-sectionTitle labs-mt24">Secondary</div>

            <nav className="labs-nav">
              <button className="labs-navItem" type="button" onClick={() => handleNavigation('/clinician/profile')}>
                <span className="labs-navItemIcon">
                  <img className="labs-navImg" src="/images/profile.png" alt="" />
                </span>
                Profile
              </button>

              <button className="labs-navItem" type="button">
                <span className="labs-navItemIcon">
                  <img className="labs-navImg" src="/images/help-circle.png" alt="" />
                </span>
                Help / Support
              </button>
            </nav>

            <button className="labs-logout" type="button" onClick={() => handleNavigation('/clinician/signin')}>
              <span className="labs-logoutIcon">
                <img className="labs-logoutImg" src="/images/log-out.png" alt="" />
              </span>
              Logout
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="labs-content">
          <div className="patients-wrapper">
            {/* Left Column - Patients List */}
            <div className="patients-left">
              <h1 className="patients-pageTitle">Patients</h1>
              
              <div className="patients-list-section">
                <div className="patients-search">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm6.2-1.1 4.3 4.3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>

                <div className="appointments-list">
                  {loading ? (
                    <p style={{ padding: '20px', textAlign: 'center' }}>Loading patients...</p>
                  ) : patients.length === 0 ? (
                    <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No patients found</p>
                  ) : (
                    patients.map((patient, index) => (
                      <div
                        key={patient.id}
                        className={`appointment-card ${selectedPatient?.id === patient.id ? 'first' : ''}`}
                        onClick={() => loadPatientDetails(patient.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <img src="/images/avatar.png" alt={`${patient.firstName} ${patient.lastName}`} className="patient-avatar" />

                        <div className="appointment-info">
                          <h3>{patient.firstName} {patient.lastName}</h3>
                          <p className="patient-id">ID: {patient.id.slice(0, 5)}</p>
                          <p className="next-appt">{patient.email}</p>
                        </div>

                        <div className="appointment-status">
                          <p className="status-label">Status:</p>
                          <span className="status-text-complete">Active</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Patient Details */}
            <div className="patient-details-wrapper">
              <div className="patient-details-topbar">
                <button className="schedule-appointment-btn" type="button" onClick={() => navigate('/clinician/appointments')}>
                  Schedule Appointment
                </button>
              </div>
              
              <div className="patient-details-section">
                {selectedPatient ? (
                  <>
                    <div className="patient-header">
                      <img src="/images/avatar.png" alt={selectedPatient.name} className="patient-avatar-large" />
                      <div className="patient-header-info">
                        <h2>{selectedPatient.name}</h2>
                        <p className="patient-meta">
                          {selectedPatient.age ? `${selectedPatient.age} years` : ''}
                          {selectedPatient.gender ? ` · ${selectedPatient.gender}` : ''}
                          {` · ID: ${selectedPatient.patientId}`}
                        </p>
                        <div className="patient-tags">
                          {selectedPatient.tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className={`tag ${i === 0 ? 'tag-purple' : 'tag-green'}`}>{tag}</span>
                          ))}
                          {selectedPatient.tags.length === 0 && (
                            <span className="tag tag-purple">No allergies</span>
                          )}
                        </div>
                      </div>
                      <div className="patient-actions">
                        <button className="icon-btn" onClick={() => alert('Edit patient details')}>
                          <img src="/images/edit-icon.png" alt="Edit" className="action-icon" />
                        </button>
                        <button className="icon-btn" onClick={() => alert('More options')}>
                          <img src="/images/more-icon.png" alt="More" className="action-icon" />
                        </button>
                      </div>
                    </div>

                    <div className="patient-info-grid">
                      {/* Upcoming Appointments */}
                      <div className="info-card upcoming-card">
                        <div className="card-header">
                          <div className="card-title">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <rect x="3" y="4" width="14" height="13" rx="2" stroke="#00B8D4" strokeWidth="1.5"/>
                              <path d="M3 8H17M7 1V4M13 1V4" stroke="#00B8D4" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            <span>Upcoming Appointments</span>
                          </div>
                          <button className="history-link" onClick={() => navigate('/clinician/appointments')}>History</button>
                        </div>

                        <div className="appointment-detail-card">
                          <h4>General Consultation</h4>
                          <div className="appointment-datetime">
                            <span className="date-badge">Schedule</span>
                            <span className="time-text">No upcoming appointments</span>
                          </div>
                          <div className="appointment-actions">
                            <button className="btn-primary" onClick={() => navigate('/clinician/appointments')}>Schedule</button>
                          </div>
                        </div>
                      </div>

                      {/* Last Vitals */}
                      <div className="info-card vitals-card">
                        <div className="card-header">
                          <span className="card-title-text">Last Vitals</span>
                          <span className="recorded-text">Most Recent</span>
                        </div>

                        <div className="vitals-grid">
                          <div className="vital-item">
                            <div className="vital-label">BP</div>
                            <div className="vital-value">{selectedPatient.vitals.bp}</div>
                            <div className="vital-unit">mmHg</div>
                          </div>
                          <div className="vital-item">
                            <div className="vital-label">Heart Rate</div>
                            <div className="vital-value">{selectedPatient.vitals.heartRate}</div>
                            <div className="vital-unit">bpm</div>
                          </div>
                          <div className="vital-item">
                            <div className="vital-label">Weight</div>
                            <div className="vital-value">{selectedPatient.vitals.weight}</div>
                            <div className="vital-unit">kg</div>
                          </div>
                          <div className="vital-item">
                            <div className="vital-label">Temperature</div>
                            <div className="vital-value">{selectedPatient.vitals.temperature}</div>
                            <div className="vital-unit">°C</div>
                          </div>
                        </div>
                      </div>

                      {/* Active Prescriptions */}
                      <div className="info-card prescriptions-card">
                        <div className="card-header">
                          <span className="card-title-text">Active Prescriptions</span>
                          <button className="add-new-link" onClick={() => alert('Add new prescription')}>+ Add New</button>
                        </div>

                        <table className="prescriptions-table">
                          <thead>
                            <tr>
                              <th>Medication</th>
                              <th>Status</th>
                              <th>Dosage</th>
                              <th>Frequency</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedPatient.prescriptions.length > 0 ? (
                              selectedPatient.prescriptions.map((p, i) => (
                                <tr key={i}>
                                  <td>{p.medication}</td>
                                  <td><span className="status-badge-small active">{p.status}</span></td>
                                  <td>{p.dosage}</td>
                                  <td>{p.frequency}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} style={{ textAlign: 'center', color: '#666' }}>No prescriptions</td>
                              </tr>
                            )}
                          </tbody>
                        </table>

                        <button className="view-all-link" onClick={() => alert('View all prescriptions')}>View All</button>
                      </div>

                      {/* Recent Lab Requests */}
                      <div className="info-card lab-requests-card">
                        <h3 className="card-title-cyan">Recent Lab Requests</h3>

                        {selectedPatient.labRequests.length > 0 ? (
                          selectedPatient.labRequests.map((lab, i) => (
                            <div key={i} className="lab-request-item">
                              <div className="lab-request-info">
                                <h4>{lab.name}</h4>
                                <p className="lab-request-date">Requested: {lab.date}</p>
                              </div>
                              <span className={`status-badge-small ${lab.status.toLowerCase()}`}>{lab.status}</span>
                            </div>
                          ))
                        ) : (
                          <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No lab requests</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    <p>Select a patient to view details</p>
                  </div>
                )}
            </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Patients;