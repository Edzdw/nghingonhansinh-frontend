import type { Command, PlaytestReport, Snapshot } from '../types/game';
export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) { super(message); }
}
export function createApi(baseUrl: string, getToken: () => Promise<string>) {
  const base = baseUrl.replace(/\/$/, '');
  async function call<T>(path: string, body?: unknown): Promise<T> {
    const token = await getToken();
    const response = await fetch(`${base}/v1${path}`, {
      method: body === undefined ? 'GET' : 'POST', cache: 'no-store', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(response.status, data.code || 'API_ERROR', typeof data.message === 'string' ? data.message : 'Yêu cầu không thành công.');
    return data as T;
  }
  const room = (code: string) => `/rooms/${encodeURIComponent(code)}`;
  return {
    create: (name: string) => call<Snapshot>('/rooms', { name }),
    join: (code: string, name: string) => call<Snapshot>(`${room(code)}/join`, { name }),
    snapshot: (code: string) => call<Snapshot>(room(code)),
    command: (code: string, revision: number, command: Command) => call<Snapshot>(`${room(code)}/commands`, { revision, command }),
    report: (code: string) => call<PlaytestReport>(`${room(code)}/report`),
    feedback: (code: string, fun: number, clarity: number, note: string) => call<{ saved: boolean }>(`${room(code)}/feedback`, { fun, clarity, note }),
  };
}
export type Api = ReturnType<typeof createApi>;
