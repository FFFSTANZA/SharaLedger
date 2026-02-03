# License System Quick Start Guide

## 🚀 Quick Start for Support Team

### Prerequisites
- Access to the Versoll Books repository
- Node.js installed (v14+)
- Secure storage for private key

## 📋 First-Time Setup

### Step 1: Generate Production Keys

```bash
cd /path/to/versoll-books
node scripts/generateKeys.js
```

This will:
- Generate RSA-2048 key pair
- Save private key to `keys/private_key.pem`
- Save public key to `keys/public_key.pem`
- Update application code automatically

### Step 2: Secure the Private Key

⚠️ **CRITICAL**: Never commit `keys/` directory to version control!

1. Move `keys/private_key.pem` to secure storage:
   - Password manager (1Password, LastPass, etc.)
   - Encrypted USB drive
   - Hardware security module (HSM)

2. Delete the `keys/` directory from project

3. Add to `.gitignore` (already done):
   ```
   *.key
   license_*.key
   .userData/.last_seen
   keys/
   ```

### Step 3: Deploy Application

1. Commit the updated application code (contains public key)
2. Build and deploy the application
3. Support team can now generate licenses

## 🎯 Daily Operations

### Generating a License

When a customer requests a license:

1. **Get Information**:
   - Customer/organization name
   - Device ID (customer gets from Settings → License)

2. **Generate License**:
   ```bash
   node scripts/generateLicense.js "Customer Name" "DEVICE_ID" [months]
   ```

   **Examples**:
   ```bash
   # 12-month license
   node scripts/generateLicense.js "ABC Traders" "A1B2C3D4E5F6A7B8" 12
   
   # 24-month license
   node scripts/generateLicense.js "XYZ Corp" "A1B2C3D4E5F6A7B8" 24
   
   # 6-month license
   node scripts/generateLicense.js "Small Business" "A1B2C3D4E5F6A7B8" 6
   ```

3. **Verify License File**:
   - Check that `.key` file was created
   - Verify customer name is correct
   - Verify device ID matches

4. **Send to Customer**:
   - Email the `.key` file
   - Include instructions:
     > "Open Versoll Books → Settings → License → Import License → Select the file we sent you"

### Handling Renewals

When a customer needs to renew:

1. **Process**: Same as new license
2. **Duration**: Typically 12 months
3. **Customer Action**: Import new license file
4. **Result**: License extends automatically

## 🔧 Troubleshooting

### Customer Can't Import License

**Problem**: "Device mismatch" error

**Solution**:
1. Ask customer to verify Device ID in Settings → License
2. Compare with what you received
3. Regenerate license with correct Device ID

### License Shows as Invalid

**Problem**: "Signature mismatch" error

**Solution**:
1. Check if you're using the correct private key
2. Regenerate license
3. Verify the `.key` file wasn't corrupted in transit

### License Expired Too Soon

**Problem**: Wrong expiry date

**Solution**:
1. Check system date on your machine
2. Verify months parameter in generation command
3. Regenerate if needed

### Lost Private Key

**Problem**: Can't generate new licenses

**Solution**:
1. **EMERGENCY**: If private key is lost, all existing licenses can't be verified
2. Generate new key pair:
   ```bash
   node scripts/generateKeys.js
   ```
3. Deploy application update with new public key
4. **IMPORTANT**: All existing customers will need new licenses
5. Notify all customers of required license update

## 📊 License Types

### Standard Tiers

| Type | Duration | Price | Notes |
|------|-----------|--------|--------|
| Monthly | 1 month | ₹XXX/month |
| Yearly | 12 months | ₹XXX/year (2 months free) |
| 2-Year | 24 months | ₹XXX/2years (4 months free) |
| 3-Year | 36 months | ₹XXX/3years (6 months free) |

### Grace Period

- **Duration**: 15 days
- **During Grace**: Full functionality
- **After Grace**: Read-only mode only
- **Warning**: Shown 30 days before expiry

## 📞 Customer Communication

### Email Template for New License

```
Subject: Your Versoll Books License

Hello [Customer Name],

Your Versoll Books license has been generated and is attached.

**License Details**:
- Product: Versoll Books
- Issued To: [Company Name]
- Valid Until: [Expiry Date]

**Installation Instructions**:
1. Open Versoll Books
2. Go to Settings → License
3. Click "Import License"
4. Select the attached license file
5. Your license will be activated

**Important Notes**:
- This license is valid only for this device
- Your Device ID: [DEVICE_ID]
- Keep your license file safe for backup

If you have any questions, reply to this email.

Best regards,
Versoll Books Support
```

### Email Template for Renewal

```
Subject: Versoll Books License Renewal

Hello [Customer Name],

Thank you for renewing your Versoll Books license!

**Renewal Details**:
- Product: Versoll Books
- New Expiry Date: [New Expiry Date]
- License Type: [License Type]

**Installation Instructions**:
Simply import the attached license file:
1. Open Versoll Books
2. Go to Settings → License
3. Click "Import License"
4. Select the attached file
5. Your license will be extended automatically

Your existing data and settings remain unchanged.

If you have any questions, reply to this email.

Best regards,
Versoll Books Support
```

## 🔒 Security Best Practices

### Private Key Protection

1. **Never** commit to version control
2. **Never** share via email/chat
3. **Always** store in encrypted form
4. **Always** have encrypted backups
4. **Limit** access to support team only
5. **Rotate** keys annually

### Key Rotation

When to rotate keys:
- Annually (recommended)
- If private key is compromised
- When moving to new team member

Rotation process:
1. Generate new key pair
2. Deploy application with new public key
3. Notify all customers
4. Reissue all licenses
5. Confirm all customers updated
6. Securely destroy old private key

## 📈 Monitoring

### Track These Metrics

- Licenses issued per day/week/month
- Average license duration
- Renewal rate
- Customer requests/issues
- Time to resolve license issues

### Alerts

Set up alerts for:
- > 50 licenses expiring this month
- > 10 license generation errors in a day
- Any system errors from customers

## 🆘 Emergency Procedures

### System Compromise

If private key is leaked:

1. **IMMEDIATELY**:
   - Generate new key pair
   - Disable old licenses (if possible)
   - Notify security team

2. **Within 24 hours**:
   - Deploy app update with new public key
   - Notify all customers
   - Prepare for high volume of re-issues

3. **Within 7 days**:
   - Reissue all customer licenses
   - Confirm all customers updated
   - Audit license generation logs

### Service Outage

If license generation fails:

1. Use backup private key (if available)
2. Contact development team
3. Notify customers of delay
4. Provide manual workaround if possible

## 📚 Additional Resources

- **Full Guide**: `LICENSE_SYSTEM_GUIDE.md`
- **Implementation Details**: `LICENSE_IMPLEMENTATION_SUMMARY.md`
- **Test Suite**: `test_license_system.js`

## ✅ Daily Checklist

When processing license requests:
- [ ] Verify customer name is correct
- [ ] Verify Device ID format (16 hex chars)
- [ ] Verify duration is correct
- [ ] Generate license file
- [ ] Test license file (optional)
- [ ] Send to customer with instructions
- [ ] Log the request

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**For**: Versoll Books Support Team
