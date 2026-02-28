# 로컬 네트워크에서 공유하기

## 빠른 설정 (같은 WiFi에 있는 사람들과 공유)

### 1단계: IP 주소 확인

PowerShell에서:
```powershell
ipconfig
```

"IPv4 주소" 찾기 (예: `192.168.0.100`)

### 2단계: 백엔드 서버 설정

`server/src/index.ts` 파일 수정:

```typescript
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
```

### 3단계: 프론트엔드 API URL 변경

`client/src/api/client.ts` 파일 수정:

```typescript
const api = axios.create({
  baseURL: 'http://YOUR_IP:3001/api', // YOUR_IP를 실제 IP로 변경
});
```

예: `baseURL: 'http://192.168.0.100:3001/api'`

### 4단계: 프론트엔드 서버 설정

`client/vite.config.ts` 파일 수정:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // 추가
    proxy: {
      '/api': {
        target: 'http://YOUR_IP:3001', // localhost를 IP로 변경
        changeOrigin: true
      }
    }
  }
});
```

### 5단계: 서버 재시작

백엔드와 프론트엔드를 재시작하세요.

### 6단계: 접속

- **본인의 컴퓨터**: `http://localhost:5173`
- **같은 WiFi의 다른 기기**: `http://YOUR_IP:5173`

예: `http://192.168.0.100:5173`

## 주의사항

1. 방화벽 설정: Windows 방화벽에서 포트 3001, 5173 허용 필요할 수 있음
2. 같은 네트워크: 모두 같은 WiFi에 연결되어 있어야 함
3. IP 주소 변경: WiFi를 다시 연결하면 IP 주소가 변경될 수 있음


