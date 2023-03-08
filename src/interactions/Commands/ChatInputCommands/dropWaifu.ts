import {
	ChatInputApplicationCommandData,
	ApplicationCommandType,
	ChatInputCommandInteraction,
	ChannelType,
	GuildResolvable,
	time,
} from "discord.js";
import Anilist from "../../../classes/Anilist";
import { UserModel } from "../../../database/models/user";
import customEmbeds from "../../../utils/customEmbeds";
import config from "../../../config.json";

let guildDropCooldowns = new Map<GuildResolvable, Date>();

export { guildDropCooldowns };
export default {
	dmPermission: false,
	description: "Fait apparaitre une waifu",
	name: "drop",
	guilds: ["780715935593005088"],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		if (!interaction.replied) await interaction.deferReply({ ephemeral: true });
		const userId = interaction.user.id;
		let userDatabaseProfile = await UserModel.findOne({ id: userId });
		if (!userDatabaseProfile) {
			//TODO : Gérer le cas où le mec a pas de profil
			await interaction.editReply("Fuck j'ai pas géré le cas où le mec a pas de profil");
		} else {
			if (guildDropCooldowns.get(interaction.guild!.id) && guildDropCooldowns.get(interaction.guild!.id)! > new Date()) {
				await interaction.editReply(`La prochaine waifu pourra drop ${time(new Date(guildDropCooldowns.get(interaction.guild!.id)!), "R")}`);
				return;
			}
			const randomWaifu = await Anilist.getRandomCharacter();
			interaction.guild!.waifu = randomWaifu;
			const { embeds, files, components } = await customEmbeds.randomWaifu(randomWaifu);
			interaction.guild?.channels.fetch(interaction.channelId).then((c) => {
				if (!c || c.type != ChannelType.GuildText) return;
				c.send({ embeds, files, components }).then((m) => (interaction.guild!.waifuMessage = m));
				console.log(randomWaifu.name);
				guildDropCooldowns.set(interaction.guild!.id, new Date(Date.now() + config.DROP_COOLDOWN));
			});
		}
	},
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
