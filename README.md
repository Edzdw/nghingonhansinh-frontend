# NGHI NGỜ NHÂN SINH — Next.js frontend

Ứng dụng giao diện độc lập → Vercel. Backend NestJS ở Railway là repository khác. Không có API routes, database driver, game engine, DATABASE_URL hay service-role key trong repo frontend.

## Chạy local

Node.js 22+.

1. `npm ci`
2. Copy `.env.example` → `.env.local`.
3. Điền `NEXT_PUBLIC_API_URL=http://localhost:3001`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Backend phải chạy riêng, migrations do bạn chạy thủ công và Supabase đã bật Anonymous Sign-Ins.
5. `npm run dev`, mở `http://localhost:3000`.

Ba biến này là thông tin **public** được đưa vào bundle browser. Không thêm password database/service-role key vào biến NEXT_PUBLIC. Public anon key an toàn chỉ khi grants/RLS đúng theo migrations backend.

`NEXT_PUBLIC_API_URL` là origin của backend, **không kèm /v1**; client tự thêm /v1. Đổi env cần build/redeploy lại vì Next.js đóng gói NEXT_PUBLIC lúc build. Không có .env.example nào yêu cầu credential backend.

Chưa cấu hình env vẫn build được; trang sảnh hiển thị thông báo cấu hình và vô hiệu hóa tạo/vào phòng. Đây không phải chế độ demo multiplayer/offline.

## Deploy Vercel bằng repo này

1. Git riêng tại **front-end**, push nội dung folder này vào frontend repo.
2. Vercel Import repo → framework Next.js → Root Directory mặc định (repo root chính là front-end). Build `npm run build`, install `npm ci --include=dev`; để output mặc định của Next.js.
3. Environment Variables: `NEXT_PUBLIC_API_URL=https://YOUR_BACKEND.up.railway.app`, URL Supabase và public anon key. Điền vào đúng Production/Preview/Development theo nhu cầu. Không cần database secret tại Vercel.
4. Deploy frontend bằng tài khoản của bạn. Sau khi biết domain Vercel, thêm origin chính xác vào `CORS_ORIGINS` của backend Railway. Nếu dùng preview URL, thêm từng origin được phép hoặc dùng domain preview ổn định; không dùng CORS wildcard cho production.
5. Test /v1/health/ready của backend, tạo phòng và vào bằng nhiều profile.

Không deploy trong lần bàn giao này. Không cấu hình Supabase hay migrations từ frontend.

## Luồng dữ liệu

Browser → Supabase anonymous auth → access token.

Browser → Railway /v1 API (Bearer token) → NestJS/engine/Postgres.

Supabase realtime chỉ báo revision của phòng → browser gọi NestJS lấy snapshot dành riêng cho UUID của mình. Không có quyền trực tiếp ghi tables hoặc đọc game state bí mật.

`src/types/game.ts` là copy contract API v1 độc lập. Backend giữ nguồn chuẩn trong src/contracts/game.ts; khi thay đổi contract phải cập nhật hai bên có kiểm soát. Không cần monorepo/workspace/shared folder hoặc repo kia trên máy CI để build.

## Reconnect và chơi thử

- Supabase SDK giữ session trong browser. Mã phòng gần nhất lưu ở `nn-room-v1` trong localStorage.
- Reload gọi backend snapshot theo token cũ. Không tự chuyển anonymous identity để chiếm lại vai khi token mất.
- Realtime + polling 4 giây + refresh khi focus/online. Revision thấp hơn snapshot hiện tại bị bỏ qua.
- Command không tự retry sau timeout; tải lại state rồi người dùng mới quyết định. Phiếu và offer chốt không đổi được.
- Muốn test nhiều người trên một máy: dùng nhiều browser/profile/incognito session **độc lập**. Hai tab cùng origin/profile chia sẻ một UUID nên vẫn là một người.
- Thảo luận trực tiếp hoặc cuộc gọi ngoài, chủ phòng chuyển vòng. Người bỏ bàn/chủ phòng mất phiên chưa có tự động thay thế; tạo phòng mới nếu không quay lại được.
- Kết thúc xem roles, ballot counts và metrics; gửi feedback và tải report JSON. Feedback được chia sẻ với thành viên cùng phòng, không gửi dữ liệu cá nhân vào note.

## Cấu trúc và checks

- `src/components/Game.tsx`: giao diện.
- `src/lib/use-game.ts`: auth/session, subscription, đồng bộ và actions.
- `src/lib/api.ts`: HTTP client độc lập, lỗi có code/status.
- `src/types/game.ts`: contract, không chứa engine.
- `public/luat-v4.html`: luật nguồn nguyên vẹn, liên kết tới chế độ 1.

```sh
npm test
npm run typecheck
npm run build
npm start
```

CI chỉ test/typecheck/build, không có deploy job. Ba bài API client tests kiểm tra URL backend tách biệt, bearer token, revision/409, không tự replay, và dừng request nếu không lấy được token. Gameplay/RLS/HTTP tests nằm trong backend.

Anonymous Auth và streaming realtime trên Supabase thật chưa được kiểm tra vì không sử dụng keys/database của bạn. CAPTCHA enforcement chưa có UI captchaToken; cần thêm trước khi bật tùy chọn đó trên Supabase. Bản này là MVP playtest, không có tích hợp voice/chat, public lobby hay account recovery.
