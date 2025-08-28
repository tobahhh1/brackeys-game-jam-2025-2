
export interface IApiClient {
    baseUrl: string;
}

export const apiClient = {
    baseUrl: import.meta.env.VITE_API_BASE_URL,
}