import {
  ApplicationCommandType,
  BaseInteraction,
  CacheType,
  ChatInputApplicationCommandData,
  Client,
  Interaction
} from 'discord.js'
import { client } from '../index'
export class InteractionHandler {
  private static _instance: InteractionHandler
  private static client: Client
  private static paused: boolean = false
  private static handler = (
    interaction: BaseInteraction,
    ...args: any[]
  ): void => {
    if (InteractionHandler.paused) return
    else {
      if (interaction.isChatInputCommand()) {
        let localInteraction =
          client.localCommands
            .get(ApplicationCommandType.ChatInput)
            ?.get(interaction.commandName) ?? null
        localInteraction?.execute(interaction)
      } else if (interaction.isContextMenuCommand()) {
        let localInteraction =
          client.localCommands
            .get(interaction.commandType)
            ?.get(interaction.commandName) ?? null
        localInteraction?.execute(interaction as Interaction)
      } else if (interaction.isButton() || interaction.isAnySelectMenu()) {
        let localInteraction =
          client?.localComponents.get(interaction.customId) ?? null
        let regexResult: RegExpExecArray | undefined
        if (!localInteraction) {
          for (const component of client.localComponents.values()) {
            if (component.regexValidator) {
              regexResult =
                component.regexValidator.exec(interaction.customId) ?? undefined
              if (!!regexResult) {
                localInteraction = component
                break
              }
            }
          }
        }
        if (!!localInteraction) {
          localInteraction.execute(
            interaction as Interaction<CacheType>,
            regexResult
          )
        } else {
          console.error(
            `No local interaction found for ${interaction.customId}`
          )
        }
      } else if (interaction.isAutocomplete()) {
        let localInteraction =
          (client.localCommands
            .get(ApplicationCommandType.ChatInput)
            ?.get(
              interaction.commandName
            ) as ChatInputApplicationCommandData) ?? null
        localInteraction?.onAutocomplete?.(
          interaction as Interaction<CacheType>
        )
      }
    }
  }
  public static start (): void {
    if (!InteractionHandler._instance) {
      InteractionHandler._instance = new InteractionHandler()
      client.on('interactionCreate', InteractionHandler.handler)
    }
  }
  public static pause (): void {
    InteractionHandler.paused = true
  }
  public static resume (): void {
    InteractionHandler.paused = false
  }
}
