import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, createApi } from '../src/lib/api';
test('frontend calls standalone backend v1 with bearer; no cookies or database access', async () => {
  const original = globalThis.fetch; const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = (async (url, init) => { calls.push({ url: String(url), init }); return new Response(JSON.stringify({ apiVersion: 'v1', code: 'ABCDEFGH', revision: 2 }), { status: 200 }); }) as typeof fetch;
  try {
    const api = createApi('https://backend.example/', async () => 'session-token');
    await api.create('Mai'); await api.join('ABCDEFGH', 'An'); await api.snapshot('ABCDEFGH');
    await api.command('ABCDEFGH', 2, { type: 'vote', target: 'me' }); await api.feedback('ABCDEFGH', 4, 5, 'Vui'); await api.report('ABCDEFGH');
    assert.equal(calls[0].url, 'https://backend.example/v1/rooms');
    assert.equal(calls[2].init?.method, 'GET'); assert.equal(calls[3].url, 'https://backend.example/v1/rooms/ABCDEFGH/commands');
    assert.deepEqual(JSON.parse(String(calls[3].init?.body)), { revision: 2, command: { type: 'vote', target: 'me' } });
    for (const c of calls) { assert.equal((c.init?.headers as Record<string, string>).Authorization, 'Bearer session-token'); assert.equal(c.init?.cache, 'no-store'); assert.equal(c.init?.credentials, undefined); }
  } finally { globalThis.fetch = original; }
});
test('conflict is surfaced for refresh without retrying a locked action', async () => {
  const original = globalThis.fetch; let count = 0;
  globalThis.fetch = (async () => { count++; return new Response(JSON.stringify({ code: 'STALE_REVISION', message: 'Tải lại' }), { status: 409 }); }) as typeof fetch;
  try { const api = createApi('http://localhost:3001', async () => 'token'); await assert.rejects(api.command('ABCDEFGH', 1, { type: 'start' }), e => e instanceof ApiError && e.status === 409 && e.code === 'STALE_REVISION'); assert.equal(count, 1); }
  finally { globalThis.fetch = original; }
});
test('token failure stops request before transmitting', async () => {
  const original = globalThis.fetch; let count = 0;
  globalThis.fetch = (async () => { count++; return new Response('{}'); }) as typeof fetch;
  try { const api = createApi('http://localhost:3001', async () => { throw Error('Session expired'); }); await assert.rejects(api.snapshot('ABCDEFGH'), /Session expired/); assert.equal(count, 0); }
  finally { globalThis.fetch = original; }
});
