import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './MedicalRecords.module.css';
import { ChevronRightIcon, WarningIcon } from '../../components';
import { useAuth } from '../../context';
import { clinicalAPI, labAPI, schedulingAPI } from '../../services/api';
import avatar from '../../assets/avatar.png';

type TabType = 'overview' | 'visit-history';

interface Diagnosis {
  id: string;
  diagnosis_name: string;
  diagnosis_code: string;
  notes: string;
}

interface Encounter {
  id: string;
  date: string;
  status: string;
  users?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  patient_notes_soap?: SoapNote[];
  patient_prescriptions?: Prescription[];
}

interface Allergy {
  id: string;
  allergen_name: string;
  severity: string;
}

interface SoapNote {
  id: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration?: string;
}

interface PatientChart {
  id: string;
  patient_id: string;
  blood_type?: string;
  dob?: string;
  allergies?: string[];
  patient_allergies?: Allergy[];
  diagnoses?: Diagnosis[];
  patient_encounters?: Encounter[];
}

// Red circle icon for diagnosis
const DiagnosisIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8" stroke="#EF4444" strokeWidth="2"/>
    <circle cx="10" cy="10" r="3" fill="#EF4444"/>
  </svg>
);

interface LabResult {
  id: string;
  test_name: string;
  result_value: string;
  status: string;
  result_date: string;
}

