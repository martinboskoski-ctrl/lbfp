import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import {
  listCategories,
  listQuestions,
  getOverview,
  createCampaign,
  updateCampaign,
  getCampaign,
  openCampaign,
  closeCampaign,
  reopenCampaign,
  archiveCampaign,
  deleteCampaign,
  getMyAssignment,
  saveAnswer,
  submitAssignment,
  getMyResult,
  getCampaignResults,
  exportCampaignCsv,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../controllers/lhc.controller.js';

const router = Router();
router.use(authenticate);

// Read-only / overview
router.get('/categories', listCategories);
router.get('/questions',  listQuestions);
router.get('/overview',   getOverview);

// Question admin
router.post('/questions',         createQuestion);
router.patch('/questions/:qid',   updateQuestion);
router.delete('/questions/:qid',  deleteQuestion);

// Campaigns
router.post('/campaigns',                  createCampaign);
router.get('/campaigns/:id',               getCampaign);
router.patch('/campaigns/:id',             updateCampaign);
router.delete('/campaigns/:id',            deleteCampaign);
router.post('/campaigns/:id/open',         openCampaign);
router.post('/campaigns/:id/close',        closeCampaign);
router.post('/campaigns/:id/reopen',       reopenCampaign);
router.post('/campaigns/:id/archive',      archiveCampaign);
router.get('/campaigns/:id/results',       getCampaignResults);
router.get('/campaigns/:id/export.csv',    exportCampaignCsv);

// Participant
router.get('/campaigns/:id/my-assignment',         getMyAssignment);
router.put('/campaigns/:id/my-assignment/answer',  saveAnswer);
router.post('/campaigns/:id/my-assignment/submit', submitAssignment);
router.get('/campaigns/:id/my-result',             getMyResult);

export default router;
