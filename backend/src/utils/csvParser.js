const fs = require('fs');
const csv = require('csv-parser');
const { logger } = require('./logger');

const HEADER_MAP = {
  name: ['name', 'full name', 'first name', 'lead name'],
  email: ['email', 'email address', 'e-mail', 'mail'],
  phone: ['phone', 'phone number', 'contact', 'telephone', 'mobile'],
  company: ['company', 'company name', 'organization', 'business'],
  industry: ['industry', 'sector', 'business type'],
  city: ['city', 'location']
};

const mapHeaderToField = (headerName) => {
  if (!headerName) return null;
  const cleanHeader = headerName.toString().trim().toLowerCase();
  
  for (const [field, variations] of Object.entries(HEADER_MAP)) {
    if (variations.includes(cleanHeader)) {
      return field;
    }
  }
  return null;
};

/**
 * Parses a CSV file and returns an array of formatted lead objects.
 * @param {string} filePath - Absolute path to the CSV file
 * @returns {Promise<Array<object>>} - List of parsed leads
 */
const parseCsvLeads = (filePath) => {
  return new Promise((resolve, reject) => {
    const leads = [];
    let headersChecked = false;
    let mappedHeaders = {};

    fs.createReadStream(filePath)
      .pipe(csv({
        mapHeaders: ({ header }) => {
          const field = mapHeaderToField(header);
          if (field) {
            mappedHeaders[header] = field;
            return field;
          }
          return header.trim();
        }
      }))
      .on('data', (row) => {
        // Validate headers on the first row
        if (!headersChecked) {
          const fields = Object.values(row);
          // With mapHeaders, the keys of the row will be the mapped fields
          const rowKeys = Object.keys(row);
          if (!rowKeys.includes('email')) {
            reject(new Error('Invalid CSV format: "email" column is required.'));
            return;
          }
          headersChecked = true;
        }

        // Clean values and filter out empty columns
        const lead = {};
        let hasData = false;

        for (const [key, val] of Object.entries(row)) {
          if (HEADER_MAP[key]) { // Only keep our recognized mapped fields
            const cleanVal = val ? val.toString().trim() : '';
            if (cleanVal) {
              lead[key] = cleanVal;
              hasData = true;
            }
          }
        }

        if (hasData && lead.email) {
          lead.status = 'New';
          leads.push(lead);
        }
      })
      .on('end', () => {
        logger.info(`CSV Parser successfully processed ${leads.length} leads from ${filePath}`);
        resolve(leads);
      })
      .on('error', (error) => {
        logger.error('Error parsing CSV leads file:', error);
        reject(error);
      });
  });
};

module.exports = {
  parseCsvLeads
};
