// 가장 단순한 관리자 페이지 - React 임포트 및 훅 최소화, DOM 조작 없음
function SuperSimpleAdmin() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">초간단 관리자 페이지</h1>
      <p className="text-lg text-gray-700 mb-6">
        이 페이지는 Vite HMR 오류를 방지하기 위해 가장 단순한 형태로 작성된 관리자 페이지입니다.
        복잡한 상태 관리나 DOM 조작을 하지 않습니다.
      </p>
      
      <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">관리자 옵션</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a 
            href="/" 
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-center hover:bg-blue-700"
          >
            홈으로 돌아가기
          </a>
          <a 
            href="/properties" 
            className="bg-gray-600 text-white px-4 py-2 rounded-md text-center hover:bg-gray-700"
          >
            부동산 목록 보기
          </a>
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">데이터 관리 안내</h2>
        <div className="prose max-w-none">
          <p>
            현재 발생 중인 오류를 해결하기 위해 임시로 단순화된 페이지를 제공합니다.
            다음 안내에 따라 데이터를 관리할 수 있습니다:
          </p>
          <ul className="mt-4 space-y-2">
            <li><strong>부동산 삭제:</strong> API 엔드포인트 <code>/api/properties/:id</code>에 DELETE 요청</li>
            <li><strong>뉴스 삭제:</strong> API 엔드포인트 <code>/api/news/:id</code>에 DELETE 요청</li>
            <li><strong>사용자 삭제:</strong> API 엔드포인트 <code>/api/admin/users/:id</code>에 DELETE 요청</li>
          </ul>
          <p className="mt-4 text-gray-700">
            이 페이지는 오직 HMR 오류를 우회하기 위한 임시 방편입니다.
            정상적인 환경에서는 완전한 기능의 관리자 페이지를 이용해 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SuperSimpleAdmin;