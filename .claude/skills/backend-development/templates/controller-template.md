# Controller Template

TSOA controller extending `BaseController`.

```typescript
import {
    Body,
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Route,
    Tags,
    Query,
    Path,
    SuccessResponse,
    Response,
    Security,
} from "tsoa";
import { BaseController } from "./base.controller";
import { asyncErrorWrapper } from "../utils/async-error-wrapper";
import featureService from "../services/featureService";

// Request/Response types
interface GetFeaturesResponse {
    message: string;
    data: FeatureDto[];
}

interface CreateFeatureRequest {
    name: string;
    description?: string;
}

interface CreateFeatureResponse {
    message: string;
    data: { id: number };
}

@Route("features")
@Tags("Features")
export class FeatureController extends BaseController {
    // #region Query

    @Get("/")
    @SuccessResponse("200", "Success")
    @Response("500", "Error")
    public async getFeatures(
        @Query() search?: string,
        @Query() status?: string,
    ): Promise<GetFeaturesResponse> {
        return asyncErrorWrapper(async () => {
            const result = await featureService.getFeatures({ search, status });
            return this.handleSuccess(result);
        }, this.handleError);
    }

    @Get("/{id}")
    @SuccessResponse("200", "Success")
    @Response("404", "Not Found")
    public async getFeatureById(@Path() id: number): Promise<GetFeaturesResponse> {
        return asyncErrorWrapper(async () => {
            const result = await featureService.getById(id);
            return this.handleSuccess(result);
        }, this.handleError);
    }

    // #endregion

    // #region Command

    @Post("/")
    @SuccessResponse("200", "Created")
    @Response("400", "Validation Error")
    public async createFeature(@Body() body: CreateFeatureRequest): Promise<CreateFeatureResponse> {
        return asyncErrorWrapper(async () => {
            const result = await featureService.create(body);
            return this.handleSuccess(result);
        }, this.handleError);
    }

    // #endregion
}
```

## Rules

- **Extends** `BaseController` — provides `handleSuccess()` and `handleError()`
- **Zero business logic** — delegate everything to service
- **asyncErrorWrapper** — wraps all handler logic
- **TSOA decorators** — `@Route`, `@Tags`, `@Get/@Post/@Patch/@Delete`, `@SuccessResponse`, `@Response`
- **After changes** — always run `pnpm tsoa:gen`
- **NEVER edit** generated `server/tsoa/routes.ts` or `server/tsoa/swagger.json`
