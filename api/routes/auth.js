const express = require('express');
const { CognitoIdentityProviderClient, InitiateAuthCommand, GetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

const router = express.Router();

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1'
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password
      }
    });

    const response = await cognitoClient.send(command);

    if (response.AuthenticationResult) {
      const { AccessToken, RefreshToken, IdToken } = response.AuthenticationResult;
      
      res.json({
        accessToken: AccessToken,
        refreshToken: RefreshToken,
        idToken: IdToken,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({ error: 'Authentication failed' });
    }

  } catch (error) {
    console.error('Login error:', error);
    
    if (error.name === 'NotAuthorizedException') {
      res.status(401).json({ error: 'Invalid username or password' });
    } else if (error.name === 'UserNotConfirmedException') {
      res.status(401).json({ error: 'User account not confirmed' });
    } else {
      res.status(500).json({ error: 'Login failed' });
    }
  }
});

// Get user profile endpoint
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const accessToken = authHeader.substring(7);

    const command = new GetUserCommand({
      AccessToken: accessToken
    });

    const response = await cognitoClient.send(command);

    const userAttributes = {};
    response.UserAttributes.forEach(attr => {
      userAttributes[attr.Name] = attr.Value;
    });

    res.json({
      username: response.Username,
      attributes: userAttributes
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    
    if (error.name === 'NotAuthorizedException') {
      res.status(401).json({ error: 'Invalid or expired token' });
    } else {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }
});

// Logout endpoint (client-side token invalidation)
router.post('/logout', (req, res) => {
  // In a stateless JWT system, logout is typically handled client-side
  // by removing the token from storage
  res.json({ message: 'Logout successful' });
});

module.exports = router;