import "./lifestyle.css";
import Link from 'next/link';

export default function Lifestyle() {
  return (
    <div className="lifestyle-main">
      <div className="lifestyle-hero" style={{backgroundImage: "url('/images/l1.png')"}}>
        <div className="lifestyle-hero-content">
          <h1 className="serif">The Vanya Way of Life</h1>
          <p>A choreography of heritage, wellness, and modern minimalism.</p>
        </div>
      </div>

      <section className="experiences-section">
        <div className="section-header">
          <span>THE COLLECTION</span>
          <h2 className="serif">Curated Experiences</h2>
        </div>

        <div className="experience-block">
          <div className="exp-image" style={{backgroundImage: "url('/images/unit_interior_1777642600392.png')"}}></div>
          <div className="exp-content">
            <h3 className="serif">Morning Meditations</h3>
            <p>Greet the sun as it crests over the Zen Garden. Here, the silence is punctuated only by the rhythmic swing of wind chimes in the distance of pine trees, offering a sanctuary for the spirit to expand.</p>
            <Link href="/inquiry" className="exp-link">EXPLORE THE GARDENS →</Link>
          </div>
        </div>

        <div className="experience-block reverse">
          <div className="exp-image" style={{backgroundImage: "url('/images/pv1.png')"}}></div>
          <div className="exp-content">
            <h3 className="serif">Artisanal Evenings</h3>
            <p>Retreat to the heritage library as the day wanes. Surrounded by curated volumes and bespoke teak craft, lose yourself in the quiet luxury of a space designed for reflection and intellect, at repose.</p>
            <Link href="/inquiry" className="exp-link">THE LIBRARY TOUR →</Link>
          </div>
        </div>

        <div className="experience-block">
          <div className="exp-image" style={{backgroundImage: "url('/images/ws1.png')"}}></div>
          <div className="exp-content">
            <h3 className="serif">The Culinary Voyage</h3>
            <p>Experience gastronomy as art. From intimate private chef sessions to grand communal gatherings, our culinary philosophy celebrates the harvest of the land with sophisticated preparation.</p>
            <p style={{fontSize: '0.8rem', fontStyle: 'italic', color: '#888'}}>— "The act of dining is elevated to a ceremony, where every flavor tells a grander narrative."</p>
          </div>
        </div>
      </section>

      <section className="sanctuary-section">
        <div className="sanctuary-content">
          <span>THE SANCTUARY</span>
          <h2 className="serif">Ayurvedic Rebirth</h2>
          <p>Our Wellness Sanctuary is more than a spa. It is a repository of ancient wisdom reimagined for the contemporary era. Deep Emerald hues, interwoven in the architecture create an atmosphere of immediate, deep relaxation.</p>
          <p>Collaborate with our resident Vaidyas to craft a personalized ritual of restoration, utilizing organic oils drawn out of herbs that align your inner rhythm with the natural world.</p>
          
          <div className="sanctuary-stats mt-3">
            <div className="stat-item">
              <h3 className="serif">12</h3>
              <p>TREATMENT ROOMS</p>
            </div>
            <div className="stat-item">
              <h3 className="serif">03</h3>
              <p>HERITAGE POOLS</p>
            </div>
            <div className="stat-item">
              <h3 className="serif">04</h3>
              <p>YOGA PAVILIONS</p>
            </div>
          </div>
        </div>
        <div className="sanctuary-image"></div>
      </section>

      <section className="legacy-form-section">
        <h2 className="serif">Experience the Legacy</h2>
        <p>An intimate collection of residences for those who seek to live in an icon. Schedule your private viewing of Vanya Residences today.</p>
        <div className="legacy-form-container">
          {/* Note: I'm reusing the CSS from the global input classes if available, or just a simple form structure */}
          <form style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
            <div className="form-row-2col">
              <div style={{flex: 1}}>
                <label style={{display: 'block', textAlign: 'left', fontSize: '0.7rem', color: '#888', marginBottom: '0.5rem', letterSpacing: '1px'}}>FULL NAME</label>
                <input type="text" style={{width: '100%', padding: '1rem', border: 'none', borderBottom: '1px solid #ddd', background: 'transparent'}} placeholder="Your Name" />
              </div>
              <div style={{flex: 1}}>
                <label style={{display: 'block', textAlign: 'left', fontSize: '0.7rem', color: '#888', marginBottom: '0.5rem', letterSpacing: '1px'}}>EMAIL ADDRESS</label>
                <input type="email" style={{width: '100%', padding: '1rem', border: 'none', borderBottom: '1px solid #ddd', background: 'transparent'}} placeholder="your@email.com" />
              </div>
            </div>
            <div>
              <label style={{display: 'block', textAlign: 'left', fontSize: '0.7rem', color: '#888', marginBottom: '0.5rem', letterSpacing: '1px'}}>PREFERRED DATE FOR VIEWING</label>
              <input type="date" style={{width: '100%', padding: '1rem', border: 'none', borderBottom: '1px solid #ddd', background: 'transparent'}} />
            </div>
            <button className="btn btn-primary" style={{marginTop: '1rem', width: '100%'}}>REQUEST A PRIVATE VIEWING</button>
          </form>
        </div>
      </section>
    </div>
  );

}
