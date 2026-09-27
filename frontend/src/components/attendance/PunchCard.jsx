import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import CameraCapture from '../camera/CameraCapture';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { useGeolocation } from '../../hooks/useGeolocation';
import { usePunchInMutation, usePunchOutMutation } from '../../features/attendance/attendanceApi';
import { formatTime, formatWorkingHours, parseApiError } from '../../utils/formatters';
import '../../styles/components.css';

const API_URL = import.meta.env.VITE_API_URL;
const STANDARD_SHIFT_MINUTES = 480; // 8 hours

/**
 * ShiftProgressBar — shows real-time elapsed shift time for active attendance.
 * Updates every minute via setInterval.
 */
const ShiftProgressBar = ({ punchIn, workingMinutes }) => {
  const [elapsed, setElapsed] = useState(workingMinutes || 0);

  useEffect(() => {
    if (!punchIn) return;
    // Update immediately then every 30 seconds
    const calc = () => {
      const diffMs = new Date() - new Date(punchIn);
      setElapsed(Math.floor(diffMs / 60000));
    };
    calc();
    const timer = setInterval(calc, 30000);
    return () => clearInterval(timer);
  }, [punchIn]);

  const pct = Math.min((elapsed / STANDARD_SHIFT_MINUTES) * 100, 100);
  const isComplete = elapsed >= STANDARD_SHIFT_MINUTES;
  const isOvertime = elapsed > STANDARD_SHIFT_MINUTES;
  const remaining = STANDARD_SHIFT_MINUTES - elapsed;

  return (
    <div style={{ margin: '0 auto 1.25rem', maxWidth: '380px' }}>
      {/* Progress bar */}
      <div
        style={{
          background: 'var(--bg-glass)',
          borderRadius: '999px',
          height: '10px',
          overflow: 'hidden',
          marginBottom: '0.5rem',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: isComplete
              ? 'linear-gradient(90deg, #10b981, #34d399)'
              : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            borderRadius: '999px',
            transition: 'width 0.6s ease',
          }}
        />
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <span>⏱️ {formatWorkingHours(elapsed)}</span>
        <span style={{ color: isComplete ? 'var(--color-success)' : 'var(--text-muted)', fontWeight: isComplete ? 700 : 400 }}>
          {isComplete
            ? isOvertime
              ? `🔥 ${formatWorkingHours(elapsed - STANDARD_SHIFT_MINUTES)} overtime`
              : '✅ Shift complete!'
            : `${formatWorkingHours(remaining)} remaining`}
        </span>
        <span>8h target</span>
      </div>
    </div>
  );
};

/**
 * PunchCard — the main employee punch-in/out widget.
 * Handles the full flow: camera → GPS → selfie upload → punch API.
 * Also manages the 8-hour shift progress bar and OT prompt after punch-out.
 */
