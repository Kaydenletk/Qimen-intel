const TOPIC_ALIASES = {
  'tinh-yeu': 'tinh-duyen',
  'dien-trach': 'bat-dong-san',
  'chien-luoc': 'muu-luoc',
  'gia-dinh': 'gia-dao',
};

const INVESTOR_TOPICS = new Set(['tai-van']);
const WORK_TOPICS = new Set(['su-nghiep', 'xin-viec']);

function normalizeTopicKey(topicKey = '') {
  return TOPIC_ALIASES[topicKey] || topicKey || '';
}

export function getTopicRoleLabels(topicKey = '') {
  const normalizedTopicKey = normalizeTopicKey(topicKey);

  if (INVESTOR_TOPICS.has(normalizedTopicKey)) {
    return {
      actorLabel: 'Nhà đầu tư',
      subjectLabel: 'Dự án',
    };
  }

  if (WORK_TOPICS.has(normalizedTopicKey)) {
    return {
      actorLabel: 'Người làm',
      subjectLabel: 'Nhiệm vụ',
    };
  }

  return {
    actorLabel: 'Phía bạn',
    subjectLabel: 'Phía sự việc',
  };
}

export function describeRoleStance(topicKey = '', actorIsActive = true) {
  const labels = getTopicRoleLabels(topicKey);
  const actorStance = actorIsActive ? 'Chủ động' : 'Tiếp nhận';
  const subjectStance = actorIsActive ? 'Tiếp nhận' : 'Chủ động';

  return {
    ...labels,
    actorWithStance: `${labels.actorLabel} (${actorStance})`,
    subjectWithStance: `${labels.subjectLabel} (${subjectStance})`,
    actorStance,
    subjectStance,
  };
}
