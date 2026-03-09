function withDefault(defaultText, overrides = {}) {
  return { ...overrides, default: defaultText };
}

export const QMDJ_DICTIONARY = {
  Deities: {
    'Trực Phù': withDefault(
      'quý nhân, người có tiếng nói, thế chống lưng khiến cục diện bớt chông chênh',
      {
        'hoc-tap': 'thầy cô hoặc người chỉ bài đang đứng ra nâng đỡ, dễ được gợi mở đúng chỗ',
        'su-nghiep': 'có sếp hoặc đầu mối quyền lực chống lưng, lời nói của bạn có trọng lượng hơn',
        'gia-dao': 'trong nhà vẫn còn một người lớn đủ uy để dàn hòa hoặc giữ trật tự',
      }
    ),
    'Đằng Xà': withDefault(
      'sự lắt léo, rối rắm, bằng mặt không bằng lòng, thứ làm đầu óc mắc kẹt',
      {
        'hoc-tap': 'đề bài đánh đố, kiến thức quấn lấy nhau, học mãi vẫn thấy lắt léo',
        'tinh-duyen': 'mập mờ, nghi ngờ, suy diễn, cảm giác bị treo giữa thật và giả',
        'gia-dao': 'sự bất an, tâm tư khó nói, bằng mặt nhưng dối lòng, chuyện nhỏ kéo thành mớ dây rối trong nhà',
        'kinh-doanh': 'đối tác nói một đằng làm một nẻo, điều khoản nhìn đẹp nhưng gài bẫy',
      }
    ),
    'Thái Âm': withDefault(
      'đi đường kín, giữ bài trong tay, làm việc âm thầm thay vì phô ra ngoài',
      {
        'tinh-duyen': 'tình cảm kín đáo, nhớ nhiều nhưng nói ít, hợp mở lòng từng lớp',
        'bat-dong-san': 'nên soi điều khoản ngầm, giấy tờ kín, giao dịch càng kín càng dễ giữ thế',
        'dam-phan': 'thế mặc cả nằm ở phần không nói thẳng, ai lộ bài trước người đó yếu',
      }
    ),
    'Lục Hợp': withDefault(
      'thế hòa, kết nối được với nhau, còn cửa ngồi lại nói chuyện cho ra nhẽ',
      {
        'tinh-duyen': 'nhân duyên hợp nhịp, dễ nối lại liên lạc hoặc chốt một cuộc nói chuyện thật',
        'gia-dao': 'sự thấu hiểu, gắn kết và tiếng nói chung giữa các thành viên, dấu hiệu nhà vẫn còn muốn ngồi lại với nhau',
        'kinh-doanh': 'đối tác hợp tác được, mối nối thương lượng chưa đứt',
        'ky-hop-dong': 'điều khoản có thể chốt nếu đôi bên chịu nhường đúng điểm',
      }
    ),
    'Bạch Hổ': withDefault(
      'áp lực mạnh, va chạm lớn, thứ đòi bạn cứng tay và trả giá nếu chủ quan',
      {
        'suc-khoe': 'dễ đụng tới dao kéo, đau nhức, hoặc tình trạng cần xử lý quyết liệt',
        'doi-no': 'đòi kiểu cứng, dễ va chạm, nói sai một câu là bật xung đột ngay',
        'kien-tung': 'thế pháp lý căng, đối đầu trực diện, không còn vùng xám dễ thương lượng',
      }
    ),
    'Huyền Vũ': withDefault(
      'ẩn tình, giấu bài, gian dối hoặc một lớp mờ khiến bạn rất khó tin hoàn toàn',
      {
        'tinh-duyen': 'có góc khuất, chưa chắc người kia đã nói hết, dễ dính chuyện sau lưng',
        'kinh-doanh': 'sổ sách hoặc cam kết có điểm mờ, cần kiểm tra chéo trước khi tin',
        'bat-dong-san': 'giấy tờ hoặc thông tin rao bán chưa sạch, cần soi phần người ta né nói',
      }
    ),
    'Cửu Địa': withDefault(
      'bám nền, đi chậm chắc, giữ thế thủ, lấy ổn định làm lợi thế',
      {
        'bat-dong-san': 'đất đai, nền móng, giá trị giữ lâu, thứ nào chắc gốc thì mới đáng xuống tiền',
        'gia-dao': 'chuyện nhà cần người giữ nền, giữ nhịp, không phải người thắng lời qua tiếng lại',
        'tai-van': 'hợp giữ tài sản chắc tay hơn là lao theo nhịp lời lỗ quá gắt',
      }
    ),
    'Cửu Thiên': withDefault(
      'tầm nhìn cao, bứt tốc, đẩy mọi thứ đi rất nhanh và rất xa',
      {
        'hoc-tap': 'tài liệu hoặc cơ hội học đang phi tới rất nhanh, bắt được nhịp thì tiến cực gắt',
        'su-nghiep': 'có cửa bật lên mạnh, được nhìn thấy hoặc kéo ra vị trí cao hơn',
        'kinh-doanh': 'đánh lớn, mở rộng nhanh, làm thương hiệu hoặc thị trường bùng lên',
      }
    ),
    'Chu Tước': withDefault(
      'miệng lưỡi, lời ra tiếng vào, thông tin lan nhanh và dễ thành drama',
      {
        'su-nghiep': 'tin đồn văn phòng hoặc phát ngôn sai lúc khiến bạn mất điểm',
        'tinh-duyen': 'nói quá tay, nhắn sai nhịp, để người ngoài chen vào câu chuyện của hai người',
        'gia-dao': 'lời nói sát thương, người nọ nhắc lại chuyện cũ làm nhà càng thêm nóng',
      }
    ),
    'Câu Trận': withDefault(
      'ràng buộc, kéo chân, tranh chấp, tình thế mắc lại khó đi nhanh',
      {
        'doi-no': 'cần chứng cứ, giấy tờ, quy trình rõ ràng mới kéo được tiền về',
        'kien-tung': 'thế kiện tụng, bị mắc vào thủ tục hoặc rào cản pháp lý',
        'bat-dong-san': 'dễ vướng tranh chấp, quy hoạch, hoặc người liên quan níu chân giao dịch',
      }
    ),
    'Dịch Mã': withDefault(
      'thay đổi đột ngột, phi tới rất nhanh, bồn chồn muốn làm ngay, không kịp trở tay',
      {
        'hoc-tap': 'tài liệu đang phi tới, nhịp học đổi gấp, chạy nước rút cận kỳ',
        'su-nghiep': 'job mới, task mới, deadline mới ập tới rất nhanh, phải xoay người ngay',
        'xuat-hanh': 'đúng chất dịch chuyển, lịch đi lại đổi nhanh, có việc phải lên đường ngay',
      }
    ),
  },
  Doors: {
    'Khai Môn': withDefault(
      'mở cửa, khởi động, công khai, tạo ra một lối đi mà trước đó còn bị chặn',
      {
        'su-nghiep': 'mở dự án, mở vị trí, mở cửa thăng tiến hoặc cơ hội được giao việc lớn',
        'kinh-doanh': 'mở bán, mở deal, mở thị trường, lúc phù hợp để đưa hàng ra ánh sáng',
        'ky-hop-dong': 'ngồi vào bàn ký, chốt điều khoản, nói rõ quyền lợi và trách nhiệm',
        'muu-luoc': 'thế mở để tung bản kế hoạch, đưa phương án mới ra trước thiên hạ',
      }
    ),
    'Hưu Môn': withDefault(
      'lùi một nhịp, dưỡng sức, giữ bình tĩnh, gom dữ kiện trước khi hành động',
      {
        'tinh-duyen': 'cần cho nhau khoảng thở, bớt ép trả lời, bớt đòi kết luận ngay',
        'hoc-tap': 'nên nghỉ để hệ thống lại, học chậm mà chắc sẽ ăn hơn nhồi dồn',
        'gia-dao': 'nhà muốn yên phải hạ giọng trước, nghỉ chiến rồi mới nói tiếp được',
        'suc-khoe': 'cơ thể đang cần được nghỉ thật, không phải cố thêm một nhịp nữa',
      }
    ),
    'Sinh Môn': withDefault(
      'sinh sôi, tăng trưởng, có giá trị thật đang được tạo ra hoặc nuôi lớn lên',
      {
        'tai-van': 'tiền đang có cửa sinh lời hoặc tạo ra dòng chảy mới nếu đi đúng nhịp',
        'tinh-duyen': 'mối quan hệ có lực nảy nở, nói chuyện đúng cách là tình cảm lên rõ',
        'gia-dao': 'hơi ấm, sức sống và khả năng nuôi dưỡng của ngôi nhà, thứ giữ cho nếp nhà còn sống',
        'bat-dong-san': 'nhà cửa, công trình, tài sản hữu hình đang có lực tăng giá hoặc dễ chốt',
        'kinh-doanh': 'dòng tiền, khách, đơn hoặc doanh số đang có cửa bật lên',
      }
    ),
    'Thương Môn': withDefault(
      'va chạm, hao tổn, chạm vào chỗ đau, nói hoặc làm một phát là để lại vết',
      {
        'tinh-duyen': 'lời nói dễ sát thương, cả hai đều nhạy và rất dễ tổn thương nhau',
        'gia-dao': 'cãi vã nội bộ, câu nói nặng làm không khí trong nhà bị cứa vào',
        'doi-no': 'đòi tiền kiểu mạnh tay, dễ sứt mẻ quan hệ hoặc bật căng thẳng',
      }
    ),
    'Đỗ Môn': withDefault(
      'đóng lại, bế tắc, ngâm đó, chưa mở miệng hoặc chưa chịu lộ hết bài',
      {
        'hoc-tap': 'bị giấu thông tin, bế tắc ý tưởng, chưa công bố đề cương hoặc đáp án',
        'gia-dao': 'chiến tranh lạnh, đóng cửa phòng, ai cũng giữ cái tôi mà không chịu nói thật',
        'su-nghiep': 'tiến độ kẹt, thủ tục không chạy, người có quyền quyết vẫn đang ngâm việc',
      }
    ),
    'Cảnh Môn': withDefault(
      'tin tức, giấy tờ, hình ảnh, điều gì đó đang lộ ra hoặc được bày lên bàn',
      {
        'hoc-tap': 'đề cương, tài liệu, thông báo thi, kết quả, giấy tờ học vụ',
        'bat-dong-san': 'bảng giá, pháp lý, quy hoạch, tin rao và hồ sơ đang dần lộ diện',
        'tinh-duyen': 'cảm xúc bị đẩy ra mặt, ai để ý cũng nhìn ra chuyện giữa hai người',
        'ky-hop-dong': 'hợp đồng, điều khoản, văn bản, chữ ký, mọi thứ phải đọc trên giấy',
      }
    ),
    'Tử Môn': withDefault(
      'điểm dừng, bế tắc nặng, thứ đang cạn lực hoặc có nguy cơ chết máy',
      {
        'tai-van': 'cửa tiền tắc hẳn, lao tiếp dễ thành mất vốn hoặc sa hố sâu hơn',
        'thi-cu': 'áp lực nặng, dễ nản hoặc toang nếu còn ôm cách học sai',
        'kinh-doanh': 'dự án dễ chết non, đừng all-in khi số đang báo bế',
      }
    ),
    'Kinh Môn': withDefault(
      'chấn động, lo âu, biến động ngoài dự kiến, thứ làm thần kinh căng lên',
      {
        'thi-cu': 'thi cử nhiều biến số, lịch hoặc cấu trúc có thể thay đổi bất ngờ',
        'kien-tung': 'cảnh báo pháp lý, hồ sơ hoặc thế đối đầu căng hơn tưởng tượng',
        'suc-khoe': 'kết quả hoặc triệu chứng có thể đến theo kiểu làm bạn giật mình',
      }
    ),
  },
  Stars: {
    'Thiên Bồng': withDefault(
      'liều, ngầm, rủi ro cao, dễ kéo mọi chuyện sang vùng khó đoán',
      {
        'tai-van': 'cửa lời lỗ lớn, hấp dẫn nhưng rất dễ đốt tiền nếu tham quá tay',
        'kien-tung': 'đối phương chơi nước liều hoặc dùng đòn bẩn ngoài dự tính',
        'kinh-doanh': 'thị trường sóng to, đánh nhanh dễ ăn nhưng cũng dễ chìm',
      }
    ),
    'Thiên Nhuế': withDefault(
      'lỗi, chậm, trì trệ, chỗ nào cũng phải sửa và vá lại',
      {
        'hoc-tap': 'kiến thức hổng lỗ chỗ, phải vá nền trước khi lao lên phần khó',
        'suc-khoe': 'cơ thể báo điểm yếu kéo dài, không xử lý gốc thì cứ tái đi tái lại',
        'su-nghiep': 'dự án mắc lỗi vặt, quy trình rối, làm mãi vẫn không thấy trơn',
      }
    ),
    'Thiên Xung': withDefault(
      'xốc, nhanh, phá vỡ thế cũ, ép bạn phải hành động ngay',
      {
        'su-nghiep': 'có cú bứt mạnh về tiến độ hoặc vị trí, chần chừ là mất nhịp',
        'kinh-doanh': 'tung hàng, chốt deal, bùng chiến dịch, mọi thứ cần tốc độ',
        'doi-no': 'đẩy lực lên mới kéo được kết quả, nói phải sắc và gọn',
      }
    ),
    'Thiên Phụ': withDefault(
      'tri thức chuẩn, người có chuyên môn, nguồn chỉ dẫn đáng tin và có bài bản',
      {
        'hoc-tap': 'giáo viên, người chỉ bài, tài liệu chuẩn, đúng chỗ cần nắm',
        'bat-dong-san': 'môi giới tốt, luật sư, hồ sơ chuẩn, người rành nghề đứng đỡ',
        'gia-dao': 'người lớn hiểu chuyện, người biết điều đứng ra nói một câu có sức nặng',
        'su-nghiep': 'mentor hoặc cấp trên chỉ đúng đường, làm theo đỡ mò mẫm',
      }
    ),
    'Thiên Cầm': withDefault(
      'điểm cân bằng, nhịp trung tâm, thứ giữ cho cục diện chưa đổ hẳn về một bên'
    ),
    'Thiên Tâm': withDefault(
      'lý trí, chiến thuật, phân tích, nhìn xuyên cấu trúc để ra đúng nước đi',
      {
        'tai-van': 'phải soi dòng tiền, tỷ lệ lời lỗ và điểm vào ra bằng đầu lạnh',
        'muu-luoc': 'đúng kiểu quân sư, cần bản đồ đường đi chứ không chỉ cảm giác',
        'hoc-tap': 'học có chiến lược, chia chương, chia ý, chia cách ôn cho đúng bài',
      }
    ),
    'Thiên Trụ': withDefault(
      'gây cản, tạo áp lực, làm tiếng nói bị nghẽn hoặc bị cô lập',
      {
        'gia-dao': 'lời qua tiếng lại, cái tôi dựng thành bức tường, ai cũng nói mà không lọt tai nhau',
        'su-nghiep': 'bị vướng đầu mối cứng, nói mãi vẫn không ai chịu ký hoặc bật đèn xanh',
      }
    ),
    'Thiên Nhậm': withDefault(
      'chịu lực, bền bỉ, đường dài, chậm mà chắc',
      {
        'hoc-tap': 'ôn đều, học dài hơi, không hợp học tủ nhưng hợp cày bền',
        'bat-dong-san': 'hợp cầm dài hạn, tài sản kiểu găm chắc hơn là lướt sóng',
        'gia-dao': 'muốn êm phải kiên nhẫn, không thể giải xong bằng một trận cãi nhau',
      }
    ),
    'Thiên Anh': withDefault(
      'nổi bật, sáng mạnh, chớp nhanh, gây chú ý nhưng cũng dễ quá lửa',
      {
        'su-nghiep': 'có cơ hội đứng spotlight, nhưng phô quá là phản tác dụng',
        'thi-cu': 'dễ làm bài nổi bật hoặc được để ý, nhưng nóng quá là sai nhịp',
        'tinh-duyen': 'rung động mạnh, hấp dẫn cao, nhưng cũng dễ bốc lên rồi hụt hơi',
      }
    ),
  },
  Stems: {
    'Giáp': withDefault('mầm khởi đầu, ý muốn phá vỏ để đi ra'),
    'Ất': withDefault(
      'đường mềm, xoay khéo, xử lý mảnh và linh hoạt',
      {
        'tinh-duyen': 'không nên ép thẳng, đi đường mềm mới gỡ được nút cảm xúc',
        'bat-dong-san': 'deal kiểu mềm dẻo, hỏi khéo thì bên kia mới lộ phần giá tốt',
      }
    ),
    'Bính': withDefault(
      'ánh sáng rõ, thứ gì giấu cũng dễ bị kéo ra ngoài',
      {
        'bat-dong-san': 'pháp lý, quy hoạch, thông tin thị trường dễ bị phơi ra rõ hơn',
        'su-nghiep': 'thành tích hoặc lỗi sai đều dễ bị soi thấy',
      }
    ),
    'Đinh': withDefault(
      'mồi lửa nhỏ nhưng sắc, đúng chỗ là bùng, sai chỗ là cháy',
      {
        'thi-cu': 'nước rút tốt, chốt ý sắc, học gọn mà trúng',
        'muu-luoc': 'đòn đánh gọn, chạm đúng điểm đau là đủ đổi cục diện',
      }
    ),
    'Mậu': withDefault(
      'khối nặng, nền vật chất, phần lõi khó lay chuyển',
      {
        'bat-dong-san': 'đất và tài sản cứng, giá trị nằm ở cái nền thật chứ không phải lời kể',
        'tai-van': 'tiền nằm ở tài sản chắc tay, không nằm ở trò quá bay',
      }
    ),
    'Kỷ': withDefault(
      'điều tiết, dọn lại, đưa thứ rối về khuôn',
      {
        'gia-dao': 'cần người thu xếp lại nhịp nhà, nói ít nhưng gỡ nút đúng chỗ',
        'hoc-tap': 'hệ thống lại bài vở, gom cái rối thành lộ trình học có trật tự',
      }
    ),
    'Canh': withDefault(
      'cắt bỏ, quyết đoán, xử lý dứt điểm',
      {
        'kien-tung': 'cần chém vào trọng tâm hồ sơ, bỏ bớt chi tiết lan man',
        'doi-no': 'đòi tiền phải nói rõ hạn, rõ mức, rõ hậu quả nếu tiếp tục dây dưa',
      }
    ),
    'Tân': withDefault(
      'tinh lọc, soi chi tiết, phần sắc nhất thường nằm ở chỗ nhỏ',
      {
        'hoc-tap': 'điểm ăn nằm ở chi tiết nhỏ, lỗi ngớ ngẩn cũng nằm ở chi tiết nhỏ',
        'ky-hop-dong': 'đừng nhìn tổng quan đẹp mà bỏ sót điều khoản sắc như dao lam',
      }
    ),
    'Nhâm': withDefault(
      'dòng chảy lớn, biến thiên mạnh, thứ đang dịch chuyển liên tục',
      {
        'xuat-hanh': 'lịch, đường đi, phương án di chuyển có thể đổi rất nhanh',
        'kinh-doanh': 'dòng tiền và dòng hàng biến động nhanh, phải giữ tay lái chắc',
      }
    ),
    'Quý': withDefault(
      'mưa ngấm, ảnh hưởng âm thầm, thứ nhỏ nhưng thấm rất sâu theo thời gian',
      {
        'tinh-duyen': 'cảm xúc không ồn ào nhưng ngấm, càng để lâu càng khó gỡ',
        'gia-dao': 'uất ức tích nhỏ thành lớn nếu cứ im lặng mãi',
      }
    ),
  },
  Flags: {
    'Dịch Mã': withDefault(
      'sự thay đổi đột ngột, tốc độ siêu tốc, phi tới bất ngờ, bồn chồn muốn hành động ngay',
      {
        'tai-van': 'tiền vào ra nhanh, cơ hội lóe lên rồi tắt rất gắt, chậm là mất',
        'tinh-duyen': 'cảm xúc đổi nhanh, người ta có thể đến rất nhanh rồi cũng lùi rất nhanh',
        'su-nghiep': 'task, deadline, job hoặc vai trò mới ập tới khiến bạn phải xoay liên tục',
        'kinh-doanh': 'đơn hàng, deal, thị trường đổi nhịp nhanh như giật điện',
        'bat-dong-san': 'tin rao, giá, khách hoặc deal chạy rất gấp, ai chậm chân là trượt',
        'hoc-tap': 'lịch học, tài liệu, đề cương hoặc nhịp ôn đổi rất nhanh, phải bám sát ngay',
        'thi-cu': 'đề, lịch, tâm lý thi hoặc cơ hội thi đến nhanh, phải phản ứng cực gọn',
        'gia-dao': 'trong nhà có biến bất ngờ, một người nóng lên là cả nhà phải chạy theo',
        'ky-hop-dong': 'deal tiến cực nhanh, điều khoản có thể đổi ngay trước lúc chốt',
        'dam-phan': 'bàn đàm phán xoay chiều liên tục, ai chậm nửa nhịp là mất thế',
        'doi-no': 'đối phương đổi thái độ hoặc lịch trả rất nhanh, phải bám sát từng nhịp',
        'kien-tung': 'hồ sơ hoặc thế kiện có cú bẻ lái bất ngờ, cần phản ứng kịp',
        'xuat-hanh': 'lịch trình đổi liên tục, đúng kiểu phải xách đồ lên đi ngay',
        'xin-viec': 'job mở ra bất ngờ, lịch phỏng vấn hoặc offer đến nhanh hơn dự đoán',
        'muu-luoc': 'kế hoạch phải tính cả nhịp đổi sân cực nhanh, không thể vẽ đường thẳng',
      }
    ),
    'Không Vong': withDefault(
      'sự trống rỗng, ảo ảnh, delay, hứa suông, mọi nỗ lực dễ thành muối bỏ bể',
      {
        'tai-van': 'tưởng có tiền mà hóa ra hụt, con số đẹp nhưng tiền thật chưa chạm tay',
        'tinh-duyen': 'kỳ vọng treo lơ lửng, người kia hứa nhiều nhưng hành động mỏng',
        'su-nghiep': 'nỗ lực đổ vào nhưng thành quả chưa hiện, dễ thấy mình làm mà như không',
        'kinh-doanh': 'đơn tưởng chốt mà hụt, khách tưởng nóng mà hóa ra chỉ hỏi chơi',
        'bat-dong-san': 'deal đẹp trên giấy nhưng thực tế chốt không được hoặc thông tin bị hẫng',
        'hoc-tap': 'học nhiều nhưng vào phòng thi lại trống đầu hoặc ôn lệch trọng tâm',
        'thi-cu': 'đặt cược lớn nhưng kết quả hụt tay, kỳ vọng và thực tế vênh nhau rõ',
        'gia-dao': 'nhà có người nhưng lòng cách xa, sự thấu hiểu bị rỗng, khoảng trống và nỗi cô đơn nằm ngay trong tổ ấm',
        'ky-hop-dong': 'cam kết nghe ngon nhưng hiệu lực mỏng, chữ nghĩa không giữ được kết quả',
        'dam-phan': 'ngồi nói lâu mà không kéo được gì về phía mình',
        'doi-no': 'hứa trả tiếp tục là hứa, tiền vẫn không về',
        'kien-tung': 'đi nhiều thủ tục mà kết quả vẫn treo',
        'xuat-hanh': 'kế hoạch đi bị delay, đặt rồi lại hủy, mọi thứ cứ hụt nhịp',
        'xin-viec': 'phỏng vấn xong tưởng chắc nhưng offer vẫn bốc hơi',
        'muu-luoc': 'kế hoạch nghe hợp lý nhưng thiếu lực thi hành thật',
      }
    ),
    'Phục Ngâm': withDefault(
      'bế tắc dai dẳng, giậm chân tại chỗ, lặp đi lặp lại một vòng chán nản không hồi kết',
      {
        'tai-van': 'vòng lặp kiếm rồi lại thủng, sửa mãi vẫn không ra khỏi nhịp cũ',
        'tinh-duyen': 'chuyện cũ quay lại y hệt, cãi kiểu cũ, buồn kiểu cũ, không có đột phá',
        'su-nghiep': 'làm mãi một việc, mắc mãi một lỗi, kẹt mãi một vị trí',
        'kinh-doanh': 'bài toán tồn đọng cứ quay lại, doanh số không bứt khỏi mặt bằng cũ',
        'bat-dong-san': 'deal kẹt lâu, hồ sơ ngâm dài, tiến độ đứng ì',
        'hoc-tap': 'ngâm bài, đọc đi đọc lại vẫn chưa nuốt được, học mãi một vòng mà không lên',
        'thi-cu': 'ôn rất lâu nhưng cảm giác đứng yên, tâm lý dễ nản vì không thấy tiến',
        'gia-dao': 'mâu thuẫn cũ cứ lặp lại, nói mãi vẫn quay về đúng chỗ đau ban đầu',
        'ky-hop-dong': 'đàm qua đàm lại một vòng, sửa bản nào cũng vẫn mắc chỗ cũ',
        'dam-phan': 'mặc cả không nhúc nhích, đôi bên kẹt nguyên vị trí cũ',
        'doi-no': 'đòi mãi một điệp khúc, hẹn mãi rồi trễ mãi',
        'kien-tung': 'vụ việc kéo dài, thủ tục nối thủ tục, người trong cuộc mòn sức',
        'xuat-hanh': 'dời đi dời lại, muốn đi mà cứ mắc vòng lặp',
        'xin-viec': 'apply mãi kiểu cũ, trượt mãi kiểu cũ, chưa đổi chiến thuật',
        'muu-luoc': 'kế hoạch đẹp nhưng cứ nằm trên giấy, không thoát được vòng lặp chuẩn bị',
      }
    ),
    'Phản Ngâm': withDefault(
      'quay xe phút chót, đảo ngược 180 độ, nhanh đến rồi cũng nhanh đi, hai chiều giằng co liên tục',
      {
        'tai-van': 'sáng lãi chiều lỗ, thị trường hoặc quyết định quay xe cực gắt',
        'tinh-duyen': 'vừa ấm lên đã lạnh đi, vừa muốn gần đã đẩy ra xa',
        'su-nghiep': 'đèn xanh vừa bật đã thành đèn đỏ, quyết định nhân sự đổi phút cuối',
        'kinh-doanh': 'deal hoặc thị trường đảo chiều cực nhanh, vừa tưởng ăn đã hóa hụt',
        'bat-dong-san': 'bên kia đổi ý, giá đổi, lịch cọc đổi, rất dễ gãy phút chót',
        'hoc-tap': 'chiến thuật ôn vừa chốt đã phải đổi, tâm lý lên xuống mạnh',
        'thi-cu': 'thế thi cử thay đổi liên tục, lịch hoặc độ khó quay xe bất ngờ',
        'gia-dao': 'người trong nhà đổi thái độ nhanh, vừa dịu đã bùng lại',
        'ky-hop-dong': 'điều khoản lật phút cuối, cần giữ bình tĩnh trước những cú quay xe',
        'dam-phan': 'đối phương lật bài nhanh, vừa nhả đã siết lại',
        'doi-no': 'vừa hẹn trả đã đổi giọng, vừa mềm đã cứng',
        'kien-tung': 'thế hồ sơ hoặc đối phương có pha lật tay rất gắt',
        'xuat-hanh': 'lịch trình đảo chiều, vé đổi, giờ đổi, phương án phải xoay liên tục',
        'xin-viec': 'offer hoặc lịch phỏng vấn đổi phút chót',
        'muu-luoc': 'chiến lược phải tính kịch bản quay xe, không được đặt cược một cửa',
      }
    ),
  },
};
