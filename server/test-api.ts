import fetch from 'node-fetch';

/**
 * 다양한 API 접근 방식을 테스트하는 함수
 */
export async function testRealEstateAPI() {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    console.error('DATA_GO_KR_API_KEY 환경변수가 설정되지 않았습니다');
    return;
  }

  console.log('새로운 API 키:', apiKey.substring(0, 10) + '...');

  // 다양한 접근 방식 테스트 - 업데이트된 엔드포인트 및 키
  const tests = [
    {
      name: '토지 실거래가 API (구 스타일)',
      url: `http://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcLandTrade?serviceKey=${apiKey}&LAWD_CD=28710&DEAL_YMD=202311`
    },
    {
      name: '아파트 실거래가 API (구 스타일)',
      url: `http://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTradeDev?serviceKey=${apiKey}&LAWD_CD=28710&DEAL_YMD=202311`
    },
    {
      name: '단독/다가구 실거래가 API (구 스타일)',
      url: `http://openapi.molit.go.kr:8081/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcSHTrade?serviceKey=${apiKey}&LAWD_CD=28710&DEAL_YMD=202311`
    },
    {
      name: '토지 실거래가 API + 인코딩 키 (신 스타일)',
      url: `https://apis.data.go.kr/1613000/RTMSDataSvcLandTrade/getLandTrade?serviceKey=${apiKey}&LAWD_CD=28710&DEAL_YMD=202503&numOfRows=10&pageNo=1`
    },
    {
      name: '아파트 실거래가 API + 인코딩 키 (신 스타일)',
      url: `https://apis.data.go.kr/1613000/AptTradeSvc/getAptTrade?serviceKey=${apiKey}&LAWD_CD=28710&DEAL_YMD=202503&numOfRows=10&pageNo=1`
    },
    {
      name: '날씨 API 테스트',
      url: `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${apiKey}&numOfRows=10&pageNo=1&base_date=20240514&base_time=0600&nx=55&ny=127`
    }
  ];

  // 모든 방법 테스트
  for (const test of tests) {
    console.log(`\n\n테스트: ${test.name}`);
    console.log(`URL: ${test.url}`);
    
    try {
      const response = await fetch(test.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml',
          'Content-Type': 'application/xml',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        }
      });
      
      console.log(`상태 코드: ${response.status} ${response.statusText}`);
      
      const text = await response.text();
      console.log(`응답 일부: ${text.substring(0, 300)}...`);

      // XML에 OpenAPI_ServiceResponse가 포함되어 있는지 확인
      if (text.includes('<OpenAPI_ServiceResponse>')) {
        console.log('✅ API 응답 형식 확인됨: OpenAPI_ServiceResponse 포함');
      }
      // XML에 response가 포함되어 있는지 확인
      else if (text.includes('<response>')) {
        console.log('✅ API 응답 형식 확인됨: response 포함');
      }
      // XML 형식이 아닌 경우
      else if (!text.includes('<?xml')) {
        console.log('❌ XML 형식이 아님');
      }
      else {
        console.log('❓ 알 수 없는 응답 형식');
      }

      // 오류 메시지 포함 여부 확인
      if (text.includes('SERVICE ERROR') || text.includes('SERVICE_KEY_IS_NOT_REGISTERED')) {
        console.log('❌ 서비스 키 오류 포함됨');
      }
      else if (text.includes('LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS')) {
        console.log('❌ 요청 횟수 초과됨');
      }
      else if (text.includes('NO_MANDATORY_REQUEST_PARAMETERS_ERROR')) {
        console.log('❌ 필수 파라미터 누락됨');
      }
      else if (text.includes('INVALID_REQUEST_PARAMETER_ERROR')) {
        console.log('❌ 잘못된 파라미터 값');
      }
      
    } catch (error) {
      console.error(`❌ 오류 발생: ${error}`);
    }
  }
}