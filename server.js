const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/amounts', require('./routes/amount'));
app.use('/api/interest-rates', require('./routes/interestRateRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));
app.use('/api', require('./routes/dashboard'));
app.use('/api/balances', require('./routes/balances'));
app.use('/api/resignations', require('./routes/resignation')); // Ensure path is correct

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));