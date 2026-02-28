# .env 파일 문제 해결

Prisma가 DATABASE_URL을 찾지 못하는 경우:

1. **.env 파일 위치 확인**
   - `.env` 파일이 `server` 폴더에 있어야 합니다 (prisma 폴더가 아닌 server 폴더)

2. **.env 파일 내용 확인**
   ```
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-secret-key-change-in-production-12345"
   PORT=3001
   NODE_ENV=development
   ```

3. **파일 인코딩 확인**
   - UTF-8 인코딩이어야 합니다
   - BOM이 없어야 합니다

4. **수동으로 생성하기**
   PowerShell에서:
   ```powershell
   cd server
   @'
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-secret-key-change-in-production-12345"
   PORT=3001
   NODE_ENV=development
   '@ | Out-File -FilePath ".env" -Encoding utf8
   ```

5. **환경 변수 직접 설정하기**
   ```powershell
   $env:DATABASE_URL="file:./dev.db"
   npm run prisma:migrate
   ```


