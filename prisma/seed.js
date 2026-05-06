const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create test user
  await prisma.user.upsert({
    where: { username: 'ADM-1234' },
    update: {},
    create: {
      role: 'Admin',
      username: 'ADM-1234',
      password: 'password123',
    },
  });

  // Create initial property units
  const units = [
    { unitId: '402', floor: '4th Floor', type: '3BHK Suite', area: '2,450 SqFt', price: '₹4.2 Cr', status: 'AVAILABLE', tagColor: 'green', img: '/images/unit_interior_1777642600392.png' },
    { unitId: '201', floor: '2nd Floor', type: '2BHK Studio', area: '1,620 SqFt', price: '₹3.1 Cr', status: 'RESERVED', tagColor: 'blue', img: '/images/unit_interior_1777642600392.png' },
    { unitId: '705', floor: '7th Floor', type: 'Sky Collection', area: '3,200 SqFt', price: '₹6.8 Cr', status: 'AVAILABLE', tagColor: 'green', img: '/images/unit_interior_1777642600392.png' },
    { unitId: '102', floor: 'Ground Floor', type: 'Terrace Villa', area: '4,100 SqFt', price: '₹9.2 Cr', status: 'SOLD OUT', tagColor: 'red', img: '/images/unit_interior_1777642600392.png' },
  ];

  for (const unit of units) {
    await prisma.propertyUnit.upsert({
      where: { unitId: unit.unitId },
      update: {},
      create: unit,
    });
  }

  // Create some initial inquiries
  await prisma.inquiry.create({
    data: { name: 'Aryan Sharma', email: 'aryan@example.com', phone: '9876543210', source: 'QR Scan', status: 'New' }
  });
  
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
