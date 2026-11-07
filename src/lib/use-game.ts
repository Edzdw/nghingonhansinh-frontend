'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ApiError, createApi, type Api } from './api';
import type { Command, Snapshot } from '../types/game';
let authentication: Promise<SupabaseClient> | undefined;
function connect() {
  if (!authentication) authentication = (async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || !process.env.NEXT_PUBLIC_API_URL) throw Error('Chưa cấu hình kết nối. Điền front-end/.env.local theo README rồi khởi động lại.');
    const client = createClient(url, key);
    const { data: { session }, error } = await client.auth.getSession();
    if (error) throw error;
    if (!session) { const { error } = await client.auth.signInAnonymously(); if (error) throw error; }
    return client;
  })().catch(error => { authentication = undefined; throw error; });
  return authentication;
}
export function useGame() {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const current = useRef<Snapshot | undefined>(undefined);
  const apiRef = useRef<Api | undefined>(undefined);
  const [client, setClient] = useState<SupabaseClient>();
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false); const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('Đang kết nối');
  const writing = useRef(false), reading = useRef(false);
  const accept = useCallback((data: Snapshot) => {
    if (current.current?.code === data.code && current.current.revision > data.revision) return;
    current.current = data; setSnapshot(data); localStorage.setItem('nn-room-v1', data.code);
    setStatus('Đã đồng bộ');
  }, []);
  const refresh = useCallback(async () => {
    if (writing.current || reading.current || !current.current || !apiRef.current) return;
    reading.current = true;
    try { accept(await apiRef.current.snapshot(current.current.code)); }
    catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        localStorage.removeItem('nn-room-v1'); current.current = undefined; setSnapshot(undefined);
        setError('Phòng không hoạt động và đã bị đóng.'); setStatus('Phòng đã đóng');
      } else setStatus('Mất kết nối · đang thử lại');
    }
    finally { reading.current = false; }
  }, [accept]);
  useEffect(() => {
    let alive = true;
    void connect().then(async sb => {
      if (!alive) return;
      const api = createApi(process.env.NEXT_PUBLIC_API_URL!, async () => {
        const { data: { session }, error } = await sb.auth.getSession();
        if (error || !session) throw Error('Phiên đăng nhập không còn hợp lệ. Giữ nguyên trình duyệt và thử tải lại.');
        return session.access_token;
      });
      apiRef.current = api; setClient(sb); setReady(true); setStatus('Sẵn sàng');
      const saved = localStorage.getItem('nn-room-v1');
      if (saved) { try { const data = await api.snapshot(saved); if (alive) accept(data); } catch (e) { if (alive) setError(`Không khôi phục được phòng ${saved}: ${e instanceof Error ? e.message : 'Lỗi kết nối'}`); } }
    }).catch(e => { if (alive) setError(e instanceof Error ? e.message : 'Không kết nối được.'); });
    return () => { alive = false; };
  }, [accept]);
  useEffect(() => {
    if (!client || !snapshot?.code) return;
    const channel = client.channel(`room:${snapshot.code}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'nn_rooms', filter: `code=eq.${snapshot.code}` }, () => void refresh()).subscribe(state => { if (state === 'SUBSCRIBED') setStatus('Realtime đang hoạt động'); });
    const timer = window.setInterval(() => void refresh(), 4000);
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus); window.addEventListener('online', onFocus);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', onFocus); window.removeEventListener('online', onFocus); void client.removeChannel(channel); };
  }, [client, snapshot?.code, refresh]);
  async function mutate(work: (api: Api) => Promise<Snapshot>) {
    if (writing.current || !apiRef.current) return false;
    writing.current = true; setBusy(true); setError(''); setNotice('');
    let success = false;
    try { accept(await work(apiRef.current)); success = true; }
    catch (e) {
      setError(e instanceof Error ? e.message : 'Không gửi được hành động.');
      if (!(e instanceof ApiError)) setNotice('Chưa rõ hành động đã tới server chưa. Hãy xem trạng thái cập nhật trước khi gửi lại.');
    }
    finally { writing.current = false; setBusy(false); }
    await refresh(); return success;
  }
  return { snapshot, ready, busy, error, notice, status, refresh,
    create: (name: string) => mutate(api => api.create(name)),
    join: (code: string, name: string) => mutate(api => api.join(code, name)),
    command: (command: Command) => mutate(api => { const s = current.current!; return api.command(s.code, s.revision, command); }),
    async report() { if (!apiRef.current || !current.current) return; try { return await apiRef.current.report(current.current.code); } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được báo cáo.'); } },
    async feedback(fun: number, clarity: number, note: string) { if (!apiRef.current || !current.current) return; try { await apiRef.current.feedback(current.current.code, fun, clarity, note); setNotice('Đã lưu đánh giá playtest.'); } catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được đánh giá.'); } },
    home() { localStorage.removeItem('nn-room-v1'); window.location.assign('/'); },
  };
}
