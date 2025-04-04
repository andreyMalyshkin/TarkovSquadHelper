import express from 'express';
import { fetchData } from './fetchData';
import { Item } from './models';
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

async function autoUpdateItems() {
    try {
        logger.info('⏰ Starting auto-update of items...');
        const items = await fetchData();
        await Item.deleteMany({});
        await Item.insertMany(items);
        logger.info('✅ Auto-update complete!');
    } catch (error) {
        logger.error('❌ Auto-update error:', error);
    }
}

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

autoUpdateItems();

setInterval(autoUpdateItems, 5 * 60 * 1000);

export default app;