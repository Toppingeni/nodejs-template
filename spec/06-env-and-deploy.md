# Environment & Deployment

## Environment Variables

### Client (.env)

```
VITE_API_URL=http://localhost:3000      # App API (Express server เดียวกัน)
VITE_API_AUTH_URL=https://...           # External Auth API (ระบบ auth ภายนอก)
VITE_BYPASS_AUTH=true                   # Dev only: ข้าม auth ใช้ mock user
VITE_PORT=8080                          # Vite dev server port
```

### Server (.env)

```
PORT=3000                               # Express server port
ORACLE_CLIENT_PATH=/path/to/oracle      # Oracle client library path
ORACLE_USER=...                         # Oracle credentials
ORACLE_PASSWORD=...
ORACLE_CONNECT_STRING=...
PING_MESSAGE=ping                       # Health check message
```

---

## Server Entry Points

มี 2 ไฟล์ที่ทำหน้าที่ต่างกันตาม environment:

### `server/start.ts` — Dev Entry Point

```ts
import { bootstrap } from './node-build';
bootstrap();
```

- รันผ่าน `tsx --watch server/start.ts` (hot-reload)
- เรียก `bootstrap()` ตรงๆ เพราะ tsx รันเป็น main module เสมอ

### `server/node-build.ts` — Production Entry Point + Bootstrap Logic

ไฟล์นี้รวมทุกอย่างที่ต้องการสำหรับ production:

```ts
export const bootstrap = () => {
  // 1. สร้าง Express app จาก createServer() (index.ts)
  const app = createServer();

  // 2. Serve SPA static files (dist/spa/)
  app.use(express.static(distPath));

  // 3. SPA fallback: route ที่ไม่ใช่ /api/* → ส่ง index.html
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  // 4. Error handling middlewares (ต้องอยู่หลังสุด)
  app.use(errorLoggingMiddleware);
  app.use(notFoundHandler);
  app.use(errorHandler);

  // 5. Start listening
  app.listen(port);

  // 6. Graceful shutdown (SIGTERM, SIGINT)
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};
```

**Auto-detect main module**: ตรวจว่าถูกรันตรง หรือรันผ่าน PM2 → ถ้าใช่จะเรียก `bootstrap()` เอง

```ts
const isMainModule = process.argv[1] === currentFile || process.argv[1].endsWith('node-build.mjs');

if (isMainModule || process.env.pm_id) {
  bootstrap();
}
```

### Flow Diagram

```
[Development]
  npm run dev:backend
  → tsx --watch server/start.ts
  → start.ts เรียก bootstrap()
  → Express app (API only, ไม่ serve SPA)
  → Vite dev server serve frontend แยก + proxy /api

[Production]
  npm run build
  → vite build client → dist/spa/
  → vite build server → dist/server/production.mjs

  npm start (หรือ PM2)
  → node dist/server/production.mjs
  → node-build.ts detect เป็น main → bootstrap()
  → Express app serve ทั้ง API + SPA static files
```

---

## Server Build (`vite.config.server.ts`)

```ts
export default defineConfig({
  build: {
    lib: {
      entry: 'server/node-build.ts',
      formats: ['es'], // ESM output
    },
    outDir: 'dist/server',
    target: 'node22',
    ssr: true,
    rollupOptions: {
      external: [
        // ไม่ bundle เข้า (ใช้จาก node_modules)
        'fs',
        'path',
        'url',
        'http',
        'https',
        'os',
        'crypto',
        'stream',
        'util',
        'events',
        'buffer',
        'child_process',
        'express',
        'cors',
        'oracledb',
      ],
      output: {
        entryFileNames: '[name].mjs', // → production.mjs
      },
    },
    minify: false, // อ่านง่ายสำหรับ debug
    sourcemap: true,
  },
});
```

**Key points:**

- Output เป็น **single ESM file** (`.mjs`)
- `express`, `cors`, `oracledb` ไม่ bundle → ต้องมี `node_modules` ตอน deploy
- Node built-ins ก็ external ทั้งหมด

---

## Deploy with PM2

### `ecosystem.config.cjs`

```js
module.exports = {
  apps: [
    {
      name: 'my-app',
      cwd: 'E:\\Deploy\\Pm2\\my-app',
      script: 'dist\\server\\node-build.mjs',
      interpreter: 'node',
      env: { NODE_ENV: 'production' },
      exec_mode: 'fork',
      instances: 1,
      time: true,
      out_file: 'logs\\out.log',
      error_file: 'logs\\error.log',
    },
  ],
};
```

### Deploy Steps

```bash
# 1. Build
npm run build

# 2. Copy ไปเครื่อง deploy
#    ต้องมี: dist/, node_modules/, ecosystem.config.cjs, .env

# 3. Start with PM2
pm2 start ecosystem.config.cjs
pm2 save
```

---

## Vault / Secret Management

- ใช้ vault tool สำหรับดึง secrets ลง .env files (เช่น `igs-vault` หรือเครื่องมืออื่นตามองค์กร)
- เพิ่ม script ใน package.json ตามต้องการ