const PunchCard = ({ attendance, onRequestOvertime }) => {
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [punchType, setPunchType] = useState(null); // 'in' | 'out'
  const [selfieBlob, setSelfieBlob] = useState(null);
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState(1); // 1=camera, 2=location, 3=confirm
  const [showOtPrompt, setShowOtPrompt] = useState(false);

  const { location, error: geoError, isLoading: geoLoading, getLocation, clearLocation } = useGeolocation();
  const [punchIn, { isLoading: punchingIn }] = usePunchInMutation();
  const [punchOut, { isLoading: punchingOut }] = usePunchOutMutation();

  const isActive = attendance?.attendanceStatus === 'active';
  const isPunchedIn = !!attendance?.punchIn;
  const isPunchedOut = !!attendance?.punchOut;
  const isCompleted = attendance?.attendanceStatus === 'completed';
  const isIncomplete = attendance?.attendanceStatus === 'incomplete';

  // Show OT prompt after punch-out if no OT request yet and worked > 8h
  const workedOvertime = (attendance?.workingMinutes || 0) > STANDARD_SHIFT_MINUTES;
  const hasOtRequest = !!attendance?.overtimeRequest;
  const shouldShowOtPrompt = isPunchedOut && workedOvertime && !hasOtRequest;

  const openPunchModal = (type) => {
    setPunchType(type);
    setSelfieBlob(null);
    setSelfieUrl(null);
    clearLocation();
    setStep(1);
    setShowPunchModal(true);
  };

  const handleCameraCapture = async (blob) => {
    setSelfieBlob(blob);
    setIsUploading(true);
    try {
      const token = localStorage.getItem('ams_token');
      const formData = new FormData();
      formData.append('file', blob, 'selfie.jpg');

      const res = await fetch(`${API_URL}/upload/selfie`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Upload failed');

      setSelfieUrl(data.data.url);
      setStep(2);
      toast.success('Selfie uploaded! Now get your location.');
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGetLocation = () => getLocation();

  const handlePunch = async () => {
    if (!selfieUrl && punchType === 'in') {
      toast.error('Selfie is required for punch-in');
      return;
    }
    if (!location && punchType === 'in') {
      toast.error('Location is required for punch-in');
      return;
    }

    const body = {
      selfieUrl: selfieUrl || undefined,
      location: location || undefined,
    };

    try {
      if (punchType === 'in') {
        await punchIn(body).unwrap();
        toast.success('Punched in successfully! Have a great day 🎉');
      } else {
        const result = await punchOut(body).unwrap();
        const mins = result?.data?.attendance?.workingMinutes || 0;
        if (mins >= STANDARD_SHIFT_MINUTES) {
          toast.success('Great work! 8-hour shift completed ✅');
        } else {
          toast.success('Punched out! Working hours recorded ✅');
        }
      }
      setShowPunchModal(false);
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const canPunch = punchType === 'in'
    ? (!!selfieUrl && !!location)
    : (step >= 2);

  return (
    <>
      {/* Punch Card UI */}
      <div className="punch-card">
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Today's Attendance
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
            <Badge status={attendance?.attendanceStatus || 'no record'} />
            {attendance?.validationStatus && (
              <Badge status={attendance.validationStatus} />
            )}
          </div>
        </div>

        {/* Times */}
        {attendance && (
          <div className="punch-status-row" style={{ maxWidth: '360px', margin: '0 auto 1.25rem' }}>
            <div className="punch-time-block">
              <div className="punch-time-label">🟢 Punch In</div>
              <div className="punch-time-value">
                {attendance.punchIn ? formatTime(attendance.punchIn) : '--:--'}
              </div>
            </div>
            <div className="punch-time-block">
              <div className="punch-time-label">🔴 Punch Out</div>
              <div className="punch-time-value">
                {attendance.punchOut ? formatTime(attendance.punchOut) : '--:--'}
              </div>
            </div>
          </div>
        )}

        {/* ── Shift Progress Bar (only when active / punched-in) ─────────── */}
        {isActive && attendance?.punchIn && (
          <ShiftProgressBar
            punchIn={attendance.punchIn}
            workingMinutes={attendance.workingMinutes || 0}
          />
        )}

        {/* Working Hours (when punched out) */}
        {isPunchedOut && (attendance.workingMinutes || 0) > 0 && (
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <span
              className="working-hours-badge"
              style={{
                fontSize: '0.9rem',
                padding: '0.4rem 0.9rem',
                background: isCompleted
                  ? 'linear-gradient(135deg,#10b981,#059669)'
                  : 'linear-gradient(135deg,#f59e0b,#d97706)',
              }}
            >
              {isCompleted ? '✅' : '⚠️'} {formatWorkingHours(attendance.workingMinutes)}
              {isCompleted ? ' — Shift Complete' : ' — Incomplete Shift'}
            </span>
          </div>
        )}

        {/* Punch Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {!isPunchedIn && (
            <Button
              variant="success"
              size="lg"
              onClick={() => openPunchModal('in')}
              id="btn-punch-in"
            >
              🟢 Punch In
            </Button>
          )}

          {isActive && (
            <Button
              variant="danger"
              size="lg"
              onClick={() => openPunchModal('out')}
              id="btn-punch-out"
            >
              🔴 Punch Out
            </Button>
          )}

          {isPunchedOut && !shouldShowOtPrompt && (
            <div className="alert alert-success" style={{ margin: 0 }}>
              ✅ Attendance complete for today
            </div>
          )}
        </div>

        {/* ── OT Prompt (show if worked > 8h and no OT request yet) ─────── */}
        {shouldShowOtPrompt && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1rem 1.25rem',
              background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.1))',
              border: '1px solid var(--color-warning)',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-warning)', marginBottom: '0.5rem' }}>
              🔥 You worked {formatWorkingHours((attendance?.workingMinutes || 0) - STANDARD_SHIFT_MINUTES)} beyond 8 hours!
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
              Request overtime so your manager can approve the extra hours.
            </p>
            <Button
              variant="warning"
              size="sm"
              onClick={() => onRequestOvertime && onRequestOvertime(attendance)}
              id="btn-request-ot-from-punchcard"
            >
              ⏰ Request Overtime
            </Button>
          </div>
        )}

        {/* Validation Remarks */}
        {attendance?.validationRemarks && (
          <div className="alert alert-info" style={{ marginTop: '1rem', textAlign: 'left' }}>
            <span>💬</span>
            <span style={{ fontSize: '0.85rem' }}>
              <strong>Manager Remark:</strong> {attendance.validationRemarks}
            </span>
          </div>
        )}
      </div>

      {/* Punch Modal */}
      <Modal
        isOpen={showPunchModal}
        onClose={() => setShowPunchModal(false)}
        title={punchType === 'in' ? '🟢 Punch In' : '🔴 Punch Out'}
        maxWidth="500px"
      >
        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? (selfieUrl ? 'done' : 'active') : ''}`}>
            <div className="step-number">{selfieUrl ? '✓' : '1'}</div>
            <span>Selfie</span>
          </div>
          <div className="step-connector" />
          <div className={`step ${step >= 2 ? (location ? 'done' : 'active') : ''}`}>
            <div className="step-number">{location ? '✓' : '2'}</div>
            <span>Location</span>
          </div>
          <div className="step-connector" />
          <div className={`step ${canPunch ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Confirm</span>
          </div>
        </div>

        {/* Step 1: Camera */}
        {step === 1 && (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', textAlign: 'center' }}>
              {punchType === 'in'
                ? 'Take a selfie to verify your identity for punch-in.'
                : 'Selfie is optional for punch-out. Capture or skip to next step.'}
            </p>
            <CameraCapture
              onCapture={handleCameraCapture}
              onReset={() => { setSelfieBlob(null); setSelfieUrl(null); }}
            />
            {isUploading && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                ⬆️ Uploading selfie...
              </p>
            )}
            {punchType === 'out' && !selfieUrl && !isUploading && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Button variant="ghost" onClick={() => setStep(2)} id="btn-skip-selfie-out">
                  Skip selfie →
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Allow location access to record your punch {punchType} coordinates.
            </p>

            {geoError && (
              <div className="alert alert-error">
                <span>📍</span>
                <span>{geoError}</span>
              </div>
            )}

            {location ? (
              <div className="alert alert-success" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                  <span>📍</span>
                  <span>Location Captured</span>
                </div>
                {location.address && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0 }}>
                    <strong>Address:</strong> {location.address}
                  </p>
                )}
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  GPS: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  {location.accuracy && ` (±${Math.round(location.accuracy)}m)`}
                </p>
              </div>
            ) : (
              <Button
                variant="primary"
                onClick={handleGetLocation}
                loading={geoLoading}
                fullWidth
                id="btn-get-location"
              >
                📍 Get My Location & Address
              </Button>
            )}

            {(location || punchType === 'out') && (
              <Button
                variant={location ? 'success' : 'ghost'}
                onClick={() => setStep(3)}
                fullWidth
                id="btn-location-next"
              >
                {location ? '→ Continue to Confirm' : 'Skip location (not recommended)'}
              </Button>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Selfie</span>
                  <span style={{ color: selfieUrl ? 'var(--color-success)' : 'var(--text-muted)' }}>
                    {selfieUrl ? '✅ Captured' : '⏭️ Skipped'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Location</span>
                    <span style={{ color: location ? 'var(--color-success)' : 'var(--text-muted)' }}>
                      {location ? '✅ Captured' : '⏭️ Skipped'}
                    </span>
                  </div>
                  {location?.address && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--bg-glass)', padding: '4px 8px', borderRadius: '4px' }}>
                      📍 {location.address}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Action</span>
                  <span style={{ color: punchType === 'in' ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 700 }}>
                    {punchType === 'in' ? '🟢 PUNCH IN' : '🔴 PUNCH OUT'}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant={punchType === 'in' ? 'success' : 'danger'}
              loading={punchingIn || punchingOut}
              onClick={handlePunch}
              fullWidth
              size="lg"
              id={`btn-confirm-punch-${punchType}`}
            >
              {punchType === 'in' ? '✅ Confirm Punch In' : '✅ Confirm Punch Out'}
            </Button>

            <Button variant="ghost" onClick={() => setStep(2)} id="btn-back-to-location">
              ← Back
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default PunchCard;
