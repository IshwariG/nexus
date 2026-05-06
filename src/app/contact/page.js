import "./contact.css";

export default function Contact() {
  return (
    <div className="contact-main">
      <div className="contact-hero" style={{backgroundImage: "url('/images/c1.png')"}}>
        <div className="contact-hero-content">
          <h1 className="serif">Connect with Excellence</h1>
          <p>Experience the pinnacle of Rajasthan's heritage refined for contemporary luxury living.</p>
        </div>
      </div>

      <section className="contact-section">
        <div className="contact-left">
          <span>REGISTRATION OF INTEREST</span>
          <h2 className="serif">Begin Your Legacy at Vanya</h2>
          <p>Our residential advisors are available for personalized consultations. Please share your preferences, and we will curate an exclusive portfolio for your consideration.</p>
          
          <div className="contact-info-item">
            <div className="icon">📞</div>
            <span>+91 (141) 4560 7890</span>
          </div>
          <div className="contact-info-item">
            <div className="icon">✉️</div>
            <span>concierge@vanyaresidences.in</span>
          </div>

          <div className="contact-info-block mt-3" style={{marginTop: '3rem'}}>
            <h3 className="serif">Corporate Office</h3>
            <p>The Heritage Corridor, Suite 402</p>
            <p>Civil Lines, pune</p>
            <p>Maharastra, 411057, India</p>
          </div>

          <div className="contact-info-block" style={{marginTop: '3rem'}}>
            <h3 className="serif">Operating Hours</h3>
            <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', paddingBottom:'0.5rem', marginBottom:'0.5rem'}}>
              <span>Monday — Friday</span>
              <strong>09:00 AM — 07:00 PM</strong>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', paddingBottom:'0.5rem', marginBottom:'0.5rem'}}>
              <span>Saturday</span>
              <strong>10:00 AM — 04:00 PM</strong>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', paddingBottom:'0.5rem'}}>
              <span>Sunday</span>
              <strong>By Appointment Only</strong>
            </div>
          </div>
        </div>

        <div className="contact-right">
          <form className="contact-form">
            <div className="form-row">
              <div className="form-group">
                <label>FULL NAME</label>
                <input type="text" placeholder="" />
              </div>
              <div className="form-group">
                <label>EMAIL ADDRESS</label>
                <input type="email" placeholder="" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>PHONE NUMBER</label>
                <input type="tel" placeholder="" />
              </div>
              <div className="form-group">
                <label>PREFERRED UNIT TYPE</label>
                <select>
                  <option>Select Option</option>
                  <option>2BHK Elite</option>
                  <option>3BHK Supreme</option>
                  <option>4BHK Penthouse</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>MESSAGE / INQUIRY DETAILS</label>
              <textarea rows="3" placeholder=""></textarea>
            </div>
            <button type="submit" className="btn-submit">SUBMIT INQUIRY</button>
          </form>

          <div className="direct-consultation">
            <h3 className="serif">Direct Consultation</h3>
            <p>Connect instantly with our property concierge for immediate assistance or to schedule a priority site visit.</p>
            <div className="consult-buttons">
              <button className="btn-private-tour">📅 SCHEDULE A PRIVATE TOUR</button>
              <button className="btn-whatsapp">💬 CONNECT VIA WHATSAPP</button>
            </div>
          </div>
        </div>
      </section>

      <section className="site-location" style={{display: 'flex', gap: '3rem', alignItems: 'stretch', padding: '5rem 2rem'}}>
  <div className="location-box" style={{flex: 1}}>
    <h3 className="serif">Site Location</h3>
    <p>Experience the serenity of our location firsthand. Our site concierge will be expecting you.</p>
  </div>
  <div style={{flex: 1}}>
    <iframe
     src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1890.685736754108!2d73.75215331977698!3d18.60235420649631!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2b948dd74e9cb%3A0x4939776014a235f4!2sPlutuss%20Digital!5e0!3m2!1sen!2sin!4v1778056466701!5m2!1sen!2sin" 
      width="100%"
      height="100%"
      style={{border: 0, minHeight: '300px', display: 'block'}}
      allowFullScreen=""
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    ></iframe>
  </div>
</section>
    </div>
  );
}
