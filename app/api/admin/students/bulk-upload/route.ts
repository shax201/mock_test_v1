import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import { revalidatePath, revalidateTag } from 'next/cache'
import bcrypt from 'bcryptjs'
import { emailService } from '@/lib/email/email-service'

interface StudentRow {
  name: string
  email: string
  candidateNumber?: string
  phone?: string
  dateOfBirth?: string
  address?: string
  notes?: string
}

// Simple CSV parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last field
  result.push(current.trim())
  return result
}

function parseCSV(csvText: string): StudentRow[] {
  const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim())
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row')
  }

  // Parse header
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/"/g, ''))
  
  // Validate required headers
  const requiredHeaders = ['name', 'email']
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`)
  }

  // Parse data rows
  const students: StudentRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim())
    
    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1} has ${values.length} columns but expected ${headers.length}. Please check for missing commas or extra commas.`)
    }

    const student: StudentRow = {
      name: '',
      email: ''
    }

    headers.forEach((header, index) => {
      const value = values[index] || ''
      switch (header) {
        case 'name':
          student.name = value
          break
        case 'email':
          student.email = value.toLowerCase()
          break
        case 'candidatenumber':
        case 'candidate_number':
          student.candidateNumber = value
          break
        case 'phone':
          student.phone = value
          break
        case 'dateofbirth':
        case 'date_of_birth':
        case 'dob':
          student.dateOfBirth = value
          break
        case 'address':
          student.address = value
          break
        case 'notes':
          student.notes = value
          break
      }
    })

    // Skip empty rows
    if (!student.name && !student.email) {
      continue
    }

    // Validate required fields
    if (!student.name || !student.email) {
      throw new Error(`Row ${i + 1} is missing required fields (name or email)`)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(student.email)) {
      throw new Error(`Row ${i + 1} has invalid email format: ${student.email}`)
    }

    students.push(student)
  }

  if (students.length === 0) {
    throw new Error('No valid student data found in CSV file')
  }

  return students
}

// Generate random password
function generateRandomPassword(): string {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  // Ensure at least one lowercase, one uppercase, one number, and one special character
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  password += '0123456789'[Math.floor(Math.random() * 10)]
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV file' }, { status: 400 })
    }

    // Read and parse CSV
    const csvText = await file.text()
    let students: StudentRow[]
    
    try {
      students = parseCSV(csvText)
    } catch (parseError: any) {
      return NextResponse.json(
        { error: `CSV parsing error: ${parseError.message}` },
        { status: 400 }
      )
    }

    if (students.length === 0) {
      return NextResponse.json({ error: 'No students found in CSV file' }, { status: 400 })
    }

    // Check for duplicate emails in CSV
    const emailSet = new Set<string>()
    const duplicateEmails: string[] = []
    students.forEach((student, index) => {
      if (emailSet.has(student.email)) {
        duplicateEmails.push(`Row ${index + 2}: ${student.email}`)
      }
      emailSet.add(student.email)
    })

    if (duplicateEmails.length > 0) {
      return NextResponse.json(
        { error: `Duplicate emails found in CSV: ${duplicateEmails.join(', ')}` },
        { status: 400 }
      )
    }

    // Check existing emails in database
    const emails = students.map(s => s.email)
    const existingUsers = await prisma.user.findMany({
      where: {
        email: { in: emails }
      },
      select: { email: true }
    })

    const existingEmails = new Set(existingUsers.map(u => u.email))
    const conflictingEmails = students.filter(s => existingEmails.has(s.email))

    if (conflictingEmails.length > 0) {
      return NextResponse.json(
        { 
          error: `These emails already exist in the system: ${conflictingEmails.map(s => s.email).join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Create students
    const createdStudents = []
    const errors: string[] = []
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host') || 'radianceedu.app'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`
    const portalLink = `${baseUrl}/login?type=student`

    for (const studentData of students) {
      try {
        const plainPassword = generateRandomPassword()
        const passwordHash = await bcrypt.hash(plainPassword, 12)

        const student = await prisma.user.create({
          data: {
            name: studentData.name,
            email: studentData.email,
            phone: studentData.phone || null,
            dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth) : null,
            address: studentData.address || null,
            notes: studentData.notes || null,
            role: 'STUDENT',
            passwordHash
          }
        })

        // Send login credentials email
        try {
          await emailService.sendLoginCredentialsEmail({
            studentName: studentData.name,
            studentEmail: studentData.email,
            password: plainPassword,
            portalLink
          })
        } catch (emailError) {
          console.error(`Error sending email to ${studentData.email}:`, emailError)
          // Continue even if email fails
        }

        createdStudents.push({
          id: student.id,
          name: student.name,
          email: student.email
        })
      } catch (error: any) {
        errors.push(`${studentData.email}: ${error.message || 'Failed to create'}`)
      }
    }

    // Revalidate cache
    revalidatePath('/admin/students')
    revalidateTag('students', 'max')
    revalidatePath('/admin')
    revalidateTag('admin-dashboard', 'max')

    return NextResponse.json({
      success: true,
      created: createdStudents.length,
      total: students.length,
      errors: errors.length > 0 ? errors : undefined,
      students: createdStudents
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error bulk creating students:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

