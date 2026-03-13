import fetch from 'node-fetch';

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://m.land.naver.com/",
    "X-Requested-With": "XMLHttpRequest",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site"
};

async function test() {
    const url = "https://m.land.naver.com/cluster/ajax/articleList";
    const params = new URLSearchParams({
        itemId: "",
        mapKey: "",
        lgeo: "",
        showLatest: "false",
        remem_vincle: "2",
        type: "any",
        rletTpCd: "DDD:SGJT:VL",
        tradTpCd: "A1:B1:B2",
        z: "12",
        lat: "37.746",
        lon: "126.488",
        btm: "37.585",
        lft: "126.151",
        top: "37.906",
        rgt: "126.837",
        pgr: "1"
    });

    console.log('Fetching:', `${url}?${params.toString()}`);

    try {
        const response = await fetch(`${url}?${params.toString()}`, {
            method: 'GET',
            headers: HEADERS,
            redirect: 'manual'
        });

        console.log('Status:', response.status, response.statusText);
        console.log('Headers:', JSON.stringify(response.headers.raw(), null, 2));

        const loc = response.headers.get('location');
        if (loc) {
            console.log('Redirect Location:', loc);
        } else {
            const body = await response.text();
            console.log('Body Length:', body.length);
            console.log('Body Preview:', body.substring(0, 500));
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

test();
