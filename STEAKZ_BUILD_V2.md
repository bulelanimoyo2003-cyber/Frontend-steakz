# Steakz Restaurant Portal — Build Instructions v2

> **Agent directive:** Read this entire file before writing a single line of code.
> Build every section in order. Do not skip steps. Do not invent requirements.
> When a file is complete, confirm it exists before moving to the next task.

---

## 0. Project context

You are building **Steakz** — a full-stack restaurant management portal for a chain with **7 branches**.

| Layer | Stack |
|---|---|
| Backend | Express 5 · Prisma 6 · PostgreSQL · TypeScript · JWT |
| Frontend | React 19 · React Router 7 · Vite 8 · Axios |
| Auth | JWT stored in `localStorage`, branch-scoped tokens |
| Theme | Dark luxury — deep charcoal + aged cognac/amber (Playfair Display + DM Sans) |

### The 7 branches (seed these exactly)

1. Steakz City Centre — 1 Main Street, City Centre
2. Steakz Northside — 45 North Ave, Northside
3. Steakz Southgate — 88 South Road, Southgate
4. Steakz East Quarter — 12 East Lane, East Quarter
5. Steakz Westfield — 200 West Mall, Westfield
6. Steakz Marina Bay — 9 Marina Blvd, Marina Bay
7. Steakz Uptown — 77 Uptown Drive, Uptown

### The 7 roles

| Role | branchId in token | Scope |
|---|---|---|
| `ADMIN` | `null` | Global — all branches, all users |
| `HQ_MANAGER` | `null` | Global read — sales, staff, orders across all branches |
| `BRANCH_MANAGER` | required | Read/write own branch only |
| `CHEF` | required | Own branch orders + menu delete |
| `CASHIER` | required | Own branch order creation + delivery |
| `CUSTOMER` | `null` | Own bookings + orders |
| Public / Guest | — | Browse menu + branches, no booking |

---

## 1. Repository scaffold

```bash
mkdir steakz && cd steakz
mkdir backend frontend
```

---

## 2. Backend

### 2.1 Initialise

```bash
cd backend
npm init -y
npm install express@^5.2.1 @prisma/client@^6.19.3 bcryptjs@^3.0.3 \
  jsonwebtoken@^9.0.3 cors@^2.8.6 dotenv@^16.6.1
npm install --save-dev prisma@^6.19.3 typescript@^6.0.2 tsx@^4.21.0 \
  nodemon@^3.1.14 @types/express@^5.0.6 @types/bcryptjs@^3.0.0 \
  @types/jsonwebtoken@^9.0.10 @types/cors@^2.8.19 @types/node@^25.5.0
npx prisma init --datasource-provider postgresql
```

> **IMPORTANT:** If `prisma.config.ts` is generated in the project root, delete it immediately.

---

### 2.2 `backend/package.json`

```json
{
  "name": "steakz-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@prisma/client": "^6.19.3",
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.6",
    "dotenv": "^16.6.1",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3"
  },
  "devDependencies": {
    "@types/bcryptjs": "^3.0.0",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^25.5.0",
    "nodemon": "^3.1.14",
    "prisma": "^6.19.3",
    "tsx": "^4.21.0",
    "typescript": "^6.0.2"
  }
}
```

---

### 2.3 `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src/**/*"]
}
```

---

### 2.4 `backend/.env`

```env
DATABASE_URL="postgresql://postgres:<YOUR_PASSWORD>@localhost:5432/steakz_db"
JWT_SECRET="steakz-super-secret-change-in-production"
JWT_EXPIRES_IN="7d"
ADMIN_EMAIL="admin@steakz.com"
ADMIN_PASSWORD="admin123"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

> Replace `<YOUR_PASSWORD>` with the local PostgreSQL password.

---

### 2.5 Create the database

```bash
psql -U postgres -c "CREATE DATABASE steakz_db;"
```

---

### 2.6 `prisma/schema.prisma`

Replace the entire file:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  HQ_MANAGER
  BRANCH_MANAGER
  CHEF
  CASHIER
  CUSTOMER
}

enum OrderStatus {
  PENDING
  PREPARING
  DONE
  DELIVERED
  CANCELLED
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}

model Branch {
  id        Int        @id @default(autoincrement())
  name      String     @unique
  address   String
  phone     String?
  isActive  Boolean    @default(true)
  users     User[]
  tables    Table[]
  menuItems MenuItem[]
  orders    Order[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model User {
  id        Int       @id @default(autoincrement())
  name      String
  email     String    @unique
  password  String
  role      Role      @default(CUSTOMER)
  isActive  Boolean   @default(true)
  branch    Branch?   @relation(fields: [branchId], references: [id])
  branchId  Int?
  salary    Float?
  bookings  Booking[]
  orders    Order[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model MenuItem {
  id          Int         @id @default(autoincrement())
  name        String
  description String?
  price       Float
  category    String
  isAvailable Boolean     @default(true)
  branch      Branch      @relation(fields: [branchId], references: [id])
  branchId    Int
  orderItems  OrderItem[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Table {
  id          Int       @id @default(autoincrement())
  tableNumber Int
  capacity    Int
  isAvailable Boolean   @default(true)
  branch      Branch    @relation(fields: [branchId], references: [id])
  branchId    Int
  bookings    Booking[]

  @@unique([tableNumber, branchId])
}

model Booking {
  id         Int           @id @default(autoincrement())
  customer   User          @relation(fields: [customerId], references: [id])
  customerId Int
  table      Table         @relation(fields: [tableId], references: [id])
  tableId    Int
  guestCount Int
  date       DateTime
  status     BookingStatus @default(PENDING)
  orders     Order[]
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
}

model Order {
  id         Int         @id @default(autoincrement())
  customer   User?       @relation(fields: [customerId], references: [id])
  customerId Int?
  booking    Booking?    @relation(fields: [bookingId], references: [id])
  bookingId  Int?
  branch     Branch      @relation(fields: [branchId], references: [id])
  branchId   Int
  status     OrderStatus @default(PENDING)
  total      Float       @default(0)
  items      OrderItem[]
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
}

model OrderItem {
  id         Int      @id @default(autoincrement())
  order      Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId    Int
  menuItem   MenuItem @relation(fields: [menuItemId], references: [id])
  menuItemId Int
  quantity   Int
  unitPrice  Float
}
```

Then run:

```bash
npx prisma migrate dev --name init
```

---

### 2.7 Backend source files

Create the directory structure:

```
src/
  index.ts
  lib/
    prisma.ts
    seed.ts
  middleware/
    logger.ts
    auth.ts
  routes/
    authRoutes.ts
    adminRoutes.ts
    hqRoutes.ts
    branchManagerRoutes.ts
    chefRoutes.ts
    cashierRoutes.ts
    customerRoutes.ts
    menuRoutes.ts
    publicRoutes.ts
```

---

#### `src/lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
```

---

#### `src/lib/seed.ts`

```typescript
import bcrypt from 'bcryptjs';
import prisma from './prisma.js';

const BRANCHES = [
  { name: 'Steakz City Centre',  address: '1 Main Street, City Centre' },
  { name: 'Steakz Northside',    address: '45 North Ave, Northside' },
  { name: 'Steakz Southgate',    address: '88 South Road, Southgate' },
  { name: 'Steakz East Quarter', address: '12 East Lane, East Quarter' },
  { name: 'Steakz Westfield',    address: '200 West Mall, Westfield' },
  { name: 'Steakz Marina Bay',   address: '9 Marina Blvd, Marina Bay' },
  { name: 'Steakz Uptown',       address: '77 Uptown Drive, Uptown' },
];

export async function seed() {
  const email    = process.env['ADMIN_EMAIL']    ?? 'admin@steakz.com';
  const password = process.env['ADMIN_PASSWORD'] ?? 'admin123';

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { name: 'System Admin', email, password: hashed, role: 'ADMIN' },
    });
    console.log(`[Seeder] Admin created: ${email}`);
  } else {
    console.log('[Seeder] Admin already exists — skipping.');
  }

  for (const b of BRANCHES) {
    const exists = await prisma.branch.findUnique({ where: { name: b.name } });
    if (!exists) {
      await prisma.branch.create({ data: b });
      console.log(`[Seeder] Branch created: ${b.name}`);
    }
  }
}
```

---

#### `src/middleware/logger.ts`

```typescript
import type { Request, Response, NextFunction } from 'express';

export function logger(req: Request, _res: Response, next: NextFunction): void {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
}
```

---

#### `src/middleware/auth.ts`

```typescript
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id:       number;
        role:     string;
        branchId: number | null;
      };
    }
  }
}

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'dev-secret';

