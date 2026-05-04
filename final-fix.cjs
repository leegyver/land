const fs = require('fs');

// 1. Fix routes.ts
const rPath = 'server/routes.ts';
if (fs.existsSync(rPath)) {
    let content = fs.readFileSync(rPath, 'utf8');
    content = content.split('留ㅻℓ').join('매매');
    content = content.split('?꾩꽭').join('전세');
    content = content.split('?붿꽭').join('월세');
    content = content.split('媛€寃⑸Ц??').join('가격문의');
    content = content.split('?섏쭛留ㅻЪ').join('수집매물');

    const newFn = `function standardizePrice(val: any, fieldName?: string): string {
  const n = toNum(val);
  if (n === 0) return "0";

  // 월세나 관리비는 1,000(1천원) 미만인 경우(예: 50 -> 50만원)에만 곱함
  if (fieldName === 'monthlyRent' || fieldName === 'maintenanceFee') {
    return n < 1000 ? String(Math.round(n * 10000)) : String(Math.round(n));
  }

  // 매매가, 보증금 등은 30,000(3만) 미만이면 '만원' 단위로 간주 (예: 5000 -> 5000만원)
  return n < 30000 ? String(Math.round(n * 10000)) : String(Math.round(n));
}`;
    
    const startIdx = content.indexOf('function standardizePrice');
    const endIdx = content.indexOf('}', content.indexOf('return n <', startIdx));
    const finalEndIdx = content.indexOf('}', endIdx + 1) + 1;
    
    if (startIdx !== -1 && finalEndIdx > startIdx) {
        content = content.substring(0, startIdx) + newFn + content.substring(finalEndIdx);
    }
    fs.writeFileSync(rPath, content, 'utf8');
    console.log('Fixed routes.ts');
}

// 2. Fix PropertyMap.tsx
const pmPath = 'client/src/components/map/PropertyMap.tsx';
if (fs.existsSync(pmPath)) {
    let content = fs.readFileSync(pmPath, 'utf8');
    content = content.split('留ㅻℓ').join('매매');
    content = content.split('?꾩꽭').join('전세');
    content = content.split('?붿꽭').join('월세');
    content = content.split('媛€寃⑸Ц??').join('가격문의');
    fs.writeFileSync(pmPath, content, 'utf8');
    console.log('Fixed PropertyMap.tsx');
}

// 3. Fix formatter.ts
const fPath = 'client/src/lib/formatter.ts';
if (fs.existsSync(fPath)) {
    let content = fs.readFileSync(fPath, 'utf8');
    content = content.split('?듭썝').join('억원');
    content = content.split('留뚯썝').join('만원');
    content = content.split('?レ옄瑜?').join('숫자를');
    content = content.split('?쒓뎅???뷀룓').join('한국의 화폐');
    content = content.split('?щ㎎?낇빀?덈떎').join('포맷팅합니다');
    fs.writeFileSync(fPath, content, 'utf8');
    console.log('Fixed formatter.ts');
}
