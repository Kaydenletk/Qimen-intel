import {
  TOPIC_DUNG_THAN_MAP,
  normalizeBoardData,
  findTopicDungThanPalace,
  buildDungThanBoardText as buildTopicDungThanBoardText,
  resolveDungThanMarker,
} from '../kimon/dungThanHelper.js';

export { TOPIC_DUNG_THAN_MAP, normalizeBoardData };

export function findDungThanPalace(topic = '', boardData = {}) {
  return findTopicDungThanPalace(topic, boardData);
}

export function buildDungThanBoardText(topic = '', boardData = {}) {
  return buildTopicDungThanBoardText({ topic, boardData });
}

export function buildCanonicalDungThanMarker(topic = '', boardData = {}) {
  return resolveDungThanMarker({ topic, boardData });
}