export function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Malformed authorization header.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number; role: string; branchId: number | null;
    };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }
    next();
  };
}

export function requireBranch(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.branchId) {
    res.status(403).json({ error: 'No branch assigned to this account.' });
    return;
  }
  next();
}
```

---

#### `src/routes/authRoutes.ts`

```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET     = process.env['JWT_SECRET']     ?? 'dev-secret';
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] ?? '7d';

router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body as {
    name: string; email: string; password: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ error: 'name, email and password are required.' });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: 'CUSTOMER' },
    });
    res.status(201).json({ message: 'Registration successful.', userId: user.id });
  } catch {
    res.status(409).json({ error: 'Email already in use.' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required.' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    res.status(401).json({ error: 'Invalid credentials or account is inactive.' });
    return;
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    res.status(401).json({ error: 'Invalid credentials or account is inactive.' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, branchId: user.branchId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, role: user.role, branchId: user.branchId },
  });
});

router.get('/me', verifyToken, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.user!.id },
    select: { id: true, name: true, email: true, role: true, branchId: true, isActive: true },
  });
  res.json(user);
});

export default router;
```

---

#### `src/routes/adminRoutes.ts`

```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, requireRole(['ADMIN']));

router.post('/branches', async (req: Request, res: Response) => {
  const { name, address, phone } = req.body as {
    name: string; address: string; phone?: string;
  };
  if (!name || !address) {
    res.status(400).json({ error: 'name and address are required.' });
    return;
  }
  try {
    const branch = await prisma.branch.create({ data: { name, address, phone } });
    res.status(201).json(branch);
  } catch {
    res.status(409).json({ error: 'Branch name already exists.' });
  }
});

router.get('/branches', async (_req: Request, res: Response) => {
  const branches = await prisma.branch.findMany({ orderBy: { id: 'asc' } });
  res.json(branches);
});

router.post('/users', async (req: Request, res: Response) => {
  const { name, email, password, role, branchId, salary } = req.body as {
    name: string; email: string; password: string;
    role: string; branchId?: number; salary?: number;
  };
  if (!name || !email || !password || !role) {
    res.status(400).json({ error: 'name, email, password and role are required.' });
    return;
  }
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: {
        name, email, password: hashed,
        role: role as any,
        branchId: branchId ?? null,
        salary:   salary   ?? null,
      },
    });
    res.status(201).json({ message: 'User created.', userId: user.id });
  } catch {
    res.status(409).json({ error: 'Email already in use.' });
  }
});

router.get('/users', async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true,
      role: true, isActive: true, branchId: true, salary: true,
      branch: { select: { name: true } },
    },
    orderBy: { id: 'asc' },
  });
  res.json(users);
});

router.patch('/users/:id/role', async (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '0');
  const { role, branchId } = req.body as { role: string; branchId?: number };
  const user = await prisma.user.update({
    where: { id },
    data:  { role: role as any, branchId: branchId ?? null },
  });
  res.json({ message: 'Role updated.', user });
});

router.patch('/users/:id/disable', async (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '0');
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  res.json({ message: 'User disabled.' });
});

router.patch('/users/:id/enable', async (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '0');
  await prisma.user.update({ where: { id }, data: { isActive: true } });
  res.json({ message: 'User enabled.' });
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '0');
  await prisma.user.delete({ where: { id } });
  res.json({ message: 'User deleted.' });
});

export default router;
```

---

#### `src/routes/hqRoutes.ts`

```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, requireRole(['HQ_MANAGER', 'ADMIN']));

router.get('/overview', async (_req: Request, res: Response) => {
  const branches = await prisma.branch.findMany({
    include: { _count: { select: { orders: true, users: true } } },
  });
  res.json(branches);
});

router.get('/orders', async (_req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    include: {
      branch:   { select: { name: true } },
      items:    { include: { menuItem: true } },
      customer: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

router.get('/staff', async (_req: Request, res: Response) => {
  const staff = await prisma.user.findMany({
    where: { role: { in: ['BRANCH_MANAGER', 'CHEF', 'CASHIER', 'HQ_MANAGER'] } },
    select: {
      id: true, name: true, role: true, salary: true, isActive: true,
      branch: { select: { name: true } },
    },
  });
  res.json(staff);
});

router.get('/sales', async (_req: Request, res: Response) => {
  const sales = await prisma.order.groupBy({
    by: ['branchId'],
    _sum:   { total: true },
    _count: { id: true },
    where:  { status: { in: ['DONE', 'DELIVERED'] } },
  });
  const branches = await prisma.branch.findMany({ select: { id: true, name: true } });
  const branchMap = Object.fromEntries(branches.map(b => [b.id, b.name]));
  const result = sales.map(s => ({
    branchId:   s.branchId,
    branchName: branchMap[s.branchId] ?? 'Unknown',
    totalSales: s._sum.total ?? 0,
    orderCount: s._count.id,
  }));
  res.json(result);
});

export default router;
```

---

#### `src/routes/branchManagerRoutes.ts`

```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole, requireBranch } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, requireRole(['BRANCH_MANAGER']), requireBranch);

router.get('/overview', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const branch = await prisma.branch.findUnique({
    where:   { id: branchId },
    include: { _count: { select: { orders: true, users: true, tables: true } } },
  });
  res.json(branch);
});

router.get('/orders', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const orders = await prisma.order.findMany({
    where:   { branchId },
    include: {
      items:    { include: { menuItem: true } },
      customer: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

router.get('/staff', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const staff = await prisma.user.findMany({
    where:  { branchId, role: { in: ['CHEF', 'CASHIER', 'BRANCH_MANAGER'] } },
    select: { id: true, name: true, role: true, salary: true, isActive: true },
  });
  res.json(staff);
});

router.get('/bookings', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const bookings = await prisma.booking.findMany({
    where:   { table: { branchId } },
    include: {
      customer: { select: { name: true } },
      table:    { select: { tableNumber: true } },
    },
    orderBy: { date: 'asc' },
  });
  res.json(bookings);
});

router.get('/sales', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const result = await prisma.order.aggregate({
    where:  { branchId, status: { in: ['DONE', 'DELIVERED'] } },
    _sum:   { total: true },
    _count: { id: true },
  });
  res.json({ totalSales: result._sum.total ?? 0, orderCount: result._count.id });
});

export default router;
```

---

#### `src/routes/chefRoutes.ts`

```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole, requireBranch } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, requireRole(['CHEF']), requireBranch);

router.get('/orders', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const orders = await prisma.order.findMany({
    where:   { branchId, status: { in: ['PENDING', 'PREPARING'] } },
    include: { items: { include: { menuItem: { select: { name: true } } } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(orders);
});

router.patch('/orders/:id/done', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const id = parseInt(req.params['id'] ?? '0');
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.branchId !== branchId) {
    res.status(403).json({ error: 'Order not found in your branch.' });
    return;
  }
  const updated = await prisma.order.update({
    where: { id },
    data:  { status: 'DONE' },
  });
  res.json(updated);
});

router.get('/menu', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const items = await prisma.menuItem.findMany({ where: { branchId } });
  res.json(items);
});

router.delete('/menu/:id', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const id = parseInt(req.params['id'] ?? '0');
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item || item.branchId !== branchId) {
    res.status(403).json({ error: 'Menu item not found in your branch.' });
    return;
  }
  await prisma.menuItem.delete({ where: { id } });
  res.json({ message: 'Menu item deleted.' });
});

export default router;
```

---

#### `src/routes/cashierRoutes.ts`

```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole, requireBranch } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, requireRole(['CASHIER']), requireBranch);

router.post('/orders', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const { customerId, bookingId, items } = req.body as {
    customerId?: number;
    bookingId?:  number;
    items: { menuItemId: number; quantity: number }[];
  };

  if (!items || items.length === 0) {
    res.status(400).json({ error: 'At least one item is required.' });
    return;
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map(i => i.menuItemId) }, branchId },
  });

  if (menuItems.length !== items.length) {
    res.status(400).json({ error: 'One or more menu items are invalid for this branch.' });
    return;
  }

  const priceMap = Object.fromEntries(menuItems.map(m => [m.id, m.price]));
  const total    = items.reduce((sum, i) => sum + (priceMap[i.menuItemId] ?? 0) * i.quantity, 0);

  const order = await prisma.order.create({
    data: {
      branchId,
      customerId: customerId ?? null,
      bookingId:  bookingId  ?? null,
      total,
      items: {
        create: items.map(i => ({
          menuItemId: i.menuItemId,
          quantity:   i.quantity,
          unitPrice:  priceMap[i.menuItemId] ?? 0,
        })),
      },
    },
    include: { items: { include: { menuItem: true } } },
  });

  res.status(201).json(order);
});

