export interface BalanceQuizItem {
  id: number;
  category: '교과서 사례' | '일상 사례';
  scenario: string;
  isPolitics: boolean; // true = 정치다 (O), false = 정치가 아니다 (X)
  politicsType: '좁은 의미의 정치' | '넓은 의미의 정치' | '정치가 아님';
  explanation: string;
  detailReason: string;
}

export const BALANCE_QUIZ_ITEMS: BalanceQuizItem[] = [
  {
    id: 1,
    category: '교과서 사례',
    scenario: '우리 동네 국회의원 후보가 시장에서 시민들에게 선거 유세를 하고 있다.',
    isPolitics: true,
    politicsType: '좁은 의미의 정치',
    explanation: '정치다 (O) (좁은 의미의 정치)',
    detailReason: '국회의원 선거에 출마하여 국가의 정치권력을 획득하고 법률 제정 등의 통치 기능을 수행하려는 활동이므로 좁은 의미의 정치에 해당합니다.',
  },
  {
    id: 2,
    category: '교과서 사례',
    scenario: '오늘 집에 가서 밀린 수학 숙제를 먼저 하기로 혼자 마음먹었다.',
    isPolitics: false,
    politicsType: '정치가 아님',
    explanation: '정치가 아니다 (X) (개인의 사적인 결정)',
    detailReason: '타인과의 의견 대립이나 갈등 조정 과정이 전혀 없이 스스로 결정하여 행동하는 순수한 개인의 사적 선택이므로 정치가 아닙니다.',
  },
  {
    id: 3,
    category: '교과서 사례',
    scenario: '체육대회 때 우리 반이 입을 반티 색깔을 정하기 위해 학급 회의를 열었다.',
    isPolitics: true,
    politicsType: '넓은 의미의 정치',
    explanation: '정치다 (O) (넓은 의미의 정치)',
    detailReason: '학급이라는 사회 집단 안에서 구성원들의 상반된 의견과 갈등을 대화와 토론을 통해 조정하고 합의점을 찾아가는 넓은 의미의 정치 활동입니다.',
  },
  {
    id: 4,
    category: '교과서 사례',
    scenario: '주말 가족 여행을 산으로 갈지 바다로 갈지 거실에 모여 가족회의를 했다.',
    isPolitics: true,
    politicsType: '넓은 의미의 정치',
    explanation: '정치다 (O) (넓은 의미의 정치)',
    detailReason: '가족이라는 일상 공동체에서 서로 다른 의견을 조율하고 합의를 이끌어 내어 공동의 문제를 해결하는 넓은 의미의 정치에 해당합니다.',
  },
  {
    id: 5,
    category: '교과서 사례',
    scenario: '교내 음료수 자판기 설치 문제를 두고 학생 대표, 선생님, 학부모가 모여 식수대를 늘리기로 합의했다.',
    isPolitics: true,
    politicsType: '넓은 의미의 정치',
    explanation: '정치다 (O) (넓은 의미의 정치)',
    detailReason: '학교 구성원(학생, 교사, 학부모) 간의 이해관계 대립과 갈등을 대화와 타협을 통해 평화롭게 조정하여 합의를 도출한 전형적인 넓은 의미의 정치 사례입니다.',
  },
  {
    id: 6,
    category: '일상 사례',
    scenario: '점심시간에 매점에 가서 초코우유를 먹을지 딸기우유를 먹을지 혼자 진지하게 고민했다.',
    isPolitics: false,
    politicsType: '정치가 아님',
    explanation: '정치가 아니다 (X) (다른 사람과의 갈등/조정이 없는 개인의 선택)',
    detailReason: '다른 사람과의 대립이나 의견 차이를 조정하는 과정이 전혀 없이 혼자서 기호에 따라 물건을 고르는 단순한 개인의 소비 선택입니다.',
  },
  {
    id: 7,
    category: '교과서 사례',
    scenario: '대통령과 국무위원들이 국무회의에 모여 국가의 중요한 정책을 논의했다.',
    isPolitics: true,
    politicsType: '좁은 의미의 정치',
    explanation: '정치다 (O) (좁은 의미의 정치)',
    detailReason: '대통령, 국무총리 등 최고 국가 통치기관이 헌법과 법률에 따라 정치권력을 행사하며 국가의 주요 정책을 심의·결정하는 활동은 좁은 의미의 정치입니다.',
  },
  {
    id: 8,
    category: '일상 사례',
    scenario: '모둠 수행평가에서 발표자와 자료 조사자를 누구로 할지 모둠원들과 가위바위보와 대화로 정했다.',
    isPolitics: true,
    politicsType: '넓은 의미의 정치',
    explanation: '정치다 (O) (넓은 의미의 정치 - 역할 분담 및 갈등 조정)',
    detailReason: '모둠이라는 소집단에서 구성원들의 선호와 갈등을 대화와 규칙(가위바위보 등)으로 평화롭게 조율하고 역할을 분담하는 넓은 의미의 정치입니다.',
  },
  {
    id: 9,
    category: '일상 사례',
    scenario: '아파트 단지 내 층간 소음과 쓰레기 배출 문제를 해결하기 위해 주민 대표 회의를 열었다.',
    isPolitics: true,
    politicsType: '넓은 의미의 정치',
    explanation: '정치다 (O) (넓은 의미의 정치)',
    detailReason: '지역 주민 공동체에서 발생하는 대립과 갈등을 주민들이 자율적으로 모여 회의하고 규칙을 마련하여 조정하는 넓은 의미의 정치입니다.',
  },
  {
    id: 10,
    category: '일상 사례',
    scenario: '방과 후에 집에 돌아와 내 방 책상 위를 깨끗하게 정리 정돈했다.',
    isPolitics: false,
    politicsType: '정치가 아님',
    explanation: '정치가 아니다 (X) (개인의 생활 습관)',
    detailReason: '공동체나 타인과의 상호작용 및 갈등 해결이 수반되지 않는 개인의 사적인 생활 습관 및 일상 행동이므로 정치가 아닙니다.',
  },
];

export interface HalloweenCandy {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  color: string;
}

export const HALLOWEEN_CANDIES: HalloweenCandy[] = [
  {
    id: 'pumpkin',
    name: '호박 달콤 캔디',
    emoji: '🎃',
    desc: '민주주의 지혜가 담긴 호박 캔디!',
    color: 'from-amber-400 to-orange-500',
  },
  {
    id: 'lollipop',
    name: '무지개 회오리 롤리팝',
    emoji: '🍭',
    desc: '3연속 정답 축하 달콤 롤리팝!',
    color: 'from-pink-400 to-rose-500',
  },
  {
    id: 'ghost',
    name: '꼬마 유령 마시멜로',
    emoji: '👻',
    desc: '갈등을 녹여버리는 부드러운 유령 마시멜로!',
    color: 'from-indigo-400 to-purple-500',
  },
  {
    id: 'candy',
    name: '할로윈 마법 캔디',
    emoji: '🍬',
    desc: '정치 개념을 마스터한 기념 마법 캔디!',
    color: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'bat',
    name: '박쥐 포도 젤리',
    emoji: '🦇',
    desc: '정확한 판단력을 주는 상큼한 박쥐 젤리!',
    color: 'from-violet-500 to-purple-700',
  },
];
