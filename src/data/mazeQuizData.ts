export interface MazeQuestion {
  id: number;
  type: 'binary' | 'multiple';
  title: string;
  category: '정치 형태' | '생활양식';
  question: string;
  passage?: string;
  options: string[];
  correctAnswer: number; // 1-indexed
  explanation: string;
  conceptSummary: string;
}

export interface CharacterInfo {
  id: 'cat' | 'dog' | 'shark';
  name: string;
  koreanName: string;
  title: string;
  emoji: string;
  snackEmoji: string;
  snackName: string;
  badgeColor: string;
  bgColor: string;
  borderColor: string;
  tagline: string;
  speed: string;
  forestPerk: string;
  dialogueWaiting: string;
  cheerCorrect: string;
  cheerIncorrect: string;
}

export const CHARACTERS: CharacterInfo[] = [
  {
    id: 'cat',
    name: '야옹이',
    koreanName: '고양이',
    title: '호기심 만발 날렵한 숲속 냥이',
    emoji: '🐱',
    snackEmoji: '🐟',
    snackName: '옹달샘 물고기',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    bgColor: 'from-rose-500 to-pink-600',
    borderColor: 'border-rose-400',
    tagline: '조용하고 날렵하게 숲속 덤불을 누비는 탐험 대장!',
    speed: '매우 민첩함',
    forestPerk: '덤불 사이 오솔길을 예리하게 감지함',
    dialogueWaiting: '야옹~ 이 문제는 국가 통치 방식일까, 일상 속 민주적 태도일까냥?',
    cheerCorrect: '야옹~! 역시 대단해냥! 완벽한 민주주의 개념 정답이다냥! 🐾✨',
    cheerIncorrect: '골골... 아쉽다냥! 아래 해설을 꼼꼼히 읽고 개념을 꼭 챙기자냥! 💡'
  },
  {
    id: 'dog',
    name: '댕댕이',
    koreanName: '강아지',
    title: '열정 가득 명랑한 숲속 멍멍이',
    emoji: '🐶',
    snackEmoji: '🦴',
    snackName: '황금 보물 뼈다귀',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    bgColor: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-400',
    tagline: '지치지 않는 체력과 꼬리 흔들기로 미로를 돌파하는 모험가!',
    speed: '활력 넘침',
    forestPerk: '낙엽 속에 숨겨진 보물과 힌트를 잘 찾아냄',
    dialogueWaiting: '멍멍! 보기를 차근차근 비교해보면 정답이 보여 멍!',
    cheerCorrect: '멍멍! 신난다 멍! 꼬리가 저절로 흔들리는 완벽한 정답! 🦴🎉',
    cheerIncorrect: '낑낑... 괜찮아 멍! 해설을 확인하면 다음 문제는 반드시 맞힐 수 있어! 🐾'
  },
  {
    id: 'shark',
    name: '샤키',
    koreanName: '상어',
    title: '용감무쌍 시원한 숲속 꼬마상어',
    emoji: '🦈',
    snackEmoji: '⭐',
    snackName: '마법 반짝 불가사리',
    badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    bgColor: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-400',
    tagline: '거침없는 지느러미 파워로 미로의 덤불벽을 헤쳐나가는 탐험가!',
    speed: '직진 본능',
    forestPerk: '신비의 숲속 시냇물을 따라 거침없이 질주함',
    dialogueWaiting: '샤악~! 국민 주권과 일상생활의 차이를 집중해서 구별해보자!',
    cheerCorrect: '샤악~! 거침없는 정답 돌파! 바다와 숲의 지혜를 모두 얻었어! 🌊⚡',
    cheerIncorrect: '어푸푸! 파도에 살짝 흔들렸을 뿐이야! 해설을 읽고 다시 전진하자! 🧭'
  }
];

