import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './src/config/db.js';
import Admin from './src/models/Admin.js';
import { hashPassword } from './src/services/authService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false });

const seedAdmin = async () => {
  try {
    await connectDB();

    const username = 'admin';
    const password = 'admin123';
    const email = (
      process.env.ADMIN_EMAIL
      || 'launchmyportfolio@gmail.com'
    ).trim().toLowerCase();

    const existing = await Admin.findOne({ username });
    if (existing) {
      console.log('Admin already exists');
      process.exit(0);
    }

    const passwordHash = await hashPassword(password);
    await Admin.create({
      username,
      passwordHash,
      role: 'admin',
      email,
    });

    console.log('Default admin created: admin / admin123');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin user', error);
    process.exit(1);
  }
};

seedAdmin();
