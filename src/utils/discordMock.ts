import {
  ChatInputCommandInteraction,
  Client,
  APIInteraction,
  CacheType,
  CommandInteractionOption,
  ActionRowBuilder,
  ApplicationCommand,
  ApplicationCommandOptionData,
  ApplicationCommandOptionType,
  ApplicationCommandSubCommandData,
  ApplicationCommandSubGroupData,
  ButtonBuilder,
  ButtonStyle,
  ChannelResolvable,
  ChannelSelectMenuBuilder,
  Collection,
  GuildMember,
  MentionableSelectMenuBuilder,
  MessageComponentInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
  User,
  UserSelectMenuBuilder,
  bold,
  ChatInputApplicationCommandData,
  DiscordjsErrorCodes,
  APIInteractionGuildMember,
  APIUser,
  APIInteractionDataResolvedGuildMember,
  InteractionType,
  APIChatInputApplicationCommandInteraction,
  APIInteractionDataResolvedChannel,
  ApplicationCommandType,
  APIApplicationCommandInteractionDataOption,
  APIApplicationCommandInteractionWrapper,
  APIChatInputApplicationCommandInteractionData,
  GuildMemberResolvable,
  UserResolvable
} from 'discord.js'
import { client } from '..'
import { readdirSync } from 'fs'
import { resolve } from 'path'

const localCommands = new Map<string, ChatInputApplicationCommandData>()
export type CommandNames = {
  command: string
  subCommandGroup?: string
  subCommand?: string
}
export type OptionAndValue = ApplicationCommandOptionData & { value: any }
export type MockableInteractions = APIChatInputApplicationCommandInteraction

const interactionsFolderPath = resolve(
  __dirname,
  '../interactions/Commands/ChatInputCommands'
)

;(async () => {
  for await (const file of readdirSync(interactionsFolderPath).filter(file =>
    file.endsWith('.js')
  )) {
    console.log(
      `Chargement de la commande ${interactionsFolderPath
        .split(/\\|\//g)
        .at(-1)}/${file}`
    )
    let command = await import(resolve(interactionsFolderPath, file)).then(
      m => m.default as ChatInputApplicationCommandData
    )
    if (command.name === 'dev') continue
    localCommands.set(command.name, command)
  }
  console.debug(
    `The following commands have been loaded by discordMock: \n${Array.from(
      localCommands.keys()
    )
      .map(n => `- ${n}`)
      .join('\n')}`
  )
})()

export { localCommands }

export class MockedInteraction extends ChatInputCommandInteraction {
  constructor (client: Client, interaction: APIInteraction) {
    if (!client.isReady()) throw new Error(DiscordjsErrorCodes.ClientNotReady)
    super(client, interaction)
  }

  static formatInputDataFromParsedInteraction (
    parsedInteraction: ChatInputCommandInteraction,
    options: CommandInteractionOption<CacheType>
  ) {
    const interactionJson = parsedInteraction.toJSON() as { [key: string]: any }
    interactionJson.options = options
    return interactionJson
  }
}

