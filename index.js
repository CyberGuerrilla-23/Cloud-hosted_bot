const Discord = require('discord.js');
const { CommandoClient } = require('discord.js-commando');
const { Structures, MessageEmbed, MessageAttachment } = require('discord.js');
const path = require('path');
const { prefix, token, owners } = require('./config.json');
const db = require('quick.db');
const Canvas = require('canvas');
//const fs = require('fs');
//const { Command } = require('discord.js-commando');
//const config = require('./config.json');
//const client = new Discord.Client();
//const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
//const cooldowns = new Discord.Collection();
//const ytdl = require('ytdl-core');
//const Youtube = require('simple-youtube-api');
//const queue = new Map();
//client.commands = new Discord.Collection();
Structures.extend('Guild', function(Guild) {
    class MusicGuild extends Guild {
        constructor(client, data) {
            super(client, data);
            this.musicData = {
                queue: [],
                isPlaying: false,
                nowPlaying: null,
                songDispatcher: null,
                skipTimer: false, // only skip if user used leave command
                loopSong: false,
                loopQueue: false,
                volume: 1
            };
            this.triviaData = {
                isTriviaRunning: false,
                wasTriviaEndCalled: false,
                triviaQueue: [],
                triviaScore: new Map()
            };
        }
    }
    return MusicGuild;
});

const client = new CommandoClient({
    commandPrefix: prefix,
    owner: discord_owner_id
});

client.registry
    .registerDefaultTypes()
    .registerGroups([
        ['music', ':notes: Music Command Group:'],
        ['gifs', ':film_frames: Gif Command Group:'],
        ['other', ':loud_sound: Other Command Group:'],
        ['guild', ':gear: Guild Related Commands:']
    ])
    .registerDefaultGroups()
    .registerDefaultCommands({
        eval: false,
        prefix: false,
        commandState: false
    })
    .registerCommandsIn(path.join(__dirname, 'commands'));

client.once('ready', () => {
    console.log(`${client.user.tag} is Ready!`);
    client.user.setActivity(`${prefix}help`, {
        type: 'WATCHING',
        url: 'https://github.com/galnir/Master-Bot'
    });
    const Guilds = client.guilds.cache.map(guild => guild.name);
    console.log(Guilds, 'Connected!');
});

client.on('voiceStateUpdate', async(___, newState) => {
    if (
        newState.member.user.bot &&
        !newState.channelID &&
        newState.guild.musicData.songDispatcher &&
        newState.member.user.id == client.user.id
    ) {
        newState.guild.musicData.queue.length = 0;
        newState.guild.musicData.songDispatcher.end();
        return;
    }
    if (
        newState.member.user.bot &&
        newState.channelID &&
        newState.member.user.id == client.user.id &&
        !newState.selfDeaf
    ) {
        newState.setSelfDeaf(true);
    }
});

client.on('guildMemberAdd', async member => {
    const welcomeGuildFetch = db.get(member.guild.id);
    if (!welcomeGuildFetch) return;

    const welcomeMessageSetting = welcomeGuildFetch.welcomeMsgStatus;
    if (welcomeMessageSetting == 'no') return;

    if (welcomeMessageSetting == 'yes') {
        const applyText = (canvas, text) => {
            const ctx = canvas.getContext('2d');
            let fontSize = 70;

            do {
                ctx.font = `${(fontSize -= 10)}px sans-serif`;
            } while (ctx.measureText(text).width > canvas.width - 300);

            return ctx.font;
        };
        // Custom Welcome Image for new members
        const canvas = Canvas.createCanvas(700, 250); // Set the dimensions (Width, Height)
        const ctx = canvas.getContext('2d');

        const background = await Canvas.loadImage(
            './resources/welcome/wallpaper.jpg' // can add what ever image you want for the Background just make sure that the filename matches
        );
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#000000'; // the color of the trim on the outside of the welcome image
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        ctx.font = '26px sans-serif';
        ctx.fillStyle = '#FFFFFF'; // Main Color of the Text on the top of the welcome image
        ctx.fillText(
            `Welcome to ${member.guild.name}`,
            canvas.width / 2.5,
            canvas.height / 3.5
        );
        ctx.strokeStyle = `#FFFFFF`; // Secondary Color of Text on the top of welcome for depth/shadow the stroke is under the main color
        ctx.strokeText(
            `Welcome to ${member.guild.name}`,
            canvas.width / 2.5,
            canvas.height / 3.5
        );

        ctx.font = applyText(canvas, `${member.displayName}!`);
        ctx.fillStyle = '#FFFFFF'; // Main Color for the members name for the welcome image
        ctx.fillText(
            `${member.displayName}!`,
            canvas.width / 2.5,
            canvas.height / 1.8
        );
        ctx.strokeStyle = `#FF0000`; // Secondary Color for the member name to add depth/shadow to the text
        ctx.strokeText(
            `${member.displayName}!`,
            canvas.width / 2.5,
            canvas.height / 1.8
        );

        ctx.beginPath();
        ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        const avatar = await Canvas.loadImage(
            member.user.displayAvatarURL({ format: 'jpg' })
        );
        ctx.drawImage(avatar, 25, 25, 200, 200);

        const attachment = new MessageAttachment(
            canvas.toBuffer(),
            'welcome-image.png'
        );

        var embed = new MessageEmbed()
            .setTitle(
                `:speech_balloon: Hey ${member.displayName}, You look new to ${member.guild.name}!`
            )
            .setColor(`RANDOM`)
            .attachFiles(attachment)
            .setImage('attachment://welcome-image.png')
            .setFooter(`Type help for a feature list!`)
            .setTimestamp();
        try {
            await member.user.send(embed);
        } catch {
            console.log(`${member.user.username}'s dms are private`);
        }
    }
});

