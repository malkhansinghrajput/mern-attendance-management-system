import '../../styles/components.css';

const EmptyState = ({ icon = '📭', title = 'No data found', description = '', action }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div style={{ marginTop: '1.25rem' }}>{action}</div>}
    </div>
  );
};

export default EmptyState;