export async function collectVariables (
  interaction: ChatInputCommandInteraction,
  options:
    | ApplicationCommandOptionData[]
    | readonly ApplicationCommandOptionData[]
    | undefined
): Promise<Map<string, OptionAndValue>> {
  const collectorFilter = (i: MessageComponentInteraction) =>
    i.user.id === interaction.user.id
  const valuesMap = new Map<string, OptionAndValue>()

  for await (const option of (options as OptionAndValue[]) ?? []) {
    let components: any[] = []

    if (
      option.type === ApplicationCommandOptionType.String ||
      option.type === ApplicationCommandOptionType.Number ||
      option.type === ApplicationCommandOptionType.Integer
    ) {
      components.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(option.name)
            .setLabel(option.name)
            .setStyle(ButtonStyle.Primary)
        )
      )
    } else if (option.type === ApplicationCommandOptionType.Boolean) {
      components.push(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(option.name)
            .setPlaceholder(option.name)
            .addOptions(
              new StringSelectMenuOptionBuilder()
                .setLabel('Oui')
                .setValue('true'),
              new StringSelectMenuOptionBuilder()
                .setLabel('Non')
                .setValue('false')
            )
            .setMaxValues(1)
            .setMinValues(1)
        )
      )
    } else if (option.type === ApplicationCommandOptionType.User) {
      components.push(
        new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
          new UserSelectMenuBuilder()
            .setCustomId(option.name)
            .setPlaceholder(option.name)
            .setMaxValues(1)
            .setMinValues(1)
        )
      )
    } else if (option.type === ApplicationCommandOptionType.Channel) {
      components.push(
        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId(option.name)
            .setPlaceholder(option.name)
            .setMaxValues(1)
            .setMinValues(1)
        )
      )
    } else if (option.type === ApplicationCommandOptionType.Role) {
      components.push(
        new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId(option.name)
            .setPlaceholder(option.name)
            .setMaxValues(1)
            .setMinValues(1)
        )
      )
    } else if (option.type === ApplicationCommandOptionType.Mentionable) {
      components.push(
        new ActionRowBuilder<MentionableSelectMenuBuilder>().addComponents(
          new MentionableSelectMenuBuilder()
            .setCustomId(option.name)
            .setPlaceholder(option.name)
            .setMaxValues(1)
            .setMinValues(1)
        )
      )
    } else {
      throw new Error(`Type d'option non géré : ${option.type}`)
    }

    //on ajoute le bouton de validation quel que soit le type de l'option
    let validationButton = new ButtonBuilder()
      .setCustomId('validate')
      .setLabel('Valider mon choix')
    if (option.required) {
      validationButton.setStyle(ButtonStyle.Danger).setDisabled(true)
    } else {
      validationButton.setStyle(ButtonStyle.Success)
    }
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(validationButton)
    )
    const messageContent = `Veuillez choisir une valeur pour l'option ${bold(
      option.name
    )}\n\nDescription de l'option : ${option.description}`
    let message = await interaction.editReply({
      content: messageContent,
      components
    })

    await new Promise<void>((resolve, reject) => {
      const collector = message.createMessageComponentCollector({
        filter: collectorFilter ?? (() => true),
        time: 300000
      })
      collector.on('end', (c: any, reason: string) => {
        if (reason == 'time') {
          interaction
            .editReply({
              content: '5 minutes se sont écoulés\nAnnulation de la demande',
              components: []
            })
            .catch(() => {
              console.error(
                'Error at message.edit in collectVariables\nIt seems that the message is unavailable and/or ephemeral'
              )
            })
          reject()
        } else {
          interaction.editReply({ components: [] })
        }
      })
      collector.on('collect', (i: MessageComponentInteraction) => {
        if (i.customId === 'validate') {
          i.deferUpdate()
          collector.stop()
          resolve()
        } else {
          if (i.isAnySelectMenu() && i.values.length === 1) {
            let responseComponents = [...components]
            responseComponents[responseComponents.length - 1].components[0]
              .setDisabled(false)
              .setStyle(ButtonStyle.Success)
            option.value = i.values[0]
            valuesMap.set(option.name, option)
            i.update({ components: responseComponents })
          } else if (i.isButton()) {
            //si c'est un bouton ça veut dire qu'on cherche à obtenir un string/number/integer donc on a besoin d'un modal
            const modalComponents =
              new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                  .setCustomId(option.name)
                  .setLabel(option.name)
                  .setPlaceholder(option.name)
                  .setRequired(true)
                  .setStyle(TextInputStyle.Short)
              )
            const modal = new ModalBuilder()
              .setCustomId(option.name)
              .setTitle(option.name)
              .setComponents(modalComponents)
            i.showModal(modal)
            const filter = (subI: ModalSubmitInteraction) =>
              subI.customId === modal.data.custom_id
            interaction
              .awaitModalSubmit({ filter, time: 30_000 })
              .then(
                (subI: {
                  fields: { getTextInputValue: (arg0: any) => any }
                  reply: (arg0: {
                    content: string
                    ephemeral: boolean
                  }) => Promise<any>
                  deleteReply: () => void
                }) => {
                  option.value = subI.fields.getTextInputValue(option.name)
                  valuesMap.set(option.name, option)
                  let responseComponents = [...components]
                  responseComponents[
                    responseComponents.length - 1
                  ].components[0]
                    .setDisabled(false)
                    .setStyle(ButtonStyle.Success)
                  i.editReply({
                    content:
                      messageContent +
                      `\nValeur actuelle de l'option ${bold(option.name)} : ${
                        option.value
                      }`,
                    components: responseComponents
                  })
                  subI
                    .reply({ content: 'valeur enregitrés', ephemeral: true })
                    .then(() => {
                      subI.deleteReply()
                    })
                }
              )
          }
        }
      })
    })
  }

  return valuesMap
}

