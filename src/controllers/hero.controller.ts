import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { HttpError } from '../utils/http-error.js';
import { buildPaginationMeta, getPagination } from '../utils/pagination.js';
import { sendSuccess } from '../utils/response.js';
import { Lane, Role } from '../generated/prisma/enums.js';

function readHeroId(value: string | string[]): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);
  if (!raw || !Number.isInteger(id) || id <= 0) {
    throw new HttpError(404, 'Hero tidak ditemukan');
  }
  return id;
}

export async function getHeroes(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req.query);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const role = typeof req.query.role === 'string' ? req.query.role.toUpperCase() : '';

  if (role && !Object.values(Role).includes(role as Role)) {
    throw new HttpError(400, 'Role hero tidak valid');
  }

  const where = {
    ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
    ...(role && { role: role as Role }),
  };

  const [heroes, totalItems] = await Promise.all([
    prisma.hero.findMany({ where, skip, take: limit, orderBy: { id: 'asc' } }),
    prisma.hero.count({ where }),
  ]);

  sendSuccess(res, {
    message: 'Berhasil mengambil data hero',
    data: heroes,
    metadata: buildPaginationMeta(page, limit, totalItems),
  });
}

export async function getHero(req: Request, res: Response) {
  const hero = await prisma.hero.findUnique({
    where: { id: readHeroId(req.params.hero_id) },
    include: { skins: { orderBy: { id: 'asc' } } },
  });

  if (!hero) throw new HttpError(404, 'Hero tidak ditemukan');

  sendSuccess(res, { message: 'Berhasil mengambil detail hero', data: hero });
}

export async function createHero(req: Request, res: Response) {
  const body = req.body as Record<string, unknown> | undefined;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const role = body?.role;
  const lane = body?.lane;
  const releaseYear = body?.releaseYear;

  if (!name || !role || !lane || releaseYear === undefined || releaseYear === null || releaseYear === '') {
    throw new HttpError(400, 'Name, role, lane, dan releaseYear wajib diisi');
  }
  if (!Object.values(Role).includes(role as Role) || !Object.values(Lane).includes(lane as Lane)) {
    throw new HttpError(400, 'Role atau lane tidak valid');
  }
  if (!Number.isInteger(releaseYear) || (releaseYear as number) <= 0) {
    throw new HttpError(400, 'releaseYear harus bilangan bulat positif');
  }

  function readPrice(value: unknown, label: string): number | null {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
      throw new HttpError(400, `${label} harus bilangan bulat tidak negatif atau null`);
    }
    return value;
  }

  const priceBP = readPrice(body?.priceBP, 'priceBP');
  const priceDiamond = readPrice(body?.priceDiamond, 'priceDiamond');
  const existing = await prisma.hero.findUnique({ where: { name } });
  if (existing) throw new HttpError(409, 'Nama hero sudah ada');

  // Penanganan konflik unik tambahan jika ada request bersamaan.
  try {
    const hero = await prisma.hero.create({
      data: { name, role: role as Role, lane: lane as Lane, releaseYear: releaseYear as number, priceBP, priceDiamond },
    });
    sendSuccess(res, { statusCode: 201, message: 'Hero berhasil ditambahkan', data: hero });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new HttpError(409, 'Nama hero sudah ada');
    }
    throw error;
  }
}