router.get('/orders', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const orders = await prisma.order.findMany({
    where:   { branchId },
    include: { items: { include: { menuItem: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

router.patch('/orders/:id/deliver', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const id = parseInt(req.params['id'] ?? '0');
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.branchId !== branchId) {
    res.status(403).json({ error: 'Order not found in your branch.' });
    return;
  }
  const updated = await prisma.order.update({
    where: { id },
    data:  { status: 'DELIVERED' },
  });
  res.json(updated);
});

export default router;
```

---

#### `src/routes/customerRoutes.ts`

```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, requireRole(['CUSTOMER']));

router.get('/bookings', async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const bookings = await prisma.booking.findMany({
    where:   { customerId },
    include: { table: { include: { branch: { select: { name: true } } } } },
    orderBy: { date: 'desc' },
  });
  res.json(bookings);
});

router.post('/bookings', async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const { tableId, guestCount, date } = req.body as {
    tableId: number; guestCount: number; date: string;
  };

  if (!tableId || !guestCount || !date) {
    res.status(400).json({ error: 'tableId, guestCount and date are required.' });
    return;
  }

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table || !table.isAvailable) {
    res.status(400).json({ error: 'Table is not available.' });
    return;
  }

  const booking = await prisma.booking.create({
    data: { customerId, tableId, guestCount, date: new Date(date) },
    include: { table: { include: { branch: { select: { name: true } } } } },
  });
  res.status(201).json(booking);
});

router.delete('/bookings/:id', async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const id = parseInt(req.params['id'] ?? '0');
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.customerId !== customerId) {
    res.status(403).json({ error: 'Booking not found.' });
    return;
  }
  await prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } });
  res.json({ message: 'Booking cancelled.' });
});

router.get('/orders', async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const orders = await prisma.order.findMany({
    where:   { customerId },
    include: {
      items:  { include: { menuItem: true } },
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

router.post('/orders', async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const { bookingId, items } = req.body as {
    bookingId: number;
    items: { menuItemId: number; quantity: number }[];
  };

  if (!bookingId || !items || items.length === 0) {
    res.status(400).json({ error: 'bookingId and items are required.' });
    return;
  }

  const booking = await prisma.booking.findUnique({
    where:   { id: bookingId },
    include: { table: true },
  });

  if (!booking || booking.customerId !== customerId) {
    res.status(403).json({ error: 'Booking not found.' });
    return;
  }

  const branchId = booking.table.branchId;
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map(i => i.menuItemId) }, branchId },
  });

  const priceMap = Object.fromEntries(menuItems.map(m => [m.id, m.price]));
  const total    = items.reduce((sum, i) => sum + (priceMap[i.menuItemId] ?? 0) * i.quantity, 0);

  const order = await prisma.order.create({
    data: {
      customerId, bookingId, branchId, total,
      items: {
        create: items.map(i => ({
          menuItemId: i.menuItemId,
          quantity:   i.quantity,
          unitPrice:  priceMap[i.menuItemId] ?? 0,
        })),
      },
    },
    include: { items: { include: { menuItem: true } } },
  });
  res.status(201).json(order);
});

export default router;
```

---

#### `src/routes/menuRoutes.ts`

```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole, requireBranch } from '../middleware/auth.js';

const router = Router();

// Public — no auth
router.get('/:branchId', async (req: Request, res: Response) => {
  const branchId = parseInt(req.params['branchId'] ?? '0');
  const items = await prisma.menuItem.findMany({
    where:   { branchId, isAvailable: true },
    orderBy: { category: 'asc' },
  });
  res.json(items);
});

// Branch manager creates item
router.post(
  '/',
  verifyToken,
  requireRole(['BRANCH_MANAGER', 'ADMIN']),
  requireBranch,
  async (req: Request, res: Response) => {
    const branchId = req.user!.branchId!;
    const { name, description, price, category } = req.body as {
      name: string; description?: string; price: number; category: string;
    };
    if (!name || !price || !category) {
      res.status(400).json({ error: 'name, price and category are required.' });
      return;
    }
    const item = await prisma.menuItem.create({
      data: { name, description, price, category, branchId },
    });
    res.status(201).json(item);
  }
);

// Branch manager updates item
router.patch(
  '/:id',
  verifyToken,
  requireRole(['BRANCH_MANAGER', 'ADMIN']),
  requireBranch,
  async (req: Request, res: Response) => {
    const branchId = req.user!.branchId!;
    const id = parseInt(req.params['id'] ?? '0');
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item || item.branchId !== branchId) {
      res.status(403).json({ error: 'Item not found in your branch.' });
      return;
    }
    const updated = await prisma.menuItem.update({
      where: { id },
      data:  req.body,
    });
    res.json(updated);
  }
);

export default router;
```

---

#### `src/routes/publicRoutes.ts`

```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/branches', async (_req: Request, res: Response) => {
  const branches = await prisma.branch.findMany({ where: { isActive: true } });
  res.json(branches);
});

router.get('/branches/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '0');
  const branch = await prisma.branch.findUnique({
    where:   { id },
    include: {
      tables:    { where: { isAvailable: true } },
      menuItems: { where: { isAvailable: true } },
    },
  });
  if (!branch) {
    res.status(404).json({ error: 'Branch not found.' });
    return;
  }
  res.json(branch);
});

export default router;
```

---

#### `src/index.ts`

```typescript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { logger } from './middleware/logger.js';
import { seed } from './lib/seed.js';

import authRoutes          from './routes/authRoutes.js';
import adminRoutes         from './routes/adminRoutes.js';
import hqRoutes            from './routes/hqRoutes.js';
import branchManagerRoutes from './routes/branchManagerRoutes.js';
import chefRoutes          from './routes/chefRoutes.js';
import cashierRoutes       from './routes/cashierRoutes.js';
import customerRoutes      from './routes/customerRoutes.js';
import menuRoutes          from './routes/menuRoutes.js';
import publicRoutes        from './routes/publicRoutes.js';

const app  = express();
const PORT = process.env['PORT'] ?? 3001;

app.use(cors({ origin: process.env['FRONTEND_URL'] ?? 'http://localhost:5173' }));
app.use(express.json());
app.use(logger);

app.use('/api/auth',           authRoutes);
app.use('/api/admin',          adminRoutes);
app.use('/api/hq',             hqRoutes);
app.use('/api/branch-manager', branchManagerRoutes);
app.use('/api/chef',           chefRoutes);
app.use('/api/cashier',        cashierRoutes);
app.use('/api/customer',       customerRoutes);
app.use('/api/menu',           menuRoutes);
app.use('/api/public',         publicRoutes);

app.listen(PORT, async () => {
  await seed();
  console.log(`Steakz API running on http://localhost:${PORT}`);
});
```

---

### 2.8 Verify backend starts

```bash
npm run dev
```

Expected output:

```
Steakz API running on http://localhost:3001
[Seeder] Admin created: admin@steakz.com
[Seeder] Branch created: Steakz City Centre
... (7 branches)
```

---

## 3. Frontend

### 3.1 Initialise

```bash
cd ../frontend
npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom@^7.15.0 axios@^1.16.0
```

---

### 3.2 `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

---

### 3.3 Frontend source files

Create this directory structure under `src/`:

```
src/
  main.tsx
  App.tsx
  index.css
  api/
    axios.ts
  context/
    AuthContext.tsx
  components/
    ProtectedRoute.tsx
    NavBar.tsx
  pages/
    LandingPage.tsx
    LoginPage.tsx
    RegisterPage.tsx
    MenuPage.tsx
    BookTablePage.tsx
    CustomerDashboard.tsx
    ChefDashboard.tsx
    CashierDashboard.tsx
    BranchManagerDashboard.tsx
    HQDashboard.tsx
    AdminDashboard.tsx
    NotFoundPage.tsx
```

---

#### `src/index.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

