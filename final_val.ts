async function validate() {
    const url = 'http://localhost:5000/api/search?sortBy=priceLow&onlyCrawled=false';
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(`Total properties found: ${data.properties?.length || 0}`);

        if (data.properties && data.properties.length > 0) {
            console.log('--- Sorting Check (Monthly Rent Low to High) ---');
            data.properties.slice(0, 10).forEach((p: any, i: number) => {
                console.log(`${i + 1}. [${p.source}] ${p.title.slice(0, 30)}... | Monthly: ${p.monthlyRent} | Title: ${p.title}`);
            });

            const prices = data.properties.map((p: any) => Number(p.price)).filter((p: number) => p > 0);
            let sorted = true;
            for (let i = 0; i < prices.length - 1; i++) {
                if (prices[i] > prices[i + 1]) {
                    if (prices[i] === prices[i + 1]) continue;
                    sorted = false;
                    console.log(`Sorting error at index ${i}: ${prices[i]} > ${prices[i + 1]}`);
                    break;
                }
            }
            console.log(`Strict ascend price sorting: ${sorted ? 'PASS' : 'FAIL'}`);
        }
    } catch (e) {
        console.error('Validation failed:', e.message);
    }
}
validate();
