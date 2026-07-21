export const getApiBaseUrl = (): string => {
  const runtimeUrl = typeof window !== 'undefined'
    ? (window as any).__ENV__?.VITE_API_BASE_URL
    : undefined;

  return (
    runtimeUrl ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    'http://127.0.0.1:8000/api'
  );
};
