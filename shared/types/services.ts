import { Services } from "../enums/services.enum";

// Type-safe service names
export type ServiceName = (typeof Services)[keyof typeof Services];
