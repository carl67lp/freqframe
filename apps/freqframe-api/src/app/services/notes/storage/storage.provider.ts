export interface StorageProvider {
    /**
     * Store data at the given key
     */
    set(key: string, value: unknown): Promise<void>;

    /**
     * Retrieve data by key
     */
    get<T = unknown>(key: string): Promise<T | null>;

    /**
     * Check if key exists
     */
    exists(key: string): Promise<boolean>;

    /**
     * Delete data by key
     */
    delete(key: string): Promise<void>;

    /**
     * List all keys (optional pattern matching)
     */
    keys(pattern?: string): Promise<string[]>;

    /**
     * Clear all data
     */
    clear(): Promise<void>;
}
