#!/usr/bin/env node

import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

try {
  const envFile = readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
} catch (error) {
  console.error('❌ Error loading .env file:', error.message);
  process.exit(1);
}

const client = new CognitoIdentityProviderClient({ region: process.env.VITE_AWS_REGION });

const userPoolId = process.env.VITE_AWS_USER_POOL_ID;
const username = process.argv[2] || 'admin';
const email = process.argv[3] || 'admin@example.com';
const password = process.argv[4] || 'AdminPass123!';

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...');
    
    // Create user
    await client.send(new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: username,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' }
      ],
      MessageAction: 'SUPPRESS',
      TemporaryPassword: 'TempPass123!'
    }));

    // Set permanent password
    await client.send(new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: username,
      Password: password,
      Permanent: true
    }));

    console.log('✅ Admin user created successfully!');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('');
    console.log('🚀 You can now log in to your TechPulse blog at http://localhost:5174');
    
  } catch (error) {
    if (error.name === 'UsernameExistsException') {
      console.log('ℹ️  User already exists, updating password...');
      try {
        await client.send(new AdminSetUserPasswordCommand({
          UserPoolId: userPoolId,
          Username: username,
          Password: password,
          Permanent: true
        }));
        console.log('✅ Password updated successfully!');
      } catch (updateError) {
        console.error('❌ Error updating password:', updateError.message);
      }
    } else {
      console.error('❌ Error creating user:', error.message);
    }
  }
}

createAdminUser();