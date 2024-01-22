import { readFileSync } from "fs";
import { EmbedBuilder, AttachmentBuilder, Colors, ColorResolvable, User as DiscordUser, Embed, ActionRowBuilder, ButtonBuilder } from "discord.js";
import { Waifu } from "../classes/Waifu";
import { rgbToHex } from "./utils";
import { User as DatabaseUser } from "../database/models/user";
import lockDrop from "../interactions/Components/Buttons/lockDrop";
import characterOwnCheck from "../interactions/Components/Buttons/characterOwnCheck";
import { AnilistWaifu } from "../classes/AnilistWaifu";

function getObfuscatedWaifuName(words: string): string {
	let letters: string[] = [];
	let splitters: string[] = [];
	let regex = /[^a-zA-Z-0-9]|[-](?=[a-zA-Z0-9])/gim;
	words.split(regex).forEach((word) => {
		let result = /\b(.{1}).*? ?\b/gim.exec(word);
		if (!!result) letters.push(result[1]);
		else {
			console.error(`WUT ? |${word}| -> ${words}`);
		}
	});

	splitters = words.match(regex)!;

	let finalStr = "";
	for (let i = 0; i < letters.length; i++) {
		finalStr += letters[i];
		if (!!splitters && !!splitters[i]) {
			finalStr += splitters[i];
		}
	}

	return finalStr;
}

