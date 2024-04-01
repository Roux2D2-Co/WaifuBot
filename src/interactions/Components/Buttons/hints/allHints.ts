import { HintButton } from "../../../../classes/Hints";
import revealVowels from "./revealVowels";
import revealOneLetter from "./revealOneLetter";

export default {
	[revealVowels.customId]: revealVowels,
	[revealOneLetter.customId]: revealOneLetter,
} as { [key: string]: HintButton };
