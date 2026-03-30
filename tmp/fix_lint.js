const fs = require('fs');
const path = require('path');

const eurusdFile = 'c:/Users/koji0/Antigravity/investment/src/components/fx/eurusd/IntegratedCommandCenter.tsx';
let eurusdContent = fs.readFileSync(eurusdFile, 'utf8');
// Fix unescaped entities (double safety)
if (eurusdContent.includes('"{rec?.reason || "EUR/USDのモメンタムとボラティリティを解析しています。"}"')) {
    eurusdContent = eurusdContent.replace(/"{rec\?\.reason || "EUR\/USDのモメンタムとボラティリティを解析しています。"}"/g, '&quot;{rec?.reason || "EUR/USDのモメンタムとボラティリティを解析しています。"}&quot;');
    fs.writeFileSync(eurusdFile, eurusdContent);
    console.log('Fixed quotes in IntegratedCommandCenter.tsx');
}

const reviewFile = 'c:/Users/koji0/Antigravity/investment/src/components/fx/FXReviewDashboard.tsx';
let reviewContent = fs.readFileSync(reviewFile, 'utf8');
if (reviewContent.includes('[user?.uid, loadReviews]')) {
    reviewContent = reviewContent.replace(/\[user\?\.uid, loadReviews\]/g, '[loadReviews]');
    fs.writeFileSync(reviewFile, reviewContent);
    console.log('Fixed useEffect in FXReviewDashboard.tsx');
}

const assetFormFile = 'c:/Users/koji0/Antigravity/investment/src/components/ManualAssetForm.tsx';
let assetFormContent = fs.readFileSync(assetFormFile, 'utf8');
// Fix explicit any
assetFormContent = assetFormContent.replace(/const updateData: any = {/g, 'const updateData: Partial<Asset> & { [key: string]: any } = {'); // Still need any for dynamic keys if they exist, but let's try more specific
assetFormContent = assetFormContent.replace(/const newData: any = {/g, 'const newData: Partial<Asset> & { [key: string]: any } = {');
fs.writeFileSync(assetFormFile, assetFormContent);
console.log('Fixed any in ManualAssetForm.tsx');