:root {
  --bg-base:       #0e0c0a;
  --bg-surface:    #141210;
  --bg-card:       #1a1714;
  --bg-elevated:   #221f1b;
  --bg-input:      #1e1b17;

  --cognac:        #c17f3a;
  --cognac-light:  #d9a05a;
  --cognac-pale:   #e8c28a;
  --cognac-glow:   rgba(193, 127, 58, 0.2);
  --cognac-dim:    rgba(193, 127, 58, 0.08);

  --cream:         #f2ead8;
  --text-primary:  #ede8df;
  --text-secondary:#a89880;
  --text-muted:    #5e5345;

  --border:        rgba(193, 127, 58, 0.18);
  --border-hover:  rgba(193, 127, 58, 0.45);
  --border-focus:  rgba(193, 127, 58, 0.7);

  --success:       #7ab87a;
  --warning:       #d4a256;
  --error:         #c4605a;

  --radius-sm:     4px;
  --radius:        6px;
  --radius-lg:     10px;
  --transition:    0.18s ease;

  --shadow-card:   0 2px 16px rgba(0,0,0,0.4);
  --shadow-glow:   0 0 24px var(--cognac-glow);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; }

body {
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  line-height: 1.6;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* ─── Typography ──────────────────────────────────────────── */

h1, h2, h3, h4 {
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.2;
}

h1 { font-size: 2.4rem; color: var(--cognac-pale); }
h2 { font-size: 1.5rem; color: var(--text-primary); }
h3 { font-size: 1.1rem; color: var(--cognac-light); font-weight: 600; }

p { color: var(--text-secondary); }

/* ─── Layout ──────────────────────────────────────────────── */

.container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }

.page {
  padding: 2.5rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  border-bottom: 1px solid var(--border);
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
}

.page-header p {
  margin-top: 0.35rem;
  font-size: 0.9rem;
  color: var(--text-muted);
}

/* ─── NavBar ──────────────────────────────────────────────── */

.navbar {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
}

.navbar-brand {
  font-family: 'Playfair Display', serif;
  font-size: 1.35rem;
  font-weight: 700;
  font-style: italic;
  color: var(--cognac-light);
  text-decoration: none;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.navbar-brand::before {
  content: '✦';
  font-style: normal;
  font-size: 0.8rem;
  color: var(--cognac);
  opacity: 0.7;
}

.nav-links {
  display: flex;
  gap: 1.8rem;
  align-items: center;
}

.nav-links a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: color var(--transition);
}

.nav-links a:hover { color: var(--cognac-light); }

.nav-badge {
  background: var(--cognac-dim);
  border: 1px solid var(--border);
  color: var(--cognac-light);
  font-size: 0.68rem;
  padding: 2px 9px;
  border-radius: 20px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ─── Cards ───────────────────────────────────────────────── */

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
  transition: border-color var(--transition), box-shadow var(--transition);
}

.card:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-card), var(--shadow-glow);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-top: 1.5rem;
}

.card-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--cognac);
  margin-bottom: 0.4rem;
  display: block;
}

/* ─── Buttons ─────────────────────────────────────────────── */

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.35rem;
  border: none;
  border-radius: var(--radius);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all var(--transition);
  white-space: nowrap;
}

.btn-primary {
  background: var(--cognac);
  color: #fff;
}
.btn-primary:hover {
  background: var(--cognac-light);
  box-shadow: 0 0 14px var(--cognac-glow);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--cognac);
  color: var(--cognac-light);
}
.btn-outline:hover {
  background: var(--cognac-dim);
  border-color: var(--cognac-light);
}

.btn-ghost {
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}
.btn-ghost:hover {
  color: var(--text-primary);
  border-color: var(--border-hover);
}

.btn-danger {
  background: var(--error);
  color: #fff;
  border: none;
}
.btn-danger:hover { opacity: 0.85; }

.btn-sm { padding: 0.3rem 0.85rem; font-size: 0.78rem; }

/* ─── Forms ───────────────────────────────────────────────── */

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-bottom: 1.25rem;
}

label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

input, select, textarea {
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  padding: 0.6rem 0.9rem;
  transition: border-color var(--transition), box-shadow var(--transition);
  width: 100%;
}

input::placeholder, textarea::placeholder { color: var(--text-muted); }

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--cognac-dim);
}

select option { background: var(--bg-elevated); }

/* ─── Badges ──────────────────────────────────────────────── */

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.badge-pending   { background: rgba(212,162,86,0.12);  color: var(--warning);    border: 1px solid rgba(212,162,86,0.35); }
.badge-preparing { background: rgba(193,127,58,0.12); color: var(--cognac-light); border: 1px solid var(--border); }
.badge-done      { background: rgba(122,184,122,0.1);  color: var(--success);    border: 1px solid rgba(122,184,122,0.3); }
.badge-delivered { background: rgba(122,184,122,0.12); color: var(--success);    border: 1px solid rgba(122,184,122,0.3); }
.badge-cancelled { background: rgba(196,96,90,0.1);   color: var(--error);      border: 1px solid rgba(196,96,90,0.3); }
.badge-confirmed { background: rgba(122,184,122,0.1);  color: var(--success);    border: 1px solid rgba(122,184,122,0.3); }

/* ─── Tables ──────────────────────────────────────────────── */

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.data-table th,
.data-table td {
  padding: 0.85rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--cognac);
  background: var(--bg-surface);
}

.data-table tbody tr { transition: background var(--transition); }
.data-table tbody tr:hover { background: var(--bg-elevated); }

/* ─── Stats ───────────────────────────────────────────────── */

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.stat-box {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  position: relative;
  overflow: hidden;
}

.stat-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--cognac), transparent);
  opacity: 0.6;
}

.stat-box .stat-value {
  font-family: 'Playfair Display', serif;
  font-size: 1.9rem;
  font-weight: 700;
  color: var(--cognac-pale);
  line-height: 1;
  margin-bottom: 0.3rem;
}

.stat-box .stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

/* ─── Auth ────────────────────────────────────────────────── */

.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(193,127,58,0.07) 0%, transparent 55%),
    radial-gradient(ellipse at 70% 80%, rgba(193,127,58,0.04) 0%, transparent 50%),
    var(--bg-base);
  padding: 2rem;
}

.auth-box {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-card), 0 0 60px rgba(193,127,58,0.06);
}

.auth-box h2 { margin-bottom: 0.3rem; }
.auth-box > p { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 2rem; }

.auth-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

/* ─── Alerts ──────────────────────────────────────────────── */

.alert {
  padding: 0.7rem 1rem;
  border-radius: var(--radius);
  font-size: 0.88rem;
  margin-bottom: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alert-error   { background: rgba(196,96,90,0.1);   border: 1px solid rgba(196,96,90,0.3);   color: var(--error); }
.alert-success { background: rgba(122,184,122,0.08); border: 1px solid rgba(122,184,122,0.25); color: var(--success); }

/* ─── Hero ────────────────────────────────────────────────── */

.hero {
  min-height: 88vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  background:
    radial-gradient(ellipse at 50% 25%, rgba(193,127,58,0.1) 0%, transparent 60%),
    var(--bg-base);
  position: relative;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 80px;
  background: linear-gradient(to bottom, transparent, var(--cognac));
  opacity: 0.4;
}

.hero h1 {
  font-size: clamp(3rem, 9vw, 5.5rem);
  font-style: italic;
  letter-spacing: -0.01em;
  margin-bottom: 0.5rem;
}

.hero p {
  font-size: 1.05rem;
  color: var(--text-secondary);
  max-width: 500px;
  margin: 0.8rem auto 2rem;
  line-height: 1.7;
}

.ornament {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--cognac);
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin: 1rem 0;
}

.ornament::before,
.ornament::after {
  content: '';
  width: 50px;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--cognac));
}

.ornament::after {
  background: linear-gradient(to left, transparent, var(--cognac));
}

/* ─── Section titles ──────────────────────────────────────── */

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 2rem 0 1rem;
  font-family: 'Playfair Display', serif;
  font-size: 1.3rem;
  color: var(--text-primary);
}

.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
  margin-left: 0.5rem;
}

/* ─── Scrollbar ───────────────────────────────────────────── */

::-webkit-scrollbar       { width: 5px; }
::-webkit-scrollbar-track { background: var(--bg-base); }
::-webkit-scrollbar-thumb { background: var(--cognac); border-radius: 3px; opacity: 0.6; }

/* ─── Price tag ───────────────────────────────────────────── */

