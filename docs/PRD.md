# 커피 주문 앱

## 1. 프로젝트 개요

### 1.1 프로젝트 명
커피 주문 앱

### 1.2 프로젝트 목적
사용자가 커피 메뉴를 주문하고, 관리자가 주문을 관리할 수 잇는 간단한 풀스택 웹 앱

### 1.3 개발 범위
- 주문하기 화면(메뉴 선택 및 장바구니 기능)
- 관리자 화면(재고 관리 및 주문 상태 관리)
- 데이터를 생성/조회/수정/삭제할 수 있는 기능

## 2. 기술 스택
- FE : HTML, CSS, 리엑트, JS
- BE : Node.js, Express
- DB : PostgreSQL

## 3. 기본 사항
- FE, BE 따로개발
- 기본적인 웹 기술만 사용
- 학습 목적이므로 사용자 인증이나 결제 기능은 제외
- 메뉴는 커피 메뉴만 있음

## 4. 화면별 요구사항

### 4.1 주문하기 화면(PRD)

#### 4.1.1 목적
- 사용자가 커피 메뉴를 탐색하고 옵션을 선택하여 장바구니에 담고, 총액을 확인한 뒤 주문을 생성한다.

#### 4.1.2 주요 사용자 시나리오
1) 사용자는 메뉴 카드 그리드를 스크롤하며 원하는 메뉴를 찾는다.
2) 특정 메뉴 카드에서 옵션(샷 추가, 시럽 추가)을 체크 후 "담기"를 눌러 장바구니에 추가한다.
3) 장바구니 영역에서 품목/수량/가격과 총 금액을 확인한다.
4) 필요 시 품목 수량 증감 또는 삭제를 수행한다.
5) "주문하기" 버튼을 눌러 주문을 생성한다.

#### 4.1.3 정보 구조(IA)
- 헤더: 앱명(`COZY`), 네비게이션 버튼(`주문하기`, `관리자`).
- 메뉴 영역: 카드 리스트(이미지, 이름, 가격, 간단 설명, 옵션 체크박스, 담기 버튼).
- 장바구니 패널: 품목 리스트(메뉴명, 선택 옵션 요약, 수량, 소계), 총 금액, 주문하기 버튼.

#### 4.1.4 컴포넌트/위젯
- AppHeader: 타이틀, 탭 내비게이션.
- MenuGrid: `MenuCard[]`를 그리드로 배치.
- MenuCard: 이미지 썸네일, 이름, 가격, 설명, 옵션(샷+500원, 시럽+0원), `담기` 버튼.
- CartPanel: CartItem 리스트, 총 금액, `주문하기` CTA.
- CartItem: 메뉴명, 옵션 요약, 수량 증감 버튼, 삭제 버튼, 소계.

#### 4.1.5 데이터 모델(초안)
- MenuItem: { id, name, tempType(ICE|HOT), price, description, imageUrl }
- Option: { id, name, priceDelta }  // 샷(+500), 시럽(+0)
- CartItem: { id, menuId, selectedOptions: Option[], quantity, lineTotal }
- Order: { id, items: CartItem[], totalAmount, createdAt }

#### 4.1.6 기능 요구사항(FR)
- 메뉴 목록 조회: 페이지 진입 시 전체 메뉴 로드(최소 9개까지 확장 가능). 로딩 상태 표시.
- 옵션 선택: 각 카드에서 옵션 다중 선택 가능. 선택은 카드별 독립적으로 관리.
- 장바구니 담기: `담기` 클릭 시 해당 메뉴와 옵션 조합이 동일하면 수량+1, 다르면 새 항목 추가.
- 장바구니 보기: 하단 패널에 항상 고정 노출. 아이템명, 옵션 요약, 수량, 소계, 총 금액 표시.
- 수량 변경: CartItem의 `+`/`-`로 수량 증감(1 미만 불가). 변경 시 실시간 합계 반영.
- 항목 삭제: CartItem 단건 삭제 가능. 마지막 항목 삭제 시 총 금액 0원 표시.
- 총 금액 계산: (기본가 + 옵션가 합) × 수량의 합계. 통화 표기 `#,###원`.
- 주문 생성: `주문하기` 클릭 시 주문 객체 생성 및 서버에 POST. 성공 시 주문번호 알림 및 장바구니 초기화.
- 오류 처리: 네트워크 실패/검증 오류 시 사용자 피드백 토스트/알럿 제공.

