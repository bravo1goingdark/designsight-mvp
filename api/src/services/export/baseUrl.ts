export const buildBaseUrl = (): string => {
  return process.env.EXPORT_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
}