export const MAZE_QUESTIONS: MazeQuestion[] = [
  {
    id: 1,
    type: 'binary',
    title: '통치 방식으로서의 민주주의',
    category: '정치 형태',
    question: '다음 설명이 가리키는 민주주의의 의미로 가장 적절한 것은?',
    passage: '"모든 국민이 국가의 주인으로서 권리를 갖고 나라를 다스리는 통치 방식"',
    options: ['정치 형태로서의 민주주의', '생활양식으로서의 민주주의'],
    correctAnswer: 1,
    explanation:
      '국민이 주권을 바탕으로 나라를 다스리는 국가의 통치 구조와 의사 결정 체계는 \'정치 형태로서의 민주주의\'입니다.',
    conceptSummary: '정치 형태로서의 민주주의 = 국민 주권과 국가 통치 구조(대의제, 선거, 헌법 등)'
  },
  {
    id: 2,
    type: 'multiple',
    title: '생활 속 민주주의 사례 찾기',
    category: '생활양식',
    question: '다음 중 \'생활양식으로서의 민주주의\'에 해당하는 사례로 가장 적절한 것은?',
    options: [
      '대통령 선거에 참여하여 투표권을 행사한다.',
      '국회에서 국회의원들이 법률안을 심의하고 의결한다.',
      '학급 회의에서 토론을 거쳐 학급 생활 규칙을 결정한다.',
      '중앙선거관리위원회가 선거 과정을 공정하게 관리한다.'
    ],
    correctAnswer: 3,
    explanation:
      '학급 회의에서 학생들이 토론과 대화를 통해 규칙을 정하는 것은 일상생활 속에서 문제를 민주적으로 해결하는 \'생활양식으로서의 민주주의\'입니다. ①, ②, ④는 국가 기관 및 국가 통치 제도인 \'정치 형태로서의 민주주의\'입니다.',
    conceptSummary: '생활양식 = 학교, 가정, 동아리 등 일상 공동체에서 대화와 타협으로 문제 해결'
  },
  {
    id: 3,
    type: 'binary',
    title: '갈등 해결 태도와 삶의 방식',
    category: '생활양식',
    question: '다음 설명에 해당하는 민주주의의 측면은 무엇인가요?',
    passage:
      '"가정, 학교, 지역사회 등 일상생활에서 발생하는 대립과 갈등을 관용, 비판, 타협의 태도로 해결하려는 삶의 방식"',
    options: ['정치 형태로서의 민주주의', '생활양식으로서의 민주주의'],
    correctAnswer: 2,
    explanation:
      '관용과 비판적 사고, 양보와 타협을 통해 일상 속 갈등을 평화롭게 풀어나가는 태도와 행동 원리는 \'생활양식으로서의 민주주의\'입니다.',
    conceptSummary: '민주적 생활 태도 = 관용, 양보, 타협, 상대방 존중, 대화'
  },
  {
    id: 4,
    type: 'multiple',
    title: '정치 형태로서의 민주주의 사례',
    category: '정치 형태',
    question: '다음 사례 중 \'정치 형태로서의 민주주의\'에 해당하는 것은?',
    options: [
      '가족회의를 열어 주말 여행지를 다수결로 정한다.',
      '헌법에 국민 주권을 명시하고 대표를 뽑아 국정을 맡긴다.',
      '동아리 부원들이 축제 부스 운영 예산 배분을 협의한다.',
      '아파트 주민들이 모여 층간 소음 예방 자율 규칙을 만든다.'
    ],
    correctAnswer: 2,
    explanation:
      '헌법에 국민 주권을 규정하고 선거로 대표자를 선출하여 국정을 운영하는 대의제는 국가의 통치 체계인 \'정치 형태로서의 민주주의\'입니다. ①, ③, ④는 가정·동아리·마을의 일상적 생활양식입니다.',
    conceptSummary: '정치 형태 = 헌법, 대의 민주제, 국민 투표, 국가 운영'
  },
  {
    id: 5,
    type: 'multiple',
    title: '민주주의 두 의미 구분 오류 찾기',
    category: '정치 형태',
    question: '다음 중 민주주의의 두 가지 의미를 옳게 연결하지 못한 것은?',
    options: [
      '국회의원 선거 실시 — 정치 형태로서의 민주주의',
      '동네 반상회에서 쓰레기 배출 시간 협의 — 생활양식으로서의 민주주의',
      '국민 투표를 통한 국가 중대 사안 결정 — 정치 형태로서의 민주주의',
      '친구들끼리 모여 조별 과제 역할 분담 조율 — 정치 형태로서의 민주주의'
    ],
    correctAnswer: 4,
    explanation:
      '친구들끼리 조별 과제의 역할을 대화로 분담하고 조율하는 활동은 학교 일상생활의 문제 해결이므로 \'생활양식으로서의 민주주의\'에 해당합니다. 따라서 잘못 짝지어진 것은 ④번입니다.',
    conceptSummary: '조별 과제 조율, 친구 간 갈등 해결 = 생활양식으로서의 민주주의'
  },
  {
    id: 6,
    type: 'multiple',
    title: '제시문 속 개념 순서 짝짓기',
    category: '정치 형태',
    question: '다음 제시문의 (가), (나)에 들어갈 민주주의의 의미를 순서대로 바르게 짝지은 것은?',
    passage:
      '(가) 국민이 직접 또는 간접적으로 국가의 중요한 정책 결정에 참여하여 국민의 뜻을 반영하는 ( ㉠ )\n(나) 일상생활의 여러 문제를 구성원들이 직접 대화와 타협으로 해결하여 주인으로서의 삶을 누리는 ( ㉡ )',
    options: [
      '㉠ 정치 형태로서의 민주주의 — ㉡ 생활양식으로서의 민주주의',
      '㉠ 생활양식으로서의 민주주의 — ㉡ 정치 형태로서의 민주주의',
      '㉠ 좁은 의미의 정치 — ㉡ 넓은 의미의 정치',
      '㉠ 직접 민주주의 — ㉡ 간접 민주주의'
    ],
    correctAnswer: 1,
    explanation:
      '(가)는 국가 정책 결정과 관련된 \'정치 형태로서의 민주주의\'이며, (나)는 일상생활의 대화와 타협 실천인 \'생활양식으로서의 민주주의\'입니다.',
    conceptSummary: '(가) 국가 정책 참여 = 정치 형태 / (나) 일상 대화와 타협 = 생활양식'
  },
  {
    id: 7,
    type: 'multiple',
    title: '대화 속에 담긴 민주주의 실천',
    category: '생활양식',
    question: '다음 학교생활 대화에서 학생들이 실천하고 있는 민주주의의 의미로 가장 적절한 것은?',
    passage:
      '민우: "이번 축제 부스 테마를 귀신의 집으로 할지, 카페로 할지 의견이 갈려."\n수아: "각자 장단점을 차례대로 이야기해 보고, 서로 한 걸음씩 양보해서 낮에는 카페, 저녁엔 귀신의 집으로 합의해 보자!"',
    options: [
      '정치 형태로서의 민주주의',
      '생활양식으로서의 민주주의',
      '대의제 민주주의',
      '권력 분립으로서의 민주주의'
    ],
    correctAnswer: 2,
    explanation:
      '학교 축제 준비 과정에서 서로의 의견을 경청하고 양보와 타협을 통해 원만하게 합의점을 찾는 실천은 \'생활양식으로서의 민주주의\'의 모범적인 사례입니다.',
    conceptSummary: '경청, 양보, 토론, 합의 도출 = 생활양식의 핵심 가치'
  },
  {
    id: 8,
    type: 'multiple',
    title: '정치 형태로서의 민주주의 특징',
    category: '정치 형태',
    question: '다음 중 \'정치 형태로서의 민주주의\'의 특징에 대한 설명으로 옳은 것은?',
    options: [
      '주로 가정과 친구 관계 등 사적인 영역에서만 주로 적용된다.',
      '헌법, 삼권 분립, 선거 제도 등 국가 권력 구조와 통치 체제를 바탕으로 한다.',
      '일상생활의 개인적인 예절이나 태도만을 의미한다.',
      '타인에 대한 무조건적인 복종을 요구하는 도덕 규범이다.'
    ],
    correctAnswer: 2,
    explanation:
      '정치 형태로서의 민주주의는 국가 권력의 분립(입법·사법·행정), 보통 선거 제도, 헌법에 보장된 기본권 등 국가 통치 체제와 제도를 의미합니다.',
    conceptSummary: '정치 형태는 제도적 장치(삼권분립, 선거제, 헌법 등)를 통해 구현됨'
  },
  {
    id: 9,
    type: 'multiple',
    title: '생활양식 민주주의 사례 묶기',
    category: '생활양식',
    question: '다음 <보기>의 사례 중 \'생활양식으로서의 민주주의\'에 해당하는 것만을 있는 대로 고른 것은?',
    passage:
      '<보 기>\nㄱ. 시의회에서 지역 발전 조례안을 표결하여 제정한다.\nㄴ. 주민들이 마을 회의를 열어 놀이터 안전 수칙을 정한다.\nㄷ. 동아리 회원들이 회의를 통해 동아리 회장을 선출한다.\nㄹ. 대통령이 국가 안보에 관한 특별 성명을 발표한다.',
    options: ['ㄱ, ㄷ', 'ㄴ, ㄷ', 'ㄱ, ㄹ', 'ㄴ, ㄹ'],
    correctAnswer: 2,
    explanation:
      '주민들의 놀이터 안전 수칙 제정(ㄴ)과 동아리 회장 선출(ㄷ)은 일상생활 속 자치와 민주적 해결이므로 \'생활양식\'입니다. 시의회의 조례 제정(ㄱ)과 대통령의 국정 수행(ㄹ)은 국가 및 지자체 통치 기관의 활동으로 \'정치 형태\'입니다.',
    conceptSummary: '마을 놀이터 규칙(ㄴ), 동아리 회장 선출(ㄷ) = 생활양식'
  },
  {
    id: 10,
    type: 'multiple',
    title: '두 민주주의의 상호 관계',
    category: '정치 형태',
    question: '\'정치 형태로서의 민주주의\'와 \'생활양식으로서의 민주주의\'의 관계에 대한 설명으로 가장 올바른 것은?',
    options: [
      '두 개념은 서로 대립하므로 한 가지만 선택하여 발전시켜야 한다.',
      '일상생활 속 민주적 생활 태도(생활양식)가 확립되어야 국가 차원의 민주주의(정치 형태)도 굳건히 발전할 수 있다.',
      '법과 제도(정치 형태)만 완벽하면 일상 속 민주적 실천은 전혀 필요하지 않다.',
      '생활양식으로서의 민주주의는 과거의 방식이며, 오늘날에는 오직 정치 형태만 존재한다.'
    ],
    correctAnswer: 2,
    explanation:
      '정치 형태로서의 민주주의와 생활양식으로서의 민주주의는 분리된 것이 아니라 긴밀히 연결되어 있습니다. 시민들이 일상에서 민주적 태도를 실천할 때 비로소 국가 제도와 민주 정치도 건강하게 꽃필 수 있습니다.',
    conceptSummary: '생활양식의 민주주의(뿌리) ➔ 정치 형태의 민주주의(꽃과 열매) 발전'
  }
];