export async function getNewInteraction (
  interaction: ChatInputCommandInteraction,
  commandNames: CommandNames,
  options: OptionAndValue[] = []
) {
  if (!interaction.guild) throw new Error(DiscordjsErrorCodes.NotImplemented)

  const localCommand = localCommands.get(commandNames.command)!
  let discordCommand
  if (!!localCommand.guilds && localCommand.guilds.length > 0) {
    discordCommand = await interaction.guild?.commands
      .fetch()
      .then((cList: Collection<string, ApplicationCommand<{}>>) =>
        cList.find((c: { name: string }) => c.name === commandNames.command)
      )
  } else {
    discordCommand = await interaction.client.application?.commands
      .fetch()
      .then((cList: Collection<string, ApplicationCommand<{}>>) =>
        cList.find((c: { name: string }) => c.name === commandNames.command)
      )
  }

  const targetUser = interaction.options.getUser('user', true)
  const targetMember = await interaction.guild.members
    .fetch(targetUser.id)
    .catch(() => undefined)

  if (!targetMember) throw new Error(DiscordjsErrorCodes.InvalidElement)

  const target = mockNewTarget(targetUser, targetMember)

  const resolved: {
    members: { [key: string]: GuildMemberResolvable }
    users: { [key: string]: UserResolvable }
    channels: { [key: string]: ChannelResolvable }
  } = { members: {}, users: {}, channels: {} }

  const formattedOptions = await Promise.all(
    options.map(async o => {
      const option: {
        name: string
        type: ApplicationCommandOptionType
        value: string
        user?: User
        member?: GuildMember
      } = {
        name: o.name,
        type: o.type,
        value: o.value
      }

      if (o.type === ApplicationCommandOptionType.User) {
        const user = await client.users.fetch(o.value)
        resolved.users[o.value] = user

        const member = await interaction.guild?.members.fetch(o.value)
        if (!!member) resolved.members[o.value] = member
        option.user = user
        option.member = member
      } else if (o.type === ApplicationCommandOptionType.Channel) {
        const channel = await client.channels.fetch(o.value)
        if (!!channel) resolved.channels[o.value] = channel
      }

      console.log(option)
      return option
    })
  )

  const subCommandGroup = localCommand.options?.find(
    (o: { name: string | undefined }) => o.name === commandNames.subCommandGroup
  ) as ApplicationCommandSubGroupData
  const subCommand = (subCommandGroup || localCommand)?.options?.find(
    (o: { name: string | undefined }) => o.name === commandNames.subCommand
  ) as ApplicationCommandSubCommandData

  const commandOptions = []
  if (!!subCommand) {
    if (!!subCommandGroup) {
      commandOptions.push({
        name: subCommandGroup.name,
        type: subCommandGroup.type,
        options: [
          {
            name: subCommand.name,
            type: subCommand.type,
            options: formattedOptions
          }
        ]
      })
    } else {
      commandOptions.push({
        name: subCommand.name,
        type: subCommand.type,
        options: formattedOptions
      })
    }
  } else {
    commandOptions.push(...formattedOptions)
  }

  if (!discordCommand) throw new Error('Command not found')
  const interactionJson = {} as {
    [key in keyof APIApplicationCommandInteractionWrapper<APIChatInputApplicationCommandInteractionData>]: any
  }
  // const interactionJson = {} as MockableInteractions
  interactionJson.token = interaction.token
  interactionJson.app_permissions =
    interaction.appPermissions?.bitfield.toString()!
  interactionJson.application_id = discordCommand.applicationId
  interactionJson.guild_id = discordCommand.guildId!
  interactionJson.id = interaction.id
  interactionJson.guild_locale = interaction.guildLocale!
  interactionJson.locale = interaction.locale
  interactionJson.member = target
  interactionJson.token = interaction.token
  interactionJson.type = InteractionType.ApplicationCommand
  interactionJson.version = 1 // Read-only property, always 1
  interactionJson.entitlements = []
  interactionJson.data = {
    id: discordCommand.id,
    name: discordCommand.name,
    guild_id: interaction.guildId!,
    type: ApplicationCommandType.ChatInput,
    resolved,
    options: commandOptions
  }
  let e = new MockedInteraction(client, interactionJson)
  e.channelId = interaction.channelId
  e.replied = true
  e.ephemeral = true
  return e
}

