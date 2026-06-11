# Steakz Testing Checklist

## Setup
- [ ] Confirm `.env` is created from `.env.example` with valid values.
- [ ] Confirm PostgreSQL database is available and `DATABASE_URL` is correct.
- [ ] Run `npm install` in both `backend/` and `frontend/`.
- [ ] Run `npm run build` in both `backend/` and `frontend/` successfully.

## Backend
- [ ] Start backend dev server with `npm run dev`.
- [ ] Verify `backend/src/lib/seed.ts` seed runs without errors.
- [ ] Confirm API responds on `http://localhost:3001/api/public/menu`.
- [ ] Confirm auth login returns JWT for valid credentials.
- [ ] Confirm role-protected endpoints reject unauthorized access.
- [ ] Confirm admin routes require `ADMIN` role and can manage users and locations.

## Frontend
- [ ] Verify the landing page renders correctly.
- [ ] Verify login and registration pages function and redirect after auth.
- [ ] Verify menu page loads menu items from the API.
- [ ] Verify branches page loads branch data from the API.
- [ ] Verify 404 page appears for unknown routes.

## Authentication and Roles
- [ ] Test logging in as `CUSTOMER` and accessing `/customer` and `/book`.
- [ ] Test logging in as `CHEF` and accessing `/chef` only.
- [ ] Test logging in as `CASHIER` and accessing `/cashier` only.
- [ ] Test logging in as `BRANCH_MANAGER` and accessing `/branch-manager` only.
- [ ] Test logging in as `HQ_MANAGER` and accessing `/hq` only.
- [ ] Test logging in as `ADMIN` and accessing `/admin` only.
- [ ] Confirm unauthorized users are redirected to `/login`.
- [ ] Confirm disabled users cannot log in.

## Admin Features
- [ ] Create a new user from the admin dashboard.
- [ ] Create a new branch location from the admin dashboard.
- [ ] Update a user role from the admin dashboard.
- [ ] Enable and disable a user account from the admin dashboard.
- [ ] Delete a user from the admin dashboard.

## Workflow Tests
- [ ] Customer can book a table from the booking page.
- [ ] Branch manager can view bookings and branch reports.
- [ ] Chef can view and update order status.
- [ ] Cashier can view settled orders and process payments.
- [ ] HQ manager can view branch summaries and sales data.

## Regression and Edge Cases
- [ ] Confirm menu page still loads after auth state changes.
- [ ] Confirm app does not crash when API returns errors.
- [ ] Confirm protected routes block all unauthorized access.
- [ ] Confirm data updates refresh on create/edit actions.
- [ ] Confirm the app handles missing branch or user data gracefully.
