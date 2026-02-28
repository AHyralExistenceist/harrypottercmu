// 간단한 서버 상태 확인 스크립트
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`서버 응답 상태: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('서버 응답:', data);
    if (res.statusCode === 200) {
      console.log('✅ 서버가 정상적으로 실행 중입니다!');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 서버에 연결할 수 없습니다:', error.message);
  console.log('백엔드 서버가 실행 중인지 확인하세요: cd server && npm run dev');
});

req.end();


