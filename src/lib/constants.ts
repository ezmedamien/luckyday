// Generator method configurations
export const GENERATOR_METHODS = [
  {
    id: 'random',
    label: '랜덤',
    description: '1~45 중 6개를 무작위로 선택합니다.'
  },
  {
    id: 'frequency',
    label: '빈도 가중',
    description: '최근 100회차에서 자주 나온 번호일수록 더 잘 뽑힙니다.'
  },
  {
    id: 'hotcold',
    label: '핫-콜드 밸런스',
    description: '최근 100회차에서 가장 많이/적게 나온 번호 3개씩 조합.'
  },
  {
    id: 'sumrange',
    label: '합계 범위',
    description: '6개 합이 100~170 사이가 될 때까지 생성합니다.'
  },
  {
    id: 'cooccur',
    label: '동시출현',
    description: '최근 100회차에서 자주 같이 나온 2~3개 번호로 시작.'
  },
  {
    id: 'personal',
    label: '오늘의 맞춤번호',
    description: '띠 또는 생년월일로 오늘의 고정된 행운 번호를 생성합니다.'
  },
  {
    id: 'semi',
    label: '반자동',
    description: '직접 고른 번호와 나머지는 랜덤으로 조합합니다.'
  },
  {
    id: 'smartblend',
    label: 'AI 추첨기',
    description: 'AI가 추천하는 최적 번호 조합'
  },
] as const;

// Static data arrays
export const ZODIAC_LIST = [
  '쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'
] as const;

export const YEAR_LIST = Array.from({ length: 100 }, (_, i) => 2025 - i); // 1925~2025
export const MONTH_LIST = Array.from({ length: 12 }, (_, i) => i + 1);
export const DAY_LIST = Array.from({ length: 31 }, (_, i) => i + 1);

// Lottery configuration
export const LOTTO_CONFIG = {
  MAX_NUMBER: 45,
  TICKET_SIZE: 6,
  SUM_RANGE_MIN: 100,
  SUM_RANGE_MAX: 170,
  LOOKBACK_WINDOW: 100,
  MAX_GENERATION_ATTEMPTS: 50
} as const;

// UI configuration
export const UI_CONFIG = {
  PROGRESS_TIMEOUT: 300,
  COMPLETION_DISPLAY_TIME: 1000,
  DROPDOWN_MAX_ITEMS: 15,
  TOOLTIP_DELAY: 120
} as const;

// Risk level configuration
export const RISK_LEVELS = {
  SAFE: 0,
  BALANCED: 1,
  AGGRESSIVE: 2
} as const;

export const RISK_LEVEL_NAMES = {
  [RISK_LEVELS.SAFE]: '안심',
  [RISK_LEVELS.BALANCED]: '균형',
  [RISK_LEVELS.AGGRESSIVE]: '공격'
} as const; 