# IELTS Mock Test System

A comprehensive full-stack IELTS Mock Test platform built with Next.js, TypeScript, and PostgreSQL. This system enables students to take IELTS mock exams online while instructors can provide feedback and admins can manage the entire system.

## Features

### 🎯 Core Functionality
- **Secure tokenized student access** (valid for 2–3 days)
- **Auto-timed test modules** (Listening, Reading, Writing, Speaking)
- **Auto scoring** (Listening & Reading)
- **Instructor feedback** and band calculation for Writing
- **Manual Speaking marks** + overall IELTS band calculation
- **Auto PDF result generation** & inline feedback view

### 👥 User Roles
- **Students**: Take mock tests with secure token access
- **Instructors**: Grade writing submissions and provide feedback
- **Admins**: Create tests, assign students, manage results

### 📊 Test Modules
- **Listening**: Audio player with disabled controls, 40 minutes
- **Reading**: Text passages with various question types, 60 minutes
- **Writing**: Two tasks with word count tracking, auto-save, 60 minutes
- **Speaking**: Text-based responses (simulating spoken answers), 15 minutes

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+ (TypeScript), TailwindCSS |
| Backend | Next.js API Routes (TypeScript), Prisma ORM |
| Database | PostgreSQL |
| Storage | Cloudinary |
| Auth | Tokenized links + JWT (admin/instructor) |
| Testing | Jest, Playwright |
| Deployment | Vercel |

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Cloudinary account (for file storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ielts-mock-test
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your values:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/ielts_mock_test"
   JWT_SECRET="your-super-secret-jwt-key-here"
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Default Credentials

### Admin
- Email: `admin@radiance.edu`
- Password: `admin123`

### Instructor
- Email: `instructor@radiance.edu`
- Password: `instructor123`

## Project Structure

```
/app
  /admin                 # Admin panel
    /mocks              # Mock test management
    /assignments        # Student assignments
    /results           # Results overview
  /instructor           # Instructor panel
    /grade             # Grading interface
  /test                 # Student test portal
    /[token]           # Token-based test flow
  /results             # Student results view
  /api                 # API routes
    /admin             # Admin API endpoints
    /instructor        # Instructor API endpoints
    /student           # Student API endpoints
/components
  /admin               # Admin components
  /instructor          # Instructor components
  /test                # Test components
  /ui                  # Shared UI components
/lib
  /auth                # Authentication utilities
  /scoring             # Band calculation logic
  /storage             # File storage utilities
  /pdf                 # PDF generation
```

## Key Features Implementation

### 🔐 Authentication System
- **Student Access**: Token-based authentication with 2-3 day validity
- **Admin/Instructor**: JWT-based authentication with role-based access
- **Middleware**: Route protection and token validation

### 🎵 Audio Player Security
- Custom `react-h5-audio-player` configuration
- Disabled seek bar and pause controls via CSS
- Auto-play functionality for test integrity

### 📝 Writing Module Features
- **Auto-save**: Every 30 seconds to prevent data loss
- **Word count tracking**: Real-time word count with minimum requirements
- **Task separation**: Task 1 (150 words) and Task 2 (250 words)

### 📊 IELTS Band Calculation
- **Listening/Reading**: Automatic scoring with IELTS conversion tables
- **Writing**: Four criteria scoring (Task Achievement, Coherence & Cohesion, Lexical Resource, Grammar)
- **Speaking**: Manual instructor scoring
- **Overall**: Average with IELTS rounding rules (.25/.75 rule)

### 📄 PDF Generation
- **On-demand generation**: PDFs created when students request results
- **Comprehensive reports**: Band scores, feedback, and detailed analysis
- **Cloudinary storage**: Secure file storage and retrieval

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
- Band calculation logic
- Token generation and validation
- Auto-scoring algorithms
- Complete student test flow

## Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Configure PostgreSQL database (NeonDB/Supabase recommended)
4. Deploy automatically on push to main branch

### Environment Variables for Production
```env
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"
NODE_ENV="production"
```

## API Endpoints

### Student Endpoints
- `GET /api/student/validate-token` - Validate student token
- `POST /api/student/submissions/[moduleId]/start` - Start module
- `POST /api/student/submissions/[moduleId]/submit` - Submit answers
- `GET /api/student/results` - Get results
- `POST /api/student/results/pdf` - Generate PDF report

### Admin Endpoints
- `GET/POST /api/admin/mocks` - Mock test management
- `GET/POST /api/admin/assignments` - Student assignments
- `GET /api/admin/results/[id]` - Results management

### Instructor Endpoints
- `POST /api/instructor/marks` - Submit writing marks
- `POST /api/instructor/feedback` - Add writing feedback

## Database Schema

The system uses 11 core tables:
- `User` - Admin, instructor, and student accounts
- `Mock` - Mock test templates
- `MockModule` - Test modules (Listening, Reading, Writing, Speaking)
- `QuestionBank` - Reusable question templates
- `MockQuestion` - Questions for each mock test
- `Assignment` - Student test assignments with tokens
- `Submission` - Student module submissions
- `InstructorMark` - Writing band scores
- `WritingFeedback` - Inline feedback comments
- `Result` - Final band calculations
- `PDFReport` - Generated report metadata

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Email: support@radiance.edu
- Documentation: [Link to documentation]
- Issues: [GitHub Issues]

---

Built with ❤️ for Radiance Education