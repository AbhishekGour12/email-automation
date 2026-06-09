const express = require('express');
const multer = require('multer');
const path = require('path');
const leadController = require('../controllers/lead.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const validate = require('../middlewares/validation.middleware');
const leadValidation = require('../validations/lead.validation');

// Configure multer for file imports
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // limit 5MB
});

const router = express.Router();

// Apply auth middleware to all lead routes
router.use(authMiddleware);

// Standard CRUD
router.post('/', validate(leadValidation.createLead), leadController.createLead);
router.get('/', leadController.listLeads);
router.get('/:id', leadController.getLead);
router.put('/:id', validate(leadValidation.updateLead), leadController.updateLead);
router.delete('/:id', adminMiddleware, leadController.deleteLead);

// Bulk Import Excel/CSV
router.post('/import', upload.single('file'), leadController.importLeads);

module.exports = router;
