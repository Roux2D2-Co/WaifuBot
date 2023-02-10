import { ChatInputApplicationCommandData, ApplicationCommandType, ChatInputCommandInteraction, ChannelType } from "discord.js";
import { CustomEmotes } from "../../../utils/customEmotes";
import Anilist from "../../../classes/Anilist";
import { UserModel } from "../../../database/models/user";
import customEmbeds from "../../../utils/customEmbeds";

let timeMap = new Map<string, number>();

export default {
	dmPermission: false,
	description: "Fait apparaitre une waifu",
	name: "drop",
	guilds: ["780715935593005088"],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		if (interaction.deferred || interaction.replied) {
			interaction.editReply({ content: `${CustomEmotes.loading} ${interaction.client.user.username} réfléchit...` });
		} else {
			await interaction.deferReply({ ephemeral: false });
		}
		const userId = interaction.user.id;
		let userDatabaseProfile = await UserModel.findOne({ id: userId });
		if (!userDatabaseProfile) {
			//TODO : Gérer le cas où le mec a pas de profil
			await interaction.editReply("Fuck j'ai pas géré le cas où le mec a pas de profil");
		} else {
			if (timeMap.get(interaction.guild!.id) && timeMap.get(interaction.guild!.id)! > Date.now()) {
				await interaction.editReply("Il faut attendre 30 secondes entre chaque waifu");
				return;
			}
			const randomWaifu = await Anilist.getRandomCharacter();
			interaction.guild!.waifu = randomWaifu;
			const { embeds, files } = await customEmbeds.randomWaifu(randomWaifu);
			interaction.guild?.channels.fetch(interaction.channelId).then((c) => {
				if (!c || c.type != ChannelType.GuildText) return;
				c.send({ embeds, files }).then((m) => (interaction.guild!.waifuMessage = m));
				interaction.deleteReply();
				console.log(randomWaifu.name);
				timeMap.set(interaction.guild!.id, Date.now() + 30000);
			});
		}
	},
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
