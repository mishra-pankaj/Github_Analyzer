const request = require('supertest');
const app = require('../src/app');

describe('GitHub Analyzer API', () => {
  

  // Analyze Profile
  describe('POST /api/profiles/analyze', () => {
    it('should analyze a valid GitHub user', async () => {
      const res = await request(app)
        .post('/api/profiles/analyze')
        .send({ username: 'torvalds' })
        .expect(201);
      
      expect(res.body.message).toBe('Profile analyzed successfully');
      expect(res.body.data.username).toBe('torvalds');
      expect(res.body.data.followers).toBeGreaterThan(0);
    });

    it('should return 400 for missing username', async () => {
      const res = await request(app)
        .post('/api/profiles/analyze')
        .send({})
        .expect(400);
      
      expect(res.body.error).toBe('Invalid request');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/profiles/analyze')
        .send({ username: 'nonexistentuser12345xyz' })
        .expect(404);
      
      expect(res.body.error).toContain('not found');
    });
  });

  // Get All Profiles
  describe('GET /api/profiles', () => {
    it('should return list of profiles', async () => {
      const res = await request(app)
        .get('/api/profiles')
        .expect(200);
      
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/profiles?page=1')
        .expect(200);
      
      expect(res.body.pagination.current_page).toBe(1);
    });
  });

  // Get Single Profile
  describe('GET /api/profiles/:username', () => {
    it('should return profile details', async () => {
      const res = await request(app)
        .get('/api/profiles/torvalds')
        .expect(200);
      
      expect(res.body.data.username).toBe('torvalds');
      expect(res.body.data.followers).toBeDefined();
    });

    it('should return 404 for non-existent profile', async () => {
      const res = await request(app)
        .get('/api/profiles/nonexistent')
        .expect(404);
      
      expect(res.body.error).toContain('not found');
    });
  });

});