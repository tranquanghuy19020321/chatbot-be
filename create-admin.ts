import { AppDataSource } from './src/database/data-source';
import { User, UserRole } from './src/users/entities/user.entity';
import { hash } from 'bcrypt';

async function createAdminUser() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    const userRepository = AppDataSource.getRepository(User);

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@example.com' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      await AppDataSource.destroy();
      return;
    }

    // Create admin user
    const hashedPassword = await hash('admin123', 10);
    
    const adminUser = userRepository.create({
      email: 'admin@example.com',
      name: 'System Administrator',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    });

    await userRepository.save(adminUser);
    console.log('Admin user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();