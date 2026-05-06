"use client";
import "./inquiry.css";
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function InquiryForm() {
  const searchParams = useSearchParams();
  const source = searchParams.get('source') || 'Direct Link';
  return (
    <div className="inquiry-page">
      <div className="inquiry-overlay"></div>
      <div className="inquiry-container">
        <div className="inquiry-content">
          <div className="inquiry-text animate-fade-in">
            <h1 className="inquiry-title">Step into a<br />legacy of<br />craftsmanship.</h1>
            <p className="inquiry-desc">
              Register your interest to receive our private collection brochure and an exclusive invitation for a property tour.
            </p>
            <div className="inquiry-meta">
              <div className="meta-item">
                <span className="meta-icon">🏢</span>
                <span>VANYA HERITAGE COLLECTION</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">📍</span>
                <span>PRISTINE RESERVE, GOA</span>
              </div>
            </div>
          </div>
          
          <div className="inquiry-form-container animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <form className="inquiry-form" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData);
              data.source = `Inquiry Page (${source})`; // Track QR codes
              const originalMessage = data.message || '';
              data.message = `[Pincode: ${data.pincode}] ${originalMessage}`;
              await fetch('/api/inquiries', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
              });
              alert('Registration Submitted successfully!');
              e.target.reset();
            }}>
              <input type="text" name="name" placeholder="Full Name" required pattern="[A-Za-z\s]+" title="Please enter letters only" className="inquiry-input" />
              <input type="email" name="email" placeholder="Email Address" required pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$" title="Please enter a valid email address" className="inquiry-input" />
              <input type="tel" name="phone" placeholder="Phone Number (10 Digits)" required minLength="10" maxLength="10" pattern="[0-9]{10}" onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} title="Please enter a valid 10-digit phone number" className="inquiry-input" />
              <input type="text" name="pincode" placeholder="Pincode (6 Digits)" required minLength="6" maxLength="6" pattern="[0-9]{6}" onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} title="Please enter a valid 6-digit pincode" className="inquiry-input" />
              <div className="interest-level">
                <p className="field-label">INTEREST LEVEL</p>
                <div className="interest-options">
                  <label className="interest-option active">
                    <input type="radio" name="source" value="GENERAL INQUIRY" defaultChecked /> GENERAL INQUIRY
                  </label>
                  <label className="interest-option">
                    <input type="radio" name="source" value="SERIOUS BUYER" /> SERIOUS BUYER
                  </label>
                  <label className="interest-option">
                    <input type="radio" name="source" value="INVESTMENT GRADE" /> INVESTMENT GRADE
                  </label>
                </div>
              </div>
              
              <textarea name="message" placeholder="Preferred specifications or questions" className="inquiry-input inquiry-textarea"></textarea>
              
              <button type="submit" className="btn btn-primary submit-btn">SUBMIT REGISTRATION →</button>
              
              <p className="form-disclaimer">
                By submitting this form, you agree to our privacy policy and consent to receiving communication regarding Vanya Residences properties.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InquiryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InquiryForm />
    </Suspense>
  );
}
