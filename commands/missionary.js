const Augur = require("augurbot"),
  u = require("../utils/utils");

function parseMission(str) {
  let date = new RegExp("(" + [
    "january", "jan",
    "february", "feb",
    "march", "mar",
    "april", "apr",
    "may",
    "june", "jun",
    "july", "jul",
    "august", "aug",
    "september", "sept", "sep",
    "october", "oct",
    "november", "nov",
    "december", "dec"
  ].join("|") + ") 20\\d\\d", "i");

  let email = /\w+(\.?\w+)*@\w+(\.\w+)+/;
  let discord = /<@!?(\d+)>/;

  let discordId = discord.exec(str);
  if (discordId) discordId = discordId[1];
  else return {error: "I couldn't find a Discord ID"};

  let address = email.exec(str);
  if (address) address = address[0];
  else return {error: "I couldn't find an email address"};

  let homecoming = date.exec(str);
  if (homecoming) homecoming = u.properCase(homecoming[0]);

  let mission = u.properCase(str.replace(discord, "").replace(date, "").replace(email, "").trim());

  return {
    discordId: discordId,
    email: address,
    mission: mission,
    returns: homecoming
  };
};

const Module = new Augur.Module()
.addCommand({name: "newmission",
  syntax: "@user email@myldsmail.net <mission> <month year>",
  description: "Add a new missionary to the database",
  hidden: true,
  category: "Mission",
  permissions: (msg) => Module.config.adminId.includes(msg.author.id),
  process: async (msg, suffix) => {
    try {
      let missionData = parseMission(suffix);
      if (missionData.error) msg.reply(missionData.error).then(u.clean);
      else {
        let mission = await Module.db.mission.save(missionData);
        let member = await msg.guild.members.fetch(missionData.discordId);
        if (member) msg.channel.send(`Saved data for **${member.displayName}**`).then(u.clean);
      }
    } catch(error) { u.errorHandler(error, msg); }
  }
})
.addCommand({name: "missionreturn",
  syntax: "@user",
  description: "Remove a user from the missionary list",
  hidden: true,
  category: "Mission",
  permissions: (msg) => Module.config.adminId.includes(msg.author.id),
  process: async (msg) => {
    try {
      for (let [id, member] of msg.mentions.members) {
        await Module.db.mission.delete(member.id);
        msg.reply(`I removed ${member.displayName} from the missionary list!`).then(u.clean);
      }
    } catch(error) { u.errorHandler(error, msg); }
  }
})
.addCommand({name: "missionaries",
  description: "Displays LDSG Missionaries (that we know about)",
  category: "Mission",
  hidden: true,
  process: async (msg) => {
    try {
      let missionaries = await Module.db.mission.findAll();
      let members = await Promise.all(missionaries.map(m => msg.guild.fetchMember(m.discordId)));
      members = members.map((m, i) => `**${m.displayName}**: ${missionaries[i].mission} Mission, returns ${missionaries[i].returns}`);
      msg.channel.send("**Current LDSG Missionaries:**\n" + members.join("\n"));
    } catch(error) { u.errorHandler(error, msg); }
  }
});

module.exports = Module;
