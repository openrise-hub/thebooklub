export type ExportFormat = "json" | "csv";

export const EXPORT_FORMATS: readonly ExportFormat[] = ["json", "csv"] as const;

export const EXPORT_MIME_TYPES = {
	json: "application/json",
	csv: "text/csv;charset=utf-8",
} as const;

export const DEFAULT_EXPORT_FORMAT: ExportFormat = "json";
