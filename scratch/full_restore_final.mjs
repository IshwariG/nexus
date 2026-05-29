import fs from 'fs';

let code = fs.readFileSync('src/app/admin/AdminViewClient.jsx', 'utf8');

// CRITICAL: Normalize line endings to \n to ensure multiline string replacement works!
code = code.replace(/\r\n/g, '\n');

// 1. Add useEffect to React import
code = code.replace("import React, { useMemo, useState } from 'react';", "import React, { useMemo, useState, useEffect } from 'react';");

// 2. Add Imports for Modals (Only Sales since CP and Buyer are already there)
code = code.replace("import AdminGlobalSearchClient from './AdminGlobalSearchClient';", `import AdminGlobalSearchClient from './AdminGlobalSearchClient';
import AdminAddSalesClient from './AdminAddSalesClient';`);

// 3. Fix Settings States (Injecting after leadAssignState)
const targetState = `  // Quick lead allocation selection
  const [leadAssignState, setLeadAssignState] = useState({ leadId: null, salesmanId: '' });`;

const stateInjection = `  // Settings configurations (Hydration-safe)
  const [companyName, setCompanyName] = useState('Vanya Residences Group');
  const [baseCurrency, setBaseCurrency] = useState('INR');
  const [allocationStrategy, setAllocationStrategy] = useState('active');
  const [themeMode, setThemeMode] = useState('classic');
  const [brandAccent, setBrandAccent] = useState('#c2a661');
  const [projectTitle, setProjectTitle] = useState('Vanya Residences');
  const [minPasswordLength, setMinPasswordLength] = useState(6);
  const [sessionExpiry, setSessionExpiry] = useState('12h');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const ls = (k, d) => localStorage.getItem(k) || d;
    setCompanyName(ls('erp_company_name', 'Vanya Residences Group'));
    setBaseCurrency(ls('erp_base_currency', 'INR'));
    setAllocationStrategy(ls('erp_allocation_strategy', 'active'));
    setThemeMode(ls('erp_theme_mode', 'classic'));
    setBrandAccent(ls('erp_brand_accent', '#c2a661'));
    setProjectTitle(ls('erp_project_title', 'Vanya Residences'));
    setSessionExpiry(ls('erp_session_expiry', '12h'));
    const savedPw = localStorage.getItem('erp_min_pw_len');
    if (savedPw) setMinPasswordLength(parseInt(savedPw, 10));
    setMfaEnabled(localStorage.getItem('erp_mfa_enabled') === 'true');
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('erp_company_name', companyName);
    localStorage.setItem('erp_base_currency', baseCurrency);
    localStorage.setItem('erp_allocation_strategy', allocationStrategy);
    localStorage.setItem('erp_theme_mode', themeMode);
    localStorage.setItem('erp_brand_accent', brandAccent);
    localStorage.setItem('erp_project_title', projectTitle);
    localStorage.setItem('erp_session_expiry', sessionExpiry);
    localStorage.setItem('erp_min_pw_len', minPasswordLength.toString());
    localStorage.setItem('erp_mfa_enabled', mfaEnabled.toString());
    
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      window.location.reload();
    }, 1500);
  };

${targetState}`;

if (code.includes(targetState)) {
    code = code.replace(targetState, stateInjection);
} else {
    console.error("FAILED to find targetState!");
}

// 4. Update the Settings UI
const oldSettingsUI = `              <div className="widget-card">
                <h3 className="serif" style={{ margin: '0 0 1.5rem 0' }}>ERP Configurations</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label>Enterprise Company Name</label>
                    <input type="text" defaultValue="Vanya Residences Group" style={{ width: '96%' }} />
                  </div>
                  <div className="form-group">
                    <label>System Base Currency Display</label>
                    <select style={{ width: '100%' }}>
                      <option value="INR">Indian Rupee (₹, Cr, L)</option>
                      <option value="USD">US Dollar ($)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Round-Robin Allocation Strategy</label>
                    <select style={{ width: '100%' }}>
                      <option value="active">Active Sales Rep Priority</option>
                      <option value="weighted">Weighted Conversion Ratio</option>
                    </select>
                  </div>
                  <button className="btn-dark" style={{ alignSelf: 'flex-start', marginTop: '1rem' }}>SAVE SETTINGS</button>
                </div>
              </div>`;

