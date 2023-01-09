import {
    ButtonInteraction,
    ButtonStyle,
    ComponentType,
    GuildMemberRoleManager,
    InteractionButtonComponentData,
} from "discord.js";
import { UserModel } from "../../../database/models/user";
import { Waifu, WaifuSchema } from "../../../classes/Waifu";

export default {
    customId: "goToOnList_",
    async execute(interaction: ButtonInteraction): Promise<void> {
        let splitted = interaction.message.content.split(" ");
        let actionToDo = parseInt(interaction.customId.split("_")[1]);
        let actualIndex = parseInt(splitted[splitted.length - 1].split("/")[0]);
        let MaxIndex = parseInt(splitted[splitted.length - 1].split("/")[1]);
        const userId = interaction.message.interaction?.user.id;
        let userDatabaseProfile = await UserModel.findOne({ id: userId });
        let str: String;
        str = "Voici la liste de vos waifus : \n";
        switch (actionToDo) {
            case 0: {
                if (actualIndex <= 0) {
                    actualIndex = MaxIndex;
                }
                else {
                    actualIndex--;
                }
                break;
            }
            case 1: {
                if (actualIndex >= MaxIndex) {
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
                    actualIndex = MaxIndex - diff;
                    actualIndex++;
                    if (actualIndex > MaxIndex) {
                        actualIndex = MaxIndex;
                    }
                }
                else {
                    actualIndex -= 10;
                }
                break;
            }
            case 3: {
                if (actualIndex + 10 > MaxIndex) {
                    var diff = MaxIndex - actualIndex - 10;
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
        str += "Index : " + (actualIndex) + "/" + MaxIndex;
        interaction.update({ content: str.toString() });
    },
    style: ButtonStyle.Primary,
    type: ComponentType.Button,
    disabled: false,
    emoji: undefined,
    label: "Passer d'un index à l'autre",
    regexValidator: /goToOnList_\d/,
} as InteractionButtonComponentData;

enum promo {
    "Info1" = "751048352287686709",
    "Info2" = "753696911973941390",
    "LP" = "888757112560304148",
}