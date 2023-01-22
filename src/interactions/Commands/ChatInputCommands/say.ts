import { ChatInputApplicationCommandData, ApplicationCommandType, ChatInputCommandInteraction, ApplicationCommandOptionType } from "discord.js";

export default {
	dmPermission: false,
	description: "répète le message envoyé",
	name: "say",
	guilds: ["780715935593005088"],
	options: [{ type: ApplicationCommandOptionType.String, name: "message", description: "Le message", required: true }],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const message = interaction.options.getString("message") as string;
		interaction.reply(`${interaction.user} a dit : \n${message}`).catch(() => {
			interaction.followUp(`${interaction.user} a dit : \n${message}`);
		});
	},
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
