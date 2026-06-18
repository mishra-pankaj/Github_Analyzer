const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controllers');

/**
 * POST /api/profiles/analyze
 * Analyze a new GitHub user profile
 * Body: { username: "torvalds" }
 */
router.post('/analyze', profileController.analyzeProfile);

/**
 * GET /api/profiles
 * Get all analyzed profiles
 * Query params: ?page=1
 */
router.get('/', profileController.getAllProfiles);

/**
 * GET /api/profiles/:username
 * Get detailed profile by username
 */
router.get('/:username', profileController.getProfileByUsername);

/**
 * GET /api/profiles/type/:devType
 * Get profiles by developer type (bonus)
 */
router.get('/type/:devType', profileController.getProfilesByType);

module.exports = router;