// Pure-functional LHC evaluator.
// Given (question, answer) → returns { isCorrect, fraction, weight, sanctionLevel }.
// `fraction` is what proportion of weight the answer earned (0..1) — useful
// for partial-credit answer types like yes_partial_no and multi_check.

const isAnswerEmpty = (answer) => answer === null || answer === undefined || answer === '';

const evalSingleQuestion = (question, answer) => {
  if (isAnswerEmpty(answer)) {
    return { isCorrect: null, fraction: 0, applicable: false };
  }
  // Not applicable answers ("na", "not_applicable") drop the question entirely.
  if (answer === 'na' || answer === 'not_applicable') {
    return { isCorrect: null, fraction: 0, applicable: false };
  }

  const correct = question.correctAnswer;

  switch (question.type) {
    case 'choice': {
      // Partial credit when optionScores is provided (maturity / risk scales)
      if (question.optionScores && typeof question.optionScores === 'object') {
        const raw = question.optionScores[String(answer)];
        const fraction = typeof raw === 'number' ? Math.max(0, Math.min(1, raw)) : 0;
        return { isCorrect: fraction === 1, fraction, applicable: true };
      }
      const isCorrect = String(answer) === String(correct);
      return { isCorrect, fraction: isCorrect ? 1 : 0, applicable: true };
    }
    case 'yes_no':
    case 'yes_no_na':
    case 'true_false': {
      const isCorrect = String(answer) === String(correct);
      return { isCorrect, fraction: isCorrect ? 1 : 0, applicable: true };
    }
    case 'yes_partial_no': {
      // "partial" earns half credit. correct is the ideal answer; opposite earns 0.
      if (answer === correct) return { isCorrect: true, fraction: 1, applicable: true };
      if (answer === 'partial') return { isCorrect: false, fraction: 0.5, applicable: true };
      return { isCorrect: false, fraction: 0, applicable: true };
    }
    case 'multi_check': {
      // Answer is an object { optionId: bool, ... } or array of selected option values.
      // Score = checked / total. (Each option treated as desired-checked unless
      // the question carries a more nuanced model — we keep simple.)
      const opts = question.options || [];
      if (!opts.length) return { isCorrect: null, fraction: 0, applicable: false };
      let checked = 0;
      if (Array.isArray(answer)) {
        checked = answer.length;
      } else if (answer && typeof answer === 'object') {
        checked = Object.values(answer).filter(Boolean).length;
      }
      const fraction = Math.min(1, checked / opts.length);
      return { isCorrect: fraction === 1, fraction, applicable: true };
    }
    default:
      return { isCorrect: null, fraction: 0, applicable: false };
  }
};

// Evaluate an array of (question, answer) pairs and return aggregates.
// answersMap: { qid: answer }
// questionsByQid: Map<qid, questionDoc>
export const evaluateAssignment = (answersMap, questionsByQid) => {
  let score = 0;
  let maxScore = 0;
  let violations = 0;
  const categoryBreakdown = {}; // by category key
  const perAnswer = []; // [{ qid, isCorrect, weight, sanctionLevel }]

  for (const [qid, q] of questionsByQid) {
    const ans = answersMap[qid];
    const result = evalSingleQuestion(q, ans);

    if (!result.applicable) {
      // Non-applicable: skip entirely (does not affect max).
      continue;
    }

    const w = typeof q.weight === 'number' ? q.weight : 1;
    const earned = w * result.fraction;
    score += earned;
    maxScore += w;
    if (!result.isCorrect) violations += 1;

    const cb = (categoryBreakdown[q.category] ||= {
      score: 0, maxScore: 0, violations: 0, total: 0,
    });
    cb.score += earned;
    cb.maxScore += w;
    cb.total += 1;
    if (!result.isCorrect) cb.violations += 1;

    perAnswer.push({
      qid,
      isCorrect: result.isCorrect,
      fraction: result.fraction,
      weight: w,
      sanctionLevel: q.sanctionLevel,
    });
  }

  return { score, maxScore, violations, categoryBreakdown, perAnswer };
};

// Aggregate multiple assignments into a campaign-level summary.
// assignments: array of { score, maxScore, violations, categoryBreakdown, status }
// answers: array of { questionId, isCorrect, sanctionLevel } → for top-violation list
export const aggregateCampaign = (assignments, answers, questionsByQid) => {
  const participation = {
    invited: assignments.length,
    started: assignments.filter((a) => a.status !== 'not_started').length,
    completed: assignments.filter((a) => a.status === 'completed').length,
  };

  let totalScore = 0;
  let totalMax = 0;
  const cb = {};

  for (const a of assignments) {
    if (a.status !== 'completed') continue;
    totalScore += a.score || 0;
    totalMax += a.maxScore || 0;
    for (const [cat, b] of Object.entries(a.categoryBreakdown || {})) {
      const acc = (cb[cat] ||= { score: 0, maxScore: 0, violations: 0 });
      acc.score += b.score || 0;
      acc.maxScore += b.maxScore || 0;
      acc.violations += b.violations || 0;
    }
  }

  // Top violations: count per question how many users got it wrong.
  const violationCounts = {};
  for (const ans of answers) {
    if (ans.isCorrect === false) {
      violationCounts[ans.questionId] = (violationCounts[ans.questionId] || 0) + 1;
    }
  }
  const SEVERITY_RANK = { high: 3, medium: 2, low: 1, none: 0 };
  const topViolations = Object.entries(violationCounts)
    .map(([qid, count]) => {
      const q = questionsByQid.get(qid);
      return q
        ? {
            qid,
            count,
            text: q.text,
            article: q.article,
            category: q.category,
            sanctionLevel: q.sanctionLevel,
            recommendation: q.recommendation,
          }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) =>
      (SEVERITY_RANK[b.sanctionLevel] - SEVERITY_RANK[a.sanctionLevel]) || (b.count - a.count)
    )
    .slice(0, 20);

  return {
    participation,
    overallScore: totalScore,
    overallMaxScore: totalMax,
    overallPercent: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : null,
    categoryBreakdown: cb,
    topViolations,
  };
};
