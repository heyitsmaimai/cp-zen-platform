const service = process.env.LEADS_SERVICE;
const Transport = require('../transports/http');

class LeadScore {
  constructor() {
    this.transport = new Transport({
      baseUrl: `http://${service}:3000/`,
      json: true,
    });
  }
  get(id) {
    return this.transport.get(`lead_score/${id}`);
  }
  post(id, application) {
    return this.transport.post(`lead_score/${id}`, { application });
  }
}
module.exports = new Lead();
