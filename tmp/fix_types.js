const fs = require('fs');
const assetFormFile = 'c:/Users/koji0/Antigravity/investment/src/components/ManualAssetForm.tsx';
let content = fs.readFileSync(assetFormFile, 'utf8');

// Fix explicit any for updateData
content = content.replace(/const updateData: Partial<Asset> & { \[key: string\]: any } = {/g, 'const updateData: Partial<Asset> = {');

// Fix explicit any for newData
content = content.replace(/const newData: Partial<Asset> & { \[key: string\]: any } = {/g, 'const newData: Omit<Asset, "id"> = {');

fs.writeFileSync(assetFormFile, content);
console.log('Fixed types in ManualAssetForm.tsx');
