# 배경 이미지 설정 가이드

## 배경 이미지 추가 방법

### 1단계: 이미지 파일 준비

성장 이미지 파일을 준비하세요 (JPG, PNG 형식 권장)

### 2단계: 이미지 파일 복사

이미지 파일을 `client/public/` 폴더에 `castle-bg.jpg` 이름으로 저장:

```
client/
  public/
    castle-bg.jpg  ← 여기에 저장
```

### 3단계: 완료!

이미 CSS에 배경 이미지 설정이 완료되어 있습니다.
이미지 파일만 추가하면 자동으로 배경으로 사용됩니다.

## 다른 이름/위치로 저장한 경우

`client/src/index.css` 파일에서 경로 수정:

```css
background-image: url('/your-image-name.jpg');
```

## 이미지 최적화 팁

- 권장 크기: 1920x1080 이상
- 파일 크기: 500KB 이하 권장 (로딩 속도)
- 형식: JPG (사진), PNG (투명도 필요시)


