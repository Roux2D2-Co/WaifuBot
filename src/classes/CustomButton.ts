import {
	InteractionButtonComponentData,
	ButtonStyle,
	ComponentEmojiResolvable,
	ComponentType,
	ButtonInteraction,
	CacheType,
	ButtonBuilder,
} from "discord.js";

export type ClickableButtonStyle = Exclude<ButtonStyle, ButtonStyle.Link>;

export default class CustomButton implements InteractionButtonComponentData {
	style: ClickableButtonStyle;
	customId: string;
	disabled?: boolean | undefined;
	emoji: ComponentEmojiResolvable | undefined;
	label: string | undefined;
	type: ComponentType.Button;
	regexValidator?: RegExp | undefined;

	execute: (interaction: ButtonInteraction<CacheType>, ...args: any[]) => Promise<void | any>;
	build = () => {
		return new ButtonBuilder(this);
	};

	constructor(data: InteractionButtonComponentData) {
		this.style = data.style;
		this.customId = data.customId;
		this.disabled = data.disabled;
		this.emoji = data.emoji;
		this.label = data.label;
		this.type = data.type;
		this.regexValidator = data.regexValidator;
		this.execute = data.execute ?? ((interaction, ...args) => interaction.reply("You pressed the button"));
	}
}
