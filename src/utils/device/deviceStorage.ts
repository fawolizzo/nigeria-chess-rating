
import { getFromStorage, saveToStorage } from "../storageUtils";

/**
 * Function to save data to storage
 * @param key Storage key
 * @param data Data to store
 */
export const saveDataToStorage = <T>(key: string, data: T): void => {
  saveToStorage(key, data);
};

/**
 * Function to get data from storage
 * @param key Storage key
 * @param defaultValue Default value if key doesn't exist
 * @returns The stored data or default value
 */
export const getDataFromStorage = <T>(key: string, defaultValue: T): T => {
  return getFromStorage<T>(key, defaultValue);
};
