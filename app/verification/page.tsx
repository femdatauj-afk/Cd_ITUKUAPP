"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "../components/app-shell";

type VerificationStep = "type" | "email" | "phone" | "identity" | "review" | "complete";

export default function VerificationPage() {
  const [currentStep, setCurrentStep] = useState<VerificationStep>("type");
  const [formData, setFormData] = useState({
    verificationType: "individual",
    email: "",
    emailCode: "",
    phone: "",
    phoneCode: "",
    fullName: "",
    dateOfBirth: "",
    governmentId: "",
    idType: "passport",
    idFile: null as File | null,
    reasonForVerification: "",
  });
  const [emailSent, setEmailSent] = useState(false);
  const [phoneSent, setPhoneSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData((prev) => ({ ...prev, idFile: e.target.files![0] }));
    }
  };

  const validateEmail = () => {
    if (!formData.email) {
      setErrors({ email: "Email is required" });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors({ email: "Invalid email format" });
      return false;
    }
    return true;
  };

  const validatePhone = () => {
    if (!formData.phone) {
      setErrors({ phone: "Phone number is required" });
      return false;
    }
    if (!/^[\d\s\-\+\(\)]{10,}$/.test(formData.phone)) {
      setErrors({ phone: "Invalid phone number" });
      return false;
    }
    return true;
  };

  const validateIdentity = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = "Full name is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.governmentId) newErrors.governmentId = "Government ID is required";
    if (!formData.idFile) newErrors.idFile = "ID document is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleSendEmailCode = () => {
    if (validateEmail()) {
      setEmailSent(true);
    }
  };

  const handleSendPhoneCode = () => {
    if (validatePhone()) {
      setPhoneSent(true);
    }
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case "type":
        setCurrentStep("email");
        break;
      case "email":
        if (formData.emailCode) {
          setCurrentStep("phone");
        } else {
          setErrors({ emailCode: "Please enter the verification code" });
        }
        break;
      case "phone":
        if (formData.phoneCode) {
          setCurrentStep("identity");
        } else {
          setErrors({ phoneCode: "Please enter the verification code" });
        }
        break;
      case "identity":
        if (validateIdentity()) {
          setCurrentStep("review");
        }
        break;
      case "review":
        setCurrentStep("complete");
        break;
    }
  };

  const handleBackStep = () => {
    const steps: VerificationStep[] = ["type", "email", "phone", "identity", "review", "complete"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const progressSteps = [
    { key: "type", label: "Verification Type", completed: currentStep !== "type" },
    { key: "email", label: "Email", completed: ["phone", "identity", "review", "complete"].includes(currentStep) },
    { key: "phone", label: "Phone", completed: ["identity", "review", "complete"].includes(currentStep) },
    { key: "identity", label: "Identity", completed: ["review", "complete"].includes(currentStep) },
    { key: "review", label: "Review", completed: currentStep === "complete" },
  ];

  return (
    <AppShell title="Verification" subtitle="Verify your account and increase trust">
      <div className="verification-container">
        {/* Progress Bar */}
        <div className="verification-progress">
          {progressSteps.map((step, index) => (
            <div key={step.key}>
              <div
                className={`progress-step ${step.completed ? "completed" : ""} ${currentStep === step.key ? "active" : ""}`}
              >
                {step.completed ? "✓" : index + 1}
              </div>
              <div className="progress-label">{step.label}</div>
              {index < progressSteps.length - 1 && (
                <div className={`progress-line ${step.completed ? "completed" : ""}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="verification-content">
          {currentStep === "type" && (
            <div className="verification-step">
              <h2>What type of account are you verifying?</h2>
              <p className="step-description">Choose the verification type that applies to you.</p>

              <div className="verification-options">
                <label className={`option-card ${formData.verificationType === "individual" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="verificationType"
                    value="individual"
                    checked={formData.verificationType === "individual"}
                    onChange={handleInputChange}
                  />
                  <div className="option-content">
                    <h3>Individual</h3>
                    <p>Verify as a person for community participation</p>
                  </div>
                </label>

                <label className={`option-card ${formData.verificationType === "organization" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="verificationType"
                    value="organization"
                    checked={formData.verificationType === "organization"}
                    onChange={handleInputChange}
                  />
                  <div className="option-content">
                    <h3>Organization</h3>
                    <p>Verify as a group or business entity</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {currentStep === "email" && (
            <div className="verification-step">
              <h2>Verify your email address</h2>
              <p className="step-description">We'll send a verification code to your email.</p>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="email-input-group">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    disabled={emailSent}
                    className={errors.email ? "error" : ""}
                  />
                  {!emailSent && (
                    <button type="button" className="send-button" onClick={handleSendEmailCode}>
                      Send Code
                    </button>
                  )}
                </div>
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              {emailSent && (
                <div className="form-group">
                  <label htmlFor="emailCode">Verification Code</label>
                  <input
                    type="text"
                    id="emailCode"
                    name="emailCode"
                    value={formData.emailCode}
                    onChange={handleInputChange}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className={errors.emailCode ? "error" : ""}
                  />
                  {errors.emailCode && <span className="error-message">{errors.emailCode}</span>}
                  <p className="helper-text">Didn't receive a code? <button type="button" className="resend-link">Resend</button></p>
                </div>
              )}
            </div>
          )}

          {currentStep === "phone" && (
            <div className="verification-step">
              <h2>Verify your phone number</h2>
              <p className="step-description">We'll send a verification code via SMS.</p>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <div className="phone-input-group">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                    disabled={phoneSent}
                    className={errors.phone ? "error" : ""}
                  />
                  {!phoneSent && (
                    <button type="button" className="send-button" onClick={handleSendPhoneCode}>
                      Send Code
                    </button>
                  )}
                </div>
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>

              {phoneSent && (
                <div className="form-group">
                  <label htmlFor="phoneCode">Verification Code</label>
                  <input
                    type="text"
                    id="phoneCode"
                    name="phoneCode"
                    value={formData.phoneCode}
                    onChange={handleInputChange}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className={errors.phoneCode ? "error" : ""}
                  />
                  {errors.phoneCode && <span className="error-message">{errors.phoneCode}</span>}
                  <p className="helper-text">Didn't receive a code? <button type="button" className="resend-link">Resend</button></p>
                </div>
              )}
            </div>
          )}

          {currentStep === "identity" && (
            <div className="verification-step">
              <h2>Verify your identity</h2>
              <p className="step-description">Provide government-issued ID to complete verification.</p>

              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Your full legal name"
                  className={errors.fullName ? "error" : ""}
                />
                {errors.fullName && <span className="error-message">{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className={errors.dateOfBirth ? "error" : ""}
                />
                {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="idType">ID Type</label>
                <select
                  id="idType"
                  name="idType"
                  value={formData.idType}
                  onChange={handleInputChange}
                >
                  <option value="passport">Passport</option>
                  <option value="nationalId">National ID</option>
                  <option value="driverLicense">Driver's License</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="governmentId">Government ID Number</label>
                <input
                  type="text"
                  id="governmentId"
                  name="governmentId"
                  value={formData.governmentId}
                  onChange={handleInputChange}
                  placeholder="Your ID number"
                  className={errors.governmentId ? "error" : ""}
                />
                {errors.governmentId && <span className="error-message">{errors.governmentId}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="idFile">Upload ID Document</label>
                <div className="file-upload">
                  <input
                    type="file"
                    id="idFile"
                    name="idFile"
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                    className={errors.idFile ? "error" : ""}
                  />
                  <div className="file-upload-hint">
                    {formData.idFile ? (
                      <p>✓ {formData.idFile.name}</p>
                    ) : (
                      <>
                        <p>Drag and drop or click to upload</p>
                        <small>Supported: JPG, PNG, PDF (Max 10MB)</small>
                      </>
                    )}
                  </div>
                </div>
                {errors.idFile && <span className="error-message">{errors.idFile}</span>}
              </div>
            </div>
          )}

          {currentStep === "review" && (
            <div className="verification-step">
              <h2>Review your information</h2>
              <p className="step-description">Please review before submitting for verification.</p>

              <div className="review-section">
                <h3>Account Type</h3>
                <p>{formData.verificationType === "individual" ? "Individual Account" : "Organization Account"}</p>

                <h3>Contact Information</h3>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Phone:</strong> {formData.phone}</p>

                <h3>Identity Information</h3>
                <p><strong>Name:</strong> {formData.fullName}</p>
                <p><strong>Date of Birth:</strong> {formData.dateOfBirth}</p>
                <p><strong>ID Type:</strong> {formData.idType}</p>

                <h3>Document</h3>
                {formData.idFile && <p>✓ {formData.idFile.name} ({(formData.idFile.size / 1024).toFixed(2)} KB)</p>}

                <div className="review-notice">
                  <p>By submitting, you confirm that all information is accurate and you authorize ItukuApp to verify your identity.</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === "complete" && (
            <div className="verification-step complete">
              <div className="success-icon">✓</div>
              <h2>Verification Submitted</h2>
              <p className="step-description">
                Your verification request has been submitted successfully. Our team will review your information within 24-48 hours.
              </p>

              <div className="status-info">
                <p><strong>Status:</strong> <span className="badge pending">Pending Review</span></p>
                <p>You'll receive an email notification once verification is complete.</p>
              </div>

              <div className="action-buttons">
                <Link href="/profile" className="button primary">
                  Back to Profile
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="verification-actions">
          {currentStep !== "type" && currentStep !== "complete" && (
            <button type="button" className="button secondary" onClick={handleBackStep}>
              Back
            </button>
          )}
          {currentStep !== "complete" && (
            <button type="button" className="button primary" onClick={handleNextStep}>
              {currentStep === "review" ? "Submit" : "Next"}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .verification-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .verification-progress {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          position: relative;
        }

        .verification-progress > div {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          position: relative;
        }

        .progress-step {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e0e0e0;
          color: #666;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-bottom: 8px;
          transition: all 0.3s;
        }

        .progress-step.active {
          background: var(--facebook);
          color: white;
          transform: scale(1.1);
        }

        .progress-step.completed {
          background: #4caf50;
          color: white;
        }

        .progress-label {
          font-size: 12px;
          text-align: center;
          color: #666;
          font-weight: 500;
        }

        .progress-line {
          position: absolute;
          top: 20px;
          left: 50%;
          width: 100%;
          height: 2px;
          background: #e0e0e0;
          z-index: -1;
        }

        .progress-line.completed {
          background: #4caf50;
        }

        .verification-content {
          background: white;
          border-radius: 12px;
          padding: 30px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .verification-step h2 {
          font-size: 24px;
          margin: 0 0 8px 0;
          color: #000;
        }

        .step-description {
          color: #666;
          margin-bottom: 24px;
          font-size: 14px;
        }

        .verification-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .option-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .option-card:hover {
          border-color: var(--facebook);
          background: #f5f5f5;
        }

        .option-card.selected {
          border-color: var(--facebook);
          background: #f0f7ff;
        }

        .option-card input[type="radio"] {
          margin-top: 2px;
          cursor: pointer;
        }

        .option-content h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
        }

        .option-content p {
          margin: 0;
          font-size: 13px;
          color: #666;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--facebook);
          box-shadow: 0 0 0 3px rgba(24, 119, 242, 0.1);
        }

        .form-group input.error,
        .form-group select.error {
          border-color: #e74c3c;
        }

        .error-message {
          display: block;
          color: #e74c3c;
          font-size: 12px;
          margin-top: 6px;
        }

        .email-input-group,
        .phone-input-group {
          display: flex;
          gap: 8px;
        }

        .email-input-group input,
        .phone-input-group input {
          flex: 1;
        }

        .send-button {
          padding: 10px 16px;
          background: var(--facebook);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }

        .send-button:hover {
          background: #1565c0;
        }

        .helper-text {
          font-size: 12px;
          color: #666;
          margin-top: 8px;
        }

        .resend-link {
          background: none;
          border: none;
          color: var(--facebook);
          cursor: pointer;
          text-decoration: underline;
          font-size: 12px;
          padding: 0;
        }

        .resend-link:hover {
          color: #1565c0;
        }

        .file-upload {
          border: 2px dashed #ddd;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .file-upload:hover {
          border-color: var(--facebook);
          background: #f5f5f5;
        }

        .file-upload input[type="file"] {
          display: none;
        }

        .file-upload-hint p {
          margin: 0;
          font-size: 14px;
          color: #333;
        }

        .file-upload-hint small {
          display: block;
          color: #999;
          margin-top: 4px;
        }

        .review-section {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
        }

        .review-section h3 {
          font-size: 14px;
          font-weight: 600;
          margin: 16px 0 8px 0;
          color: #666;
        }

        .review-section p {
          margin: 8px 0;
          font-size: 14px;
          color: #333;
        }

        .review-notice {
          background: #e8f5e9;
          border-left: 4px solid #4caf50;
          padding: 12px;
          margin-top: 16px;
          border-radius: 4px;
          font-size: 13px;
          color: #1b5e20;
        }

        .verification-step.complete {
          text-align: center;
        }

        .success-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #4caf50;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          margin: 0 auto 16px;
        }

        .status-info {
          background: #f5f5f5;
          padding: 16px;
          border-radius: 8px;
          margin: 20px 0;
          font-size: 14px;
        }

        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge.pending {
          background: #fff3cd;
          color: #856404;
        }

        .verification-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .button {
          padding: 10px 24px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          text-decoration: none;
          display: inline-block;
        }

        .button.primary {
          background: var(--facebook);
          color: white;
        }

        .button.primary:hover {
          background: #1565c0;
        }

        .button.secondary {
          background: #e0e0e0;
          color: #333;
        }

        .button.secondary:hover {
          background: #d0d0d0;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 24px;
        }

        @media (max-width: 600px) {
          .verification-container {
            padding: 12px;
          }

          .verification-content {
            padding: 20px;
          }

          .verification-progress {
            margin-bottom: 24px;
          }

          .progress-label {
            font-size: 10px;
          }

          .verification-actions {
            flex-direction: column;
          }

          .button {
            width: 100%;
          }
        }
      `}</style>
    </AppShell>
  );
}
