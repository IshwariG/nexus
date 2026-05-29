import fs from 'fs';
const file = 'c:/Users/lenovo/OneDrive/Documents/neus/nexus/src/app/admin/AdminViewClient.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace formatIndianCurrency to handle baseCurrency
content = content.replace(
  /const formatIndianCurrency = \(amountInLakhs\) => \{[\s\S]*?return new Intl\.NumberFormat\('en-IN'\)\.format\(val\);\n  \};/,
  `const formatIndianCurrency = (amountInLakhs) => {
    const val = Math.round(amountInLakhs * 100000);
    if (baseCurrency === 'USD') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val / 83);
    }
    return '₹ ' + new Intl.NumberFormat('en-IN').format(val);
  };`
);

// Replace hardcoded "Vanya Residences" (except in initialization)
content = content.replace(/<td>Vanya Residences<\/td>/g, '<td>{projectTitle}</td>');

// Replace hardcoded #c2a661
content = content.replace(/color: '#c2a661'/g, "color: brandAccent");
content = content.replace(/background: '#c2a661'/g, "background: brandAccent");
content = content.replace(/border: '1px solid #c2a661'/g, "border: `1px solid ${brandAccent}`");
content = content.replace(/borderTop: '2px dashed #c2a661'/g, "borderTop: `2px dashed ${brandAccent}`");
content = content.replace(/borderLeft: '3px solid #c2a661'/g, "borderLeft: `3px solid ${brandAccent}`");
content = content.replace(/stroke="#c2a661"/g, 'stroke={brandAccent}');
content = content.replace(/#c2a661 \$\{digitalPercent\}%/g, '${brandAccent} ${digitalPercent}%');

// Replace DreamSpaces with companyName
content = content.replace(/>DreamSpaces<\/h2>/g, '>{companyName}</h2>');

// Currency fixes
content = content.replace(/₹ \{totalRevenueFormatted\}/g, '{totalRevenueFormatted}');
content = content.replace(/₹ \{totalCollectionFormatted\}/g, '{totalCollectionFormatted}');
content = content.replace(/₹ \{collectedThisMonthFormatted\}/g, '{collectedThisMonthFormatted}');
content = content.replace(/₹ \{pendingInstallmentsFormatted\}/g, '{pendingInstallmentsFormatted}');
content = content.replace(/₹ \{overdueAmountFormatted\}/g, '{overdueAmountFormatted}');
content = content.replace(/₹ \{avgPriceLakhs/g, '{baseCurrency === "USD" ? "$" : "₹"} {avgPriceLakhs');
content = content.replace(/₹ \{totalPortfolioLakhs/g, '{baseCurrency === "USD" ? "$" : "₹"} {totalPortfolioLakhs');
content = content.replace(/₹ \{totalRevenueLakhs/g, '{baseCurrency === "USD" ? "$" : "₹"} {totalRevenueLakhs');

content = content.replace(/>₹<\/text>/g, '>{baseCurrency === "USD" ? "$" : "₹"}</text>');
content = content.replace(/return '₹0';/g, 'return baseCurrency === "USD" ? "$0" : "₹0";');
content = content.replace(/return `₹\$\{new Intl/g, 'return `${baseCurrency === "USD" ? "$" : "₹"}${new Intl');

fs.writeFileSync(file, content);
