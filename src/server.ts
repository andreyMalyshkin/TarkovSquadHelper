import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fetchData } from './fetchData';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.DB_URI as string)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

const generateRandomName = () => {
    return crypto.randomBytes(8).toString('hex'); // 16 случайных символов
};

const itemSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    link: { type: String, required: false },
});
const Item = mongoose.model('Item', itemSchema);

app.get('/items', async (req, res) => {
    console.log(`Получен запрос ${req}`);
    try {
        const items = await Item.find();
        res.json(items);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/update', async (req, res) => {
    console.log(`Получен запрос ${req}`);
    try {
        const items = await fetchData();
        await Item.deleteMany({});
        await Item.insertMany(items);
        res.json({ message: 'Data updated' });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update data' });
    }
});

app.get('/search', async (req, res) => {
    console.log(`Получен запрос ${req.query.q?.toString()}`);
    try {
        const query = req.query.q?.toString();
        if (!query) {
            res.status(400).json({ error: 'Query parameter "q" is required' });
            return; 
        }

        const results = await Item.find({
            name: { $regex: query, $options: 'i' },
        });

        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

app.post('/createCollection', async (req, res) => {
    try {
        const tableName = generateRandomName();

        await mongoose.connection.createCollection(tableName);
        
        res.json({ message: `Collection '${tableName}' created successfully` });
    } catch (error) {
        console.error('Error creating collection:', error);
        res.status(500).json({ error: 'Failed to create collection' });
    }
});

app.post('/addItemsToCollection', async (req, res) => {
    try {
        const { tableName, item } = req.body; 
        
        if (!tableName || typeof tableName !== 'string') {
            res.status(400).json({ error: 'Invalid or missing tableName' });
            return;
        }

        if (!item || !item.id || !item.name || !item.price) {
            res.status(400).json({ error: 'Invalid item data' });
            return; 
        }

        const DynamicModel = mongoose.models[tableName] || mongoose.model(tableName, new mongoose.Schema({
            id: { type: String, required: true, unique: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            link: { type: String, required: false },
        }));

        const newItem = new DynamicModel(item);
        await newItem.save();

        res.json({ message: `Item added to '${tableName}'`, item: newItem });
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

app.get('/getitemsFromCollection', async (req, res) => {
    try {
        const tableName = req.query.tableName?.toString();

        if (!tableName) {
            res.status(400).json({ error: 'Query parameter "tableName" is required' });
            return 
        }

        const db = mongoose.connection.useDb(mongoose.connection.name);
        const collections = await db.listCollections();
        const collectionNames = collections.map((col: { name: any; }) => col.name);

        if (!collectionNames.includes(tableName)) {
            res.status(404).json({ error: `Collection '${tableName}' not found` });
            return
        }

        const DynamicModel = mongoose.models[tableName] || mongoose.model(tableName, new mongoose.Schema({}, { strict: false }));
        const items = await DynamicModel.find();

        res.json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});