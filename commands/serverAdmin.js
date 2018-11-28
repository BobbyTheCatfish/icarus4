const Augur = require("augurbot"),
  u = require('../utils/utils.js');

const Module = new Augur.Module()
.addCommand({name: "settings",
  description: "Update Server Settings",
  syntax: "<botspam | prefix | language> <value>",
  info: "Updates server-specific settins.\n**SERVER ADMINS ONLY**\n* botspam #channel | here | none\n* prefix !\n* language EN | FR",
  aliases: ["setting", "set"],
  category: "Server Admin",
  hidden: true,
  process: function(msg, suffix) {
    let args = suffix.split(" ");

    if (args.length < 2) {
      msg.reply("you need to tell me both a setting and a value.")
      .then(u.clean);
      return;
    }

    let setting = args.shift().toLowerCase();
    let value = args.join(" ").trim();

    if ((setting == "botspam") || (setting == "spam")) {
      // BOT SPAM
      if (msg.mentions.channels.size > 0) {
        // SAVE BY MENTION
        Module.db.server.saveSetting(msg.guild, 'botspam', msg.mentions.channels.first().id);
        msg.react("👌");
      } else if ((value == "none") || (value == "false")) {
        // REMOVE BOTSPAM
        Module.db.server.updateSetting(msg.guild, 'botspam', null);
        msg.react("👌);
      } else {
        // SAVE BY CHANNEL NAME
        let channel = null;
        if (value == "here") {
          channel = msg.channel;
        } else {
          channel = msg.guild.channels.find('name', value);
        }
        if (channel) {
          Module.db.server.saveSetting(msg.guild, 'botspam', channel.id);
          msg.react("👌);
        } else {
          msg.reply("you need to tell me which channel to use.")
          .then(u.clean).catch(console.error);
        }
      }
    } else if ((setting == 'prefix') || (setting == 'command')) {
      // PREFIX
      let userMentions = u.userMentions(msg);
      if (userMentions && ((userMentions.size > 1) || ((userMentions.size == 1) && (userMentions.first().id != bot.user.id)))) {
        msg.reply("you cannot set the command prefix to mention any user but me.").then(u.clean);
      } else {
        Module.db.server.saveSetting(msg.guild, 'prefix', value);
        msg.react("👌");
      }
    } else if ((setting == 'language') || (setting == 'locale')) {
      let locales = ["EN"];
      if (locales.includes(value.toUpperCase())) {
        Module.db.server.saveSetting(msg.guild, "language", value.toUpperCase());
        msg.react("👌");
      } else {
        msg.reply("Available languages include: " + locales.join(", "))
        .then(u.clean).catch(console.error);
      }
    }
  },
  permissions: (msg) => (msg.guild && (msg.member.permissions.has('MANAGE_GUILD') || msg.member.permissions.has('ADMINISTRATOR') || Module.config.adminId.includes(msg.author.id)))
});

module.exports = Module;
