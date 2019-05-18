const mastermind = require('../mastermind');
const Lead = require('../models/lead');
const LeadScore = require('../models/leads-score');

const list = params => // eslint-disable-line no-unused-vars
mastermind([
	async (req, reply) => {
		const leads = await Lead.list(req.query);
		return reply(leads).code(200);
	},
	]);


const put = params =>
	mastermind([
		async (req, reply, next) => {
			const lead = req.payload.lead;
			const user = req.user.user;
			return req.seneca.act({ role: 'cd-dojos', ctrl: 'lead', cmd: 'submit', lead, user},
				(err, res) => {
					if (err) {
						return next(expectedErr);
					}
					req.app.leadId = res.id;
					req.app.lead = res;
					req.app.application = req.payload.lead.application;
					req.app.lead.application = req.app.application;
					next();
				});
		},
		async (req, reply, next) => {
			const leadId = req.app.leadId;
			const lead = req.app.lead;
			await LeadScore.post(leadId, lead);
			reply(req.app.lead).code(200);
		},
	]);

module.exports = {
	list,
	put,
};
