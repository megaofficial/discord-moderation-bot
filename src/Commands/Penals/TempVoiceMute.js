const {Client, Message} = require("discord.js");
const Settings = require("../../Configuration/Settings.json");
const Helper = require("../../Utils/Helper");

const PenalManager = require("../../Utils/Managers/PenalManager");
const PM = new PenalManager();

/**
 * @param {Client} client 
 * @param {Message} message 
 * @param {Array<String>} args 
 */
module.exports.execute = async (client, message, args) => {
    if(!message.member.hasPermission("ADMINISTRATOR") && Settings.Penals.Jail.AuthRoles.some(authRole => message.member.roles.cache.has(authRole))) return message.reply("yeterli yetkin yok.");

    let victim = message.mentions.users.first() || client.users.cache.get(args[0]) || await Helper.GetUser(args[0]);
    if(!victim) return message.reply(`birisini etiketlemelisin.`);

    let time = args[1];
    if(!time || !ms(time)) return message.reply("lütfen geçerli bir süre girin.");

    let reason = args.splice(2).join(" ");
    if(!reason) return message.reply("bir sebep belirtmelisin.");

    let member = await message.guild.getMember(victim.id);
    if(member && member.roles.highest.position >= message.member.roles.highest.position) return message.reply("senin rolünden üstte ya da aynı roldeki birisini sesli susturamazsın.")

    if(member && member.manageable) {
        member.roles.add(Settings.Penals.Mute.Role);
        if(member.voice.channelID && !member.voice.serverMute) member.voice.setMute(true);
    }

    let document = await PM.addPenal(victim.id, message.author.id, PenalManager.Types.TEMP_VOICE_MUTE, reason, true, Date.now(), Date.now() + time);

    message.channel.csend(`**${victim}(${victim.username})** kullanıcısı ${message.author}(${message.author.username}) tarafından **"${reason}"** sebebiyle  geçici olarak sesli susturuldu. (Ceza Numarası: \`#${document.Id}\`)`)
    message.guild.log(message.author, victim, document, Settings.Penals.Jail.Log);
}

module.exports.settings = {
    Commands: ["mute", "sustur"],
    Usage: "",
    Description: "",
    Activity: true
}