const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function createSuperAdmin() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Creating Super Admin...');
    
    // First, check if super admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });
    
    if (existingAdmin) {
      console.log('⚠️  Super Admin already exists, deleting...');
      await prisma.user.delete({
        where: { id: existingAdmin.id }
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create super admin
    const superAdmin = await prisma.user.create({
      data: {
        email: 'admin@estateai.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        isActive: true
      }
    });
    
    console.log('✅ Super Admin created successfully!');
    console.log('📧 Email: admin@estateai.com');
    console.log('🔑 Password: admin123');
    
    // Test the created user
    const testUser = await prisma.user.findUnique({
      where: { email: 'admin@estateai.com' }
    });
    
    if (testUser) {
      console.log('✅ User verification successful!');
      console.log('👤 User ID:', testUser.id);
      console.log('🏷️  Role:', testUser.role);
      console.log('✅ Active:', testUser.isActive);
    } else {
      console.log('❌ User verification failed!');
    }
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();