#### 4.1.7 비기능 요구사항(NFR)
- 반응형: 320px~ 데스크톱까지 2~4열 그리드 재배치.
- 접근성: 버튼 포커스 링, 체크박스 라벨 클릭 가능, 색 대비 준수.
- 성능: 초기 메뉴 로드 200ms 내 렌더(로컬 목업 기준), 상호작용 16ms 프레임 유지.
- 국제화: 통화/라벨 하드코딩 최소화(향후 다국어 대비).

#### 4.1.8 상태/에러 메시지
- 로딩: "메뉴를 불러오는 중..."
- 빈 장바구니: "장바구니가 비어 있습니다. 메뉴를 담아보세요."
- 주문 성공: "주문이 접수되었습니다. 주문번호: {orderId}"
- 주문 실패: "주문에 실패했습니다. 잠시 후 다시 시도해주세요."

#### 4.1.9 검증 규칙
- 수량은 정수 1~99.
- 동일 메뉴+옵션 조합은 병합.
- 총 금액은 항상 0 이상.

#### 4.1.10 추적 지표(초안)
- 메뉴→담기 전환율, 평균 장바구니 수량, 주문 성공률, 평균 주문금액.

#### 4.1.11 디자인 가이드(와이어 참조)
- 카드: 썸네일 16:9, 이름 굵게, 가격은 `#,###원` 형식.
- 옵션: 체크박스 왼쪽 정렬, 라벨에 가격 변동 표시.
- CTA: `담기`, `주문하기`는 동일한 스타일의 기본 버튼.

### 4.2 관리자 화면(PRD)

#### 4.2.1 목적
- 관리자에게 재고 현황 확인/조정, 주문 접수 및 진행 상태 업데이트 기능을 제공한다.

#### 4.2.2 주요 사용자 시나리오
1) 관리자는 대시보드에서 총 주문 수, 접수/제조 중/완료 카운트를 확인한다.
2) 재고 관리 영역에서 각 메뉴의 재고를 `+/-` 버튼으로 증감한다.
3) 주문 현황에서 새로운 주문을 확인하고 `주문 접수`를 눌러 상태를 변경한다.
4) 접수된 주문의 제조가 끝나면 상태를 `제조 중 → 제조 완료`로 업데이트한다.

#### 4.2.3 정보 구조(IA)
- 헤더: 앱명, 내비게이션(`주문하기`, `관리자`).
- 관리자 대시보드: 총 주문 수, 주문 접수, 제조 중, 제조 완료 카운트.
- 재고 현황: 메뉴 카드형 목록(메뉴명, 현재 재고, `+`/`-` 조정).
- 주문 현황: 주문 리스트(시간, 품목/수량/옵션 요약, 금액, 상태, 액션 버튼).

#### 4.2.4 컴포넌트/위젯
- AdminHeader: 타이틀, 내비게이션.
- StatBar: 집계 지표(총 주문, 접수, 제조 중, 완료).
- InventoryList: `InventoryItemCard[]` 렌더.
- InventoryItemCard: 메뉴명, 현재 재고, `+`/`-` 버튼.
- OrderList: 필터/정렬 옵션(기본: 최신순), `OrderRow[]`.
- OrderRow: 주문시간, 주문 요약, 금액, 상태 배지, 상태 전환 버튼.

#### 4.2.5 데이터 모델(초안)
- Inventory: { menuId, stockQty, updatedAt }
- Order(확장): { id, items: CartItem[], totalAmount, status(PLACED|ACCEPTED|IN_PROGRESS|DONE), createdAt, updatedAt }
- OrderEvent(Log): { id, orderId, type(STATE_CHANGE|NOTE), payload, createdAt }

