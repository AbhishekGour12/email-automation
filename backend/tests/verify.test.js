const fs = require('fs');
const path = require('path');
const { parseCsvLeads } = require('../src/utils/csvParser');
const { parseExcelLeads } = require('../src/utils/excelParser');
const { parsePlaceholders } = require('../src/utils/placeholderParser');
const { getTrackingPixelHtml, rewriteLinksForClickTracking } = require('../src/utils/emailTracker');
const personalizationService = require('../src/services/personalization.service');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');

const runTests = async () => {
  console.log('==================================================');
  console.log('STARTING BACKEND COMPONENT VERIFICATION TESTS...');
  console.log('==================================================');
  
  let passedCount = 0;
  let failedCount = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`[PASS] - ${message}`);
      passedCount++;
    } else {
      console.error(`[FAIL] - ${message}`);
      failedCount++;
    }
  };

  // Test 1: Placeholder Parser
  try {
    const text = 'Hello {{name}}, how is the weather in {{city}}, {{country}}? Let me check {{website}}.';
    const lead = {
      name: 'Abhi',
      city: 'Delhi',
      country: 'India',
      website: 'https://abhi.services'
    };
    const parsed = parsePlaceholders(text, lead);
    assert(
      parsed === 'Hello Abhi, how is the weather in Delhi, India? Let me check https://abhi.services.',
      'Placeholder Parser replaces valid variables correctly.'
    );

    // Test fallbacks
    const parsedFallback = parsePlaceholders('Hi {{name}}, how is business at {{company}} in {{industry}}?', {});
    assert(
      parsedFallback === 'Hi there, how is business at your company in your space?',
      'Placeholder Parser handles fallbacks for missing keys correctly.'
    );
  } catch (err) {
    console.error('Test 1 error:', err);
    failedCount++;
  }

  // Test 2: Email Tracker Link Rewriting & Pixel
  try {
    const emailId = 'test_email_123';
    const htmlBody = '<p>Check out our site: <a href="https://google.com">Google Link</a> and <a href="http://example.com/page">Example</a>.</p>';
    
    const rewritten = rewriteLinksForClickTracking(htmlBody, emailId);
    assert(
      rewritten.includes('http://localhost:5000/api/email/track/click/test_email_123?url=https%3A%2F%2Fgoogle.com') &&
      rewritten.includes('http://localhost:5000/api/email/track/click/test_email_123?url=http%3A%2F%2Fexample.com%2Fpage'),
      'Email Tracker correctly rewrites HTTP/HTTPS links for click tracking.'
    );

    const pixel = getTrackingPixelHtml(emailId);
    assert(
      pixel === '<img src="http://localhost:5000/api/email/track/open/test_email_123" width="1" height="1" style="display:none !important;" alt="" />',
      'Email Tracker correctly generates tracking open pixel HTML.'
    );
  } catch (err) {
    console.error('Test 2 error:', err);
    failedCount++;
  }

  // Test 3: Personalization Service with Industry Hooks
  try {
    const template = {
      subject: 'Outreach to {{company}}',
      body: 'Hi {{name}}, {{intro_hook}} We know {{value_hook}} {{cta_hook}}'
    };
    const lead = {
      name: 'John',
      company: 'FitLife',
      industry: 'Gym'
    };

    const personalized = personalizationService.personalize(template, lead);
    
    assert(
      personalized.subject === 'Outreach to FitLife' &&
      personalized.body.includes('loved your community vibe') &&
      personalized.body.includes('boost their monthly membership signups') &&
      personalized.body.includes('quick 2-minute breakdown'),
      'Personalization engine correctly injects Gym industry-specific intro, value, and cta hooks.'
    );
  } catch (err) {
    console.error('Test 3 error:', err);
    failedCount++;
  }

  // Test 4: JWT token generation and verification
  try {
    const secret = 'test_secret_key';
    const payload = { uid: 'user_456', email: 'test@user.com', role: 'Admin' };
    const token = jwt.sign(payload, secret, { expiresIn: '1m' });
    const verified = jwt.verify(token, secret);
    
    assert(
      verified.uid === payload.uid && verified.email === payload.email && verified.role === payload.role,
      'JWT Sign and Verify works correctly.'
    );
  } catch (err) {
    console.error('Test 4 error:', err);
    failedCount++;
  }

  // Test 5: CSV Lead Parser
  const tempCsvPath = path.join(__dirname, 'temp_leads.csv');
  try {
    const csvContent = `Name,Email Address,Phone,Company,Website,Industry,City,Country\n` +
                       `Alice,alice@gmail.com,1234567,DentalInc,https://dental.com,Dental,New York,USA\n` +
                       `Bob,bob@yahoo.com,,GymInc,,Gym,,`;
    fs.writeFileSync(tempCsvPath, csvContent, 'utf8');

    const leads = await parseCsvLeads(tempCsvPath);
    
    assert(
      leads.length === 2 &&
      leads[0].name === 'Alice' && leads[0].email === 'alice@gmail.com' && leads[0].industry === 'Dental' && leads[0].city === 'New York' &&
      leads[1].name === 'Bob' && leads[1].email === 'bob@yahoo.com' && leads[1].industry === 'Gym' && leads[1].phone === undefined,
      'CSV Lead Parser maps standard variations, cleans, and returns parsed leads.'
    );
  } catch (err) {
    console.error('Test 5 error:', err);
    failedCount++;
  } finally {
    if (fs.existsSync(tempCsvPath)) fs.unlinkSync(tempCsvPath);
  }

  // Test 6: Excel Lead Parser
  const tempExcelPath = path.join(__dirname, 'temp_leads.xlsx');
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads');
    worksheet.columns = [
      { header: 'Full Name', key: 'name' },
      { header: 'Email Address', key: 'email' },
      { header: 'Business Type', key: 'industry' },
      { header: 'Domain', key: 'website' }
    ];
    worksheet.addRow({ name: 'Charlie', email: 'charlie@outlook.com', industry: 'Restaurant', website: 'https://eats.com' });
    worksheet.addRow({ name: 'Diana', email: 'diana@agency.com', industry: 'IT Agency', website: '' });
    await workbook.xlsx.writeFile(tempExcelPath);

    const leads = await parseExcelLeads(tempExcelPath);
    assert(
      leads.length === 2 &&
      leads[0].name === 'Charlie' && leads[0].email === 'charlie@outlook.com' && leads[0].industry === 'Restaurant' &&
      leads[1].name === 'Diana' && leads[1].email === 'diana@agency.com' && leads[1].industry === 'IT Agency',
      'Excel Lead Parser maps headers and extracts worksheets correctly using ExcelJS.'
    );
  } catch (err) {
    console.error('Test 6 error:', err);
    failedCount++;
  } finally {
    if (fs.existsSync(tempExcelPath)) fs.unlinkSync(tempExcelPath);
  }

  console.log('==================================================');
  console.log(`VERIFICATION COMPLETED. PASSED: ${passedCount}, FAILED: ${failedCount}`);
  console.log('==================================================');
  
  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();
