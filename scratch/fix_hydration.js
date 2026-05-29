const fs = require('fs');
let code = fs.readFileSync('src/app/admin/AdminViewClient.jsx', 'utf8');

code = code.replace(/const \[([a-zA-Z]+), set[a-zA-Z]+\] = useState\(\(\) => \{\n\s*if \(typeof window !== 'undefined'\) return localStorage\.getItem\('([^']+)'\) \|\| ('.*?'|true|false);\n\s*return \3;\n\s*\}\);/g, (match, stateVar, lsKey, defVal) => {
  return 'const [' + stateVar + ', set' + stateVar.charAt(0).toUpperCase() + stateVar.slice(1) + '] = useState(' + defVal + ');';
});

code = code.replace(/const \[minPasswordLength, setMinPasswordLength\] = useState\(\(\) => \{\n\s*if \(typeof window !== 'undefined'\) \{\n\s*const saved = localStorage\.getItem\('erp_min_pw_len'\);\n\s*return saved \? parseInt\(saved, 10\) : 6;\n\s*\}\n\s*return 6;\n\s*\}\);/, 'const [minPasswordLength, setMinPasswordLength] = useState(6);');

code = code.replace(/const \[sessionExpiry, setSessionExpiry\] = useState\(\(\) => \{\n\s*if \(typeof window !== 'undefined'\) return localStorage\.getItem\('erp_session_expiry'\) \|\| '12h';\n\s*return '12h';\n\s*\}\);/, "const [sessionExpiry, setSessionExpiry] = useState('12h');");

code = code.replace(/const \[mfaEnabled, setMfaEnabled\] = useState\(\(\) => \{\n\s*if \(typeof window !== 'undefined'\) return localStorage\.getItem\('erp_mfa_enabled'\) === 'true';\n\s*return false;\n\s*\}\);/, 'const [mfaEnabled, setMfaEnabled] = useState(false);');

const useEffectInjection = `

  useEffect(() => {
    const ls = (key, def) => localStorage.getItem(key) || def;
    setCompanyName(ls('erp_company_name', 'Vanya Residences Group'));
    setBaseCurrency(ls('erp_base_currency', 'INR'));
    setAllocationStrategy(ls('erp_allocation_strategy', 'active'));
    setAutoAssignLeads(localStorage.getItem('erp_auto_assign') !== 'false');
    setThemeMode(ls('erp_theme_mode', 'classic'));
    setBrandAccent(ls('erp_brand_accent', '#c2a661'));
    setProjectTitle(ls('erp_project_title', 'Vanya Residences'));
    setSessionExpiry(ls('erp_session_expiry', '12h'));
    const savedPw = localStorage.getItem('erp_min_pw_len');
    if(savedPw) setMinPasswordLength(parseInt(savedPw, 10));
    setMfaEnabled(localStorage.getItem('erp_mfa_enabled') === 'true');
  }, []);
`;

code = code.replace(/(const \[saveSuccess, setSaveSuccess\] = useState\(false\);)/, useEffectInjection + '$1');

fs.writeFileSync('src/app/admin/AdminViewClient.jsx', code);
console.log('Hydration mismatch fixed!');
