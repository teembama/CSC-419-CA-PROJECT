import React, { useState, useEffect } from 'react';
import styles from './LabResults.module.css';
import { WarningIcon } from '../../components';
import { useAuth } from '../../context';
import { labAPI } from '../../services/api';

interface LabResult {
  id: string;
  test_name: string;
  result_value: string;
  unit: string;
  reference_range: string;
  status: string;
  notes: string;
  result_date: string;
  order?: {
    id: string;
    test_type: string;
  };
}

// Document icon for doctor's notes
const NotesIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="2" width="14" height="16" rx="2" stroke="#03A5FF" strokeWidth="1.5"/>
    <path d="M6 6H14" stroke="#03A5FF" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 10H14" stroke="#03A5FF" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 14H10" stroke="#03A5FF" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Three dots menu icon
const MoreIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="4" r="1.5" fill="#9EA2AD"/>
    <circle cx="10" cy="10" r="1.5" fill="#9EA2AD"/>
    <circle cx="10" cy="16" r="1.5" fill="#9EA2AD"/>
  </svg>
);

// Arrow right icon for trend
const TrendArrowIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const LabResults: React.FC = () => {
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [askQuestionResult, setAskQuestionResult] = useState<LabResult | null>(null);
  const { user } = useAuth();

  // Filter states
  const [testTypeFilter, setTestTypeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('severity');

  // Generate and download PDF for a lab result
  const handleDownloadPDF = (result: LabResult) => {
    const formatDateForPDF = (dateStr: string | null | undefined) => {
      if (!dateStr) return 'Date not available';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Date not available';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to download the PDF');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lab Result - ${result.test_name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #0d9488; }
          .title { font-size: 20px; margin-top: 10px; }
          .patient-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .result-section { margin-bottom: 25px; }
          .result-section h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
          .result-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .result-label { font-weight: 600; color: #666; }
          .result-value { color: #333; }
          .abnormal { color: #dc2626; font-weight: bold; }
          .normal { color: #16a34a; }
          .notes { background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 20px; }
          .notes-title { font-weight: bold; margin-bottom: 10px; }
          .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">CityCare Medical Center</div>
          <div class="title">Laboratory Test Result</div>
        </div>

        <div class="patient-info">
          <strong>Patient:</strong> ${user?.first_name || user?.firstName || ''} ${user?.last_name || user?.lastName || ''}<br>
          <strong>Date Generated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        <div class="result-section">
          <h3>${result.test_name}</h3>
          <div class="result-row">
            <span class="result-label">Test Date:</span>
            <span class="result-value">${formatDateForPDF(result.result_date)}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Result:</span>
            <span class="result-value ${result.status !== 'Normal' ? 'abnormal' : ''}">${result.result_value} ${result.unit || ''}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Reference Range:</span>
            <span class="result-value">${result.reference_range || 'N/A'}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Status:</span>
            <span class="result-value ${result.status !== 'Normal' ? 'abnormal' : 'normal'}">${result.status}</span>
          </div>
        </div>

        ${result.notes ? `
        <div class="notes">
          <div class="notes-title">Doctor's Notes:</div>
          <p>${result.notes}</p>
        </div>
        ` : ''}

        <div class="footer">
          <p>This document is generated from CityCare Medical Center's electronic health records.</p>
          <p>For questions about your results, please contact your healthcare provider.</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load then trigger print
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  // Handle "Ask a Question" - show modal
  const handleAskQuestion = (result: LabResult) => {
    setAskQuestionResult(result);
  };

  useEffect(() => {
    const fetchLabResults = async () => {
      if (!user?.id) return;

      try {
        const data = await labAPI.getPatientResults(user.id);
        setResults(data || []);
        // Expand the first abnormal result by default
        const firstAbnormal = data?.find((r: LabResult) => r.status !== 'Normal');
        if (firstAbnormal) setExpandedId(firstAbnormal.id);
      } catch (error) {
        console.error('Error fetching lab results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLabResults();
  }, [user?.id]);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Date not available';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Date not available';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusDisplay = (status: string) => {
    if (status === 'Normal') return 'Normal';
    if (status === 'High' || status === 'Above Normal') return 'Above normal';
    if (status === 'Low' || status === 'Below Normal') return 'Below normal';
    return status;
  };

  const isAbnormal = (status: string) => status !== 'Normal';

  // Get unique test types for filter dropdown
  const testTypes = [...new Set(results.map(r => r.test_name || r.order?.test_type || 'Unknown'))];

  // Apply filters and sorting
  const getFilteredResults = () => {
    let filtered = [...results];

    // Filter by test type
    if (testTypeFilter !== 'all') {
      filtered = filtered.filter(r => (r.test_name || r.order?.test_type) === testTypeFilter);
    }

    // Filter by date range
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      const days = parseInt(dateRangeFilter);
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(r => {
        if (!r.result_date) return true;
        return new Date(r.result_date) >= cutoffDate;
      });
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'severity':
          // Abnormal results first
          const aAbnormal = isAbnormal(a.status) ? 0 : 1;
          const bAbnormal = isAbnormal(b.status) ? 0 : 1;
          return aAbnormal - bAbnormal;
        case 'date':
          const dateA = a.result_date ? new Date(a.result_date).getTime() : 0;
          const dateB = b.result_date ? new Date(b.result_date).getTime() : 0;
          return dateB - dateA; // Most recent first
        case 'name':
          const nameA = (a.test_name || a.order?.test_type || '').toLowerCase();
          const nameB = (b.test_name || b.order?.test_type || '').toLowerCase();
          return nameA.localeCompare(nameB);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredResults = getFilteredResults();

  // Calculate summary based on ALL results (not filtered)
  const summaryData = {
    totalTests: results.length,
    normal: results.filter(r => !isAbnormal(r.status)).length,
    abnormal: results.filter(r => isAbnormal(r.status)).length,
  };

  const expandedResult = filteredResults.find(r => r.id === expandedId);
  const collapsedResults = filteredResults.filter(r => r.id !== expandedId);

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Lab Results</h1>
        <p className={styles.description}>
          Results from your clinic visits, reviewed by your care team.
        </p>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryCards}>
        <div className={`${styles.summaryCard} ${styles.summaryTotal}`}>
          <span className={styles.summaryLabel}>Total Tests</span>
          <span className={styles.summaryValue}>{loading ? '-' : summaryData.totalTests}</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryNormal}`}>
          <span className={styles.summaryLabel}>Normal</span>
          <span className={styles.summaryValue}>{loading ? '-' : summaryData.normal}</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryAbnormal}`}>
          <span className={styles.summaryLabel}>Abnormal</span>
          <span className={styles.summaryValue}>{loading ? '-' : summaryData.abnormal}</span>
        </div>
      </div>

      {/* Filters Row */}
      <div className={styles.filtersRow}>
        <select
          className={styles.filterSelect}
          value={testTypeFilter}
          onChange={(e) => setTestTypeFilter(e.target.value)}
        >
          <option value="all">All Tests</option>
          {testTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={dateRangeFilter}
          onChange={(e) => setDateRangeFilter(e.target.value)}
        >
          <option value="30">Last 30 days</option>
          <option value="60">Last 60 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
        <select
          className={styles.filterSelect}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="severity">Sort: Severity</option>
          <option value="date">Sort: Date</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {loading ? (
        <p style={{ padding: '20px', textAlign: 'center' }}>Loading...</p>
      ) : results.length === 0 ? (
        <div className={styles.expandedCard}>
          <p style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            No lab results found
          </p>
        </div>
      ) : (
        <>
          {/* Expanded Test Card */}
          {expandedResult && (
            <div className={styles.expandedCard}>
              <div className={styles.expandedHeader}>
                <div className={styles.expandedTitleRow}>
                  {isAbnormal(expandedResult.status) && <WarningIcon size={20} />}
                  <span className={styles.expandedTitle}>
                    {expandedResult.test_name || expandedResult.order?.test_type}
                  </span>
                  {isAbnormal(expandedResult.status) && (
                    <span className={styles.followUpBadge}>Needs follow-up</span>
                  )}
                </div>
                <div className={styles.expandedMeta}>
                  <span className={styles.lastTested}>
                    Last Tested: {formatDate(expandedResult.result_date)}
                  </span>
                  <button className={styles.moreBtn}>
                    <MoreIcon />
                  </button>
                </div>
              </div>

              <div className={styles.expandedBody}>
                <div className={styles.resultDetails}>
                  <div className={styles.resultColumn}>
                    <span className={styles.resultLabel}>Result:</span>
                    <span className={styles.resultValue}>
                      {expandedResult.result_value} {expandedResult.unit}
                    </span>
                  </div>
                  <div className={styles.resultColumn}>
                    <span className={styles.resultLabel}>Normal Range:</span>
                    <div className={styles.normalRangeValue}>
                      <span className={styles.greenDot}></span>
                      <span>{expandedResult.reference_range || 'N/A'}</span>
                    </div>
                  </div>
                  <div className={styles.resultColumn}>
                    <span className={styles.resultLabel}>Status:</span>
                    <div className={styles.statusValue}>
                      {isAbnormal(expandedResult.status) && (
                        <span className={styles.redTriangle}>▲</span>
                      )}
                      <span>{getStatusDisplay(expandedResult.status)}</span>
                    </div>
                  </div>
                  <div className={styles.chartPlaceholder}></div>
                </div>

                {/* Doctor's Notes (if available) */}
                {expandedResult.notes && (
                  <div className={styles.doctorNotes}>
                    <div className={styles.notesContent}>
                      <NotesIcon />
                      <span><strong>Doctor's Notes:</strong> {expandedResult.notes}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons - Always visible */}
                <div className={styles.resultActions}>
                  <button className={styles.downloadBtn} onClick={() => handleDownloadPDF(expandedResult)}>Download PDF</button>
                  <button className={styles.askBtn} onClick={() => handleAskQuestion(expandedResult)}>Ask a question</button>
                </div>
              </div>
            </div>
          )}

          {/* Collapsed Test Cards */}
          {collapsedResults.map((result) => (
            <div key={result.id} className={styles.collapsedCard}>
              <div className={styles.collapsedInfo}>
                <span className={styles.collapsedTitle}>
                  {result.test_name || result.order?.test_type}
                </span>
                <div className={styles.collapsedStatus}>
                  <span className={isAbnormal(result.status) ? styles.redDot : styles.greenDot}></span>
                  <span>{isAbnormal(result.status) ? 'Abnormal' : 'Normal'}</span>
                  <span className={styles.statusDivider}>|</span>
                  <TrendArrowIcon />
                  <span className={styles.trendText}>
                    {result.result_value} {result.unit}
                  </span>
                </div>
              </div>
              <div className={styles.collapsedActions}>
                <span className={styles.lastTested}>
                  Last Tested: {formatDate(result.result_date)}
                </span>
                <button
                  className={styles.viewDetailsBtn}
                  onClick={() => setExpandedId(result.id)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Ask Question Modal */}
      {askQuestionResult && (
        <div className={styles.modalOverlay} onClick={() => setAskQuestionResult(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <div className={styles.modalIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h2 className={styles.modalTitle}>Ask a Question</h2>
              </div>
              <button className={styles.modalClose} onClick={() => setAskQuestionResult(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalTestName}>
                {askQuestionResult.test_name || askQuestionResult.order?.test_type}
              </p>
              <p className={styles.modalMessage}>
                Have questions about your lab results? Our care team is here to help you understand your results and discuss any concerns.
              </p>
              <div className={styles.contactOptions}>
                <div className={styles.contactOption}>
                  <div className={styles.contactIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div className={styles.contactText}>
                    <span className={styles.contactLabel}>Call the Clinic</span>
                    <span className={styles.contactValue}>(234) 800-CITYCARE</span>
                  </div>
                </div>
                <div className={styles.contactOption}>
                  <div className={styles.contactIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div className={styles.contactText}>
                    <span className={styles.contactLabel}>Schedule Follow-up</span>
                    <span className={styles.contactValue}>Book an appointment with your doctor</span>
                  </div>
                </div>
                <div className={styles.contactOption}>
                  <div className={styles.contactIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div className={styles.contactText}>
                    <span className={styles.contactLabel}>Secure Messaging</span>
                    <span className={styles.contactValue}>Coming soon</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalCloseBtn} onClick={() => setAskQuestionResult(null)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabResults;
