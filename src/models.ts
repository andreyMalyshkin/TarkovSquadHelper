import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    link: { type: String, required: false },
});

export const Item = mongoose.model('Item', itemSchema);

export const getDynamicModel = (tableName: string) => {
    if (mongoose.models[tableName]) {
        return mongoose.models[tableName];
    }

    return mongoose.model(tableName, new mongoose.Schema({
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        link: { type: String, required: false },
        count: { type: Number, required: false },
        nickName: { type: String, required: true }
    }, {
        strict: true,
        versionKey: false
    }));
};
