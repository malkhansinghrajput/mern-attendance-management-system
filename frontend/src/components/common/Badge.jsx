import '../../styles/components.css';

/**
 * Badge — for status display
 * type: attendance | validation | overtime | role
 */
const statusMap = {
  // Attendance
  active: 'badge-active',
  completed: 'badge-completed',
  incomplete: 'badge-incomplete',
  // Validation
  pending: 'badge-pending',
  valid: 'badge-valid',
  invalid: 'badge-invalid',
  // Overtime
  approved: 'badge-approved',
  rejected: 'badge-rejected',
  // Roles
  employee: 'badge-employee',
  manager: 'badge-manager',
  admin: 'badge-admin',
};

const emojiMap = {
  active: '🟢',
  completed: '✅',
  incomplete: '⚠️',
  pending: '⏳',
  valid: '✅',
  invalid: '❌',
  approved: '✅',
  rejected: '❌',
};

const Badge = ({ status, showEmoji = true, children }) => {
  const value = (status || '').toLowerCase();
  const cls = statusMap[value] || 'badge-pending';
  const emoji = emojiMap[value];

  return (
    <span className={`badge ${cls}`}>
      {showEmoji && emoji && <span>{emoji}</span>}
      {children || value}
    </span>
  );
};

export default Badge;
