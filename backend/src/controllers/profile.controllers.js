const Profile = require('../models/Profile.models');
const { fetchUserProfile } = require('../services/githubService');

/**
 * POST /api/profiles/analyze
 * Analyze a GitHub user profile
 */
exports.analyzeProfile = async (req, res, next) => {
  try {
    const { username } = req.body;

    // Validate input
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Username is required and must be a string'
      });
    }

    const cleanUsername = username.trim();

    // Validate username format (GitHub usernames rules)
    if (!/^[a-zA-Z0-9-]{1,39}$/.test(cleanUsername)) {
      return res.status(400).json({
        error: 'Invalid username',
        message: 'GitHub usernames must contain only letters, numbers, and hyphens'
      });
    }

    // Fetch from GitHub
    console.log(`🔍 Fetching GitHub data for: ${cleanUsername}`);
    const profileData = await fetchUserProfile(cleanUsername);

    // Store in database
    console.log(`💾 Storing profile in database...`);
    const profileId = await Profile.create(profileData);

    return res.status(201).json({
      message: 'Profile analyzed successfully',
      profileId,
      data: profileData
    });
  } catch (error) {
    console.error('❌ Error in analyzeProfile:', error.message);

    // Handle specific errors
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'User not found',
        message: error.message
      });
    }

    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: error.message
      });
    }

    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};

/**
 * GET /api/profiles
 * Get all analyzed profiles with pagination
 */
exports.getAllProfiles = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 10;
    const offset = (page - 1) * limit;

    console.log(`📋 Fetching profiles - page ${page}`);

    const profiles = await Profile.findAll(limit, offset);
    const total = await Profile.getCount();
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      message: 'Profiles retrieved successfully',
      data: profiles,
      pagination: {
        total,
        current_page: page,
        per_page: limit,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error in getAllProfiles:', error.message);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};

/**
 * GET /api/profiles/:username
 * Get detailed analysis of a single profile
 */
exports.getProfileByUsername = async (req, res, next) => {
  try {
    const { username } = req.params;

    // Validate username
    if (!username || username.trim() === '') {
      return res.status(400).json({
        error: 'Invalid username',
        message: 'Username parameter is required'
      });
    }

    console.log(`🔍 Fetching profile: ${username}`);

    const profile = await Profile.findByUsername(username);

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: `No analysis found for username: ${username}. Try POST /api/profiles/analyze first.`
      });
    }

    // Parse JSON fields
    const responseData = {
      ...profile,
      languages_used: profile.languages_used ? JSON.parse(profile.languages_used) : []
    };

    return res.status(200).json({
      message: 'Profile retrieved successfully',
      data: responseData
    });
  } catch (error) {
    console.error('❌ Error in getProfileByUsername:', error.message);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};

/**
 * GET /api/profiles/type/:devType
 * Get profiles by developer type (bonus endpoint)
 */
exports.getProfilesByType = async (req, res, next) => {
  try {
    const { devType } = req.params;

    console.log(`🔍 Fetching profiles by type: ${devType}`);

    const profiles = await Profile.findByDeveloperType(devType);

    if (profiles.length === 0) {
      return res.status(404).json({
        error: 'No profiles found',
        message: `No profiles found for developer type: ${devType}`
      });
    }

    return res.status(200).json({
      message: `Found ${profiles.length} profile(s)`,
      count: profiles.length,
      data: profiles
    });
  } catch (error) {
    console.error('❌ Error in getProfilesByType:', error.message);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};