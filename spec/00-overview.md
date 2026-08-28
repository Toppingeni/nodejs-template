# Project Template Overview

## Monorepo Structure

```
root/
├── client/          # React SPA (Vite + SWC)
├── server/          # Express API (Node.js + tsx)
├── shared/          # Shared types & utils ใช้ร่วมกันทั้ง client/server
├── public/          # Static assets
├── uploads/         # User-uploaded files
├── dist/            # Production build output
├── vite.config.ts        # Client build config
├── vite.config.server.ts # Server build config
├── tailwind.config.ts
├── tsconfig.json         # Base TS config
├── tsconfig.app.json     # Client TS config
├── tsconfig.node.json    # Server TS config
└── package.json          # Single package.json (ไม่ใช่ workspace)
```

## Tech Stack Summary

| Layer    | Technology                                                   |
| -------- | ------------------------------------------------------------ |
| Frontend | React 18 + TypeScript + Vite (SWC)                           |
| UI       | shadcn/ui (Radix) + Tailwind CSS + MUI                       |
| State    | TanStack Query (server state) + Redux Toolkit (client state) |
| Forms    | React Hook Form + Zod validation                             |
| Backend  | Express.js + TypeScript (tsx --watch)                        |
| Database | Oracle 11g (oracledb driver, raw SQL)                        |
| Auth     | JWT (2 แบบ: Login form + Token URL)                          |
| Deploy   | PM2 (ecosystem.config.cjs)                                   |

## Dev Commands

```bash
npm run dev            # รัน client + server พร้อมกัน (concurrently)
npm run dev:frontend   # รัน Vite dev server เท่านั้น
npm run dev:backend    # รัน Express server เท่านั้น (tsx --watch)
npm run build          # Build ทั้ง client + server
npm start              # Production start (node dist/server/node-build.mjs)
```

## Dev Proxy

Vite proxy `/api` ไปที่ Express server (default port 3000) เพื่อให้ client เรียก API ผ่าน relative path ได้เลย
