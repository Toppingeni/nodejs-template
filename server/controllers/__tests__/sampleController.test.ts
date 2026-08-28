import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the service
vi.mock("../../services/sampleService", () => ({
    sampleService: {
        getAll: vi.fn(),
        getById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
    },
}));

// Mock the logger
vi.mock("../../utils/logger", () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

import { SampleController } from "../sampleController";
import { sampleService } from "../../services/sampleService";

const mockedService = vi.mocked(sampleService);

describe("SampleController", () => {
    let controller: SampleController;

    beforeEach(() => {
        vi.clearAllMocks();
        controller = new SampleController();
        // Mock TSOA's setStatus method
        controller.setStatus = vi.fn();
    });

    describe("getAll", () => {
        it("should return list of samples with success message", async () => {
            const mockData = [
                { id: "1", name: "Sample 1" },
                { id: "2", name: "Sample 2" },
            ];
            mockedService.getAll.mockResolvedValue(mockData as never);

            const result = await controller.getAll("test", "active");

            expect(mockedService.getAll).toHaveBeenCalledWith({
                search: "test",
                status: "active",
            });
            expect(result).toEqual({
                message: "ดึงข้อมูลสำเร็จ",
                data: mockData,
            });
        });

        it("should throw when service throws", async () => {
            mockedService.getAll.mockRejectedValue(new Error("DB error"));

            await expect(controller.getAll()).rejects.toThrow("DB error");
        });
    });

    describe("getById", () => {
        it("should return sample when found", async () => {
            const mockData = { id: "1", name: "Sample 1" };
            mockedService.getById.mockResolvedValue(mockData as never);

            const result = await controller.getById("1");

            expect(mockedService.getById).toHaveBeenCalledWith("1");
            expect(result).toEqual({
                message: "ดึงข้อมูลสำเร็จ",
                data: mockData,
            });
        });

        it("should return 404 response when not found", async () => {
            mockedService.getById.mockResolvedValue(null);

            const result = await controller.getById("nonexistent");

            expect(controller.setStatus).toHaveBeenCalledWith(404);
            expect(result).toEqual({
                message: "ไม่พบข้อมูล",
                data: null,
            });
        });
    });

    describe("create", () => {
        it("should create and return id with 201 status", async () => {
            mockedService.create.mockResolvedValue({ id: "new-id" });

            const result = await controller.create({
                name: "New Sample",
                description: "Desc",
            });

            expect(controller.setStatus).toHaveBeenCalledWith(201);
            expect(result).toEqual({
                message: "สร้างข้อมูลสำเร็จ",
                data: { id: "new-id" },
            });
        });
    });
});
