# Supabase 빠른 시작 가이드

## 1. Supabase 프로젝트 생성 및 설정

1. https://supabase.com 접속 후 프로젝트 생성
2. Settings → API에서 키 확인:
   - Project URL
   - anon/public key
   - service_role key

## 2. 데이터베이스 스키마 생성

Supabase Dashboard → SQL Editor에서 `server/supabase-migration.sql` 실행

## 3. 환경 변수 설정

### 클라이언트 (`client/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 서버 (`server/.env`) - 선택사항
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 4. 의존성 설치

```bash
cd server && npm install
cd ../client && npm install
```

## 5. 개발 서버 실행

```bash
# 클라이언트만 실행 (Supabase 직접 사용)
cd client && npm run dev

# 서버도 함께 실행 (Socket.io 등 필요시)
npm run dev
```

## 6. GitHub Pages 배포

1. GitHub 저장소 → Settings → Pages → Source: "GitHub Actions"
2. Secrets 설정:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. `main` 브랜치에 푸시

## 주요 변경사항

- ✅ 인증: Supabase Auth 사용
- ✅ 데이터베이스: Supabase PostgreSQL 사용
- ✅ 클라이언트: 직접 Supabase 클라이언트 사용
- ✅ 배포: GitHub Pages (정적 사이트)

## 다음 단계

나머지 라우트들(`user`, `board`, `post` 등)도 필요에 따라 Supabase로 전환할 수 있습니다.
현재는 인증 시스템만 Supabase로 전환되었습니다.

