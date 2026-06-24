# Gachi Labs Editorial Design System

## 1. Atmosphere & Identity

차분한 일본 문화 아카이브다. 장식보다 읽기와 근거를 우선하며, 따뜻한 종이색 배경과 짙은 먹색 글자, 갈색 포인트가 편집지의 인상을 만든다. 시그니처는 작은 갈색 인디케이터와 절제된 세리프 제목이다.

## 2. Color

| Role | Token | Value | Usage |
|---|---|---|---|
| Surface/primary | `--bg-color` | `#fcfbf9` | 페이지 배경 |
| Surface/elevated | `--card-bg` | `#ffffff` | 카드·본문 |
| Text/primary | `--text-primary` | `#1c1917` | 제목 |
| Text/secondary | `--text-secondary` | `#44403c` | 본문 |
| Text/muted | `--text-muted` | `#78716c` | 메타 정보 |
| Border/default | `--border-color` | `#e7e2da` | 구분선 |
| Accent/primary | `--accent-color` | `#a44708` | 링크·강조 |
| Accent/hover | `--accent-hover` | `#7c2d12` | hover·focus |
| Status/info | `--info-bg` | `#f5f1ea` | 안내 상자 |

색상은 위 토큰으로만 사용한다. 포인트 색은 링크와 상호작용 요소에 제한한다.

## 3. Typography

| Level | Size | Weight | Line height | Usage |
|---|---:|---:|---:|---|
| Display | `clamp(1.75rem, 4vw, 2.25rem)` | 700 | 1.35 | 페이지 대표 제목 |
| H1 | `2rem` | 700 | 1.35 | 글 제목 |
| H2 | `1.4rem` | 700 | 1.45 | 본문 절 |
| H3 | `1.15rem` | 700 | 1.5 | 소제목 |
| Body/lg | `1.05rem` | 400 | 1.9 | 글 본문 |
| Body | `1rem` | 400 | 1.7 | 기본 |
| Body/sm | `0.875rem` | 500 | 1.6 | 안내·메타 |
| Caption | `0.75rem` | 500 | 1.5 | 날짜·캡션 |

- Serif: `"Noto Serif JP", "Yu Mincho", Georgia, serif`
- Sans: `"Noto Sans JP", system-ui, -apple-system, sans-serif`
- 본문 한 줄은 약 65자 이내로 제한한다.

## 4. Spacing & Layout

기본 단위는 4px다. `--space-1`(4px), `--space-2`(8px), `--space-3`(12px), `--space-4`(16px), `--space-6`(24px), `--space-8`(32px), `--space-12`(48px), `--space-16`(64px)을 사용한다.

- 최대 폭: 1200px
- 글 본문 최대 폭: 860px
- Breakpoints: 640px, 768px, 1024px
- 모바일 좌우 여백: 20px 이상

## 5. Components

### Site header
- 로고와 기본 탐색으로 구성한다.
- 로고는 축소되거나 한 글자씩 세로로 줄바꿈되지 않는다.
- 모바일에서는 탐색을 두 번째 행으로 내려 읽을 수 있게 한다.

### Article card
- 카테고리, 날짜, 제목, 요약, 관련 태그, 읽기 링크로 구성한다.
- hover와 keyboard focus에서 동일한 강조를 제공한다.

### Article detail
- 작성·검수 책임 상자, 본문, 이미지, 참고 자료, 관련 글 순서다.
- 예약 글은 `noindex`이며 홈과 sitemap에 노출하지 않는다.

### Trust notice
- 운영 정보나 문의 상태처럼 중요한 제한을 숨기지 않고 안내 상자로 표시한다.

## 6. Motion & Interaction

- 표준 전환: 250ms, `ease-in-out`
- 애니메이션은 `transform`과 `opacity`만 사용한다.
- 모든 링크과 버튼에 focus-visible 상태를 제공한다.
- `prefers-reduced-motion: reduce`에서는 비필수 애니메이션을 제거한다.

## 7. Depth & Surface

전략은 `borders-only`다. 카드와 본문은 얇은 테두리로 구분하고 그림자는 최소화한다. 모달 외에는 강한 그림자를 사용하지 않는다.
