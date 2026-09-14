import { useState } from "react";
import { staffService } from "../services/StaffRegistrationService";

function StaffRegistration() {
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
    <div className="staff-page">
      <div className="staff-card">
        <h1>Staff Registration</h1>

        <p className="subtitle">
          Create an authorised GradCheck staff account.
        </p>

        <form className="staff-form" onSubmit={handleSubmit}>
          <label>Staff ID</label>
          <input
            type="text"
            value={staffId}
            onChange={(e) =>
              setStaffId(e.target.value)
            }
            placeholder="Enter staff ID"
            required
          />

          <label>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) =>
              setFullName(e.target.value)
            }
            placeholder="Enter full name"
            required
          />

          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="staff@university.ac.nz"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Enter password"
            required
          />

          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            placeholder="Confirm password"
            required
          />

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          <button
            className="gradcheck-primary-button"
            disabled={loading}
          >
            {loading
              ? "Registering..."
              : "Register Staff"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StaffRegistration;