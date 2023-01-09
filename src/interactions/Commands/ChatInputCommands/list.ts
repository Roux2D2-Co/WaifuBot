import axios from "axios";
import { ChatInputApplicationCommandData, ApplicationCommandType, ChatInputCommandInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { UserModel } from "../../../database/models/user";
import { Waifu, WaifuSchema } from "../../../classes/Waifu";

export default {
    dmPermission: false,
    description: "Lister l'ensemble de vos personnages acquis",
    name: "list",
    guilds: ["780715935593005088"],

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: true });
        const userId = interaction.user.id;
        let userDatabaseProfile = await UserModel.findOne({ id: userId });
        if (!userDatabaseProfile) {
            await interaction.editReply("Impossible vous n'avez pas d'identifiant !!");
            return;
        }
        else if (userDatabaseProfile!.waifus.length === 0) {
            await interaction.editReply("Vous n'avez pas encore de waifu.");
            return;
        }
        else {
            // Case when player has waifus to display
            let str : String;
            str = "Voici la liste de vos waifus : \n";
                let wai: Waifu;
                wai = userDatabaseProfile.waifus[0] as Waifu;
                str  += wai.name + "\n";
                console.log(wai.name);
                //await interaction.editReply(str.toString());
            let buttonLeft = new ButtonBuilder()
                .setCustomId("goToleftOnList")
                .setLabel("Gauche")
                .setStyle(ButtonStyle.Primary)
                .setEmoji("⬅️");
            let buttonRight = new ButtonBuilder()
                .setCustomId("goToRightOnList")
                .setLabel("Droite")
                .setStyle(ButtonStyle.Primary)
                .setEmoji("➡️");
            let actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(buttonLeft, buttonRight);
            await interaction.editReply({ content: str.toString(), components: [actionRow] });
        }
    },
    type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;