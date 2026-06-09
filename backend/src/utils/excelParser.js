const ExcelJS = require('exceljs');
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
 * Parses an Excel file and returns an array of formatted lead objects.
 * @param {string} filePath - Absolute path to the Excel file
 * @returns {Promise<Array<object>>} - List of parsed leads
 */
const parseExcelLeads = async (filePath) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('No worksheet found in Excel file.');
    }

    const leads = [];
    let headerRow = null;
    const colIndexToField = {};

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      // First non-empty row is the header row
      if (rowNumber === 1) {
        headerRow = row;
        row.eachCell((cell, colNumber) => {
          const field = mapHeaderToField(cell.value);
          if (field) {
            colIndexToField[colNumber] = field;
          }
        });
        
        // Ensure email header exists
        const mappedFields = Object.values(colIndexToField);
        if (!mappedFields.includes('email')) {
          throw new Error('Invalid Excel format: "email" column is required.');
        }
        return;
      }

      // Process lead data rows
      const lead = {};
      let hasData = false;

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const field = colIndexToField[colNumber];
        if (field) {
          let val = cell.value;
          // Excel cells might have objects for hyperlinked cells, formula cells, etc.
          if (val && typeof val === 'object') {
            if (val.text) val = val.text;
            else if (val.result) val = val.result;
            else val = JSON.stringify(val);
          }
          
          if (val !== undefined && val !== null) {
            lead[field] = val.toString().trim();
            hasData = true;
          }
        }
      });

      // Simple validation: email must be present and valid shape
      if (hasData && lead.email) {
        // Normalize status and add default values
        lead.status = 'New';
        leads.push(lead);
      }
    });

    logger.info(`Excel Parser successfully processed ${leads.length} leads from ${filePath}`);
    return leads;
  } catch (error) {
    logger.error('Error parsing Excel leads file:', error);
    throw error;
  }
};

module.exports = {
  parseExcelLeads
};
