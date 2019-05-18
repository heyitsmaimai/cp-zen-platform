const Joi = require('joi');
const auth = require('../../lib/authentications');
const leadHandlers = require('../../lib/handlers/lead');
const joiValidator = require('../validations/dojos')();

const basePath = '/api/3.0';
const oldBasePath = '/api/2.0';

module.exports = [
  {
    method: 'GET',
    path: `${basePath}/leads`,
    handler: leadHandlers.list(),
    config: {
      auth: auth.apiUser,
      description: 'Retrieve leads with a simple filtering',
      notes: 'List',
      tags: ['api', 'dojos', 'lead'],
      plugins: {
        cpPermissions: {
          profiles: [
            { role: 'basic-user',
              customValidator: [{
                role: 'cd-users',
                cmd: 'is_self',
              }]
            },
          ],
        },
        'hapi-swagger': {
          responseMessages: [
            { code: 400, message: 'Bad Request' },
            { code: 200, message: 'OK' },
          ],
        },
      },
      validate: {
        query: {
          userId: Joi.string().guid().required(),
          deleted: Joi.number().integer().valid(0, 1),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: `${oldBasePath}/dojos/lead/{leadId}`,
    handler: leadHandlers.put(),
    config: {
      auth: auth.apiUser,
      description: 'lead',
      notes: 'lead',
      tags: ['api', 'dojos'],
      plugins: {
        'hapi-swagger': {
          responseMessages: [
            { code: 400, message: 'Bad Request' },
            { code: 200, message: 'OK' }],
        },
      },
      validate: {
        payload: Joi.object({ lead: {
          id: joiValidator.guid().optional(),
          application: joiValidator.application(true).required(),
          userId: joiValidator.guid().required(),
          completed: Joi.boolean().valid(true),
        } }),
        params: {
          leadId: Joi.string().guid().required(),
        },
      },
    },
  },
];
