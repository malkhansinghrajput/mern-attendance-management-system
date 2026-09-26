import '../../styles/components.css';

const Spinner = ({ size = 'md', color = 'primary', label = 'Loading...' }) => {
  return (
    <div className="spinner-page">
      <div className={`spinner spinner-${size} spinner-${color}`} role="status" aria-label={label} />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</span>
    </div>
  );
};

export default Spinner;
