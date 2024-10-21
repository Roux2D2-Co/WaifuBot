import { ActionRowBuilder, Interaction, ModalComponentData, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
import CustomModal from "../../../classes/CustomModal";

const textInput = new TextInputBuilder()
	.setCustomId("one-letter-text-input")
	.setLabel("Enter One Letter")
	.setMaxLength(1)
	.setMinLength(1)
	.setRequired(true)
	.setStyle(TextInputStyle.Short);

const actRow = new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);

export default (interaction:Interaction) => new CustomModal({
	customId: `getUserInput-OneLetter-${interaction.id}`,
	title: "Reveal one letter",
	components: [actRow],
	execute: async (i) => {
		i.reply({ content: "input successfully received", ephemeral: true }).then((r) => r.delete());
		return i.fields.getTextInputValue("one-letter-text-input")
	},
});
