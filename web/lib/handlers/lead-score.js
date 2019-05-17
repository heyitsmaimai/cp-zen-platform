const mastermind = require('../mastermind');
const LeadScore = require('../models/lead-score');

const get = params => // eslint-disable-line no-unused-vars
  mastermind([
    // eslint-disable-next-line no-unused-vars
    async (req, reply, next) => {
      const leadId = req.params.leadId;
      const leadScore = await LeadScore.get(leadId);
      return reply(leadScore).code(200);
    },
  ]);

module.exports = {
  get,
};
