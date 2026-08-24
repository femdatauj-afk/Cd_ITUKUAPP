import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
const adapter = databaseUrl.startsWith('postgresql://')
  ? new PrismaPg({ connectionString: databaseUrl })
  : new PrismaBetterSqlite3({ url: databaseUrl.replace(/^file:/, '') });

const prisma = new PrismaClient({
  adapter,
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

  const communityModeratorAccounts = [
    { email: 'moderator.amokolo@ituku.app', username: 'ModeratorAmokolo', fullName: 'Amokolo Community Moderator', village: 'Amokolo', phone: '08030020001', sex: 'other', role: 'moderator', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Assigned moderator for Amokolo community.' },
    { email: 'moderator.umukulu@ituku.app', username: 'ModeratorUmukulu', fullName: 'Umukulu Community Moderator', village: 'Umukulu', phone: '08030020002', sex: 'other', role: 'moderator', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Assigned moderator for Umukulu community.' },
    { email: 'moderator.ugwunagbo@ituku.app', username: 'ModeratorUgwunagbo', fullName: 'Ugwunagbo Community Moderator', village: 'Ugwunagbo', phone: '08030020003', sex: 'other', role: 'moderator', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Assigned moderator for Ugwunagbo community.' },
    { email: 'moderator.okwenachala@ituku.app', username: 'ModeratorOkwenachala', fullName: 'Okwenachala Community Moderator', village: 'Okwenachala', phone: '08030020004', sex: 'other', role: 'moderator', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Assigned moderator for Okwenachala community.' },
    { email: 'moderator.ofeinyi@ituku.app', username: 'ModeratorOfeinyi', fullName: 'Ofeinyi Community Moderator', village: 'Ofeinyi', phone: '08030020005', sex: 'other', role: 'moderator', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Assigned moderator for Ofeinyi community.' },
    { email: 'moderator.amata@ituku.app', username: 'ModeratorAmata', fullName: 'Amata Community Moderator', village: 'Amata', phone: '08030020006', sex: 'other', role: 'moderator', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Assigned moderator for Amata community.' },
    { email: 'moderator.umunevonta@ituku.app', username: 'ModeratorUmunevonta', fullName: 'Umunevonta Community Moderator', village: 'Umunevonta', phone: '08030020007', sex: 'other', role: 'moderator', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Assigned moderator for Umunevonta community.' },
    { email: 'moderator.umuowoh@ituku.app', username: 'ModeratorUmuowoh', fullName: 'Umuowoh Community Moderator', village: 'Umuowoh', phone: '08030020008', sex: 'other', role: 'moderator', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Assigned moderator for Umuowoh community.' },
    { email: 'moderator.umuonyiba@ituku.app', username: 'ModeratorUmuonyiba', fullName: 'Umuonyiba Community Moderator', village: 'Umuonyiba', phone: '08030020009', sex: 'other', role: 'moderator', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Assigned moderator for Umuonyiba community.' },
    { email: 'ituku.bolt@ituku.app', username: 'ItukuBolt', fullName: 'Ituku Bolt Customer Service', village: 'ItukuHQ', phone: '08030020010', sex: 'other', role: 'admin', isVerified: true, verifiedBadge: 'ItukuApp Verified', bio: 'Customer service and platform operations account.' },
  ];

  const developer = await prisma.user.findFirst({ where: { email: 'henry4683328@gmail.com' } });
  const passwordHash = await bcrypt.hash(password, 10);

  const createdUsers: Array<{ id: string; username: string; role: string }> = [];

  for (const account of [...seededAccounts, ...communityModeratorAccounts]) {
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

  const communityAssignments = [
    ['AMOKOLO', 'ModeratorAmokolo'],
    ['UMUKULU', 'ModeratorUmukulu'],
    ['UGWUNAGBO', 'ModeratorUgwunagbo'],
    ['OKWENACHALA', 'ModeratorOkwenachala'],
    ['OFEINYI', 'ModeratorOfeinyi'],
    ['AMATA', 'ModeratorAmata'],
    ['UMUNEVONTA', 'ModeratorUmunevonta'],
    ['UMUOWOH', 'ModeratorUmuowoh'],
    ['UMUONYIBA', 'ModeratorUmuonyiba'],
  ];

  for (const [name, username] of communityAssignments) {
    const moderator = await prisma.user.findUnique({ where: { username } });
    if (!moderator) continue;
    const community = await prisma.community.upsert({
      where: { slug: name.toLowerCase() },
      update: { name },
      create: { name, slug: name.toLowerCase() },
    });
    await prisma.communityMember.upsert({
      where: { communityId_userId: { communityId: community.id, userId: moderator.id } },
      update: { role: 'moderator' },
      create: { communityId: community.id, userId: moderator.id, role: 'moderator' },
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
