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
 * Helper function: แปลง keys ของ object เป็น uppercase
 * @param obj - Object ที่ต้องการแปลง keys เป็น uppercase
 * @returns Object ที่มี keys เป็น uppercase
 */
function convertKeysToUpperCase(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => convertKeysToUpperCase(item));
    }

    if (typeof obj === "object") {
        const result: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const upperKey = key.toUpperCase();
                result[upperKey] = convertKeysToUpperCase(obj[key]);
            }
        }
        return result;
    }

    return obj;
}

/**
 * แปลง object หรือ array ของ objects จาก camelCase เป็น snake_case
 * @param data - Object หรือ Array ของ objects ที่ต้องการแปลง
 * @param toUpper - ถ้าเป็น true จะแปลงเป็น UPPERCASE_SNAKE_CASE (default: false)
 * @returns Object หรือ Array ที่มี keys เป็น snake_case หรือ UPPERCASE_SNAKE_CASE
 */
export function convertCamelToSnakeCase<T>(
    data: T,
    toUpper: boolean = false
): T {
    // ตรวจสอบว่าเป็น null หรือ undefined
    if (data === null || data === undefined) {
        return data;
    }

    // ตรวจสอบว่าเป็น array หรือไม่
    if (Array.isArray(data)) {
        return data.map((item) => {
            // ถ้าเป็น object ให้แปลง keys
            if (typeof item === "object" && item !== null) {
                const converted = objectKeysToSnakeCaseV2(item);
                return toUpper ? convertKeysToUpperCase(converted) : converted;
            }
            // ถ้าไม่ใช่ object ให้ return ค่าเดิม
            return item;
        }) as T;
    }

    // ถ้าเป็น object (แต่ไม่ใช่ array)
    if (typeof data === "object") {
        const converted = objectKeysToSnakeCaseV2(data) as T;
        return toUpper ? (convertKeysToUpperCase(converted) as T) : converted;
    }

    // ถ้าไม่ใช่ object หรือ array ให้ return ค่าเดิม
    return data;
}
