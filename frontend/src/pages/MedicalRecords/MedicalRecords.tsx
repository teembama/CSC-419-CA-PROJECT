import React, { useState, useEffect } from 'react';
import styles from './MedicalRecords.module.css';
import { ChevronRightIcon, WarningIcon } from '../../components';
import { useAuth } from '../../context';
import { clinicalAPI } from '../../services/api';
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
  encounter_date: string;
  chief_complaint: string;
  status: string;
  clinician?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface PatientChart {
  id: string;
  patient_id: string;
  blood_type?: string;
  allergies?: string[];
  diagnoses?: Diagnosis[];
  encounters?: Encounter[];
}

// Red circle icon for diagnosis
const DiagnosisIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8" stroke="#EF4444" strokeWidth="2"/>
    <circle cx="10" cy="10" r="3" fill="#EF4444"/>
  </svg>
);

export const MedicalRecords: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [chart, setChart] = useState<PatientChart | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMedicalData = async () => {
      if (!user?.id) return;

      try {
        const [chartData, encountersData] = await Promise.all([
          clinicalAPI.getPatientChart(user.id).catch(() => null),
          clinicalAPI.getPatientEncounters(user.id).catch(() => []),
        ]);

        setChart(chartData);
        setEncounters(encountersData || []);
      } catch (error) {
        console.error('Error fetching medical data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicalData();
  }, [user?.id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const patientInfo = {
    name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Patient',
    dateOfBirth: user?.date_of_birth ? formatDate(user.date_of_birth) : 'Not specified',
    bloodGroup: chart?.blood_type || 'Not specified',
    allergies: chart?.allergies || [],
  };

  const diagnoses = chart?.diagnoses || [];

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
              <select className={styles.filterSelect}>
                <option>Last 30 days</option>
                <option>Last 60 days</option>
                <option>Last 90 days</option>
                <option>All time</option>
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
                      <p style={{ color: '#666', padding: '10px 0' }}>
                        View prescriptions for current medications
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Lab Results Card */}
                <div className={styles.labResultsCard}>
                  <h3 className={styles.cardTitle}>Recent Lab Results</h3>
                  <div className={styles.cardContent}>
                    <p style={{ color: '#666', padding: '10px 0' }}>
                      View lab results for recent tests
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Visit History Tab Content */}
            {activeTab === 'visit-history' && (
              <div className={styles.visitHistory}>
                {encounters.length > 0 ? (
                  encounters.map((encounter) => (
                    <div key={encounter.id} className={styles.visitCard}>
                      <div className={styles.visitInfo}>
                        <img
                          src={avatar}
                          alt={`Dr. ${encounter.clinician?.first_name}`}
                          className={styles.visitAvatar}
                        />
                        <div className={styles.visitDetails}>
                          <span className={styles.visitDoctor}>
                            Dr. {encounter.clinician?.first_name} {encounter.clinician?.last_name}
                          </span>
                          <span className={styles.visitDepartment}>Medical Visit</span>
                          <span className={styles.visitReason}>
                            Reason: {encounter.chief_complaint || 'General consultation'}
                          </span>
                        </div>
                      </div>
                      <div className={styles.visitActions}>
                        <button className={styles.viewDetailsBtn}>View Details</button>
                        <span className={styles.visitDate}>{formatDate(encounter.encounter_date)}</span>
                      </div>
                    </div>
                  ))
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
    </div>
  );
};

export default MedicalRecords;
