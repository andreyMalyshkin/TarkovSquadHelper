import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import router from './routes';
import logger from './logger';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.DB_URI as string)
    .then(() => logger.info('Connected to MongoDB'))
    .catch(err => {
        logger.error('MongoDB connection error:', err);
        process.exit(1);
    });

app.use('/', router);

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});