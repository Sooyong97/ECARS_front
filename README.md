#  신고 자동화 시스템 (Django -> SpringBoot)

##  1. 프로젝트 목표

현행 119 긴급신고 체계는 폭주 상황에서 대기와 지연 문제가 발생할 수 있으며, 수많은 비출동 신고로 인해 자원 낭비가 발생합니다. 본 프로젝트는 이러한 문제를 해결하기 위해 **AI 기반 신고 자동화 시스템**을 개발하였습니다. 


`여기서는 Django로 개발된 백엔드 시스템을 Spring Boot로 Migration하는 과정에서 프론트의 api주소 및 Header값 등 여러 변경 사항을 다뤘습니다.`

- **중복 신고 자동 식별 및 처리**
- **STT → AI 분석 → 신고 분류 자동화**
- **구급/비구급 상황 자동 분류**
- **GPT 기반 필수 정보 검출 및 주소 추정**
- **관리자 페이지를 통한 효율적 신고 대응**

---

##  2. 기술 스택 및 구조

###  사용 기술

- **Backend**: Java 17, Spring Boot 3.x, Spring Security, JPA, MySQL
- **Frontend**: React, Figma (디자인)
- **AI 모델**: KcELECTRA, GPT API (GPT-4o-mini), Web Speech API
- **음성처리**: Web Speech API (STT, TTS)
- **지도 API**: Kakao Map API

###  시스템 구조

```
[사용자 STT 신고] → [Spring Boot 서버] → 
[텍스트 분석 (AI)] → [중복 여부 판단, 분류] → 
[DB 저장] → [관리자 확인 및 메시지 전송]
```

---

##  3. API 명세서 (상세)

모든 API는 `application/json` 형식의 Body를 받으며, RESTful 방식으로 설계되었습니다.

###  인증 관련 API

####  회원가입
- **URL**: `POST /api/account/join`
- **Request Body**:
```json
{
  "email": "test@example.com",
  "password": "securePassword",
  "nickname": "신고자"
}
```
- **Response**: 성공 메시지 또는 에러

####  로그인
- **URL**: `POST /api/account/login`
- **Request Body**:
```json
{
  "email": "test@example.com",
  "password": "securePassword"
}
```
- **Response**: JWT 토큰

####  이메일 인증 요청
- **URL**: `POST /api/account/email-send`
- **Request Body**:
```json
{
  "email": "test@example.com"
}
```
- **Response**: 인증 번호 전송 상태

####  이메일 인증 확인
- **URL**: `POST /api/account/email-verify`
- **Request Body**:
```json
{
  "email": "test@example.com",
  "code": "123456"
}
```
- **Response**: 인증 성공 여부

---

###  신고 처리 관련 API

####  신고 등록
- **URL**: `POST /api/call-log`
- **Request Body**:
```json
{
  "audioUrl": "https://example.com/audio.wav",
  "summary": "호흡곤란 증상",
  "symptoms": ["호흡곤란", "가슴 통증"],
  "location": "서울시 강남구 테헤란로 123",
  "urgent": true
}
```
- **Response**: 저장된 신고 정보

####  신고 전체 조회
- **URL**: `GET /api/call-log`
- **Response**: 신고 리스트 배열

####  특정 신고 상세 조회
- **URL**: `GET /api/call-log/{id}`
- **Response**:
```json
{
  "id": 1,
  "summary": "호흡곤란",
  "location": "서울시 강남구",
  "symptoms": ["호흡곤란"],
  "urgent": true,
  "createdAt": "2024-03-30T13:00:00Z"
}
```

---

###  텍스트 분석 API

####  신고 텍스트 분석
- **URL**: `POST /api/text-analysis`
- **Request Body**:
```json
{
  "text": "건물 안에 연기가 가득 차고 기침을 멈출 수 없습니다"
}
```
- **Response**:
```json
{
  "category": "화재",
  "isEmergency": true,
  "extractedSymptoms": ["기침", "연기"]
}
```

---

###  공지사항 API

####  공지 작성
- **URL**: `POST /api/post`
- **Request Body**:
```json
{
  "title": "긴급 점검 공지",
  "content": "오늘 3시부터 서버 점검이 있습니다."
}
```

####  공지 전체 목록
- **URL**: `GET /api/post`

####  공지 상세 조회
- **URL**: `GET /api/post/{id}`

####  공지 수정
- **URL**: `PUT /api/post/{id}`
- **Request Body**:
```json
{
  "title": "점검 완료",
  "content": "서버 점검이 완료되었습니다."
}
```

####  공지 삭제
- **URL**: `DELETE /api/post/{id}`

---

##  4. 결과 및 기대효과

###  주요 성과
- **KcELECTRA 기반 모델 F1 score: 0.956**
- **16종 상황 분류 및 구급/비구급 정확 분류**
- **중복신고 자동 필터링**
- **신고자와 관리자 양방향 음성 인터페이스 구현**

###  기대효과
- 국민 의료비 절감 (출동 지연 방지)
- 신고 처리 자동화로 인한 **신속한 출동 및 골든타임 확보**
- 관리자 페이지 통한 **일관된 응급 대응 및 효율적 인력 배치**
