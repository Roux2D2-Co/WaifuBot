import {
	InteractionButtonComponentData,
	ButtonStyle,
	ComponentEmojiResolvable,
	ComponentType,
	ButtonInteraction,
	CacheType,
	ButtonBuilder,
} from "discord.js";

export default class CustomButton implements InteractionButtonComponentData {
	style: ButtonStyle.Primary | ButtonStyle.Secondary | ButtonStyle.Success | ButtonStyle.Danger;
	customId: string;
	disabled?: boolean | undefined;
	emoji: ComponentEmojiResolvable | undefined;
	label: string | undefined;
	type: ComponentType.Button;
	regexValidator?: RegExp | undefined;

	execute: (interaction: ButtonInteraction<CacheType>, ...args: any[]) => Promise<void | any>;
	build = () => {
		return new ButtonBuilder(this);
		// Was commented as it seems to work on current buttons
		// 	// .setCustomId(this.customId)
		// 	// .setStyle(this.style)
		// 	// .setLabel(this.label!)
		// 	// .setDisabled(this.disabled)
		//  // .setEmoji(this.emoji);
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
