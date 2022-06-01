const { Client, Intents, Collection, Permissions } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const { readdirSync } = require('fs');
const { join } = require('path');

const dotenv = require('dotenv');
dotenv.config();
const { PREFIX, TOKEN, MONGODB } = process.env;

const mongoose = require('mongoose');
const { fetchGuild } = require('./db/Mongo.js');
const connectDB = async () => {
    await mongoose
        .connect(MONGODB, { dbName: 'mainesia-automod' })
        .then(() => {
            console.log('Connected to database');
        })
        .catch((err) => {
            console.log(`Unable to connect to MongoDB Database.\nError: ${err}`);
        });
};

const express = require('express');
const app = express();

app.set('port', process.env.PORT || 5000);

app.get('/', (req, res) => {
    let result = 'Bot is running! Check the project for logs.';
    res.send(result);
}).listen(app.get('port'), () => {
    console.log(`Bot is running, and server is listening to port ${app.get('port')}`);
});

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
    const Guild = await fetchGuild(message.guild.id);

    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith(PREFIX)) {
        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (!client.commands.has(command)) return;

        try {
            return client.commands.get(command).run(client, message, args);
        } catch (error) {
            console.error(error);
        }
    }

    const canSendInChannel = message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.SEND_MESSAGES);

    const excludedChannels = ['897146846873518231', '887952258917089331', '868122392126431282', '914552216583569449'];
    const excludedPerms = [Permissions.FLAGS.MANAGE_GUILD];

    if (
        excludedPerms.some((flag) => message.member.permissionsIn(message.channel).has(flag)) ||
        excludedChannels.some((channelId) => message.channel.id == channelId)
    )
        return;

    if (Guild.config.automod.antilink) {
        const discordLinks = ['discord.gg', 'discord.me', 'discord.io', 'discord.com', 'discordapp.com', 'discord.app', 'discord.gift'];
        const messageHasDiscordURL = discordLinks.some((discordLink) => message.content.includes(discordLink));
        const warningMessageContent = `<@${message.author.id}>, ${messageHasDiscordURL ? 'Discord-based' : ''} links are not allowed in ${
            canSendInChannel == 'dm' ? `**${message.guild.name}**` : 'this server'
        }.`;

        const link = /(http|https)?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
        if (link.test(message.content) || messageHasDiscordURL) {
            message.delete().catch((e) => {
                console.log(`Couldn't delete the offending message. ${e}`);
            });

            return message[canSendInChannel ? 'channel' : 'author']
                .send(warningMessageContent)
                .then((msg) => {
                    setTimeout(
                        () =>
                            msg.delete().catch((e) => {
                                console.log(`I ran into an issue deleting a message: ${e}`);
                            }),
                        5000
                    );
                })
                .catch((e) => {
                    console.log(`Encountered an error: ${e}`);
                });
        }
    }

    if (Guild.config.automod.antiswear) {
        const swearwords = ['ukraine', 'russia', 'putin', 'ww3', 'u k r a i n e', 'r u s s i a', 'p u t i n', 'w w 3'];
        const swear = new RegExp(swearwords.join('|'), 'gi');
        const warningMessageContent = `<@${message.author.id}>, you are not permitted to talk about politics in ${
            canSendInChannel == 'dm' ? `**${message.guild.name}**` : 'this server'
        }.`;

        if (swear.test(message.content)) {
            message.delete().catch((e) => {
                console.log(`Couldn't delete the offending message. ${e}`);
            });

            return message[canSendInChannel ? 'channel' : 'author']
                .send(warningMessageContent)
                .then((msg) => {
                    setTimeout(
                        () =>
                            msg.delete().catch((e) => {
                                console.log(`I ran into an issue deleting a message. ${e}`);
                            }),
                        5000
                    );
                })
                .catch((e) => {
                    console.log(`Encountered an error. ${e}`);
                });
        }
    }
});

connectDB();
client.login(TOKEN);
