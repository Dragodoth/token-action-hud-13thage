import { MODULE } from './constants.js'

/**
 * Register module settings
 * Called by Token Action HUD Core to register Token Action HUD system module settings
 * @param {function} coreUpdate Token Action HUD Core update function
 */
export function register (coreUpdate) {
    game.settings.register(MODULE.ID, 'powersGroup', {
        name: game.i18n.localize('tokenActionHud.ARCHMAGE.settings.powersGroup.name'),
        hint: game.i18n.localize('tokenActionHud.ARCHMAGE.settings.powersGroup.hint'),
        scope: 'world',
        config: true,
        type: String,
        choices: {
            'powerType': game.i18n.localize('tokenActionHud.ARCHMAGE.settings.powersGroup.choice.powerType'),
            'powerUsage': game.i18n.localize('tokenActionHud.ARCHMAGE.settings.powersGroup.choice.powerUsage'),
            'actionType': game.i18n.localize('tokenActionHud.ARCHMAGE.settings.powersGroup.choice.actionType')
        },
        default: 'powerType',
    })
    
    game.settings.register(MODULE.ID, 'abbreviateAbilities', {
           name: game.i18n.localize(
               'tokenActionHud.ARCHMAGE.settings.abbreviateAbilities.name'
           ),
           hint: game.i18n.localize(
               'tokenActionHud.ARCHMAGE.settings.abbreviateAbilities.hint'
           ),
           scope: 'client',
           config: true,
           type: Boolean,
           default: false,
           onChange: (value) => {
               updateFunc(value)
           }
       })
    
    game.settings.register(MODULE.ID, 'showUsedItems', {
            name: game.i18n.localize('tokenActionHud.ARCHMAGE.settings.showUsedItems.name'),
            hint: game.i18n.localize('tokenActionHud.ARCHMAGE.settings.showUsedItems.hint'
            ),
            scope: 'client',
            config: true,
            type: Boolean,
            default: true,
            onChange: (value) => {
                updateFunc(value)
            }
    })
}
