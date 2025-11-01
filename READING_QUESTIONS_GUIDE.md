# IELTS Reading Question Types Implementation

This document describes the comprehensive reading question system implemented for the IELTS mock test platform, supporting multiple question types with dynamic rendering.

## Supported Question Types

### 1. Fill-in-the-Blank (FIB)
- **Purpose**: Test vocabulary and comprehension
- **Features**: 
  - Multiple blanks in a single passage
  - Case-sensitive/insensitive options
  - Alternative correct answers
  - Rich text editor with blank field insertion
- **Example**: Complete sentences with missing words from the passage

### 2. True/False Questions
- **Purpose**: Test understanding of factual information
- **Features**:
  - Simple True/False selection
  - Clear binary choice
- **Example**: "Lawson launched his own radio station as a teenager."

### 3. True/False/Not Given Questions
- **Purpose**: Test ability to distinguish between stated facts and unstated information
- **Features**:
  - Three options: True, False, Not Given
  - Tests inference skills
- **Example**: "Lawson won a Nobel Prize for his contributions to technology."

### 4. Multiple Choice Questions (MCQ)
- **Purpose**: Test comprehension and analysis
- **Features**:
  - Single correct answer
  - Multiple options (typically 4)
  - Clear question format
- **Example**: "What was Lawson's most significant contribution to video gaming?"

### 5. Matching Questions
- **Purpose**: Test ability to connect related information
- **Features**:
  - Two columns of items to match
  - Visual interface for matching
  - Prevents duplicate matches
- **Example**: Match events with time periods

## Technical Implementation

### Components Structure

```
components/
├── test/
│   ├── FillInTheBlankQuestion.tsx      # FIB question renderer
│   ├── TrueFalseQuestion.tsx          # True/False renderer
│   ├── MultipleChoiceQuestion.tsx     # MCQ renderer
│   ├── MatchingQuestion.tsx           # Matching renderer
│   ├── QuestionRenderer.tsx           # Dynamic question renderer
│   └── ReadingQuestionExamples.tsx    # Demo component
└── admin/
    ├── DragDropBuilder.tsx            # Enhanced question builder
    ├── FillInTheBlankEditor.tsx       # FIB editor
    └── MatchingQuestionEditor.tsx    # Matching editor
```

### Database Schema

The system uses the existing Prisma schema with enhanced support for different question types:

```prisma
enum QuestionType {
  MCQ
  FIB
  MATCHING
  TRUE_FALSE
  NOT_GIVEN
}

model QuestionBank {
  type      QuestionType
  contentJson Json  // Stores question-specific data
}
```

### Question Data Structure

```typescript
interface Question {
  id: string
  type: 'MCQ' | 'FIB' | 'MATCHING' | 'TRUE_FALSE' | 'NOT_GIVEN'
  content: string
  options?: string[]
  fibData?: {
    content: string
    blanks: BlankField[]
    instructions: string
  }
  matchingData?: {
    leftItems: MatchingItem[]
    rightItems: MatchingItem[]
  }
  instructions?: string
  correctAnswer: string | string[] | Record<string, string>
  points: number
}
```

## Usage Examples

### Creating Questions in Admin Interface

1. **Fill-in-the-Blank Questions**:
   - Select "Fill in the Blank" from question type dropdown
   - Use the rich text editor to create content
   - Insert blank fields using the editor interface
   - Set correct answers and alternatives

2. **True/False Questions**:
   - Select "True/False" or "True/False/Not Given"
   - Enter the statement to be evaluated
   - Set the correct answer (TRUE/FALSE/NOT_GIVEN)

3. **Multiple Choice Questions**:
   - Select "Multiple Choice"
   - Enter question content
   - Add options (typically 4)
   - Set correct answer

4. **Matching Questions**:
   - Select "Matching"
   - Add items to left and right columns
   - Set correct matches in the format: leftItemId:rightItemId

### Rendering Questions in Test Interface

The `QuestionRenderer` component automatically handles all question types:

```tsx
<QuestionRenderer
  question={question}
  questionNumber={index + 1}
  onAnswerChange={handleAnswerChange}
  initialAnswer={answers[question.id]}
  disabled={submitted}
  showInstructions={true}
/>
```

## Features

### Dynamic Question Rendering
- Single component handles all question types
- Automatic type detection and rendering
- Consistent UI/UX across question types
- Responsive design for all screen sizes

### Admin Interface Enhancements
- Drag-and-drop question reordering
- Visual question type indicators
- Specialized editors for complex question types
- Bulk question creation for FIB questions
- Real-time preview of question content

### Answer Validation
- Built-in validation functions for each question type
- Detailed feedback for incorrect answers
- Scoring system with configurable points
- Support for partial credit in complex questions

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- Clear visual indicators
- Consistent focus management

## API Integration

The system integrates with existing API endpoints:

- `POST /api/admin/mocks` - Create mock tests with questions
- `GET /api/student/test-data` - Retrieve test data for students
- `POST /api/student/submissions/reading/submit` - Submit reading answers

## Future Enhancements

1. **Additional Question Types**:
   - Short answer questions
   - Diagram labeling
   - Summary completion

2. **Advanced Features**:
   - Question randomization
   - Adaptive difficulty
   - Multimedia support
   - Advanced analytics

3. **Accessibility Improvements**:
   - Enhanced screen reader support
   - High contrast mode
   - Font size customization

## Testing

The system includes comprehensive testing:

- Unit tests for individual question components
- Integration tests for question rendering
- End-to-end tests for complete workflows
- Validation tests for answer processing

## Performance Considerations

- Lazy loading of question components
- Efficient state management
- Optimized re-rendering
- Minimal bundle size impact

This implementation provides a robust, scalable foundation for reading question types in the IELTS mock test system, with room for future enhancements and additional question types.
