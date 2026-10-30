import { detectDangerSigns } from './dangerDetector';
import { defaultRetriever } from './bm25';
import outOfScopeData from '../data/out_of_scope.json';
import { t } from './i18n';

// Query latency tracking
let lastQueryDurationMs = 0;
let queryHistoryDurations = [];

/**
 * Recognizes conversational greetings, polite pleasantries, identity, and help queries.
 */
function detectSmallTalk(query) {
  const text = (query || '').toLowerCase().trim();

  // Greetings
  if (
    /^(hi|hello|hey|namaste|namaskaram|good\s*morning|good\s*afternoon|good\s*evening)(\s+[a-z]+)?$/i.test(text) ||
    /^(నమస్తే|నమస్కారం|బాగున్నారా|హలో)$/i.test(text)
  ) {
    return 'greeting';
  }

  // Thanks
  if (
    /\b(thanks?|thank\s*you|thx)\b/i.test(text) ||
    /(ధన్యవాదాలు|థాంక్స్)/i.test(text)
  ) {
    return 'thanks';
  }

  // Bye
  if (
    /\b(bye|goodbye|see\s*you|tata)\b/i.test(text) ||
    /(వెళ్ళొస్తాను|బై)/i.test(text)
  ) {
    return 'bye';
  }

  // Identity: "who are you"
  if (
    /\b(who\s*are\s*you|what\s*is\s*your\s*name|who\s*made\s*you)\b/i.test(text) ||
    /(నువ్వు ఎవరు|మీరు ఎవరు)/i.test(text)
  ) {
    return 'identity';
  }

  // Capabilities: "what can you do"
  if (
    /\b(what\s*can\s*you\s*do|features|how\s*can\s*you\s*help)\b/i.test(text) ||
    /(నువ్వు ఏం చేయగలవు|ఏమి చేయగలరు)/i.test(text)
  ) {
    return 'capabilities';
  }

  // Help
  if (
    /^(help|guide\s*me|assist\s*me)$/i.test(text) ||
    /^(సహాయం|హెల్ప్)$/i.test(text)
  ) {
    return 'help';
  }

  return null;
}

/**
 * Checks if query explicitly asks for clinical actions outside ASHA protocols:
 * - Pharmaceutical prescriptions / milligram dosages
 * - Antibiotic selection
 * - Surgical procedures
 * - Definitive medical diagnosis
 * - Off-topic non-clinical subjects
 */
function isOutOfScope(query) {
  const text = (query || '').toLowerCase();

  // Explicit prescription / dosage / diagnosis patterns
  const refusalPatterns = [
    /\b(dose|dosage|how\s*many\s*mg|mg\s*of|syrup\s*for|capsules?|tablets?|injections?)\b/i,
    /\b(prescribe|prescription|antibiotic|amoxicillin|ciprofloxacin|metformin|diclofenac|steroid)\b/i,
    /\b(diagnose|tumor|carcinoma|cancer|chemotherapy|malignant|benign|melanoma)\b/i,
    /\b(surgery|surgical|episiotomy|operation)\b/i,
    /\b(motorcycle|stock|invest|repair|crypto|bitcoin)\b/i
  ];

  for (const pattern of refusalPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }

  // Exact match against out-of-scope sample questions
  const isSampleOutOfScope = outOfScopeData.some(item => 
    text.includes(item.question.toLowerCase().slice(0, 30))
  );

  return isSampleOutOfScope;
}

/**
 * OPTIONAL FUTURE LOCAL SLM HOOK
 * Status: INACTIVE (Uses deterministic BM25 extraction)
 * Engine: CPU rule-based / In-browser BM25 index
 */
export function generateWordingWithLocalLLM(section, _userQuery) {
  return section.text;
}

/**
 * Core Clinical Decision Engine
 * Strict deterministic execution order:
 * 1. Danger Sign Layer (runs first)
 * 2. Small Talk / Greetings Layer
 * 3. Out-of-Scope / Refusal Check
 * 4. BM25 Protocol Retrieval
 * 5. Pluggable Local SLM Wording
 */
