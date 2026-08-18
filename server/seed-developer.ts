import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: 'file:./dev.db',
  }),
});

async function main() {
  const password = 'slimkid0042';
  const seededAccounts = [
    { email: 'henry4683328@gmail.com', username: 'Henry-Of-Ituku', fullName: 'Chinedu Henry Ujam', village: 'Umukulu', phone: '08142229477', sex: 'male', role: 'developer', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Verified founder and lead developer of ItukuApp.' },
    { email: 'amina.ede@ituku.app', username: 'AminaEde', fullName: 'Amina Ede', village: 'Umukulu', phone: '08030010001', sex: 'female', role: 'moderator', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Community leader focused on youth growth and education.' },
    { email: 'tochukwu.agwu@ituku.app', username: 'TochukwuAgwu', fullName: 'Tochukwu Agwu', village: 'Umukulu', phone: '08030010002', sex: 'male', role: 'moderator', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Volunteer mentor and event organizer.' },
    { email: 'nneka.egbu@ituku.app', username: 'NnekaEgbu', fullName: 'Nneka Egbu', village: 'Ugwunagbo', phone: '08030010003', sex: 'female', role: 'moderator', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Village project coordinator and civic advocate.' },
    { email: 'chima.okafor@ituku.app', username: 'ChimaOkafor', fullName: 'Chima Okafor', village: 'Okwenachala', phone: '08030010004', sex: 'male', role: 'moderator', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Community organizer and local development advocate.' },
    { email: 'ada.okoye@ituku.app', username: 'AdaOkoye', fullName: 'Ada Okoye', village: 'Ugwunagbo', phone: '08030010005', sex: 'female', role: 'moderator', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Youth chairman creating safe spaces for local engagement.' },
    { email: 'ifeoma.eze@ituku.app', username: 'IfeomaEze', fullName: 'Ifeoma Eze', village: 'Amokolo', phone: '08030010006', sex: 'female', role: 'member', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Mentor and digital literacy volunteer.' },
    { email: 'kelechi.nnaji@ituku.app', username: 'KelechiNnaji', fullName: 'Kelechi Nnaji', village: 'Amokolo', phone: '08030010007', sex: 'male', role: 'member', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Community member passionate about local commerce.' },
    { email: 'rose.nwoko@ituku.app', username: 'RoseNwoko', fullName: 'Rose Nwoko', village: 'Umukulu', phone: '08030010008', sex: 'female', role: 'member', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Supports family wellbeing and community care programs.' },
    { email: 'musa.nwachukwu@ituku.app', username: 'MusaNwachukwu', fullName: 'Musa Nwachukwu', village: 'Umukulu', phone: '08030010009', sex: 'male', role: 'member', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Student and community volunteer.' },
  ];

  const developer = await prisma.user.findFirst({ where: { email: 'henry4683328@gmail.com' } });
  const passwordHash = await bcrypt.hash(password, 10);

  const createdUsers: Array<{ id: string; username: string; role: string }> = [];

  for (const account of seededAccounts) {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: account.email }, { username: account.username }] },
    });

    const userData = {
      email: account.email,
      username: account.username,
      passwordHash,
      fullName: account.fullName,
      village: account.village,
      phone: account.phone,
      sex: account.sex,
      bio: account.bio,
      role: account.role,
      isActive: true,
      verificationStatus: 'active',
      emailVerified: true,
      phoneVerified: true,
      isVerified: account.isVerified,
      verifiedBadge: account.verifiedBadge,
      usernameUpdatedAt: new Date('2025-01-01T00:00:00.000Z'),
      accountExpiresAt: null,
    };

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: userData,
        })
      : await prisma.user.create({ data: userData });

    createdUsers.push({ id: user.id, username: user.username, role: user.role });

    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: { balance: 1000000 },
      create: { userId: user.id, balance: 1000000 },
    });
  }

  if (developer) {
    for (const user of createdUsers.filter((item) => item.id !== developer.id)) {
      const existingFollow = await prisma.follow.findFirst({
        where: {
          followerId: user.id,
          followedId: developer.id,
        },
      });

      if (!existingFollow) {
        await prisma.follow.create({
          data: {
            followerId: user.id,
            followedId: developer.id,
          },
        });
      }
    }
  }

  console.log('Seeded developer and community accounts with wallet balances and verified status.');
  console.log(createdUsers.map((user) => ({ username: user.username, role: user.role })));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
