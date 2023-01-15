import { AutocompleteInteraction } from "discord.js";
import { UserModel } from "../database/models/user";

export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
	return keys.reduce((o, k) => ((o[k] = obj[k]), o), {} as Pick<T, K>);
}

export function randomString(len = 25): string {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	const charactersLength = characters.length;
	for (let i = 0; i < len; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

//random integer between up to bound
export function randomInt(max: number) {
	max = Math.floor(max);
	return Math.floor(Math.random() * max); // The maximum is exclusive and the minimum is inclusive
}

export async function autocompleteCharacter(interaction: AutocompleteInteraction) {
	let nameMatchingRegex = /character/;
	let focusedOption = interaction.options.getFocused(true);
	let regexResult = nameMatchingRegex.exec(focusedOption.name);
	let targetId = interaction.user.id;
	if (!!regexResult) {
		let subCommandGroupName = interaction.options.getSubcommandGroup(false);
		let subCommandName = interaction.options.getSubcommand(false);
		let subCommandGroup = interaction.options.data.find((option) => option.name === subCommandGroupName);
		let subCommand = (subCommandGroup?.options || interaction.options.data)?.find((option) => option.name === subCommandName);

		let targetOption = subCommand?.options?.find((option) => option.name == "target");
		if (!!targetOption) {
			targetId = targetOption.value as string;
		}
		let profile = await UserModel.findOne({ id: targetId });
		if (!profile || profile.waifus.length === 0) {
			return interaction.respond([
				{
					name: `${targetId === interaction.user.id ? "Tu n'as pas de profil" : "Cet utilisateur n'a pas de profil ou de personnage"}`,
					value: "",
				},
			]);
		}
		let mappedWaifus = profile.waifus
			.map((waifu) => {
				return {
					name: waifu.name,
					value: waifu.id.toString(),
				};
			})
			.sort((a, b) => a.name.localeCompare(b.name))
			.filter((w) => w.name.toLowerCase().includes(focusedOption.value.toLowerCase() || ""))
			.slice(0, 25);
		interaction.respond(mappedWaifus);
	} else {
		interaction.respond([]);
	}
}
