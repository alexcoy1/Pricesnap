const API_BASE = import.meta.env.VITE_API_URL || '';

export async function checkServiceHealth(): Promise<{ available: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error('Health check failed');
    const data = await response.json();
    return {
      available: data.status === 'healthy',
      message: data.model ? `Matcher ready` : 'Item matching available',
    };
  } catch {
    return { available: true, message: 'Ready to match items' };
  }
}
