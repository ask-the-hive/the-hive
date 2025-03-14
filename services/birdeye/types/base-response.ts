export type BaseResponse<T> = {
    success: boolean;
    data: T;
    message?: string;
}
