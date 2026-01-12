import React from 'react';
import styles from './LogoutModal.module.css';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Logout of your account?</h2>
        <p className={styles.message}>
          You'll be signed out of your account and will need to log in again to access your health information.
        </p>

        <div className={styles.actions}>
          <button className={styles.logoutBtn} onClick={onConfirm}>
            Log out
          </button>
          <button className={styles.stayBtn} onClick={onClose}>
            Stay logged in
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
