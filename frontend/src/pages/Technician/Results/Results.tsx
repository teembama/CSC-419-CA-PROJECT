import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context';
import { labAPI } from '../../../services/api';
import { formatDateTime } from '../../../utils/dateUtils';
import NotificationDropdown from '../../../components/Notifications/NotificationDropdown';
import GlobalSearch from '../../../components/Search/GlobalSearch';
import '../Dashboard/Dashboard.css';
import './Results.css';

interface Result {
  id: string;
  patientName: string;
  test: string;
  resultStatus: 'Abnormal' | 'Normal';
  reviewedByClinician: boolean;
  dateSubmitted: string;
  resultValue: string;
  orderId: string;
}

const Results: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [resultsStatusFilter, setResultsStatusFilter] = useState('All');
  const [clinicianReviewFilter, setClinicianReviewFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [results, setResults] = useState<Result[]>([]);
  const [allResults, setAllResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const itemsPerPage = 10;

  // Get user display name from AuthContext
  const userFullName = `${user?.first_name || user?.firstName || ''} ${user?.last_name || user?.lastName || ''}`.trim() || 'Lab Technician';

  const fetchResults = async () => {
    try {
      setLoading(true);
      // Try to get all results from the new endpoint
      let labResults = await labAPI.getResults().catch(() => []);
      const resultsArray = Array.isArray(labResults) ? labResults : [];

      // Transform results for display
      const transformedResults = resultsArray.map((result: any) => {
        // Patient info from the nested structure
        const patientInfo = result.lab_orders?.patient_encounters?.patient_charts?.users || {};
        const patientName = patientInfo.first_name || patientInfo.last_name
          ? `${patientInfo.first_name || ''} ${patientInfo.last_name || ''}`.trim()
          : 'Unknown Patient';

        const testName = result.test_name || 'Lab Test';
        const dateSubmitted = formatDateTime(result.created_at);
        const orderId = result.lab_orders?.id || '';

        // Determine if abnormal based on abnormality_flag
        const isAbnormal = result.abnormality_flag &&
          !['Normal', 'normal'].includes(result.abnormality_flag);

        return {
          id: result.id || `temp-${Math.random()}`,
          patientName,
          test: testName,
          resultStatus: isAbnormal ? 'Abnormal' : 'Normal',
          reviewedByClinician: result.is_verified || false,
          dateSubmitted,
          resultValue: result.result_value || 'N/A',
          orderId: orderId ? `#LAB-${orderId.slice(0, 4).toUpperCase()}` : 'N/A',
        };
      });

      setAllResults(transformedResults);
      setResults(transformedResults);
    } catch (error) {
      console.error('Error fetching lab results:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  // Filter results when filters change
  useEffect(() => {
    let filtered = [...allResults];

    // Filter by status
    if (resultsStatusFilter !== 'All') {
      filtered = filtered.filter(result => result.resultStatus === resultsStatusFilter);
    }

    // Filter by clinician review
    if (clinicianReviewFilter !== 'All') {
      if (clinicianReviewFilter === 'Yes') {
        filtered = filtered.filter(result => result.reviewedByClinician);
      } else if (clinicianReviewFilter === 'No') {
        filtered = filtered.filter(result => !result.reviewedByClinician);
      }
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(result =>
        result.patientName.toLowerCase().includes(query) ||
        result.test.toLowerCase().includes(query) ||
        result.orderId.toLowerCase().includes(query)
      );
    }

    setResults(filtered);
    setCurrentPage(1);
  }, [resultsStatusFilter, clinicianReviewFilter, searchQuery, allResults]);

  const handleLogout = async () => {
    await logout();
    navigate('/technician/signin');
  };

  const resetFilters = () => {
    setResultsStatusFilter('All');
    setClinicianReviewFilter('All');
    setSearchQuery('');
  };

  const handleViewResult = (result: Result) => {
    setSelectedResult(result);
  };

  const closeModal = () => {
    setSelectedResult(null);
  };

  const exportCSV = () => {
    if (results.length === 0) {
      alert('No results to export.');
      return;
    }

    // Create CSV content
    const headers = ['Patient Name', 'Test', 'Result Status', 'Result Value', 'Reviewed', 'Date Submitted'];
    const csvRows = [headers.join(',')];

    results.forEach(result => {
      const row = [
        `"${result.patientName}"`,
        `"${result.test}"`,
        result.resultStatus,
        `"${result.resultValue}"`,
        result.reviewedByClinician ? 'Yes' : 'No',
        `"${result.dateSubmitted}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lab_results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const paginatedResults = results.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="tech-dashboard-container">
      {/* Header */}
      <header className="tech-header">
        <div className="tech-header-left">
          <img src="/images/citycare-logo-icon.png" alt="CityCare" className="tech-logo-icon" />
          <span className="tech-logo-text">CityCare</span>
        </div>

        <div className="tech-header-center">
          <GlobalSearch userRole="technician" placeholder="Search results..." />
        </div>

        <div className="tech-header-right">
          <NotificationDropdown userRole="technician" />
          <div className="tech-user-profile">
            <img src="/images/avatar.png" alt={userFullName} className="tech-user-avatar" />
            <div className="tech-user-info">
              <span className="tech-user-name">{userFullName}</span>
              <span className="tech-user-role">Lab Technician</span>
            </div>
          </div>
        </div>
      </header>

      <div className="tech-layout">
        {/* Sidebar */}
        <aside className="tech-sidebar">
          <div className="tech-sidebar-header">
            <h3 className="tech-nav-title">Navigation</h3>
          </div>

          <nav className="tech-nav">
            <div className="tech-nav-section">
              <h4 className="tech-nav-section-title">Main</h4>
              <button className="tech-nav-item" onClick={() => navigate('/technician/dashboard')}>
                <span className="tech-nav-icon">🏠</span>
                <span className="tech-nav-label">Dashboard</span>
              </button>
              <button className="tech-nav-item" onClick={() => navigate('/technician/lab-orders')}>
                <span className="tech-nav-icon">📋</span>
                <span className="tech-nav-label">Lab Orders</span>
              </button>
              <button className="tech-nav-item active" onClick={() => navigate('/technician/results')}>
                <span className="tech-nav-icon">📊</span>
                <span className="tech-nav-label">Results</span>
              </button>
            </div>

            <div className="tech-nav-section">
              <h4 className="tech-nav-section-title">Secondary</h4>
              <button className="tech-nav-item" onClick={() => navigate('/technician/profile')}>
                <span className="tech-nav-icon">👤</span>
                <span className="tech-nav-label">Profile</span>
              </button>
            </div>
          </nav>

          <button className="tech-logout-btn" onClick={handleLogout}>
            <span className="tech-logout-icon">🚪</span>
            <span className="tech-logout-label">Logout</span>
          </button>
        </aside>

        {/* Main Content */}
        <main className="tech-main-content">
          <div className="results-header">
            <div>
              <h1 className="tech-page-title">Results</h1>
              <p className="tech-page-subtitle">
                Review laboratory results across all departments.
                {results.length > 0 && ` (${results.length} results)`}
              </p>
            </div>
            <button className="results-export-btn" onClick={exportCSV}>
              Export CSV
            </button>
          </div>

          {/* Filters */}
          <div className="lab-filters-section">
            <div className="lab-filter-group">
              <label className="lab-filter-label">Results Status</label>
              <select
                className="lab-filter-select"
                value={resultsStatusFilter}
                onChange={(e) => setResultsStatusFilter(e.target.value)}
              >
                <option>All</option>
                <option>Normal</option>
                <option>Abnormal</option>
              </select>
            </div>

            <div className="lab-filter-group">
              <label className="lab-filter-label">Clinician Review</label>
              <select
                className="lab-filter-select"
                value={clinicianReviewFilter}
                onChange={(e) => setClinicianReviewFilter(e.target.value)}
              >
                <option>All</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>

            <button className="lab-reset-btn" onClick={resetFilters}>
              🔄 Reset Filters
            </button>
          </div>

          {/* Results Table */}
          <div className="tech-orders-section">
            <div className="tech-table-container">
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  Loading results...
                </div>
              ) : paginatedResults.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  No results found.
                </div>
              ) : (
                <table className="tech-table">
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Test</th>
                      <th>Result Status</th>
                      <th>Reviewed By Clinician</th>
                      <th>Date Submitted</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedResults.map((result) => (
                      <tr key={result.id}>
                        <td>{result.patientName}</td>
                        <td>{result.test}</td>
                        <td>
                          <span
                            className={`results-status-badge ${
                              result.resultStatus === 'Abnormal' ? 'abnormal' : 'normal'
                            }`}
                          >
                            {result.resultStatus}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`results-review-badge ${
                              result.reviewedByClinician ? 'yes' : 'no'
                            }`}
                          >
                            {result.reviewedByClinician ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>{result.dateSubmitted}</td>
                        <td>
                          <button
                            className="tech-action-btn"
                            onClick={() => handleViewResult(result)}
                          >
                            View Result
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {results.length > itemsPerPage && (
              <div className="lab-pagination">
                <button
                  className="lab-pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </button>
                <span style={{ padding: '0 16px', color: '#666' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="lab-pagination-btn primary"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Result Detail Modal */}
      {selectedResult && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Lab Result Details</h2>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Patient Name</label>
                <p style={{ margin: 0, fontWeight: '500' }}>{selectedResult.patientName}</p>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Test</label>
                <p style={{ margin: 0, fontWeight: '500' }}>{selectedResult.test}</p>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Result Value</label>
                <p style={{ margin: 0, fontWeight: '500' }}>{selectedResult.resultValue}</p>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Status</label>
                <span
                  className={`results-status-badge ${selectedResult.resultStatus === 'Abnormal' ? 'abnormal' : 'normal'}`}
                >
                  {selectedResult.resultStatus}
                </span>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Reviewed by Clinician</label>
                <span className={`results-review-badge ${selectedResult.reviewedByClinician ? 'yes' : 'no'}`}>
                  {selectedResult.reviewedByClinician ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Date Submitted</label>
                <p style={{ margin: 0 }}>{selectedResult.dateSubmitted}</p>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Order ID</label>
                <p style={{ margin: 0 }}>{selectedResult.orderId}</p>
              </div>
            </div>

            <button
              onClick={closeModal}
              style={{
                marginTop: '24px',
                width: '100%',
                padding: '12px',
                backgroundColor: '#00A8E8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
