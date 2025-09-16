import { ApiVersions } from "../enums/api.enum";

// Type-safe version strings
export type ApiVersion = (typeof ApiVersions)[keyof typeof ApiVersions];

export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: Date;
    path: string;
  };
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: Date;
  path: string;
}
