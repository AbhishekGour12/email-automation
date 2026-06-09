const firebaseHelper = require('../utils/firebaseHelper');
const { parseExcelLeads } = require('../utils/excelParser');
const { parseCsvLeads } = require('../utils/csvParser');
const { ApiError } = require('../middlewares/error.middleware');
const { logger } = require('../utils/logger');
const { triggerWebhook } = require('../utils/webhookDispatcher');
const fs = require('fs');

const leadService = {
  async createLead(data) {
    // Check if email already exists
    const existing = await firebaseHelper.queryByChild('leads', 'email', data.email);
    if (Object.keys(existing).length > 0) {
      throw new ApiError(400, `Lead with email ${data.email} already exists.`);
    }

    const leadData = {
      ...data,
      status: data.status || 'New',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await firebaseHelper.push('leads', leadData);
    return result.data;
  },

  async getLead(id) {
    const lead = await firebaseHelper.get(`leads/${id}`);
    if (!lead) {
      throw new ApiError(404, `Lead with ID ${id} not found.`);
    }
    return lead;
  },

  async updateLead(id, data) {
    const existing = await this.getLead(id); // Throws if not exists
    const oldStatus = existing.status;

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    await firebaseHelper.update(`leads/${id}`, updateData);
    const updated = await this.getLead(id);

    if (data.status && data.status !== oldStatus) {
      triggerWebhook('lead.status_updated', {
        leadId: id,
        email: updated.email,
        oldStatus,
        newStatus: data.status,
        reason: 'Manual update'
      });
    }

    return updated;
  },

  async deleteLead(id) {
    await this.getLead(id); // Throws if not exists
    await firebaseHelper.remove(`leads/${id}`);
    return { success: true };
  },

  /**
   * Search, filter, and paginate leads in-memory.
   */
  async listLeads({ page = 1, limit = 10, search = '', status = '', industry = '' }) {
    const allLeadsData = await firebaseHelper.get('leads') || {};
    let leadsList = Object.values(allLeadsData);

    // 1. Filter by Status
    if (status) {
      leadsList = leadsList.filter(l => l.status === status);
    }

    // 2. Filter by Industry
    if (industry) {
      leadsList = leadsList.filter(l => l.industry?.toLowerCase() === industry.toLowerCase());
    }

    // 3. Search query (matches name, email, company, city, country)
    if (search) {
      const q = search.toLowerCase();
      leadsList = leadsList.filter(l => 
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.company?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.country?.toLowerCase().includes(q)
      );
    }

    // 4. Sort by createdAt descending (newest first)
    leadsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 5. Paginate
    const total = leadsList.length;
    const startIndex = (page - 1) * limit;
    const paginatedLeads = leadsList.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(total / limit);

    return {
      leads: paginatedLeads,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    };
  },

  /**
   * Parse uploaded Excel/CSV file and import leads in bulk.
   * Handles duplicate emails within the file and against existing database.
   * @param {string} filePath - Path of uploaded file
   * @param {string} originalName - Original filename
   */
  async importLeadsFromFile(filePath, originalName) {
    try {
      let rawLeads = [];
      const extension = originalName.split('.').pop().toLowerCase();

      // 1. Parse File
      if (extension === 'xlsx' || extension === 'xls') {
        rawLeads = await parseExcelLeads(filePath);
      } else if (extension === 'csv') {
        rawLeads = await parseCsvLeads(filePath);
      } else {
        throw new ApiError(400, 'Unsupported file format. Please upload CSV or Excel (.xlsx/.xls) files.');
      }

      if (rawLeads.length === 0) {
        throw new ApiError(400, 'No leads found in the uploaded file.');
      }

      // 2. Fetch all existing leads to check duplicates
      const allLeadsData = await firebaseHelper.get('leads') || {};
      const existingEmails = new Set(
        Object.values(allLeadsData).map(l => l.email.toLowerCase())
      );

      const newLeads = [];
      const duplicateEmailsInFile = new Set();
      const duplicateEmailsInDb = new Set();

      const uniqueEmailsInUpload = new Set();

      for (const lead of rawLeads) {
        const email = lead.email.toLowerCase();
        
        // Skip if email was already seen in this file
        if (uniqueEmailsInUpload.has(email)) {
          duplicateEmailsInFile.add(email);
          continue;
        }
        
        // Skip if email exists in database
        if (existingEmails.has(email)) {
          duplicateEmailsInDb.add(email);
          continue;
        }

        uniqueEmailsInUpload.add(email);
        newLeads.push({
          ...lead,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // 3. Write new leads to Firebase in bulk
      if (newLeads.length > 0) {
        const bulkUpdateObject = {};
        const database = firebaseHelper.db;
        
        for (const lead of newLeads) {
          // Generate unique ID for each lead
          const leadRef = database.ref('leads').push();
          const leadId = leadRef.key;
          lead.id = leadId;
          bulkUpdateObject[`leads/${leadId}`] = lead;
        }
        
        // Perform atomic multi-path update in RTDB
        await database.ref().update(bulkUpdateObject);
      }

      // Clean up uploaded file
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        logger.error(`Failed to delete temp file ${filePath}:`, err);
      }

      return {
        importedCount: newLeads.length,
        skippedFileDuplicates: duplicateEmailsInFile.size,
        skippedDbDuplicates: duplicateEmailsInDb.size,
        totalParsed: rawLeads.length
      };

    } catch (error) {
      // Cleanup uploaded file on error
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          logger.error('Failed to delete upload file during error cleanup:', err);
        }
      }
      throw error;
    }
  }
};

module.exports = leadService;
