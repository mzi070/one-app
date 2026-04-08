# OneApp - All-in-One Business Management Platform

A comprehensive single-page business management application built with Next.js, featuring POS, HR Management, Accounting, and PDF Tools.

## Features

### Point of Sale (POS)
- Product catalog with search and category filtering
- Real-time cart management with quantity controls
- Multiple payment methods (Cash, Card, Mobile)
- Customer management with credit tracking
- Sales reports and analytics
- Inventory management with stock tracking

### HR Management
- Employee directory with detailed profiles
- Attendance tracking (clock in/out)
- Leave request management with approval workflow
- Payroll processing with overtime, deductions, and bonuses
- Department management with budgets

### Accounting
- Chart of Accounts (Assets, Liabilities, Equity, Revenue, Expense)
- Invoice creation, sending, and tracking
- Expense management with category tracking
- Double-entry journal entries
- Financial reports (Balance Sheet, Income Statement, Cash Flow)

### PDF Tools
- Merge, Split, Compress, Rotate, Remove/Extract/Rearrange Pages
- Images to PDF, PDF to Images, Add Watermark, Page Numbers, Protect PDF

## Getting Started

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deploy to Vercel

1. Push to GitHub
2. Import at [vercel.com](https://vercel.com)
3. For database, set up [Turso](https://turso.tech) and add `DATABASE_URL` env var
4. The app works in demo mode without a database

## Tech Stack

Next.js 16 | TypeScript | Tailwind CSS | Prisma | pdf-lib | Zustand