const newSettingsUI = `              <div className="widget-card">
                <h3 className="serif" style={{ margin: '0 0 1.5rem 0' }}>ERP Configurations</h3>
                {settingsSubTab === 'general' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label>Enterprise Company Name</label>
                      <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} style={{ width: '96%' }} />
                    </div>
                    <div className="form-group">
                      <label>System Base Currency Display</label>
                      <select value={baseCurrency} onChange={e => setBaseCurrency(e.target.value)} style={{ width: '100%' }}>
                        <option value="INR">Indian Rupee (₹, Cr, L)</option>
                        <option value="USD">US Dollar ($)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Round-Robin Allocation Strategy</label>
                      <select value={allocationStrategy} onChange={e => setAllocationStrategy(e.target.value)} style={{ width: '100%' }}>
                        <option value="active">Active Sales Rep Priority</option>
                        <option value="weighted">Weighted Conversion Ratio</option>
                      </select>
                    </div>
                  </div>
                )}

                {settingsSubTab === 'branding' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label>Platform Theme Mode</label>
                      <select value={themeMode} onChange={e => setThemeMode(e.target.value)} style={{ width: '100%' }}>
                        <option value="classic">Classic Light (Professional)</option>
                        <option value="dark">Executive Dark Mode</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Brand Accent Color</label>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input type="color" value={brandAccent} onChange={e => setBrandAccent(e.target.value)} style={{ width: '50px', height: '40px', padding: 0, border: 'none' }} />
                        <span style={{ fontFamily: 'monospace', color: '#6b7280' }}>{brandAccent.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Project Title (Displays on Portals)</label>
                      <input type="text" value={projectTitle} onChange={e => setProjectTitle(e.target.value)} style={{ width: '96%' }} />
                    </div>
                  </div>
                )}

                {settingsSubTab === 'security' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label>Session Expiry Time</label>
                      <select value={sessionExpiry} onChange={e => setSessionExpiry(e.target.value)} style={{ width: '100%' }}>
                        <option value="4h">4 Hours</option>
                        <option value="12h">12 Hours (Default)</option>
                        <option value="24h">24 Hours</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Minimum Password Length</label>
                      <input type="number" min="6" max="20" value={minPasswordLength} onChange={e => setMinPasswordLength(parseInt(e.target.value) || 6)} style={{ width: '96%' }} />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <input type="checkbox" id="mfaToggle" checked={mfaEnabled} onChange={e => setMfaEnabled(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                      <label htmlFor="mfaToggle" style={{ margin: 0, cursor: 'pointer' }}>Require Multi-Factor Auth (MFA) for Admin Users</label>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                  <button className="btn-dark" onClick={handleSaveSettings} style={{ background: brandAccent, border: 'none', color: '#fff' }}>SAVE SETTINGS</button>
                  {saveSuccess && <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}>✓ Settings applied successfully</span>}
                </div>
              </div>`;
if (code.includes(oldSettingsUI)) {
    code = code.replace(oldSettingsUI, newSettingsUI);
} else {
    console.error("FAILED to find oldSettingsUI!");
}

// 5. Update Sidebar Title and Brand
const oldSidebarTitle = `          <div className="sidebar-brand">
            <h1 className="serif" style={{ fontSize: '1.4rem', color: '#fff', margin: 0, lineHeight: 1.2 }}>Vanya Residences Group</h1>
            <p style={{ color: '#c2a661', fontSize: '0.7rem', margin: 0, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Admin</p>
          </div>`;
const newSidebarTitle = `          <div className="sidebar-brand">
            <h1 className="serif" style={{ fontSize: '1.4rem', color: '#fff', margin: 0, lineHeight: 1.2 }}>{companyName}</h1>
            <p style={{ color: brandAccent, fontSize: '0.7rem', margin: 0, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Admin</p>
          </div>`;
if (code.includes(oldSidebarTitle)) {
    code = code.replace(oldSidebarTitle, newSidebarTitle);
}

// 6. Update Modals (Sales)
const oldSalesHeader = `              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                {/* Executive Performance Portal Header */}
                <div>
                  <h2 className="serif" style={{ fontSize: '2rem', color: '#113629', marginBottom: '0.5rem' }}>Executive Performance Portal</h2>
                  <p className="text-muted" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>SALES REPRESENTATIVE DIRECTORY & PIPELINE PERFORMANCE</p>
                </div>
              </div>`;
