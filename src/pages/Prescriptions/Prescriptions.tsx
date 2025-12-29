import React from 'react';
import styles from './Prescriptions.module.css';
import { ChevronRightIcon, WarningIcon } from '../../components';
import avatar from '../../assets/avatar.png';

interface Prescription {
  id: string;
  name: string;
  dosage: string;
  doctor: string;
  instructions: string;
  status: 'Active' | 'Completed' | 'Expired';
  date: string;
}

const prescriptions: Prescription[] = [
  {
    id: '1',
    name: 'Amlodipine',
    dosage: '5mg',
    doctor: 'Dr John Smith',
    instructions: 'Take three times daily',
    status: 'Active',
    date: 'April 15, 2025',
  },
  {
    id: '2',
    name: 'Amlodipine',
    dosage: '5mg',
    doctor: 'Dr John Smith',
    instructions: 'Take three times daily',
    status: 'Active',
    date: 'April 15, 2025',
  },
  {
    id: '3',
    name: 'Amlodipine',
    dosage: '5mg',
    doctor: 'Dr John Smith',
    instructions: 'Take three times daily',
    status: 'Active',
    date: 'April 15, 2025',
  },
];

const patientInfo = {
  name: 'John Doe',
  dateOfBirth: 'Feb 15, 1985',
  bloodGroup: 'O+',
  allergies: ['Penicillin'],
};

export const Prescriptions: React.FC = () => {
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
          {prescriptions.map((prescription) => (
            <div key={prescription.id} className={styles.prescriptionCard}>
              <div className={styles.prescriptionInfo}>
                <h3 className={styles.prescriptionName}>
                  {prescription.name} {prescription.dosage}
                </h3>
                <p className={styles.prescriptionDoctor}>{prescription.doctor}</p>
                <p className={styles.prescriptionInstructions}>
                  {prescription.instructions}
                </p>
              </div>
              <div className={styles.prescriptionMeta}>
                <span
                  className={`${styles.statusTag} ${
                    styles[prescription.status.toLowerCase()]
                  }`}
                >
                  {prescription.status}
                </span>
                <span className={styles.prescriptionDate}>{prescription.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Prescriptions;
