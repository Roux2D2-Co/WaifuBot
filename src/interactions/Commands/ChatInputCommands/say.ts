import { ChatInputApplicationCommandData, ApplicationCommandType, ChatInputCommandInteraction, ApplicationCommandOptionType } from "discord.js";
import { CustomEmotes } from "../../../utils/customEmotes";

export default {
	dmPermission: false,
	description: "répète le message envoyé",
	name: "say",
	guilds: ["780715935593005088"],
	options: [{ type: ApplicationCommandOptionType.String, name: "message", description: "Le message", required: true }],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		if (interaction.deferred || interaction.replied) {
			interaction.editReply({ content: `${CustomEmotes.loading} ${interaction.client.user.username} réfléchit...` });
		}else{
			await interaction.deferReply({ ephemeral: false });
		}
		const message = interaction.options.getString("message") as string;
		interaction.editReply(`${interaction.user} a dit : \n${message}`);
	},
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