.price {
  font-family: 'Playfair Display', serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--cognac-light);
}

/* ─── Empty state ─────────────────────────────────────────── */

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
  font-size: 0.9rem;
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  margin-top: 1rem;
}

.empty-state span {
  display: block;
  font-size: 2rem;
  margin-bottom: 0.75rem;
  opacity: 0.4;
}
```

---

#### `src/api/axios.ts`

```typescript
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('steakz_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export default api;
```

---

#### `src/context/AuthContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthUser {
  id:       number;
  name:     string;
  role:     string;
  branchId: number | null;
}

interface AuthContextType {
  user:   AuthUser | null;
  token:  string | null;
  login:  (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,  setUser]  = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('steakz_token');
    const storedUser  = localStorage.getItem('steakz_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  function login(t: string, u: AuthUser) {
    localStorage.setItem('steakz_token', t);
    localStorage.setItem('steakz_user',  JSON.stringify(u));
    setToken(t);
    setUser(u);
  }

  function logout() {
    localStorage.removeItem('steakz_token');
    localStorage.removeItem('steakz_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

---

#### `src/components/ProtectedRoute.tsx`

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children:      React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
```

---

#### `src/components/NavBar.tsx`

```typescript
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_DASH: Record<string, string> = {
  ADMIN:          '/admin',
  HQ_MANAGER:     '/hq',
  BRANCH_MANAGER: '/branch-manager',
  CHEF:           '/chef',
  CASHIER:        '/cashier',
  CUSTOMER:       '/customer',
};

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">Steakz</Link>
      <div className="nav-links">
        <Link to="/menu">Menu</Link>
        <Link to="/branches">Branches</Link>
        {user ? (
          <>
            <Link to={ROLE_DASH[user.role] ?? '/'}>Dashboard</Link>
            {user.role === 'CUSTOMER' && <Link to="/book">Reserve</Link>}
            <span className="nav-badge">{user.role.replace(/_/g, ' ')}</span>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/login">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Reserve a Table</Link>
          </>
        )}
      </div>
    </nav>
  );
}
```

---

#### `src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './components/NavBar';

import LandingPage            from './pages/LandingPage';
import LoginPage              from './pages/LoginPage';
import RegisterPage           from './pages/RegisterPage';
import MenuPage               from './pages/MenuPage';
import BookTablePage          from './pages/BookTablePage';
import CustomerDashboard      from './pages/CustomerDashboard';
import ChefDashboard          from './pages/ChefDashboard';
import CashierDashboard       from './pages/CashierDashboard';
import BranchManagerDashboard from './pages/BranchManagerDashboard';
import HQDashboard            from './pages/HQDashboard';
import AdminDashboard         from './pages/AdminDashboard';
import NotFoundPage           from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/menu"     element={<MenuPage />} />
          <Route path="/branches" element={<MenuPage />} />

          <Route path="/book" element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}><BookTablePage /></ProtectedRoute>
          } />
          <Route path="/customer" element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerDashboard /></ProtectedRoute>
          } />
          <Route path="/chef" element={
            <ProtectedRoute allowedRoles={['CHEF']}><ChefDashboard /></ProtectedRoute>
          } />
          <Route path="/cashier" element={
            <ProtectedRoute allowedRoles={['CASHIER']}><CashierDashboard /></ProtectedRoute>
          } />
          <Route path="/branch-manager" element={
            <ProtectedRoute allowedRoles={['BRANCH_MANAGER']}><BranchManagerDashboard /></ProtectedRoute>
          } />
          <Route path="/hq" element={
            <ProtectedRoute allowedRoles={['HQ_MANAGER', 'ADMIN']}><HQDashboard /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

---

#### `src/main.tsx`

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

---

#### `src/pages/LandingPage.tsx`

```typescript
import { Link } from 'react-router-dom';

const LOCATIONS = [
  'City Centre', 'Northside', 'Southgate',
  'East Quarter', 'Westfield', 'Marina Bay', 'Uptown',
];

export default function LandingPage() {
  return (
    <div>
      <div className="hero">
        <div className="ornament">Est. 2024</div>
        <h1>Steakz</h1>
        <p>
          Seven locations. One obsession. Premium cuts, masterfully prepared —
          reserve your table and experience the difference.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/menu" className="btn btn-primary">Explore Menu</Link>
          <Link to="/register" className="btn btn-outline">Reserve a Table</Link>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '4rem' }}>
        <div className="section-title">Our Locations</div>
        <div className="card-grid">
          {LOCATIONS.map((loc) => (
            <div className="card" key={loc} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: 'var(--cognac)', fontSize: '1rem' }}>✦</span>
              <div>
                <span className="card-label">Steakz</span>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{loc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

#### `src/pages/LoginPage.tsx`

```typescript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ROLE_DASH: Record<string, string> = {
  ADMIN:          '/admin',
  HQ_MANAGER:     '/hq',
  BRANCH_MANAGER: '/branch-manager',
  CHEF:           '/chef',
  CASHIER:        '/cashier',
  CUSTOMER:       '/customer',
};

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const { login }  = useAuth();
  const navigate   = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      navigate(ROLE_DASH[data.user.role] ?? '/');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Sign in failed.');
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <span className="card-label" style={{ display: 'block', textAlign: 'center', marginBottom: '0.5rem' }}>Welcome back</span>
        <h2 style={{ textAlign: 'center', marginBottom: '0.3rem' }}>Sign In</h2>
        <p style={{ textAlign: 'center' }}>Access your Steakz account</p>
        {error && <div className="alert alert-error">⚠ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
            Sign In
          </button>
        </form>
        <div className="auth-divider">or</div>
        <p style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          No account?{' '}
          <Link to="/register" style={{ color: 'var(--cognac-light)', textDecoration: 'none', fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
```

---

#### `src/pages/RegisterPage.tsx`

```typescript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function RegisterPage() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', { name, email, password });
      setSuccess('Account created. Redirecting to sign in…');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Registration failed.');
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <span className="card-label" style={{ display: 'block', textAlign: 'center', marginBottom: '0.5rem' }}>Join Steakz</span>
        <h2 style={{ textAlign: 'center', marginBottom: '0.3rem' }}>Create Account</h2>
        <p style={{ textAlign: 'center' }}>Start reserving tables at any of our 7 locations</p>
        {error   && <div className="alert alert-error">⚠ {error}</div>}
        {success && <div className="alert alert-success">✓ {success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
            Create Account
          </button>
        </form>
        <div className="auth-divider">or</div>
        <p style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Already a member?{' '}
          <Link to="/login" style={{ color: 'var(--cognac-light)', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
```

---

#### `src/pages/MenuPage.tsx`

```typescript
import { useEffect, useState } from 'react';
import api from '../api/axios';

interface Branch   { id: number; name: string; address: string; }
interface MenuItem { id: number; name: string; description?: string; price: number; category: string; }

export default function MenuPage() {
  const [branches,   setBranches]   = useState<Branch[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [menu,       setMenu]       = useState<MenuItem[]>([]);
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    api.get('/public/branches').then(r => setBranches(r.data));
  }, []);

  async function loadMenu(branchId: number) {
    setSelectedId(branchId);
    setLoading(true);
    const r = await api.get(`/menu/${branchId}`);
    setMenu(r.data);
    setLoading(false);
  }

  const categories = [...new Set(menu.map(m => m.category))];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Our Menu</h1>
        <p>Select a location to view available cuts and dishes</p>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        {branches.map(b => (
          <button
            key={b.id}
            className={`btn ${selectedId === b.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => loadMenu(b.id)}
          >
            {b.name.replace('Steakz ', '')}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ color: 'var(--text-muted)', padding: '2rem 0', textAlign: 'center' }}>
          Loading menu…
        </div>
      )}

      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: '2.5rem' }}>
          <div className="section-title">{cat}</div>
          <div className="card-grid">
            {menu.filter(m => m.category === cat).map(item => (
              <div className="card" key={item.id}>
                <span className="card-label">{cat}</span>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontFamily: 'Playfair Display, serif' }}>
                  {item.name}
                </h3>
                {item.description && (
                  <p style={{ fontSize: '0.87rem', marginBottom: '1rem', lineHeight: 1.5 }}>{item.description}</p>
                )}
                <div style={{ marginTop: 'auto' }}>
                  <span className="price">${item.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {selectedId && menu.length === 0 && !loading && (
        <div className="empty-state">
          <span>🍽</span>
          No menu items available for this location yet.
        </div>
      )}

      {!selectedId && (
        <div className="empty-state">
          <span>✦</span>
          Choose a location above to view its menu.
        </div>
      )}
    </div>
  );
}
```

---

#### `src/pages/BookTablePage.tsx`

```typescript
import { useEffect, useState } from 'react';
import api from '../api/axios';

interface Branch { id: number; name: string; }
interface Table  { id: number; tableNumber: number; capacity: number; }

export default function BookTablePage() {
  const [branches,   setBranches]   = useState<Branch[]>([]);
  const [branchId,   setBranchId]   = useState('');
  const [tables,     setTables]     = useState<Table[]>([]);
  const [tableId,    setTableId]    = useState('');
  const [guestCount, setGuestCount] = useState('2');
  const [date,       setDate]       = useState('');
  const [success,    setSuccess]    = useState('');
  const [error,      setError]      = useState('');

  useEffect(() => {
    api.get('/public/branches').then(r => setBranches(r.data));
  }, []);

  async function onBranchChange(id: string) {
    setBranchId(id);
    setTableId('');
    if (id) {
      const r = await api.get(`/public/branches/${id}`);
      setTables(r.data.tables ?? []);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/customer/bookings', {
        tableId:    parseInt(tableId),
        guestCount: parseInt(guestCount),
        date,
      });
      setSuccess('Reservation confirmed. View it in your dashboard.');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Reservation failed.');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Reserve a Table</h1>
        <p>Secure your spot at any Steakz location</p>
      </div>

      <div style={{ maxWidth: 520 }}>
        <div className="card">
          {error   && <div className="alert alert-error">⚠ {error}</div>}
          {success && <div className="alert alert-success">✓ {success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Location</label>
              <select value={branchId} onChange={e => onBranchChange(e.target.value)} required>
                <option value="">Select a location</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Table</label>
              <select value={tableId} onChange={e => setTableId(e.target.value)} required>
                <option value="">Select a table</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>
                    Table {t.tableNumber} — seats {t.capacity}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Guests</label>
                <input type="number" min="1" value={guestCount} onChange={e => setGuestCount(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Date &amp; Time</label>
                <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>
              Confirm Reservation
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

---

#### `src/pages/CustomerDashboard.tsx`

```typescript
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface Booking { id: number; date: string; status: string; guestCount: number; table: { tableNumber: number; branch: { name: string } } }
interface Order   { id: number; total: number; status: string; createdAt: string; branch: { name: string }; items: { menuItem: { name: string }; quantity: number }[] }

export default function CustomerDashboard() {
  const { user }   = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders,   setOrders]   = useState<Order[]>([]);

  useEffect(() => {
    api.get('/customer/bookings').then(r => setBookings(r.data));
    api.get('/customer/orders').then(r => setOrders(r.data));
  }, []);

  async function cancelBooking(id: number) {
    await api.delete(`/customer/bookings/${id}`);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Account</h1>
        <p>Welcome back, {user?.name}</p>
      </div>

      <div className="section-title">Reservations</div>
      {bookings.length === 0 ? (
        <div className="empty-state"><span>📅</span>No reservations yet.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Location</th><th>Table</th><th>Guests</th><th>Date</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id}>
                <td>{b.table.branch.name}</td>
                <td>Table {b.table.tableNumber}</td>
                <td>{b.guestCount}</td>
                <td>{new Date(b.date).toLocaleString()}</td>
                <td><span className={`badge badge-${b.status.toLowerCase()}`}>{b.status}</span></td>
                <td>
                  {b.status === 'PENDING' && (
                    <button className="btn btn-danger btn-sm" onClick={() => cancelBooking(b.id)}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="section-title">Order History</div>
      {orders.length === 0 ? (
        <div className="empty-state"><span>🍷</span>No orders yet.</div>
      ) : (
        <div className="card-grid">
          {orders.map(o => (
            <div className="card" key={o.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                <div>
                  <span className="card-label">Order #{o.id}</span>
                  <p style={{ fontSize: '0.82rem', marginTop: '0.1rem' }}>
                    {o.branch.name} · {new Date(o.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span>
              </div>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.8 }}>
                {o.items.map((item, i) => <li key={i}>{item.menuItem.name} × {item.quantity}</li>)}
              </ul>
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <span className="price">${o.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

#### `src/pages/ChefDashboard.tsx`

```typescript
import { useEffect, useState } from 'react';
import api from '../api/axios';

interface OrderItem { menuItem: { name: string }; quantity: number }
interface Order     { id: number; status: string; createdAt: string; items: OrderItem[] }
interface MenuItem  { id: number; name: string; category: string; price: number }

export default function ChefDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu,   setMenu]   = useState<MenuItem[]>([]);

  useEffect(() => {
    api.get('/chef/orders').then(r => setOrders(r.data));
    api.get('/chef/menu').then(r => setMenu(r.data));
  }, []);

  async function markDone(id: number) {
    await api.patch(`/chef/orders/${id}/done`);
    setOrders(prev => prev.filter(o => o.id !== id));
  }

  async function deleteMenuItem(id: number) {
    if (!confirm('Remove this item from the menu?')) return;
    await api.delete(`/chef/menu/${id}`);
    setMenu(prev => prev.filter(m => m.id !== id));
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Kitchen</h1>
        <p>Active orders and branch menu management</p>
      </div>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-value">{orders.length}</div>
          <div className="stat-label">Active Orders</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{menu.length}</div>
          <div className="stat-label">Menu Items</div>
        </div>
      </div>

      <div className="section-title">Active Orders</div>
      {orders.length === 0 ? (
        <div className="empty-state"><span>✓</span>All caught up — no active orders.</div>
      ) : (
        <div className="card-grid">
          {orders.map(o => (
            <div className="card" key={o.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="card-label">Order #{o.id}</span>
                <span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span>
              </div>
              <ul style={{ paddingLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.9 }}>
                {o.items.map((item, i) => <li key={i}>{item.menuItem.name} × {item.quantity}</li>)}
              </ul>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: '1rem' }}
                onClick={() => markDone(o.id)}
              >
                ✓ Mark Complete
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="section-title">Branch Menu</div>
      <table className="data-table">
        <thead>
          <tr><th>Item</th><th>Category</th><th>Price</th><th></th></tr>
        </thead>
        <tbody>
          {menu.map(m => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td style={{ color: 'var(--text-muted)' }}>{m.category}</td>
              <td><span className="price" style={{ fontSize: '0.95rem' }}>${m.price.toFixed(2)}</span></td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => deleteMenuItem(m.id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

#### `src/pages/CashierDashboard.tsx`

```typescript
import { useEffect, useState } from 'react';
import api from '../api/axios';

interface MenuItem  { id: number; name: string; price: number; category: string }
interface OrderItem { menuItem: { name: string }; quantity: number; unitPrice: number }
interface Order     { id: number; total: number; status: string; createdAt: string; items: OrderItem[] }

export default function CashierDashboard() {
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [menu,     setMenu]     = useState<MenuItem[]>([]);
  const [selected, setSelected] = useState<{ id: number; qty: number }[]>([]);
  const [error,    setError]    = useState('');

  useEffect(() => {
    api.get('/cashier/orders').then(r => setOrders(r.data));
    api.get('/chef/menu').then(r => setMenu(r.data)).catch(() => {});
  }, []);

  function toggleItem(id: number) {
    setSelected(prev => {
      const exists = prev.find(s => s.id === id);
      return exists ? prev.filter(s => s.id !== id) : [...prev, { id, qty: 1 }];
    });
  }

  function setQty(id: number, qty: number) {
    setSelected(prev => prev.map(s => s.id === id ? { ...s, qty } : s));
  }

  async function submitOrder() {
    setError('');
    if (selected.length === 0) { setError('Add at least one item.'); return; }
    try {
      await api.post('/cashier/orders', {
        items: selected.map(s => ({ menuItemId: s.id, quantity: s.qty })),
      });
      const r = await api.get('/cashier/orders');
      setOrders(r.data);
      setSelected([]);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create order.');
    }
  }

  async function markDelivered(id: number) {
    await api.patch(`/cashier/orders/${id}/deliver`);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'DELIVERED' } : o));
  }

  const orderTotal = selected.reduce((sum, s) => {
    const item = menu.find(m => m.id === s.id);
    return sum + (item?.price ?? 0) * s.qty;
  }, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Point of Sale</h1>
        <p>Create orders and manage delivery status</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h2 style={{ marginBottom: '1.25rem' }}>New Order</h2>
          {error && <div className="alert alert-error">⚠ {error}</div>}

          <div style={{ maxHeight: 340, overflowY: 'auto', marginBottom: '1rem' }}>
            {menu.map(m => {
              const sel = selected.find(s => s.id === m.id);
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.55rem 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!sel}
                    onChange={() => toggleItem(m.id)}
                    style={{ width: 'auto', accentColor: 'var(--cognac)' }}
                  />
                  <span style={{ flex: 1, fontSize: '0.9rem' }}>{m.name}</span>
                  <span className="price" style={{ fontSize: '0.9rem' }}>${m.price.toFixed(2)}</span>
                  {sel && (
                    <input
                      type="number"
                      min="1"
                      value={sel.qty}
                      onChange={e => setQty(m.id, parseInt(e.target.value))}
                      style={{ width: 56, padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {selected.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0.5rem 0' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Order Total</span>
              <span className="price">${orderTotal.toFixed(2)}</span>
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={submitOrder}>
            Place Order
          </button>
        </div>

        <div>
          <h2 style={{ marginBottom: '1.25rem' }}>Recent Orders</h2>
          {orders.slice(0, 10).map(o => (
            <div className="card" key={o.id} style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-label">Order #{o.id}</span>
                <span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span>
              </div>
              <span className="price" style={{ display: 'block', marginTop: '0.3rem' }}>
                ${o.total.toFixed(2)}
              </span>
              {o.status === 'DONE' && (
                <button
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '0.6rem' }}
                  onClick={() => markDelivered(o.id)}
                >
                  Mark Delivered
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

#### `src/pages/BranchManagerDashboard.tsx`

```typescript
import { useEffect, useState } from 'react';
import api from '../api/axios';

interface SalesData { totalSales: number; orderCount: number }
interface Staff     { id: number; name: string; role: string; salary?: number; isActive: boolean }
interface Order     { id: number; total: number; status: string; createdAt: string; customer?: { name: string } }

export default function BranchManagerDashboard() {
  const [sales,  setSales]  = useState<SalesData | null>(null);
  const [staff,  setStaff]  = useState<Staff[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    api.get('/branch-manager/sales').then(r => setSales(r.data));
    api.get('/branch-manager/staff').then(r => setStaff(r.data));
    api.get('/branch-manager/orders').then(r => setOrders(r.data));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Branch Overview</h1>
        <p>Your location at a glance</p>
      </div>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-value">${sales?.totalSales.toFixed(0) ?? '—'}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{sales?.orderCount ?? '—'}</div>
          <div className="stat-label">Completed Orders</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{staff.length}</div>
          <div className="stat-label">Staff Members</div>
        </div>
      </div>

      <div className="section-title">Staff &amp; Salaries</div>
      <table className="data-table">
        <thead>
          <tr><th>Name</th><th>Role</th><th>Salary</th><th>Status</th></tr>
        </thead>
        <tbody>
          {staff.map(s => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.role}</td>
              <td>{s.salary ? <span className="price" style={{ fontSize: '0.95rem' }}>${s.salary}</span> : '—'}</td>
              <td>
                <span className={`badge badge-${s.isActive ? 'confirmed' : 'cancelled'}`}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="section-title">All Branch Orders</div>
      <table className="data-table">
        <thead>
          <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td style={{ color: 'var(--text-muted)' }}>#{o.id}</td>
              <td>{o.customer?.name ?? 'Walk-in'}</td>
              <td><span className="price" style={{ fontSize: '0.95rem' }}>${o.total.toFixed(2)}</span></td>
              <td><span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span></td>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

#### `src/pages/HQDashboard.tsx`

```typescript
import { useEffect, useState } from 'react';
import api from '../api/axios';

interface BranchSales { branchId: number; branchName: string; totalSales: number; orderCount: number }
interface Staff       { id: number; name: string; role: string; salary?: number; branch?: { name: string } }

export default function HQDashboard() {
  const [sales, setSales] = useState<BranchSales[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  useEffect(() => {
    api.get('/hq/sales').then(r => setSales(r.data));
    api.get('/hq/staff').then(r => setStaff(r.data));
  }, []);

  const totalRevenue = sales.reduce((s, b) => s + b.totalSales, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>HQ Overview</h1>
        <p>Consolidated view across all 7 locations</p>
      </div>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-value">${totalRevenue.toFixed(0)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{sales.reduce((s, b) => s + b.orderCount, 0)}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{staff.length}</div>
          <div className="stat-label">Total Staff</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">7</div>
          <div className="stat-label">Locations</div>
        </div>
      </div>

      <div className="section-title">Sales by Location</div>
      <table className="data-table">
        <thead>
          <tr><th>Location</th><th>Orders</th><th>Revenue</th></tr>
        </thead>
        <tbody>
          {sales.map(b => (
            <tr key={b.branchId}>
              <td>{b.branchName}</td>
              <td>{b.orderCount}</td>
              <td><span className="price" style={{ fontSize: '0.95rem' }}>${b.totalSales.toFixed(2)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="section-title">All Staff</div>
      <table className="data-table">
        <thead>
          <tr><th>Name</th><th>Role</th><th>Location</th><th>Salary</th></tr>
        </thead>
        <tbody>
          {staff.map(s => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.role}</td>
              <td>{s.branch?.name ?? 'HQ'}</td>
              <td>{s.salary ? <span className="price" style={{ fontSize: '0.95rem' }}>${s.salary}</span> : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

#### `src/pages/AdminDashboard.tsx`

```typescript
import { useEffect, useState } from 'react';
import api from '../api/axios';

interface User   { id: number; name: string; email: string; role: string; isActive: boolean; branchId?: number; salary?: number; branch?: { name: string } }
interface Branch { id: number; name: string; address: string; isActive: boolean }

const ROLES = ['ADMIN', 'HQ_MANAGER', 'BRANCH_MANAGER', 'CHEF', 'CASHIER', 'CUSTOMER'];

export default function AdminDashboard() {
  const [users,    setUsers]    = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [uName,   setUName]   = useState('');
  const [uEmail,  setUEmail]  = useState('');
  const [uPass,   setUPass]   = useState('');
  const [uRole,   setURole]   = useState('CASHIER');
  const [uBranch, setUBranch] = useState('');
  const [uSalary, setUSalary] = useState('');
  const [uMsg,    setUMsg]    = useState('');
  const [bName,    setBName]    = useState('');
  const [bAddress, setBAddress] = useState('');
  const [bMsg,     setBMsg]     = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    api.get('/admin/users').then(r => setUsers(r.data));
    api.get('/admin/branches').then(r => setBranches(r.data));
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setUMsg('');
    try {
      await api.post('/admin/users', {
        name: uName, email: uEmail, password: uPass, role: uRole,
        branchId: uBranch ? parseInt(uBranch) : undefined,
        salary:   uSalary ? parseFloat(uSalary) : undefined,
      });
      setUMsg('User created successfully.');
      setUName(''); setUEmail(''); setUPass(''); setUBranch(''); setUSalary('');
      loadAll();
    } catch (err: any) {
      setUMsg(err.response?.data?.error ?? 'Failed.');
    }
  }

  async function addBranch(e: React.FormEvent) {
    e.preventDefault();
    setBMsg('');
    try {
      await api.post('/admin/branches', { name: bName, address: bAddress });
      setBMsg('Location added.');
      setBName(''); setBAddress('');
      loadAll();
    } catch (err: any) {
      setBMsg(err.response?.data?.error ?? 'Failed.');
    }
  }

  async function changeRole(id: number, role: string) {
    const branchId = users.find(u => u.id === id)?.branchId;
    await api.patch(`/admin/users/${id}/role`, { role, branchId });
    loadAll();
  }

  async function toggleUser(id: number, isActive: boolean) {
    if (isActive) await api.patch(`/admin/users/${id}/disable`);
    else          await api.patch(`/admin/users/${id}/enable`);
    loadAll();
  }

  async function deleteUser(id: number) {
    if (!confirm('Permanently delete this user?')) return;
    await api.delete(`/admin/users/${id}`);
    loadAll();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p>System-wide user and location management</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        <div className="card">
          <h2 style={{ marginBottom: '1.25rem' }}>Create User</h2>
          {uMsg && (
            <div className={`alert ${uMsg.includes('success') ? 'alert-success' : 'alert-error'}`}>
              {uMsg.includes('success') ? '✓' : '⚠'} {uMsg}
            </div>
          )}
          <form onSubmit={createUser}>
            <div className="form-group"><label>Name</label><input value={uName} onChange={e => setUName(e.target.value)} placeholder="Full name" required /></div>
            <div className="form-group"><label>Email</label><input type="email" value={uEmail} onChange={e => setUEmail(e.target.value)} placeholder="email@example.com" required /></div>
            <div className="form-group"><label>Password</label><input type="password" value={uPass} onChange={e => setUPass(e.target.value)} placeholder="••••••••" required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Role</label>
                <select value={uRole} onChange={e => setURole(e.target.value)}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Salary</label>
                <input type="number" value={uSalary} onChange={e => setUSalary(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="form-group">
              <label>Location (staff only)</label>
              <select value={uBranch} onChange={e => setUBranch(e.target.value)}>
                <option value="">— None —</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Create User
            </button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1.25rem' }}>Add Location</h2>
          {bMsg && (
            <div className={`alert ${bMsg.includes('added') ? 'alert-success' : 'alert-error'}`}>
              {bMsg.includes('added') ? '✓' : '⚠'} {bMsg}
            </div>
          )}
          <form onSubmit={addBranch}>
            <div className="form-group"><label>Location Name</label><input value={bName} onChange={e => setBName(e.target.value)} placeholder="Steakz ..." required /></div>
            <div className="form-group"><label>Address</label><input value={bAddress} onChange={e => setBAddress(e.target.value)} placeholder="Street, District" required /></div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Add Location
            </button>
          </form>

          <div className="section-title" style={{ marginTop: '1.5rem' }}>All Locations</div>
          {branches.map(b => (
            <div key={b.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--cognac)', fontSize: '0.7rem' }}>✦</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{b.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section-title">All Users</div>
      <table className="data-table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Location</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
              <td>
                <select
                  value={u.role}
                  onChange={e => changeRole(u.id, e.target.value)}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                  }}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{u.branch?.name ?? '—'}</td>
              <td>
                <span className={`badge badge-${u.isActive ? 'confirmed' : 'cancelled'}`}>
                  {u.isActive ? 'Active' : 'Disabled'}
                </span>
              </td>
              <td style={{ display: 'flex', gap: '0.4rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleUser(u.id, u.isActive)}>
                  {u.isActive ? 'Disable' : 'Enable'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

#### `src/pages/NotFoundPage.tsx`

```typescript
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="hero">
      <span style={{ color: 'var(--cognac)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
        Error
      </span>
      <h1 style={{ fontSize: 'clamp(5rem, 15vw, 9rem)', fontStyle: 'italic', marginTop: '0.25rem' }}>404</h1>
      <div className="ornament">Page not found</div>
      <p>This page doesn't exist in our system.</p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Return Home</Link>
    </div>
  );
}
```

---

## 4. Run the full project

Open two terminals from the `steakz/` root:

```bash
# Terminal 1
cd backend && npm run dev
```

```bash
# Terminal 2
cd frontend && npm run dev
```

Open `http://localhost:5173` in a browser.

---

## 5. Post-start seed data (do this via the Admin Dashboard)

1. Log in at `/login` with `admin@steakz.com` / `admin123`
2. Navigate to `/admin`
3. Create staff accounts for each branch using the **Create User** form:
   - One `BRANCH_MANAGER` per branch (assign `branchId`)
   - One or two `CHEF` accounts per branch
   - One or two `CASHIER` accounts per branch
   - One `HQ_MANAGER` account (no branch)
4. Log in as a Branch Manager and add menu items via the menu form or directly via:
   ```
   POST /api/menu
   Authorization: Bearer <BRANCH_MANAGER_TOKEN>
   Body: { "name": "Ribeye 300g", "price": 38.90, "category": "Steaks" }
   ```
5. Add tables to each branch via psql:
   ```sql
   INSERT INTO "Table" ("tableNumber", capacity, "isAvailable", "branchId")
   VALUES (1, 4, true, 1), (2, 6, true, 1), (3, 2, true, 1);
   -- Repeat for branchId 2–7
   ```

---

## 6. Verification checklist

Run through this before declaring the build complete:

### Backend
- [ ] `steakz_db` exists in PostgreSQL
- [ ] `.env` has all 7 variables set
- [ ] No `prisma.config.ts` in project root
- [ ] `npx prisma migrate dev --name init` succeeded
- [ ] First `npm run dev` prints admin created + 7 branch lines
- [ ] Second `npm run dev` prints "skipping" for all
- [ ] `POST /api/auth/login` with admin credentials returns a JWT
- [ ] JWT payload contains `{ id, role: "ADMIN", branchId: null }`
- [ ] Chef JWT contains `branchId: <number>`
- [ ] Chef cannot mark an order from another branch done (expect 403)
- [ ] Customer cannot access `/api/chef/orders` (expect 403)
- [ ] Disabled user cannot log in (expect 401)
- [ ] `POST /api/customer/bookings` without token returns 401

### Frontend
- [ ] `npm run dev` starts on port 5173 without errors
- [ ] Landing page loads with dark cognac/amber luxury theme
- [ ] Register creates a customer account
- [ ] Login stores token and redirects to correct dashboard for each role
- [ ] Logout clears localStorage and redirects to `/`
- [ ] `/admin` redirects to `/login` when not authenticated
- [ ] `/chef` redirects to `/` when logged in as CUSTOMER
- [ ] Menu page shows branch selector and loads items
- [ ] Book Table page requires login (guest → `/login`)
- [ ] Customer dashboard shows bookings + orders
- [ ] Chef dashboard shows pending orders with Mark Complete button
- [ ] Cashier dashboard: order creation panel with running total works
- [ ] Branch Manager dashboard shows stats, staff, orders
- [ ] HQ dashboard shows all-branch sales + staff
- [ ] Admin dashboard: create user, add branch, manage users all functional

---

## 7. Common errors and fixes

| Error | Cause | Fix |
|---|---|---|
| `Cannot find module '@prisma/client'` | Client not generated | Run `npx prisma generate` |
| `P1001: Can't reach database server` | PostgreSQL not running or wrong password | Check `DATABASE_URL` in `.env` |
| `prisma.config.ts conflicts` | Auto-generated config file | Delete `prisma.config.ts` from root |
| `CORS error in browser` | Frontend URL mismatch | Check `FRONTEND_URL` in `.env` matches Vite port |
| `401 on valid token` | JWT_SECRET mismatch between sign and verify | Ensure `.env` is loaded; restart backend |
| `403 on branch route` | User has no `branchId` in DB | Re-create user with `branchId` via admin panel |
| `404 on /api/...` | Route not mounted in `index.ts` | Check all `app.use(...)` lines in `src/index.ts` |
| Vite proxy not forwarding | `vite.config.ts` proxy missing | Add `proxy: { '/api': 'http://localhost:3001' }` |

---

## 8. Design system reference

### New theme — Dark Luxury (Cognac)

| Token | Value | Usage |
|---|---|---|
| `--cognac` | `#c17f3a` | Primary accent, icons, stat values |
| `--cognac-light` | `#d9a05a` | Links, hover states, h3 |
| `--cognac-pale` | `#e8c28a` | h1 headings, price values |
| `--bg-base` | `#0e0c0a` | Page background |
| `--bg-card` | `#1a1714` | Card surfaces |
| `--text-primary` | `#ede8df` | Body text |
| `--text-muted` | `#5e5345` | Placeholder, labels |

### Fonts
- **Playfair Display** (serif, italic) — headings, brand, hero, prices
- **DM Sans** — body text, labels, buttons, navigation

### Key design patterns
- Stat boxes use a top-edge gradient line (`::before` pseudo-element)
- Hero uses two radial gradients and a decorative vertical top line
- `.ornament` class creates the centered decorative divider with `::before/::after` lines
- `.section-title` class adds a trailing horizontal rule after every section heading
- Cards have dual box-shadow (base + glow on hover)
- Auth wrapper uses a subtle dual-radial background with no harsh vignette

---

## 9. Out of scope (do not build — future work)

- Real-time order updates (WebSockets)
- Email notifications
- PDF receipts
- Refresh tokens / httpOnly cookie auth
- Inventory management
- Staff shift scheduling
- Pagination
- Image uploads for menu items
- Mobile app

---

*End of build instructions. All code above is complete and production-ready for a development environment.*
