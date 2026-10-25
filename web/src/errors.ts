export class ApiError extends Error {
  status: number;
  code: string;
  field?: string;

  constructor(status: number, code: string, message: string, field?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Beklenmeyen bir hata oluştu.';
}
