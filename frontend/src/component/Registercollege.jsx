import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { Building2, CheckCircle2 } from 'lucide-react';

// Swap for your real axios wrapper if the path differs.
import axiosClient from '../utils/axiosClient';

const emptyForm = {
  Collage_name: '',
  collegeCode: '',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  adminPassword: '',
};

function RegisterCollege() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // POST /collage (admin-only, does not touch your session cookies) -
      // NOT /collage/register, which is the public self-signup path that
      // logs the caller in as the new college's admin.
      const res = await axiosClient.post('/collage', form);
      setSuccess(res.data.college);
      setForm(emptyForm);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to register college');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rc-root">
      <style>{styles}</style>

      <div className="rc-topbar">
        <div className="rc-logo-icon">⌨</div>
        <span className="rc-logo-text"><NavLink to="/">CodeMaster</NavLink></span>
        <div className="rc-topbar-sep" />
        <span className="rc-topbar-crumb"><NavLink to="/admin/colleges">Colleges /</NavLink> <span>Register</span></span>
      </div>

      <div className="rc-main">
        <div className="rc-header">
          <span className="rc-tag">Platform Admin</span>
          <h1 className="rc-h1">Register a College</h1>
          <p className="rc-sub">Creates the college and its first College Admin account in one step. You stay logged in as yourself.</p>
        </div>

        {error && <div className="rc-error">{error}</div>}

        {success && (
          <div className="rc-success">
            <CheckCircle2 size={16} />
            <div>
              <strong>{success.Collage_name}</strong> ({success.collegeCode}) registered successfully.{' '}
              <button className="rc-link" onClick={() => navigate('/admin/colleges')}>View all colleges →</button>
            </div>
          </div>
        )}

        <form className="rc-form" onSubmit={handleSubmit}>
          <div className="rc-section-label">
            <Building2 size={13} /> College Details
          </div>
          <div className="rc-grid">
            <Field label="College Name" name="Collage_name" value={form.Collage_name} onChange={handleChange} placeholder="Indian Institute of Technology" required />
            <Field label="College Code" name="collegeCode" value={form.collegeCode} onChange={handleChange} placeholder="IIT01" required />
          </div>

          <div className="rc-section-label" style={{ marginTop: 24 }}>
            <Building2 size={13} /> First College Admin
          </div>
          <div className="rc-grid">
            <Field label="First Name" name="adminFirstName" value={form.adminFirstName} onChange={handleChange} placeholder="Priya" required />
            <Field label="Last Name" name="adminLastName" value={form.adminLastName} onChange={handleChange} placeholder="Sharma" />
            <Field label="Admin Email" name="adminEmail" type="email" value={form.adminEmail} onChange={handleChange} placeholder="admin@iit.edu" required />
            <Field label="Admin Password" name="adminPassword" type="password" value={form.adminPassword} onChange={handleChange} placeholder="At least 6 characters" required />
          </div>

          <button className="rc-submit" type="submit" disabled={submitting}>
            {submitting ? 'Registering...' : 'Register College'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, type = 'text', required }) {
  return (
    <label className="rc-field">
      <span>{label}{required && <span className="rc-req"> *</span>}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={type === 'password' ? 6 : undefined}
      />
    </label>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .rc-root { min-height: 100vh; background: #0d1117; color: #e6edf3; font-family: 'Segoe UI', -apple-system, sans-serif; }
  .rc-topbar { background: #161b22; border-bottom: 1px solid #21262d; height: 48px; display: flex; align-items: center; padding: 0 16px; gap: 8px; position: sticky; top: 0; z-index: 10; }
  .rc-logo-icon { width: 28px; height: 28px; background: linear-gradient(135deg, #ffa116, #ff6b00); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: #0d1117; flex-shrink: 0; }
  .rc-logo-text { font-weight: 700; font-size: 15px; color: #e6edf3; }
  .rc-logo-text a { color: inherit; text-decoration: none; }
  .rc-topbar-sep { width: 1px; height: 20px; background: #21262d; margin: 0 8px; }
  .rc-topbar-crumb { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8b949e; }
  .rc-topbar-crumb a { color: inherit; text-decoration: none; }
  .rc-topbar-crumb span { color: #4493f8; }

  .rc-main { max-width: 640px; margin: 0 auto; padding: 40px 24px 80px; }
  .rc-tag { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #4493f8; background: #0d1a2e; border: 1px solid #1c2a3a; border-radius: 4px; padding: 2px 8px; }
  .rc-h1 { font-size: 24px; font-weight: 700; margin-top: 10px; letter-spacing: -0.5px; }
  .rc-sub { font-size: 13px; color: #8b949e; margin-top: 6px; line-height: 1.6; }
  .rc-error { background: #2a0f0f; border: 1px solid #3a1a1a; color: #ff8080; font-size: 12px; padding: 10px 14px; border-radius: 6px; margin-top: 20px; }
  .rc-success { display: flex; align-items: flex-start; gap: 10px; background: #0f2a1a; border: 1px solid #1a3a2a; color: #6fe0a3; font-size: 12.5px; padding: 12px 14px; border-radius: 8px; margin-top: 20px; line-height: 1.6; }
  .rc-link { background: none; border: none; color: #4493f8; cursor: pointer; font-size: 12.5px; text-decoration: underline; padding: 0; }

  .rc-form { margin-top: 28px; background: #161b22; border: 1px solid #21262d; border-radius: 10px; padding: 24px; }
  .rc-section-label { display: flex; align-items: center; gap: 6px; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: #495366; margin-bottom: 14px; }
  .rc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .rc-field { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #8b949e; }
  .rc-req { color: #ff4444; }
  .rc-field input { background: #0d1117; border: 1px solid #21262d; border-radius: 6px; padding: 9px 12px; color: #e6edf3; font-size: 13px; outline: none; }
  .rc-field input:focus { border-color: #4493f8; }
  .rc-submit { margin-top: 24px; width: 100%; background: #4493f8; border: none; color: #0d1117; font-weight: 700; font-size: 13px; border-radius: 8px; padding: 11px; cursor: pointer; }
  .rc-submit:disabled { opacity: 0.6; cursor: not-allowed; }

  @media (max-width: 520px) { .rc-grid { grid-template-columns: 1fr; } }
`;

export default RegisterCollege;