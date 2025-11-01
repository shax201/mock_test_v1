import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@radiance.edu' },
    update: {},
    create: {
      email: 'admin@radiance.edu',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  })

  // Create instructor user
  const instructorPassword = await bcrypt.hash('instructor123', 12)
  
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@radiance.edu' },
    update: {},
    create: {
      email: 'instructor@radiance.edu',
      passwordHash: instructorPassword,
      role: UserRole.INSTRUCTOR,
    },
  })

  console.log('Seeded users:', { admin, instructor })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
