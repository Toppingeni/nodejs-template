import axios, { type AxiosError } from "axios";
import type { ApiError, ApiResponse } from "../../shared/types/index";
import type {
  Sample,
  CreateSampleDto,
  UpdateSampleDto,
  SampleFilters,
} from "../../shared/types/sample";
import { clearToken, getToken } from "@/auth/tokens";

const baseURL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:3000/api";

export const apiClient = axios.create({
  baseURL,
  timeout: 300000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: 401 → clear token → redirect
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Convert axios error to ApiError shape
export function handleApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      message?: string;
      errors?: Record<string, string[]>;
    }>;
    return {
      message:
        axiosError.response?.data?.message ??
        axiosError.message ??
        "เกิดข้อผิดพลาด",
      status: axiosError.response?.status ?? 500,
      errors: axiosError.response?.data?.errors,
    };
  }
  if (error instanceof Error) {
    return { message: error.message, status: 500 };
  }
  return { message: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ", status: 500 };
}

// Sample API
export const sampleApi = {
  getAll: async (filters?: SampleFilters): Promise<Sample[]> => {
    const params: Record<string, string | number | undefined> = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.status) params.status = filters.status;
    if (filters?.page !== undefined) params.page = filters.page;
    if (filters?.pageSize !== undefined) params.pageSize = filters.pageSize;
    const res = await apiClient.get<ApiResponse<Sample[]>>("/sample", {
      params,
    });
    return res.data.data;
  },

  getById: async (id: string): Promise<Sample> => {
    const res = await apiClient.get<ApiResponse<Sample>>(`/sample/${id}`);
    return res.data.data;
  },

  create: async (data: CreateSampleDto): Promise<Sample> => {
    const res = await apiClient.post<ApiResponse<Sample>>("/sample", data);
    return res.data.data;
  },

  update: async (id: string, data: UpdateSampleDto): Promise<Sample> => {
    const res = await apiClient.put<ApiResponse<Sample>>(`/sample/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/sample/${id}`);
  },
};
