import { GROUP } from './constants.js'

/**
 * Default layout and groups
 */
export let DEFAULTS = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    const groups = GROUP
    Object.values(groups).forEach(group => {
        group.name = coreModule.api.Utils.i18n(group.name)
        group.listName = `Group: ${coreModule.api.Utils.i18n(group.listName ?? group.name)}`
    })
    const groupsArray = Object.values(groups)
    DEFAULTS = {
        layout: [
            {
                nestId: 'powers',
                id: 'powers',
                name: coreModule.api.Utils.i18n('ARCHMAGE.powers'),
                groups: [
                    { ...groups.powers, nestId: 'powers_powers',},
                    { ...groups.features, nestId: 'powers_features' },
                    { ...groups.spells, nestId: 'powers_spells' },
                    { ...groups.flexibles, nestId: 'powers_flexibles' },
                    { ...groups.talents, nestId: 'powers_talents' },
                    
                    { ...groups.actions, nestId: 'powers_actions' },
                    { ...groups.traits, nestId: 'powers_traits' },
                    { ...groups.nastierSpecials, nestId: 'powers_nastierSpecials' },
                    
                    { ...groups.atWill, nestId: 'powers_at-will' },
                    { ...groups.oncePerBattle, nestId: 'powers_once-per-battle' },
                    { ...groups.daily, nestId: 'powers_daliy' },
                    { ...groups.recharge, nestId: 'powers_recharge' },
                    { ...groups.cyclic, nestId: 'powers_cyclic' },
                    
                    { ...groups.standard, nestId: 'powers_standard' },
                    { ...groups.move, nestId: 'powers_move' },
                    { ...groups.quick, nestId: 'powers_quick' },
                    { ...groups.free, nestId: 'powers_free' },
                    { ...groups.interupt, nestId: 'powers_interupt' },
                    
                    { ...groups.other, nestId: 'powers_other' },
                ]
            },
            {
                nestId: 'character',
                id: 'character',
                name: coreModule.api.Utils.i18n('TYPES.Actor.character'),
                groups: [
                    { ...groups.abilities, nestId: 'character_abilities'},
                    { ...groups.backgrounds, nestId: 'character_backgrounds' },
                    { ...groups.recoveries, nestId: 'character_recoveries' },
                    { ...groups.saves, nestId: 'character_saves' },
                    { ...groups.icons, nestId: 'character_icons' }
            ]
            },
            {
                nestId: 'inventory',
                id: 'inventory',
                name: coreModule.api.Utils.i18n('ARCHMAGE.inventory'),
                groups: [
                    { ...groups.equipment, nestId: 'inventory_equipment'},
                    { ...groups.loot, nestId: 'inventory_loot' }
            ]
            },
            {
                nestId: 'effects',
                id: 'effects',
                name: coreModule.api.Utils.i18n('ARCHMAGE.effects'),
                groups: [
                    { ...groups.effects, nestId: 'effects_effects' },
                    { ...groups.conditions, nestId: 'effects_conditions' }
                ]
            },
            {
                nestId: 'utility',
                id: 'utility',
                name: coreModule.api.Utils.i18n('tokenActionHud.utility'),
                groups: [
                    { ...groups.combat, nestId: 'utility_combat' },
                    { ...groups.rests, nestId: 'utility_rests' },
                    { ...groups.token, nestId: 'utility_token' },
                    { ...groups.utility, nestId: 'utility_utility' }

                ]
            }
        ],
        groups: groupsArray
    }
})
