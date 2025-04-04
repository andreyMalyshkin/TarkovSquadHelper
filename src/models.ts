import mongoose from 'mongoose';
import logger from "./logger";

const itemSchema = new mongoose.Schema({
    key: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    link: { type: String, required: false },
});

export const Item = mongoose.model('Item', itemSchema);

export const getDynamicModel = (tableName: string) => {
    if (mongoose.models[tableName]) {
        logger.info(`Берется из кэша ${tableName}`)
        return mongoose.models[tableName];
    }
    logger.info(`Берется новая ${tableName}`)
    return mongoose.model(tableName, new mongoose.Schema({
        key: { type: String, required: true },
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
