export type Language = 'ko' | 'en';

export interface Translations {
  title: string;
  subtitle: string;
  chooseMethod: string;
  basicMethods: string;
  frequencyBased: string;
  patternAnalysis: string;
  constraintFilters: string;
  advancedAlgorithms: string;
  configuration: string;
  yourBirthday: string;
  yourZodiacSign: string;
  selectYourSign: string;
  noConfigNeeded: string;
  generate: string;
  generating: string;
  yourLuckyNumbers: string;
  generatedUsing: string;
  sum: string;
  odd: string;
  even: string;
  showAdvanced: string;
  hideAdvanced: string;
  historicalDataLoaded: string;
  loadingHistoricalData: string;
  loading: string;
  selected: string;
  autoFill: string;
  positions: string;
  selectNumbersForPositions: string;
  chooseNumbersForPositions: string;
  position: string;
  autoFillMethod: string;
  error: string;
  methodDescriptions: Record<string, string>;
  disclaimer: {
    title: string;
    fun: string;
    noResponsibility: string;
    individualRisk: string;
    excessiveWarning: string;
    entertainment: string;
  };
}

export const translations: Record<Language, Translations> = {
  ko: {
    title: "럭키데이",
    subtitle: "고급 복권 번호 생성기",
    chooseMethod: "생성 방법 선택",
    basicMethods: "기본 방법",
    frequencyBased: "빈도 기반",
    patternAnalysis: "패턴 분석",
    constraintFilters: "제약 필터",
    advancedAlgorithms: "고급 알고리즘",
    configuration: "설정",
    yourBirthday: "생년월일",
    yourZodiacSign: "별자리",
    selectYourSign: "별자리를 선택하세요",
    noConfigNeeded: "이 방법에는 추가 설정이 필요하지 않습니다.",
    generate: "생성",
    generating: "생성 중...",
    yourLuckyNumbers: "당신의 행운 번호",
    generatedUsing: "사용된 방법",
    sum: "합계",
    odd: "홀수",
    even: "짝수",
    showAdvanced: "고급 방법 보기",
    hideAdvanced: "고급 방법 숨기기",
    historicalDataLoaded: "역사적 데이터 로드됨",
    loadingHistoricalData: "복권 데이터 로딩 중...",
    loading: "로딩 중",
    selected: "선택됨",
    autoFill: "자동 채움",
    positions: "위치",
    selectNumbersForPositions: "특정 위치의 번호 선택",
    chooseNumbersForPositions: "제어하고 싶은 위치의 번호를 선택하세요. 자동 채움을 위해 위치를 비워두세요.",
    position: "위치",
    autoFillMethod: "자동 채움 방법",
    error: "오류",
    methodDescriptions: {
      random: "순수 랜덤 번호",
      birthday: "생년월일에서 유도",
      zodiac: "별자리 기반",
      windowHot: "최근 빈도 가중치",
      hotColdHybrid: "3개 최고 + 3개 최저",
      expectedGap: "20% 초과된 번호",
      hotPairs: "자주 함께 나타나는 쌍",
      hotTriplets: "자주 함께 나타나는 삼중",
      deltaSystem: "일반적인 번호 간격 패턴",
      positionalFreq: "위치 기반 빈도",
      oddEvenBalanced: "3개 홀수 + 3개 짝수",
      sumInRange: "100-200 사이의 합계",
      zoneBalanced: "각 구역에서 1개씩 (1-15, 16-30, 31-45)",
      markovChain: "1단계 전환 확률",
      gboostModel: "ML 기반 예측 모델",
      positionalSelect: "특정 위치의 번호 선택"
    },
    disclaimer: {
      title: "복권 구매 시 주의사항",
      fun: "복권은 즐거움을 주는 데 도움이 될 수 있습니다.",
      noResponsibility: "복권 구매는 개인의 책임입니다.",
      individualRisk: "복권 구매는 개인의 위험을 수반합니다.",
      excessiveWarning: "과도한 복권 구매는 개인의 재산과 가족의 행복을 위협할 수 있습니다.",
      entertainment: "복권은 주로 즐거움을 위한 것입니다."
    }
  },
  en: {
    title: "LuckyDay",
    subtitle: "Advanced lottery number generators",
    chooseMethod: "Choose Generation Method",
    basicMethods: "Basic Methods",
    frequencyBased: "Frequency-Based",
    patternAnalysis: "Pattern Analysis",
    constraintFilters: "Constraint Filters",
    advancedAlgorithms: "Advanced Algorithms",
    configuration: "Configuration",
    yourBirthday: "Your Birthday",
    yourZodiacSign: "Your Zodiac Sign",
    selectYourSign: "Select your sign",
    noConfigNeeded: "No additional configuration needed for this method.",
    generate: "Generate",
    generating: "Generating...",
    yourLuckyNumbers: "Your Lucky Numbers",
    generatedUsing: "Generated using",
    sum: "Sum",
    odd: "Odd",
    even: "Even",
    showAdvanced: "Show Advanced Methods",
    hideAdvanced: "Hide Advanced Methods",
    historicalDataLoaded: "Historical data loaded",
    loadingHistoricalData: "Loading lottery data...",
    loading: "Loading",
    selected: "Selected",
    autoFill: "Auto-fill",
    positions: "positions",
    selectNumbersForPositions: "Select Numbers for Specific Positions",
    chooseNumbersForPositions: "Choose numbers for positions you want to control. Leave positions empty for auto-fill.",
    position: "Position",
    autoFillMethod: "Auto-fill Method",
    error: "Error",
    methodDescriptions: {
      random: "Pure random numbers",
      birthday: "Derived from birthday",
      zodiac: "Based on zodiac sign",
      windowHot: "Recent frequency weighted",
      hotColdHybrid: "3 hottest + 3 coldest",
      expectedGap: "Numbers overdue by 20%",
      hotPairs: "Frequently co-occurring pairs",
      hotTriplets: "Frequently co-occurring triplets",
      deltaSystem: "Common number spacing patterns",
      positionalFreq: "Position-based frequency",
      oddEvenBalanced: "3 odd + 3 even numbers",
      sumInRange: "Sum between 100-200",
      zoneBalanced: "1 number from each zone (1-15, 16-30, 31-45)",
      markovChain: "1-step transition probabilities",
      gboostModel: "ML-based prediction model",
      positionalSelect: "Choose numbers for specific positions"
    },
    disclaimer: {
      title: "Lottery Purchase Disclaimers",
      fun: "Lotteries can be fun.",
      noResponsibility: "Lottery purchases are your responsibility.",
      individualRisk: "Lottery purchases involve individual risk.",
      excessiveWarning: "Excessive lottery purchases can threaten personal property and family happiness.",
      entertainment: "Lotteries are primarily for entertainment."
    }
  }
}; 