import "./admin.css";

export default function AdminDashboard() {
  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>VANYA RESIDENCES</h2>
          <p>HERITAGE COLLECTION</p>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active"><span className="icon">📊</span> Dashboard</a>
          <a href="/inventory" className="nav-item"><span className="icon">🏢</span> Inventory</a>
          <a href="#" className="nav-item"><span className="icon">👥</span> Leads</a>
          <a href="#" className="nav-item"><span className="icon">📈</span> Analytics</a>
          <a href="#" className="nav-item"><span className="icon">💳</span> Payments</a>
        </nav>
        <div className="sidebar-user">
          <div className="user-avatar">AD</div>
          <div className="user-info">
            <h4>Admin Portal</h4>
            <p>Super Executive</p>
          </div>
          <button className="btn btn-primary btn-sm">NEW INQUIRY</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Master Portfolio Overview</h1>
            <p>PROJECT ID: VNY-HRTC-001</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline-dark btn-sm">QUARTERLY REPORT</button>
            <button className="btn btn-outline-dark btn-sm">EXPORT DATA</button>
            <button className="icon-btn">🔔</button>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Top Widgets */}
          <div className="widgets-row">
            <div className="widget">
              <h3>Analytical Performance Report</h3>
              <p className="widget-subtitle">Aggregate sales intelligence & velocity tracking</p>
              <div className="chart-placeholder">
                <div className="metric">
                  <span className="value">100</span>
                  <span className="label">TOTAL UNITS</span>
                </div>
              </div>
            </div>
            <div className="widget">
              <h3>Monthly Sales Velocity</h3>
              <div className="bar-chart-placeholder">
                {/* Simplified bar chart */}
                <div className="bar" style={{height: '30%'}}></div>
                <div className="bar" style={{height: '50%'}}></div>
                <div className="bar" style={{height: '40%'}}></div>
                <div className="bar" style={{height: '70%'}}></div>
                <div className="bar" style={{height: '90%'}}></div>
              </div>
            </div>
            <div className="widget stats-widget">
              <div className="stat-box">
                <p>TOTAL PORTFOLIO VALUE</p>
                <h2>$210.5M</h2>
                <span className="trend positive">↑ 5.2% INCREASE</span>
              </div>
              <div className="stat-box">
                <p>AVG. PRICE PER SQFT</p>
                <h2>$2.1M</h2>
              </div>
              <div className="stat-box">
                <p>CONVERSION RATE</p>
                <h2>28.4%</h2>
                <span className="trend">LEAD TO DEPOSIT</span>
              </div>
            </div>
          </div>

          {/* Grid Section */}
          <section className="grid-section widget">
            <div className="section-header-flex">
              <div>
                <h3>Master Occupancy Grid</h3>
                <p className="widget-subtitle">Strategic architectural distribution tracking</p>
              </div>
              <div className="legend">
                <span className="legend-item sold">SOLD</span>
                <span className="legend-item reserved">RESERVED</span>
                <span className="legend-item available">AVAILABLE</span>
              </div>
            </div>
            
            <div className="occupancy-grid">
              {Array.from({length: 40}).map((_, i) => {
                const status = Math.random() > 0.7 ? 'available' : (Math.random() > 0.5 ? 'reserved' : 'sold');
                return (
                  <div key={i} className={`grid-cell ${status}`}>
                    <span className="cell-num">{400 - i}</span>
                    <span className="cell-status">{status.toUpperCase()}</span>
                  </div>
                )
              })}
            </div>
            
            <div className="grid-summary">
              <div className="summary-item">
                <p>TOTAL SOLD PORTFOLIO</p>
                <h3 className="text-sold">68</h3>
              </div>
              <div className="summary-item">
                <p>ACTIVE RESERVATIONS</p>
                <h3 className="text-reserved">12</h3>
              </div>
              <div className="summary-item">
                <p>INVENTORY AVAILABLE</p>
                <h3 className="text-available">20</h3>
              </div>
            </div>
          </section>

          {/* Pipeline */}
          <section className="pipeline-section widget">
            <div className="section-header-flex">
              <div>
                <h3>Master Inquiry Pipeline</h3>
                <p className="widget-subtitle">Unified tracking of cross-channel lead acquisition</p>
              </div>
              <div>
                <input type="text" placeholder="FILTER BY CLIENT..." className="filter-input" />
                <button className="btn btn-primary btn-sm">EXPORT LOG</button>
              </div>
            </div>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th>CLIENT & CONTACT</th>
                  <th>ASSIGNED SALESMAN</th>
                  <th>SOURCE</th>
                  <th>STATUS</th>
                  <th>TIMESTAMP</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Rajesh Oberoi</strong>
                    <p>r.oberoi@wealth.com</p>
                  </td>
                  <td>Vikram Sethi</td>
                  <td>QR CODE - INQUIRY</td>
                  <td><span className="badge badge-new">NEW REGISTRATION</span></td>
                  <td>Jan 14, 11:42 AM</td>
                  <td><button className="btn-text">VIEW FULL DETAILS</button></td>
                </tr>
                <tr>
                  <td>
                    <strong>Meera Kapoor</strong>
                    <p>meera.k@gmail.com</p>
                  </td>
                  <td>Ananya Rao</td>
                  <td>WEBSITE PORTAL</td>
                  <td><span className="badge badge-pending">PENDING</span></td>
                  <td>Jan 14, 09:15 AM</td>
                  <td><button className="btn-text">VIEW FULL DETAILS</button></td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  );
}
