const mastermind = require('../mastermind');
const Lead = require('../models/lead');

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
			const user = req.user;
			return req.seneca.act({ role, ctrl: 'lead', cmd: 'submit', lead, user},
				(err, res) => {
					if (err) {
						return cb(expectedErr);
					}
					reply(res).code(200);
					req.app.leadId = res.lead.id
					req.app.application = res.lead
					cb();
				});
		},
		async (req, reply, next) => {
			const application = req.payload.lead;
			const leadId = req.app.leadId;
			req.app.leadScore = await LeadScore.post(leadId, { application });
			reply(req.app.leadScore).code(200);
			return next();
		},
	]);

module.exports = {
	list,
	put,
};
