# Coffee Order App: 커피 주문 및 관리 시스템

## 프로젝트 소개

커피 주문 앱은 사용자가 커피 메뉴를 주문하고, 관리자가 주문을 관리할 수 있는 풀스택 웹 애플리케이션입니다.<br> React와 Node.js를 기반으로 구축되었으며, 실시간 주문 처리와 재고 관리 기능을 제공합니다.

### 주요 기능
- 🍽️ **메뉴 주문**: 아메리카노, 카페라떼 등 커피 메뉴 주문
- ⚙️ **옵션 선택**: 샷 추가, 시럽 추가 등 커스터마이징
- 🛒 **장바구니**: 여러 메뉴를 담고 수량 조절
- 📊 **관리자 기능**: 주문 상태 관리, 재고 관리
- 📱 **반응형 디자인**: 모바일과 데스크톱 모두 지원

## 개발 환경 및 기술 스택

### Frontend
- **React 19.1.1** - 사용자 인터페이스
- **Vite 7.1.7** - 빌드 도구 및 개발 서버
- **React Router DOM 7.9.4** - 클라이언트 사이드 라우팅
- **Vitest** - 테스트 프레임워크

### Backend
- **Node.js** - 서버 런타임
- **Express 5.1.0** - 웹 프레임워크
- **Prisma 6.17.1** - ORM (Object-Relational Mapping)
- **PostgreSQL** - 데이터베이스

### 개발 도구
- **Nodemon** - 개발 시 서버 자동 재시작

## 프로젝트 구성

```
ProjectApp/
├── server/                 # 백엔드 서버
│   ├── src/
│   │   ├── index.js       # Express 서버 메인 파일
│   │   └── db.js          # Prisma 클라이언트 설정
│   ├── prisma/
│   │   ├── schema.prisma  # 데이터베이스 스키마
│   │   └── seed.js       # 초기 데이터 생성
│   └── package.json
├── ui/                    # 프론트엔드
│   ├── src/
│   │   ├── pages/        # 페이지 컴포넌트
│   │   │   ├── OrderPage.jsx    # 주문 페이지
│   │   │   └── AdminPage.jsx   # 관리자 페이지
│   │   ├── services/
│   │   │   └── api.js    # API 서비스
│   │   └── App.jsx       # 메인 앱 컴포넌트
│   └── package.json
├── docs/                  # 문서
│   └── PRD.md            # 프로젝트 요구사항 정의서
└── img/                   # 이미지 리소스
```

## 사용 방법

### 1. 개발 환경 설정

#### 필수 요구사항
- Node.js (v18 이상)
- PostgreSQL
- Git

#### 데이터베이스 설정
```bash
# PostgreSQL 데이터베이스 생성
createdb coffee_order_db

# 환경변수 설정
cd server
cp .env.example .env
# .env 파일에서 DATABASE_URL 설정
```

#### 프로젝트 설치 및 실행

```bash
# 저장소 클론
git clone <repository-url>
cd ProjectApp

# 백엔드 설정
cd server
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev

# 프론트엔드 설정 (새 터미널)
cd ui
npm install
npm run dev
```

### 2. 배포 (Render.com)

#### 데이터베이스 배포
1. Render.com에서 PostgreSQL 데이터베이스 생성
2. 연결 문자열을 환경변수로 설정

#### 백엔드 배포
1. Web Service 생성
2. Root Directory: `server`
3. Build Command: `npm install && npx prisma generate && npx prisma db push`
4. Start Command: `npm start`

#### 프론트엔드 배포
1. Static Site 생성
2. Root Directory: `ui`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. 환경변수: `VITE_API_BASE_URL=https://your-backend-url.com`

## 파일 설명

### Backend (`server/`)
- **`src/index.js`**: Express 서버 메인 파일, API 라우트 정의
- **`prisma/schema.prisma`**: 데이터베이스 스키마 정의
- **`prisma/seed.js`**: 초기 데이터 생성 스크립트

### Frontend (`ui/`)
- **`src/pages/OrderPage.jsx`**: 주문 페이지, 메뉴 선택 및 장바구니
- **`src/pages/AdminPage.jsx`**: 관리자 페이지, 주문 및 재고 관리
- **`src/services/api.js`**: 백엔드 API 호출 서비스

### Database Schema
- **Menu**: 메뉴 정보 (이름, 가격, 재고)
- **Option**: 메뉴 옵션 (샷 추가, 시럽 추가)
- **Order**: 주문 정보
- **OrderItem**: 주문 항목
- **OrderItemOption**: 주문 항목의 옵션

## 프로젝트 버전

- **현재 버전**: 1.0.0
- **React**: 19.1.1
- **Node.js**: 18+
- **PostgreSQL**: 14+

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 LICENSE 파일을 참조하세요.

---
**GitHub**: [mixedsider](https://github.com/mixedsider)