export default {
	randomWaifu: async (
		waifu: AnilistWaifu
	): Promise<{ embeds: EmbedBuilder[]; files: AttachmentBuilder[]; components: ActionRowBuilder<ButtonBuilder>[] }> => {
		const loli = isNaN(parseInt(waifu.age)) ? false : parseInt(waifu.age) < 16 ? true : false;

		const attachment = new AttachmentBuilder(readFileSync(`./assets/images/${waifu.id}.png`), {
			name: "nope.png",
			description: "tah la waifu",
		});

		const actionRow = new ActionRowBuilder<ButtonBuilder>();
		const lockButton = lockDrop.build();
		const ownCheckButton = characterOwnCheck.build();
		ownCheckButton.setCustomId(`${characterOwnCheck.customId}-${waifu.id}`);

		actionRow.addComponents(lockButton, ownCheckButton);

		const waifuEmbed = new EmbedBuilder()
			.setTitle("Random Waifu Dropped !")
			.setDescription(
				`Nom Complet : ${getObfuscatedWaifuName(waifu.name.full)}
				Nom le plus utilisé : ${getObfuscatedWaifuName(waifu.name.userPreferred)}
				${waifu.name.alternative.length > 0 ? `Alternatives : ${waifu.name.alternative.length}` : ""}
				${waifu.name.alternativeSpoiler.length > 0 ? `Alternatives Spoiler : ${waifu.name.alternativeSpoiler.length}` : ""}`
			)
			.setImage("attachment://nope.png")
			.setColor(loli ? Colors.Red : Colors.Gold);
		return { embeds: [waifuEmbed], files: [attachment], components: [actionRow] };
	},

	rolledWaifu: (waifu: AnilistWaifu<false>): { embeds: EmbedBuilder[] } => {
		const waifuEmbed = new EmbedBuilder()
			.setTitle(waifu.name.full)
			.setURL(`https://anilist.co/character/${waifu.id}`)
			.setDescription(`You rolled ${waifu.name.full} (${waifu.id})!\n\n*(${waifu.media.nodes[0].title.romaji} ${waifu.media.nodes[0].isAdult ? "🔞" : ""})*`)
			.setThumbnail(waifu.image.large);
		return { embeds: [waifuEmbed] };
	},

	claimedWaifu: (waifu: AnilistWaifu<false>, userId: string): { embeds: EmbedBuilder[] } => {
		const loli = isNaN(parseInt(waifu.age)) ? false : parseInt(waifu.age) < 16 ? true : false;

		const waifuEmbed = new EmbedBuilder()
			.setTitle(waifu.name.full)
			.setURL(`https://anilist.co/character/${waifu.id}`)
			.setDescription(
				`
			<@${userId}> claimed **[${waifu.name.full}](https://anilist.co/character/${waifu.id})** !!
				${waifu.name.full != waifu.name.userPreferred ? `Nom courant: ${waifu.name.userPreferred}` : ""}
				${waifu.name.alternative.length > 0 ? `Alternatives :\n${waifu.name.alternative.map((t) => `\u200b\t- ${t}`).join("\n")}` : ""}
				${
					waifu.name.alternativeSpoiler.length > 0
						? `Alternatives Spoiler :\n${waifu.name.alternativeSpoiler.map((t) => `\u200b\t- ||${t}||`).join("\n")}`
						: ""
				}
				
				*(${waifu.media.nodes[0].title.romaji} ${waifu.media.nodes[0].isAdult ? "🔞" : ""})*`
			)
			.setImage("attachment://nope.png")
			.setColor(loli ? Colors.Red : Colors.Green);
		return { embeds: [waifuEmbed] };
	},

	displayWaifuInlist: (waifu: Waifu, actualIndex: string, MaxIndex: string, username: string, color: Array<number>): { embeds: EmbedBuilder[] } => {
		const hexColor: ColorResolvable = rgbToHex(color[0], color[1], color[2]) as ColorResolvable;
		const footer = (parseInt(actualIndex) + 1).toString() + "/" + (parseInt(MaxIndex) + 1).toString();
		const waifuEmbed = new EmbedBuilder()
			.setTitle(username + "'s list")
			.setColor(hexColor)
			.setDescription(
				waifu.name +
					" (" +
					waifu.id +
					") " +
					"\n\n" +
					(waifu.media?.title.english == undefined
						? waifu.media?.title.romaji == undefined
							? ""
							: "*" + waifu.media?.title.romaji + "*"
						: "*" + waifu.media?.title.english + "*")
			)
			.setImage(waifu.image)
			.setFooter({ text: footer });
		return { embeds: [waifuEmbed] };
	},

	updateWaifuInlist: (waifu: Waifu, actualIndex: string, color: Array<number>, embed: Embed): { embeds: EmbedBuilder[] } => {
		const hexColor: ColorResolvable = rgbToHex(color[0], color[1], color[2]) as ColorResolvable;
		const waifuEmbed = EmbedBuilder.from(embed)
			.setColor(hexColor)
			.setDescription(
				waifu.name +
					" (" +
					waifu.id +
					") " +
					"\n\n" +
					(waifu.media?.title.english == undefined
						? waifu.media?.title.romaji == undefined
							? ""
							: "*" + waifu.media?.title.romaji + "*"
						: "*" + waifu.media?.title.english + "*")
			)
			.setImage(waifu.image)
			.setFooter({ text: embed.footer!.text.replace(/\d+\//, (parseInt(actualIndex) + 1).toString() + "/") });
		return { embeds: [waifuEmbed] };
	},

	profile: (userProfile: DatabaseUser, discordUser: DiscordUser): { embeds: EmbedBuilder[] } => {
		const profileEmbed = new EmbedBuilder()
			.setTitle(`${discordUser.username}`)
			.setDescription(
				`
				${userProfile.quote}
				${discordUser.username} ${
					!!userProfile.nextRoll
						? userProfile?.nextRoll < new Date()
							? `is able to roll`
							: `will be able to roll <t:${Math.round(userProfile.nextRoll?.getTime() / 1000)}:R>`
						: ""
				}
				They have ${userProfile.waifus.length} characters.
				${userProfile?.favorite ? `Their favorite character is ${userProfile.favorite.name}` : ""}

				They have ${userProfile.tokens} token${userProfile.tokens > 1 ? "s" : ""}.
				`
			)
			.setThumbnail(userProfile?.favorite?.image ?? null);
		return { embeds: [profileEmbed] };
	},

	tradeWaifus: (users: { userId: string; waifu: AnilistWaifu }[], imagePath: string): { embeds: EmbedBuilder[]; files: AttachmentBuilder[] } => {
		const attachment = new AttachmentBuilder(readFileSync(imagePath), { name: "trade.png" });

		const waifuEmbed = new EmbedBuilder()
			.setTitle("Waifu Trade")
			.setDescription(`<@${users[0].userId}> wants to trade with <@${users[1].userId}>. \nYou have 60 seconds to react.`)
			.addFields(
				{ name: "\u200b", value: `[${users[0].waifu.name.full}](${users[0].waifu.siteUrl})`, inline: true },
				{ name: "\u200b", value: "for", inline: true },
				{ name: "\u200b", value: `[${users[1].waifu.name.full}](${users[1].waifu.siteUrl})`, inline: true }
			)
			.setImage("attachment://trade.png")
			.setColor(Colors.White);
		return { embeds: [waifuEmbed], files: [attachment] };
	},

	tradeSuccess: (users: { userId: string; waifu: AnilistWaifu }[], imagePath: string): { embeds: EmbedBuilder[]; files: AttachmentBuilder[] } => {
		const attachment = new AttachmentBuilder(readFileSync(imagePath), { name: "trade.png" });

		const waifuEmbed = new EmbedBuilder()
			.setTitle("Trade Success !")
			.setDescription(`<@${users[0].userId}> successfully trade with <@${users[1].userId}>\n(Date : ${new Date().toLocaleString()})`)
			.addFields(
				{ name: "\u200b", value: `[${users[0].waifu.name.full}](${users[0].waifu.siteUrl})`, inline: true },
				{ name: "\u200b", value: "for", inline: true },
				{ name: "\u200b", value: `[${users[1].waifu.name.full}](${users[1].waifu.siteUrl})`, inline: true }
			)
			.setImage("attachment://trade.png")
			.setColor(Colors.Green);
		return { embeds: [waifuEmbed], files: [attachment] };
	},
};
