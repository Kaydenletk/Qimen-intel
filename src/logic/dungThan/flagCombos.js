/**
 * flagCombos.js — Flag Conflict Engine
 *
 * Central combo detection for QMDJ flag interactions.
 * All domain logic files import from here instead of ad-hoc detection.
 *
 * Priority rule: Yin flags (VOID, FU_YIN) ALWAYS dominate Yang flags (DICH_MA, FAN_YIN).
 * Array is ordered by severity (highest first) so getPrimaryCombo() returns the most severe.
 */

// ══════════════════════════════════════════════════════════════════════════════
// COMBO DEFINITIONS — ordered by severity (highest → lowest)
// ══════════════════════════════════════════════════════════════════════════════

export const COMBO_DEFS = [
  // ── CRITICAL: Yin + Yin ──────────────────────────────────────────────────
  {
    id: 'VOID_FU_YIN',
    requires: ['VOID', 'FU_YIN'],
    severity: 'critical',
    scoreAdjust: -15,
    conf: 0.35,
    label: 'Dừng lại hoàn toàn',
    // WHY: Void = destination is empty; Fu Yin = engine is stuck.
    // Combined: can't move AND there's nothing to move toward. Total paralysis.
    conflictHint: 'Không Vong chồng lên Phục Ngâm tạo thế tê liệt hoàn toàn. Không hành động, không hứa hẹn, không đầu tư lúc này.',
  },

  // ── HIGH: Yin + Yang ─────────────────────────────────────────────────────
  {
    id: 'VOID_FAN_YIN',
    requires: ['VOID', 'FAN_YIN'],
    severity: 'high',
    scoreAdjust: -12,
    conf: 0.40,
    label: 'Ảo ảnh đảo ngược',
    // WHY: Void = what you see is empty; Fan Yin = everything flips 180°.
    // Combined: the thing you chase is hollow, and if you reverse it's also a trap.
    conflictHint: 'Thứ nhảy vào là ảo, quay xe cũng là bẫy. Phải xác minh lại toàn bộ dữ kiện trước khi di chuyển.',
  },
  {
    id: 'HORSE_VOID',
    requires: ['DICH_MA', 'VOID'],
    severity: 'high',
    scoreAdjust: -10,
    conf: 0.45,
    label: 'Ngựa chạy vào hố',
    // WHY: Dich Ma = speed, urgency; Void = destination is empty.
    // Combined: the faster you go, the deeper you fall into nothing.
    conflictHint: 'Tốc độ đang tỷ lệ thuận với rủi ro. Càng nhanh càng dễ rơi vào hư không.',
  },
  {
    id: 'HORSE_FAN_YIN',
    requires: ['DICH_MA', 'FAN_YIN'],
    severity: 'high',
    scoreAdjust: -10,
    conf: 0.48,
    label: 'Quay xe trong gió',
    // WHY: Dich Ma = rapid movement; Fan Yin = 180° reversal.
    // Combined: moving fast then slamming into reverse. Maximum volatility.
    conflictHint: 'Tốc độ + đảo ngược = biến động cực mạnh. Ưu tiên ngắn hạn, tin phương án đầu tiên, không đặt cược dài hạn.',
  },

  // ── MEDIUM: softer combos ─────────────────────────────────────────────────
  {
    id: 'HORSE_FU_YIN',
    requires: ['DICH_MA', 'FU_YIN'],
    severity: 'medium',
    scoreAdjust: -8,
    conf: 0.50,
    label: 'Nội kích ngoại tĩnh',
    // WHY: Dich Ma = urge to move fast; Fu Yin = stuck/stagnant inside.
    // Combined: external pressure to act but internal engine is frozen. Must release inner tension first.
    conflictHint: 'Bên ngoài mọi thứ có vẻ gấp nhưng bên trong đang kết cứng. Giải tỏa áp lực nội bộ trước khi bước ra ngoài.',
  },
  {
    id: 'FU_FAN',
    requires: ['FU_YIN', 'FAN_YIN'],
    severity: 'medium',
    scoreAdjust: -8,
    conf: 0.45,
    label: 'Ngầm ngầm dậy sóng',
    // WHY: Fu Yin = stuck on surface; Fan Yin = reversal brewing underneath.
    // Combined: looks calm but a flip is building. Rare edge case (near mutual exclusive).
    conflictHint: 'Bề mặt yên tĩnh nhưng bên dưới đang tích lũy cú đảo chiều. Không nên tin vào sự ổn định hiện tại.',
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// TOPIC-SPECIFIC COMBO ADVICE
// ══════════════════════════════════════════════════════════════════════════════

const COMBO_TOPIC_ADVICE = {
  // ── VOID + FU_YIN: "Dừng lại hoàn toàn" ────────────────────────────────
  VOID_FU_YIN: {
    default: {
      headline: 'Đóng Băng Hoàn Toàn',
      coreMessage: 'Cung Dụng Thần đang dính Không Vong + Phục Ngâm: không có đích đến thật, không có lực để đi. Tê liệt hoàn toàn.',
      doHint: 'Ngưng mọi hành động lớn, chỉ xử lý việc duy trì tối thiểu.',
      avoidHint: 'Ký kết, đầu tư, cam kết hoặc hứa hẹn bất cứ điều gì.',
    },
    'hoc-tap': {
      headline: 'Ngưng Ôn Tập',
      coreMessage: 'Không Vong + Phục Ngâm: đầu không tiếp thu được gì lúc này, ôn thêm chỉ giậm chân tại chỗ.',
      doHint: 'Nghỉ hoàn toàn, ngủ đủ giấc, quay lại khi tinh thần đã sáng.',
      avoidHint: 'Nhồi thêm kiến thức hoặc ôn cấp tốc.',
    },
    'thi-cu': {
      headline: 'Tạm Dừng Ôn Thi',
      coreMessage: 'Không Vong + Phục Ngâm: mọi nỗ lực ôn đều rơi vào khoảng trống, càng ép càng rối.',
      doHint: 'Nghỉ ngơi, đi dạo, để não reset tự nhiên.',
      avoidHint: 'Ôn xuyên đêm hoặc thay đổi phương pháp liên tục.',
    },
    'tinh-duyen': {
      headline: 'Đình Chỉ Cảm Xúc',
      coreMessage: 'Không Vong + Phục Ngâm: mọi lời hứa đều rỗng, mọi cố gắng kéo lại đều kẹt. Ngưng lại.',
      doHint: 'Dành thời gian cho bản thân, không tìm kiếm hay cố sửa chữa.',
      avoidHint: 'Đầu tư cảm xúc hoặc ép đối phương cam kết.',
    },
    'tai-van': {
      headline: 'Dòng Tiền Kết Cứng',
      coreMessage: 'Không Vong + Phục Ngâm: không có dòng tiền nào chảy được lúc này, giữ tiền là ưu tiên.',
      doHint: 'Giữ tiền mặt, không xuống tiền, không cho vay.',
      avoidHint: 'Đầu tư, trading, hoặc mở vị thế mới.',
    },
    'kinh-doanh': {
      headline: 'Kinh Doanh Tê Liệt',
      coreMessage: 'Không Vong + Phục Ngâm: thị trường rỗng + mô hình kẹt. Đừng bung lực.',
      doHint: 'Duy trì vận hành tối thiểu, cắt chi phí không cần thiết.',
      avoidHint: 'Mở rộng, tuyển thêm, hoặc tung chiến dịch lớn.',
    },
    'su-nghiep': {
      headline: 'Sự Nghiệp Đóng Băng',
      coreMessage: 'Không Vong + Phục Ngâm: mọi cam kết từ cấp trên đều rỗng, mọi nỗ lực đều kẹt.',
      doHint: 'Giữ nguyên vị trí, không nộp đơn mới, không ký mới.',
      avoidHint: 'Xin tăng lương, nhảy việc, hoặc chờ đợi lời hứa miệng.',
    },
    'gia-dao': {
      headline: 'Gia Đình Tê Liệt',
      coreMessage: 'Không Vong + Phục Ngâm: không ai nói được gì có nghĩa lúc này. Ngưng bàn, ngưng giải quyết.',
      doHint: 'Mỗi người tự giữ không gian riêng, không ép đối thoại.',
      avoidHint: 'Họp gia đình, ép người khác đổi ý, hoặc ra quyết định chung.',
    },
    'bat-dong-san': {
      headline: 'BĐS Đông Cứng',
      coreMessage: 'Không Vong + Phục Ngâm: hồ sơ treo, giá trị rỗng, pháp lý kẹt. Không giao dịch.',
      doHint: 'Chờ đợi, không đặt cọc, không ký hợp đồng mới.',
      avoidHint: 'Chốt deal dưới áp lực thời gian.',
    },
  },

  // ── VOID + FAN_YIN: "Ảo ảnh đảo ngược" ─────────────────────────────────
  VOID_FAN_YIN: {
    default: {
      headline: 'Ảo Ảnh Đảo Ngược',
      coreMessage: 'Mọi tín hiệu đảo chiều đang nhảy múa trước mắt bạn chỉ là bóng đèn nhiễu. Đừng vội tin vào cú quay xe nào khi lõi dữ liệu vẫn rỗng.',
      narrative: 'Đây là thế "Pointer to Null": hệ thống báo có thay đổi, bạn lao vào xử lý, nhưng vùng nhớ đó thực ra trống rỗng. Càng phản ứng theo cú đảo chiều, càng xa sự thật.',
      doHint: 'Hard reset lại toàn bộ giả định, quay về dữ liệu gốc và nguồn xác nhận thật.',
      avoidHint: 'Hành động theo cú hích cảm xúc, tin vào bề mặt hoặc chạy theo áp lực thời gian.',
    },
    'hoc-tap': {
      headline: 'Đừng Đuổi Theo Tin Rác',
      coreMessage: 'Mọi thông báo thay đổi phút chót hoặc "quay xe" về đề thi đều là ảo ảnh.',
      narrative: 'Năng lượng đang tạo ra các "Ghost Signals". Bạn thấy mọi thứ đảo lộn nhưng thực chất cốt lõi không có gì mới.',
      doHint: 'Giữ vững kiến thức nền tảng (Base Case). Mặc kệ các tin đồn biến động.',
      avoidHint: 'Đừng hớt hải chạy theo tài liệu mới rò rỉ hoặc thay đổi cách ôn tập vào giờ chót.',
    },
    'thi-cu': {
      headline: 'Đừng Đuổi Theo Tin Rác',
      coreMessage: 'Mọi thông báo thay đổi phút chót hoặc "quay xe" về đề thi đều là ảo ảnh.',
      narrative: 'Năng lượng đang tạo ra các "Ghost Signals". Bạn thấy mọi thứ đảo lộn nhưng thực chất cốt lõi không có gì mới.',
      doHint: 'Giữ vững kiến thức nền tảng (Base Case). Mặc kệ các tin đồn biến động.',
      avoidHint: 'Đừng hớt hải chạy theo tài liệu mới rò rỉ hoặc thay đổi cách ôn tập vào giờ chót.',
    },
    'tai-van': {
      headline: 'Bẫy Thanh Khoản',
      coreMessage: 'Thị trường nhìn như đang đảo chiều (Reversal) nhưng thực chất là một cái hố rỗng.',
      narrative: 'Đây là kịch bản "Fake Out". Đừng tưởng "quay xe" là cơ hội, đó là bẫy dụ bạn xuống tiền vào chỗ không người.',
      doHint: 'Đóng lệnh, giữ tiền mặt. Chờ đợi sự xác nhận (Confirmation) từ thực tế thay vì cảm giác.',
      avoidHint: 'Tuyệt đối không bắt đáy (Catching a falling knife) khi thấy tín hiệu đảo chiều ảo này.',
    },
    'tinh-duyen': {
      headline: 'Lời Hứa Gió Bay',
      coreMessage: 'Sự thay đổi thái độ đột ngột của đối phương chỉ là phản ứng nhất thời, không có giá trị cam kết.',
      narrative: 'Họ nói họ thay đổi? Họ nói họ muốn quay lại hoặc rời đi? Đừng tin. Đó là sự "nhiễu sóng" cảm xúc, bên trong họ đang trống rỗng.',
      doHint: 'Im lặng và quan sát. Hãy coi mọi lời nói lúc này là "Undefined Variable".',
      avoidHint: 'Đừng dồn cảm xúc hoặc phản ứng gắt theo sự "quay xe" của họ.',
    },
    'muu-luoc': {
      headline: 'Chiến Thuật Rỗng',
      coreMessage: 'Kế hoạch phản công nhìn có vẻ khả thi nhưng dữ liệu đầu vào (Input) hoàn toàn sai lệch.',
      narrative: 'Bạn đang định thay đổi chiến lược vì thấy tình hình xoay chuyển? Cẩn thận, đó là "Zombie Process" - trông như đang chạy nhưng không có output.',
      doHint: 'Hard Reset lại các giả định. Kiểm tra lại dữ liệu gốc từ đầu.',
      avoidHint: 'Đừng triển khai nguồn lực dựa trên các tín hiệu "đảo chiều" chưa được kiểm chứng.',
    },
  },

  // ── HORSE_VOID: "Ngựa chạy vào hố" (migrated from dungthan.js) ─────────
  HORSE_VOID: {
    default: {
      headline: 'Phanh Gấp',
      coreMessage: 'Dịch Mã + Không Vong: bị thúc rất nhanh nhưng kết quả cuối lại rỗng. Càng nhanh càng nguy hiểm.',
      doHint: 'Phanh gấp, kiểm chứng dữ liệu gốc trước khi đi tiếp.',
      avoidHint: 'Hành động bộc phát theo cú hối thúc.',
    },
    'hoc-tap': {
      headline: 'Phanh Gấp Trước Khi Ôn',
      coreMessage: 'Dịch Mã + Không Vong: đề cương hoặc thông báo có thể lao tới rất nhanh, nhưng ruột bên trong lại rỗng.',
      doHint: 'Giữ khung ôn nền, chỉ xoay khi đã xác minh bản chính thức.',
      avoidHint: 'Ôn cấp tốc theo tài liệu mới mà chưa kiểm chứng.',
    },
    'thi-cu': {
      headline: 'Phanh Gấp Trước Khi Thi',
      coreMessage: 'Dịch Mã + Không Vong: nhịp thi biến động rất nhanh nhưng kết quả bám theo lại rỗng.',
      doHint: 'Giữ phương án dự phòng, kiểm chứng nguồn chính thức.',
      avoidHint: 'Thay đổi chiến thuật sát giờ thi theo tin đồn.',
    },
    'tinh-duyen': {
      headline: 'Phanh Gấp Cảm Xúc',
      coreMessage: 'Dịch Mã + Không Vong: đối phương hứa nhanh, tiến nhanh, nhưng đích đến là khoảng rỗng.',
      doHint: 'Đợi hành động thật thay vì tin lời nói.',
      avoidHint: 'Đổ cảm xúc quá nhanh vào một cái hố không đáy.',
    },
    'tai-van': {
      headline: 'Phanh Gấp Tiền Bạc',
      coreMessage: 'Dịch Mã + Không Vong: cơ hội trông vừa gấp vừa thơm, nhưng đích đến là hư không.',
      doHint: 'Xác minh dữ kiện gốc, phanh gấp trước khi xuống tiền.',
      avoidHint: 'Vội xuống tiền vì sợ mất cơ hội.',
    },
    'kinh-doanh': {
      headline: 'Phanh Gấp Kinh Doanh',
      coreMessage: 'Dịch Mã + Không Vong: đối tác hoặc cơ hội đẩy nhịp cực nhanh, nhưng nền thực thi lại rỗng.',
      doHint: 'Thử nhỏ và kiểm chứng trước khi bung lực.',
      avoidHint: 'Bung lực chỉ vì bị hối.',
    },
    'bat-dong-san': {
      headline: 'Phanh Gấp Nhà Đất',
      coreMessage: 'Dịch Mã + Không Vong: hồ sơ hoặc lời mời chốt cọc ép rất gấp, nhưng đích đến rỗng.',
      doHint: 'Phanh gấp trước khi đặt tiền, kiểm pháp lý.',
      avoidHint: 'Chốt cọc dưới áp lực thời gian.',
    },
  },

  // ── HORSE_FAN_YIN: "Quay xe trong gió" ──────────────────────────────────
  HORSE_FAN_YIN: {
    default: {
      headline: 'Cảnh Báo Biến Động',
      coreMessage: 'Dịch Mã + Phản Ngâm: tốc độ + đảo ngược = biến động cực mạnh. Ưu tiên ngắn hạn.',
      doHint: 'Tin phương án đầu tiên, chốt nhanh rồi rút.',
      avoidHint: 'Đặt cược dài hạn hoặc thay đổi quyết định giữa chừng.',
    },
    'hoc-tap': {
      headline: 'Đề Cương Lật Ngựa',
      coreMessage: 'Dịch Mã + Phản Ngâm: tài liệu đến nhanh nhưng trọng tâm ôn có thể xoay chiều đột ngột.',
      doHint: 'Chuẩn bị 2 phương án ôn, sẵn sàng xoay ngay.',
      avoidHint: 'Dồn hết vào một dạng đề duy nhất.',
    },
    'thi-cu': {
      headline: 'Quay Xe Đề Thi',
      coreMessage: 'Dịch Mã + Phản Ngâm: đề hoặc lịch có thể lật ngựa. Tin đáp án đầu tiên, đừng để Phản Ngâm làm bạn rối trí.',
      doHint: 'Tin đáp án đầu tiên của bạn, không xóa bài đã làm.',
      avoidHint: 'Xóa đi làm lại toàn bộ vào phút chót.',
    },
    'tinh-duyen': {
      headline: 'Cảm Xúc Quay Xe',
      coreMessage: 'Dịch Mã + Phản Ngâm: đối phương có thể đổi ý bất ngờ. Đừng đổ hết vào một lời hứa.',
      doHint: 'Giữ phần quan sát cho mình, không all-in cảm xúc.',
      avoidHint: 'Phản ứng cực đoan theo cú đảo chiều.',
    },
    'tai-van': {
      headline: 'Đảo Ngược Tài Chính',
      coreMessage: 'Dịch Mã + Phản Ngâm: deal xoay chiều cực nhanh. Chỉ chấp nhận lệnh cực nhỏ.',
      doHint: 'Stop-loss siết chặt, chốt lời sớm, không gồng.',
      avoidHint: 'Gồng lỗ hoặc đặt cược lớn.',
    },
    'kinh-doanh': {
      headline: 'Thị Trường Quay Xe',
      coreMessage: 'Dịch Mã + Phản Ngâm: xu hướng thị trường có thể đảo ngược cực nhanh.',
      doHint: 'Chiến dịch ngắn hạn, test nhỏ, rút nhanh.',
      avoidHint: 'Cam kết ngân sách lớn hoặc hợp đồng dài hạn.',
    },
    'gia-dao': {
      headline: 'Gió Bão Trong Nhà',
      coreMessage: 'Dịch Mã + Phản Ngâm: một người đổi ý bất ngờ sẽ kéo cả nhà vào cuốn xoáy.',
      doHint: 'Giữ bình tĩnh tuyệt đối, không phản ứng nóng.',
      avoidHint: 'Leo thang mâu thuẫn hoặc ép đối phương quyết định ngay.',
    },
    'su-nghiep': {
      headline: 'Bước Ngoặt Sự Nghiệp',
      coreMessage: 'Dịch Mã + Phản Ngâm: sếp hoặc công ty có thể đảo quyết định bất ngờ.',
      doHint: 'Chuẩn bị phương án B, không phụ thuộc một lời hứa.',
      avoidHint: 'Nghỉ việc chỗ cũ khi chưa ký xong chỗ mới.',
    },
  },

  // ── HORSE_FU_YIN: "Nội kích ngoại tĩnh" ─────────────────────────────────
  HORSE_FU_YIN: {
    default: {
      headline: 'Giải Áp Nội Bộ',
      coreMessage: 'Dịch Mã + Phục Ngâm: muốn đi nhanh nhưng bên trong đang kết cứng. Phải giải tỏa trước.',
      doHint: 'Giải tỏa áp lực nội bộ (hít thở, ghi ra giấy, nói chuyện) trước khi hành động.',
      avoidHint: 'Ép bản thân hành động khi tâm chưa sẵn sàng.',
    },
    'hoc-tap': {
      headline: 'Áp Lực Ôn Bài',
      coreMessage: 'Dịch Mã + Phục Ngâm: muốn học nhanh nhưng đầu như kéo cửa. Giải tỏa trước khi bắt đầu.',
      doHint: 'Hít thở sâu, đi dạo 10 phút, rồi mới mở sách.',
      avoidHint: 'Nhồi kiến thức liên tục khi não đã bão hòa.',
    },
    'thi-cu': {
      headline: 'Nội Kích Phòng Thi',
      coreMessage: 'Dịch Mã + Phục Ngâm: thời gian trôi nhanh nhưng tay bút không viết được. Hít thở sâu, thư giãn cơ tay trước khi viết.',
      doHint: 'Hít thở sâu 3 lần, thư giãn cơ tay, viết chậm rãi từ câu dễ nhất.',
      avoidHint: 'Ép bản thân viết nhanh khi tâm chưa sẵn.',
    },
    'tinh-duyen': {
      headline: 'Nội Kích Tình Cảm',
      coreMessage: 'Dịch Mã + Phục Ngâm: đối phương đẩy nhanh nhưng bạn chưa sẵn. Xử lý cảm xúc nội bộ trước.',
      doHint: 'Nói rõ: "Tôi cần thời gian suy nghĩ" thay vì gật đại.',
      avoidHint: 'Đồng ý cam kết khi lòng chưa rõ.',
    },
    'tai-van': {
      headline: 'Kẹt Lực Tài Chính',
      coreMessage: 'Dịch Mã + Phục Ngâm: thị trường đẩy nhanh nhưng tâm lý bạn đang kẹt. Đừng ép mình ra quyết định.',
      doHint: 'Ghi ra giấy lý do mua/bán, nếu không thuyết phục thì ngừng.',
      avoidHint: 'FOMO — sợ mất cơ hội mà ép bản thân xuống tiền.',
    },
    'kinh-doanh': {
      headline: 'Kinh Doanh Kẹt Lực',
      coreMessage: 'Dịch Mã + Phục Ngâm: cơ hội đến nhanh nhưng nội lực chưa sẵn. Giải quyết nội bộ trước.',
      doHint: 'Sắp xếp lại nội bộ, gỡ nghẽn vận hành trước khi nhận thêm việc.',
      avoidHint: 'Nhận deal mới khi chưa hoàn thành deal cũ.',
    },
    'su-nghiep': {
      headline: 'Kẹt Nhịp Công Việc',
      coreMessage: 'Dịch Mã + Phục Ngâm: deadline dồn nhưng năng lượng cạn. Phải reset trước khi tăng tốc.',
      doHint: 'Ưu tiên 1 việc quan trọng nhất, bỏ qua phần còn lại tạm thời.',
      avoidHint: 'Ôm hết mọi việc cùng lúc.',
    },
    'gia-dao': {
      headline: 'Áp Lực Gia Đình',
      coreMessage: 'Dịch Mã + Phục Ngâm: mọi người trong nhà đang ép nhau nhưng không ai thật sự sẵn sàng đối thoại.',
      doHint: 'Mỗi người viết ra điều mình cần, không nói miệng lúc nóng.',
      avoidHint: 'Ép họp gia đình khi ai cũng đang kẹt.',
    },
  },

  // ── FU_FAN: "Ngầm ngầm dậy sóng" (rare: FU_YIN + FAN_YIN near mutual exclusive) ──
  FU_FAN: {
    default: {
      headline: 'Ngầm Ngầm Dậy Sóng',
      coreMessage: 'Phục Ngâm + Phản Ngâm: bề mặt yên tĩnh nhưng cú đảo chiều đang tích lũy bên dưới.',
      doHint: 'Đừng nghe lời khuyên của bất kỳ ai lúc này, kể cả bản thân mình. Chỉ quan sát.',
      avoidHint: 'Tin vào sự ổn định hiện tại hoặc ra quyết định lớn.',
    },
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// DETECTION FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * detectFlagCombos — Find all matching combos from active flags
 * @param {Object} flags — { VOID: bool, FU_YIN: bool, FAN_YIN: bool, DICH_MA: bool, ... }
 * @returns {Array<{ id, severity, scoreAdjust, conf, label, conflictHint }>}
 */
export function detectFlagCombos(flags) {
  if (!flags) return [];
  return COMBO_DEFS.filter(combo =>
    combo.requires.every(key => Boolean(flags[key]))
  );
}

/**
 * getPrimaryCombo — Return the single highest-severity combo, or null
 * @param {Object} flags
 * @returns {Object|null}
 */
export function getPrimaryCombo(flags) {
  const combos = detectFlagCombos(flags);
  return combos.length > 0 ? combos[0] : null;
}

/**
 * getComboTopicAdvice — Get topic-specific advice for a combo
 * @param {string} comboId
 * @param {string} topicKey — normalized topic key (e.g. 'thi-cu', 'tai-van')
 * @returns {{ headline, coreMessage, doHint, avoidHint }|null}
 */
export function getComboTopicAdvice(comboId, topicKey) {
  const adviceMap = COMBO_TOPIC_ADVICE[comboId];
  if (!adviceMap) return null;

  // Normalize topic key aliases
  const normalizedKey = normalizeTopicKeyForCombo(topicKey);
  return adviceMap[normalizedKey] || adviceMap.default || null;
}

/**
 * getComboAdviceForDungThan — Build full actionAdvice string for dungthan.js
 * @param {string} comboId
 * @param {string} topicKey
 * @param {{ dir, pNm, mon, than, star, can, ok }} ctx — palace context
 * @returns {string|null}
 */
export function getComboAdviceForDungThan(comboId, topicKey, ctx) {
  const advice = getComboTopicAdvice(comboId, topicKey);
  if (!advice) return null;

  const { ok = '⚠️', dir = '', pNm = '', mon = '—', than = '—' } = ctx;
  const combo = COMBO_DEFS.find(c => c.id === comboId);
  const comboLabel = combo ? combo.label : '';

  return `${ok} Hướng ${dir} (${pNm}). ${mon} × ${than} — Đây là thế "${comboLabel}": ${advice.coreMessage} ${advice.doHint ? `Nên: ${advice.doHint}` : ''} ${advice.avoidHint ? `Tránh: ${advice.avoidHint}` : ''}`.trim();
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function normalizeTopicKeyForCombo(topicKey) {
  if (!topicKey) return '';
  if (topicKey === 'thi-cu') return 'thi-cu'; // keep as-is for combo maps
  if (topicKey === 'tinh-yeu') return 'tinh-duyen';
  if (topicKey === 'dien-trach') return 'bat-dong-san';
  if (topicKey === 'chien-luoc') return 'muu-luoc';
  if (topicKey === 'gia-dinh') return 'gia-dao';
  return topicKey;
}
