const axios = require('axios');

const GITHUB_API_URL = process.env.GITHUB_API_URL || 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_API_TOKEN;

//create axios instance
const githubAPI = axios.create({
  baseURL: GITHUB_API_URL,
  headers: {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json'
  },
  timeout: 10000
});

/**
 * Estimate developer type based on primary language
 */
function estimateDeveloperType(languages) {
    if (languages.length === 0) return "General Developer";

    const topLang = languages[0];
    const hasMultiple = languages.length > 1;

    const specializations = {
        'JavaScript': 'Full Stack / Frontend',
        'TypeScript': 'Full Stack / Frontend',
        'React': 'Frontend',
        'Python': 'Backend / Data Science',
        'Java': 'Backend / Enterprise',
        'Go': 'Systems / Backend',
        'Rust': 'Systems Programming',
        'C++': 'Systems Programming',
        'C': 'Systems Programming',
        'Swift': 'iOS Developer',
        'Kotlin': 'Android Developer',
        'C#': 'Backend / Game Dev',
        'PHP': 'Backend / Web',
        'Ruby': 'Backend / Web',
        'SQL': 'Data Engineer / DBA',
    };

    let devType = specializations[topLang] || `${topLang} Developer`;

    if (hasMultiple) {
        devType = 'Full Stack Developer';
    }

    return devType;
}

/**
 * Calculate developer seniority level
 */
function calculateSeniority(yearsActive, totalStars, repoCount) {
    if (yearsActive < 1) return 'Beginner';
    if (yearsActive < 3) return 'Junior';
    if (yearsActive < 7) return 'Mid-Level';
    if (totalStars > 1000 || repoCount > 50) return 'Senior';
    return 'Experienced';
}

/**
 * Fetch comprehensive user profile data from GitHub
 * @param {string} username - GitHub username
 * @returns {Promise<Object>} User profile with insights
 */
async function fetchUserProfile(username){
    try{
       console.log(`Fetching user profile for ${username}`) 

       //user info
       const userRes = await githubAPI.get(`/users/${username}`);
       const userData = userRes.data;
       
       //repos
       const reposRes = await githubAPI.get(`/users/${username}/repos?per_page=100&sort=stars&order=desc`)
       const repos = reposRes.data;

       //insights
       const languages = {}
       let totalStars = 0;
       let totalForks = 0;
       let totalWatchers = 0;

       repos.forEach(repo => {
        if(repo.language){
            languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
        totalStars += repo.stargazers_count || 0;
        totalForks += repo.forks_count || 0;
        totalWatchers += repo.watchers_count || 0;
       }); 

       //top language
       const topLanguages = Object.entries(languages)
       .sort((a, b) => b[1] - a[1])
       .slice(0,5)
       .map(([lang])=> lang)

       // avg
       const avgStarsPerRepo = repos.length > 0 ? totalStars / repos.length : 0;
       const avgForksPerRepo = repos.length > 0 ? totalForks / repos.length : 0;

       //developer type
       const devType = estimateDeveloperType(topLanguages);
       //seniority
       const joinDate = new Date(userData.created_at);
       const yearsActive = (new Date() - joinDate) / (1000 * 60 * 60 * 24 * 365);

       console.log(`Profile fetched ${username}`);

       return {
        //basic info
        username: userData.login,
        name: userData.name || "Name not available",
        avatar_url: userData.avatar_url || "Avatar not available",
        bio: userData.bio || "Bio not available",
        profile_url: userData.html_url || "Profile url not available",
        company: userData.company || null,
        location: userData.location || null,
        email: userData.email || null,

        //Activity
        public_repos: userData.public_repos || 0,
        followers: userData.followers || 0,
        following: userData.following || 0,

        //Repo insights
        total_repos: repos.length,
        total_stars: totalStars,
        total_forks: totalForks,
        total_watchers: totalWatchers,
        avg_stars_per_repo: Math.round(avgStarsPerRepo * 100) / 100,
        avg_forks_per_repo: Math.round(avgForksPerRepo * 100) / 100,
        
        //dev profile
        developer_type: devType,
        years_active: Math.round(yearsActive * 10) / 10,
        seniority: calculateSeniority(yearsActive, totalStars, repos.length),

        //Timestamp
        
            created_at: new Date(userData.created_at).toISOString().slice(0, 19).replace('T', ' '),
            updated_at: new Date(userData.updated_at).toISOString().slice(0, 19).replace('T', ' '),
     
       };
       
    }catch(err){
        if (err.response?.status === 404){
            throw new Error('User not found');
        }
        if(err.response?.status === 403){
            throw new Error('Github Api rate limit exceeded');
        }
        throw new Error(`Github API error: ${err.message}`)
    }
}

module.exports = {
    fetchUserProfile,
}