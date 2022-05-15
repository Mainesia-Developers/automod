const GuildSchema = require('./schema/Guild.js')

/**
 * Fetch a guild from the database by its ID. If the guild does not exist, it will be created.
 * @param {string} key The ID of the guild.
 * @returns {Promise<GuildSchema>} Guild object from database.
 */
exports.fetchGuild = async (key) => {
    let guildDB = await GuildSchema.findOne({ id: key })
    if (guildDB) return guildDB
    else {
        guildDB = new GuildSchema({
            id: key,
            registeredAt: Date.now(),
            config: {
                automod: {
                    antilink: true,
                    antiswear: true,
                },
            },
        })

        await guildDB.save().catch((err) => console.log(err))
        console.log(`Registered guild with ID ${guildDB.id} at ${Date(guildDB.registeredAt)}`)
        return guildDB
    }
}
