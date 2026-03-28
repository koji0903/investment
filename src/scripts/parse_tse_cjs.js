const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function parseTse() {
  const filePath = path.join(process.cwd(), 'data_j.xls');
  if (!fs.existsSync(filePath)) {
    console.error('data_j.xls not found in ' + filePath);
    process.exit(1);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const data = XLSX.utils.sheet_to_json(worksheet);
  console.log('Total items in Excel: ' + data.length);
  
  const primeStocks = data.filter((row) => {
    // JPX columns can vary slightly. Try multiple keys.
    const market = row['市場区分'] || row['市場・商品区分'] || row['Market/Product Classification'] || '';
    return String(market).includes('プライム');
  }).map((row) => {
    let tickerRaw = String(row['コード'] || row['Code'] || '');
    // Tickers in Excel are often 5 digits (e.g. 13010). We need 4.
    let ticker = tickerRaw.length >= 4 ? tickerRaw.substring(0, 4) : tickerRaw;
    
    return {
      ticker: ticker,
      name: row['銘柄名'] || row['Name'] || '',
      sector: row['33業種区分'] || row['33 Sector (Category)'] || 'その他'
    };
  });

  console.log('Found ' + primeStocks.length + ' Prime Stocks.');
  
  const outputPath = path.join(process.cwd(), 'src', 'data', 'tse_prime_all.json');
  fs.writeFileSync(outputPath, JSON.stringify(primeStocks, null, 2));
  console.log('Saved to ' + outputPath);
}

parseTse();
