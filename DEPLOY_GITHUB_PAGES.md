# GitHub Pages 배포 가이드

## 제한사항
- **프론트엔드만 배포 가능** (정적 사이트)
- **백엔드는 별도 서버 필요** (Railway, Render 등)

## 설정 방법

### 1. vite.config.ts 수정

GitHub Pages는 기본적으로 `/repository-name/` 경로에서 서비스되므로 base 경로 설정이 필요합니다.

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/harry/' : '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
```

**참고**: 저장소 이름이 `harry`가 아니라면 base 경로를 실제 저장소 이름으로 변경하세요.

### 2. GitHub Actions 워크플로우 생성

`.github/workflows/deploy.yml` 파일 생성:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: client/package-lock.json
      
      - name: Install dependencies
        working-directory: ./client
        run: npm ci
      
      - name: Build
        working-directory: ./client
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
      
      - name: Setup Pages
        uses: actions/configure-pages@v3
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: './client/dist'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

### 3. GitHub 저장소 설정

1. GitHub 저장소 → Settings → Pages
2. Source: "GitHub Actions" 선택
3. Secrets에 `VITE_API_URL` 추가 (백엔드 서버 URL)

### 4. 백엔드 서버 배포

GitHub Pages는 정적 사이트만 호스팅하므로 백엔드는 별도로 배포해야 합니다:

**Railway 배포:**
1. https://railway.app 접속
2. New Project → GitHub 연결
3. `server` 폴더 선택
4. 환경 변수 설정:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `PORT=3001`
   - `NODE_ENV=production`
5. 배포 후 URL 획득 (예: `https://your-app.railway.app`)

**Render 배포:**
1. https://render.com 접속
2. New Web Service
3. GitHub 저장소 연결
4. Root Directory: `server`
5. Build Command: `npm install && npm run prisma:generate && npm run build`
6. Start Command: `npm start`

### 5. 환경 변수 설정

GitHub 저장소 → Settings → Secrets and variables → Actions:
- `VITE_API_URL`: 백엔드 서버 URL (예: `https://your-app.railway.app`)

### 6. 접속 URL

배포 완료 후:
- GitHub Pages: `https://your-username.github.io/harry/`
- 백엔드: `https://your-app.railway.app`

## 주의사항

1. **CORS 설정**: 백엔드 서버에서 GitHub Pages 도메인을 허용해야 합니다.
2. **환경 변수**: 빌드 시점에 `VITE_API_URL`이 필요합니다.
3. **라우팅**: React Router를 사용하는 경우 404 페이지 처리가 필요할 수 있습니다.

