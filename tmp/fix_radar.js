const fs = require('fs');
const radarFile = 'c:/Users/koji0/Antigravity/investment/src/lib/actions/radar.ts';
let content = fs.readFileSync(radarFile, 'utf8');

// Replace 'as any' with better types or just remove when possible
content = content.replace(/snap\.data\(\) as any/g, 'snap.data() as RadarDashboardData & { lastScannedAt?: string, fullResults?: RadarDashboardData }');
content = content.replace(/const tick: any = await/g, 'const tick = await');
content = content.replace(/const summs: any = await/g, 'const summs = await');
content = content.replace(/const hist: any\[\] = await/g, 'const hist = await');
content = content.replace(/stockData as any/g, 'stockData as any'); // If those helpers need better types, I might need to check them, but for now let's use 'as unknown as X' if safer or keep as is if too complex.
// Actually, let's just use 'unknown' instead of 'any' to satisfy lint if it allows or define basic interfaces.

// Let's try a safer approach for the Yahoo results
content = content.replace(/const tick = await yf\.quote\(sym\)/g, 'const tick: any = await yf.quote(sym)'); // Wait, that's what was there.
// If the lint forbids 'any', I should use 'Record<string, unknown>' or similar.
content = content.replace(/const tick: any =/g, 'const tick: Record<string, any> ='); // This might still trigger 'any'
content = content.replace(/as any/g, 'as unknown'); // Widespread any removal

fs.writeFileSync(radarFile, content);
console.log('Fixed any in radar.ts');
