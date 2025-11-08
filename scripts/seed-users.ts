import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function main() {
  console.log('🌱 Seeding users...')

  // Seed Admin Users
  console.log('👑 Creating Admin Users...')

  const adminUsers = [
    {
      name: 'System Administrator',
      email: 'admin@radiance.edu',
      password: 'admin123',
      phone: '+1-555-0100',
      address: '123 Admin Street, Education City, EC 12345',
      notes: 'Primary system administrator with full access'
    },
    {
      name: 'IELTS Coordinator',
      email: 'coordinator@radiance.edu',
      password: 'coord123',
      phone: '+1-555-0101',
      address: '456 Coordinator Ave, Education City, EC 12345',
      notes: 'IELTS program coordinator and test manager'
    }
  ]

  for (const adminData of adminUsers) {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminData.email }
    })

    if (!existingAdmin) {
      const hashedPassword = await hashPassword(adminData.password)
      const admin = await prisma.user.create({
        data: {
          name: adminData.name,
          email: adminData.email,
          passwordHash: hashedPassword,
          role: UserRole.ADMIN,
          phone: adminData.phone,
          address: adminData.address,
          notes: adminData.notes
        }
      })
      console.log(`✅ Created Admin: ${admin.name} (${admin.email})`)
    } else {
      console.log(`⏭️  Admin already exists: ${adminData.email}`)
    }
  }

  // Seed Instructor Users
  console.log('🎓 Creating Instructor Users...')

  const instructorUsers = [
    {
      name: 'Instructor',
      email: 'instructor@radiance.edu',
      password: 'instructor123',
      phone: '+1-555-0199',
      address: '100 Instructor Way, Education City, EC 12345',
      dateOfBirth: new Date('1985-01-01'),
      notes: 'Primary instructor account for testing and grading'
    },
    {
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@radiance.edu',
      password: 'instructor123',
      phone: '+1-555-0200',
      address: '789 Instructor Blvd, Education City, EC 12345',
      dateOfBirth: new Date('1985-03-15'),
      notes: 'IELTS Speaking and Writing instructor with 10+ years experience'
    },
    {
      name: 'Prof. Michael Chen',
      email: 'michael.chen@radiance.edu',
      password: 'instructor123',
      phone: '+1-555-0201',
      address: '321 Teacher Lane, Education City, EC 12345',
      dateOfBirth: new Date('1982-07-22'),
      notes: 'IELTS Reading and Listening specialist, Cambridge certified'
    },
    {
      name: 'Ms. Emily Rodriguez',
      email: 'emily.rodriguez@radiance.edu',
      password: 'instructor123',
      phone: '+1-555-0202',
      address: '654 Educator St, Education City, EC 12345',
      dateOfBirth: new Date('1988-11-08'),
      notes: 'IELTS General Training instructor and student counselor'
    },
    {
      name: 'Dr. James Wilson',
      email: 'james.wilson@radiance.edu',
      password: 'instructor123',
      phone: '+1-555-0203',
      address: '987 Professor Ave, Education City, EC 12345',
      dateOfBirth: new Date('1979-05-30'),
      notes: 'IELTS Academic module expert and band score assessor'
    }
  ]

  for (const instructorData of instructorUsers) {
    const existingInstructor = await prisma.user.findUnique({
      where: { email: instructorData.email }
    })

    if (!existingInstructor) {
      const hashedPassword = await hashPassword(instructorData.password)
      const instructor = await prisma.user.create({
        data: {
          name: instructorData.name,
          email: instructorData.email,
          passwordHash: hashedPassword,
          role: UserRole.INSTRUCTOR,
          phone: instructorData.phone,
          dateOfBirth: instructorData.dateOfBirth,
          address: instructorData.address,
          notes: instructorData.notes
        }
      })
      console.log(`✅ Created Instructor: ${instructor.name} (${instructor.email})`)
    } else {
      console.log(`⏭️  Instructor already exists: ${instructorData.email}`)
    }
  }

  // Seed Student Users
  console.log('📚 Creating Student Users...')

  const studentUsers = [
    // High-performing students
    {
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@student.radiance.edu',
      password: 'student123',
      phone: '+1-555-1001',
      address: '111 Student St, Education City, EC 12345',
      dateOfBirth: new Date('1998-01-15'),
      notes: 'Target band 8.0, strong in reading and writing'
    },
    {
      name: 'Maria Gonzalez',
      email: 'maria.gonzalez@student.radiance.edu',
      password: 'student123',
      phone: '+1-555-1002',
      address: '222 Learner Ave, Education City, EC 12345',
      dateOfBirth: new Date('1997-06-20'),
      notes: 'Target band 7.5, needs improvement in speaking'
    },
    {
      name: 'Chen Wei',
      email: 'chen.wei@student.radiance.edu',
      password: 'student123',
      phone: '+1-555-1003',
      address: '333 Scholar Blvd, Education City, EC 12345',
      dateOfBirth: new Date('1999-09-10'),
      notes: 'Target band 8.5, excellent in listening and reading'
    },
    {
      name: 'Priya Patel',
      email: 'priya.patel@student.radiance.edu',
      password: 'student123',
      phone: '+1-555-1004',
      address: '444 Academic St, Education City, EC 12345',
      dateOfBirth: new Date('1996-12-05'),
      notes: 'Target band 7.0, working on writing skills'
    },
    {
      name: 'Yusuf Al-Rashid',
      email: 'yusuf.alrashid@student.radiance.edu',
      password: 'student123',
      phone: '+1-555-1005',
      address: '555 Education Rd, Education City, EC 12345',
      dateOfBirth: new Date('1995-03-28'),
      notes: 'Target band 8.0, preparing for university admission'
    },

    // Intermediate students
    {
      name: 'Fatima Al-Zahra',
      email: 'fatima.alzahra@student.radiance.edu',
      password: 'student123',
      phone: '+1-555-1006',
      address: '666 Learning Ln, Education City, EC 12345',
      dateOfBirth: new Date('2000-07-12'),
      notes: 'Target band 6.5, beginner level, needs foundation building'
    },
    {
      name: 'Carlos Mendez',
      email: 'carlos.mendez@student.radiance.edu',
      password: 'student123',
      phone: '+1-555-1007',
      address: '777 Study St, Education City, EC 12345',
      dateOfBirth: new Date('1998-11-03'),
      notes: 'Target band 6.0, struggling with listening comprehension'
    },
    {
      name: 'Aisha Nkosi',
      email: 'aisha.nkosi@student.radiance.edu',
      password: 'student123',
      phone: '+1-555-1008',
      address: '888 Knowledge Ave, Education City, EC 12345',
      dateOfBirth: new Date('1997-04-18'),
      notes: 'Target band 6.5, good at writing but needs speaking practice'
    },
    {
      name: 'Raj Kumar',
      email: 'raj.kumar@student.radiance.edu',
      password: 'student123',
      phone: '+1-555-1009',
      address: '999 Wisdom Blvd, Education City, EC 12345',
      dateOfBirth: new Date('1999-08-25'),
      notes: 'Target band 6.0, improving steadily, focus on vocabulary'
    },
    {
      name: 'Sophie Dubois',
      email: 'sophie.dubois@student.radiance.edu',
      password: 'student123',
      phone: '+1-555-1010',
      address: '101 Learning Path, Education City, EC 12345',
      dateOfBirth: new Date('1996-02-14'),
      notes: 'Target band 7.0, strong academically, preparing for work visa'
    },

    // Advanced students
    {
      name: 'Dr. Hiroshi Tanaka',
      email: 'hiroshi.tanaka@student.radiance.edu',
      password: 'student123',
      phone: '+1-555-1011',
      address: '202 Academic Heights, Education City, EC 12345',
      dateOfBirth: new Date('1985-10-30'),
      notes: 'Target band 9.0, research scientist, needs perfection in all skills'
    },
    {
      name: 'Prof. Anna Schmidt',
      email: 'anna.schmidt@student.radiance.edu',
      password: 'student123',
      phone: '+1-555-1012',
      address: '303 Scholar Peak, Education City, EC 12345',
      dateOfBirth: new Date('1980-05-22'),
      notes: 'Target band 8.5, university professor, expert in academic writing'
    },

    // Additional students for testing
    {
      name: 'Mohammed Al-Fayed',
      email: 'mohammed.alfayed@student.radiance.edu',
      password: 'student123',
      phone: '+1-555-1013',
      address: '404 Student Square, Education City, EC 12345',
      dateOfBirth: new Date('2001-01-08'),
      notes: 'Target band 7.5, young learner, enthusiastic and dedicated'
    },
    {
      name: 'Isabella Rossi',
      email: 'isabella.rossi@student.radiance.edu',
      password: 'student123',
      phone: '+1-555-1014',
      address: '505 Learner Plaza, Education City, EC 12345',
      dateOfBirth: new Date('1994-09-16'),
      notes: 'Target band 7.0, career changer, motivated by professional goals'
    },
    {
      name: 'David Kim',
      email: 'david.kim@student.radiance.edu',
      password: 'student123',
      phone: '+1-555-1015',
      address: '606 Knowledge Court, Education City, EC 12345',
      dateOfBirth: new Date('1992-12-03'),
      notes: 'Target band 8.0, software engineer, needs speaking practice'
    }
  ]

  for (const studentData of studentUsers) {
    const existingStudent = await prisma.user.findUnique({
      where: { email: studentData.email }
    })

    if (!existingStudent) {
      const hashedPassword = await hashPassword(studentData.password)
      const student = await prisma.user.create({
        data: {
          name: studentData.name,
          email: studentData.email,
          passwordHash: hashedPassword,
          role: UserRole.STUDENT,
          phone: studentData.phone,
          dateOfBirth: studentData.dateOfBirth,
          address: studentData.address,
          notes: studentData.notes
        }
      })
      console.log(`✅ Created Student: ${student.name} (${student.email})`)
    } else {
      console.log(`⏭️  Student already exists: ${studentData.email}`)
    }
  }

  // Display summary
  const userCounts = await prisma.user.groupBy({
    by: ['role'],
    _count: {
      role: true
    }
  })

  console.log('\n📊 User Seeding Summary:')
  userCounts.forEach(count => {
    console.log(`   ${count.role}: ${count._count.role} users`)
  })

  const totalUsers = await prisma.user.count()
  console.log(`   Total: ${totalUsers} users`)

  console.log('\n🎉 User seeding completed successfully!')
  console.log('\n🔐 Login Credentials:')
  console.log('👑 Admin: admin@radiance.edu / admin123')
  console.log('👑 Admin: coordinator@radiance.edu / coord123')
  console.log('🎓 Instructor: instructor@radiance.edu / instructor123')
  console.log('🎓 Instructors: [name]@radiance.edu / instructor123')
  console.log('📚 Students: [name]@student.radiance.edu / student123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding users:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
