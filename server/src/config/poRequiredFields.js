// Required-fields rubric per (targetDepartment, phase).
// The dept cannot mark an answer as "final" until every entry is filled.
// Sales can override (mark sent_to_client anyway) but the gaps stay visible.
// Edit freely — this is meant to be tuned with the actual teams.

const f = (key, label) => ({ key, label });

const COMMON_RD = [
  f('recipe_summary',     'Recipe / formulation summary'),
  f('ingredients_pct',    'Ingredients with % composition'),
  f('allergens',          'Allergens'),
  f('shelf_life',         'Shelf life'),
  f('storage_conditions', 'Storage conditions'),
];

const COMMON_QA = [
  f('nutrition_facts',    'Nutrition facts (per 100g / per serving)'),
  f('declarations',       'Declarations / regulatory notes'),
  f('certifications',     'Required certifications'),
];

const COMMON_PROC = [
  f('supplier',           'Supplier / source'),
  f('lead_time',          'Lead time'),
  f('moq_unit_cost',      'MOQ + unit cost'),
  f('availability',       'Availability confirmation'),
];

const COMMON_PACK = [
  f('dimensions',         'Pack dimensions (W x H x D)'),
  f('material',           'Material spec'),
  f('weight_per_unit',    'Weight per unit'),
  f('layers',             'Layers / structure'),
  f('print_method',       'Print method / finish'),
];

const RUBRIC = {
  r_and_d: {
    phase_1_idea: [
      f('product_concept',    'Product concept summary'),
      f('feasibility_note',   'Initial feasibility note'),
    ],
    phase_2_evaluation: COMMON_RD,
    phase_3_plan:       [...COMMON_RD, f('trial_plan', 'Lab trial plan')],
    phase_4_client_feedback: [...COMMON_RD, f('sample_status', 'Sample status')],
    phase_5_design_logistics: COMMON_RD,
    phase_6_industrial_trial: [...COMMON_RD, f('trial_results', 'Industrial trial results (min 50kg)')],
    phase_7_design_approval:  COMMON_RD,
    phase_8_production_planning: COMMON_RD,
    phase_9_production_verification: [...COMMON_RD, f('rft', 'RFT %'), f('performance_rate', 'Performance rate')],
  },

  quality_assurance: {
    phase_1_idea:              [f('regulatory_pre_check', 'Regulatory pre-check')],
    phase_2_evaluation:        COMMON_QA,
    phase_3_plan:              COMMON_QA,
    phase_4_client_feedback:   COMMON_QA,
    phase_5_design_logistics:  [...COMMON_QA, f('label_check', 'Label check vs declarations')],
    phase_6_industrial_trial:  [...COMMON_QA, f('trial_qc', 'QC results from trial')],
    phase_7_design_approval:   [...COMMON_QA, f('design_qc_signoff', 'Design QC sign-off')],
    phase_8_production_planning: COMMON_QA,
    phase_9_production_verification: [...COMMON_QA, f('production_qc', 'Production QC validation')],
  },

  nabavki: {
    phase_1_idea:              [f('raw_materials_check', 'Raw materials availability check')],
    phase_2_evaluation:        COMMON_PROC,
    phase_3_plan:              [...COMMON_PROC, f('procurement_plan', 'Procurement plan for trials')],
    phase_4_client_feedback:   COMMON_PROC,
    phase_5_design_logistics:  [...COMMON_PROC, f('logistics_plan', 'Logistics plan')],
    phase_6_industrial_trial:  COMMON_PROC,
    phase_7_design_approval:   COMMON_PROC,
    phase_8_production_planning: [...COMMON_PROC, f('volume_plan', 'Volume + delivery schedule')],
    phase_9_production_verification: COMMON_PROC,
  },

  packaging: {
    phase_1_idea:              [f('packaging_concept', 'Packaging concept')],
    phase_2_evaluation:        COMMON_PACK,
    phase_3_plan:              COMMON_PACK,
    phase_4_client_feedback:   [...COMMON_PACK, f('client_preferences', 'Client preferences captured')],
    phase_5_design_logistics:  [...COMMON_PACK, f('foil_spec', 'Foil / display / box spec'), f('layout', 'Layout file')],
    phase_6_industrial_trial:  COMMON_PACK,
    phase_7_design_approval:   [...COMMON_PACK, f('pdf_proof', 'PDF proof'), f('design_signoff', 'Design sign-off')],
    phase_8_production_planning: COMMON_PACK,
    phase_9_production_verification: COMMON_PACK,
  },
};

export const getRequiredFields = (targetDepartment, phase) => {
  const deptRubric = RUBRIC[targetDepartment] || {};
  const list = deptRubric[phase] || [];
  return list.map(({ key, label }) => ({ key, label, filled: false }));
};

export default RUBRIC;
