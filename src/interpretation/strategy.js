import { FIVE_ELEMENTS } from '../core/tables.js'; // Giả sử có bảng liệt kê tương sinh tương khắc
import { stems, branches } from '../core/stems.js';

/**
 * Lớp Chiến Lược (Vận Trù Học) - Nhận Raw Chart từ Core và phân tích thành Strategy Labels
 */
export class StrategyEngine {
  constructor(chartData, askStem, targetPalaceIndex) {
    this.chart = chartData; // JSON từ Core (Golden Oracles format)
    this.askStem = askStem; // Nhật Can (Can ngày hỏi)
    this.targetPalaceIdx = targetPalaceIndex; // Chỉ số Cung Dụng Thần (Mục tiêu)
    
    // Tìm cung chứa Nhật Can (Thiên Bàn) 
    this.askPalaceIdx = this._findPalaceByHeavenStem(askStem);
  }

  _findPalaceByHeavenStem(stemId) {
    return this.chart.palaces.findIndex(p => p.heavenStem === stemId) || 0;
  }

  // Tiện ích lấy hành của Cung (1: Thủy, 2,8: Thổ, 3,4: Mộc, 9: Hỏa, 6,7: Kim)
  _getPalaceElement(palaceNumber) {
    const elementMap = {
      1: 'water',
      2: 'earth',
      3: 'wood',
      4: 'wood',
      5: 'earth', // Trung cung gửi Khôn/Cấn
      6: 'metal',
      7: 'metal',
      8: 'earth',
      9: 'fire'
    };
    return elementMap[palaceNumber];
  }

  // -------------- MODULE 1: ĐỊA THẾ GIAO TRANH --------------
  _analyzeElements() {
    if (this.askPalaceIdx === -1 || this.targetPalaceIdx === -1) return null;

    const askPalace = this.chart.palaces[this.askPalaceIdx];
    const targetPalace = this.chart.palaces[this.targetPalaceIdx];

    const askElement = this._getPalaceElement(askPalace.palace);
    const targetElement = this._getPalaceElement(targetPalace.palace);

    // Mảng quy luật ngũ hành
    const WEAKENS = {
      'wood': 'fire', 'fire': 'earth', 'earth': 'metal', 'metal': 'water', 'water': 'wood'
    };
    const DESTROYS = {
      'wood': 'earth', 'earth': 'water', 'water': 'fire', 'fire': 'metal', 'metal': 'wood'
    };

    if (askElement === targetElement) {
      return { type: 'harmony', label: 'Tỉ Hòa Đồng Chí: Tương đồng năng lượng, đứng cùng chiến tuyến', color: 'blue' };
    } else if (WEAKENS[targetElement] === askElement) {
      return { type: 'target_generates_ask', label: 'Thuận nước đẩy thuyền: Mục tiêu tự tìm đến, mở lòng đón nhận, không nghi ngờ', color: 'green' };
    } else if (WEAKENS[askElement] === targetElement) {
      return { type: 'ask_generates_target', label: 'Vắt kiệt sinh lực: Đang chạy theo mục tiêu gây hao tổn. Cần cắt lỗ cảm xúc, kiểm soát nguồn lực', color: 'orange' };
    } else if (DESTROYS[targetElement] === askElement) {
      return { type: 'target_destroys_ask', label: 'Đá tảng giữa đường: Áp lực ngoại cảnh lớn. Tuyệt đối không đối đầu trực diện, dùng chiến thuật Tĩnh', color: 'red' };
    } else if (DESTROYS[askElement] === targetElement) {
      return { type: 'ask_destroys_target', label: 'Đoạt ấn phá thành: Nắm thế chủ động. Bẻ gãy khó khăn, đánh nhanh thắng nhanh', color: 'purple' };
    }

    return null;
  }

  // -------------- MODULE 2: ĐIỂM MÙ NĂNG LƯỢNG --------------
  _analyzeVoid(xunShou) {
     // Hàm giả định kiểm tra Tuần Không dựa vào Tuần Thủ (xunShou)
     // Ví dụ Giáp Tý (Tuần Thủ) -> Tuất Hợi Không Vong (Cung Càn 6)
     const voidPalaces = this._calculateVoidBranches(xunShou); // Cần map logic chính xác
     
     const askPalaceNum = this.chart.palaces[this.askPalaceIdx].palace;
     const targetPalaceNum = this.chart.palaces[this.targetPalaceIdx].palace;

     const isAskVoid = voidPalaces.includes(askPalaceNum);
     const isTargetVoid = voidPalaces.includes(targetPalaceNum);

     if (isAskVoid || isTargetVoid) {
         return {
             type: 'void_energy',
             label: 'Hố đen năng lượng / Lò xo nén: Đừng hoảng sợ khi thấy mọi thứ chững lại. Đây không phải sự kết thúc mà là năng lượng đang bị nén. Chiến lược: dưỡng sức, bảo toàn lực lượng chờ thời điểm điền thực bùng nổ.',
             color: 'gray',
             details: { askVoid: isAskVoid, targetVoid: isTargetVoid }
         };
     }
     return null;
  }

  // Hàm helper giả lập (sẽ móc logic từ core)
  _calculateVoidBranches(xunShou) {
     // Trả về số Cung bị Không Vong (ví dụ: [6] - Cung Càn)
     return [6]; // Giả định Càn Môn
  }

  // -------------- MODULE 3: THUYẾT KHÁCH - CHỦ --------------
  _analyzeGuestHost() {
      // Đếm các yếu tố biến động (Dịch Mã, Phản Ngâm) hoặc tĩnh (Phục Ngâm, Đỗ/Tử môn)
      // Dựa vào metadata của Chart (ví dụ chart.isFanYin, chart.isFuYin)
      
      const isFanYin = this.chart.id && this.chart.id.includes('fanyin'); // Hoặc logic check thực tế
      const isFuYin = this.chart.id && this.chart.id.includes('fuyin');
      
      // Hoặc check tại cung Nhật Can / Dụng Thần
      const targetDoor = this.chart.palaces[this.targetPalaceIdx].door;
      
      if (isFanYin || ['door_scenery', 'door_fear', 'door_harm'].includes(targetDoor)) { // Môn động/hung
          return {
              role: 'GUEST',
              strategy: 'Làm KHÁCH: Ra tay trước, thay đổi chiến thuật nhanh chóng, phủ đầu đối phương.',
              color: 'red'
          };
      } 
      
      if (isFuYin || ['door_delusion', 'door_death'].includes(targetDoor)) { // Đỗ/Tử môn
           return {
              role: 'HOST',
              strategy: 'Làm CHỦ: Lấy tĩnh chế động, án binh bất động, phòng thủ chặt chẽ, thu thập thông tin, ai ra mặt trước người đó thiệt.',
              color: 'blue'
          };
      }

      // Default tùy thuộc Ngũ Hành giao tranh
      return {
          role: 'FLEXIBLE',
          strategy: 'Tùy cơ ứng biến, cục diện giằng co.',
          color: 'gray'
      };
  }

  /**
   * Pipeline phân tích toàn bộ mưu lược
   */
  generateStrategy() {
      return {
          combat_elements: this._analyzeElements(),
          void_energy: this._analyzeVoid(this.chart.xunShou),
          guest_host_tactics: this._analyzeGuestHost()
      };
  }
}
