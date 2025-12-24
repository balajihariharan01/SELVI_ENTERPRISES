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
      name: 'Admin',
      email: 'admin@selvi.com',
      phone: '9876543210',
      password: 'admin123',
      role: 'admin'
    });
    console.log('✅ Admin user created: admin@selvi.com / admin123');

    // Create additional admin user
    await User.create({
      name: 'Manager',
      email: 'manager@selvi.com',
      phone: '9876543212',
      password: 'admin@123',
      role: 'admin'
    });
    console.log('✅ Additional admin user created: manager@selvi.com / admin@123');

    // Create sample customer
    await User.create({
      name: 'Sample Customer',
      email: 'customer@example.com',
      phone: '9876543211',
      password: 'user123',
      role: 'user',
      address: {
        street: '123 Main Street',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001'
      }
    });
    console.log('✅ Sample customer created: customer@example.com / user123');

    // Create sample products - Cement
    const cementProducts = [
      {
        productName: 'UltraTech Cement PPC',
        category: 'cement',
        brand: 'UltraTech',
        description: 'Portland Pozzolana Cement - Ideal for all construction purposes',
        price: 420,
        stockQuantity: 500,
        unit: 'bags',
        minOrderQuantity: 10,
        status: 'active',
        image: 'https://www.ultratechcement.com/content/dam/ultratechcementwebsite/images/products/ultratech-cement-ppc/UltraTech-Cement-PPC.png'
      },
      {
        productName: 'ACC Gold Cement',
        category: 'cement',
        brand: 'ACC',
        description: 'Premium quality cement for strong construction',
        price: 410,
        stockQuantity: 350,
        unit: 'bags',
        minOrderQuantity: 10,
        status: 'active',
        image: 'https://www.acclimited.com/assets/images/products/acc-gold-cement.png'
      },
      {
        productName: 'Ambuja Cement OPC 53',
        category: 'cement',
        brand: 'Ambuja',
        description: 'Ordinary Portland Cement 53 Grade - High strength cement',
        price: 440,
        stockQuantity: 200,
        unit: 'bags',
        minOrderQuantity: 10,
        status: 'active',
        image: 'https://www.ambujacement.com/-/media/Project/AmbujaCement/Ambuja/Products/Ambuja-Cement-OPC-53-Grade.jpg'
      },
      {
        productName: 'Dalmia Cement DSP',
        category: 'cement',
        brand: 'Dalmia',
        description: 'Dalmia Special Purpose cement for specialized construction',
        price: 430,
        stockQuantity: 150,
        unit: 'bags',
        minOrderQuantity: 10,
        status: 'active',
        image: 'https://m.media-amazon.com/images/I/51AoN1kEKtL._AC_UF894,1000_QL80_.jpg'
      },
      {
        productName: 'Ramco Supergrade Cement',
        category: 'cement',
        brand: 'Ramco',
        description: 'Super grade cement for superior strength',
        price: 415,
        stockQuantity: 8,
        unit: 'bags',
        minOrderQuantity: 10,
        lowStockThreshold: 20,
        status: 'active',
        image: 'https://5.imimg.com/data5/SELLER/Default/2023/1/QG/XH/GM/42837802/ramco-supergrade-cement-500x500.jpg'
      },
      {
        productName: 'Indian Cement',
        category: 'cement',
        brand: 'Indian Cement',
        description: 'Concrete Super King - Premium quality cement from India Cements',
        price: 410,
        stockQuantity: 300,
        unit: 'bags',
        minOrderQuantity: 10,
        status: 'active',
        image: 'https://www.indiacements.co.in/images/products/super-king.png'
      }
    ];

    // Create sample products - Steel
    const steelProducts = [
      {
        productName: 'TATA Tiscon 8mm TMT Bar',
        category: 'steel',
        brand: 'TATA',
        description: 'High strength TMT reinforcement bar - 8mm diameter',
        price: 65,
        stockQuantity: 1000,
        unit: 'kg',
        minOrderQuantity: 100,
        status: 'active',
        image: 'https://www.tatasteel.com/media/15728/tata-tiscon-3.jpg'
      },
      {
        productName: 'TATA Tiscon 10mm TMT Bar',
        category: 'steel',
        brand: 'TATA',
        description: 'High strength TMT reinforcement bar - 10mm diameter',
        price: 68,
        stockQuantity: 800,
        unit: 'kg',
        minOrderQuantity: 100,
        status: 'active',
        image: 'https://5.imimg.com/data5/SELLER/Default/2021/6/PB/ZS/MB/131261261/tata-tiscon-tmt-bars.jpg'
      },
      {
        productName: 'TATA Tiscon 12mm TMT Bar',
        category: 'steel',
        brand: 'TATA',
        description: 'High strength TMT reinforcement bar - 12mm diameter',
        price: 70,
        stockQuantity: 600,
        unit: 'kg',
        minOrderQuantity: 100,
        status: 'active',
        image: 'https://5.imimg.com/data5/SELLER/Default/2022/3/XE/HE/FT/147583067/tata-tiscon-12mm-tmt-bar.jpg'
      },
      {
        productName: 'JSW Steel 10mm TMT Bar',
        category: 'steel',
        brand: 'JSW',
        description: 'Premium quality TMT bar - 10mm diameter',
        price: 66,
        stockQuantity: 500,
        unit: 'kg',
        minOrderQuantity: 100,
        status: 'active',
        image: 'https://5.imimg.com/data5/SELLER/Default/2022/10/PP/CR/TE/12345678/jsw-tmt-steel-bar.jpg'
      },
      {
        productName: 'Vizag Steel 8mm TMT Bar',
        category: 'steel',
        brand: 'Vizag',
        description: 'RINL Vizag TMT bar - 8mm diameter',
        price: 62,
        stockQuantity: 5,
        unit: 'kg',
        minOrderQuantity: 100,
        lowStockThreshold: 50,
        status: 'active',
        image: 'https://5.imimg.com/data5/SELLER/Default/2023/3/294847236/VL/PN/UJ/5815076/vizag-tmt-steel-bars.jpg'
      },
      {
        productName: 'SAIL Steel 16mm TMT Bar',
        category: 'steel',
        brand: 'SAIL',
        description: 'Heavy duty TMT bar for foundation - 16mm diameter',
        price: 72,
        stockQuantity: 400,
        unit: 'kg',
        minOrderQuantity: 100,
        status: 'active',
        image: 'https://5.imimg.com/data5/SELLER/Default/2020/11/RZ/WM/XA/117091684/sail-tmt-bar.jpg'
      }
    ];

    await Product.insertMany([...cementProducts, ...steelProducts]);
    console.log('✅ Sample products created');

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
