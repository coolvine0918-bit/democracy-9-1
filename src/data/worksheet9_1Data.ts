export interface BlankQuestion {
  id: string; // 'blank_1', etc.
  label: string; // '㉠', '㉡', etc.
  correctAnswers: string[]; // Variations of acceptable answers
  explanation: string;
  points: number;
}

export interface BlankSentenceItem {
  id: number;
  textBefore: string;
  blankId: string;
  blankLabel: string;
  textMiddle?: string;
  secondBlankId?: string;
  secondBlankLabel?: string;
  textAfter: string;
  fullSentence: string;
}

export interface AnalysisQuestion {
  id: string;
  label: string; // '(가)', '(나)'
  title: string;
  content: string;
  expectedKeywords: string[];
  modelAnswer: string;
  explanation: string;
  points: number;
}

export interface AttitudeItem {
  key: 'tolerance' | 'critique' | 'compromise';
  name: string; // '관용', '비판', '타협'
  nameKeywords: string[];
  meaningKeywords: string[];
  modelMeaning: string;
  fullModelAnswer: string;
  pointsName: number;
  pointsMeaning: number;
  explanation: string;
}

export interface OXQuestion {
  id: number;
  question: string;
  answer: 'O' | 'X';
  explanation: string;
  points: number;
}

// I. 개념 빈칸 채우기 정답 및 데이터
export const BLANK_QUESTIONS: BlankQuestion[] = [
  {
    id: 'blank_ga',
    label: '㉠',
    correctAnswers: ['정치권력', '정치 권력', '권력'],
    explanation: '국가가 사회 질서를 유지하고 공공의 목적을 달성하기 위해 행사하는 정당하고 강제력 있는 힘을 "정치권력"이라고 합니다. (교과서 165쪽)',
    points: 5,
  },
  {
    id: 'blank_na',
    label: '㉡',
    correctAnswers: ['좁은', '좁은 의미', '좁은의미', '좁은 의미의'],
    explanation: '국회에서 법률을 제정·개정하거나 정부가 정책을 집행하는 등 국가기관이 정치권력을 획득·행사하는 활동은 "좁은 의미의 정치"입니다. (교과서 165쪽)',
    points: 5,
  },
  {
    id: 'blank_da',
    label: '㉢',
    correctAnswers: ['넓은', '넓은 의미', '넓은의미', '넓은 의미의'],
    explanation: '가족회의나 학급 회의처럼 사회 집단 내에서 대립과 갈등을 조정하여 합의를 이끌어 내는 모든 활동은 "넓은 의미의 정치"입니다. (교과서 165쪽)',
    points: 5,
  },
  {
    id: 'blank_ra',
    label: '㉣',
    correctAnswers: ['사회 질서', '사회질서', '질서'],
    explanation: '정치는 구성원 간의 대립과 갈등을 합리적으로 해결함으로써 사회를 통합하고 "사회 질서"를 안정적으로 유지하는 역할을 합니다. (교과서 165쪽)',
    points: 5,
  },
  {
    id: 'blank_ma',
    label: '㉤',
    correctAnswers: ['정치 형태', '정치형태', '정치 형태로서', '정치체제'],
    explanation: '모든 국민이 국가의 주인으로서 권리를 가지고 나라를 다스리는 통치 방식을 "정치 형태로서의 민주주의"라고 부릅니다. (교과서 166쪽)',
    points: 5,
  },
  {
    id: 'blank_ba',
    label: '㉥',
    correctAnswers: ['다수결', '다수결의 원칙', '다수결의원칙', '다수결 원칙'],
    explanation: '집단의 의견을 결정할 때 다수의 뜻에 따르는 방식을 "다수결의 원칙"이라고 합니다. 단, 사전에 충분한 대화와 소수 의견 존중이 전제되어야 합니다. (교과서 166쪽)',
    points: 5,
  },
  {
    id: 'blank_sa',
    label: '㉦',
    correctAnswers: ['소수', '소수의견', '소수 의견', '소수의'],
    explanation: '다수결의 원칙을 적용하더라도 다수의 횡포를 방지하고 모든 구성원의 기본권을 보장하기 위해 반드시 "소수"의 의견을 존중하고 배려해야 합니다. (교과서 166쪽)',
    points: 5,
  },
];

