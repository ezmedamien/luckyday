# 한국어 인증 시스템 설정 가이드

## 개요
이 가이드는 LuckyDay 로또 앱을 위한 한국어 현지화된 인증 시스템을 설정하는 방법을 안내합니다.

## 주요 기능

### 🔐 인증 방법
- **휴대폰 OTP 인증** - 한국 번호 (+82) 기본 지원
- **카카오 로그인** - 카카오 브랜드 컬러 및 아이콘
- **네이버 로그인** - 네이버 브랜드 컬러 및 아이콘
- **이메일/비밀번호** - 폴백 옵션

### 🎯 사용자 경험
- **게스트 플로우** - 번호 생성 후 저장 시 인증 모달 표시
- **진행형 온보딩** - 단계별 사용자 안내
- **자동 리다이렉트** - 인증 후 원래 작업으로 복귀

## 설정 단계

### 1. Supabase 프로젝트 설정

#### 1.1 인증 설정
1. Supabase 대시보드 → Authentication → Settings
2. **Site URL**: `http://localhost:3000` (개발용)
3. **Redirect URLs**: `http://localhost:3000/auth/callback`

#### 1.2 소셜 로그인 설정

**카카오 로그인:**
1. [Kakao Developers](https://developers.kakao.com/)에서 앱 생성
2. 플랫폼 → Web → 사이트 도메인 추가: `http://localhost:3000`
3. 카카오 로그인 → Redirect URI 추가: `http://localhost:3000/auth/callback`
4. Supabase → Authentication → Providers → Kakao 활성화
5. Client ID와 Client Secret 입력

**네이버 로그인:**
1. [Naver Developers](https://developers.naver.com/)에서 앱 생성
2. 서비스 URL: `http://localhost:3000`
3. Callback URL: `http://localhost:3000/auth/callback`
4. Supabase → Authentication → Providers → Naver 활성화
5. Client ID와 Client Secret 입력

#### 1.3 SMS 설정 (OTP용)
1. Supabase → Authentication → Settings → SMS Provider
2. Twilio 또는 다른 SMS 제공업체 설정
3. 한국 번호 (+82) 지원 확인

### 2. 데이터베이스 설정

#### 2.1 SQL 스크립트 실행
Supabase SQL Editor에서 다음 스크립트 실행:

```sql
-- Create the saved_combos table
CREATE TABLE IF NOT EXISTS saved_combos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numbers INTEGER[] NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  method TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_combos_user_id ON saved_combos(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_combos_saved_at ON saved_combos(saved_at);

-- Enable Row Level Security (RLS)
ALTER TABLE saved_combos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own saved combinations
CREATE POLICY "Users can view their own saved combinations" ON saved_combos
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own saved combinations
CREATE POLICY "Users can insert their own saved combinations" ON saved_combos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own saved combinations
CREATE POLICY "Users can update their own saved combinations" ON saved_combos
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own saved combinations
CREATE POLICY "Users can delete their own saved combinations" ON saved_combos
  FOR DELETE USING (auth.uid() = user_id);
```

### 3. 환경 변수 설정

`.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cqwwgxgewemzyddwvoxc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxd3dneGdld2VtenlkZHd2b3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDU2NzMsImV4cCI6MjA2OTc4MTY3M30.LpIa5Yh6YLM5Zt3yOEqWJwLh6t5pWDYaMmv5At4yWwY
```

### 4. 이메일 템플릿 설정 (선택사항)

Supabase → Authentication → Email Templates에서 다음 템플릿 커스터마이징:

**회원가입 확인:**
```
제목: LuckyDay 계정 확인
내용: 안녕하세요! LuckyDay 계정을 확인해주세요. 아래 링크를 클릭하여 계정을 활성화하세요.
```

**비밀번호 재설정:**
```
제목: LuckyDay 비밀번호 재설정
내용: 비밀번호 재설정 요청이 접수되었습니다. 아래 링크를 클릭하여 새 비밀번호를 설정하세요.
```

## 컴포넌트 구조

### 📁 파일 구조
```
src/
├── components/auth/
│   ├── AuthModal.tsx          # 메인 인증 모달
│   ├── PhoneAuthForm.tsx      # 휴대폰 OTP 인증
│   ├── SocialAuthButtons.tsx  # 소셜 로그인 버튼
│   ├── EmailAuthForm.tsx      # 이메일/비밀번호 인증
│   ├── ResetPasswordForm.tsx  # 비밀번호 재설정
│   └── UserMenu.tsx           # 사용자 메뉴
├── contexts/
│   └── AuthContext.tsx        # 인증 상태 관리
├── hooks/
│   └── useSavedCombos.ts      # 저장된 번호 관리
├── lib/
│   ├── supabase.ts            # Supabase 클라이언트
│   └── savedCombos.ts         # 데이터베이스 작업
└── app/
    └── auth/callback/
        └── route.ts           # OAuth 콜백 처리
```

### 🎨 디자인 시스템

**색상:**
- Primary: Lotto Red `#E60012`
- Header: Navy `#1A237E`
- Background: White `#FFFFFF`

**타이포그래피:**
- Font: Pretendard
- 크기: 반응형 (모바일 우선)

**버튼 스타일:**
- Border Radius: `rounded-2xl`
- Shadow: `shadow-md`
- Padding: `p-4`

## 테스트 가이드

### 1. 로컬 개발 환경
```bash
npm run dev
```

### 2. 기능 테스트 체크리스트

#### 휴대폰 OTP 인증
- [ ] 한국 번호 (+82) 자동 추가
- [ ] 번호 형식 자동 포맷팅 (010-1234-5678)
- [ ] OTP 전송 및 확인
- [ ] 재전송 기능

#### 소셜 로그인
- [ ] 카카오 로그인 버튼 (노란색)
- [ ] 네이버 로그인 버튼 (초록색)
- [ ] OAuth 콜백 처리
- [ ] 사용자 정보 가져오기

#### 이메일 인증
- [ ] 이메일 형식 검증
- [ ] 비밀번호 길이 검증 (최소 6자)
- [ ] 로그인/회원가입 토글
- [ ] 비밀번호 재설정

#### 게스트 플로우
- [ ] 번호 생성 (게스트 가능)
- [ ] 저장 시도 시 인증 모달 표시
- [ ] 인증 후 원래 작업으로 복귀

### 3. 보안 테스트
- [ ] RLS 정책 확인 (다른 사용자 데이터 접근 불가)
- [ ] 세션 관리
- [ ] CSRF 보호
- [ ] 입력 검증

## 문제 해결

### 일반적인 문제

#### 1. OAuth 콜백 오류
```
문제: 소셜 로그인 후 리다이렉트 실패
해결: Supabase Redirect URLs 설정 확인
```

#### 2. SMS 전송 실패
```
문제: OTP 전송이 안됨
해결: Twilio 설정 및 한국 번호 지원 확인
```

#### 3. RLS 정책 오류
```
문제: 저장된 번호에 접근할 수 없음
해결: SQL 스크립트 재실행 및 정책 확인
```

### 디버깅 팁

1. **브라우저 콘솔** 확인
2. **Supabase 로그** 확인
3. **네트워크 탭**에서 요청/응답 확인
4. **환경 변수** 올바른지 확인

## 성능 최적화

### 1. 번들 크기 최적화
- Tree shaking 활용
- 동적 임포트 사용

### 2. 캐싱 전략
- 사용자 세션 캐싱
- 저장된 번호 캐싱

### 3. 로딩 상태
- 스피너 애니메이션
- 스켈레톤 로딩

## 배포 고려사항

### 1. 프로덕션 환경
- HTTPS 필수
- 환경 변수 설정
- 도메인 설정

### 2. 모니터링
- 에러 추적
- 사용자 행동 분석
- 성능 모니터링

## 다음 단계

### 향후 개선사항
1. **프로필 관리** - 사용자 정보 수정
2. **알림 시스템** - 당첨 번호 알림
3. **통계 대시보드** - 개인 통계
4. **소셜 기능** - 친구와 공유

### 확장 가능성
1. **다국어 지원** - 영어 등 추가 언어
2. **다크 모드** - 테마 지원
3. **PWA** - 앱 설치 가능
4. **오프라인 지원** - 캐싱 기능

---

이 가이드를 따라하면 완전한 한국어 현지화된 인증 시스템을 구축할 수 있습니다. 문제가 발생하면 위의 문제 해결 섹션을 참조하세요. 