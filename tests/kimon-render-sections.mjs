import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const serverSource = readFileSync(new URL('../server.js', import.meta.url), 'utf8');

assert.match(serverSource, /data-display-palaces=/, 'Kimon payload phải embed displayPalaces để lookup cung giờ và trực sử');
assert.match(serverSource, /const resolvePalaceSignals = palaceNum =>/, 'getBaseQmdjData phải có lookup fallback từ palace grid');

assert.match(serverSource, /function formatKimonRichText\(/, 'Renderer phải có formatter cho markdown nhẹ');
assert.ok(serverSource.includes("normalized = normalized.split('\\\\\\\\r\\\\\\\\n').join('\\\\n');"), 'Formatter phải quy đổi literal CRLF escaped thành xuống dòng thật');
assert.ok(serverSource.includes("normalized = normalized.split('\\\\\\\\n').join('\\\\n');"), 'Formatter phải quy đổi literal newline escaped thành xuống dòng thật');
assert.ok(serverSource.includes("return formatted.split('\\\\n').join('<br>');"), 'Formatter phải chuyển newline thành <br> an toàn');
assert.match(serverSource, /else if \(ch === '\\\\''\) escaped \+= '&#39;';/, 'escapeHTML trong script browser phải escape dấu nháy đơn đúng cách');

assert.match(serverSource, /<div class="kimon-message kimon-message-ai kimon-greeting">/, 'Greeting phải được render sẵn trong HTML');
assert.match(serverSource, /<form id="kimonChatForm" class="kimon-input-area" novalidate autocomplete="off">/, 'Chat form phải là form sạch, không inline submit logic');
assert.doesNotMatch(serverSource, /<form id="kimonChatForm"[\s\S]*onsubmit=/, 'Chat form không được còn inline onsubmit chắp vá');
assert.match(serverSource, /<button id="kimonBtn" class="kimon-send-btn" title="Gửi" type="submit">/, 'Nút gửi phải là submit button');

assert.match(serverSource, /const kimonForm = document\.getElementById\('kimonChatForm'\);/, 'Frontend phải bind trực tiếp form chat');
assert.match(serverSource, /function handleKymonSend\(event\)/, 'Phải có một submit handler duy nhất cho chat');
assert.match(serverSource, /if \(kimonForm\) \{\s*kimonForm\.addEventListener\('submit', handleKymonSend\);\s*\}/, 'Form submit phải là entry point duy nhất');
assert.doesNotMatch(serverSource, /window\.__kymonSend = handleKymonSend;/, 'Không nên còn expose send handler toàn cục kiểu cũ');
assert.doesNotMatch(serverSource, /document\.addEventListener\('click', event => \{[\s\S]*#kimonBtn/, 'Không nên còn delegated click listener cho nút gửi');
assert.doesNotMatch(serverSource, /document\.addEventListener\('keydown', event => \{[\s\S]*kimonContext/, 'Không nên còn delegated keydown listener cho Enter');

assert.match(serverSource, /let isKimonFetching = false;/, 'Phải có state pending chung cho Kymon');
assert.match(serverSource, /let activeKimonAbortController = null;/, 'Phải lưu active AbortController');
assert.match(serverSource, /let activeKimonRequestId = 0;/, 'Phải có request id để chống stale cleanup');
assert.match(serverSource, /let activeKimonRequestSource = '';/, 'Phải track source của request đang chạy');
assert.match(serverSource, /let activeKimonTypingSession = null;/, 'Phải có typing session state duy nhất');
assert.match(serverSource, /const KYMON_PARTIAL_LEAD = \$\{JSON\.stringify\(KYMON_PARTIAL_LEAD\)\};/, 'Client script phải inject fallback lead từ server');
assert.match(serverSource, /const KYMON_PARTIAL_ACTION = \$\{JSON\.stringify\(KYMON_PARTIAL_ACTION\)\};/, 'Client script phải inject fallback action từ server');
assert.match(serverSource, /const KYMON_REQUEST_TIMEOUT_MS = 45000;/, 'Phải có hard timeout rõ ràng cho Kymon');
assert.match(serverSource, /const TYPEWRITER_CHUNK_SIZE = 3;/, 'Typewriter phải reveal theo chunk 3 ký tự');
assert.match(serverSource, /const TYPEWRITER_TICK_MS = 18;/, 'Typewriter phải dùng interval mượt, không quá chậm');
assert.match(serverSource, /const TYPEWRITER_SECTION_PAUSE_MS = 110;/, 'Typewriter phải có pause ngắn giữa các section');
assert.match(serverSource, /const TYPEWRITER_SCROLL_EVERY_TICKS = 4;/, 'Typewriter phải throttle scroll thay vì scroll mỗi tick');
assert.match(serverSource, /function beginKimonRequest\(source\)/, 'Phải có request owner helper');
assert.match(serverSource, /function finalizeKimonRequest\(ctx\)/, 'Phải có cleanup helper bảo vệ finally');
assert.match(serverSource, /function abortActiveKimonRequest\(reason = 'superseded'\)/, 'Phải có helper abort request đang chạy');
assert.match(serverSource, /setTimeout\(\(\) => \{[\s\S]*controller\.abort\(\);[\s\S]*\}, KYMON_REQUEST_TIMEOUT_MS\);/, 'Hard timeout phải abort request hiện hành');
assert.match(serverSource, /logKimonDebug\('request timeout'/, 'Timeout phải có debug log');
assert.match(serverSource, /logKimonDebug\('request abort'/, 'Abort phải có debug log');
assert.match(serverSource, /logKimonDebug\('finally cleanup hit'/, 'Cleanup phải có debug log');
assert.match(serverSource, /logKimonDebug\('render start'/, 'Render phải có debug log bắt đầu');
assert.match(serverSource, /logKimonDebug\('render end'/, 'Render phải có debug log kết thúc');

assert.match(serverSource, /async function sendKymonRequest\(\{ qmdjData, userContext, signal \}\)/, 'Phải có một request helper duy nhất cho Kymon chat');
assert.match(serverSource, /fetch\('\/api\/kimon', \{/, 'Kymon chat phải gọi non-stream JSON route');
assert.match(serverSource, /const responseText = await res\.text\(\);/, 'Request helper phải đọc raw text để tự parse an toàn');
assert.match(serverSource, /const parsed = parseKimonResponseText\(responseText\);/, 'Request helper phải parse raw response an toàn');
assert.match(serverSource, /const normalized = normalizeKimonUiPayload\(parsed\);/, 'Request helper phải normalize schema trước khi render');
assert.match(serverSource, /function normalizeKimonUiPayload\(rawData\)/, 'Frontend phải validate và normalize schema response');
assert.match(serverSource, /message:\s*messageParts\.join\('\\\\n\\\\n'\) \|\| rawData\.tongQuan\.trim\(\),/, 'Deep-dive legacy fallback trong client script phải escape newline đúng để không phá inline JS');
assert.match(serverSource, /function extractFirstJsonBlockText\(rawText\)/, 'Frontend phải có helper balanced-brace extraction');
assert.match(serverSource, /console\.warn\('\[Kymon\] Frontend parse direct failed:'/,'Frontend phải log parse fail để debug');
assert.match(serverSource, /logKimonDebug\('response received', \{\s*status: res\.status,\s*responseLength: responseText\.length,\s*\}\);/, 'Frontend nên log response length để debug truncation');
assert.match(serverSource, /function createEmergencyKimonPayload\(rawText\) \{[\s\S]*mode: 'interpretation'[\s\S]*lead: KYMON_PARTIAL_LEAD[\s\S]*message: structured[\s\S]*closingLine: KYMON_PARTIAL_ACTION/s, 'Fallback UI phải là payload sạch theo schema mới');
assert.doesNotMatch(serverSource, /function extractLooseStringField\(rawText, key\)/, 'Frontend không nên salvage field lẻ từ raw text bị gãy');
assert.doesNotMatch(serverSource, /async function callKimonJsonFallback\(/, 'Không nên còn helper request cũ tên fallback trong active chat path');
assert.doesNotMatch(serverSource, /async function callKimonStream\(/, 'Frontend Kymon không nên còn helper stream');
assert.doesNotMatch(serverSource, /rawStreamText/, 'Frontend không nên còn buffer chunk stream');
assert.doesNotMatch(serverSource, /cleanAiResponse\(/, 'Frontend không nên còn parser chunk cũ');

assert.match(serverSource, /if \(isKimonFetching && activeKimonRequestSource === 'manual'\) \{[\s\S]*showKimonError\('Kymon đang trả lời câu trước\. Đợi một nhịp rồi gửi tiếp\.'/, 'Repeated manual sends phải bị chặn sạch');
assert.match(serverSource, /if \(isKimonFetching && activeKimonRequestSource === 'auto'\) \{[\s\S]*abortActiveKimonRequest\('manual superseded autoload'\);/, 'Manual submit phải abort auto-load đang chạy');
assert.match(serverSource, /showThinking\(source\);/, 'Request owner phải bật thinking state');
assert.match(serverSource, /hideThinking\(\);/, 'Cleanup phải luôn tắt thinking state');
assert.match(serverSource, /setKimonInteractiveState\(\{ pending: true, source \}\);/, 'Request owner phải khóa UI đúng nhịp');
assert.match(serverSource, /setKimonInteractiveState\(\{ pending: false, source: ctx\.source \}\);/, 'Cleanup phải mở khóa UI đúng nhịp');

assert.match(serverSource, /function appendKimonResponseBubble\(data\)/, 'Response final phải render qua helper duy nhất');
assert.match(serverSource, /function appendKimonErrorBubble\(message\)/, 'Error final phải render qua helper duy nhất');
assert.match(serverSource, /appendKimonResponseBubble\(data\);/, 'Active chat path phải render response final đúng một lần');
assert.match(serverSource, /appendKimonErrorBubble\(errMsg\);/, 'Lỗi phải hiện lên UI sạch');

assert.match(serverSource, /function renderParsedSections\(container, data\) \{[\s\S]*container\.className = 'kymon-clean-layout';/, 'Renderer phải dùng clean layout');
assert.match(serverSource, /const fragment = document\.createDocumentFragment\(\);/, 'Renderer nên dùng fragment để giảm DOM churn');
assert.match(serverSource, /container\.replaceChildren\(fragment\);/, 'Renderer phải replace content một lần');
assert.match(serverSource, /function buildTypewriterRichTextFragment\(rawText\)/, 'Renderer phải prebuild rich-text fragment cho typewriter');
assert.match(serverSource, /function createTypewriterSectionEntry\(className, rawText, options = \{\}\)/, 'Renderer phải dựng section typewriter riêng');
assert.match(serverSource, /function revealTypewriterSectionChunk\(section, chunkSize = TYPEWRITER_CHUNK_SIZE\)/, 'Typewriter phải reveal theo chunk, không từng ký tự');
assert.match(serverSource, /function cancelActiveKimonTypingSession\(\{ finalize = true, reason = 'superseded' \} = \{\}\)/, 'Phải có helper hủy typewriter session cũ');
assert.match(serverSource, /function startKimonTypewriterSession\(container, sections\)/, 'Phải có helper start typewriter session');
assert.match(serverSource, /const leadText = data\?\.lead \|\| data\?\.summary \|\| data\?\.quickTake \|\| '';/, 'Renderer phải ưu tiên lead');
assert.match(serverSource, /const timeHintText = data\?\.timeHint \|\| '';/, 'Renderer phải render timeHint riêng');
assert.match(serverSource, /const messageText = data\?\.message \|\| data\?\.analysis \|\| '';/, 'Renderer phải render message riêng');
assert.match(serverSource, /const closingText = data\?\.closingLine \|\| data\?\.action \|\| '';/, 'Renderer phải render closingLine riêng');
assert.match(serverSource, /const analysisEntry = createTypewriterSectionEntry\('kymon-analysis-flow', messageText\);/, 'Message phải vào class phân tích dài và đi qua typewriter section');
assert.match(serverSource, /cancelActiveKimonTypingSession\(\{ finalize: true, reason: 'new render' \}\);/, 'Render mới phải hủy session gõ cũ trước khi bắt đầu');
assert.match(serverSource, /activeKimonTypingSession = startKimonTypewriterSession\(container, typewriterSections\);/, 'Render phải khởi động buffered typewriter trên final payload');
assert.match(serverSource, /scheduleNextTick\(TYPEWRITER_TICK_MS\);/, 'Typewriter phải chạy theo tick cố định');
assert.match(serverSource, /scheduleNextTick\(TYPEWRITER_SECTION_PAUSE_MS\);/, 'Typewriter phải nghỉ ngắn giữa các section');
assert.match(serverSource, /if \(session\.tickCount % TYPEWRITER_SCROLL_EVERY_TICKS === 0\) \{\s*smartScroll\(\);/s, 'Typewriter phải throttle scroll, không scroll mọi tick');
assert.match(serverSource, /smartScroll\(\);/, 'Renderer phải smartScroll sau render');
assert.doesNotMatch(serverSource, /typing-cursor/, 'Không nên còn typewriter cursor CSS');
assert.doesNotMatch(serverSource, /kimon-stream-live/, 'Không nên còn streaming cursor CSS');

assert.match(serverSource, /\.kymon-clean-layout \{/, 'Phải có clean layout container style');
assert.match(serverSource, /\.kymon-lead \{/, 'Lead phải có style riêng');
assert.match(serverSource, /\.kymon-time-hint \{/, 'Time hint phải có style riêng');
assert.match(serverSource, /\.kymon-analysis-flow \{/, 'Analysis flow phải có style riêng');
assert.match(serverSource, /\.kymon-action-footer \{/, 'Closing/action footer phải có style riêng');

assert.match(serverSource, /const PREVIOUS_KYMON_MAX_OUTPUT_TOKENS = 3072;/, 'Phải giữ dấu vết giá trị token cũ để debug');
assert.match(serverSource, /const KYMON_MAX_OUTPUT_TOKENS = 5120;/, 'Backend Kymon phải tăng output length để giảm truncation');
assert.match(serverSource, /maxOutputTokens: maxTokens/, 'Backend phải dùng dynamic maxTokens từ tiered router');
assert.match(serverSource, /function logKimonModelMeta\(route, response, rawText = ''\)/, 'Backend phải log finish reason và raw response length');
assert.match(serverSource, /logKimonModelMeta\('\/api\/kimon', result\.response, rawText\);/, 'Route non-stream phải log meta model');
assert.match(serverSource, /logKimonModelMeta\('\/api\/kimon\/stream', finalResponse, fullText\);/, 'Route stream phải log meta model');
assert.match(serverSource, /import \{ parseKimonJsonResponse, toKimonResponseSchema \} from '\.\/src\/logic\/kimon\/jsonResponse\.js';/, 'Server phải import helper schema public mới');
assert.match(serverSource, /import \{ [^}]*detectTopicHybrid[^}]*\} from '\.\/src\/logic\/kimon\/detectTopic\.js';/, 'Server phải import detectTopicHybrid từ detectTopic.js');
assert.match(serverSource, /import \{ selectModel, buildPromptByTier \} from '\.\/src\/logic\/kimon\/modelRouter\.js';/, 'Server phải import tiered router');
assert.match(serverSource, /toKimonResponseSchema\(parseKimonJsonResponse\(rawText\), rawText\)/, 'Route non-stream phải trả về đúng schema mới');
assert.match(serverSource, /toKimonResponseSchema\(parseKimonJsonResponse\(fullText\), fullText\)/, 'Route stream phải shape parsed payload về schema mới');
assert.match(serverSource, /const fallback = toKimonResponseSchema\(parseKimonJsonResponse\(fullText\), fullText\);/, 'Fallback route stream cũng phải giữ schema mới');

console.log('ASSERTIONS: OK');
