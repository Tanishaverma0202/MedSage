import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { User } from '../backend/models/user.model';
import { Discussion } from '../backend/models/discussion.model';
import { authService } from '../backend/services/auth.service';

async function test() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI || '');
  console.log('Connected.');

  const email = `test_${Date.now()}@example.com`;
  console.log(`Registering test user: ${email}...`);
  const { user, tokens } = await authService.register({
    email,
    password: 'Password123!',
    fullName: 'Test Bot User'
  });
  console.log('User registered. ID:', user._id);

  console.log('Verifying email with OTP...');
  // Since process.env.NODE_ENV is development, OTP is '123456'
  const verifyResult = await authService.verifyEmail(email, '123456');
  console.log('Email verified successfully.');

  console.log('Logging in to get fresh token...');
  const loginResult = await authService.login(email, 'Password123!');
  const token = loginResult.tokens.accessToken;
  console.log('Logged in. Token length:', token.length);

  console.log('Creating a discussion...');
  const discussion = await Discussion.create({
    anonAlias: 'Quiet Dolphin',
    category: 'general',
    title: 'Hello from test script!',
    content: 'This is a test script checking discussion post functionality.'
  });
  console.log('Discussion created in DB:', discussion._id);

  // Clean up
  await User.deleteOne({ _id: user._id });
  await Discussion.deleteOne({ _id: discussion._id });
  console.log('Cleanup completed.');
  await mongoose.disconnect();
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