#### 4.2.6 기능 요구사항(FR)
- 재고 조회: 페이지 진입 시 모든 메뉴의 재고를 조회하여 표시.
- 재고 증감: `+/-` 클릭 시 낙관적 업데이트 후 서버 PATCH. 음수 불가, 상한은 999로 제한.
- 재고 동시성: 서버 응답 실패 시 UI를 원복하고 에러 토스트 표시.
- 주문 목록 조회: 기본 최신순, 페이징 또는 무한 스크롤(초기 20건) 지원.
- 주문 접수: 상태 `PLACED → ACCEPTED`, 접수 시각 기록.
- 제조 시작: 상태 `ACCEPTED → IN_PROGRESS`.
- 제조 완료: 상태 `IN_PROGRESS → DONE`, 완료 시각 기록.
- 상태 변경 규칙: 위 순서만 허용, 역전/스킵 금지.
- 카운트 집계: 각 상태별 수를 상단 StatBar에 실시간 반영.
- 알림(선택): 신규 주문 발생 시 시각적 배지 또는 소리 알림 옵션.

#### 4.2.7 비기능 요구사항(NFR)
- 반응형: 태블릿/데스크톱에서 2열 레이아웃, 모바일에서 단일 컬럼.
- 접근성: 버튼에 적절한 aria-label, 배지 색상 대비 준수.
- 보안: 관리자 화면은 추후 인증 연동 전까지 로컬 개발에서만 노출 또는 간단한 토글 가드.
- 감사 로깅: 모든 상태 변경은 `OrderEvent`로 기록(추후 감사/통계 용도).

#### 4.2.8 상태/에러 메시지
- 재고 업데이트 성공: "재고가 업데이트되었습니다."
- 재고 업데이트 실패: "재고 업데이트에 실패했습니다. 다시 시도해주세요."
- 상태 전환 실패: "유효하지 않은 상태 전환입니다."
- 주문 목록 로딩: "주문을 불러오는 중..."

#### 4.2.9 검증 규칙
- 재고는 정수 0~999.
- 주문 상태 전환은 허용된 순서만 가능.
- 완료 주문(DONE)은 편집 불가, 재오픈 금지.

#### 4.2.10 추적 지표(초안)
- 평균 접수 소요시간(PLACED→ACCEPTED), 평균 제조 시간(ACCEPTED→DONE), 주문 처리량, 재고 보충 빈도.

#### 4.2.11 디자인 가이드(와이어 참조)
- StatBar: 숫자는 볼드, 단위 라벨은 보조 텍스트.
- Inventory 카드: 재고 수는 고정폭 폰트, `+/-` 버튼은 터치 영역 32px 이상.
- OrderRow: 상태 배지는 색상으로 구분(접수 파랑, 제조중 주황, 완료 회색).

## 5. 백엔드 PRD

### 5.1 데이터 모델
- Menus: { id, name, description, price, imageUrl, stockQty, createdAt, updatedAt }
- Options: { id, menuId, name, priceDelta, createdAt, updatedAt }
- Orders: { id, createdAt, status(PLACED|ACCEPTED|IN_PROGRESS|DONE), totalAmount }
- OrderItems: { id, orderId, menuId, quantity, unitPrice, lineTotal }
- OrderItemOptions: { id, orderItemId, optionId, priceDelta }

설명
- Menus.stockQty는 관리자 화면에만 노출, 주문 화면에는 노출하지 않음(품절 등 정책은 FE에서 후처리 가능).
- Orders.totalAmount는 정규화와 조회 성능을 위해 집계 컬럼으로 저장.

