const firebaseHelper = require('../utils/firebaseHelper');
const personalizationService = require('./personalization.service');
const { ApiError } = require('../middlewares/error.middleware');

const templateService = {
  async createTemplate(data) {
    const templateData = {
      name: data.name,
      category: data.category,
      subject: data.subject,
      body: data.body,
      followup1: data.followup1 || '',
      followup2: data.followup2 || '',
      followup3: data.followup3 || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const result = await firebaseHelper.push('templates', templateData);
    return result.data;
  },

  async getTemplate(id) {
    const template = await firebaseHelper.get(`templates/${id}`);
    if (!template) {
      throw new ApiError(404, `Template with ID ${id} not found.`);
    }
    return template;
  },

  async getAllTemplates() {
    const templates = await firebaseHelper.get('templates');
    return templates ? Object.values(templates) : [];
  },

  async updateTemplate(id, data) {
    // Verify it exists
    await this.getTemplate(id);
    
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    await firebaseHelper.update(`templates/${id}`, updateData);
    return this.getTemplate(id);
  },

  async deleteTemplate(id) {
    await this.getTemplate(id);
    await firebaseHelper.remove(`templates/${id}`);
    return { success: true };
  },

  async duplicateTemplate(id) {
    const template = await this.getTemplate(id);
    const duplicatedData = {
      ...template,
      name: `${template.name} - Copy`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    delete duplicatedData.id; // Push will generate a new ID
    
    const result = await firebaseHelper.push('templates', duplicatedData);
    return result.data;
  },

  async previewTemplate(id, sampleLead = {}) {
    const template = await this.getTemplate(id);
    
    const defaultSampleLead = {
      name: 'John Doe',
      company: 'Acme Corp',
      industry: 'Dental',
      website: 'https://acmedental.com',
      city: 'Boston',
      country: 'USA',
      phone: '+1 234 567 8900',
      linkedin: 'https://linkedin.com/in/johndoe',
      ...sampleLead
    };

    // Render initial and followups
    const initial = personalizationService.personalize({
      subject: template.subject,
      body: template.body
    }, defaultSampleLead);

    const f1 = template.followup1 ? personalizationService.personalize({
      subject: `Follow up: ${template.subject}`,
      body: template.followup1
    }, defaultSampleLead) : null;

    const f2 = template.followup2 ? personalizationService.personalize({
      subject: `Re: ${template.subject}`,
      body: template.followup2
    }, defaultSampleLead) : null;

    const f3 = template.followup3 ? personalizationService.personalize({
      subject: `Final follow up: ${template.subject}`,
      body: template.followup3
    }, defaultSampleLead) : null;

    return {
      template,
      preview: {
        initial,
        followup1: f1,
        followup2: f2,
        followup3: f3
      }
    };
  }
};

module.exports = templateService;
