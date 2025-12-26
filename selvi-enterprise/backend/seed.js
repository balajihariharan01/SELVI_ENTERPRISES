const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Product = require('./models/Product');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user (password will be hashed by User model)
    const admin = await User.create({
      name: 'Anandan S',
      email: 'selvienterprises.ooty@gmail.com',
      phone: '6380470432',
      password: 'Selvi@1980',
      role: 'admin'
    });
    console.log('✅ Admin user created: admin@selvi.com / admin123');



    console.log('✅ Sample customer created: customer@example.com / user123');


    console.log('\n🎉 Database seeded successfully!');
    console.log('\n--- Login Credentials ---');
    console.log('Admin: admin@selvi.com / admin123');
    console.log('Customer: customer@example.com / user123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
