import '../../styles/components.css';

/**
 * Button — variants: primary | success | danger | warning | ghost
 * sizes: sm | md (default) | lg
 */
const Button = ({
  children,
  variant = 'primary',
  size = '',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const classes = [
    'btn',
    `btn-${variant}`,
    sizeClass,
    fullWidth ? 'btn-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="btn-spinner" />}
      {children}
    </button>
  );
};

export default Button;
