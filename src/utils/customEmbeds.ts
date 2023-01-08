import { readFileSync } from "fs";
import { EmbedBuilder, AttachmentBuilder, Colors } from "discord.js";
import { AnilistWaifu } from "../classes/Anilist";

function getObfuscatedWaifuName(words: string): string {
	let letters: string[] = [];
	let splitters: string[] = [];
	let regex = /[^a-zA-Z-0-9]|[-](?=[a-zA-Z0-9])/gim;
	words.split(regex).forEach((word) => {
		let result = /\b(.{1}).*? ?\b/gim.exec(word);
		if (!!result) letters.push(result[1]);
		else {
			console.error(`WUT ? ${word}`);
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
	randomWaifu: async (waifu: AnilistWaifu): Promise<{ embeds: EmbedBuilder[]; files: AttachmentBuilder[] }> => {
		const loli = isNaN(parseInt(waifu.age)) ? false : parseInt(waifu.age) < 16 ? true : false;

		const attachment = new AttachmentBuilder(readFileSync(`./assets/images/${waifu.id}.png`), {
			name: "nope.png",
			description: "tah la waifu",
		});

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
		return { embeds: [waifuEmbed], files: [attachment] };
	},

	claimedWaifu: (waifu: AnilistWaifu, userId: string): { embeds: EmbedBuilder[] } => {
		const loli = isNaN(parseInt(waifu.age)) ? false : parseInt(waifu.age) < 16 ? true : false;

		const waifuEmbed = new EmbedBuilder()
			.setTitle("Waifu Claimed !")
			.setDescription(
				`
			<@${userId}> claimed **[${waifu.name.full}](https://anilist.co/character/${waifu.id})** !!
				${waifu.name.full != waifu.name.userPreferred ? `Nom courant: ${waifu.name.userPreferred}` : ""}
				${waifu.name.alternative.length > 0 ? `Alternatives :\n${waifu.name.alternative.map((t) => `\u200b\t- ${t}`).join("\n")}` : ""}
				${
					waifu.name.alternativeSpoiler.length > 0
						? `Alternatives Spoiler :\n${waifu.name.alternativeSpoiler.map((t) => `\u200b\t- ||${t}||`).join("\n")}`
						: ""
				}`
			)
			.setImage("attachment://nope.png")
			.setColor(loli ? Colors.Red : Colors.Green);
		return { embeds: [waifuEmbed] };
	},
};
