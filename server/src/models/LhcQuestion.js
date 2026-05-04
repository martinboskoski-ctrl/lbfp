import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    value:   { type: String, required: true },
    label:   { type: String, required: true },
    labelEn: { type: String, default: '' },
  },
  { _id: false }
);

const lhcQuestionSchema = new mongoose.Schema(
  {
    qid:          { type: String, required: true, unique: true, index: true }, // e.g. "labour_q4"
    category:     { type: String, required: true, index: true },               // FK by key to LhcCategory
    subCategory:  { type: String, trim: true },                                // e.g. "recruitment"
    text:         { type: String, required: true, trim: true },
    textEn:       { type: String, default: '' },
    article:      { type: String, trim: true },
    articleEn:    { type: String, default: '' },
    type: {
      type: String,
      enum: ['yes_no', 'yes_no_na', 'yes_partial_no', 'choice', 'multi_check', 'true_false'],
      required: true,
    },
    options:        [optionSchema],
    // Map { optionValue → fraction (0..1) } for partial-credit choice questions.
    // When present, the evaluator uses this instead of strict equality with
    // correctAnswer. Designed for maturity-style scoring (A/B/C/D, 0-100).
    optionScores:   { type: mongoose.Schema.Types.Mixed, default: null },
    correctAnswer:  { type: mongoose.Schema.Types.Mixed, default: null },
    weight:         { type: Number, default: 1 },
    sanctionLevel:  {
      type: String,
      enum: ['high', 'medium', 'low', 'none'],
      default: 'none',
    },
    recommendation:   { type: String, trim: true },
    recommendationEn: { type: String, default: '' },
    sourceMeta:     { type: mongoose.Schema.Types.Mixed, default: {} }, // free-form snapshot from importer
    active:         { type: Boolean, default: true },
  },
  { timestamps: true }
);

lhcQuestionSchema.index({ category: 1, active: 1 });

export default mongoose.model('LhcQuestion', lhcQuestionSchema);
