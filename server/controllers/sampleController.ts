import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Route,
  Tags,
  Query,
  Path,
  Body,
} from "tsoa";
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
export class SampleController extends Controller {
  /** ดึงรายการทั้งหมด */
  @Get("/")
  public async getAll(
    @Query() search?: string,
    @Query() status?: string,
  ): Promise<SampleListResponse> {
    const data = await sampleService.getAll({ search, status });
    return { message: "ดึงข้อมูลสำเร็จ", data };
  }

  /** ดึงข้อมูลตาม ID */
  @Get("{id}")
  public async getById(@Path() id: string): Promise<SampleDetailResponse> {
    const data = await sampleService.getById(id);
    if (!data) {
      this.setStatus(404);
      return { message: "ไม่พบข้อมูล", data: null };
    }
    return { message: "ดึงข้อมูลสำเร็จ", data };
  }

  /** สร้างข้อมูลใหม่ */
  @Post("/")
  public async create(
    @Body() body: CreateSampleBody,
  ): Promise<SampleCreateResponse> {
    const data = await sampleService.create(body);
    this.setStatus(201);
    return { message: "สร้างข้อมูลสำเร็จ", data };
  }

  /** แก้ไขข้อมูล */
  @Put("{id}")
  public async update(
    @Path() id: string,
    @Body() body: UpdateSampleBody,
  ): Promise<SampleCreateResponse> {
    const data = await sampleService.update(id, body);
    return { message: "อัปเดตข้อมูลสำเร็จ", data };
  }

  /** ลบข้อมูล (soft delete) */
  @Delete("{id}")
  public async remove(
    @Path() id: string,
  ): Promise<{ message: string; data: null }> {
    await sampleService.remove(id);
    return { message: "ลบข้อมูลสำเร็จ", data: null };
  }
}

export default SampleController;
