const mongoose = require('mongoose');
const { Model, Schema } = mongoose;

GuildSchema = mongoose.model(
    'Guild',
    new Schema({
        id: { type: String },
        registeredAt: { type: Number, default: Date.now() },
        config: {
            automod: {
                antilink: { type: Boolean, default: true },
                antiswear: { type: Boolean, default: true },
            },
        },
    })
);

module.exports = GuildSchema;