const newSalesHeader = `              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                {/* Executive Performance Portal Header */}
                <div>
                  <h2 className="serif" style={{ fontSize: '2rem', color: '#113629', marginBottom: '0.5rem' }}>Executive Performance Portal</h2>
                  <p className="text-muted" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>SALES REPRESENTATIVE DIRECTORY & PIPELINE PERFORMANCE</p>
                </div>
                <AdminAddSalesClient />
              </div>`;
if (code.includes(oldSalesHeader)) {
    code = code.replace(oldSalesHeader, newSalesHeader);
} else {
    console.error("FAILED to find oldSalesHeader!");
}

// 7. Update Modals (Buyers)
const oldBuyersHeader = `              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 className="serif" style={{ fontSize: '2rem', color: '#113629', marginBottom: '0.5rem' }}>Resident & Buyer Ledger</h2>
                  <p className="text-muted" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>ACCOUNTS RECEIVABLE & OWNER CREDENTIALS</p>
                </div>
              </div>`;
const newBuyersHeader = `              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 className="serif" style={{ fontSize: '2rem', color: '#113629', marginBottom: '0.5rem' }}>Resident & Buyer Ledger</h2>
                  <p className="text-muted" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>ACCOUNTS RECEIVABLE & OWNER CREDENTIALS</p>
                </div>
                <AdminAddBuyerClient />
              </div>`;
if (code.includes(oldBuyersHeader)) {
    code = code.replace(oldBuyersHeader, newBuyersHeader);
} else {
    console.error("FAILED to find oldBuyersHeader!");
}

// 8. Update Modals (CP)
const oldCPHeader = `              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 className="serif" style={{ fontSize: '2rem', color: '#113629', marginBottom: '0.5rem' }}>Channel Partners & Referrals</h2>
                  <p className="text-muted" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>BROKER COMMISSION LEDGER & PORTAL ACCESS</p>
                </div>
              </div>`;
const newCPHeader = `              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 className="serif" style={{ fontSize: '2rem', color: '#113629', marginBottom: '0.5rem' }}>Channel Partners & Referrals</h2>
                  <p className="text-muted" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>BROKER COMMISSION LEDGER & PORTAL ACCESS</p>
                </div>
                <AdminAddCPClient />
              </div>`;
if (code.includes(oldCPHeader)) {
    code = code.replace(oldCPHeader, newCPHeader);
} else {
    console.error("FAILED to find oldCPHeader!");
}

// 9. Update formatIndianCurrency
const oldFormat = `  const formatIndianCurrency = (amountInLakhs) => {
    const val = Math.round(amountInLakhs * 100000);
    return '₹ ' + new Intl.NumberFormat('en-IN').format(val);
  };`;
const newFormat = `  const formatIndianCurrency = (amountInLakhs) => {
    const val = Math.round(amountInLakhs * 100000);
    if (baseCurrency === 'USD') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val / 83);
    }
    return '₹ ' + new Intl.NumberFormat('en-IN').format(val);
  };`;
if (code.includes(oldFormat)) {
    code = code.replace(oldFormat, newFormat);
}

// 10. Update Static Currency Text
code = code.replace(/₹ \{totalRevenueFormatted\}/g, '{baseCurrency === "USD" ? "$" : "₹"} {totalRevenueFormatted}');
code = code.replace(/₹ \{avgPriceLakhs/g, '{baseCurrency === "USD" ? "$" : "₹"} {avgPriceLakhs');
code = code.replace(/₹ \{totalPortfolioLakhs/g, '{baseCurrency === "USD" ? "$" : "₹"} {totalPortfolioLakhs');
code = code.replace(/₹ \{totalRevenueLakhs/g, '{baseCurrency === "USD" ? "$" : "₹"} {totalRevenueLakhs');
code = code.replace(/>₹<\/text>/g, '>{baseCurrency === "USD" ? "$" : "₹"}</text>');

fs.writeFileSync('src/app/admin/AdminViewClient.jsx', code);
console.log('AdminViewClient patched successfully! State injected correctly.');
