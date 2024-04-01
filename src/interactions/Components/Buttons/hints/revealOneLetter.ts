import { ButtonStyle, ComponentType, DiscordjsError, DiscordjsErrorCodes, InteractionCollector, discordSort } from "discord.js";
import { HintButton } from "../../../../classes/Hints";
import getOneLetterModal from "../../Modals/getOneLetter";

const BUTTON_ID = "reveal-one-letter";
export default new HintButton({
	type: ComponentType.Button,
	customId: BUTTON_ID,
	execute: async (interaction, memberHintData) => {
		console.log(interaction.id);
		try {
			const oneLetterModal = getOneLetterModal(interaction);
			const inputLetter = await oneLetterModal.showModalAndWaitForResult(interaction, {
				time: 60_000,
				dispose: true,
				filter: (i) => i.customId.endsWith(interaction.id),
			});
			const splittedKnownName = memberHintData.knownName.split("");
			memberHintData.trueName.split("").forEach((trueNameLetter, idx) => {
				if (trueNameLetter.toLowerCase() === inputLetter.toLowerCase()) {
					splittedKnownName[idx] = trueNameLetter;
				}
			});
			memberHintData.knownName = splittedKnownName.join("");
			memberHintData.usedHints[BUTTON_ID] = 1;
		} catch (err) {
			if (err instanceof DiscordjsError) {
				if (err.code === DiscordjsErrorCodes.InteractionCollectorError) {
					console.error("Modal not submitted");
				}
			} else {
				console.error(err);
			}
		} finally {
			return memberHintData;
		}
	},
	style: () => ButtonStyle.Primary,
	label: "Reveal one letter",
});
