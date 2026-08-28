# Shared Types & Utilities

## โครงสร้าง

```
shared/
├── types/         # Type definitions ใช้ร่วมกัน
│   ├── index.ts   # Core types (User, AuthResponse, ApiError, DB row types)
│   ├── database.ts # Database row types
│   └── {entity}.ts # Entity-specific types (DTOs, filters, etc.)
├── constants/     # Shared constants (HTTP_STATUS, ERROR_CODES)
└── utils/         # Shared utility functions (formatDateTime, etc.)
```

## หลักการ

- **shared/** เป็น single source of truth สำหรับ types ที่ client + server ใช้ร่วมกัน
- Client import: `import { ... } from '../../shared/types'`
- Server import: `import { ... } from '../../shared/types'`
- ป้องกัน type drift ระหว่าง client/server

## Pattern ที่ใช้

- **Row types**: ตรงกับ Oracle table columns (snake_case → export as PascalCase)
- **DTOs**: Data Transfer Objects สำหรับ API request/response
- **Filter types**: สำหรับ query parameters
- **Constants**: HTTP status codes, error codes ที่ใช้ทั้ง 2 ฝั่ง
