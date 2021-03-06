const { fetchGuild } = require('../db/Mongo.js');
const { MessageEmbed } = require('discord.js');
var camelize = function camelize(str) {
    return str
        .replace(/\s(.)/g, function ($1) {
            return $1.toUpperCase();
        })
        .replace(/\s/g, '')
        .replace(/^(.)/, function ($1) {
            return $1.toLowerCase();
        });
};

module.exports = {
    name: 'setanti',
    async run(client, message, args) {
        let [type, state] = args;
        type = type ? type.toLowerCase() : '';
        state = state ? state.toLowerCase() : '';

        const truthy = ['yes', 'true', 'on', 'enable', 'enabled'];
        const falsy = ['no', 'false', 'off', 'disable', 'disabled'];

        let embed = new MessageEmbed();
        let errors = 0;

        if (!['antilink', 'antiswear'].includes(type)) {
            embed.addField(`:x: Preference not found`, `Got \`${type}\`, expected **antilink** or **antiswear**.`);
            errors += 1;
        }

        if (!message.member.permissions.has('MANAGE_GUILD')) {
            embed.addField(':x: Invalid permissions', 'You must have the `MANAGE_GUILD` permission to execute this command.');
            errors += 1;
        }

        if (!truthy.includes(state) && !falsy.includes(state)) {
            embed.addField(
                ':x: Invalid preference state',
                `Preferences must be either **enable**d or **disable**d, but got \`${state}\`.\n**Valid States:**\nEnable: \`${truthy.join(
                    '`, `'
                )}\`\nDisable: \`${falsy.join('`, `')}\``
            );
            errors += 1;
        }

        if (errors) {
            embed
                .setTitle(`${errors != 1 ? 'Errors' : 'Error'} found with command ${this.name}`)
                .setDescription(`Command syntax: \`!${this.name} <antilink/antiswear> <enable/disable>\``)
                .setColor('RED')
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }

        const Guild = await fetchGuild(message.guild.id);
        Guild.config.automod[type] = truthy.includes(state) ? true : false;
        await Guild.save();

        embed
            .addField(
                ':white_check_mark: Success!',
                `Successfuly **${truthy.includes(state) ? 'enabled' : 'disabled'}** the **${type}** filter in **${message.guild.name}**.`
            )
            .setColor('GREEN');
        return message.channel.send({ embeds: [embed] });
    },
};
