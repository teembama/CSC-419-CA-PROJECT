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
  const { user } = useAuth();

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
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

  // Calculate summary
  const summaryData = {
    totalTests: results.length,
    normal: results.filter(r => !isAbnormal(r.status)).length,
    abnormal: results.filter(r => isAbnormal(r.status)).length,
  };

  const expandedResult = results.find(r => r.id === expandedId);
  const collapsedResults = results.filter(r => r.id !== expandedId);

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
        <select className={styles.filterSelect}>
          <option>All Tests</option>
          <option>Cholesterol</option>
          <option>Blood Sugar</option>
          <option>Blood Count</option>
        </select>
        <select className={styles.filterSelect}>
          <option>Last 30 days</option>
          <option>Last 60 days</option>
          <option>Last 90 days</option>
          <option>All time</option>
        </select>
        <select className={styles.filterSelect}>
          <option>Sort: Severity</option>
          <option>Sort: Date</option>
          <option>Sort: Name</option>
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

                {expandedResult.notes && (
                  <div className={styles.doctorNotes}>
                    <div className={styles.notesContent}>
                      <NotesIcon />
                      <span><strong>Doctor's Notes:</strong> {expandedResult.notes}</span>
                    </div>
                    <div className={styles.notesActions}>
                      <button className={styles.downloadBtn}>Download PDF</button>
                      <button className={styles.askBtn}>Ask a question</button>
                    </div>
                  </div>
                )}
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
    </div>
  );
};

export default LabResults;
