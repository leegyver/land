import fetch from 'node-fetch';

async function test() {
    const url = 'https://m.land.naver.com/cluster/ajax/articleList';
    const params = new URLSearchParams({
        rletTpCd: 'DDD:SGJT:VL:JWJT:HOJT',
        tradTpCd: 'B2', // B2 is monthly rent (월세)
        z: '12',
        lat: '37.745',
        lon: '126.485',
        btm: '37.730',
        lft: '126.470',
        top: '37.760',
        rgt: '126.500',
        sort: 'rank',
        page: '1'
    });
    const res = await fetch(`${url}?${params.toString()}`, {
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://m.land.naver.com/"
        }
    });
    const data = await res.json();
    console.log(JSON.stringify(data.body.slice(0, 1), null, 2));
}

test();