// II-1. 자료 분석 문제
export const ANALYSIS_QUESTIONS: AnalysisQuestion[] = [
  {
    id: 'case_ga',
    label: '(가)',
    title: '국회에서 예산안을 심의하여 확정하고 공포하는 활동',
    content: '국회와 정부 등 국가기관이 법률을 제정하거나 국가 예산을 심의·확정하고 집행하는 활동',
    expectedKeywords: ['좁은', '좁은 의미', '정치권력', '국가기관', '국가'],
    modelAnswer: '국가기관이 정치권력을 획득·행사하는 좁은 의미의 정치',
    explanation: '국회, 정부, 법원 등 국가기관이 국민의 생활과 관련된 법과 정책을 만들고 집행하는 등 정치권력을 행사하는 활동은 "좁은 의미의 정치"입니다.',
    points: 10,
  },
  {
    id: 'case_na',
    label: '(나)',
    title: '학급 회의에서 체육대회 단체 티셔츠 색상을 정하기 위해 토의하는 활동',
    content: '학교 학급 회의나 가족회의, 동아리 등 사회 집단에서 구성원들의 다양한 의견을 조율하는 활동',
    expectedKeywords: ['넓은', '넓은 의미', '사회 집단', '갈등', '조정', '합의'],
    modelAnswer: '사회 집단에서 갈등을 조정하고 합의를 이끌어 내는 넓은 의미의 정치',
    explanation: '국가 차원뿐만 아니라 학교, 가정, 동아리 등 일상생활의 다양한 사회 집단에서 대립과 갈등을 조정하고 문제를 해결해 가는 과정은 "넓은 의미의 정치"입니다.',
    points: 10,
  },
];

// II-2. 서술형 문제 - 태도 3가지 및 의미
export const ATTITUDE_ITEMS: AttitudeItem[] = [
  {
    key: 'tolerance',
    name: '관용',
    nameKeywords: ['관용'],
    meaningKeywords: ['다른', '가치관', '생각', '인정', '포용', '존중', '입장'],
    modelMeaning: '자신과 다른 가치관이나 생각을 인정하고 포용하는 태도',
    fullModelAnswer: '관용: 자신과 다른 가치관이나 생각을 인정하고 포용하는 태도',
    pointsName: 4,
    pointsMeaning: 6,
    explanation: '관용이란 나와 다른 사람의 견해, 종교, 신념의 차이를 배척하지 않고 인정하며 너그럽게 받아들이는 민주 시민의 기본 태도입니다. (교과서 166쪽)',
  },
  {
    key: 'critique',
    name: '비판',
    nameKeywords: ['비판', '비판적 태도', '비판적인 태도'],
    meaningKeywords: ['합리적', '근거', '옳고 그름', '따지는', '따져', '판단', '검토'],
    modelMeaning: '합리적 근거를 바탕으로 옳고 그름을 따지는 태도',
    fullModelAnswer: '비판: 합리적 근거를 바탕으로 옳고 그름을 따지는 태도',
    pointsName: 4,
    pointsMeaning: 6,
    explanation: '비판은 근거 없는 감정적 비난과 달리, 객관적이고 타당한 사실과 근거를 들어 주장의 타당성과 정당성을 이성적으로 따져보는 태도입니다. (교과서 166쪽 지도서)',
  },
  {
    key: 'compromise',
    name: '타협',
    nameKeywords: ['타협', '대화와 타협'],
    meaningKeywords: ['양보', '합의점', '절충', '찾아가는', '서로 양보', '의견 조율'],
    modelMeaning: '서로 양보하여 합의점을 찾아가는 태도',
    fullModelAnswer: '타협: 서로 양보하여 합의점을 찾아가는 태도',
    pointsName: 4,
    pointsMeaning: 6,
    explanation: '타협은 자신의 주장만을 일방적으로 고집하지 않고, 상호 존중을 바탕으로 한 걸음씩 양보하여 모두가 수용 가능한 최선의 해결책을 도출하는 태도입니다. (교과서 166쪽)',
  },
];

