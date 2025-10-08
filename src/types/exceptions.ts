export interface LogEntry {
  timestamp: string;          // ISO string from API
  message: string;
  log_group?: string | null;
  log_stream?: string | null;
}

export interface ExceptionsResponse {
  count: number;
  exceptions: LogEntry[];
  summary?: string | null;    // Markdown-like text from API
}

export interface NLQueryRequest {
  query: string;
  timeframe: { hours?: number; days?: number };
}

export interface NLQueryResponse {
  answer: string;
  used_logs: number;
}
