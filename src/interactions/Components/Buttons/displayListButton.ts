import {
    ButtonInteraction,
    ButtonStyle,
    ComponentType,
    GuildMemberRoleManager,
    InteractionButtonComponentData,
} from "discord.js";
import { UserModel } from "../../../database/models/user";
import { Waifu, WaifuSchema } from "../../../classes/Waifu";
import customEmbeds from "../../../utils/customEmbeds";
import { returnDominantColor } from "../../../utils/utils";

export default {
    customId: "goToOnList_",
    async execute(interaction: ButtonInteraction): Promise<void> {
        let splitted = interaction.message.embeds[0].footer!.text.split(" ");
        let actionToDo = parseInt(interaction.customId.split("_")[1]);
        let actualIndex = parseInt(splitted[splitted.length - 1].split("/")[0]);
        let maxIndex = parseInt(splitted[splitted.length - 1].split("/")[1]);
        const userId = interaction.message.interaction?.user.id;
        let userDatabaseProfile = await UserModel.findOne({ id: userId });
        let str: String;
        str = "Voici la liste de vos waifus : \n";
        switch (actionToDo) {
            case 0: {
                if (actualIndex <= 0) {
                    actualIndex = maxIndex;
                }
                else {
                    actualIndex--;
                }
                break;
            }
            case 1: {
                if (actualIndex >= maxIndex) {
                    actualIndex = 0;
                }
                else {
                    actualIndex++;
                }
                break;
            }
            case 2: {
                if (actualIndex - 10 < 0) {
                    var diff = 0 - actualIndex + 10;
                    actualIndex = maxIndex - diff;
                    actualIndex++;
                    if (actualIndex > maxIndex) {
                        actualIndex = maxIndex;
                    }
                }
                else {
                    actualIndex -= 10;
                }
                break;
            }
            case 3: {
                if (actualIndex + 10 > maxIndex) {
                    var diff = maxIndex - actualIndex - 10;
                    console.log(diff)
                    actualIndex = 0 - diff;
                    actualIndex--;
                    if (actualIndex < 0) {
                        actualIndex = 0;
                    }
                }
                else {
                    actualIndex += 10;
                }
                break;
            }
        }
        console.log(actualIndex);
        let wai: Waifu;
        wai = userDatabaseProfile!.waifus[actualIndex] as Waifu;
        str += wai.name + "\n";
        let color = await returnDominantColor(wai.image);
        const { embeds } = await customEmbeds.displayWaifuInlist(wai, actualIndex.toString(), maxIndex.toString(), interaction.message.interaction!.user.username, color);
        str += "Index : " + (actualIndex) + "/" + maxIndex;
        interaction.update({ embeds: embeds});
    },
    style: ButtonStyle.Primary,
    type: ComponentType.Button,
    disabled: false,
    emoji: undefined,
    label: "Passer d'un index à l'autre",
    regexValidator: /goToOnList_\d/,
} as InteractionButtonComponentData;