export interface ReadingTestData {
  test?: {
    title: string;
    totalQuestions: number;
    totalTimeMinutes: number;
  };
  passages: Array<{
    id: number;
    title: string;
    content: Array<{
      id: string;
      text: string;
    }>;
  }>;
  questions: Record<string, any>;
  correctAnswers: Record<string, string>;
  passageConfigs: Array<{
    part: number;
    total: number;
    start: number;
  }>;
  bandCalculation: {
    ranges: Array<{
      minScore: number;
      band: number;
    }>;
  };
}
