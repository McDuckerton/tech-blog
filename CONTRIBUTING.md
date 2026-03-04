# Contributing to TechPulse

Thank you for your interest in contributing to TechPulse! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- Use the GitHub issue tracker to report bugs
- Include detailed steps to reproduce the issue
- Provide system information (OS, Node.js version, etc.)
- Include error messages and logs when applicable

### Suggesting Features
- Open an issue with the "enhancement" label
- Describe the feature and its use case
- Explain how it would benefit users
- Consider implementation complexity and maintenance

### Code Contributions

1. **Fork the Repository**
   ```bash
   git clone https://github.com/yourusername/tech-blog.git
   cd tech-blog
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow the coding standards below
   - Add tests for new functionality
   - Update documentation as needed

4. **Test Your Changes**
   ```bash
   npm install
   npm run test
   npm run build
   ```

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 Coding Standards

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer functional programming patterns

### React Components
- Use functional components with hooks
- Follow the component structure:
  ```tsx
  // Imports
  import React from 'react';
  
  // Types
  interface Props {
    // ...
  }
  
  // Component
  export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
    // Hooks
    // Event handlers
    // Render
    return (
      <div>
        {/* JSX */}
      </div>
    );
  };
  ```

### CSS/Styling
- Use Tailwind CSS classes
- Follow mobile-first responsive design
- Use semantic HTML elements
- Ensure accessibility compliance

### API Development
- Use Express.js patterns
- Implement proper error handling
- Add input validation
- Include rate limiting for public endpoints
- Use middleware for common functionality

## 🧪 Testing

### Frontend Testing
```bash
npm run test
```

### API Testing
```bash
cd api
npm run test
```

### End-to-End Testing
```bash
npm run test:e2e
```

## 📚 Documentation

- Update README.md for significant changes
- Add JSDoc comments for new functions
- Update API documentation for new endpoints
- Include examples in documentation

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- AWS CLI configured
- Anthropic API key

### Local Development
1. Install dependencies: `npm install && cd api && npm install`
2. Copy environment files: `cp .env.example .env`
3. Configure your API keys in `.env` files
4. Start backend: `cd api && npm start`
5. Start frontend: `npm run dev`

### AWS Development
1. Deploy infrastructure: `cd infrastructure && ./deploy.sh dev`
2. Update environment variables with deployed resources
3. Test with deployed backend

## 🚀 Deployment

### Testing Deployments
- Test infrastructure deployment: `./deploy.sh dev infrastructure-only`
- Test API deployment: `./deploy.sh dev lambda`
- Verify all functionality works

### Production Considerations
- Use environment-specific configurations
- Test thoroughly before production deployment
- Monitor costs and performance
- Follow security best practices

## 📋 Pull Request Guidelines

### Before Submitting
- [ ] Code follows project standards
- [ ] Tests pass locally
- [ ] Documentation is updated
- [ ] No console.log statements in production code
- [ ] Environment variables are properly configured

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## 🐛 Bug Reports

### Include This Information
- Operating system and version
- Node.js version
- Browser (if frontend issue)
- Steps to reproduce
- Expected vs actual behavior
- Error messages and stack traces
- Screenshots (if applicable)

## 💡 Feature Requests

### Good Feature Requests Include
- Clear problem statement
- Proposed solution
- Alternative solutions considered
- Use cases and benefits
- Implementation complexity estimate

## 🔒 Security

### Reporting Security Issues
- Do NOT open public issues for security vulnerabilities
- Email security concerns to: security@techpulse.dev
- Include detailed description and reproduction steps
- Allow time for investigation before public disclosure

### Security Guidelines
- Never commit API keys or secrets
- Use environment variables for configuration
- Validate all user inputs
- Follow AWS security best practices
- Keep dependencies updated

## 📞 Getting Help

### Community Support
- GitHub Discussions for questions
- Stack Overflow with `techpulse` tag
- Discord community (link in README)

### Maintainer Contact
- Create an issue for bugs and features
- Email for security issues
- Twitter: @TechPulseDev

## 🎉 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Annual contributor highlights

Thank you for contributing to TechPulse! 🚀