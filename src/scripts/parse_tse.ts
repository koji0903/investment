import * as XLSX from 'xlsx';
import * as fs from 'fs';

async function parseTse() {
  const filePath = './data_j.xls';
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  // JPX Excel columns: 
  // Code (5 digits ending in 0 -> we need 4 digits), 
  // Name, 
  // Market classification, 
  // Sector (33 categories)
  
  const primeStocks = data.filter((row: any) => {
    // 17 Sector Code or 33 Sector Code might be used, but Market/Product Classification is the key
    const market = row['市場・商品区分'] || row['Market/Product Classification'] || '';
    return market.includes('プライム') || market.includes('Prime');
  }).map((row: any) => {
    let ticker = row['コード'] || row['Code'] || '';
    ticker = String(ticker).substring(0, 4);
    
    return {
      ticker,
      name: row['銘柄名'] || row['Name'] || '',
      sector: row['33業種区分'] || row['33 Sector (Category)'] || 'その他'
    };
  });

  console.log(`Found ${primeStocks.length} Prime Stocks.`);
  
  fs.writeFileSync('./src/data/tse_prime_all.json', JSON.stringify(primeStocks, null, 2));
  console.log('Saved to src/data/tse_prime_all.json');
}

parseTse();
