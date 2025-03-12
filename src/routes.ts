import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { Item, getDynamicModel } from './models';
import { fetchData } from './fetchData';
import logger from './logger';

const router = express.Router();

const generateRandomName = () => crypto.randomBytes(8).toString('hex');

router.get('/items', async (req, res) => {
    logger.info (`Request: items`)
    try {
        const items = await Item.find();
        res.json(items);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/update', async (req, res) => {
    try {
        logger.info(`Start updating data in db`)
        const items = await fetchData();
        await Item.deleteMany({});
        logger.info(`Delete old data`)
        await Item.insertMany(items);
        res.json({ message: 'Data updated' });
        logger.info (`Date downloaded and writen to DB`)
    } catch (error) {
        logger.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update data' });
    }
});

router.get('/search', async (req, res) => {
    try {
        const query = req.query.q?.toString();
        if (!query) {
            res.status(400).json({ error: 'Query parameter "q" is required' });
            return 
        }

        const results = await Item.find({
            name: { $regex: query, $options: 'i' },
        });

        res.json(results);
        logger.info(`Search compleated: ${results}`)
    } catch (error) {
        logger.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/createCollection', async (req, res) => {
    try {
        const tableName = generateRandomName();
        await mongoose.connection.createCollection(tableName);
        res.json({ message: `Collection '${tableName}' created successfully` });
        logger.info(`Collection for room created: collection.id: ${tableName}`)
    } catch (error) {
        logger.error('Error creating collection:', error);
        res.status(500).json({ error: 'Failed to create collection' });
    }
});

router.post('/addItemsToCollection', async (req, res) => {
    try {
        const { tableName, item } = req.body;

        if (!tableName || typeof tableName !== 'string') {
            res.status(400).json({ error: 'Invalid or missing tableName' });
            return 
        }

        if (!item || !item.id || !item.name || !item.price) {
            res.status(400).json({ error: 'Invalid item data' });
            return 
        }
        
        const DynamicModel = getDynamicModel(tableName);
        const newItem = new DynamicModel(item);
        await newItem.save();

        res.json({ message: `Item added to '${tableName}'`, item: newItem });

        logger.info(`Items was added to collection: ${tableName} with item ${req.body.item.id}`)
    } catch (error) {
        logger.error('Error adding item:', error);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

router.get('/getitemsFromCollection', async (req, res) => {
    try {
        const tableName = req.query.tableName?.toString();

        if (!tableName) {
            res.status(400).json({ error: 'Query parameter "tableName" is required' });
            return 
        }

        const db = mongoose.connection.useDb(mongoose.connection.name);
        const collections = await db.listCollections();
        const collectionNames = collections.map((col) => col.name);

        if (!collectionNames.includes(tableName)) {
            res.status(404).json({ error: `Collection '${tableName}' not found` });
            return 
        }

        const DynamicModel = mongoose.models[tableName] || mongoose.model(tableName, new mongoose.Schema({}, { strict: false }));
        const items = await DynamicModel.find();

        res.json(items);
        logger.info(`Success find items from collection: ${tableName}`)
    } catch (error) {
        logger.error('Error fetching items:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

export default router;
