import { ButtonStyle, ComponentType, InteractionButtonComponentData, time } from "discord.js";
import CustomButton from "../../../classes/CustomButton";
import { timeMap } from "../../Commands/ChatInputCommands/dropWaifu";

// const LOCK_DURATION = 60000;
const LOCK_DURATION = 10000;

export default new CustomButton({
	customId: "lockDrop",
	async execute(interaction, ...args): Promise<void> {
		const resumeDate = new Date(Date.now() + LOCK_DURATION);
		timeMap.set(interaction.guildId!, resumeDate);
		interaction.reply({ content: `STOP, reprise dans ${time(resumeDate, "R")}`, fetchReply: true }).then((r) => {
			setTimeout(() => {
				r.delete();
			}, LOCK_DURATION);
		});
	},
	style: ButtonStyle.Primary,
	type: ComponentType.Button,
	disabled: false,
	emoji: "🛑",
	label: "STOP",
} as InteractionButtonComponentData);
