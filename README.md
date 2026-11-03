# MLBB Shop — pweb-express-c12-2026

Backend Express untuk toko Diamond & Battle Point Mobile Legends. Dibuat untuk Praktikum Pemrograman Web Modul 4 (Kelompok 12).

## Tech Stack

- **Express 5** + **TypeScript**
- **Prisma ORM 7** (`prisma-client` generator)
- **PostgreSQL di Neon** melalui `@prisma/adapter-neon`

## Fitur

1. Middleware: logger request, `HttpError` + `errorHandler`, `notFound` (404)
2. Hero: daftar (pagination, search, role), detail + skin, tambah hero
3. Skin: daftar (pagination, filter hero & rarity), detail
4. Player: create, detail (beserta hero yang dimiliki), update nickname, delete
5. Top Up Diamond dan hadiah Match (WIN/LOSE)
6. Beli hero dengan BP atau Diamond (transaksi)
7. Statistik toko

## Struktur Folder

```
prisma/
  schema.prisma      # model Hero, Skin, Player, PlayerHero + 4 enum
  seed.ts            # TRUNCATE + seed hero, skin, player, player hero
  migrations/
data/
  heroes.json        # 133 hero
  skins.json         # 892 skin
src/
  controllers/       # handler endpoint
  lib/prisma.ts      # PrismaClient + Neon adapter
  middleware/        # logger, notFound, errorHandler
  routes/            # definisi route
  utils/             # HttpError, response, pagination
  app.ts             # setup Express
  index.ts           # entry point
```

## Menjalankan Project

### 1. Install dependency

```bash
npm install
```

> Jika environment kamu menset `NODE_ENV=production`, gunakan `npm install --include=dev` agar TypeScript dan tsx ikut terpasang.

### 2. Siapkan database Neon

Buat project di [Neon](https://console.neon.tech), lalu salin dua connection string dari menu **Connect**:

```env
PORT=3000
DATABASE_URL="postgresql://...@ep-xxx-pooler...neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://...@ep-xxx...neon.tech/neondb?sslmode=require"
```

- `DATABASE_URL` — pooled (host mengandung `-pooler`), dipakai aplikasi lewat adapter Neon
- `DIRECT_URL` — direct, dipakai Prisma CLI untuk migrasi

`.env` tidak boleh di-commit; gunakan `.env.example` sebagai acuan.

### 3. Migrasi dan generate client

```bash
npx prisma migrate dev --name init
npx prisma generate   # biasanya otomatis setelah migrate
```

### 4. Seed database

```bash
npx tsx prisma/seed.ts
```

Hasil yang diharapkan: **133 hero, 892 skin, 3 player, 4 player hero**. Cek dengan `npx prisma studio`.

### 5. Jalankan server

```bash
npm run dev
```

Buka `http://localhost:3000/health` — harus muncul:

```json
{ "status": true, "message": "Server berjalan dengan baik", "data": null }
```

## Format Response

Sukses:

```json
{
  "status": true,
  "message": "Berhasil mengambil data hero",
  "data": [],
  "metadata": { "currentPage": 1, "limit": 10, "totalItems": 133, "totalPages": 14 }
}
```

Gagal:

```json
{ "status": false, "message": "Hero tidak ditemukan" }
```

`metadata` hanya ada pada endpoint dengan pagination.

## Daftar Endpoint

| Metode | Endpoint | Keterangan |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/heroes` | Daftar hero (`page`, `limit`, `search`, `role`) |
| GET | `/api/heroes/:hero_id` | Detail hero + skin |
| POST | `/api/heroes` | Tambah hero |
| GET | `/api/skins` | Daftar skin (`page`, `limit`, `heroId`, `rarity`) |
| GET | `/api/skins/:skin_id` | Detail skin + hero |
| POST | `/api/players` | Buat player |
| GET | `/api/players/:player_id` | Detail player + hero dimiliki |
| PATCH | `/api/players/:player_id` | Ubah nickname |
| DELETE | `/api/players/:player_id` | Hapus player |
| POST | `/api/players/:player_id/topup` | Top up Diamond |
| POST | `/api/players/:player_id/matches` | Catat hasil match |
| POST | `/api/players/:player_id/heroes` | Beli hero (BP/Diamond) |
| GET | `/api/statistics` | Statistik toko |

Seluruh request/response detail ada di `mlbb-shop-testcase.postman_collection.json`.

## Data Seed

| id | nickname | bp | diamond |
|---|---|---|---|
| 1 | ArekITS | 1500 | 75 |
| 2 | SangPushRank | 13000 | 2892 |
| 3 | MageSurabaya | 10000 | 0 |

| playerId | heroId | currency | pricePaid |
|---|---|---|---|
| 1 | 18 (Layla) | BP | 2000 |
| 1 | 1 (Miya) | BP | 10800 |
| 2 | 84 (Ling) | DIAMOND | 599 |
| 2 | 56 (Gusion) | BP | 32000 |

## Catatan

- Jalankan `npx tsx prisma/seed.ts` sebelum demo agar data kembali ke kondisi awal.
- Client Prisma di-generate ke `src/generated/prisma` dan tidak di-commit. Jalankan `npx prisma generate` setelah clone atau setelah mengubah schema.