/**
 * 15x15 Maze Grid Specification
 * 0 = Open corridor (Walkable)
 * 1 = Wall / Hedge
 * 2 = Start Tile (Character spawn: x=1, y=1)
 * 3 = Exit Gate (Democracy Hall: x=13, y=13)
 * 101 ~ 110 = Question Stations 1 to 10
 * 201 ~ 208 = Bonus Snack Pickups
 * 301 ~ 308 = Landmine (지뢰: 밟으면 💥 폭발 & 이동 걸음 수 +10걸음 증가)
 * 399 = Exploded Landmine (비활성화된 그을린 지뢰 흔적)
 */
export const MAZE_GRID_SIZE = 15;

export const INITIAL_MAZE_MAP: number[][] = [
  // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14
  [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ], // 0
  [ 1, 2, 0, 0, 1, 0, 301, 0, 1, 0, 0, 0, 0, 102, 1 ], // 1 (Start at 1,1; Mine at 6,1; Q2 at 13,1)
  [ 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1 ], // 2
  [ 1, 101, 1, 0, 0, 0, 1, 0, 302, 0, 1, 202, 0, 0, 1 ], // 3 (Q1 at 1,3; Mine at 8,3; Snack at 11,3)
  [ 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1 ], // 4
  [ 1, 0, 0, 201, 1, 0, 0, 0, 1, 0, 303, 0, 1, 103, 1 ], // 5 (Snack at 3,5; Mine at 10,5; Q3 at 13,5)
  [ 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1 ], // 6
  [ 1, 104, 0, 0, 304, 0, 1, 105, 0, 0, 0, 0, 0, 0, 1 ], // 7 (Q4 at 1,7; Mine at 4,7; Q5 at 7,7)
  [ 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1 ], // 8
  [ 1, 0, 0, 106, 1, 0, 305, 0, 1, 203, 1, 107, 0, 0, 1 ], // 9 (Q6 at 3,9; Mine at 6,9; Snack at 9,9; Q7 at 11,9)
  [ 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1 ], // 10
  [ 1, 108, 0, 0, 0, 204, 1, 0, 306, 0, 0, 0, 1, 109, 1 ], // 11 (Q8 at 1,11; Snack at 5,11; Mine at 8,11; Q9 at 13,11)
  [ 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1 ], // 12
  [ 1, 0, 0, 110, 1, 0, 0, 0, 307, 0, 0, 0, 0, 3, 1 ], // 13 (Q10 at 3,13; Mine at 8,13; Exit 3 at 13,13)
  [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ], // 14
];

export interface TilePos {
  x: number;
  y: number;
}

export const QUESTION_POSITIONS: Record<number, TilePos> = {
  1: { x: 1, y: 3 },
  2: { x: 13, y: 1 },
  3: { x: 13, y: 5 },
  4: { x: 1, y: 7 },
  5: { x: 7, y: 7 },
  6: { x: 3, y: 9 },
  7: { x: 11, y: 9 },
  8: { x: 1, y: 11 },
  9: { x: 13, y: 11 },
  10: { x: 3, y: 13 }
};
