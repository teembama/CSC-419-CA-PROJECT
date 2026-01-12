import React, { useState, useEffect } from 'react';
import styles from './Prescriptions.module.css';
import { ChevronRightIcon, WarningIcon } from '../../components';
import { useAuth } from '../../context';
import { clinicalAPI } from '../../services/api';
import avatar from '../../assets/avatar.png';

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  status: string;
  prescribed_date: string;
  clinician?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface PatientChart {
  blood_type?: string;
  allergies?: string[];
}

export const Prescriptions: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [chart, setChart] = useState<PatientChart | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!user?.id) return;

      try {
        const [prescriptionsData, chartData] = await Promise.all([
          clinicalAPI.getPatientPrescriptions(user.id).catch(() => []),
          clinicalAPI.getPatientChart(user.id).catch(() => null),
        ]);

        setPrescriptions(prescriptionsData || []);
        setChart(chartData);
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
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

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Prescriptions</h1>
        </div>
        <div className={styles.breadcrumb}>
          <span className={styles.breadcrumbItem}>Medical Records</span>
          <ChevronRightIcon color="#A4A4A4" />
          <span className={styles.breadcrumbItem}>Prescriptions</span>
        </div>
      </div>

      <p className={styles.description}>
        A summary of your health information from your clinic visits.
      </p>

      <div className={styles.contentCard}>
        {/* Patient Info Section */}
        <div className={styles.patientSection}>
          <div className={styles.patientInfo}>
            <img src={avatar} alt={patientInfo.name} className={styles.patientAvatar} />
            <div className={styles.patientDetails}>
              <h2 className={styles.patientName}>{patientInfo.name}</h2>
              <div className={styles.patientMeta}>
                <span>Date of Birth : {patientInfo.dateOfBirth}</span>
                <span className={styles.separator}>|</span>
                <span>Blood Group: {patientInfo.bloodGroup}</span>
              </div>
            </div>
          </div>

          {patientInfo.allergies.length > 0 && (
            <div className={styles.allergyBanner}>
              <div className={styles.allergyContent}>
                <WarningIcon size={24} />
                <span>Allergies - {patientInfo.allergies.join(', ')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Prescriptions List */}
        <div className={styles.prescriptionsList}>
          {loading ? (
            <p style={{ padding: '40px', textAlign: 'center' }}>Loading...</p>
          ) : prescriptions.length > 0 ? (
            prescriptions.map((prescription) => (
              <div key={prescription.id} className={styles.prescriptionCard}>
                <div className={styles.prescriptionInfo}>
                  <h3 className={styles.prescriptionName}>
                    {prescription.medication_name} {prescription.dosage}
                  </h3>
                  <p className={styles.prescriptionDoctor}>
                    Dr. {prescription.clinician?.first_name} {prescription.clinician?.last_name}
                  </p>
                  <p className={styles.prescriptionInstructions}>
                    {prescription.frequency} - {prescription.instructions || 'Follow prescribed instructions'}
                  </p>
                </div>
                <div className={styles.prescriptionMeta}>
                  <span
                    className={`${styles.statusTag} ${
                      styles[(prescription.status || 'active').toLowerCase()]
                    }`}
                  >
                    {prescription.status || 'Active'}
                  </span>
                  <span className={styles.prescriptionDate}>
                    {formatDate(prescription.prescribed_date)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              No prescriptions found
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Prescriptions;
