import { useEffect, useRef } from 'react';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import { formatDate, formatTime, formatWorkingHours } from '../../utils/formatters';
import '../../styles/components.css';

/**
 * AttendanceTable — reusable table for displaying attendance records.
 * showValidation, showEmployee, showActions are feature flags.
 */
const AttendanceTable = ({
  records = [],
  showEmployee = false,
  showValidation = false,
  onValidate,
  onViewSelfie,
}) => {
  const tableRef = useRef(null);

  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (el.scrollWidth > el.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const atLeft = el.scrollLeft <= 0 && e.deltaY < 0;
        const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && e.deltaY > 0;
        if (!atLeft && !atRight) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  if (!records.length) {
    return <EmptyState icon="📋" title="No attendance records" description="No records found for the selected filters." />;
  }

  return (
    <div className="table-wrapper" ref={tableRef}>
      <table className="table">
        <thead>
          <tr>
            {showEmployee && <th>Employee</th>}
            <th>Date</th>
            <th>Punch In</th>
            <th>Punch Out</th>
            <th>Hours</th>
            <th>Status</th>
            {showValidation && <th>Validation</th>}
            <th>Selfie</th>
            <th>Location</th>
            {onValidate && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {records.map((rec) => {
            const employee = rec.userId || rec.employee;
            return (
              <tr key={rec._id}>
                {showEmployee && (
                  <td>
                    <div className="name-cell">
                      <div className="avatar">
                        {employee?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="name-cell-info">
                        <div className="name">{employee?.name || 'N/A'}</div>
                        <div className="email">{employee?.email || ''}</div>
                      </div>
                    </div>
                  </td>
                )}
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatDate(rec.date)}
                </td>
                <td>{rec.punchIn ? formatTime(rec.punchIn) : '—'}</td>
                <td>{rec.punchOut ? formatTime(rec.punchOut) : '—'}</td>
                <td>
                  <span className="working-hours-badge" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>
                    {formatWorkingHours(rec.workingMinutes)}
                  </span>
                </td>
                <td><Badge status={rec.attendanceStatus || 'active'} /></td>
                {showValidation && (
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <Badge status={rec.validationStatus || 'pending'} />
                      {rec.validationRemarks && (
                        <span className="remarks-badge">{rec.validationRemarks}</span>
                      )}
                    </div>
                  </td>
                )}
                <td>
                  {rec.punchInSelfie ? (
                    <img
                      src={rec.punchInSelfie}
                      alt="Punch-in selfie"
                      className="selfie-thumb"
                      onClick={() => onViewSelfie && onViewSelfie(rec.punchInSelfie)}
                    />
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                  )}
                </td>
                <td>
                  {rec.punchInLocation ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '220px' }}>
                      {rec.punchInLocation.address ? (
                        <span
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'block',
                          }}
                          title={rec.punchInLocation.address}
                        >
                          📍 {rec.punchInLocation.address}
                        </span>
                      ) : null}
                      <a
                        href={`https://maps.google.com/?q=${rec.punchInLocation.lat},${rec.punchInLocation.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="map-link"
                      >
                        🗺️ View Map ({rec.punchInLocation.lat.toFixed(3)}, {rec.punchInLocation.lng.toFixed(3)})
                      </a>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                  )}
                </td>
                {onValidate && (
                  <td>
                    <button
                      onClick={() => onValidate(rec)}
                      className="btn btn-ghost btn-sm"
                      id={`btn-validate-${rec._id}`}
                    >
                      ✏️ Review
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
