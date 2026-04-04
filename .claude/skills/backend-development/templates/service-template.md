# Service Template

Business logic + Zod validation layer.

```typescript
import { z } from "zod";
import featureRepository from "../repositories/featureRepository";

// Validation schemas
const GetFeaturesInputSchema = z.object({
    search: z.string().optional(),
    status: z.string().optional(),
});

const CreateFeatureInputSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

export class FeatureService {
    constructor(private readonly repo: typeof featureRepository) {}

    // #region Query

    async getFeatures(input: unknown) {
        const { search, status } = GetFeaturesInputSchema.parse(input);
        const rows = await this.repo.getFeatures(search, status);
        // Map DB rows to DTOs
        return rows.map((r) => ({
            id: r.FEATURE_ID,
            name: r.FEATURE_NAME,
            description: r.DESCRIPTION,
            status: r.STATUS,
        }));
    }

    async getById(id: number) {
        const row = await this.repo.getById(id);
        if (!row) throw new Error("Feature not found");
        return {
            id: row.FEATURE_ID,
            name: row.FEATURE_NAME,
            description: row.DESCRIPTION,
        };
    }

    // #endregion

    // #region Command

    async create(input: unknown) {
        const data = CreateFeatureInputSchema.parse(input);
        const result = await this.repo.create(data.name, data.description);
        return { id: result.insertId, rowsAffected: result.rowsAffected ?? 0 };
    }

    // #endregion
}

export default new FeatureService(featureRepository);
```

## Rules

- **Zod validation** — validate ALL input before calling repository
- **Business logic** — transformations, orchestration, error throwing lives here
- **DTO mapping** — map Oracle UPPER_CASE columns to camelCase DTOs
- **`#region Query` / `#region Command`** — separate reads from writes
- **Typed errors** — throw meaningful errors (not generic Error)
