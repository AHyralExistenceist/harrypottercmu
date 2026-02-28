# 환경 변수 파일 생성 가이드

## 자동 생성 스크립트

아래 명령어를 실행하면 환경 변수 파일 템플릿이 생성됩니다.

### Windows PowerShell:

```powershell
# client/.env 파일 생성
@"
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
"@ | Out-File -FilePath "client\.env" -Encoding utf8

# server/.env 파일 생성 (선택사항)
@"
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
PORT=3001
"@ | Out-File -FilePath "server\.env" -Encoding utf8
```

## 수동 생성 방법

### 1. client/.env 파일 생성

`client` 폴더에 `.env` 파일을 만들고 다음 내용을 넣으세요:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. server/.env 파일 생성 (선택사항)

`server` 폴더에 `.env` 파일을 만들고 다음 내용을 넣으세요:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
PORT=3001
```

## Supabase 키 확인 방법

1. https://supabase.com 접속
2. 프로젝트 선택
3. Settings → API
4. 다음 정보 복사:
   - Project URL → `VITE_SUPABASE_URL`에 입력
   - anon public key → `VITE_SUPABASE_ANON_KEY`에 입력
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`에 입력 (서버용)

