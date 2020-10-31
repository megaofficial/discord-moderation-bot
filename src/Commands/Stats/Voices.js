const { Client, Message, MessageEmbed, MessageAttachment } = require("discord.js");
const Stat = require("../../Utils/Schemas/Stat");

const moment = require("moment");
require("moment-duration-format");

const TimeManager = require("../../Utils/Managers/TimeManager");
const tm = new TimeManager();

const ChartManager = require("../../Utils/Managers/ChartManager");
const cm = new ChartManager();


/**
 * @param {Client} client 
 * @param {Message} message 
 * @param {Array<String>} args 
 */
module.exports.execute = async (client, message, args) => {
    let victim = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author;

    let embed = new MessageEmbed()
        .setAuthor(victim.username, victim.avatarURL({ dynamic: true }))
        .setFooter(`${message.guild.name} sunucusuda ${victim.username} kişisinin bilgileri.`)

    let data = await Stat.findOne({ Id: victim.id });
    if (!data) data = {};
    let day = await tm.getDay(message.guild.id);
    embed.setDescription(`${victim} kişisinin ${day} gün boyunca yapmış olduğu ses aktifliği aşağıda detaylı olarak sıralanmıştır. Bir önceki güne gitmek için yöneticiye başvurunuz.`);
    embed.setColor("2f3136");

    let dataValue = [];
    let dataDate = [];
    let dataColors = [];

    if (data.Voice) {
        let günlükses = 0, haftalıkses = 0, aylıkses = 0, toplamses = 0;
        let days = Object.keys(data.Voice);

        let haftalık = {}, aylık = {}, günlük = [];

        days.forEach(_day => {
            let sum = Object.values(data.Voice[_day]).reduce((x, y) => x + y, 0);
            toplamses += sum;
            // 9
            dataValue.push(convert(sum));

            let date = new Date(Date.now() - (1000 * 60 * 60 * 24 * (day - _day))).toDateString();
            // 2020-10-29
            dataDate.push(date);
            dataColors.push( 'rgba(0, 92, 210, 0.5)');


            if (day == Number(_day)) {
                günlükses += sum;
                günlük = Object.keys(data.Voice[_day]).map(e => Object.assign({ Channel: e, Value: data.Voice[_day][e] }));
            }
            if (_day <= 7) {
                haftalıkses += sum;
                let keys = Object.keys(data.Voice[_day]);
                keys.forEach(key => {
                    if (haftalık[key]) haftalık[key] += data.Voice[_day][key];
                    else haftalık[key] = data.Voice[_day][key];
                });
            }
            if (_day <= 30) {
                aylıkses += sum;
                let keys = Object.keys(data.Voice[_day]);
                keys.forEach(key => {
                    if (aylık[key]) aylık[key] += data.Voice[_day][key];
                    else aylık[key] = data.Voice[_day][key];
                });
            }
        });
        embed.addField("**Günlük Ses İstatistiği**", `
        __Toplam:__ ${moment.duration(günlükses).format("H [saat, ] m [dakika]")}

        ${günlük.sort((x, y) => y.Value - x.Value).splice(0, 5).map((data, index) => {
            let channel = message.guild.channels.cache.get(data.Channel);
            return `\`${index + 1}.\` #${channel ? channel.name : "deleted-channel"}: \`${moment.duration(data.Value).format("H [saat, ] m [dakika]")}\``;
        }).join("\n")}\n\n** **
        `);

        embed.addField("**Haftalık Ses İstatistiği**", `
        __Toplam:__ ${moment.duration(haftalıkses).format("H [saat, ] m [dakika]")}

        ${Object.keys(haftalık).sort((x, y) => haftalık[y] - haftalık[x]).splice(0, 5).map((data, index) => {
            let channel = message.guild.channels.cache.get(data);
            return `\`${index + 1}.\` #${channel ? channel.name : "deleted-channel"}: \`${moment.duration(haftalık[data]).format("H [saat, ] m [dakika]")}\``;
        }).join("\n")}\n\n** **
        `);

        embed.addField("**Aylık Ses İstatistiği**", `
        __Toplam:__ ${moment.duration(aylıkses).format("H [saat, ] m [dakika]")}

        ${Object.keys(aylık).sort((x, y) => aylık[y] - aylık[x]).splice(0, 5).map((data, index) => {
            let channel = message.guild.channels.cache.get(data);
            return `\`${index + 1}.\` #${channel ? channel.name : "deleted-channel"}: \`${moment.duration(aylık[data]).format("H [saat, ] m [dakika]")}\``;
        }).join("\n")}\n\n** **
        `);

        embed.addField(`Genel Ses İstatistiği`, `
        __Toplam:__ ${moment.duration(toplamses).format("H [saat, ] m [dakika]")}

        Günlük: \`${moment.duration(günlükses).format("H [saat, ] m [dakika]")}\`
        Haftalık: \`${moment.duration(haftalıkses).format("H [saat, ] m [dakika]")}\`
        Aylık: \`${moment.duration(aylıkses).format("H [saat, ] m [dakika]")}\`
        `, true)
    }
    else {
        embed.setDescription("Herhangi bir kayıt bulunamadı.");
    }

    let buffer = await cm.ImageFromData({
        width: 600,
        height: 290,
        type: 'line',
        
        data: {
            labels: [].concat(dataDate),
            datasets: [{
                label: "Toplam Ses İstatistiği (Gün)",
                data: [].concat(dataValue),
                backgroundColor: [
                    'rgba(0, 112, 255, 0.25)'
                ],
                borderColor: [].concat(dataColors),
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        callback: (value) => '$' + value
                    }
                }]
            }
        }
    });

    embed.setImage("attachment://Graph.png");
    let attachment = new MessageAttachment(buffer, "Graph.png");

    message.channel.send({
        embed: embed,
        files: [attachment]
    });
}


function convert(ms) {
    return (ms / (1000 * 60)).toFixed(0);
}

module.exports.settings = {
    Commands: ["voicestats", "sesler"],
    Usage: "",
    Description: "",
    Activity: true
}