const Joi = require('joi');
const auth = require('../../lib/authentications');
const leadScoreHandlers = require('../../lib/handlers/lead-score');

const basePath = '/api/3.0';

module.exports = [
  {
    method: 'GET',
    path: `${basePath}/lead_score/{leadId}`,
    handler: leadScoreHandlers.get(),
    config: {
      auth: auth.apiUser,
      description: 'Get a lead\'s score ',
      notes: 'Lead\'s Score',
      tags: ['api', 'leadScore'],
      plugins: {
        cpPermissions: {
          profiles: [{
            role: 'basic-user',
            customValidator: [{
              role: 'cd-users',
              cmd: 'is_self',
            }],
          }],
        },
        'hapi-swagger': {
          responseMessages: [
            { code: 400, message: 'Bad Request' },
            { code: 200, message: 'OK' },
          ],
        },
      },
      validate: {
        params: {
          leadId: Joi.string().guid().required(),
        },
      },
    },
  },
];
