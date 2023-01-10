import axios from "axios";
import { ChatInputApplicationCommandData, ApplicationCommandType, ChatInputCommandInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { UserModel } from "../../../database/models/user";
import { Waifu, WaifuSchema } from "../../../classes/Waifu";
import customEmbeds from "../../../utils/customEmbeds";
import { returnDominantColor } from "../../../utils/utils";

export default {
    dmPermission: false,
    description: "Lister l'ensemble de vos personnages acquis",
    name: "list",
    guilds: ["780715935593005088"],

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: false });
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
            let buttonLeftminus10 = new ButtonBuilder()
                .setCustomId("goToOnList_2")
                .setLabel("-10")
                .setStyle(ButtonStyle.Primary)
                .setEmoji("⏪");
            let buttonLeft = new ButtonBuilder()
                .setCustomId("goToOnList_0")
                .setLabel("Gauche")
                .setStyle(ButtonStyle.Primary)
                .setEmoji("⬅️");
            let buttonRight = new ButtonBuilder()
                .setCustomId("goToOnList_1")
                .setLabel("Droite")
                .setStyle(ButtonStyle.Primary)
                .setEmoji("➡️");
            let buttonRightplus10 = new ButtonBuilder()
                .setCustomId("goToOnList_3")
                .setLabel("+10")
                .setStyle(ButtonStyle.Primary)
                .setEmoji("⏩");
            var maxIndex = userDatabaseProfile!.waifus.length - 1
            str+= "Index : " + 0 + "/" + maxIndex + "\n";
            var index = 0
            let color = await returnDominantColor(wai.image);
            const { embeds } = await customEmbeds.displayWaifuInlist(wai, index.toString(), maxIndex.toString(), interaction.user.username, color);
            let actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(buttonLeftminus10, buttonLeft, buttonRight, buttonRightplus10);
            await interaction.editReply({ embeds: embeds, components: [actionRow] });
            //await interaction.editReply({ content: str.toString(), components: [actionRow] });
        }
    },
    type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;