const mongoose = require('mongoose');

const balanceSchema = new mongoose.Schema({
  amount: { 
    type: Number, 
    required: true 
  },
  note: { 
    type: String, 
    required: false, 
    default: '' 
  },
  date: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Balance', balanceSchema);