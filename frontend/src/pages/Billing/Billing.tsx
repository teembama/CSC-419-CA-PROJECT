import React, { useState, useEffect } from 'react';
import styles from './Billing.module.css';
import { Button } from '../../components';
import { useAuth } from '../../context';
import { billingAPI } from '../../services/api';

interface Invoice {
  id: string;
  invoice_number?: string;
  total_amount: string;
  status: string;
  billing_line_items?: {
    id: string;
    description: string;
    cost: string;
  }[];
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user?.id) return;

      try {
        const invoicesData = await billingAPI.getPatientInvoices(user.id).catch(() => []);
        setInvoices(invoicesData || []);

        // Derive payments from paid invoices (since there's no separate payments table)
        const paidInvoices = (invoicesData || []).filter((inv: Invoice) => inv.status === 'Paid');
        const derivedPayments: Payment[] = paidInvoices.map((inv: Invoice, index: number) => ({
          id: inv.id,
          payment_number: `PAY-${(index + 1).toString().padStart(4, '0')}`,
          payment_method: 'Online Payment',
          amount: inv.total_amount,
          payment_date: new Date().toISOString(), // Approximation since we don't have actual payment date
        }));
        setPayments(derivedPayments);
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

  // Calculate outstanding balance (Draft, Pending, Unpaid, or Overdue invoices)
  const outstandingBalance = invoices
    .filter(inv => ['Draft', 'Pending', 'Unpaid', 'Overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0);

  const handlePayment = async () => {
    if (!paymentForm.cardNumber || !paymentForm.expiryDate || !paymentForm.cvv || !paymentForm.cardholderName) {
      setPaymentMessage({ type: 'error', text: 'Please fill in all payment fields' });
      return;
    }

    setPaymentProcessing(true);
    setPaymentMessage(null);

    // Simulate payment processing
    setTimeout(async () => {
      try {
        // Mark unpaid invoices as paid
        const unpaidInvoices = invoices.filter(inv => ['Draft', 'Pending', 'Unpaid', 'Overdue'].includes(inv.status));
        for (const invoice of unpaidInvoices) {
          await billingAPI.updateInvoice(invoice.id, { status: 'Paid' });
        }

        setPaymentMessage({ type: 'success', text: 'Payment successful! Your balance has been cleared.' });
        setPaymentForm({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });

        // Refresh data after payment
        const invoicesData = await billingAPI.getPatientInvoices(user!.id);
        setInvoices(invoicesData || []);

        // Update payments list
        const paidInvoices = (invoicesData || []).filter((inv: Invoice) => inv.status === 'Paid');
        const derivedPayments: Payment[] = paidInvoices.map((inv: Invoice, index: number) => ({
          id: inv.id,
          payment_number: `PAY-${(index + 1).toString().padStart(4, '0')}`,
          payment_method: 'Online Payment',
          amount: inv.total_amount,
          payment_date: new Date().toISOString(),
        }));
        setPayments(derivedPayments);

        // Close modal after success
        setTimeout(() => {
          setShowPaymentModal(false);
          setPaymentMessage(null);
        }, 2000);
      } catch (error) {
        setPaymentMessage({ type: 'error', text: 'Payment failed. Please try again.' });
      } finally {
        setPaymentProcessing(false);
      }
    }, 1500);
  };

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
        <Button disabled={outstandingBalance === 0} onClick={() => setShowPaymentModal(true)}>Pay Now</Button>
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
                {invoices.map((invoice) => {
                  // Get description from line items or default
                  const description = invoice.billing_line_items?.length
                    ? invoice.billing_line_items.map(item => item.description).join(', ')
                    : 'Medical Services';

                  return (
                    <tr key={invoice.id}>
                      <td className={styles.invoiceId}>#{invoice.invoice_number || invoice.id.slice(0, 8).toUpperCase()}</td>
                      <td>
                        <div className={styles.descriptionCell}>
                          <span>{description}</span>
                          <span className={styles.statusBadge} data-status={invoice.status?.toLowerCase()}>
                            {invoice.status}
                          </span>
                        </div>
                      </td>
                      <td className={invoice.status === 'Paid' ? styles.amountBlack : styles.amountRed}>
                        {formatCurrency(invoice.total_amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No invoices found
            </p>
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
            <button
              className={styles.viewAllLink}
              onClick={() => {/* Show all payments - already showing in table */}}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View All Payments &gt;&gt;
            </button>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className={styles.modalOverlay} onClick={() => !paymentProcessing && setShowPaymentModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Make Payment</h2>
              <button
                className={styles.modalClose}
                onClick={() => !paymentProcessing && setShowPaymentModal(false)}
                disabled={paymentProcessing}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.paymentAmount}>
                <span>Amount to Pay:</span>
                <span className={styles.paymentAmountValue}>{formatCurrency(outstandingBalance)}</span>
              </div>

              {paymentMessage && (
                <div className={`${styles.paymentMessage} ${paymentMessage.type === 'success' ? styles.success : styles.error}`}>
                  {paymentMessage.text}
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Cardholder Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={paymentForm.cardholderName}
                  onChange={(e) => setPaymentForm({ ...paymentForm, cardholderName: e.target.value })}
                  disabled={paymentProcessing}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Card Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={paymentForm.cardNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                  disabled={paymentProcessing}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={paymentForm.expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2);
                      }
                      setPaymentForm({ ...paymentForm, expiryDate: value });
                    }}
                    disabled={paymentProcessing}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={paymentForm.cvv}
                    onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    disabled={paymentProcessing}
                  />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowPaymentModal(false)}
                disabled={paymentProcessing}
              >
                Cancel
              </button>
              <Button onClick={handlePayment} disabled={paymentProcessing}>
                {paymentProcessing ? 'Processing...' : `Pay ${formatCurrency(outstandingBalance)}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
