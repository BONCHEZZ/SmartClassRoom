const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server'); // Our Express app
const User = require('../models/User');
const connectDB = require('../config/connectDB');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Use the connectDB function from the application
  await connectDB(mongoUri);
});

beforeEach(async () => {
  await User.deleteMany({}); // Clear the database before each test
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'student',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'User registered successfully' });
  });

  it('should not register a user with an existing email', async () => {
    // First, register a user
    await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'student',
      });

    // Try to register with the same email
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Another User',
        email: 'test@example.com',
        password: 'password456',
        role: 'lecturer',
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({ error: 'User with this email already exists.' });
  });

  it('should log in an existing user', async () => {
    // Register a user first
    await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Login User',
        email: 'login@example.com',
        password: 'password123',
        role: 'student',
      });

    // Then try to log in
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('role', 'student');
  });

  it('should not log in with incorrect password', async () => {
    // Register a user first
    await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Login User',
        email: 'wrongpass@example.com',
        password: 'password123',
        role: 'student',
      });

    // Try to log in with wrong password
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrongpass@example.com',
        password: 'wrongpassword',
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toEqual({ error: 'Invalid password' });
  });

  it('should not log in a non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toEqual({ error: 'User not found' });
  });
});