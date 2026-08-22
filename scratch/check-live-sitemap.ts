import https from 'https';

https.get('https://leegyver.com/sitemap.xml', (res) => {
  let xml = '';
  res.on('data', (c) => (xml += c));
  res.on('end', () => {
    const lines = xml.split('\n');
    console.log(`Total lines in sitemap.xml: ${lines.length}`);
    
    // Find all lastmod tags
    const lastmodRegex = /<lastmod>(.*?)<\/lastmod>/g;
    let match;
    let idx = 0;
    const invalidDates: { line: number; value: string; url: string }[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const lm = l.match(/<lastmod>(.*?)<\/lastmod>/);
      if (lm) {
        const val = lm[1];
        // Valid W3C datetime formats: YYYY-MM-DD or YYYY-MM-DDThh:mm:ss+00:00
        if (!/^\d{4}-\d{2}-\d{2}$/.test(val) && !/^\d{4}-\d{2}-\d{2}T/.test(val)) {
          invalidDates.push({ line: i + 1, value: val, url: lines[i - 1] || '' });
        }
      }
    }
    
    console.log(`Found ${invalidDates.length} invalid date instances:`);
    console.log(invalidDates.slice(0, 30));
  });
});
