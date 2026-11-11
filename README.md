# ⛏️ Đào Vàng 3D — PBR Edition (React + Three.js + Cloudflare)

Dự án game **Đào Vàng 3D (Gold Miner 3D)** được thiết kế và tái cấu trúc hoàn toàn trên nền tảng **React 18 + TypeScript + Vite + Tailwind CSS**, tích hợp đồ họa **Three.js PBR (Physically-Based Rendering)** và tối ưu sẵn sàng 100% để triển khai lên **Cloudflare Pages** gắn tên miền riêng (custom domain).

---

## 🚀 1. Chạy thử nghiệm trên máy (Local Dev)

Mở Terminal tại thư mục dự án và chạy:

```bash
# Khởi động máy chủ phát triển
npm run dev
```

Mở trình duyệt truy cập: `http://localhost:3000`

---

## 📦 2. Build dự án xuất bản (Production Build)

```bash
npm run build
```

Thư mục `dist/` sẽ được tạo ra với toàn bộ mã nguồn HTML, JS, CSS đã được nén tối ưu (Gzip), cùng file cấu hình `_headers` và `_redirects` cho Cloudflare Pages.

---

## ☁️ 3. Hướng dẫn Deploy lên Cloudflare Pages

Bạn có 2 cách cực kỳ đơn giản để đưa game lên mạng:

### 🔹 Cách 1: Deploy trực tiếp bằng lệnh (Wrangler CLI)

1. Đăng nhập vào Cloudflare (chỉ cần làm lần đầu):
   ```bash
   npx wrangler login
   ```
   *(Trình duyệt sẽ mở ra để bạn nhấn Authorize xác nhận tài khoản Cloudflare)*

2. Build và Deploy:
   ```bash
   npm run build
   npm run deploy
   ```
   Hoặc chạy lệnh trực tiếp:
   ```bash
   npx wrangler pages deploy dist --project-name=gold-miner-3d
   ```
3. Sau vài giây, Cloudflare sẽ cấp cho bạn một đường link miễn phí dạng:  
   👉 `https://gold-miner-3d.pages.dev`

---

### 🔹 Cách 2: Deploy tự động qua GitHub / GitLab (Khuyên dùng)

1. Đẩy code lên kho lưu trữ GitHub của bạn:
   ```bash
   git init
   git add .
   git commit -m "Init Gold Miner 3D React project"
   git remote add origin https://github.com/tai-khoan-cua-ban/gold-miner-3d.git
   git push -u origin main
   ```
2. Truy cập [Cloudflare Dashboard](https://dash.cloudflare.com/) ➔ Chọn **Workers & Pages** ➔ **Create application** ➔ **Pages** ➔ **Connect to Git**.
3. Chọn repo GitHub của bạn và điền cấu hình chính xác:
   - **Framework preset**: `Vite` (hoặc `None`)
   - **Build command**: `npm run build` *(Lưu ý: KHÔNG điền `wrangler deploy` hay `npm run deploy` ở đây)*
   - **Build output directory**: `dist`
   - **Root directory**: để trống hoặc `/`
4. Bấm **Save and Deploy**. Cloudflare sẽ tự động build và upload game lên mạng toàn cầu!

---

## 🌐 4. Hướng dẫn Gắn Tên Miền Riêng (Custom Domain)

Sau khi deploy lên Cloudflare Pages, bạn muốn chạy domain riêng (ví dụ: `daovang3d.com` hoặc `game.yourdomain.com`):

### Bước 1: Thêm Custom Domain trong Pages
1. Vào **Cloudflare Dashboard** ➔ **Workers & Pages** ➔ Chọn project **gold-miner-3d**.
2. Chuyển sang tab **Custom domains**.
3. Bấm **Set up a custom domain**.
4. Nhập tên miền hoặc tên miền con của bạn (ví dụ: `daovang.domain.com` hoặc `domain.com`) ➔ Bấm **Continue**.

### Bước 2: Cấu hình DNS
- **Nếu tên miền của bạn đã quản lý trên Cloudflare DNS**:  
  Cloudflare sẽ tự động tạo bản ghi CNAME trỏ về `gold-miner-3d.pages.dev` chỉ với 1 cú click!
- **Nếu tên miền ở nhà cung cấp khác (Namecheap, GoDaddy, MatBao, PA Vietnam...)**:  
  Truy cập trang quản trị DNS nơi bạn mua tên miền và thêm bản ghi:
  - **Type**: `CNAME`
  - **Name/Host**: `game` (hoặc `@` nếu là root domain)
  - **Target/Value**: `gold-miner-3d.pages.dev`
  - **TTL**: `Auto` hoặc `3600`

### Bước 3: Chứng chỉ SSL/TLS miễn phí
Cloudflare sẽ tự động kích hoạt **SSL/TLS miễn phí (HTTPS)** trong vòng 1-5 phút. Bạn có thể bật thêm tính năng **Always Use HTTPS** trong mục *SSL/TLS ➔ Edge Certificates*.

---

## 🎮 5. Điều khiển trong trò chơi

- **Chuột trái / Phím Space / Phím Mũi Tên Xuống / Phím S**: Thả móc câu gắp khoáng sản.
- **Chuột phải / Phím E / Phím W / Phím Mũi Tên Lên**: Ném thuốc nổ TNT phá hủy vật thể nặng đang bị kéo.
- **Cảm ứng di động**: Chạm vào bất kỳ vị trí nào trên màn hình hoặc nút **⛏️ PHÓNG MÓC** to phía dưới.
- **Nút TNT trên HUD**: Bấm trực tiếp khi đang kéo đồ để nổ TNT.
- **Màn hình Cửa Hàng (Shop)**: Mua Nước Tăng Lực (kéo siêu nhanh), Cỏ 4 Lá (túi bí ẩn may mắn), Đá Mài Kim Cương (+50% giá), Ngàm Titan (tăng tốc phóng móc).

