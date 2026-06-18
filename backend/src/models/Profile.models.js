const pool = require('../config/db');

class Profile {
  /**
   * Create or update a profile with insights
   */
  static async create(profileData) {
    const connection = await pool.getConnection();
    try {
      const {
        username, avatar_url, name, bio, profile_url, company, location,
        public_repos, followers, following, public_gists,
        total_repos, total_stars, total_forks, total_watchers,
        avg_stars_per_repo, avg_forks_per_repo,
        languages, most_used_language, language_diversity,
        developer_type, years_active, seniority, created_at, updated_at
      } = profileData;

      // 1. Insert or update profile
      const [profileResult] = await connection.query(
        `INSERT INTO profiles 
         (username, avatar_url, name, bio, profile_url, company, location, public_repos, followers, following, public_gists, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         avatar_url=VALUES(avatar_url),
         name=VALUES(name),
         bio=VALUES(bio),
         profile_url=VALUES(profile_url),
         company=VALUES(company),
         location=VALUES(location),
         public_repos=VALUES(public_repos),
         followers=VALUES(followers),
         following=VALUES(following),
         public_gists=VALUES(public_gists),
         updated_at=NOW()`,
        [username, avatar_url, name, bio, profile_url, company, location,
         public_repos, followers, following, public_gists, created_at, updated_at]
      );

      // Get profile ID (either from insert or select if update)
      let profileId = profileResult.insertId;
      if (!profileId) {
        const [profile] = await connection.query(
          'SELECT id FROM profiles WHERE username = ?',
          [username]
        );
        profileId = profile[0].id;
      }

      // 2. Insert or update repository stats
      await connection.query(
        `INSERT INTO repository_stats
         (profile_id, total_repos, total_stars, total_forks, total_watchers, languages_used, most_used_language, language_diversity, avg_stars_per_repo, avg_forks_per_repo, developer_type, years_active, seniority)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         total_repos=VALUES(total_repos),
         total_stars=VALUES(total_stars),
         total_forks=VALUES(total_forks),
         total_watchers=VALUES(total_watchers),
         languages_used=VALUES(languages_used),
         most_used_language=VALUES(most_used_language),
         language_diversity=VALUES(language_diversity),
         avg_stars_per_repo=VALUES(avg_stars_per_repo),
         avg_forks_per_repo=VALUES(avg_forks_per_repo),
         developer_type=VALUES(developer_type),
         years_active=VALUES(years_active),
         seniority=VALUES(seniority),
         updated_at=NOW()`,
        [profileId, total_repos, total_stars, total_forks, total_watchers,
         JSON.stringify(languages), most_used_language, language_diversity,
         avg_stars_per_repo, avg_forks_per_repo, developer_type, years_active, seniority]
      );

      // 3. Insert analysis history record
      await connection.query(
        `INSERT INTO analysis_history (profile_id, status, analyzed_at)
         VALUES (?, ?, NOW())`,
        [profileId, 'success']
      );

      console.log(`✅ Stored profile: ${username} (ID: ${profileId})`);
      return profileId;
    } catch (error) {
      console.error('❌ Database error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Find profile by username
   */
  static async findByUsername(username) {
    const [results] = await pool.query(
      `SELECT p.*, rs.* 
       FROM profiles p
       LEFT JOIN repository_stats rs ON p.id = rs.profile_id
       WHERE p.username = ?`,
      [username]
    );
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all profiles with pagination
   */
  static async findAll(limit = 20, offset = 0) {
    const [results] = await pool.query(
      `SELECT p.*, rs.* 
       FROM profiles p
       LEFT JOIN repository_stats rs ON p.id = rs.profile_id
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );
    return results;
  }

  /**
   * Get total profile count
   */
  static async getCount() {
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) as count FROM profiles'
    );
    return count;
  }

  /**
   * Find profiles by developer type
   */
  static async findByDeveloperType(devType) {
    const [results] = await pool.query(
      `SELECT p.*, rs.* 
       FROM profiles p
       LEFT JOIN repository_stats rs ON p.id = rs.profile_id
       WHERE rs.developer_type = ?
       ORDER BY p.created_at DESC`,
      [devType]
    );
    return results;
  }

  /**
   * Find profiles by most used language
   */
  static async findByLanguage(language) {
    const [results] = await pool.query(
      `SELECT p.*, rs.* 
       FROM profiles p
       LEFT JOIN repository_stats rs ON p.id = rs.profile_id
       WHERE rs.most_used_language = ?
       ORDER BY rs.total_stars DESC`,
      [language]
    );
    return results;
  }
}

module.exports = Profile;