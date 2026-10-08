# StorageOps

Storage infrastructure management dashboard for VMware datastores, Synology NAS volumes, and VM storage.

## Features

- **Dashboard** — Capacity overview, usage charts, active alerts at a glance
- **VMware Datastores** — Track VMFS, NFS, vSAN, and vVOL datastores with capacity bars and status
- **Synology NAS** — Manage NAS volumes grouped by device, RAID type, disk health, and shares
- **Virtual Machines** — Monitor VM disk usage, provisioned vs. used storage, and snapshot inventory
- **Alerts** — Threshold-based capacity and status alerts with acknowledge/dismiss workflow

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **React 19** + Zustand (state management)
- **MongoDB** + Mongoose (data storage)
- **Tailwind CSS 4** (styling)
- **Recharts** (charts)
- **Lucide React** (icons)

## Getting Started

```bash
# Install dependencies
npm install

# Set environment variable
MONGODB_URI=mongodb://localhost:27017/storageops

# Run development server
npm run dev
```

## Seed Data

POST `/api/seed` to populate the database with realistic sample data covering VMware datastores, Synology volumes, VMs, and alerts.

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
