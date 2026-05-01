import "./inquiry.css";

export default function InquiryPage() {
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
            <form className="inquiry-form">
              <input type="text" placeholder="Full Name" className="inquiry-input" />
              <input type="email" placeholder="Email Address" className="inquiry-input" />
              <input type="tel" placeholder="Phone Number" className="inquiry-input" />
              
              <div className="interest-level">
                <p className="field-label">INTEREST LEVEL</p>
                <div className="interest-options">
                  <label className="interest-option active">
                    <input type="radio" name="interest" defaultChecked /> GENERAL INQUIRY
                  </label>
                  <label className="interest-option">
                    <input type="radio" name="interest" /> SERIOUS BUYER
                  </label>
                  <label className="interest-option">
                    <input type="radio" name="interest" /> INVESTMENT GRADE
                  </label>
                </div>
              </div>
              
              <textarea placeholder="Preferred specifications or questions" className="inquiry-input inquiry-textarea"></textarea>
              
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
