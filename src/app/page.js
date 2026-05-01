import Image from "next/image";
import "./page.module.css";

export default function Home() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <Image
            src="/images/hero.png"
            alt="Vanya Residences High-Rise"
            fill
            style={{ objectFit: "cover", objectPosition: "center" }}
            priority
          />
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content container animate-fade-in">
          <p className="subtitle">PRESERVING THE HERITAGE COLLECTION</p>
          <h1 className="title">Ancestral Wisdom,<br />Modern Grace.</h1>
          <p className="description">
            Vanya Residences brings an unrivaled experience of pure luxury to the heart of the city, where heritage craftsmanship meets contemporary architectural minimalism.
          </p>
          <div className="hero-actions">
            <a href="/inventory" className="btn btn-primary">EXPLORE RESIDENCES</a>
            <a href="/inquiry" className="btn btn-outline">THE VISION</a>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="philosophy container">
        <div className="phil-text">
          <p className="section-subtitle">OUR PHILOSOPHY</p>
          <h2 className="section-title">The Vision:<br />Heritage Meets<br />Minimalism</h2>
          <p className="phil-desc">
            At Vanya, we believe luxury isn't about excess—it's about the soul of the materials and the silence between the walls. Our architecture honors centuries of Indian craftsmanship, while embracing the airy, open-plan freedom of modern global design.
          </p>
          <div className="phil-features">
            <div className="feature">
              <div className="feature-icon">A</div>
              <div className="feature-text">
                <h3>Sustaining Craft</h3>
                <p>Natural stone and handcrafted woods integrated into a 21st-century structure.</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">◇</div>
              <div className="feature-text">
                <h3>Serene Living</h3>
                <p>Biophilic design principles ensure every room breathes with natural light and air.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="phil-images">
          <div className="phil-img-1">
            <div className="placeholder-image" style={{backgroundColor: '#e6e3dd', height: '100%'}}></div>
          </div>
          <div className="phil-img-2">
            <div className="placeholder-image" style={{backgroundColor: '#d8d4c9', height: '100%'}}></div>
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="amenities container">
        <div className="section-header text-center">
          <p className="section-subtitle">CURATED EXPERIENCES</p>
          <h2 className="section-title">Unrivaled Amenities</h2>
        </div>
        <div className="grid-4 amenities-grid">
          {['Infinity Sky Pool', 'Wellness Sanctuary', 'The Maharaja Lounge', 'Kids Atelier', 'Sky Garden', 'Private Cinema', 'Valet Service', 'Z-Level Security'].map((amenity, i) => (
            <div key={i} className="amenity-card">
              <div className="amenity-img placeholder-image" style={{backgroundColor: '#133221', height: '300px'}}></div>
              <div className="amenity-info">
                <h3>{amenity}</h3>
                <p className="amenity-desc">BESPOKE EXPERIENCE</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="contact-cta">
        <div className="contact-container container">
          <div className="contact-header text-center">
            <p className="section-subtitle">CONTACT OUR CONCIERGE</p>
            <h2 className="section-title text-white">Begin Your Journey</h2>
            <p className="contact-desc text-white">
              A private viewing of Vanya Residences is the first step toward a lifetime of refined living. Our consultant is ready to guide you through our bespoke configurations.
            </p>
          </div>
          <form className="contact-form">
            <div className="grid-3">
              <input type="text" placeholder="Full Name" className="form-input" />
              <input type="email" placeholder="Email Address" className="form-input" />
              <input type="tel" placeholder="Phone Number" className="form-input" />
            </div>
            <textarea placeholder="How can we help you?" className="form-input form-textarea"></textarea>
            <div className="text-center">
              <button type="submit" className="btn btn-primary">SUBMIT INQUIRY</button>
            </div>
            <div className="contact-info text-center">
              <span>+91 8000 000 000</span>
              <span>CONCIERGE@VANYARESIDENCES.COM</span>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
