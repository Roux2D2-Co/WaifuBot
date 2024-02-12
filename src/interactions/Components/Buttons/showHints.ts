import { ButtonInteraction, ButtonStyle, CacheType, ComponentType, Guild, InteractionButtonComponentData, User, UserResolvable } from "discord.js";
import CustomButton from "../../../classes/CustomButton";
import { UserModel } from "../../../database/models/user";

type UserData = {
	trueName: string;
	knownName: string;
	usedHints: { [key: typeof CustomButton.prototype.customId]: number };
};

type GuildData = Map<typeof User.prototype.id, UserData>;

const cache: Map<typeof Guild.prototype.id, GuildData> = new Map();
export function clearGuildCache(guildId: typeof Guild.prototype.id) {
	cache.delete(guildId);
}

const getDefaultUserData = (userId: string, waifuName: string): UserData => {
	return {
		trueName: waifuName,
		knownName: waifuName.replace(/\B/g, "*"),
		usedHints: {},
	};
};

export default new CustomButton({
	customId: "showHint",
	regexValidator: new RegExp("showHint-(.+)"),
	async execute(interaction, ...args): Promise<void> {
		const regexResult = this.regexValidator!.exec(interaction.customId);
		const selectedHint = (Array.isArray(regexResult) && regexResult[0]) || null;
		switch (selectedHint) {
			default: {
				displayHints(interaction);
				break;
			}
		}
	},
	style: ButtonStyle.Primary,
	type: ComponentType.Button,
	disabled: false,
	label: "Hints",
} as InteractionButtonComponentData);

const displayHints = (interaction: ButtonInteraction<CacheType>) => {
	const guildId = interaction.guildId ?? "0";

	// vérification user
	if (!cache.has(guildId)) cache.set(guildId, new Map());
	const guildCache = cache.get(guildId)!;
	if (!guildCache.has(interaction.user.id)) {
		guildCache.set(interaction.user.id, getDefaultUserData(interaction.user.id, interaction.guild!.waifu));
	}
	const userData = guildCache.get(interaction.user.id)!;
	const revealVowelsButton = getRevealVowel(userData);
	interaction.reply({ content: "🚧 **WIP** 🚧", ephemeral: true });
};

const getRevealVowel = (userData: UserData) =>
	new CustomButton({
		customId: "showInt-vowels",
		async execute(interaction, ...args): Promise<void> {
			// UserModel.findOneAndUpdate({ id: interaction.user.id }, { $inc: { tokens: -1 } });
			let userData = cache.get(interaction.guildId ?? "0")!.get(interaction.user.id)!;
			const vowels = "aeiouy".split("");
			const splittedKnownName = userData.knownName.split("");
			userData.trueName.split("").forEach((trueNameLetter, idx) => {
				if (trueNameLetter in vowels) splittedKnownName[idx] = trueNameLetter;
			});
			userData.knownName = splittedKnownName.join("");
		},
		style: userData.usedHints["showHint-vowels"] ? ButtonStyle.Success : ButtonStyle.Primary,
		type: ComponentType.Button,
		disabled: !!userData.usedHints["showHint-vowels"],
		label: "Reveal Vowels",
	});
