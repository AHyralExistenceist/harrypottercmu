# GitHub Pages + Supabase 배포 가이드

## 아키텍처 개요

- **프론트엔드**: GitHub Pages (정적 사이트)
- **백엔드**: Supabase (Auth + Database)
- **서버**: Express 서버는 선택사항 (Socket.io 등 실시간 기능이 필요한 경우만)

## 1. Supabase 설정

### 1.1 Supabase 프로젝트 생성

1. https://supabase.com 접속
2. New Project 생성
3. 프로젝트 이름, 데이터베이스 비밀번호 설정
4. Region 선택

### 1.2 데이터베이스 스키마 생성

Supabase Dashboard → SQL Editor에서 `server/supabase-migration.sql` 파일의 내용을 실행하세요.

### 1.3 API 키 확인

Supabase Dashboard → Settings → API:
- Project URL: `SUPABASE_URL`
- anon/public key: `SUPABASE_ANON_KEY`
- service_role key: `SUPABASE_SERVICE_ROLE_KEY` (서버용, 절대 노출 금지)

## 2. GitHub Pages 배포 설정

### 2.1 GitHub 저장소 설정

1. GitHub 저장소 → Settings → Pages
2. Source: "GitHub Actions" 선택

### 2.2 환경 변수 설정

GitHub 저장소 → Settings → Secrets and variables → Actions에서 다음 Secrets 추가:

- `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anon key
- `VITE_API_URL`: (선택사항) Express 서버 URL (사용하는 경우)

### 2.3 저장소 이름 확인

`.github/workflows/deploy.yml` 파일의 `base` 경로를 확인하세요.
현재 설정: `/harry/` (저장소 이름이 `harry`인 경우)

저장소 이름이 다르면 `client/vite.config.ts`에서 수정:
```typescript
base: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '/',
```

## 3. 로컬 개발 환경 설정

### 3.1 클라이언트 환경 변수

`client/.env` 파일 생성:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

### 3.2 서버 환경 변수 (선택사항)

`server/.env` 파일 생성:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
```

## 4. 배포 프로세스

### 4.1 자동 배포 (GitHub Actions)

1. 코드를 `main` 브랜치에 푸시
2. GitHub Actions가 자동으로 빌드 및 배포
3. 배포 완료 후 `https://your-username.github.io/harry/` 접속

### 4.2 수동 배포

```bash
cd client
npm install
npm run build
```

빌드된 파일(`client/dist`)을 GitHub Pages에 업로드하거나, GitHub Actions를 사용하세요.

## 5. 인증 플로우

### 5.1 회원가입

1. 사용자가 Supabase Auth에 회원가입
2. `users` 테이블에 프로필 생성
3. 세션 자동 생성 및 저장

### 5.2 로그인

1. 사용자가 Supabase Auth로 로그인
2. 세션 토큰 자동 관리
3. RLS 정책에 따라 데이터 접근 제어

### 5.3 데이터 접근

- 클라이언트에서 직접 Supabase 클라이언트 사용
- RLS 정책으로 보안 관리
- 필요시 Express 서버를 통한 추가 로직 처리

## 6. 주의사항

1. **환경 변수**: `.env` 파일은 절대 커밋하지 마세요
2. **Service Role Key**: 서버에서만 사용하고 클라이언트에 노출 금지
3. **RLS 정책**: 모든 테이블에 적절한 RLS 정책 설정 필수
4. **CORS**: Supabase는 자동으로 CORS 처리
5. **Base 경로**: GitHub Pages는 `/repository-name/` 경로를 사용하므로 라우팅 설정 확인

## 7. 트러블슈팅

### 7.1 404 에러 (라우팅)

React Router를 사용하는 경우 `_redirects` 파일 추가:
```
/*    /index.html   200
```

또는 `vite.config.ts`에서 `base` 경로 확인

### 7.2 인증 오류

- Supabase 환경 변수 확인
- RLS 정책 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 7.3 빌드 오류

- Node.js 버전 확인 (18 이상 권장)
- 의존성 설치 확인: `npm ci`
- 환경 변수 설정 확인

## 8. 추가 리소스

- [Supabase 문서](https://supabase.com/docs)
- [GitHub Pages 문서](https://docs.github.com/pages)
- [Vite 배포 가이드](https://vite.dev/guide/static-deploy)

