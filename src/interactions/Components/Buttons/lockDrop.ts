import { ButtonStyle, ComponentType, InteractionButtonComponentData, time } from "discord.js";
import CustomButton from "../../../classes/CustomButton";
import { guildDropCooldowns } from "../../Commands/ChatInputCommands/dropWaifu";
import config from "../../../config.json";

export default new CustomButton({
	customId: "lockDrop",
	async execute(interaction, ...args): Promise<void> {
		const resumeDate = new Date(Date.now() + config.LOCK_DURATION);
		guildDropCooldowns.set(interaction.guildId!, resumeDate);
		interaction.reply({ content: `STOP, resume drops ${time(resumeDate, "R")}`, fetchReply: true }).then((r) => {
			setTimeout(() => {
				r.delete();
			}, config.LOCK_DURATION);
		});
	},
	style: ButtonStyle.Danger,
	type: ComponentType.Button,
	disabled: false,
	label: "STOP",
} as InteractionButtonComponentData);