interface PastAppointment {
  id: string;
  status: string;
  reasonForVisit?: string;
  startTime?: string;
  slot?: {
    startTime: string;
    endTime: string;
  };
  clinician?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export const MedicalRecords: React.FC = () => {
  const location = useLocation();
  const initialTab = (location.state as { tab?: TabType })?.tab || 'overview';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [chart, setChart] = useState<PatientChart | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [pastAppointments, setPastAppointments] = useState<PastAppointment[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<PastAppointment | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('all'); // Default to all time when coming from appointments
  const { user } = useAuth();

  // Update tab when navigating from appointments
  useEffect(() => {
    const navState = location.state as { tab?: TabType } | null;
    if (navState?.tab) {
      setActiveTab(navState.tab);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchMedicalData = async () => {
      if (!user?.id) return;

      try {
        const [chartData, labData, bookingsData] = await Promise.all([
          clinicalAPI.getPatientChart(user.id).catch(() => null),
          labAPI.getPatientResults(user.id).catch(() => []),
          schedulingAPI.getPatientBookings(user.id).catch(() => []),
        ]);

        setChart(chartData);

        // Use encounters from chart data (already included in the response)
        const encountersFromChart = chartData?.patient_encounters || [];
        setEncounters(encountersFromChart);

        // Filter past appointments (completed or past date)
        const now = new Date();
        const pastBookings = (bookingsData || []).filter((b: PastAppointment) => {
          const startTime = b.slot?.startTime || b.startTime;
          return startTime && new Date(startTime) <= now;
        });
        setPastAppointments(pastBookings);

        setLabResults(labData || []);
      } catch (error) {
        console.error('Error fetching medical data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicalData();
  }, [user?.id]);

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return 'Date not available';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const patientInfo = {
    name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Patient',
    dateOfBirth: chart?.dob ? formatDate(chart.dob) : (user?.date_of_birth ? formatDate(user.date_of_birth) : 'Not specified'),
    bloodGroup: chart?.blood_type || 'Not specified',
    allergies: [...new Set(chart?.patient_allergies?.map(a => `${a.allergen_name} (${a.severity})`) || chart?.allergies || [])],
  };

  // Extract diagnoses from SOAP note assessments
  const diagnoses = chart?.patient_encounters?.flatMap(enc =>
    enc.patient_notes_soap?.map(soap => ({
      id: soap.id,
      diagnosis_name: soap.assessment.split('.')[0].split('-')[0].trim(), // Get first sentence/phrase
      diagnosis_code: '',
      notes: soap.assessment,
    })) || []
  ).filter((d, i, arr) => arr.findIndex(x => x.diagnosis_name === d.diagnosis_name) === i) || []; // Remove duplicates

  // Extract current medications from prescriptions
  const medications = chart?.patient_encounters?.flatMap(enc =>
    enc.patient_prescriptions?.map(p => ({
      id: p.id,
      name: `${p.medication_name} ${p.dosage}`,
      frequency: p.frequency,
      duration: p.duration,
    })) || []
  ).filter((m, i, arr) => arr.findIndex(x => x.name === m.name) === i) || []; // Remove duplicates

  // Filter encounters by date
  const filteredEncounters = encounters.filter(encounter => {
    if (dateFilter === 'all') return true;
    const encounterDate = new Date(encounter.date);
    const now = new Date();
    const daysAgo = parseInt(dateFilter, 10);
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return encounterDate >= cutoffDate;
  });

  // Filter past appointments by date
  const filteredPastAppointments = pastAppointments.filter(appointment => {
    if (dateFilter === 'all') return true;
    const appointmentDate = new Date(appointment.slot?.startTime || appointment.startTime || '');
    const now = new Date();
    const daysAgo = parseInt(dateFilter, 10);
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return appointmentDate >= cutoffDate;
  });

  // Combined visit history (encounters + appointments that don't have encounters yet)
  const hasVisitData = filteredEncounters.length > 0 || filteredPastAppointments.length > 0;

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Medical Records</h1>
          <p className={styles.description}>
            A summary of your health information from your clinic visits.
          </p>
        </div>
        <div className={styles.breadcrumb}>
          <span className={styles.breadcrumbItem}>Medical Records</span>
          <ChevronRightIcon size={14} color="#A4A4A4" />
          <span className={styles.breadcrumbItemActive}>
            {activeTab === 'overview' ? 'Overview' : 'Visit History'}
          </span>
        </div>
      </div>

      {/* Main Content Card */}
      <div className={styles.contentCard}>
        {/* Patient Info Section */}
        <div className={styles.patientSection}>
          <div className={styles.patientInfo}>
            <img src={avatar} alt={patientInfo.name} className={styles.patientAvatar} />
            <div className={styles.patientDetails}>
              <h2 className={styles.patientName}>{patientInfo.name}</h2>
              <div className={styles.patientMeta}>
                <span>Date of Birth : <strong>{patientInfo.dateOfBirth}</strong></span>
                <span className={styles.separator}>|</span>
                <span>Blood Group: <strong>{patientInfo.bloodGroup}</strong></span>
              </div>
            </div>
          </div>

          {patientInfo.allergies.length > 0 && (
            <div className={styles.allergyBanner}>
              <div className={styles.allergyContent}>
                <WarningIcon size={20} />
                <span>Allergies - {patientInfo.allergies.join(', ')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabRow}>
          <div className={styles.tabsContainer}>
            <button
              className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'visit-history' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('visit-history')}
            >
              Visit History
            </button>
          </div>

          {activeTab === 'visit-history' && (
            <div className={styles.filterDropdown}>
              <select
                className={styles.filterSelect}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="30">Last 30 days</option>
                <option value="60">Last 60 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <p style={{ padding: '40px', textAlign: 'center' }}>Loading...</p>
        ) : (
          <>
            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
              <div className={styles.overviewContent}>
                <div className={styles.overviewGrid}>
                  {/* Diagnoses Card */}
                  <div className={styles.infoCard}>
                    <h3 className={styles.cardTitle}>Diagnoses</h3>
                    <div className={styles.cardContent}>
                      {diagnoses.length > 0 ? (
                        diagnoses.map((diagnosis) => (
                          <div key={diagnosis.id} className={styles.diagnosisItem}>
                            <DiagnosisIcon />
                            <div className={styles.diagnosisInfo}>
                              <span className={styles.diagnosisName}>{diagnosis.diagnosis_name}</span>
                              <span className={styles.diagnosisDesc}>
                                {diagnosis.diagnosis_code || diagnosis.notes || 'No description'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: '#666', padding: '10px 0' }}>No diagnoses on record</p>
                      )}
                    </div>
                  </div>

                  {/* Current Medications Card */}
                  <div className={styles.infoCard}>
                    <h3 className={styles.cardTitle}>Current Medications</h3>
                    <div className={styles.cardContent}>
                      {medications.length > 0 ? (
                        medications.map((med) => (
                          <div key={med.id} className={styles.diagnosisItem}>
                            <span style={{ color: '#22C55E', fontSize: '20px' }}>💊</span>
                            <div className={styles.diagnosisInfo}>
                              <span className={styles.diagnosisName}>{med.name}</span>
                              <span className={styles.diagnosisDesc}>
                                {med.frequency}{med.duration ? ` • ${med.duration}` : ''}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: '#666', padding: '10px 0' }}>
                          No current medications
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Lab Results Card */}
                <div className={styles.labResultsCard}>
                  <h3 className={styles.cardTitle}>Recent Lab Results</h3>
                  <div className={styles.cardContent}>
                    {labResults.length > 0 ? (
                      labResults.slice(0, 3).map((result) => (
                        <div key={result.id} className={styles.diagnosisItem}>
                          <span style={{
                            color: result.status === 'Normal' ? '#22C55E' : '#EF4444',
                            fontSize: '20px'
                          }}>🧪</span>
                          <div className={styles.diagnosisInfo}>
                            <span className={styles.diagnosisName}>{result.test_name}</span>
                            <span className={styles.diagnosisDesc}>
                              {result.result_value?.slice(0, 50)}{result.result_value?.length > 50 ? '...' : ''} • {result.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#666', padding: '10px 0' }}>
                        No recent lab results
                      </p>
                    )}
                    {labResults.length > 3 && (
                      <a href="/lab-results" style={{ color: '#03A5FF', fontSize: '14px', marginTop: '10px', display: 'block' }}>
                        View all {labResults.length} results →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Visit History Tab Content */}
            {activeTab === 'visit-history' && (
              <div className={styles.visitHistory}>
                {hasVisitData ? (
                  <>
                    {/* Clinical Encounters with full records */}
                    {filteredEncounters.map((encounter) => {
                      const chiefComplaint = encounter.patient_notes_soap?.[0]?.subjective?.split('.')[0] || 'General consultation';
                      const doctorName = encounter.users
                        ? (encounter.users.first_name?.startsWith('Dr.')
                            ? `${encounter.users.first_name} ${encounter.users.last_name}`
                            : `Dr. ${encounter.users.first_name} ${encounter.users.last_name}`)
                        : 'CityCare Medical Staff';
                      return (
                        <div key={`encounter-${encounter.id}`} className={styles.visitCard}>
                          <div className={styles.visitInfo}>
                            <img src={avatar} alt={doctorName} className={styles.visitAvatar} />
                            <div className={styles.visitDetails}>
                              <span className={styles.visitDoctor}>{doctorName}</span>
                              <span className={styles.visitDepartment}>Medical Visit</span>
                              <span className={styles.visitReason}>Reason: {chiefComplaint}</span>
                            </div>
                          </div>
                          <div className={styles.visitActions}>
                            <button
                              className={styles.viewDetailsBtn}
                              onClick={() => setSelectedEncounter(encounter)}
                            >
                              View Details
                            </button>
                            <span className={styles.visitDate}>{formatDate(encounter.date)}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Past Appointments */}
                    {filteredPastAppointments.map((appointment) => {
                      const appointmentDate = appointment.slot?.startTime || appointment.startTime || '';
                      const doctorName = appointment.clinician
                        ? (appointment.clinician.first_name?.startsWith('Dr.')
                            ? `${appointment.clinician.first_name} ${appointment.clinician.last_name}`
                            : `Dr. ${appointment.clinician.first_name} ${appointment.clinician.last_name}`)
                        : 'Your Doctor';
                      return (
                        <div key={`appointment-${appointment.id}`} className={styles.visitCard}>
                          <div className={styles.visitInfo}>
                            <img src={avatar} alt={doctorName} className={styles.visitAvatar} />
                            <div className={styles.visitDetails}>
                              <span className={styles.visitDoctor}>{doctorName}</span>
                              <span className={styles.visitDepartment}>Appointment</span>
                              <span className={styles.visitReason}>
                                Reason: {appointment.reasonForVisit || 'General Consultation'}
                              </span>
                            </div>
                          </div>
                          <div className={styles.visitActions}>
                            <span className={`${styles.statusBadge} ${styles[`status${appointment.status}`] || ''}`}>
                              {appointment.status}
                            </span>
                            <span className={styles.visitDate}>{formatDate(appointmentDate)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <p style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    No visit history found
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Encounter Details Modal */}
      {selectedEncounter && (
        <div className={styles.modalOverlay} onClick={() => setSelectedEncounter(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Visit Details</h2>
              <button className={styles.modalClose} onClick={() => setSelectedEncounter(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalSection}>
                <h3>Visit Information</h3>
                <p><strong>Date:</strong> {formatDate(selectedEncounter.date)}</p>
                <p><strong>Status:</strong> {selectedEncounter.status}</p>
                <p><strong>Doctor:</strong> {selectedEncounter.users
                  ? (selectedEncounter.users.first_name?.startsWith('Dr.')
                      ? `${selectedEncounter.users.first_name} ${selectedEncounter.users.last_name}`
                      : `Dr. ${selectedEncounter.users.first_name} ${selectedEncounter.users.last_name}`)
                  : 'CityCare Medical Staff'}</p>
              </div>

              {selectedEncounter.patient_notes_soap && selectedEncounter.patient_notes_soap.length > 0 && (
                <div className={styles.modalSection}>
                  <h3>Clinical Notes</h3>
                  {selectedEncounter.patient_notes_soap.map((soap, index) => (
                    <div key={soap.id || index} className={styles.soapNote}>
                      <p><strong>Subjective:</strong> {soap.subjective || 'N/A'}</p>
                      <p><strong>Objective:</strong> {soap.objective || 'N/A'}</p>
                      <p><strong>Assessment:</strong> {soap.assessment || 'N/A'}</p>
                      <p><strong>Plan:</strong> {soap.plan || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedEncounter.patient_prescriptions && selectedEncounter.patient_prescriptions.length > 0 && (
                <div className={styles.modalSection}>
                  <h3>Prescriptions</h3>
                  {selectedEncounter.patient_prescriptions.map((rx, index) => (
                    <div key={rx.id || index} className={styles.prescriptionItem}>
                      <p><strong>{rx.medication_name}</strong> - {rx.dosage}</p>
                      <p className={styles.rxDetails}>{rx.frequency}{rx.duration ? ` • ${rx.duration}` : ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalCloseBtn} onClick={() => setSelectedEncounter(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;
