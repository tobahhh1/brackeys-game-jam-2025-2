
export type IEventToCallback<T> = Record<string, (data: T) => void>;