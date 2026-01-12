import React, { useState, useEffect } from 'react';
import styles from './Billing.module.css';
import { Button } from '../../components';
import { useAuth } from '../../context';
import { billingAPI } from '../../services/api';

interface Invoice {
  id: string;
  invoice_number: string;
  description: string;
  issue_date: string;
  total_amount: string;
  status: string;
}

interface Payment {
  id: string;
  payment_number: string;
  payment_method: string;
  amount: string;
  payment_date: string;
}

export const Billing: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user?.id) return;

      try {
        const [invoicesData, paymentsData] = await Promise.all([
          billingAPI.getPatientInvoices(user.id).catch(() => []),
          billingAPI.getPatientPayments(user.id).catch(() => []),
        ]);

        setInvoices(invoicesData || []);
        setPayments(paymentsData || []);
      } catch (error) {
        console.error('Error fetching billing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [user?.id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₦${num.toLocaleString()}`;
  };

  // Calculate outstanding balance
  const outstandingBalance = invoices
    .filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue')
    .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0);

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Billing</h1>
      </div>

      {/* Outstanding Balance Card */}
      <div className={styles.balanceCard}>
        <div className={styles.balanceInfo}>
          <span className={styles.balanceLabel}>Outstanding Balance</span>
          <span className={styles.balanceAmount}>
            {loading ? 'Loading...' : formatCurrency(outstandingBalance)}
          </span>
        </div>
        <Button disabled={outstandingBalance === 0}>Pay Now</Button>
      </div>

      {/* Two Column Layout */}
      <div className={styles.columnsContainer}>
        {/* Recent Invoices */}
        <div className={styles.tableCard}>
          <h3 className={styles.tableTitle}>Recent Invoices</h3>
          {loading ? (
            <p style={{ padding: '20px', textAlign: 'center' }}>Loading...</p>
          ) : invoices.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 5).map((invoice) => (
                  <tr key={invoice.id}>
                    <td className={styles.invoiceId}>#{invoice.invoice_number || invoice.id.slice(0, 5)}</td>
                    <td>
                      <div className={styles.descriptionCell}>
                        <span>{invoice.description || 'Medical Services'}</span>
                        <span className={styles.dateText}>{formatDate(invoice.issue_date)}</span>
                      </div>
                    </td>
                    <td className={invoice.status === 'Paid' ? styles.amountBlack : styles.amountRed}>
                      {formatCurrency(invoice.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No invoices found
            </p>
          )}
          {invoices.length > 5 && (
            <a href="#" className={styles.viewAllLink}>View All Invoices &gt;&gt;</a>
          )}
        </div>

        {/* Payment History */}
        <div className={styles.tableCard}>
          <h3 className={styles.tableTitle}>Payment History</h3>
          {loading ? (
            <p style={{ padding: '20px', textAlign: 'center' }}>Loading...</p>
          ) : payments.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Method</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 5).map((payment) => (
                  <tr key={payment.id}>
                    <td className={styles.paymentId}>#{payment.payment_number || payment.id.slice(0, 5)}</td>
                    <td>{payment.payment_method || 'Online Payment'}</td>
                    <td className={styles.amountBlack}>{formatCurrency(payment.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No payment history
            </p>
          )}
          {payments.length > 5 && (
            <a href="#" className={styles.viewAllLink}>View All Payments &gt;&gt;</a>
          )}
        </div>
      </div>
    </div>
  );
};

export default Billing;
