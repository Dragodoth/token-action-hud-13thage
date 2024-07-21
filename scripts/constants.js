/**
 * Module-based constants
 */
export const MODULE = {
    ID: 'token-action-hud-13thage'
}

/**
 * Core module
 */
export const CORE_MODULE = {
    ID: 'token-action-hud-core'
}

/**
 * Core module version required by the system module
 */
export const REQUIRED_CORE_MODULE_VERSION = '1.5'

/**
 * Action types
 */
export const ACTION_TYPE = {
    item: 'ARCHMAGE.item',
    character: 'TYPES.Actor.character',
    ability: 'tokenActionHud.ARCHMAGE.ability',
    save: 'ARCHMAGE.save',
    icon: 'tokenActionHud.ARCHMAGE.icon',
    condition: 'tokenActionHud.ARCHMAGE.condition',
    effect: 'ARCHMAGE.effect',
    utility: 'tokenActionHud.utility'
}

/**
 * Action short names
 */
export const ACTION_NAME = {
    standard: 'STD',
    move: 'MOV',
    quick: 'QCK',
    free: 'FREE',
    interrupt: 'INT',
    'at-will': 'ARCHMAGE.at-will',
    'once-per-battle': 'ARCHMAGE.once-per-battle',
    daily: 'ARCHMAGE.daily',
    recharge: 'ARCHMAGE.recharge',
    cyclic: 'tokenActionHud.ARCHMAGE.cyclic'
}

/**
 * Groups
 */
export const GROUP = {
    powers: { id: 'powers', name: 'ARCHMAGE.powers', type: 'system' },
    features: { id: 'features', name: 'ARCHMAGE.features', type: 'system' },
    spells: { id: 'spells', name: 'ARCHMAGE.spells', type: 'system' },
    flexibles: { id: 'flexibles', name: 'ARCHMAGE.flexibles', type: 'system' },
    talents: { id: 'talents', name: 'ARCHMAGE.talents', type: 'system' },
    
    actions: { id: 'actions', name: 'ARCHMAGE.actions', type: 'system' },
    traits: { id: 'traits', name: 'ARCHMAGE.traits', type: 'system' },
    nastierSpecials: { id: 'nastierSpecials', name: 'ARCHMAGE.nastierSpecials', type: 'system' },
    
    equipment: { id: 'equipment', name: 'ARCHMAGE.equipment', type: 'system' },
    loot: { id: 'loot', name: 'ARCHMAGE.loot', type: 'system' },
    
    abilities: { id: 'abilities', name: 'ARCHMAGE.abilities', type: 'system' },
    backgrounds: { id: 'backgrounds', name: 'ARCHMAGE.backgrounds', type: 'system' },
    recoveries: { id: 'recoveries', name: 'ARCHMAGE.recoveries', type: 'system' },
    saves: { id: 'saves', name: 'ARCHMAGE.saves', type: 'system' },
    icons: { id: 'icons', name: 'ARCHMAGE.iconRelationships', type: 'system' },
    
    atWill: { id: 'at-will', name: 'ARCHMAGE.at-will', type: 'system' },
    oncePerBattle: { id: 'once-per-battle', name: 'ARCHMAGE.once-per-battle', type: 'system' },
    daily: { id: 'daily', name: 'ARCHMAGE.daily', type: 'system' },
    recharge: { id: 'recharge', name: 'ARCHMAGE.recharge', type: 'system' },
    cyclic: { id: 'cyclic', name: 'tokenActionHud.ARCHMAGE.cyclic', type: 'system' },
    
    standard: { id: 'standard', name: 'ARCHMAGE.standard', type: 'system' },
    move: { id: 'move', name: 'ARCHMAGE.move', type: 'system' },
    quick: { id: 'quick', name: 'ARCHMAGE.quick', type: 'system' },
    free: { id: 'free', name: 'ARCHMAGE.free', type: 'system' },
    interrupt: { id: 'interrupt', name: 'ARCHMAGE.interrupt', type: 'system' },
    
    other: { id: 'other', name: 'ARCHMAGE.others', type: 'system' },
    
    effects: { id: 'effects', name: 'ARCHMAGE.effects', type: 'system' },
    conditions: { id: 'conditions', name: 'tokenActionHud.ARCHMAGE.conditions', type: 'system' },
    
    combat: { id: 'combat', name: 'tokenActionHud.combat', type: 'system' },
    token: { id: 'token', name: 'tokenActionHud.token', type: 'system' },
    rests: { id: 'rests', name: 'ARCHMAGE.CHAT.Rests', type: 'system' },
    utility: { id: 'utility', name: 'tokenActionHud.utility', type: 'system' }
}

/**
 * Item types
 */
export const ITEM_TYPE = {
    power: { groupId: 'powers' },
    feature: { groupId: 'features' },
    spell: { groupId: 'spells' },
    flexible: { groupId: 'flexibles' },
    talent: { groupId: 'talents' },
    action: { groupId: 'actions' },
    trait: { groupId: 'traits' },
    nastierSpecial: { groupId: 'nastierSpecials' },
    other: { groupId: 'other' },
    'at-will': { groupId: 'at-will' },
    'once-per-battle': { groupId: 'once-per-battle' },
    daily: { groupId: 'daily' },
    recharge: { groupId: 'recharge' },
    cyclic: { groupId: 'cyclic' },
    standard: { groupId: 'standard' },
    move: { groupId: 'move' },
    quick: { groupId: 'quick' },
    free: { groupId: 'free' },
    interrupt: { groupId: 'interrupt' }
}

/**
 * Properties shown in power tooltip
 */
export const TOOLTIP_PROPERTIES = [
    'actionType',
    'powerUsage',
    'powerSource',
    'powerType'
]

/**
 * Traits not shown in power tolltips
 */
export const NOT_USED_TOOLTIP_TRAITS = [
    'description',
    'embeddedMacro',
    'feats',
    'group',
    'maxQuantity',
    'name',
    'powerLevel',
    'powerOriginName',
    'powerSourceName',
    'quantity',
    'range',
    'sequencer'
]