// III. 교과서 스스로 확인하기 (교과서 167쪽)
export const OX_QUESTIONS: OXQuestion[] = [
  {
    id: 1,
    question: '좁은 의미의 정치란 정치권력을 획득하고 행사하는 활동을 말한다.',
    answer: 'O',
    explanation: '국회에서 법률을 제정하거나 정부가 정책을 집행하는 등 국가 통치 권력의 획득 및 행사는 좁은 의미의 정치입니다.',
    points: 5,
  },
  {
    id: 2,
    question: '가족회의로 의견을 조율하여 문제를 해결하는 활동은 좁은 의미의 정치에 해당한다.',
    answer: 'X',
    explanation: '가족회의, 학급 회의, 동아리 회의 등 일상적인 사회 집단에서 갈등을 해결하는 활동은 "넓은 의미의 정치"에 해당하므로 X입니다.',
    points: 5,
  },
  {
    id: 3,
    question: '정치는 사회를 통합하고 사회 질서를 유지하는 역할을 한다.',
    answer: 'O',
    explanation: '정치는 희소한 가치를 둘러싼 구성원 간의 갈등을 평화롭고 합리적으로 조정하여 사회적 혼란을 막고 질서를 유지합니다.',
    points: 5,
  },
];

// 핵심 개념 정리 (학생 복습용)
export const TEXTBOOK_CONCEPTS_SUMMARY = [
  {
    title: '1. 정치의 의미와 역할 (교과서 164~165쪽)',
    items: [
      {
        term: '정치권력',
        desc: '국가가 사회 질서 유지 및 공공 복리 실현 등의 정치적 기능을 수행하고자 행사하는 강제력 있는 힘',
      },
      {
        term: '좁은 의미의 정치',
        desc: '국회, 정부 등 국가기관이 정치권력을 획득·행사하는 활동 (예: 법률 제정·개정, 정부 정책 집행, 국무회의 심의)',
      },
      {
        term: '넓은 의미의 정치',
        desc: '국가뿐만 아니라 학교, 가족, 지역사회 등 일상 집단에서 갈등을 조정하여 합의를 이끌어 내는 모든 과정',
      },
      {
        term: '정치의 역할',
        desc: '희소한 가치를 둘러싼 대립과 갈등을 합리적으로 조정·해결하여 사회를 통합하고 사회 질서를 유지함',
      },
    ],
  },
  {
    title: '2. 민주주의의 의미와 민주적 태도 (교과서 166~167쪽)',
    items: [
      {
        term: '정치 형태로서의 민주주의',
        desc: '소수의 지배자가 아닌 모든 국민이 국가의 주인으로서 주권을 갖고 스스로 나라를 다스리는 통치 방식',
      },
      {
        term: '생활양식으로서의 민주주의',
        desc: '일상생활에서 발생하는 문제를 모든 구성원이 자유롭고 평등한 입장에서 대화와 토론을 통해 해결하는 생활 태도',
      },
      {
        term: '관용 (Tolerance)',
        desc: '자신과 다른 가치관, 종교, 신념이나 사고방식을 편견 없이 인정하고 너그럽게 포용하는 태도',
      },
      {
        term: '비판 (Critique)',
        desc: '감정적인 비난이 아닌, 객관적이고 합리적인 근거를 바탕으로 주장의 옳고 그름을 이성적으로 따져보는 태도',
      },
      {
        term: '타협 (Compromise)',
        desc: '자신의 주장만 고집하지 않고 서로 양보하여 모두가 납득할 수 있는 공통의 합의점을 찾아가는 태도',
      },
      {
        term: '다수결의 원칙과 소수의견 존중',
        desc: '다수의 뜻에 따라 신속하게 결정하되, 다수의 횡포를 방지하고 인권을 보호하기 위해 소수의 의견을 경청·배려해야 함',
      },
    ],
  },
];
