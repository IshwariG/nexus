import Image from "next/image";
import "./inventory.css";
import { supabase } from '@/lib/supabase';
import InventoryFilter from './InventoryFilter';

export default async function InventoryPage() {
  // Try to fetch from Supabase. If it fails or returns no data (e.g. before the user runs the SQL script), fallback to empty array.
  let units = [];
  try {
    const { data } = await supabase.from('PropertyUnits').select('*').order('unit_id', { ascending: true });
    if (data) units = data;
  } catch(e) {}
  
  // Provide fallback hardcoded data if DB is empty so the UI doesn't break
  if (units.length === 0) {
    units = [
      { unit_id: '402', floor: '4th Floor', type: '3BHK Suite', area: '2,450 SqFt', price: '₹4.2 Cr', status: 'AVAILABLE', img: '/images/unit_interior_1777642600392.png', tag_color: 'green' },
      { unit_id: '201', floor: '2nd Floor', type: '2BHK Studio', area: '1,620 SqFt', price: '₹3.1 Cr', status: 'RESERVED', img: '/images/unit_interior_1777642600392.png', tag_color: 'blue' },
      { unit_id: '705', floor: '7th Floor', type: 'Sky Collection', area: '3,200 SqFt', price: '₹6.8 Cr', status: 'AVAILABLE', img: '/images/unit_interior_1777642600392.png', tag_color: 'green' },
      { unit_id: '102', floor: 'Ground Floor', type: 'Terrace Villa', area: '4,100 SqFt', price: '₹9.2 Cr', status: 'SOLD OUT', img: '/images/unit_interior_1777642600392.png', tag_color: 'red' },
    ];
  }

  return (
    <div className="inventory-page">
      <div className="inventory-hero">
        <div className="hero-bg">
          <Image
            src="/images/ic1.png"
            alt="Vanya Residences"
            fill
            style={{ objectFit: "cover", objectPosition: "center" }}
            priority
          />
          <div className="hero-overlay"></div>
        </div>
        <div className="inventory-hero-content container">
          <div className="hero-text-box animate-fade-in">
            <h1 className="title">Legacy Living: The<br />Inventory Gallery</h1>
            <p className="description">
              Step into a realm of curated luxury. Each residence within Vanya is a testament to architectural heritage merged with contemporary minimalist design, crafted for those who value timeless elegance.
            </p>
          </div>
        </div>
      </div>

      <div className="inventory-container container">
        <InventoryFilter initialUnits={units} />
        <div className="text-center load-more-section">
          <p className="showing-text">Showing 4 of 100 Residential Units</p>
          <button className="btn btn-outline-dark bg-white">LOAD MORE UNITS</button>
        </div>
      </div>

      <section className="heritage-collection">
        <div className="container">
          <div className="section-header-flex">
            <div>
              <p className="section-subtitle">CRAFTING LEGACIES</p>
              <h2 className="section-title text-blue">Our Heritage Collection</h2>
            </div>
            <div className="heritage-desc">
              <p>A portfolio of landmark residences across the continent, where ancestral wisdom meets modern luxury.</p>
            </div>
          </div>
          
          <div className="grid-3 heritage-grid">
            {[
              { title: 'The Saffron Estate', loc: 'RAJASTHAN, INDIA', img: '/images/heritage_saffron_1777643298987.png' },
              { title: 'The Ivory Pavilion', loc: 'HAMPI, INDIA', img: '/images/heritage_ivory_1777643326385.png' },
              { title: 'Emerald Sanctuary', loc: 'KERALA, INDIA', img: '/images/heritage_emerald_1777643352616.png' }
            ].map((item, i) => (
              <div key={i} className="heritage-card">
                <img src={item.img} alt={item.title} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                <div className="heritage-info">
                  <span className="heritage-loc">{item.loc}</span>
                  <h3>{item.title}</h3>
                  <a href="/inquiry" className="heritage-action">VIEW PROJECT →</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
