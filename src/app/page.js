import Image from "next/image";
import "./page.module.css";
import HeroSlider from "./HeroSlider";

export default function Home() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-split" style={{ display: 'flex', minHeight: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>

        {/* Right Side: Slider — sits behind */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <HeroSlider />
        </div>

        {/* Left Side: Content — sits on top with gradient fade */}
        <div className="hero-content-wrapper">
          <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <p className="subtitle" style={{ color: 'var(--vanya-green)', fontSize: '0.8rem', letterSpacing: '3px', marginTop: '3rem', marginBottom: '1.5rem', fontWeight: 600, textTransform: 'uppercase' }}>
              PRESERVING THE HERITAGE COLLECTION
            </p>
            <h1 className="title hero-main-title" style={{ color: 'var(--vanya-green)', lineHeight: 1.1, marginBottom: '2rem', fontFamily: 'var(--font-serif)', fontWeight: 500 }}>
              Ancestral Wisdom,<br />Modern Grace.
            </h1>
            <p className="description" style={{ color: '#555', fontSize: '1.1rem', marginBottom: '3rem', lineHeight: 1.6 }}>
              Vanya Residences brings an unrivaled experience of pure luxury to the heart of the city, where heritage craftsmanship meets contemporary architectural minimalism.
            </p>
            <div className="hero-actions" style={{ display: 'flex', gap: '1.5rem' }}>
              <a href="/inventory" className="btn" style={{ backgroundColor: 'var(--vanya-green)', color: '#fff', padding: '1rem 2rem', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px' }}>EXPLORE RESIDENCES</a>
              <a href="/inquiry" className="btn" style={{ backgroundColor: 'transparent', color: 'var(--vanya-green)', border: '1px solid var(--vanya-green)', padding: '1rem 2rem', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px' }}>THE VISION</a>
            </div>
          </div>
        </div>

      </section>

      {/* Philosophy Section */}
      <section className="philosophy container">
        <div className="phil-text">
          <p className="section-subtitle">OUR PHILOSOPHY</p>
          <h2 className="section-title" style={{color: '#fafafa'}}>The Vision:<br />Heritage Meets<br />Minimalism</h2>
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
            <img src="/images/unit_interior_1777642600392.png" alt="Interior" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
          <div className="phil-img-2">
            <img src="/images/heritage_ivory_1777643326385.png" alt="Heritage Texture" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
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
          {[
            {name: 'Infinity Sky Pool', img: '/images/sp1.png'},
            {name: 'Wellness Sanctuary', img: '/images/ws1.png'},
            {name: 'The Maharaja Lounge', img: '/images/ma1.png'},
            {name: 'Kids Atelier', img: '/images/ka1.png'},
            {name: 'Sky Garden', img: '/images/sg1.png'},
            {name: 'Private Cinema', img: '/images/pv1.png'},
            {name: 'Valet Service', img: '/images/vl1.png'},
            {name: 'Z-Level Security', img: '/images/z1.png'}
          ].map((amenity, i) => (
            <div key={i} className="amenity-card">
              <div className="amenity-img" style={{backgroundImage: `url(${amenity.img})`, backgroundSize: 'cover', backgroundPosition: 'center', height: '300px'}}></div>
              <div className="amenity-info">
                <h3>{amenity.name}</h3>
                <p className="amenity-desc">BESPOKE EXPERIENCE</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="contact-cta" style={{backgroundImage: "url('/images/l1.png')", backgroundSize: 'cover', backgroundPosition: 'center'}}>
        <div className="contact-container container">
          <div className="contact-header text-center">
            <p className="section-subtitle" style={{ color: '#c9a96e' }}>CONTACT OUR CONCIERGE</p>
            <h2 className="section-title">Begin Your Journey</h2>
            <p className="contact-desc">
              A private viewing of Vanya Residences is the first step toward a lifetime of refined living. Our consultant is ready to guide you through our bespoke configurations.
            </p>
          </div>
          <form className="contact-form">
            <div className="grid-4">
              <input type="text" placeholder="Full Name" required pattern="[A-Za-z\s]+" title="Please enter letters only" className="form-input" />
              <input type="email" placeholder="Email Address" required pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$" title="Please enter a valid email address" className="form-input" />
              <input type="tel" placeholder="Phone Number" required minLength="10" maxLength="10" pattern="[0-9]{10}" title="Please enter a valid 10-digit phone number" className="form-input" />
              <input type="text" placeholder="PIN Code" required minLength="6" maxLength="6" pattern="[0-9]{6}" title="Please enter a valid 6-digit PIN code" className="form-input" />
            </div>
            <textarea placeholder="How can we help you?" className="form-input form-textarea"></textarea>
            <div className="text-center">
              <button type="submit" className="btn btn-golden" style={{ padding: '1rem 3rem', fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase' }}>SUBMIT INQUIRY</button>
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