# Security Policy

## Overview

This document outlines the security measures, known vulnerabilities, and best practices implemented in the Aramid Bridge frontend application.

**Last Updated:** 2025-11-18
**Next Review:** 2026-02-18 (3 months)

---

## Table of Contents

- [Known Vulnerabilities](#known-vulnerabilities)
- [Security Measures Implemented](#security-measures-implemented)
- [Reporting Security Issues](#reporting-security-issues)
- [Security Best Practices](#security-best-practices)
- [Dependency Management](#dependency-management)
- [Production Deployment Security](#production-deployment-security)

---

## Known Vulnerabilities

### @coinbase/wallet-sdk (GHSA-8rgj-285w-qcq4)

**Status:** ACCEPTED RISK - Monitoring
**Severity:** HIGH
**CVSS Score:** Not yet scored
**Affected Version:** 4.0.3 (via @web3modal/ethers@5.1.10)
**Fixed Version:** ≥4.3.0
**Issue Date:** 2025-11-18
**Review Date:** 2026-02-18

#### Details

The application currently uses `@web3modal/ethers@5.1.10`, which depends on `@coinbase/wallet-sdk@4.0.3`. This version has a known HIGH severity vulnerability (GHSA-8rgj-285w-qcq4).

#### Why Risk Accepted

1. **Functionality Impact:** Downgrading to `@web3modal/ethers@4.2.2` (which fixes the vulnerability) breaks the application:
   - Missing `@web3modal/base` module
   - Breaking changes in API structure
   - Loss of critical wallet connection functionality

2. **Compensating Controls:** The following security measures have been implemented:
   - Content Security Policy (CSP) headers
   - Input sanitization and validation
   - Rate limiting for RPC calls
   - Runtime error monitoring capability
   - Regular security audits via GitHub Actions

3. **Migration Path:** The application uses deprecated Web3Modal. The recommended path is:
   - Migrate from `@web3modal/*` to `@reown/appkit-*` (Reown AppKit)
   - This migration is planned for a future release
   - Reown AppKit uses newer, secure versions of dependencies

#### Mitigation Measures

- **CSP Headers:** Restrict resource loading to trusted domains
- **XSS Protection:** Input sanitization on all user inputs
- **Rate Limiting:** Prevent RPC endpoint abuse
- **Monitoring:** Error tracking for wallet-related issues
- **Regular Audits:** Weekly security scans via GitHub Actions

#### Action Items

- [ ] Plan migration to Reown AppKit (@reown/appkit-adapter-ethers)
- [ ] Monitor for security updates to @web3modal/ethers
- [ ] Review this vulnerability quarterly
- [ ] Consider implementing WAF rules if available

---

## Security Measures Implemented

### 1. Content Security Policy (CSP)

**Location:** `/vite.config.ts`

```typescript
server: {
  headers: {
    'Content-Security-Policy': "default-src 'self'; connect-src 'self' https://*.walletconnect.com ...",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  }
}
```

**Purpose:**
- Prevent XSS attacks
- Restrict resource loading
- Protect against clickjacking
- Control referrer information

### 2. Input Sanitization & Validation

**Location:** `/src/utils/sanitize.ts`

**Functions:**
- `sanitizeInput()` - General text sanitization
- `isValidEthAddress()` - Ethereum address validation
- `isValidAlgoAddress()` - Algorand address validation
- `isValidTxHash()` - Transaction hash validation
- `sanitizeSearchQuery()` - Search input sanitization
- `escapeHtml()` - HTML entity escaping

**Applied in:**
- `/src/components/ClaimPage.vue` - Transaction hash input
- `/src/components/dialogs/SelectSourceAssetDialog.vue` - Asset search
- `/src/components/dialogs/SelectDestinationAssetDialog.vue` - Asset search

**Purpose:**
- Prevent XSS attacks
- Prevent injection attacks
- Ensure data integrity

### 3. Rate Limiting

**Location:** `/src/utils/rateLimit.ts`

**Limiters:**
- `rpcLimiter` - 10 calls/second for RPC endpoints
- `indexerLimiter` - 5 calls/second for indexer queries
- `balanceLimiter` - 20 calls/second for balance checks
- `retryLimiter` - Exponential backoff for retries

**Applied in:**
- `/src/scripts/eth/getEthAccountTokenBalance.ts`
- `/src/scripts/algo/getAlgoAccountTokenBalance.ts`
- `/src/scripts/algo/getAlgoAccountARC200TokenBalance.ts`

**Purpose:**
- Prevent RPC endpoint abuse
- Avoid rate limit penalties from providers
- Improve application stability

### 4. Secure Configuration Management

**Files:**
- `.env.example` - Template for environment variables
- `.gitignore` - Excludes sensitive files from version control

**Guidelines:**
- Never commit `.env` files
- Use environment variables for API keys
- Rotate API keys regularly
- Use read-only API keys when possible

### 5. Dependency Security

**Automated Scanning:**
- **GitHub Actions:** Weekly security audits (`.github/workflows/security-audit.yml`)
- **Dependabot:** Automated dependency updates (`.github/dependabot.yml`)

**Manual Review:**
```bash
npm audit --production
npm audit --audit-level=high
```

**Update Process:**
1. Dependabot creates PR for vulnerable dependencies
2. Automated tests run on PR
3. Manual review and approval
4. Merge and deploy

---

## Reporting Security Issues

### Responsible Disclosure

If you discover a security vulnerability, please follow these steps:

1. **DO NOT** open a public GitHub issue
2. Email the security team at: [security@aramid.finance] (replace with actual email)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### Response Timeline

- **Acknowledgment:** Within 24 hours
- **Initial Assessment:** Within 72 hours
- **Status Update:** Weekly until resolved
- **Resolution:** Based on severity (Critical: 7 days, High: 14 days, Medium: 30 days)

### Recognition

We appreciate security researchers who responsibly disclose vulnerabilities. With your permission, we'll credit you in our security advisories.

---

## Security Best Practices

### For Developers

1. **Code Review**
   - All code changes must be reviewed
   - Security-sensitive changes require additional review
   - Use the security checklist before merging

2. **Dependencies**
   - Keep dependencies up to date
   - Review dependency licenses
   - Audit new dependencies before adding
   - Prefer well-maintained packages

3. **Secrets Management**
   - Never commit secrets to version control
   - Use environment variables
   - Rotate API keys regularly
   - Use `.env.local` for local development

4. **Testing**
   - Write tests for security-critical code
   - Test input validation thoroughly
   - Test error handling paths
   - Perform security testing before releases

### For Users

1. **Wallet Security**
   - Never share your private keys
   - Use hardware wallets when possible
   - Verify transaction details before signing
   - Be cautious of phishing attempts

2. **Browser Security**
   - Keep browser up to date
   - Use trusted browser extensions only
   - Clear cache/cookies regularly
   - Use different passwords for different sites

3. **Network Security**
   - Avoid public WiFi for sensitive operations
   - Use VPN when possible
   - Verify SSL certificates
   - Bookmark the official site

---

## Dependency Management

### Current Security Status

**Last Audit:** 2025-11-18

**Known Vulnerabilities:**
- High: 1 (@coinbase/wallet-sdk - accepted risk)
- Medium: 0
- Low: Multiple (non-critical)

### Update Schedule

- **Critical/High:** Immediate
- **Medium:** Within 14 days
- **Low:** Within 30 days or next release
- **Dependencies:** Weekly automated checks

### Blocked Updates

| Package | Version | Reason | Alternative |
|---------|---------|--------|-------------|
| @web3modal/ethers | 4.2.2 | Breaking changes | Plan migration to Reown AppKit |

---

## Production Deployment Security

### Required HTTP Headers

Configure your web server (Nginx, Apache, CloudFlare, etc.) with these headers:

```nginx
# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; connect-src 'self' https://*.walletconnect.com https://*.coinbase.com wss://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org https://*.infura.io https://*.alchemy.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; frame-src 'self' https://*.walletconnect.com https://*.walletconnect.org;" always;

# Security Headers
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# CORS (if needed)
add_header Access-Control-Allow-Origin "https://yourdomain.com" always;
```

### CloudFlare Configuration

If using CloudFlare:

1. **SSL/TLS:** Full (strict)
2. **Auto Minify:** HTML, CSS, JavaScript
3. **Brotli Compression:** Enabled
4. **HTTP/2:** Enabled
5. **WAF:** Enabled with OWASP rules
6. **Rate Limiting:** Configure based on traffic patterns

### Environment Variables

For production, set these environment variables:

```bash
VITE_WALLETCONNECT_PROJECT_ID=your_production_project_id
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_SENTRY_DSN=your_sentry_dsn
```

### Monitoring

1. **Error Tracking:** Sentry or similar service
2. **Uptime Monitoring:** Pingdom, UptimeRobot, or similar
3. **Log Aggregation:** CloudWatch, Datadog, or similar
4. **Security Monitoring:** Regular penetration testing

---

## Security Checklist

### Before Each Release

- [ ] Run `npm audit` and review results
- [ ] Update dependencies (especially security fixes)
- [ ] Review and test input validation
- [ ] Verify CSP headers are correct
- [ ] Check for exposed secrets or API keys
- [ ] Test wallet connections
- [ ] Verify rate limiting is working
- [ ] Review error handling
- [ ] Update this SECURITY.md if needed

### Quarterly Review

- [ ] Review all accepted risks
- [ ] Update dependency vulnerability assessment
- [ ] Review and update security policies
- [ ] Conduct security training for team
- [ ] Review access controls
- [ ] Audit API key usage
- [ ] Review monitoring and alerting

---

## Contact

**Security Team Email:** [security@aramid.finance] (replace with actual email)
**Bug Bounty Program:** [URL if available]
**Security Page:** https://github.com/AramidFinance/aramid-bridge-fe-vue/security

---

## Changelog

### 2025-11-18

**Added:**
- Documented @coinbase/wallet-sdk vulnerability (GHSA-8rgj-285w-qcq4)
- Implemented CSP headers in vite.config.ts
- Created input sanitization utilities
- Applied input validation to user-facing components
- Implemented rate limiting for RPC calls
- Created .env.example for secure configuration
- Set up GitHub Actions for security audits
- Configured Dependabot for automated updates
- Initial SECURITY.md creation

**Risk Status:**
- Accepted risk for @coinbase/wallet-sdk vulnerability pending Reown AppKit migration

---

*This document should be reviewed and updated quarterly or when significant security changes occur.*
