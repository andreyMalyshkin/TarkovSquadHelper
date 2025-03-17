import request from 'supertest';
import app from '../../src/server'
import mongoose from 'mongoose';

describe('TarkovSquadHelper API', () => {
    let collectionName: string = '';

    beforeAll(async () => {
        await mongoose.connect(process.env.DB_URI as string);
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    it('GET /items - should return all items', async () => {
        const res = await request(app).get('/items');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /search - should return 400 without query', async () => {
        const res = await request(app).get('/search');
        expect(res.statusCode).toBe(400);
    });

    it('POST /createCollection - should create a new collection', async () => {
        const res = await request(app).post('/createCollection');
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toContain('created successfully');
        const match = res.body.message.match(/Collection '(.+)' created successfully/);
        if (match) collectionName = match[1];
        expect(collectionName).not.toBe('');
    });

    it('POST /addItemsToCollection - should add item to the created collection', async () => {
        const itemData = {
            tableName: collectionName,
            item: {
                id: 'test-item-id',
                name: 'Test Item',
                price: 1000,
                count: 3,
                nickName: 'testUser'
            }
        };
        const res = await request(app)
            .post('/addItemsToCollection')
            .send(itemData);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toContain(`Item added to '${collectionName}'`);
    });

    it('GET /getitemsFromCollection - should return items from created collection', async () => {
        const res = await request(app).get(`/getitemsFromCollection?tableName=${collectionName}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].name).toBe('Test Item');
    });

    it('POST /increaseItemCount - should increase item count', async () => {
        const res = await request(app)
            .post('/increaseItemCount')
            .send({
                tableName: collectionName,
                item: { id: 'test-item-id', nickName: 'testUser' },
                amount: 2
            });
        expect(res.statusCode).toBe(200);
        expect(res.body.newCount).toBeGreaterThanOrEqual(5);
    });

    it('POST /decreaseItemCount - should decrease item count', async () => {
        const res = await request(app)
            .post('/decreaseItemCount')
            .send({
                tableName: collectionName,
                item: { id: 'test-item-id', nickName: 'testUser' },
                amount: 1
            });
        expect(res.statusCode).toBe(200);
        expect(res.body.newCount).toBeGreaterThanOrEqual(4);
    });

    it('DELETE /deleteItemFromCollection - should delete item from collection', async () => {
        const res = await request(app)
            .delete('/deleteItemFromCollection')
            .send({
                tableName: collectionName,
                item: { id: 'test-item-id', nickName: 'testUser' }
            });
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toContain(`deleted from '${collectionName}'`);
    });
});
