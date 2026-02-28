# 이미지 배치 수정 가이드

## 주요 파일 위치

### 1. 홈페이지 레이아웃 및 이미지 배치
**파일: `client/src/pages/Home.tsx`**

이 파일에서 홈페이지의 모든 이미지 배치와 레이아웃을 수정할 수 있습니다.

#### 주요 섹션별 위치:

**① 상단 헤더 (15-61줄)**
- 왼쪽 로고: 18-20줄
  - 크기 조정: `height: '300px'` 값 변경
  - 위치: `px-8 pt-6 pb-4` (패딩 값 조정)

- 오른쪽 상단 사용자 컨트롤: 22-60줄
  - 텍스트 위치: 25-50줄 (`gap: '4px'`로 간격 조정)
  - 코인(galleon) 크기: 54줄 (`height: '200px', width: '200px'` 값 변경)
  - 아이콘 크기: 55-58줄 (`h-6 w-6` 클래스 변경)

**② 메인 컨텐츠 영역 (64-173줄)**

- 왼쪽 네비게이션: 65-97줄
  - 위치 조정: 66줄 `pl-16` (왼쪽 패딩), `mr-10` (오른쪽 마진)
  - 간격: `space-y-3` (항목 간 세로 간격)

- 중앙 캐릭터 이미지: 99-129줄
  - light 이미지 크기: 103-115줄 (`width: '200%', height: '200%'` 값 변경)
  - light 이미지 위치: 110-112줄 (`left: '50%', top: '50%'`)
  - shadow 이미지: 116-121줄
  - 캐릭터 이미지: 122-127줄

- 오른쪽 패널: 131-172줄
  - 전체 너비: 132줄 `w-80` (너비 조정)
  - 패널 간 간격: `space-y-5` (세로 간격)
  - 왼쪽 마진: `ml-10`
  - 멤버란 패널: 134-144줄
  - QnA 패널: 147-158줄
  - My Page: 161-165줄
  - 이벤트 패널: 172-177줄

### 2. 전역 스타일
**파일: `client/src/index.css`**

- 배경 이미지: 39줄 (`background-image: url('/castle_bg.png')`)
- 배경 오버레이: 48-58줄 (`rgba(0, 0, 0, 0.5)` 투명도 조정)
- 판타지 텍스트: 96-107줄 (색상, 그림자 효과)

## 수정 방법

### 이미지 크기 변경
```tsx
// 예시: galleon 크기 변경
<img src="/galleon.png" style={{ height: '200px', width: '200px' }} />
```

### 위치 조정 (Tailwind CSS 클래스)
- `px-8`: 좌우 패딩
- `pt-6`: 상단 패딩
- `pb-4`: 하단 패딩
- `pl-16`: 왼쪽 패딩
- `mr-10`: 오른쪽 마진
- `ml-10`: 왼쪽 마진
- `gap: '4px'`: flex 컨테이너 내 간격
- `space-y-5`: 세로 간격 (Tailwind)
- `space-x-4`: 가로 간격 (Tailwind)

### Flexbox 레이아웃
- `flex`: flex 컨테이너
- `flex-col`: 세로 방향
- `items-center`: 수직 중앙 정렬
- `items-end`: 오른쪽 정렬
- `justify-between`: 양쪽 끝 정렬
- `flex-1`: 남은 공간 차지
- `flex-shrink-0`: 축소 방지

## 이미지 파일 위치
모든 이미지 파일은 `client/public/` 폴더에 있습니다:
- Logo.png
- galleon.png
- notice.png, shop.png, message.png, settings.png
- portrait_1.png, portrait_shadow_1.png
- light.png
- member.png, QnA.png, mypage.png, event.png
- castle_bg.png

