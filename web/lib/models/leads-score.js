const service = process.env.LEADS_SERVICE;
const Transport = require('../transports/http');

class LeadScore {
  constructor() {
    this.transport = new Transport({
      baseUrl: `http://${service}:5000/`,
      json: true,
    });
  }
  get(id) {
    return this.transport.get(`leads_score/${id}`);
  }
  post(id, lead) {
    return this.transport.post(`leads_score/${id}`, { body: { lead } });
  }
}
module.exports = new LeadScore();
