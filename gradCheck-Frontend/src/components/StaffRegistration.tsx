import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { staffService } from "../services/StaffRegistrationService";
import { httpClient } from "../services/HttpClient";

interface StaffMember {
  id: number;
  staff_id: string;
  full_name: string;
  email: string;
  active: boolean | number;
}

async function getAllStaff(signal?: AbortSignal): Promise<StaffMember[]> {
  // Was a plain fetch with no Authorization header — /staff requires an
  // admin/staff token, so this always 401'd. httpClient attaches the
  // logged-in user's token automatically.
  const data = await httpClient.request<unknown>("/staff", { signal });
  if (!Array.isArray(data)) throw new Error("Invalid staff list response.");
  return data as StaffMember[];
}

function StaffRegistration() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshStaff = useCallback(() => setRefreshKey((key) => key + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setStaff([]);
    setStaffLoading(true);
    setStaffError("");
    getAllStaff(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setStaff(data); })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setStaffError(err instanceof Error ? err.message : "Unable to load staff.");
      })
      .finally(() => { if (!controller.signal.aborted) setStaffLoading(false); });
    return () => controller.abort();
  }, [refreshKey]);
  const [staffId, setStaffId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    event: React.SubmitEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response =
        await staffService.registerStaff({
          staffId,
          fullName,
          email,
          password,
          confirmPassword,
        });

      setMessage(
        response.message ||
          "Staff account created successfully."
      );

      refreshStaff();
      setStaffId("");
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-page staff-registration-page">
      <div className="staff-card">
          <Link to="/staff/home" className="back-button">
            ← Back
          </Link>
          <br />

        <h1>Staff Registration</h1>
        <p className="subtitle">
          Create an authorised GradCheck staff account.
        </p>

        <form className="staff-form staff-registration-form" onSubmit={handleSubmit}>
          <div className="staff-registration-field">
            <label htmlFor="staff-staff-id">Staff ID</label>
            <input
              id="staff-staff-id"
            type="text"
            value={staffId}
            onChange={(e) =>
              setStaffId(e.target.value)
            }
            placeholder="Enter staff ID"
            required
            />
          </div>

          <div className="staff-registration-field">
            <label htmlFor="staff-full-name">Full Name</label>
            <input
              id="staff-full-name"
            type="text"
            value={fullName}
            onChange={(e) =>
              setFullName(e.target.value)
            }
            placeholder="Enter full name"
            required
            />
          </div>

          <div className="staff-registration-field staff-registration-full">
            <label htmlFor="staff-email-address">Email Address</label>
            <input
              id="staff-email-address"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="staff@university.ac.nz"
            required
            />
          </div>

          <div className="staff-registration-field">
            <label htmlFor="staff-password">Password</label>
            <input
              id="staff-password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Enter password"
            required
            />
          </div>

          <div className="staff-registration-field">
            <label htmlFor="staff-confirm-password">Confirm Password</label>
            <input
              id="staff-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            placeholder="Confirm password"
            required
            />
          </div>

          {error && (
            <div className="error-message staff-registration-full">
              {error}
            </div>
          )}

          {message && (
            <div className="success-message staff-registration-full">
              {message}
            </div>
          )}

          <button
            className="gradcheck-primary-button staff-registration-full staff-register-button"
            disabled={loading}
          >
            {loading
              ? "Registering..."
              : "Register Staff"}
          </button>
        </form>

      </div>
      <div className="staff-card" aria-labelledby="all-staff-heading">
        <section>
          <div className="gradcheck-page-header">
            <h2 id="all-staff-heading">All Staff</h2>
            <button type="button" className="gradcheck-secondary-button" onClick={refreshStaff} disabled={staffLoading}>
              {staffLoading ? "Loading…" : "Refresh"}
            </button>
          </div>
          {staffError && <p className="gradcheck-error-message" role="alert">{staffError}</p>}
          <div className="gradcheck-table-container" aria-busy={staffLoading}>
            <table className="gradcheck-table staff-directory-table" aria-label="All staff" style={{ minWidth: 600 }}>
              <thead><tr>
                <th scope="col">Staff ID</th>
                <th scope="col">Full Name</th>
                <th scope="col">Email Address</th>
                <th scope="col">Status</th>
              </tr></thead>
              <tbody>
                {staffLoading ? <tr><td colSpan={4}>Loading staff…</td></tr>
                  : staffError ? <tr><td colSpan={4}>Staff list is unavailable.</td></tr>
                  : staff.length === 0 ? <tr><td colSpan={4}>No staff registered yet.</td></tr>
                  : staff.map((member) => (
                    <tr key={member.id}>
                      <td>{member.staff_id}</td>
                      <td>{member.full_name}</td>
                      <td>{member.email}</td>
                      <td>{member.active ? "Active" : "Inactive"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default StaffRegistration;