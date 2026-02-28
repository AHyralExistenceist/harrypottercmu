# .env 파일 검증 스크립트
Write-Host "현재 디렉토리: $(Get-Location)"
Write-Host ""

Write-Host ".env 파일 존재 여부:"
if (Test-Path ".env") {
    Write-Host "  ✓ .env 파일 발견"
    Write-Host ""
    Write-Host ".env 파일 내용:"
    Get-Content .env | ForEach-Object {
        Write-Host "  $_"
        if ($_ -match "^DATABASE_URL") {
            Write-Host "    → DATABASE_URL 발견!"
        }
    }
} else {
    Write-Host "  ✗ .env 파일 없음"
}

Write-Host ""
Write-Host "환경 변수 확인:"
if ($env:DATABASE_URL) {
    Write-Host "  ✓ DATABASE_URL = $env:DATABASE_URL"
} else {
    Write-Host "  ✗ DATABASE_URL 없음"
}


