import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	CacheType,
	ComponentType,
	InteractionButtonComponentData,
	InteractionReplyOptions,
	InteractionUpdateOptions,
} from "discord.js";

import CustomButton from "../../../classes/CustomButton";
import { HintCacheManager } from "../../../classes/Hints";
import { UserModel } from "../../../database/models/user";

import hintButtons from "../Buttons/hints/allHints";
import { groupArray } from "../../../utils/utils";

const cache = new HintCacheManager();

export default new CustomButton({
	customId: "showHint",
	regexValidator: new RegExp("showHint-(.+)"),
	async execute(interaction, ...args): Promise<void> {
		if (!interaction.guild || !interaction.guild.waifu) {
			interaction.reply({ ephemeral: true, content: "No guild or claimable waifu found" });
			return;
		}
		const regexResult = this.regexValidator!.exec(interaction.customId);
		const selectedHint = Array.isArray(regexResult) && regexResult[1] ? regexResult[1] : null;
		console.debug(selectedHint);
		if (!!selectedHint) {
			let selectedButton = hintButtons[selectedHint];
			if (!selectedButton) {
				interaction.reply({ ephemeral: true, content: "Cant' find hint button" });
			} else {
				try {
					let {
						guild: { id: guildId, waifu },
						user: { id: userId },
					} = interaction;
					const memberHintData = cache.getGuildMember(guildId, waifu.id, userId);
					const editedMemberHintData = await selectedButton.execute(interaction, memberHintData);
					cache.setGuildMember(guildId, waifu, userId, editedMemberHintData);
					displayHints(interaction, true);
				} catch (e) {
					interaction.reply({ ephemeral: true, content: (<Error>e).message });
				}
			}
		} else {
			displayHints(interaction);
		}
	},
	style: ButtonStyle.Primary,
	type: ComponentType.Button,
	disabled: false,
	label: "Hints",
} as InteractionButtonComponentData);

const displayHints = (interaction: ButtonInteraction<CacheType>, updateMessage?: Boolean) => {
	if (!interaction.guild?.waifu) return interaction.reply({ content: "Hmm it seems that no waifu has been dropped", ephemeral: true });

	//extract user.id, guild.id and guild.waifu from interaction payload
	let {
		guild: { id: guildId, waifu },
		user: { id: userId },
	} = interaction;

	// vérification user

	if (!cache.getGuild(guildId).has(interaction.guild.waifu.id)) {
		cache.setGuildWaifu(guildId, waifu);
	}
	const memberHintData = cache.getGuildMember(guildId, waifu.id, userId);

	const components: Array<ActionRowBuilder<ButtonBuilder>> = [];

	for (const actRowComponents of groupArray(Object.values(hintButtons), 5)) {
		let actRow = new ActionRowBuilder<ButtonBuilder>();
		for (const hintButton of actRowComponents) {
			actRow.addComponents(hintButton.build(memberHintData));
		}
		components.push(actRow);
	}

	const payload: InteractionReplyOptions = { content: `🚧 **WIP** 🚧\nNom trouvé : \`${memberHintData.knownName}\``, components: components };

	if (!!updateMessage) {
		interaction.update(payload as InteractionUpdateOptions);
	} else {
		payload.ephemeral = true;
		interaction.reply(payload);
	}
};
