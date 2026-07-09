const dotenv = require('dotenv');

// 1. Call dotenv.config() before reading environment variables or importing app/db configs
dotenv.config();

const connectDB = require('./config/db.js');
const app = require('./app.js');

// Handle uncaught exceptions globally
process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const startServer = async () => {
  // 2 & 3. Connect to database and wait for connection before starting the server
  await connectDB();

  const port = process.env.PORT || 5000;
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}...`);
  });

  // Handle unhandled promise rejections globally
  process.on('unhandledRejection', err => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err);
    server.close(() => {
      process.exit(1);
    });
  });
};

startServer();
