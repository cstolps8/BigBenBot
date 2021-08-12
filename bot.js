require('dotenv').config();
const Discord = require('discord.js');
const cron = require('node-cron');
const luxon = require('luxon')
const { DateTime } = require("luxon");

const { TOKEN, VOICE_CHANNEL_ID, GUILD_ID, TEXT_CHANNEL_ID } = process.env;



const Client = new Discord.Client();

let guild, voiceChannel, textChannel;
let vcArr

// When bot comes online check the guild and voice channel are valid
// if they are not found the program will exit
Client.on('ready', async () => {
	try {
		guild = await Client.guilds.fetch(GUILD_ID)

		guild.channels.cache.each((values) => {

			if (values.type == "voice" && values.members.array().length >= 1) {
				console.log(values.name + " has " + values.members.array().length + " users in it ")
				vcArr = values.id
			}
		});
		voiceChannel = guild.channels.cache.get(vcArr);
	} catch (error) {
		console.log(error);
		process.exit(1);
	}
	textChannel = guild.channels.cache.get(TEXT_CHANNEL_ID);
	console.log('Big Ben Ready...');
});

// use node-cron to create a job to run every hour
const task = cron.schedule('0 0 */1 * * *', async () => {
	//debugging uncomment next line
	//const task = cron.schedule('5 * * * * *', async () => {
	console.log("----RUNNING BOT----")

	guild = await Client.guilds.fetch(GUILD_ID)
	guild.channels.cache.each((values) => {

		if (values.type == "voice" && values.members.array().length >= 1) {
			console.log(values.name + " has " + values.members.array().length + " users in it ")
			vcArr = values.id
		}
	});

	voiceChannel = guild.channels.cache.get(vcArr);



	let { hour, amPm, timezoneOffsetString } = getTimeInfo();
	// if text channel was defined send message in chat
	if (textChannel) {
		const messageEmbed = new Discord.MessageEmbed()
			.setColor('#FFD700')
			.setTitle(`The time is now ${hour}:00 ${amPm} GMT${timezoneOffsetString}`)

		textChannel.send(messageEmbed);
	}

	// check if VC defined in config is empty
	console.log("Voice Channel = " + voiceChannel)
	if (voiceChannel.members.size >= 1) {
		try {
			// connect to voice channel
			const connection = await voiceChannel.join();
			// counter for looping
			let count = 1;

			// immediately invoked function that loops to play the bell sound 
			(function play() {
				connection.play('bigben.mp3')
					.on('finish', () => {
						count += 1;
						if (count <= hour) {
							play();
						} else {
							console.log("--LEAVING--")
							connection.disconnect();
						}
					})
			})();

		} catch (error) {
			console.log(error);
		}
	}
}, {
	scheduled: true,
	timezone: "America/Chicago"
});


// function to get current time and return object containing
// hour and if it is am or pm
const getTimeInfo = () => {
	let time = new Date();
	let hour = time.getHours() >= 12 ? time.getHours() - 12 : time.getHours();
	console.log(hour)
	hour = hour === 0 ? 12 : hour;
	let amPm = time.getHours() >= 12 ? 'PM' : 'AM';
	// get gmt offset in minutes and convert to hours
	let gmtOffset = time.getTimezoneOffset() / 60
	// turn gmt offset into a string representing the timezone in its + or - gmt offset
	let timezoneOffsetString = `${gmtOffset > 0 ? '-' : '+'} ${Math.abs(gmtOffset)}`;

	return {
		hour,
		amPm,
		timezoneOffsetString
	}
}

// start the cron job
task.start();
getTimeInfo()
Client.login(TOKEN);