export async function askClinicalAssistant(query) {
  const startTime = performance.now();

  try {
    // Stage 1: Deterministic Danger Sign Layer (Always runs first)
    const dangerResult = detectDangerSigns(query);
    if (dangerResult.isDanger) {
      const durationMs = Math.round(performance.now() - startTime);
      recordDuration(durationMs);

      return {
        type: 'danger',
        isDanger: true,
        category: dangerResult.category,
        severity: dangerResult.severity || 'CRITICAL',
        matchedSign: dangerResult.matchedSign,
        protocolCitation: dangerResult.protocolCitation,
        immediateAction: dangerResult.immediateAction,
        message: dangerResult.immediateAction,
        referralTarget: "Kothavalasa PHC / Nearest CHC (Call 108)",
        durationMs,
        source: dangerResult.protocolCitation
      };
    }

    // Stage 2: Small Talk & Polite Pleasantries
    const smallTalkIntent = detectSmallTalk(query);
    if (smallTalkIntent) {
      const durationMs = Math.round(performance.now() - startTime);
      recordDuration(durationMs);

      const messageKey = `smalltalk_${smallTalkIntent}`;
      return {
        type: 'smalltalk',
        intent: smallTalkIntent,
        messageKey,
        message: t(messageKey),
        chips: [
          t('chip_anc_milestones'),
          t('chip_ors_diarrhea'),
          t('chip_bp_lifestyle'),
          t('chip_10week_vaccines')
        ],
        durationMs
      };
    }

    // Stage 3: Out of Scope & Prescription Refusal Check
    if (isOutOfScope(query)) {
      const durationMs = Math.round(performance.now() - startTime);
      recordDuration(durationMs);

      return {
        type: 'refusal',
        isRefusal: true,
        messageKey: 'outside_scope_message',
        message: t('outside_scope_message'),
        referralTarget: "Kothavalasa PHC Medical Officer",
        durationMs,
        source: "Primary Care Scope & Safety Protocol, Section 7.1"
      };
    }

    // Stage 4: In-Browser BM25 Retrieval
    const searchResults = defaultRetriever.search(query, 1);

    if (!searchResults || searchResults.length === 0 || searchResults[0].score < 1.0) {
      const durationMs = Math.round(performance.now() - startTime);
      recordDuration(durationMs);

      return {
        type: 'refusal',
        isRefusal: true,
        messageKey: 'outside_scope_message',
        message: t('outside_scope_message'),
        referralTarget: "Kothavalasa PHC",
        durationMs,
        source: "Standard Referral Protocol"
      };
    }

    const topMatch = searchResults[0].doc;

    // Stage 5: Pluggable SLM Hook (Returns exact verified excerpt)
    const wording = generateWordingWithLocalLLM(topMatch, query);

    const durationMs = Math.round(performance.now() - startTime);
    recordDuration(durationMs);

    return {
      type: 'answer',
      title: topMatch.title,
      text: wording,
      sampleNotice: topMatch.sample_notice,
      docName: topMatch.doc,
      docSection: topMatch.section,
      citation: `${t('source_citation')}: ${topMatch.doc}, ${t('section')} ${topMatch.section}`,
      score: searchResults[0].score,
      durationMs
    };
  } catch (_err) {
    const durationMs = Math.round(performance.now() - startTime);
    recordDuration(durationMs);

    return {
      type: 'error',
      message: t('outside_scope_message'),
      durationMs
    };
  }
}

function recordDuration(ms) {
  lastQueryDurationMs = ms;
  queryHistoryDurations.push(ms);
  if (queryHistoryDurations.length > 50) {
    queryHistoryDurations.shift();
  }
}

export function getTelemetry() {
  const avg = queryHistoryDurations.length > 0
    ? Math.round(queryHistoryDurations.reduce((a, b) => a + b, 0) / queryHistoryDurations.length)
    : 0;

  return {
    lastDurationMs: lastQueryDurationMs,
    avgDurationMs: avg,
    totalQueries: queryHistoryDurations.length
  };
}
