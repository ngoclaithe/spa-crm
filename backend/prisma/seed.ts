import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Danh mục màn 8 — theo sổ dịch vụ (loại + chi tiết).
 * Chạy lại `npx prisma db seed` an toàn: không tạo bản ghi trùng tên.
 */
const CATALOG: {
  category: string;
  sortOrder: number;
  services: { name: string; defaultPrice: number }[];
}[] = [
  {
    category: 'Triệt Lông',
    sortOrder: 0,
    services: [
      { name: 'Triệt Nách', defaultPrice: 400_000 },
      { name: 'Triệt Tay', defaultPrice: 500_000 },
      { name: 'Triệt Chân', defaultPrice: 600_000 },
      { name: 'Triệt Lông Full Body', defaultPrice: 1_200_000 },
    ],
  },
  {
    category: 'Nặn Mụn',
    sortOrder: 1,
    services: [
      { name: 'Nặn Mụn Cơ Bản', defaultPrice: 200_000 },
      { name: 'Nặn Mụn Chuyên Sâu', defaultPrice: 350_000 },
      { name: 'Nặn Mụn + Mask', defaultPrice: 300_000 },
      { name: 'Nặn Mụn + Điện Di', defaultPrice: 400_000 },
      { name: 'Nặn Mụn Lưng', defaultPrice: 250_000 },
      { name: 'Nặn Mụn Full Body', defaultPrice: 1_000_000 },
    ],
  },
  {
    category: 'Combo',
    sortOrder: 2,
    services: [{ name: 'Combo Nặn Mụn Chuyên Sâu', defaultPrice: 800_000 }],
  },
];

async function main() {
  const salesChannels: { name: string; sortOrder: number }[] = [
    { name: 'Facebook', sortOrder: 0 },
    { name: 'Zalo', sortOrder: 1 },
    { name: 'Tiktok', sortOrder: 2 },
    { name: 'Khách trực tiếp', sortOrder: 3 },
    { name: 'Khách giới thiệu', sortOrder: 4 },
  ];
  for (const c of salesChannels) {
    const ex = await prisma.salesChannel.findFirst({ where: { name: c.name } });
    if (!ex) {
      await prisma.salesChannel.create({ data: { name: c.name, sortOrder: c.sortOrder, active: true } });
    } else {
      await prisma.salesChannel.update({ where: { id: ex.id }, data: { sortOrder: c.sortOrder, active: true } });
    }
  }

  for (const block of CATALOG) {
    let category = await prisma.serviceCategory.findFirst({ where: { name: block.category } });
    if (!category) {
      category = await prisma.serviceCategory.create({
        data: { name: block.category, sortOrder: block.sortOrder, active: true },
      });
    } else {
      await prisma.serviceCategory.update({
        where: { id: category.id },
        data: { sortOrder: block.sortOrder },
      });
    }

    for (const s of block.services) {
      const ex = await prisma.service.findFirst({
        where: { categoryId: category.id, name: s.name },
      });
      if (!ex) {
        await prisma.service.create({
          data: {
            categoryId: category.id,
            name: s.name,
            defaultPrice: s.defaultPrice,
            active: true,
          },
        });
      }
    }
  }
}

main()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log(
      'Seeded: 5 kênh bán + %d loại, %d chi tiết dịch vụ',
      CATALOG.length,
      CATALOG.reduce((a, b) => a + b.services.length, 0),
    );
  })
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    return prisma.$disconnect();
  });
