import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the service
vi.mock("../../repositories/sampleRepository", () => ({
    sampleRepository: {
        findAll: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        softDelete: vi.fn(),
    },
}));

vi.mock("../../utils/keyConverter", () => ({
    convertSnakeToCamelCase: vi.fn((data) => data),
}));

vi.mock("../../utils/context", () => ({
    context: {
        getStore: vi.fn(() => ({ userId: "test-user" })),
    },
}));

vi.mock("../../../shared/utils", () => ({
    generateId: vi.fn(() => "generated-id-123"),
}));

import { sampleService } from "../sampleService";
import { sampleRepository } from "../../repositories/sampleRepository";

const mockedRepo = vi.mocked(sampleRepository);

describe("SampleService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getAll", () => {
        it("should return all samples", async () => {
            const mockRows = [
                { id: "1", name: "Sample 1" },
                { id: "2", name: "Sample 2" },
            ];
            mockedRepo.findAll.mockResolvedValue(mockRows as never);

            const result = await sampleService.getAll();

            expect(mockedRepo.findAll).toHaveBeenCalledWith(undefined);
            expect(result).toEqual(mockRows);
        });

        it("should pass filters to repository", async () => {
            const filters = { search: "test", status: "A" as const };
            mockedRepo.findAll.mockResolvedValue([] as never);

            await sampleService.getAll(filters);

            expect(mockedRepo.findAll).toHaveBeenCalledWith(filters);
        });
    });

    describe("getById", () => {
        it("should return a sample when found", async () => {
            const mockRow = { id: "1", name: "Sample 1" };
            mockedRepo.findById.mockResolvedValue(mockRow as never);

            const result = await sampleService.getById("1");

            expect(mockedRepo.findById).toHaveBeenCalledWith("1");
            expect(result).toEqual(mockRow);
        });

        it("should return null when not found", async () => {
            mockedRepo.findById.mockResolvedValue(null as never);

            const result = await sampleService.getById("nonexistent");

            expect(mockedRepo.findById).toHaveBeenCalledWith("nonexistent");
            expect(result).toBeNull();
        });
    });

    describe("create", () => {
        it("should create a sample and return the generated id", async () => {
            mockedRepo.create.mockResolvedValue(undefined as never);

            const result = await sampleService.create({
                name: "New Sample",
                description: "A description",
            });

            expect(result).toEqual({ id: "generated-id-123" });
            expect(mockedRepo.create).toHaveBeenCalledWith({
                id: "generated-id-123",
                name: "New Sample",
                description: "A description",
                createdBy: "test-user",
            });
        });

        it("should use provided userId over context userId", async () => {
            mockedRepo.create.mockResolvedValue(undefined as never);

            await sampleService.create({
                name: "New Sample",
                userId: "explicit-user",
            });

            expect(mockedRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ createdBy: "explicit-user" }),
            );
        });
    });

    describe("update", () => {
        it("should update a sample and return the id", async () => {
            mockedRepo.update.mockResolvedValue(undefined as never);

            const result = await sampleService.update("1", {
                name: "Updated",
                description: "Updated desc",
            });

            expect(result).toEqual({ id: "1" });
            expect(mockedRepo.update).toHaveBeenCalledWith("1", {
                name: "Updated",
                description: "Updated desc",
                updatedBy: "test-user",
            });
        });
    });

    describe("remove", () => {
        it("should soft delete a sample", async () => {
            mockedRepo.softDelete.mockResolvedValue(undefined as never);

            await sampleService.remove("1");

            expect(mockedRepo.softDelete).toHaveBeenCalledWith("1", "test-user");
        });
    });
});
