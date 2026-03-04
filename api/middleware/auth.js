const { CognitoIdentityProviderClient, GetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1'
});

// Middleware to authenticate JWT tokens from Cognito
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);

    // Verify token with Cognito
    const command = new GetUserCommand({
      AccessToken: token
    });

    const response = await cognitoClient.send(command);
    
    // Add user info to request object
    req.user = {
      username: response.Username,
      attributes: {}
    };

    response.UserAttributes.forEach(attr => {
      req.user.attributes[attr.Name] = attr.Value;
    });

    next();

  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'NotAuthorizedException') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);

    const command = new GetUserCommand({
      AccessToken: token
    });

    const response = await cognitoClient.send(command);
    
    req.user = {
      username: response.Username,
      attributes: {}
    };

    response.UserAttributes.forEach(attr => {
      req.user.attributes[attr.Name] = attr.Value;
    });

    next();

  } catch (error) {
    // If token verification fails, continue without authentication
    console.warn('Optional auth failed:', error.message);
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};