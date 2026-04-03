import { Get, Post, Put, Delete, Route, Tags, Query, Path, Body } from "@tsoa/runtime";
import { BaseController } from "./BaseController";
import { sampleService } from "../services/sampleService";
import { Sample } from "../../shared/types/sample";

// ===== DTOs สำหรับ TSOA =====

export interface CreateSampleBody {
    name: string;
    description?: string;
    userId?: string;
}

export interface UpdateSampleBody {
    name?: string;
    description?: string;
    userId?: string;
}

export interface SampleListResponse {
    message: string;
    data: Sample[];
}

export interface SampleDetailResponse {
    message: string;
    data: Sample | null;
}

export interface SampleCreateResponse {
    message: string;
    data: { id: string };
}

// ===== Controller =====

@Route("sample")
@Tags("Sample")
export class SampleController extends BaseController {
    /** ดึงรายการทั้งหมด */
    @Get("/")
    public async getAll(
        @Query() search?: string,
        @Query() status?: string,
    ): Promise<SampleListResponse> {
        try {
            const data = await sampleService.getAll({ search, status });
            return this.handleSuccess(data, "ดึงข้อมูลสำเร็จ");
        } catch (error) {
            this.handleError(error, "SampleController.getAll");
        }
    }

    /** ดึงข้อมูลตาม ID */
    @Get("{id}")
    public async getById(@Path() id: string): Promise<SampleDetailResponse> {
        try {
            const data = await sampleService.getById(id);
            if (!data) {
                return this.handleSuccess(null, "ไม่พบข้อมูล", 404);
            }
            return this.handleSuccess(data, "ดึงข้อมูลสำเร็จ");
        } catch (error) {
            this.handleError(error, "SampleController.getById");
        }
    }

    /** สร้างข้อมูลใหม่ */
    @Post("/")
    public async create(@Body() body: CreateSampleBody): Promise<SampleCreateResponse> {
        try {
            const data = await sampleService.create(body);
            return this.handleSuccess(data, "สร้างข้อมูลสำเร็จ", 201);
        } catch (error) {
            this.handleError(error, "SampleController.create");
        }
    }

    /** แก้ไขข้อมูล */
    @Put("{id}")
    public async update(
        @Path() id: string,
        @Body() body: UpdateSampleBody,
    ): Promise<SampleCreateResponse> {
        try {
            const data = await sampleService.update(id, body);
            return this.handleSuccess(data, "อัปเดตข้อมูลสำเร็จ");
        } catch (error) {
            this.handleError(error, "SampleController.update");
        }
    }

    /** ลบข้อมูล (soft delete) */
    @Delete("{id}")
    public async remove(@Path() id: string): Promise<{ message: string; data: null }> {
        try {
            await sampleService.remove(id);
            return this.handleSuccess(null, "ลบข้อมูลสำเร็จ");
        } catch (error) {
            this.handleError(error, "SampleController.remove");
        }
    }
}

export default SampleController;
