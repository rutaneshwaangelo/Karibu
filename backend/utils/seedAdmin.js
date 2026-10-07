const dotenv = require('dotenv');
const connectDB = require('../config/db');
const { User, Category } = require('../models');

dotenv.config();

const initialCategories = [
  {
    name: 'Hair, Beauty & Grooming',
    description: 'Salons, barbershops, spas, nail bars and wellness centers',
  },
  {
    name: 'Healthcare & Clinics',
    description: 'Medical practices, dental clinics, consultancies and labs',
  },
  {
    name: 'Banking & Financial Services',
    description: 'Branch banking, account desks, loan processing and advisory',
  },
  {
    name: 'Government & Public Services',
    description: 'Civil registration, passport offices, licensing and permits',
  },
  {
    name: 'Automotive & Repair',
    description: 'Vehicle maintenance, tire fitting, auto diagnostics and wash',
  },
];

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seeder] Connected to MongoDB...');

    // 1. Seed Platform Admin
    const adminEmail = 'admin@karibu.com';
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      admin = await User.create({
        name: 'KARIBU System Admin',
        email: adminEmail,
        password: 'Admin@Karibu2026!',
        role: 'ADMIN',
        active: true,
      });
      console.log(`[Seeder] Created default ADMIN: ${adminEmail} (Password: Admin@Karibu2026!)`);
    } else {
      console.log(`[Seeder] Default ADMIN already exists: ${adminEmail}`);
    }

    // 2. Seed Default Categories
    for (const catData of initialCategories) {
      const exists = await Category.findOne({ name: catData.name });
      if (!exists) {
        await Category.create(catData);
        console.log(`[Seeder] Seeded Category: "${catData.name}"`);
      }
    }

    console.log('[Seeder] Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder] Error seeding data:', error.message);
    process.exit(1);
  }
};

seedData();
