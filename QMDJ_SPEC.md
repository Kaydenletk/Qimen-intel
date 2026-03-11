# QMDJ_SPEC.md (Hiến Pháp Kỳ Môn Độn Giáp cho AI)

Tài liệu này là "Hiến Pháp" tối cao dành cho AI khi thực hiện xây dựng, tái kiến trúc hoặc vá lỗi lõi toán học của hệ thống Kỳ Môn Độn Giáp (QMDJ). Mọi thay đổi code phải tuyệt đối tuân thủ các quy tắc dưới đây.

## BƯỚC 1: QUY TẮC LÕI THEO CHUẨN (Core Rules)
Tuyệt đối không được tự suy diễn từ code cũ chưa chuẩn để tránh "rác logic". Mọi thuật toán phải tuân thủ nghiêm ngặt nguyên lý kinh điển.

**Đặc biệt chú ý và ghi rõ các luật lõi sau khi tạo Spec:**
1. **Quy tắc Ký Cung (Trung Cung số 5)**: Trung Cung số 5 được gửi vào đâu? Theo sách Đàm Liên/Hải Ban là gửi cho Khôn 2 hay Cấn 8, hay linh hoạt theo Âm/Dương độn? Phải chỉ định rõ ràng và logic hóa thành code nhất quán.
2. **Quy tắc Lịch Pháp**: Hệ thống định cục số theo phép "Siêu Thần Tiếp Khí" (có Nhuận Cục) hay dùng "Sách Cục" (chia đều)? Bắt buộc phải xác định và trích xuất chính xác thuật toán này trước khi tính toán các bước tiếp theo.

## BƯỚC 2: TRỰC PHÙ - BỘ TEST VÀNG (Golden Oracles Test-Driven)
Áp dụng tư duy Test-Driven Development (TDD). Xác lập các output chuẩn làm "khiên bảo trợ" trước khi đụng vào mã lõi.

Bên cạnh 3 test cases cơ bản, **bắt buộc phải xây dựng thêm tối thiểu 2 Test Cases mang tính Cực Đoan (Edge Cases)**:
1. **Trường hợp Phục Ngâm toàn cục**: Trạng thái Tinh và Môn nằm nguyên tại vị trí gốc (không di chuyển).
2. **Trường hợp Phản Ngâm toàn cục**: Trạng thái Tinh và Môn đối xung hoàn toàn so với vị trí gốc.
*(Đây là 2 trạng thái cực kỳ dễ sinh lỗi logic khi xoay bàn - rotating, cần phải test nghiêm ngặt).*

## BƯỚC 3: PHÁ PHỤC NGÂM - TÁCH LỚP KIẾN TRÚC (Decoupling)
Bắt buộc tách bạch hoàn toàn lõi toán học (Orthodox Engine) và tầng diễn giải ngôn ngữ (Interpretation) để gỡ rối kiến trúc.

**Luật dập khuôn bất di bất dịch cho tầng Engine:**
- Tầng Orthodox Engine tuyệt đối **KHÔNG** chứa các text/string tiếng Việt hoặc ngôn ngữ con người để luận giải (như "tốt", "xấu", "đại hung", "cát tinh"...).
- Tầng này chỉ được phép xử lý logic toán học và trả về **Keys/IDs** chuẩn hóa (ví dụ: `door_death`, `star_hero`, `god_chief`, `metal_plus`).
- Tầng Interpretation mới là nơi duy nhất chịu trách nhiệm mapping các Keys/IDs này thành ngôn ngữ loài người.

## BƯỚC 4: VÁ ĐỖ MÔN - CHỈNH SỬA LÕI VÀ MINH BẠCH TƯ DUY (Fixing Core)
Tiếp cận xóa sạch và viết lại các đoạn logic mâu thuẫn với Spec (tinh thần Phản Ngâm dứt khoát). Khi AI thực hiện sửa lỗi lõi, bắt buộc phải báo cáo rõ ràng quá trình tư duy (Chain of Thought):
- **Báo cáo lỗi**: Lỗi gốc hiện tại đang nằm ở đâu? (Tại component nào, hàm nào, dòng logic nào?).
- **Căn cứ vá lỗi**: Dùng quy tắc nào, luật nào trong Hiến Pháp (hoặc Spec cụ thể) để vá lỗi đó? Dữ liệu chứng minh là gì?
