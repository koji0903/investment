import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance();

async function test() {
  const ticker = "7012.T";
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 5);

  try {
    const chart = await yf.chart(ticker, { period1: start, period2: end, interval: "1d" });
    console.log("Chart Quotes (Last 2):");
    console.log(JSON.stringify(chart.quotes.slice(-2), null, 2));
    
    const summary = await yf.quoteSummary(ticker, { 
      modules: ["summaryDetail", "price"] 
    });
    
    // Reuse chart from line 11
    const quotes = chart.quotes.filter((q: any) => q && q.close !== null);
    const chartLastPrice = quotes[quotes.length - 1]?.close;

    const p = (summary.price as any) || {};
    const d = (summary.summaryDetail as any) || {};
    const rawCurrentPrice = p.regularMarketPrice || d.regularMarketPrice || chartLastPrice;
    
    console.log(`\n--- Verification Logic ---`);
    console.log(`Chart Last Price: ${chartLastPrice}`);
    console.log(`Summary Regular Market Price: ${rawCurrentPrice}`);
    
    let isSplitAdjusted = false;
    let splitFactor = 1;
    if (chartLastPrice && Math.abs(chartLastPrice / rawCurrentPrice - 0.2) < 0.05) {
      isSplitAdjusted = true;
      splitFactor = 5;
    }
    
    console.log(`Split Detected: ${isSplitAdjusted}, Factor: ${splitFactor}`);
    
    const finalPrice = rawCurrentPrice;
    const finalChartData = quotes.map((q: any) => {
      const val = q.close as number;
      // 乖離チェック: currentPrice の 1/splitFactor に近い値（=調整済み）なら補正
      const isPointAdjusted = isSplitAdjusted && Math.abs(val / finalPrice - (1/splitFactor)) < 0.2;
      return {
        date: q.date,
        original: val,
        adjusted: isPointAdjusted ? val * splitFactor : val
      };
    });
    
    console.log(`Final Display Price: ${finalPrice}`);
    console.log(`Final Chart Data (Last 5):`, JSON.stringify(finalChartData.slice(-5), null, 2));

  } catch (e) {
    console.error(e);
  }
}

test();
