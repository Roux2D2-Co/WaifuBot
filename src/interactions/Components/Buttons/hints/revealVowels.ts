import { ButtonStyle, ComponentType } from "discord.js";
import { HintButton, MemberHintData } from "../../../../classes/Hints";

const BUTTON_ID = "revealVowels"

export default new HintButton({
	type: ComponentType.Button,
	customId: BUTTON_ID,
	execute: async (_, memberHintData) => {
		const vowels = "aeiouyAEIOUY".split("");
		const splittedKnownName = memberHintData.knownName.split("");
		memberHintData.trueName.split("").forEach((trueNameLetter, idx) => {
			if (vowels.includes(trueNameLetter)) {
				splittedKnownName[idx] = trueNameLetter;
			}
		});
		memberHintData.knownName = splittedKnownName.join("");
		memberHintData.usedHints[BUTTON_ID] = 1;
		return memberHintData;
	},
	style: (buttonData, memberHintData) => (memberHintData.usedHints[buttonData.customId] ? ButtonStyle.Success : ButtonStyle.Primary),
	label: "Reveal Vowels",
});
