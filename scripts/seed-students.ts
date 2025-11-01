#!/usr/bin/env tsx

import { prisma } from '../lib/db'
import bcrypt from 'bcryptjs'

async function seedStudents() {
  console.log('🌱 Seeding student users...\n')

  try {
    // Create student users
    const students = [
      {
        email: 'student1@example.com',
        name: 'John Smith',
        password: 'password123'
      },
      {
        email: 'student2@example.com', 
        name: 'Sarah Johnson',
        password: 'password123'
      },
      {
        email: 'student3@example.com',
        name: 'Michael Brown',
        password: 'password123'
      },
      {
        email: 'devloperabuhuraira@gmail.com',
        name: 'Abu Huraira',
        password: 'password123'
      }
    ]

    for (const studentData of students) {
      // Hash password
      const hashedPassword = await bcrypt.hash(studentData.password, 10)

      // Create or update student
      const student = await prisma.user.upsert({
        where: { email: studentData.email },
        update: {
          name: studentData.name,
          passwordHash: hashedPassword,
          role: 'STUDENT'
        },
        create: {
          email: studentData.email,
          name: studentData.name,
          passwordHash: hashedPassword,
          role: 'STUDENT'
        }
      })

      console.log(`✅ Student: ${student.name} (${student.email})`)
    }

    // Create some test assignments for students
    const mockTest = await prisma.mock.findFirst({
      where: { title: 'IELTS Academic Reading Test - Comprehensive' }
    })

    if (mockTest) {
      const studentUsers = await prisma.user.findMany({
        where: { role: 'STUDENT' }
      })

      for (const student of studentUsers) {
        // Check if assignment already exists
        const existingAssignment = await prisma.assignment.findFirst({
          where: {
            studentId: student.id,
            mockId: mockTest.id
          }
        })

        if (!existingAssignment) {
          // Create assignment for this student
          const assignment = await prisma.assignment.create({
            data: {
              studentId: student.id,
              mockId: mockTest.id,
              candidateNumber: `CAND${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
              tokenHash: `token_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
              validFrom: new Date(),
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
              status: 'ACTIVE'
            }
          })

          console.log(`📝 Assignment created for ${student.name}: ${assignment.tokenHash}`)
        } else {
          console.log(`📝 Assignment already exists for ${student.name}`)
        }
      }
    }

    console.log(`\n🎉 Successfully seeded ${students.length} students!`)
    console.log('\n📋 Student Login Credentials:')
    console.log('Email: student1@example.com | Password: password123')
    console.log('Email: student2@example.com | Password: password123') 
    console.log('Email: student3@example.com | Password: password123')
    console.log('Email: devloperabuhuraira@gmail.com | Password: password123')

  } catch (error) {
    console.error('❌ Error seeding students:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedStudents()