client.login(token);

//for (const file of commandFiles) {
//const command = require(`./commands/${file}`);
//  client.commands.set(command.name, command);
//}


//client.once('reconnecting', () => {
//  console.log('Reconnecting!');
//});

//client.once('disconnect', () => {
//  console.log('Disconnect!');
//});

//client.on('guildMemberAdd', member => {

//  const channel = member.guild.channels.cache.find(ch => ch.name === 'gamers');
//if (!channel) return;
//channel.send(`Welcome to the server, ${member}`);
//});



//client.on('message', async message => {
//          const serverQueue = queue.get(message.guild.id);
//  if (message.author.bot) return;
//
//  if (!message.content.startsWith(prefix)) return;
//
///  if (message.content.startsWith(`${prefix}play`)) {
// execute(message, serverQueue);
//  return;
//} else if (message.content.startsWith(`${prefix}skip`)) {
//  skip(message, serverQueue);
//return;
//} else if (message.content.startsWith(`${prefix}stop`)) {
//   stop(message, serverQueue);
//  return;
//} else {
//   message.channel.send(" ");
//}
//});

///async function execute(message, serverQueue) {
//
//  const args = message.content.split(" ");
//
//  const voiceChannel = message.member.voice.channel;
//if (!voiceChannel)
//  return message.channel.send("You need to be in a voice channel to play music!");
//
//  const permissions = voiceChannel.permissionsFor(message.client.user);
//
//  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
//    return message.channel.send("I need the permissions to join and speak in your voice channel!");
//}
//let song;
//const yts = require("yt-search");
// if (ytdl.validateURL(args[1])) {
//     const songInfo = await ytdl.getInfo(args[1]);
//   song = {
//     title: songInfo.title,
//     //   url: songInfo.video_url
//  };
//} else {
///
//     const songInfo = await ytdl.getInfo(args[1]);
//   const { videos } = await yts(args.slice(1).join(" "));
// if (!videos.length) return message.channel.send("No songs were found!");
//   const song = {
//     title: videos[0].title,
//    url: videos[0].url
//};
//}
// const song = {
//     title: songInfo.viedeoDetails.title,
//    url: songInfo.videoDetails.video_url,
// };

//  if (!serverQueue) {
//    const queueContruct = {
//      textChannel: message.channel,
//    voiceChannel: voiceChannel,
//  connection: null,
//songs: [],
//  volume: 5,
// playing: true
// };

//queue.set(message.guild.id, queueContruct);
//
//      queueContruct.songs.push(song);
//
//      try {
//        var connection = await voiceChannel.join();
//      queueContruct.connection = connection;
//    play(message.guild, queueContruct.songs[0]);
//   } catch (err) {
//     console.log(err);
//   queue.delete(message.guild.id);
// return message.channel.send(err);
// }
//   } else {
//     serverQueue.songs.push(song);
//   return message.channel.send(`${song.title} has been added to the queue!`);
//}
//}

//function skip(message, serverQueue) {
//    if (!message.member.voice.channel)
//       return message.channel.send
//         "You have to be in a voice channel to stop the music!"
//   );
// if (!serverQueue)
//    return message.channel.send("There is no song that I could skip!");
//serverQueue.connection.dispatcher.end();
//}

//function stop(message, serverQueue) {
//  if (!message.member.voice.channel)
//    return message.channel.send(
//      "You have to be in a voice channel to stop the music!"
//);
//serverQueue.songs = [];
//serverQueue.connection.dispatcher.end();
//}

//function play(guild, song) {
//  const serverQueue = queue.get(guild.id);
// if (!song) {
//serverQueue.voiceChannel.leave();
//  queue.delete(guild.id);
//    return;
//  }
//
//const dispatcher = serverQueue.connection
//.play(ytdl(song.url))
//.on("finish", () => {
// serverQueue.songs.shift();
//  play(guild, serverQueue.songs[0]);
//})
//  .on("error", error => console.error(error));
//dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
//  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
//}

//client.on('message', message => {

//if (!message.content.startsWith(prefix) || message.author.bot) return;
//const args = message.content.slice(prefix.length).trim().split(/ +/);
//const commandName = args.shift().toLowerCase()
//const command = client.commands.get(commandName) ||
//   client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

//if (!command) return;


//if (command.guildOnly && message.channel.type === 'dm') {
//  return message.reply('I can\'t execute that command inside DMs!');
//}
//if (!cooldowns.has(command.name)) {
//   cooldowns.set(command.name, new Discord.Collection());
//}

//const now = Date.now();
//const timestamps = cooldowns.get(command.name);
// const cooldownAmount = (command.cooldown || 3) * 1000;

//if (timestamps.has(message.author.id)) {
//const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

//if (now < expirationTime) {
//    const timeLeft = (expirationTime - now) / 1000;
////   return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
//}
//timestamps.set(message.author.id, now);
//setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

//}

//try {
//    command.execute(message, args);

//} catch (error) {
//  console.error(error);
//message.reply('there was an error trying to execute that command!');
//}
//});

//client.login(token);