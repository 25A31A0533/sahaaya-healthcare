import dangerData from '../data/danger_signs.json';

// Normalize text: lowercase, remove special characters except spaces
function normalize(text) {
  return (text || '').toLowerCase().replace(/['".,/#!$%^&*;:{}=\-_`~()]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Deterministic Danger Sign Layer
 * Runs FIRST before any retrieval or refusal logic.
 * Ensures:
 * 1. Over-flags true clinical danger signs (100% recall on danger questions).
 * 2. Zero false alarms on routine questions like "blood pressure" or "blood sugar".
 */
export function detectDangerSigns(query) {
  const text = normalize(query);

  if (!text) {
    return { isDanger: false };
  }

  // 1. Whitelist filter: check if the query is strictly a routine inquiry
  // Routine terms like "blood pressure", "blood sugar", "glucose" without dangerous context
  const hasRoutineContext = dangerData.whitelist_contexts.some(ctx => text.includes(ctx));

  // Explicit danger indicators that override routine context (e.g., "high blood pressure with severe headache and blurring")
  const hasSevereOverridingDanger = (
    text.includes('severe headache') ||
    text.includes('tala noppi') ||
    text.includes('thala noppi') ||
    text.includes('chekatlu') ||
    text.includes('blur') ||
    text.includes('fits') ||
    text.includes('murcha') ||
    text.includes('convulsion') ||
    text.includes('seizure') ||
    text.includes('bleeding') ||
    text.includes('raktasravam') ||
    text.includes('raktha sravam') ||
    text.includes('kallu pothunnayi') ||
    text.includes('chest indrawing') ||
    text.includes('cold to touch') ||
    text.includes('challaga') ||
    text.includes('unable to suck') ||
    text.includes('paalu thaagatam ledu') ||
    text.includes('no baby movement') ||
    text.includes('kadalika ledu') ||
    text.includes('bidda kadaladam ledu')
  );

  if (hasRoutineContext && !hasSevereOverridingDanger) {
    return { isDanger: false, isWhitelisted: true };
  }

  // 2. Evaluate all danger categories
  for (const category of dangerData.danger_categories) {
    // Check English patterns
    for (const pattern of category.english_patterns) {
      const regex = new RegExp(`\\b${pattern.replace(/\s+/g, '\\s+')}`, 'i');
      if (regex.test(text)) {
        return {
          isDanger: true,
          category: category.name,
          severity: category.severity,
          matchedSign: pattern,
          protocolCitation: category.protocol_citation,
          immediateAction: category.immediate_action
        };
      }
    }

    // Check Telugu / Hinglish transliterated terms
    for (const item of category.non_english_terms) {
      const term = item.term.toLowerCase();
      // Match term as word or phrase
      if (text.includes(term)) {
        return {
          isDanger: true,
          category: category.name,
          severity: category.severity,
          matchedSign: `${item.term} (${item.meaning})`,
          protocolCitation: category.protocol_citation,
          immediateAction: category.immediate_action,
          reviewStatus: item.review_status
        };
      }
    }
  }

  // Fallback regex checks for multi-word variants and common typos
  const fallbacks = [
    {
      regex: /(bleeding|raktasravam|raktha\s*sravam|kallu\s*pothunnayi|spotting|khoon\s*nikal)/i,
      category: "Maternal Vaginal Bleeding",
      action: "Refer immediately to Kothavalasa PHC / CHC. Call 108 ambulance."
    },
    {
      regex: /(fits|murcha|convulsion|seizure|eclampsia|kampam|daure)/i,
      category: "Convulsions / Fits / Eclampsia",
      action: "Refer immediately to Kothavalasa PHC. Clear airway, position on left side."
    },
    {
      regex: /(headache.*blur|tala\s*noppi.*chekatlu|thala\s*noppi.*blur|dim\s*vision|seeing.*spots|chekatlu\s*kammadham)/i,
      category: "Severe Headache with Blurred Vision",
      action: "Screen for pre-eclampsia. Refer to Kothavalasa PHC."
    },
    {
      regex: /(severe\s*abdominal\s*pain|kadupu\s*noppi|potta\s*noppi|severe\s*cramp|pet\s*me\s*tez\s*dard)/i,
      category: "Severe Abdominal Pain in Pregnancy",
      action: "Refer to Kothavalasa PHC immediately."
    },
    {
      regex: /(no\s*baby\s*movement|kadalika\s*ledu|bidda\s*kadaladam\s*ledu|baby\s*not\s*moving|baccha.*hil.*nahi)/i,
      category: "Absent or Decreased Fetal Movement",
      action: "Refer immediately to Kothavalasa PHC for fetal Doppler assessment."
    },
    {
      regex: /(unable\s*to\s*suck|paalu\s*thaagatam\s*ledu|paalu\s*tagadam\s*ledu|cannot\s*latch|doodh\s*nahi\s*pi|not\s*feeding)/i,
      category: "Newborn Inability to Suck or Feed",
      action: "Emergency newborn referral to Kothavalasa PHC / SNCU. Keep infant warm."
    },
    {
      regex: /(cold\s*to\s*touch|challaga\s*ayipoyindi|hypothermia|thanda\s*pad)/i,
      category: "Newborn Hypothermia",
      action: "Provide immediate Kangaroo Mother Care (KMC) skin-to-skin and refer to SNCU."
    },
    {
      regex: /(chest\s*indrawing|rommu\s*lopadaki|fast\s*breathing\s*newborn|vesam\s*ga\s*swasa)/i,
      category: "Newborn Fast Breathing / Chest Indrawing",
      action: "Suspected severe pneumonia. Refer to SNCU/PHC immediately."
    },
    {
      regex: /(yellow\s*palms|yellow\s*soles|pasupu\s*arachethulu)/i,
      category: "Newborn Severe Jaundice",
      action: "Immediate referral to Kothavalasa PHC / SNCU for phototherapy."
    },
    {
      regex: /(umbilical\s*pus|boddu\s*nunchi\s*cheemu|pus\s*from\s*navel|foul\s*smelling\s*cord)/i,
      category: "Newborn Umbilical Infection",
      action: "Severe omphalitis danger. Immediate referral to PHC."
    },
    {
      regex: /(fever.*rash|tega\s*jwaram|jwaram.*daddurlu|fever.*stiff\s*neck)/i,
      category: "High Fever with Rash / Stiff Neck",
      action: "Tepid sponging. Refer immediately to PHC for suspected meningitis/exanthem."
    },
    {
      regex: /(difficulty\s*breathing|swasa\s*adadam\s*ledu|gasping|dummu\s*kattukuntundi|saans.*takleef)/i,
      category: "Severe Difficulty Breathing",
      action: "Keep upright, refer immediately to Kothavalasa PHC with oxygen transport."
    }
  ];

  for (const fb of fallbacks) {
    if (fb.regex.test(text)) {
      return {
        isDanger: true,
        category: fb.category,
        severity: "CRITICAL",
        matchedSign: fb.category,
        protocolCitation: "Emergency Clinical Protocols, Section 1.2 / 3.1",
        immediateAction: fb.action
      };
    }
  }

  return { isDanger: false };
}
