import { sampleRepository } from "../repositories/sampleRepository";
import { convertSnakeToCamelCase } from "../utils/keyConverter";
import { context } from "../utils/context";
import type {
  Sample,
  CreateSampleDto,
  UpdateSampleDto,
  SampleFilters,
} from "../../shared/types/sample";
import { generateId } from "../../shared/utils";

class SampleService {
  /** ดึงรายการทั้งหมด พร้อม filter */
  async getAll(filters?: SampleFilters): Promise<Sample[]> {
    const rows = await sampleRepository.findAll(filters);
    return convertSnakeToCamelCase(rows) as unknown as Sample[];
  }

  /** ดึงข้อมูลตาม ID */
  async getById(id: string): Promise<Sample | null> {
    const row = await sampleRepository.findById(id);
    if (!row) return null;
    return convertSnakeToCamelCase(row) as unknown as Sample;
  }

  /** ดึง userId จาก AsyncLocalStorage context */
  private getUserId(): string {
    return context.getStore()?.userId || "system";
  }

  /** สร้างข้อมูลใหม่ */
  async create(
    data: CreateSampleDto & { userId?: string },
  ): Promise<{ id: string }> {
    const id = generateId();
    await sampleRepository.create({
      id,
      name: data.name,
      description: data.description,
      createdBy: data.userId || this.getUserId(),
    });
    return { id };
  }

  /** แก้ไขข้อมูล */
  async update(
    id: string,
    data: UpdateSampleDto & { userId?: string },
  ): Promise<{ id: string }> {
    await sampleRepository.update(id, {
      name: data.name,
      description: data.description,
      updatedBy: data.userId || this.getUserId(),
    });
    return { id };
  }

  /** ลบข้อมูล (soft delete) */
  async remove(id: string): Promise<void> {
    await sampleRepository.softDelete(id, this.getUserId());
  }
}

export const sampleService = new SampleService();
