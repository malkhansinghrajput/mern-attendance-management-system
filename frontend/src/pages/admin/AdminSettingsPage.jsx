import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import {
  useGetGeofenceSettingsQuery,
  useUpdateGeofenceSettingsMutation,
} from '../../features/settings/settingsApi';
import { parseApiError } from '../../utils/formatters';

const AdminSettingsPage = () => {
  const { data, isLoading, error, refetch } = useGetGeofenceSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateGeofenceSettingsMutation();

  const [formData, setFormData] = useState({
    officeName: 'Indore Office',
    geofenceEnabled: true,
    latitude: 22.7196,
    longitude: 75.8577,
    radiusMeters: 200,
  });

  const [isGettingCurrentLoc, setIsGettingCurrentLoc] = useState(false);

  useEffect(() => {
    if (data?.data?.settings) {
      const s = data.data.settings;
      setFormData({
        officeName: s.officeName || 'Indore Office',
        geofenceEnabled: s.geofenceEnabled ?? true,
        latitude: s.latitude ?? 22.7196,
        longitude: s.longitude ?? 75.8577,
        radiusMeters: s.radiusMeters ?? 200,
      });
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser does not support Geolocation');
      return;
    }

    setIsGettingCurrentLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        }));
        setIsGettingCurrentLoc(false);
        toast.success('Office coordinates set to your current position!');
      },
      (err) => {
        setIsGettingCurrentLoc(false);
        toast.error(`Failed to fetch location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      officeName: formData.officeName,
      geofenceEnabled: Boolean(formData.geofenceEnabled),
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      radiusMeters: Number(formData.radiusMeters),
    };

    if (isNaN(payload.latitude) || payload.latitude < -90 || payload.latitude > 90) {
      toast.error('Latitude must be a number between -90 and 90');
      return;
    }
    if (isNaN(payload.longitude) || payload.longitude < -180 || payload.longitude > 180) {
      toast.error('Longitude must be a number between -180 and 180');
      return;
    }
    if (isNaN(payload.radiusMeters) || payload.radiusMeters < 10 || payload.radiusMeters > 50000) {
      toast.error('Radius must be between 10m and 50,000m');
      return;
    }

    try {
      await updateSettings(payload).unwrap();
      toast.success('Geofence settings updated successfully! 🎉');
      refetch();
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  return (
    <DashboardLayout title="Geofence Settings">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            ⚙️ Company Geofence Settings
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Configure office coordinates and geofence enforcement rules for employee punch-in & punch-out.
          </p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <span>⚠️</span>
            <span>Failed to load settings: {parseApiError(error)}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Geofencing Enable / Disable Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: 'var(--bg-glass)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      Geofence Enforcement
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      When enabled, employees outside the allowed radius cannot punch in or out.
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="geofenceEnabled"
                      checked={formData.geofenceEnabled}
                      onChange={handleChange}
                      style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
                      id="input-geofence-enabled"
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {formData.geofenceEnabled ? '🟢 ON' : '🔴 OFF'}
                    </span>
                  </label>
                </div>

                {/* Office Name */}
                <div className="form-group">
                  <label className="form-label">Office / Site Name</label>
                  <input
                    type="text"
                    name="officeName"
                    value={formData.officeName}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g. Indore HQ Office"
                    required
                    id="input-office-name"
                  />
                </div>

                {/* Coordinates Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Office Latitude (°)</label>
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      className="input"
                      placeholder="e.g. 22.7196"
                      required
                      id="input-latitude"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Office Longitude (°)</label>
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      className="input"
                      placeholder="e.g. 75.8577"
                      required
                      id="input-longitude"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleUseCurrentLocation}
                    loading={isGettingCurrentLoc}
                    id="btn-use-current-location"
                  >
                    📍 Use My Current Location
                  </Button>
                </div>

                {/* Allowed Radius */}
                <div className="form-group">
                  <label className="form-label">Allowed Geofence Radius (Meters)</label>
                  <input
                    type="number"
                    name="radiusMeters"
                    value={formData.radiusMeters}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g. 200"
                    min="10"
                    max="50000"
                    required
                    id="input-radius"
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Recommended radius: 50m – 500m depending on office building size.
                  </span>
                </div>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))', border: '1px solid rgba(99,102,241,0.3)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                📍 Configuration Preview
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                {formData.geofenceEnabled ? (
                  <>
                    Employees must be within <strong>{formData.radiusMeters} meters</strong> of{' '}
                    <strong>{formData.officeName || 'the office'}</strong> ({formData.latitude}, {formData.longitude}) to punch in/out.
                  </>
                ) : (
                  <>
                    Geofence enforcement is currently <strong>OFF</strong>. Employees can punch in/out from any location.
                  </>
                )}
              </p>
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" size="lg" loading={isUpdating} id="btn-save-geofence">
                💾 Save Geofence Configuration
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminSettingsPage;
