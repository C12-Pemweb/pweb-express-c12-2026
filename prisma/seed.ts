import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import prisma from '../src/lib/prisma.js';
import { Currency, type Lane, type Rarity, type Role } from '../src/generated/prisma/enums.js';

interface HeroSeed {
  name: string;
  role: Role;
  lane: Lane;
  releaseYear: number;
  priceBP: number | null;
  priceDiamond: number | null;
}

interface SkinSeed {
  name: string;
  heroId: number;
  rarity: Rarity;
  priceDiamond: number | null;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), 'data', file), 'utf8')) as T;
}

const heroes = readJson<HeroSeed[]>('heroes.json');
const skins = readJson<SkinSeed[]>('skins.json');

async function main() {
  await prisma.$executeRaw`TRUNCATE "PlayerHero", "Player", "Skin", "Hero" RESTART IDENTITY CASCADE`;

  await prisma.hero.createMany({ data: heroes });
  await prisma.skin.createMany({ data: skins });

  await prisma.player.createMany({
    data: [
      { nickname: 'ArekITS', bp: 1500, diamond: 75 },
      { nickname: 'SangPushRank', bp: 13000, diamond: 2892 },
      { nickname: 'MageSurabaya', bp: 10000, diamond: 0 },
    ],
  });

  await prisma.playerHero.createMany({
    data: [
      { playerId: 1, heroId: 18, currency: Currency.BP, pricePaid: 2000 },
      { playerId: 1, heroId: 1, currency: Currency.BP, pricePaid: 10800 },
      { playerId: 2, heroId: 84, currency: Currency.DIAMOND, pricePaid: 599 },
      { playerId: 2, heroId: 56, currency: Currency.BP, pricePaid: 32000 },
    ],
  });

  const [heroCount, skinCount, playerCount, ownedCount] = await Promise.all([
    prisma.hero.count(),
    prisma.skin.count(),
    prisma.player.count(),
    prisma.playerHero.count(),
  ]);

  console.log(
    `Seed selesai: ${heroCount} hero, ${skinCount} skin, ${playerCount} player, ${ownedCount} player hero`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