function mockNewTarget (
  targetUser: User,
  targetMember: GuildMember
): APIInteractionGuildMember {
  const target: APIInteractionGuildMember = {
    user: {
      username: targetUser?.username,
      public_flags: targetUser?.flags?.bitfield,
      id: targetUser.id,
      discriminator: targetUser.discriminator,
      avatar: targetUser.avatar,
      global_name: targetUser.globalName
    },
    roles: Array.isArray(targetMember.roles)
      ? targetMember.roles
      : targetMember.roles.cache.map((r: { id: any }) => r.id),

    premium_since: targetMember.premiumSince?.toISOString(),
    permissions: targetMember.permissions.bitfield.toString()!,
    pending: targetMember.pending,
    nick: targetMember.nickname,
    joined_at: targetMember.joinedAt!.toISOString(), // Force as target member must be in guild to be targeted
    communication_disabled_until:
      targetMember.communicationDisabledUntilTimestamp?.toString(),
    avatar: targetMember.avatar,
    flags: targetMember.flags.bitfield,
    mute: false,
    deaf: false
  }

  if (targetMember.voice) {
    target.deaf = targetMember.voice.deaf!
    target.mute = targetMember.voice.mute!
  }

  return target
}

export async function getCommandOptions (
  i: ChatInputCommandInteraction,
  commandInput: CommandNames
): Promise<Map<string, OptionAndValue>> {
  let { command, subCommandGroup, subCommand } = commandInput
  console.debug(command, subCommandGroup, subCommand)
  if (!localCommands.has(command))
    throw new Error("Cette commande n'existe pas\nPensez à bien valider l'autocomplétion en appuyant sur Tab ou Entree")
  let localCommand:
    | ChatInputApplicationCommandData
    | ApplicationCommandSubGroupData = localCommands.get(command)!

  let subCommandGroupData: ApplicationCommandSubGroupData | undefined
  let subCommandData: ApplicationCommandSubCommandData | undefined
  let executableCommand:
    | ChatInputApplicationCommandData
    | ApplicationCommandSubCommandData
    | ApplicationCommandSubGroupData

  if (subCommandGroup) {
    subCommandGroupData = localCommand.options?.find(
      option =>
        option.name === subCommandGroup &&
        option.type === ApplicationCommandOptionType.SubcommandGroup
    ) as ApplicationCommandSubGroupData
    if (!subCommandGroupData)
      throw new Error(
        `SubGroup ${subCommandGroup} doesn't exists on command ${command}`
      )
  }

  subCommandData = localCommand.options?.find(
    option =>
      option.name === subCommand &&
      option.type === ApplicationCommandOptionType.Subcommand
  ) as ApplicationCommandSubCommandData

  if (!!subCommandData && subCommandData.execute) {
    executableCommand = subCommandData
  } else {
    executableCommand = localCommand
  }
  return collectVariables(i, executableCommand.options)
}

type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'function'
  | 'undefined'

function getPropertyType (value: any): PropertyType {
  if (value === null) return 'object'
  return typeof value as PropertyType
}

function discordPropertiesTransformer<T extends Object, U> (source: T): U {
  const transformedPropertiesHolder = {} as {
    [key: string | number | symbol]: any
  }

  const sourceKeys = Object.keys(source) as string[]

  for (var key of sourceKeys) {
    const value = source[key as keyof T]
    if (key.match(/([A-Z])/)) {
      key = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    }
    if (value !== undefined) {
      const propertyType = getPropertyType(value)

      switch (propertyType) {
        case 'object':
          if (value instanceof Date) {
            transformedPropertiesHolder[key] = value.toISOString()
          } else if (Array.isArray(value)) {
            transformedPropertiesHolder[key] = value.map(item =>
              typeof item === 'object' && item.id ? item.id : item
            )
          } else {
            const object_value = value as { [key: string]: any }
            if (value && 'bitfield' in object_value) {
              transformedPropertiesHolder[key] =
                object_value.bitfield.toString()
            }
          }
          break
        case 'function':
          // Ignorer les fonctions
          break
        default:
          transformedPropertiesHolder[key] = value
      }
    }
  }

  return transformedPropertiesHolder as U
}
