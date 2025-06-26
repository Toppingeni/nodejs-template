import {
    objectKeysToCamelCaseV2,
    objectKeysToSnakeCaseV2,
} from "keys-converter";

/**
 * แปลง object หรือ array ของ objects จาก snake_case เป็น camelCase
 * @param data - Object หรือ Array ของ objects ที่ต้องการแปลง
 * @returns Object หรือ Array ที่มี keys เป็น camelCase
 */
export function convertSnakeToCamelCase<T>(data: T): T {
    // ตรวจสอบว่าเป็น null หรือ undefined
    if (data === null || data === undefined) {
        return data;
    }

    // ตรวจสอบว่าเป็น array หรือไม่
    if (Array.isArray(data)) {
        return data.map((item) => {
            // ถ้าเป็น object ให้แปลง keys
            if (typeof item === "object" && item !== null) {
                return objectKeysToCamelCaseV2(item);
            }
            // ถ้าไม่ใช่ object ให้ return ค่าเดิม
            return item;
        }) as T;
    }

    // ถ้าเป็น object (แต่ไม่ใช่ array)
    if (typeof data === "object") {
        return objectKeysToCamelCaseV2(data) as T;
    }

    // ถ้าไม่ใช่ object หรือ array ให้ return ค่าเดิม
    return data;
}

/**
 * แปลง object หรือ array ของ objects จาก camelCase เป็น snake_case
 * @param data - Object หรือ Array ของ objects ที่ต้องการแปลง
 * @returns Object หรือ Array ที่มี keys เป็น snake_case
 */
export function convertCamelToSnakeCase<T>(data: T): T {
    // ตรวจสอบว่าเป็น null หรือ undefined
    if (data === null || data === undefined) {
        return data;
    }

    // ตรวจสอบว่าเป็น array หรือไม่
    if (Array.isArray(data)) {
        return data.map((item) => {
            // ถ้าเป็น object ให้แปลง keys
            if (typeof item === "object" && item !== null) {
                return objectKeysToSnakeCaseV2(item);
            }
            // ถ้าไม่ใช่ object ให้ return ค่าเดิม
            return item;
        }) as T;
    }

    // ถ้าเป็น object (แต่ไม่ใช่ array)
    if (typeof data === "object") {
        return objectKeysToSnakeCaseV2(data) as T;
    }

    // ถ้าไม่ใช่ object หรือ array ให้ return ค่าเดิม
    return data;
}
