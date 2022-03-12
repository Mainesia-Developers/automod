const { Client, Intents, Collection } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const fs = require('fs');
const { readdirSync } = require('fs');
const { join } = require('path');
const db = require('quick.db');

const dotenv = require('dotenv');
dotenv.config();
const { PREFIX, TOKEN } = process.env;

client.on('ready', () => {
    client.user.setActivity('for profanity', { type: 'WATCHING' });
    console.log('Bot is ready!');
});

// command handler
client.commands = new Collection();

const commandFiles = readdirSync(join(__dirname, 'commands')).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(join(__dirname, 'commands', `${file}`));
    client.commands.set(command.name, command);
}

client.on('error', console.error);

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (db.get(`${message.guild.id}.automod.antilink`)) {
        const discordLinks = ['discord.gg', 'discord.me', 'discord.io', 'discord.com', 'discordapp.com', 'discord.app', 'discord.gift'];
        const messageHasDiscordURL = discordLinks.some((discordLink) => message.content.includes(discordLink));

        const link = /(http|https)?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
        if (link.test(message.content) || messageHasDiscordURL) {
            message.delete().catch(() => {});
            message.channel.send(`<@${message.author.id}>, ${messageHasDiscordURL ? 'Discord-based' : ''} links are not allowed in this server.`);
        }
    }

    if (db.get(`${message.guild.id}.automod.antiswear`)) {
        const swearwords = ['ukraine', 'russia', 'putin', 'ww3', 'u k r a i n e', 'r u s s i a', 'p u t i n', 'taiwan', 't a i w a n', 'w w 3'];
        const swear = new RegExp(swearwords.join('|'), 'gi');

        if (swear.test(message.content)) {
            message.delete().catch(() => {});
            message.channel.send(`<@${message.author.id}>, you are not permitted to talk about politics in this server.`);
        }
    }

    if (message.content.startsWith(PREFIX)) {
        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (!client.commands.has(command)) return;

        try {
            client.commands.get(command).run(client, message, args);
        } catch (error) {
            console.error(error);
        }
    }
});

client.login(TOKEN);
