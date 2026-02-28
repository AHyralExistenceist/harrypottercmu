# 회원가입 500 에러 디버깅

## 즉시 확인 사항

### 1. 서버 터미널 로그 확인

서버를 실행한 터미널에서 다음 로그들이 보여야 합니다:

```
Registration request: { username: '...' }
Creating user...
User created: ...
```

또는 에러가 발생하면:

```
Registration error details:
Error code: ...
Error message: ...
```

**중요**: 서버 터미널의 실제 에러 메시지를 복사해서 알려주세요!

### 2. 가장 가능성 높은 원인

#### 데이터베이스 스키마 불일치

스키마에서 email을 제거했지만 데이터베이스에는 아직 email 필드가 있을 수 있습니다.

**해결 방법:**

```powershell
cd server
npm run prisma:migrate
```

마이그레이션 이름: `remove_email`

만약 마이그레이션 중 오류가 발생하면, 데이터베이스를 초기화하고 다시 시작할 수 있습니다:

```powershell
# 주의: 이 명령은 모든 데이터를 삭제합니다!
Remove-Item prisma/dev.db -ErrorAction SilentlyContinue
npm run prisma:migrate
```

#### Prisma 클라이언트 미갱신

```powershell
npm run prisma:generate
```

### 3. 브라우저에서 확인

1. F12로 개발자 도구 열기
2. Network 탭 클릭
3. 회원가입 시도
4. `/api/auth/register` 요청 클릭
5. Response 탭에서 실제 에러 메시지 확인

### 4. 수동으로 데이터베이스 확인

```powershell
npm run prisma:studio
```

Prisma Studio가 열리면 `User` 테이블을 확인하여 email 컬럼이 있는지 확인하세요.


