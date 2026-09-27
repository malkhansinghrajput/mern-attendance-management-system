import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { useGetMyProfileQuery, useUpdateMyProfileMutation } from '../../features/users/usersApi';
import { updateUser } from '../../features/auth/authSlice';
import { parseApiError } from '../../utils/formatters';

const API_URL = import.meta.env.VITE_API_URL;

const EditProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const { data, isLoading: isFetchingProfile } = useGetMyProfileQuery();
  const [updateMyProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatarUrl: '',
  });

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (data?.data?.user) {
      const u = data.data.user;
      setFormData({
        name: u.name || '',
        phone: u.phone || '',
        avatarUrl: u.avatarUrl || '',
      });
    }
  }, [data]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size cannot exceed 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const token = localStorage.getItem('ams_token');
      const bodyData = new FormData();
      bodyData.append('file', file);

      const res = await fetch(`${API_URL}/upload/selfie`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: bodyData,
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error?.message || 'Upload failed');

      const uploadedUrl = resData.data?.url;
      setFormData((prev) => ({ ...prev, avatarUrl: uploadedUrl }));
      toast.success('Photo uploaded! Click Save to confirm profile changes.');
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Full name is required');
      return;
    }

    try {
      const res = await updateMyProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        avatarUrl: formData.avatarUrl,
      }).unwrap();

      const updatedUser = res?.data?.user;
      if (updatedUser) {
        dispatch(updateUser(updatedUser));
      }

      toast.success('Profile updated successfully! 🎉');
      navigate('/profile');
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const user = data?.data?.user;
  const initials = formData.name
    ? formData.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            ✏️ Edit Profile
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Update your profile name, phone number, and photo
          </p>
        </div>

        {isFetchingProfile ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Spinner size="lg" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Avatar Upload Card */}
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ marginBottom: '1rem', position: 'relative', display: 'inline-block' }}>
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt="Profile Avatar"
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--color-primary)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: 'var(--gradient-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '2.2rem',
                      color: '#fff',
                      margin: '0 auto',
                    }}
                  >
                    {initials}
                  </div>
                )}
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  loading={isUploading}
                  id="btn-upload-avatar"
                >
                  📷 Change Profile Photo
                </Button>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Supported formats: JPG, PNG, WebP (Max 5MB)
                </p>
              </div>
            </div>

            {/* Editable Fields Card */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                Personal Information
              </h3>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input"
                  placeholder="Your Full Name"
                  required
                  id="input-edit-name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g. +91 98765 43210"
                  id="input-edit-phone"
                />
              </div>
            </div>

            {/* Read-Only System Security Information */}
            <div className="card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                🔒 System Account Fields (Read-Only)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Role, Manager, and Email are managed by backend administration. Contact your HR/Admin to request role or manager changes.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Email</span>
                  <strong style={{ color: 'var(--text-secondary)' }}>{user?.email || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Role</span>
                  <strong style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user?.role || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Account Status</span>
                  <strong style={{ color: 'var(--color-success)' }}>{user?.isActive ? 'Active' : 'Inactive'}</strong>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/profile')}
                id="btn-cancel-edit-profile"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isSaving}
                id="btn-save-profile"
              >
                💾 Save Profile Changes
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EditProfilePage;
