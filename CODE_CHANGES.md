# Code Changes Reference - Turn 14

## Files Modified

### Backend Routes (3 files)

#### 1. `backend/src/routes/cashierRoutes.ts`
**Change**: Added payment status endpoint

```typescript
router.patch('/orders/:id/pay', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const id = Number(req.params.id);
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.branchId !== branchId) {
    res.status(403).json({ error: 'Order not found in your branch.' });
    return;
  }
  const updated = await prisma.order.update({ where: { id }, data: { paymentStatus: 'PAID' } });
  res.json(updated);
});
```

#### 2. `backend/src/routes/chefRoutes.ts`
**Changes**: 
- Added `preparing` endpoint for starting preparation
- Chef orders now show PENDING and PREPARING only
- Can transition PENDING → PREPARING → DONE

```typescript
router.patch('/orders/:id/preparing', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const id = Number(req.params.id);
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.branchId !== branchId) {
    res.status(403).json({ error: 'Order not found in your branch.' });
    return;
  }
  const updated = await prisma.order.update({ where: { id }, data: { status: 'PREPARING' } });
  res.json(updated);
});
```

#### 3. `backend/src/routes/branchManagerRoutes.ts`
**Change**: Added booking status update endpoint

```typescript
router.patch('/bookings/:id/status', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const id = Number(req.params.id);
  const { status } = req.body as { status?: string };

  if (!status) {
    res.status(400).json({ error: 'status is required.' });
    return;
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { table: true },
  });

  if (!booking || booking.table.branchId !== branchId) {
    res.status(403).json({ error: 'Booking not found in your branch.' });
    return;
  }

  const updated = await prisma.booking.update({ where: { id }, data: { status: status as any } });
  res.json(updated);
});
```

### Frontend Dashboards (3 files)

#### 1. `frontend/src/pages/CashierDashboard.tsx`
**Changes**:
- Added `paymentStatus?: string` to Order interface
- Added `markPaid()` function
- Order cards now show both status and payment status badges
- "Mark Paid" button for UNPAID orders

**Key Lines**:
- Line 23: Added paymentStatus to interface
- Line 75: Added markPaid function that calls `/cashier/orders/:id/pay`
- Lines 105-115: Order card shows payment status badge
- Lines 116-125: Conditional buttons - "Mark Paid" or "Mark Delivered"

#### 2. `frontend/src/pages/ChefDashboard.tsx`
**Changes**:
- Added `paymentStatus?: string` to Order interface
- Added `markPreparing()` function
- Chef workflow: PENDING → (Start Preparing) → PREPARING → (Mark Complete) → DONE
- Buttons change based on current status

**Key Lines**:
- Line 11: Added paymentStatus to interface
- Line 28: Added markPreparing function
- Lines 76-90: Conditional button logic for status transitions

#### 3. `frontend/src/pages/CustomerDashboard.tsx`
**Changes**:
- Added `paymentStatus?: string` to Order interface
- Order cards display both status and payment status badges

**Key Lines**:
- Line 22: Added paymentStatus to interface  
- Lines 106-110: Display payment status badge in order card

### Database Schema (2 files)

#### 1. `backend/prisma/schema.prisma`
**Change**: Added PaymentStatus enum and field to Order model

```prisma
enum PaymentStatus {
  UNPAID
  PAID
}

model Order {
  ...
  paymentStatus PaymentStatus @default(UNPAID)
  ...
}
```

#### 2. `backend/prisma/migrations/20260607061444_init/migration.sql`
**Change**: Added paymentStatus column to Order table creation

```sql
ALTER TABLE "Order" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID'
```

## API Endpoints Summary

### Cashier API
- `PATCH /api/cashier/orders/:id/pay` - Mark order as paid

### Chef API  
- `PATCH /api/chef/orders/:id/preparing` - Start preparing order
- `PATCH /api/chef/orders/:id/done` - Mark order as complete

### Branch Manager API
- `PATCH /api/branch-manager/bookings/:id/status` - Update booking status

## Interface Changes

### CashierDashboard & ChefDashboard & CustomerDashboard
```typescript
interface Order {
  id: number;
  total: number;
  status: string;
  paymentStatus?: string;  // NEW
  createdAt: string;
  // ... other fields
}
```

## Workflow Logic

### Complete Order Lifecycle
```
1. Customer creates order
   → Order.status = PENDING
   → Order.paymentStatus = UNPAID

2. Cashier marks as paid
   → Order.paymentStatus = PAID
   → (Chef can now see order)

3. Chef starts preparing
   → Order.status = PREPARING

4. Chef marks complete  
   → Order.status = DONE

5. Cashier marks delivered
   → Order.status = DELIVERED

6. Customer sees final state
   → Status: DELIVERED, PaymentStatus: PAID
```

## Testing Checklist

- [ ] Backend can compile with new route changes
- [ ] Cashier API `/pay` endpoint works
- [ ] Chef API `/preparing` endpoint works
- [ ] Buttons appear and call correct endpoints
- [ ] UI updates after button clicks (order status/payment status)
- [ ] Complete workflow test: Customer → Cashier → Chef → Delivery
- [ ] Database migration applies on backend restart
