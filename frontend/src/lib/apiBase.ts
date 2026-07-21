export const getApiBaseUrl = (): string => {
  const runtimeEnv = typeof window !== 'undefined' ? (window as any).__ENV : undefined;

  return (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    runtimeEnv?.VITE_API_BASE_URL ||
    runtimeEnv?.VITE_API_URL ||
    'http://127.0.0.1:8000/api'
  );
};
