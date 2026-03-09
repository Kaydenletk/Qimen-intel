/**
 * nguHanhRelation.js — Ngũ Hành (Five Elements) Relationship Pre-computation
 *
 * Compares the Five Elements between the User's palace (Nhật Can position)
 * and the Target palace (Dụng Thần) to produce a pre-digested interpretation
 * that the LLM can directly narrativize.
 *
 * Relationships:
 * - user_controls_target: User khắc Target (exhausting control)
 * - target_controls_user: Target khắc User (external pressure)
 * - user_produces_target: User sinh Target (draining support)
 * - target_produces_user: Target sinh User (favorable boost)
 * - same: Same element (parallel, no force)
 * - neutral: No direct relationship
 */

import { PRODUCES, CONTROLS, PALACE_META, STEMS_BY_NAME } from '../../core/tables.js';

/**
 * Compare Five Elements between User Palace and Target Palace
 * @param {number} userPalaceNum - Palace number where Day Stem sits
 * @param {number} targetPalaceNum - Useful God palace number
 * @param {string} dayStemName - Day Stem name (e.g. 'Giáp', 'Ất')
 * @returns {{ relationship, userElement, targetElement, stemElement, summary, promptBlock } | null}
 */
export function compareNguHanh(userPalaceNum, targetPalaceNum, dayStemName) {
  const userEl = PALACE_META[userPalaceNum]?.element;
  const targetEl = PALACE_META[targetPalaceNum]?.element;
  const stemEl = STEMS_BY_NAME[dayStemName]?.element || '';
  if (!userEl || !targetEl) return null;

  let relationship, summary;
  if (userEl === targetEl) {
    relationship = 'same';
    summary = 'Đồng hành — cùng nhịp, cùng hệ, nhưng không có lực đẩy đột phá.';
  } else if (CONTROLS[userEl] === targetEl) {
    relationship = 'user_controls_target';
    summary = 'Người hỏi đang cố gắng kiểm soát hoàn cảnh một cách mệt mỏi.';
  } else if (CONTROLS[targetEl] === userEl) {
    relationship = 'target_controls_user';
    summary = 'Hoàn cảnh đang gây áp lực và vắt kiệt sức người hỏi.';
  } else if (PRODUCES[userEl] === targetEl) {
    relationship = 'user_produces_target';
    summary = 'Bạn đang dồn quá nhiều tâm sức vào vấn đề này — coi chừng hao tổn.';
  } else if (PRODUCES[targetEl] === userEl) {
    relationship = 'target_produces_user';
    summary = 'Hoàn cảnh đang thuận lợi, có lực đẩy từ bên ngoài hỗ trợ bạn.';
  } else {
    relationship = 'neutral';
    summary = 'Không có tương tác trực tiếp giữa nội lực và hoàn cảnh.';
  }

  const userLabel = `${userEl} (cung ${userPalaceNum} ${PALACE_META[userPalaceNum]?.name})`;
  const targetLabel = `${targetEl} (cung ${targetPalaceNum} ${PALACE_META[targetPalaceNum]?.name})`;
  const relWord = relationship.includes('controls') ? 'khắc'
    : relationship.includes('produces') ? 'sinh' : 'đồng hành';

  return {
    relationship,
    userElement: userEl,
    targetElement: targetEl,
    stemElement: stemEl,
    summary,
    promptBlock: `[TƯƠNG QUAN LỰC LƯỢNG] Nhật Can ${dayStemName} tại ${userLabel} ${relWord} Dụng Thần tại ${targetLabel}. ${summary}`,
  };
}
