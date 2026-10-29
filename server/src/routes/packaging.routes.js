import { Router } from 'express';
import multer from 'multer';
import authenticate from '../middleware/auth.js';
import {
  list, getOne, create, addRound, rerunAi, close, remove,
  addRemark, updateRemark, deleteRemark, respondRemark,
  downloadFile, listRules, createRule, updateRule, deleteRule,
} from '../controllers/packaging.controller.js';

const ARTWORK_TYPES = /^(image\/(jpeg|png|webp)|application\/pdf)$/;
const INGREDIENT_TYPES = /^(image\/(jpeg|png|webp)|application\/pdf|text\/plain|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/;

// Files are kept in memory only until they are written to GridFS.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 11 },
  fileFilter: (_req, file, cb) => {
    const ok = file.fieldname === 'attachments'
      ? ARTWORK_TYPES.test(file.mimetype)
      : INGREDIENT_TYPES.test(file.mimetype);
    cb(ok ? null : Object.assign(new Error('Неподдржан тип на датотека'), { status: 400 }), ok);
  },
}).fields([{ name: 'attachments', maxCount: 10 }, { name: 'ingredientsFile', maxCount: 1 }]);

// multer's own errors (e.g. LIMIT_FILE_SIZE) carry no HTTP status.
const uploadFiles = (req, res, next) =>
  upload(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') return next(Object.assign(new Error('Датотеката е поголема од 15 MB'), { status: 400 }));
    if (err?.code === 'LIMIT_FILE_COUNT' || err?.code === 'LIMIT_UNEXPECTED_FILE') return next(Object.assign(new Error('Најмногу 10 датотеки по рунда'), { status: 400 }));
    next(err);
  });

const router = Router();
router.use(authenticate);

router.get('/rules',            listRules);
router.post('/rules',           createRule);
router.patch('/rules/:ruleId',  updateRule);
router.delete('/rules/:ruleId', deleteRule);

router.get('/',     list);
router.post('/',    uploadFiles, create);
router.get('/:id',  getOne);
router.delete('/:id', remove);

router.post('/:id/rounds', uploadFiles, addRound);
router.post('/:id/ai',     rerunAi);
router.post('/:id/close',  close);
router.get('/:id/files/:fileId', downloadFile);

router.post('/:id/remarks',                      addRemark);
router.patch('/:id/remarks/:remarkId',           updateRemark);
router.delete('/:id/remarks/:remarkId',          deleteRemark);
router.post('/:id/remarks/:remarkId/respond',    respondRemark);

export default router;
