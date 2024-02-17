import { HintButton } from "../../../../classes/Hints";
import revealVowels from "./revealVowels";

export default {
	[revealVowels.customId]: revealVowels,
} as { [key: string]: HintButton };