### 5.2 사용자 흐름(데이터 스키마 관점)
1) Menus 조회: 클라이언트 진입 시 메뉴 목록을 조회해 카드로 렌더. `stockQty`는 관리자 화면에서만 표시.
2) 장바구니: 사용자가 메뉴와 옵션을 선택해 담으면 FE 상태로 유지.
3) 주문 생성: 사용자가 `주문하기`를 누르면 Orders + OrderItems(+ OrderItemOptions)를 트랜잭션으로 생성한다. `Orders.createdAt`, `Orders.totalAmount` 저장.
4) 관리자 주문 현황: Orders를 상태별로 조회해 리스트로 표시. 상태 흐름은 `PLACED → ACCEPTED → IN_PROGRESS → DONE`.

트랜잭션 규칙(주요 불변성)
- 주문 생성 시: 재고 차감은 메뉴별 수량 합계만큼 감소. 음수 허용 금지.
- 상태 변경 시: 허용된 순서만 가능, 되돌리기 불가. 완료 시각은 `updatedAt`에 기록(필요 시 별도 `finishedAt`).

### 5.3 API 설계

베이스 URL: `/api`

- GET `/menus`
  - 설명: 주문 화면에 표시할 메뉴 목록 조회
  - 응답: `[{ id, name, description, price, imageUrl }]`(주문 화면에는 `stockQty` 미포함)
  - 관리자 전용 확장: 쿼리 `?includeStock=true` 시 `stockQty` 포함

- POST `/orders`
  - 설명: 주문 생성(장바구니 → 주문)
  - 요청(JSON):
    - `{ items: [{ menuId, quantity, optionIds: [] }], createdAt? }`
  - 처리:
    - 트랜잭션으로 Orders, OrderItems, OrderItemOptions 생성
    - Menus.stockQty를 품목별 `quantity`만큼 차감(0 미만이면 롤백)
  - 응답: `{ orderId, totalAmount, status: 'PLACED' }`

- GET `/orders/:orderId`
  - 설명: 단일 주문 상세 조회
  - 응답: `{ id, createdAt, status, totalAmount, items: [{ menuId, name, quantity, unitPrice, lineTotal, options: [{ id, name, priceDelta }] }] }`

- GET `/orders`
  - 설명: 관리자 주문 리스트 조회(상태/기간/페이지 필터)
  - 파라미터: `?status=PLACED|ACCEPTED|IN_PROGRESS|DONE&limit=20&cursor=...`
  - 응답: `{ items: [...], nextCursor }`

- PATCH `/orders/:orderId/status`
  - 설명: 주문 상태 전환
  - 요청: `{ status: 'ACCEPTED'|'IN_PROGRESS'|'DONE' }`
  - 규칙: 현재 상태에서 허용된 다음 상태만 승인. 위반 시 409.

- PATCH `/menus/:menuId/stock`
  - 설명: 관리자 재고 증감
  - 요청: `{ delta: number }` // + 증가, - 감소, 0~999 범위 유지
  - 응답: `{ menuId, stockQty }`

### 5.4 에러 코드/응답 예시
- 400 VALIDATION_ERROR: 잘못된 파라미터/스키마 불일치
- 404 NOT_FOUND: 메뉴/주문 없음
- 409 CONFLICT: 재고 부족, 잘못된 상태 전환
- 500 INTERNAL_ERROR: 서버 처리 실패

### 5.5 보안/운영
- CORS: FE 도메인 허용
- Rate Limit: 주문 생성/상태 변경 엔드포인트에 초당 제한 적용(개발 단계선 완화)
- 로깅: 주문 생성, 상태 변경, 재고 변경은 감사 로그 남김

### 5.6 마이그레이션 스크립트(초안)
PostgreSQL 예시
```
CREATE TABLE menus (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image_url TEXT,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE options (
  id SERIAL PRIMARY KEY,
  menu_id INTEGER REFERENCES menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'PLACED',
  total_amount INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  menu_id INTEGER REFERENCES menus(id),
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  line_total INTEGER NOT NULL
);

CREATE TABLE order_item_options (
  id SERIAL PRIMARY KEY,
  order_item_id INTEGER REFERENCES order_items(id) ON DELETE CASCADE,
  option_id INTEGER REFERENCES options(id),
  price_delta INTEGER NOT NULL
);
```
