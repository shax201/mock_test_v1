# IELTS Mock Test - Separate Reading and Listening Modules

## Overview

This document describes the enhanced architecture for creating separate modules for reading and listening test questions with distinct data storage structures.

## Architecture Components

### 1. Database Schema Updates

#### New Models Added:

**ReadingModuleData**
- Stores reading-specific content and passages
- Fields: `part1Content`, `part2Content`, `part3Content`, `part1Passage`, `part2Passage`, `part3Passage`, `part1Instructions`, `part2Instructions`, `part3Instructions`

**ListeningModuleData**
- Stores listening-specific content and audio information
- Fields: `audioUrl`, `audioPublicId`, `audioDuration`, `part1Content`, `part2Content`, `part3Content`, `part1Instructions`, `part2Instructions`, `part3Instructions`, `part1AudioStart`, `part1AudioEnd`, `part2AudioStart`, `part2AudioEnd`, `part3AudioStart`, `part3AudioEnd`

#### Updated Models:

**MockModule**
- Added relations to `ReadingModuleData` and `ListeningModuleData`
- Maintains backward compatibility with existing structure

### 2. Component Architecture

#### Reading Module Components:
- `IELTSReadingBuilder.tsx` - Dedicated reading question builder
- Features: Passage management, content editing, question creation
- Supports: Notes completion, multiple choice, true/false/not given, summary completion, fill-in-the-blank, matching

#### Listening Module Components:
- `IELTSListeningBuilderV2.tsx` - Enhanced listening question builder
- Features: Audio file management, timing controls, content editing
- Supports: All question types with audio-specific features

#### Generic Components:
- `ModuleTypeSelector.tsx` - Routes to appropriate builder based on module type
- `EnhancedMockTestCreator.tsx` - Comprehensive mock test creation interface

### 3. API Endpoints

#### Reading Module Data API:
- `GET /api/admin/reading-module-data` - Fetch reading module data
- `POST /api/admin/reading-module-data` - Create reading module data
- `PUT /api/admin/reading-module-data` - Update reading module data
- `DELETE /api/admin/reading-module-data` - Delete reading module data

#### Listening Module Data API:
- `GET /api/admin/listening-module-data` - Fetch listening module data
- `POST /api/admin/listening-module-data` - Create listening module data
- `PUT /api/admin/listening-module-data` - Update listening module data
- `DELETE /api/admin/listening-module-data` - Delete listening module data

### 4. Service Layer

#### ModuleDataService
- Centralized service for managing module-specific data
- Methods: `createOrUpdateReadingData`, `createOrUpdateListeningData`, `getModuleData`, `deleteModuleData`
- Type-safe interfaces for data input/output

## Data Flow

### Reading Module Flow:
1. User creates reading module in admin interface
2. `IELTSReadingBuilder` component handles question creation
3. Reading-specific data (passages, content, instructions) stored in `ReadingModuleData`
4. Questions stored in existing `QuestionBank` and `MockQuestion` tables
5. API endpoints manage CRUD operations for reading data

### Listening Module Flow:
1. User creates listening module in admin interface
2. `IELTSListeningBuilderV2` component handles audio upload and question creation
3. Listening-specific data (audio, timing, content) stored in `ListeningModuleData`
4. Questions stored in existing `QuestionBank` and `MockQuestion` tables
5. API endpoints manage CRUD operations for listening data

## Key Features

### Reading Module Features:
- **Passage Management**: Separate storage for reading passages by part
- **Content Organization**: Part-specific content and instructions
- **Question Types**: All IELTS reading question types supported
- **Rich Text Editing**: Advanced content editing with formatting

### Listening Module Features:
- **Audio Management**: Cloudinary integration for audio file storage
- **Timing Controls**: Audio start/end times for each part
- **Content Organization**: Part-specific content and instructions
- **Question Types**: All IELTS listening question types supported

### Generic Features:
- **Module Type Detection**: Automatic routing to appropriate builder
- **Data Persistence**: Separate storage for module-specific data
- **Backward Compatibility**: Existing modules continue to work
- **Type Safety**: TypeScript interfaces for all data structures

## Usage Examples

### Creating a Reading Module:
```typescript
const readingData = {
  part1Content: "Reading passage content for part 1",
  part1Passage: "Full reading passage text",
  part1Instructions: "Instructions for part 1",
  // ... other parts
}

await ModuleDataService.createOrUpdateReadingData(moduleId, readingData)
```

### Creating a Listening Module:
```typescript
const listeningData = {
  audioUrl: "https://cloudinary.com/audio.mp3",
  audioPublicId: "audio_123",
  audioDuration: 1800,
  part1AudioStart: 0,
  part1AudioEnd: 600,
  // ... other parts
}

await ModuleDataService.createOrUpdateListeningData(moduleId, listeningData)
```

## Benefits

1. **Separation of Concerns**: Reading and listening data stored separately
2. **Enhanced Functionality**: Module-specific features (audio timing, passage management)
3. **Scalability**: Easy to add new module types
4. **Maintainability**: Clear separation of responsibilities
5. **Type Safety**: Strong typing for all data structures
6. **Backward Compatibility**: Existing functionality preserved

## Migration Strategy

1. **Database Migration**: Run Prisma migration to add new tables
2. **Component Integration**: Use `ModuleTypeSelector` to route to appropriate builders
3. **Data Migration**: Existing modules continue to work with generic builder
4. **Gradual Adoption**: New modules use enhanced builders, existing ones remain unchanged

## Future Enhancements

1. **Writing Module**: Dedicated writing task builder with assessment rubrics
2. **Speaking Module**: Speaking task builder with evaluation criteria
3. **Analytics**: Module-specific performance tracking
4. **Templates**: Pre-built module templates
5. **Collaboration**: Multi-user module editing capabilities
