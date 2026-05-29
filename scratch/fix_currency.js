const fs = require('fs');
let code = fs.readFileSync('src/app/admin/AdminViewClient.jsx', 'utf8');

// Replace standard static currency displays
code = code.replace(/₹ \{totalRevenueFormatted\}/g, '{baseCurrency === "USD" ? "$" : "₹"} {totalRevenueFormatted}');
code = code.replace(/₹ \{avgPriceLakhs/g, '{baseCurrency === "USD" ? "$" : "₹"} {avgPriceLakhs');
code = code.replace(/₹ \{totalPortfolioLakhs/g, '{baseCurrency === "USD" ? "$" : "₹"} {totalPortfolioLakhs');
code = code.replace(/₹ \{totalRevenueLakhs/g, '{baseCurrency === "USD" ? "$" : "₹"} {totalRevenueLakhs');
code = code.replace(/>₹<\/text>/g, '>{baseCurrency === "USD" ? "$" : "₹"}</text>');

// Inside the formatIndianCurrency function
code = code.replace(/(const formatIndianCurrency = \(amountInLakhs\) => {[^}]*})/, `const formatIndianCurrency = (amountInLakhs) => {
    const val = Math.round(amountInLakhs * 100000);
    if (baseCurrency === 'USD') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val / 83);
    }
    return '₹ ' + new Intl.NumberFormat('en-IN').format(val);
  }`);

fs.writeFileSync('src/app/admin/AdminViewClient.jsx', code);
