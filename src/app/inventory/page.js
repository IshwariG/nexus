import Image from "next/image";
import "./inventory.css";

export default function InventoryPage() {
  const units = [
    { id: '402', floor: '4th Floor', type: '3BHK Suite', area: '2,450 SqFt', price: '₹4.2 Cr', status: 'AVAILABLE', img: '/images/unit1.jpg', tagColor: 'green' },
    { id: '201', floor: '2nd Floor', type: '2BHK Studio', area: '1,620 SqFt', price: '₹3.1 Cr', status: 'RESERVED', img: '/images/unit2.jpg', tagColor: 'blue' },
    { id: '705', floor: '7th Floor', type: 'Sky Collection', area: '3,200 SqFt', price: '₹6.8 Cr', status: 'AVAILABLE', img: '/images/unit3.jpg', tagColor: 'green' },
    { id: '102', floor: 'Ground Floor', type: 'Terrace Villa', area: '4,100 SqFt', price: '₹9.2 Cr', status: 'SOLD OUT', img: '/images/unit4.jpg', tagColor: 'red' },
  ];

  return (
    <div className="inventory-page">
      <div className="inventory-hero">
        <div className="hero-bg">
          <Image
            src="/images/hero.png"
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
        <div className="filters-bar">
          <div className="filter-group">
            <label>STATUS</label>
            <select className="filter-select">
              <option>All Status</option>
              <option>Available</option>
              <option>Reserved</option>
            </select>
          </div>
          <div className="filter-group">
            <label>FLOOR RANGE / LEVEL</label>
            <select className="filter-select">
              <option>Any Floor</option>
              <option>1st - 5th Floor</option>
              <option>Sky Collection</option>
            </select>
          </div>
          <div className="filter-group">
            <label>UNIT TYPE</label>
            <select className="filter-select">
              <option>All Residences</option>
              <option>2BHK</option>
              <option>3BHK</option>
            </select>
          </div>
          <button className="btn btn-outline-dark filter-btn">APPLY SELECTION</button>
        </div>

        <div className="grid-4 units-grid">
          {units.map((unit, i) => (
            <div key={i} className="unit-card">
              <div className="unit-img-wrapper">
                <span className={`status-tag status-${unit.tagColor}`}>{unit.status}</span>
                <div className="placeholder-image" style={{backgroundColor: '#e6e3dd', height: '100%'}}></div>
              </div>
              <div className="unit-info">
                <div className="unit-header">
                  <h3>Unit {unit.id}</h3>
                  <span className="unit-floor">{unit.floor}</span>
                </div>
                <div className="unit-details">
                  <div className="detail-row">
                    <span>TYPE</span>
                    <strong>{unit.type}</strong>
                  </div>
                  <div className="detail-row">
                    <span>AREA</span>
                    <strong>{unit.area}</strong>
                  </div>
                </div>
                <div className="unit-footer">
                  <h2 className="unit-price">{unit.price}</h2>
                  <a href="/inquiry" className="unit-action">SEND INQUIRY</a>
                </div>
              </div>
            </div>
          ))}
        </div>
        
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
              <h2 className="section-title text-white">Our Heritage Collection</h2>
            </div>
            <div className="heritage-desc">
              <p>A portfolio of landmark residences across the continent, where ancestral wisdom meets modern luxury.</p>
            </div>
          </div>
          
          <div className="grid-3 heritage-grid">
            {[
              { title: 'The Saffron Estate', loc: 'RAJASTHAN, INDIA' },
              { title: 'The Ivory Pavilion', loc: 'HAMPI, INDIA' },
              { title: 'Emerald Sanctuary', loc: 'KERALA, INDIA' }
            ].map((item, i) => (
              <div key={i} className="heritage-card">
                <div className="placeholder-image" style={{backgroundColor: '#133221', height: '100%'}}></div>
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
