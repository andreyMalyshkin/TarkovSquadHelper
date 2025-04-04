import express from 'express';
import mongoose from 'mongoose';
import { Model, Document } from 'mongoose';
import crypto from 'crypto';
import { Item, getDynamicModel } from './models';
import logger from './logger';
import * as util from "node:util";

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

router.get('/search', async (req, res) => {
    try {
        const query = req.query.q?.toString();
        logger.info (`Request: search ${query}`)
        if (!query) {
            res.status(400).json({ error: 'Query parameter "q" is required' });
            return 
        }

        const results = await Item.find({
            name: { $regex: query, $options: 'i' },
        });

        res.json(results);
        // logger.info(`Search compleated: ${results}`)
    } catch (error) {
        logger.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/createCollection', async (req, res) => {
    try {
        logger.info (`Request: createCollection `)
        const tableName = generateRandomName();
        await mongoose.connection.createCollection(tableName);
        res.json({ message: `${tableName}`});
        logger.info(`Collection for room created: collection.id: ${tableName}`)
    } catch (error) {
        logger.error('Error creating collection:', error);
        res.status(500).json({ error: 'Failed to create collection' });
    }
});

router.post('/addItemsToCollection', async (req, res) => {
    try {
        logger.info (`Request: addItemsToCollection `)

        const { tableName, item } = req.body;

        if (!tableName || typeof tableName !== 'string') {
            res.status(400).json({ error: 'Invalid or missing tableName' });
            return 
        }

        if (!item || !item.key || !item.name) {
            res.status(400).json({ error: `Invalid item data` });
            return 
        }
        
        const DynamicModel = getDynamicModel(tableName);
        logger.trace(util.inspect(DynamicModel.schema,false,4,true))

        // @ts-ignore
        const existingItem = await DynamicModel.findOne({ key: item.key, nickName: item.nickName });


        if (existingItem) {
            existingItem.count += 1;
            await existingItem.save();

            res.json({ message: `Item found and updated in '${tableName}'`, item: existingItem });

            logger.info(`Item updated in collection: ${tableName} with item ${item.key}, new count: ${existingItem.count}`);
        } else {
            const newItem = new DynamicModel(item);
            await newItem.save();

            res.json({ message: `Item added to '${tableName}'`, item: newItem });

            logger.info(`Item added to collection: ${tableName} with item ${item.key}`);
        }
    } catch (error) {
        logger.error('Error adding item:', error);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

router.delete('/deleteItemFromCollection', async (req, res) => {
    try {
        logger.info (`Request: deleteItemFromCollection `)

        const { tableName, item } = req.body;

        if (!tableName || typeof tableName !== 'string') {
            res.status(400).json({ error: 'Invalid or missing tableName' });
            return 
        }

        if (!item || !item.key || !item.nickName) {
            res.status(400).json({ error: 'Invalid item data (id & nickName required)' });
            return 
        }
        
        const db = mongoose.connection.useDb(mongoose.connection.name);
        const collections = await db.listCollections();
        const collectionNames = collections.map((col) => col.name);

        if (!collectionNames.includes(tableName)) {
            res.status(404).json({ error: `Collection '${tableName}' not found` });
            return;
        }

        const DynamicModel = getDynamicModel(tableName);
        const result = await DynamicModel.deleteOne({ key: item.key, nickName: item.nickName });

        if (result.deletedCount === 0) {
            res.status(404).json({ error: `Item with id '${item.key}' not found in '${tableName}'` });
            logger.warn(`Item not found: ${item.key} in ${tableName}`);
            return;
        }

        res.json({ message: `Item '${item.keyk}' for user '${item.nickName}' deleted from '${tableName}'` });
        logger.info(`Deleted item ${item.key} for user ${item.nickName} from collection ${tableName}`);

    } catch (error) {
        logger.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// @ts-ignore
router.get('/getitemsFromCollection', async (req, res) => {
    try {
        const tableName = req.query.tableName?.toString();
        logger.info(`Request: getitemsFromCollection for ${tableName}`);

        if (!tableName) {
            res.status(400).json({ error: 'Query parameter "tableName" is required' });
            return;
        }

        const db = mongoose.connection.useDb(mongoose.connection.name);
        const nativeDb = db.db;

        // @ts-ignore
        const collections = await nativeDb.listCollections().toArray();
        const collectionExists = collections.some(col => col.name === tableName);

        if (!collectionExists) {
            return res.status(404).json({ error: `Collection "${tableName}" not found` });
        }

        // @ts-ignore
        const items = await nativeDb.collection(tableName).find().toArray();

        logger.info(items)

        logger.info(`Successfully fetched items from collection: ${tableName}`);
        return res.json({ items });
    } catch (error) {
        logger.error('Error fetching items:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

router.post('/increaseItemCount', async (req, res) => {
    try {

        const { tableName, item, amount } = req.body;
        logger.trace(`Request: decreaseItemCount ${tableName} ${item} ${amount}`)

        if (!tableName || typeof tableName !== 'string') {
            res.status(400).json({ error: 'Invalid or missing tableName' });
            return 
        }

        if (!item || !item.key || !item.nickName) {
            res.status(400).json({ error: 'Invalid item data (key & nickName required)' });
            return 
        }

        const incAmount = parseInt(amount) || 1;

        const db = mongoose.connection.useDb(mongoose.connection.name);
        const collections = await db.listCollections();
        const collectionNames = collections.map((col) => col.name);
        

        if (!collectionNames.includes(tableName)) {
            res.status(404).json({ error: `Collection '${tableName}' not found` });
            return 
        }

        const DynamicModel = getDynamicModel(tableName);

        const result:any = await (DynamicModel as Model<Document>).findOneAndUpdate(
            { key: item.key, nickName: item.nickName },
            { $inc: { count: incAmount } },
            { new: true }
          );

        if (!result) {
            res.status(404).json({ error: `Item '${item.key}' for user '${item.nickName}' not found` });
            return 
        }

        res.json({ message: `Increased count of item '${item.key}' for '${item.nickName}'`, newCount: result.count });
        logger.info(`Increased count for item ${item.key} (nickName: ${item.nickName}) in ${tableName}`);
    } catch (error) {
        logger.error(`Error increasing item count: ${error}`);
        res.status(500).json({ error: 'Failed to increase count' });
    }
});

router.post('/decreaseItemCount', async (req, res) => {
    try {

        const { tableName, item, amount } = req.body;
        logger.trace (`Request: decreaseItemCount ${tableName} ${item} ${amount}`)

        if (!tableName || typeof tableName !== 'string') {
            res.status(400).json({ error: 'Invalid or missing tableName' });
            return 
        }

        if (!item || !item.key || !item.nickName) {
            res.status(400).json({ error: 'Invalid item data (id & nickName required)' });
            return 
        }

        const decAmount = parseInt(amount) || 1;

        const db = mongoose.connection.useDb(mongoose.connection.name);
        const collections = await db.listCollections();
        const collectionNames = collections.map((col) => col.name);

        if (!collectionNames.includes(tableName)) {
            res.status(404).json({ error: `Collection '${tableName}' not found` });
            return 
        }

        const DynamicModel = getDynamicModel(tableName);

        const existingItem:any = await (DynamicModel as Model<Document>).findOne({ key: item.key, nickName: item.nickName });

        if (!existingItem) {
            res.status(404).json({ error: `Item '${item.key}' for user '${item.nickName}' not found` });
            return
        }

        if (existingItem.count < decAmount) {
            res.status(400).json({ error: `Cannot decrease. Current count is ${existingItem.count}` });
            return 
        }

        existingItem.count -= decAmount;
        await existingItem.save();

        res.json({ message: `Decreased count of item '${item.key}' for '${item.nickName}'`, newCount: existingItem.count });
        logger.info(`Decreased count for item ${item.id} (nickName: ${item.nickName}) in ${tableName}`);
    } catch (error) {
        logger.error(`Error decreasing item count: ${error}`);
        res.status(500).json({ error: 'Failed to decrease count' });
    }
});

export default router;
