# .env 파일 생성 스크립트
$envContent = @'
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production-12345"
PORT=3001
NODE_ENV=development
'@

$envContent | Out-File -FilePath ".env" -Encoding utf8 -NoNewline
Write-Host ".env file created successfully!"


