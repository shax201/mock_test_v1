# Scripts Directory

This directory contains utility scripts for database seeding and maintenance.

## Remedial Test Seeding

### `seed-remedial-tests.ts`

Seeds the database with sample remedial test templates for both Multiple Choice and True/False question types in the LISTENING module.

#### Features

- Creates 6 sample remedial test templates
- Supports both MULTIPLE_CHOICE and TRUE_FALSE question types
- Includes per-question audio uploads (simulated with Cloudinary demo URLs)
- Links to existing mock tests when available
- Creates an admin user if none exists
- Provides detailed logging and summary statistics

#### Sample Data Includes

1. **Listening Comprehension - Multiple Choice** (Intermediate, 15 min)
   - 3 questions with audio content
   - Multiple choice options

2. **Listening Comprehension - True/False** (Beginner, 10 min)
   - 3 true/false questions with audio

3. **Advanced Listening - Multiple Choice** (Advanced, 25 min)
   - 4 challenging questions with complex audio

4. **Basic Listening - True/False** (Beginner, 8 min)
   - 2 simple true/false questions

5. **Intermediate Listening - True/False** (Intermediate, 12 min)
   - 3 moderate difficulty questions

#### Usage

```bash
# Run the seeding script
npx tsx scripts/seed-remedial-tests.ts

# Or make it executable and run directly
chmod +x scripts/seed-remedial-tests.ts
./scripts/seed-remedial-tests.ts
```

#### Prerequisites

- Database connection configured in `.env`
- Prisma client installed
- Admin user will be created if none exists (email: admin@example.com, password: admin123)

#### Output

The script provides detailed logging including:
- Creation progress for each test
- Summary statistics
- Error handling with clear messages

#### Database Schema

The script creates records in the `remedial_test_templates` table with the following structure:

- `title`: Test title
- `description`: Test description
- `type`: Question type (MULTIPLE_CHOICE, TRUE_FALSE)
- `module`: Module type (LISTENING)
- `difficulty`: Difficulty level (BEGINNER, INTERMEDIATE, ADVANCED)
- `duration`: Test duration in minutes
- `questions`: JSON array of question data including:
  - Question text (or "Audio Question" placeholder)
  - Per-question audio URLs and public IDs
  - Answer options (for multiple choice)
  - Correct answers
  - Instructions
- `audioUrl`: Main audio file URL
- `audioPublicId`: Cloudinary public ID for main audio
- `mockTestId`: Optional link to existing mock test
- `isActive`: Whether the test is active
- `createdBy`: ID of the admin user who created it

#### Notes

- Audio URLs use Cloudinary demo URLs for demonstration purposes
- In production, replace with actual uploaded audio files
- The script is idempotent - running it multiple times will create duplicate entries
- Admin user creation is safe - it won't overwrite existing admin users