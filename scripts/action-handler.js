// System Module Imports

import { ACTION_TYPE, ITEM_TYPE, ACTION_NAME, TOOLTIP_PROPERTIES, NOT_USED_TOOLTIP_TRAITS } from './constants.js'
import { Utils } from './utils.js'


export let ActionHandler = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    /**
     * Extends Token Action HUD Core's ActionHandler class and builds system-defined actions for the HUD
     */
    ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
        /**
         * Build system actions
         * Called by Token Action HUD Core
         * @override
         * @param {array} groupIds
         */

        powersGroup = null
        abbreviateAbilities = null
        showUsedItems = null
        
        async buildSystemActions (groupIds) {
            // Set actor and token variables
            this.actors = (!this.actor) ? this.#getActors() : [this.actor]
            this.tokens = (!this.token) ? this.#getTokens() : [this.token]
            this.actorType = this.actor?.type



            // Set items variable
            if (this.actor) {
                let items = this.actor.items
                items = coreModule.api.Utils.sortItemsByName(items)
                this.items = items
            }
            
            // Settings
            this.powersGroup = Utils.getSetting('powersGroup')
            this.abbreviateAbilities = Utils.getSetting('abbreviateAbilities')
            this.showUsedItems = Utils.getSetting('showUsedItems')
            
            this.style = coreModule.api.Utils.getSetting('style')
            
            
            if (this.actorType === 'character') {

                await this.#buildCharacterActions()
            } else if (this.actorType === 'npc') {
                this.#buildNpcActions()
            } else if (!this.actor) {
                this.#buildMultipleTokenActions()
            }
        }

        
        /**
         * Build character actions
         * @private
         */

        async #buildCharacterActions () {
            this.#buildAbilities()
            this.#buildBackgrounds()
            this.#buildCombat()
            this.#buildConditions()
            this.#buildEffects()
            this.#buildIcons()
            this.#buildInventory()
            await this.#buildPowers()
            this.#buildRecoveries()
            this.#buildRests()
            this.#buildSaves()
        }

        /**
         * Build character actions
         * @private
         */
        #buildNpcActions () {
            this.#buildCombat()
            this.#buildConditions()
            this.#buildEffects()
            this.#buildNpcPowers()
            this.#buildSaves()
        }
        
        /**
         * Build multiple token actions
         * @private
         * @returns {object}
         */
        #buildMultipleTokenActions () {
            this.#buildCombat()
            this.#buildConditions()
            this.#buildRests()
            this.#buildSaves()
        }

        /**
         * Build abilities
         * @private
         */

        
        async #buildAbilities () {
            const actionTypeId = 'ability'
            // Get abilities
            const abilities = this.actor.system?.abilities
            
            // Exit if no abilities exist
            if (abilities.length === 0) return
                const groupData = { id: 'abilities', type: 'system' }
                
                const actions = Object.entries(abilities)
                    .filter((ability) => abilities[ability[0]].value !== 0)
                    .map(([abilityId, ability]) => {
                        const id = `${actionTypeId}-${abilityId}`
                        const abbreviatedName = abilityId.charAt(0).toUpperCase() + abilityId.slice(1)
                        const label = abilities[abilityId].label
                        const name = this.abbreviateAbilities ? abbreviatedName : label
                        const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId])}: ` ?? ''
                        const listName = `${actionTypeName}${name}`
                        const mod = ability?.mod ?? ''
                        const modLvl = ability?.lvl ?? ''
                        const info1 = { text: coreModule.api.Utils.getModifier(mod) } ?? null
                        const info2 = { text: coreModule.api.Utils.getModifier(modLvl) } ?? null
                        const encodedValue = [actionTypeId, abilityId].join(this.delimiter)
                       
                        return {
                            id,
                            name,
                            listName,
                            info1,
                            info2,
                            encodedValue
                        }
                })
                this.addActions(actions, groupData)
            
        }
        
        /**
         * Build backgrounds
         * @private
         */
        #buildBackgrounds () {
            const actionTypeId = 'ability'
            
            // Get icons
            const backgrounds = this.actor?.system?.backgrounds
            
            // Exit if no icons exist
            if (backgrounds.length === 0) return
                
            const actions = Object.entries(backgrounds)
                .filter((background) => backgrounds[background[0]].isActive.value)
                .map((background) => {
                    const id = `${actionTypeId}-${background[1].name.value}`
                    const name = background[1].name.value
                    const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId])}: ` ?? ''
                    const listName = `${actionTypeName}${name}`
                    const mod = background[1]?.bonus.value ?? ''
                    const info1 = { text: coreModule.api.Utils.getModifier(mod) } ?? null
                    const encodedValue = [actionTypeId, name].join(this.delimiter)
                    
                    return {
                        id,
                        name,
                        info1,
                        listName,
                        encodedValue
                    }
            })
                
            // Create group data
            const groupData = { id: 'backgrounds', type: 'system' }

            // Add actions to HUD
            this.addActions(actions, groupData)
        }
        
        /**
         * Build combat
         * @private
         */
        #buildCombat () {
            const actionTypeId = 'utility'

            // Set combat types
            const combatTypes = {
                initiative: { id: 'initiative', name: coreModule.api.Utils.i18n('tokenActionHud.ARCHMAGE.rollInitiative') },
                endTurn: { id: 'endTurn', name: coreModule.api.Utils.i18n('tokenActionHud.endTurn') }
            }

            // Delete endTurn for multiple tokens
            if (game.combat?.current?.tokenId !== this.token?.id) delete combatTypes.endTurn

            // Get actions
            const actions = Object.entries(combatTypes).map((combatType) => {
                const id = combatType[1].id
                const name = combatType[1].name
                const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId])}: ` ?? ''
                const listName = `${actionTypeName}${name}`
                const encodedValue = [actionTypeId, id].join(this.delimiter)
                const info1 = {}
                let cssClass = ''
                if (combatType[0] === 'initiative' && game.combat) {
                    const tokens = coreModule.api.Utils.getControlledTokens()
                    const tokenIds = tokens?.map((token) => token.id)
                    const combatants = game.combat.combatants.filter((combatant) => tokenIds.includes(combatant.tokenId))

                    // Get initiative for single token
                    if (combatants.length === 1) {
                        const currentInitiative = combatants[0].initiative
                        info1.class = 'tah-spotlight'
                        info1.text = currentInitiative
                    }

                    const active = combatants.length > 0 && (combatants.every((combatant) => combatant?.initiative)) ? ' active' : ''
                    cssClass = `toggle${active}`
                }
                return {
                    id,
                    name,
                    encodedValue,
                    info1,
                    cssClass,
                    listName
                }
            })

            // Create group data
            const groupData = { id: 'combat', type: 'system' }

            // Add actions to HUD
            this.addActions(actions, groupData)
        }
        
        /**
         * Build conditions
         * @private
         */
        async #buildConditions () {
            if (this.tokens?.length === 0) return

            const actionTypeId = 'condition'

            // Get conditions
            const conditions = CONFIG.statusEffects.filter((condition) => condition.id !== '')

            // Exit if no conditions exist
            if (conditions.length === 0) return

            // Get actions
            const actions = await Promise.all(conditions.map(async (condition) => {
                const id = condition.id

                const name = coreModule.api.Utils.i18n(condition.label) ?? coreModule.api.Utils.i18n(condition.name)
                const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId])}: ` ?? ''
                const listName = `${actionTypeName}${name}`
                const encodedValue = [actionTypeId, id].join(this.delimiter)
                const active = this.actors.every((actor) => {
                    if (game.version.startsWith('11')) {
                        return actor.effects.some(effect => effect.statuses.some(status => status === id) && !effect?.disabled)
                    } else {
                        // V10
                        return actor.effects.some(effect => effect.flags?.core?.statusId === id && !effect?.disabled)
                    }
                })
                    ? ' active'
                    : ''
                const cssClass = `toggle${active}`
                const img = coreModule.api.Utils.getImage(condition)
                return {
                    id,
                    name,
                    encodedValue,
                    img,
                    cssClass,
                    listName
                }
            }))

            // Create group data
            const groupData = { id: 'conditions', type: 'system' }

            // Add actions to HUD
            this.addActions(actions, groupData)
        }

        /**
         * Build effects
         * @private
         */
        async #buildEffects () {
            const actionTypeId = 'effect'
            
            // Get effects
            const effects = new Map()
                for (const effect of this.actor.allApplicableEffects()) {
                    // exclude status effects
                    if (!effect.statuses.size) effects.set(effect.id, effect)
                }
                // Exit if no effects exist
                if (effects.size === 0) return
                
                const actions = await Promise.all([...effects].map(async ([effectId,effectData]) => {
                    
                    const id = effectId
                    const name = effectData.name
                    const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId])}: ` ?? ''
                    const listName = `${actionTypeName}${name}`
                    const encodedValue = [actionTypeId, id].join(this.delimiter)
                    
                    const img = coreModule.api.Utils.getImage(effectData)
                    const active = this.actors.every((actor) => actor.effects.some(effect => effect.id === id && !effect?.disabled))
                        ? ' active'
                        : ''
                    const cssClass = `toggle${active}`
                    const duration = effectData.flags?.archmage?.duration ?? 'Unknown'
                    const info1 = { text: coreModule.api.Utils.i18n("ARCHMAGE.DURATION." + `${duration}`) ?? '' }
                    return {
                        id,
                        name,
                        encodedValue,
                        img,
                        info1,
                        cssClass,
                        listName
                    }
                }))
                
                // Create group data
                const groupData = { id: 'effects', type: 'system' }

                // Add actions to HUD
                this.addActions(actions, groupData)
        }
        
        /**
         * Build icons
         * @private
         */
        #buildIcons () {
            const actionTypeId = 'icon'
            
            // Get icons
            const icons = this.actor?.system?.icons
            
            // Exit if no icons exist
            if (icons.length === 0) return
            
                
            const actions = Object.entries(icons)
                .filter((icon) => icons[icon[0]].isActive.value)
                .map(([iconId, iconData]) => {
                    const id = `${actionTypeId}-${iconId}`
                    const name = iconData.name.value

                    const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId])}: ` ?? ''
                    const listName = `${actionTypeName}${name}`
                    const encodedValue = [actionTypeId, iconId].join(this.delimiter)
                    
                    const active = iconData.results.some(r => [5,6].includes(r))
                        ? ' active'
                        : ''
                    const cssClass = `toggle${active}`
                    
                    return {
                        id,
                        name,
                        listName,
                        cssClass,
                        encodedValue
                    }
            })
                
            // Create group data
            const groupData = { id: 'icons', type: 'system' }

            // Add actions to HUD
            this.addActions(actions, groupData)
                
        }
        
        /**
         * Build inventory
         * @private
         */
        async #buildInventory () {
            if (this.items.size === 0) return
                
            const actionTypeId = 'item'
            const itemsMap = new Map()
            
                for (const [itemId, itemData] of this.items) {
                   
                    if (itemData.type === 'power'/* || !this.#isUsableItem(itemData)*/) continue
                    let type = itemData.type
                    
                    const typeMap = itemsMap.get(type) ?? new Map()
                    typeMap.set(itemId, itemData)
                    itemsMap.set(type, typeMap)
                    
                }
                for (const [type, typeMap] of itemsMap) {
                    const groupId = type
                    
                    if (!groupId) continue
                        
                    const groupData = { id: groupId, type: 'system' }
                        
                    
                    // Get actions
                    const actions = [...typeMap].map(([itemId, itemData]) => {
                        const id = itemId
                        const name = itemData.name
                        const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId])
                        const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`
                        const encodedValue = [actionTypeId, id].join(this.delimiter)
                        const img = coreModule.api.Utils.getImage(itemData)
                        //const info = this.#getItemInfo(itemData)
                        //const info1 = info?.info1
                        //const info2 = info?.info2
                        //const info3 = info?.info3
                        
                        return {
                            id,
                            //info1,
                            //info2,
                            //info3,
                            img,
                            name,
                            listName,
                            encodedValue
                        }
                    })
                    
                    // TAH Core method to add actions to the action list
                    
                    this.addActions(actions, groupData)
                }
        }
        
        /**
         * Build npc powers
         * @private
         */
        async #buildNpcPowers () {
            if (this.items.size === 0) return
                
            const actionTypeId = 'item'
            const itemsMap = new Map()
            
                for (const [itemId, itemData] of this.items) {
                   
                    let type = itemData.type
                    
                    const typeMap = itemsMap.get(type) ?? new Map()
                    typeMap.set(itemId, itemData)
                    itemsMap.set(type, typeMap)
                    
                }
                for (const [type, typeMap] of itemsMap) {
                    const groupId = ITEM_TYPE[type]?.groupId
                    
                    if (!groupId) continue
                        
                    const groupData = { id: groupId, type: 'system' }
                        
                    
                    // Get actions
                    const actions = [...typeMap].map(([itemId, itemData]) => {
                        const id = itemId
                        const name = itemData.name
                        const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId])
                        const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`
                        const encodedValue = [actionTypeId, id].join(this.delimiter)
                        const img = coreModule.api.Utils.getImage(itemData)
                        //const info = this.#getItemInfo(itemData)
                        //const info1 = info?.info1
                        //const info2 = info?.info2
                        //const info3 = info?.info3
                        
                        const tooltipData = this.#getTooltipData(itemData)
                        const tooltip = this.#getTooltip(tooltipData, this.actor)
                        
                        return {
                            id,
                            //info1,
                            //info2,
                            //info3,
                            img,
                            tooltip,
                            name,
                            listName,
                            encodedValue
                        }
                    })
                    
                    // TAH Core method to add actions to the action list
                    this.addActions(actions, groupData)
                }
        }
        
        /**
         * Build powers
         * @private
         */
        async #buildPowers () {
            if (this.items.size === 0) return
                
            const actionTypeId = 'item'
            const powersMap = new Map()
            
                for (const [itemId, itemData] of this.items) {
                   
                    if (itemData.type != 'power' || !this.#isUsableItem(itemData)) continue
                    let type = itemData.system[this.powersGroup]?.value
                    
                    if (!type) type = 'other'
                    const typeMap = powersMap.get(type) ?? new Map()
                    typeMap.set(itemId, itemData)
                    powersMap.set(type, typeMap)
                    
                }
                for (const [type, typeMap] of powersMap) {
                    const groupId = ITEM_TYPE[type]?.groupId
                    
                    if (!groupId) continue
                        
                        const groupData = { id: groupId, type: 'system' }
                        
                    
                    // Get actions
                    const actions = [...typeMap].map(([itemId, itemData]) => {
                        const id = itemId
                        const name = itemData.name
                        const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId])
                        const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`
                        const encodedValue = [actionTypeId, id].join(this.delimiter)
                        const img = coreModule.api.Utils.getImage(itemData)
                        const info = this.#getItemInfo(itemData)
                        const info1 = info?.info1
                        const info2 = info?.info2
                        const info3 = info?.info3
                        
                        const tooltipData = this.#getTooltipData(itemData)
                        const tooltip = this.#getTooltip(tooltipData, this.actor)
                        
                        // Color buttons by usage type
                        const cssClass = itemData.system?.powerUsage.value ?? ''
                        
                        return {
                            id,
                            info1,
                            info2,
                            info3,
                            img,
                            name,
                            tooltip,
                            listName,
                            cssClass,
                            encodedValue
                        }
                    })
                    
                    // TAH Core method to add actions to the action list
                    
                    this.addActions(actions, groupData)
                }
        }
        
        /**
         * Build recoveries
         * @private
         */
        #buildRecoveries () {
            const actionTypeId = 'recovery'

            // Set save types
            const recoveryTypes = {
                normal: { id: 'normal', name: coreModule.api.Utils.i18n('ARCHMAGE.recoveryNormal') },
                free: { id: 'free', name: coreModule.api.Utils.i18n('ARCHMAGE.recoveryFree') },
                dialog: { id: 'dialog', name: coreModule.api.Utils.i18n('tokenActionHud.ARCHMAGE.recoveryDialog') }
            }
            
            // Get actions
            const actions = Object.entries(recoveryTypes).map((recoveryType) => {
                const id = recoveryType[1].id
                const name = recoveryType[1].name
                const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId])}: ` ?? ''
                const listName = `${actionTypeName}${name}`
                const encodedValue = [actionTypeId, id].join(this.delimiter)
                return {
                    id,
                    name,
                    encodedValue,
                    listName
                }
            })

            // Create group data
            const groupData = { id: 'recoveries', type: 'system' }

            // Add actions to HUD
            this.addActions(actions, groupData)
        }
        
        /**
         * Build rests
         * @private
         */
        #buildRests () {
            // Exit if every actor is not the character type
            if (this.actors.length === 0) return
                if (!this.actors.every(actor => actor.type === 'character')) return
                    
                    const actionTypeId = 'utility'
                    
                    // Set rest types
                    const restTypes = {
                    quickRest: { name: coreModule.api.Utils.i18n('ARCHMAGE.CHAT.QuickRest'), icon: 'fas fa-campground' },
                    fullHeal: { name: coreModule.api.Utils.i18n('ARCHMAGE.CHAT.FullHeal'),icon: 'fas fa-bed' }
                    }

                
                // Get actions
                const actions = Object.entries(restTypes)
                .map((restType) => {
                    const id = restType[0]
                    const name = restType[1].name
                    const icon = restType[1].icon
                    const icon1 = `<i class="${icon}" title=""></i>`
                    const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId])}: ` ?? ''
                    const listName = `${actionTypeName}${name}`
                    const encodedValue = [actionTypeId, id].join(this.delimiter)
                    return {
                        id,
                        name,
                        icon1,
                        encodedValue,
                        listName
                    }
                })
                
                // Create group data
                const groupData = { id: 'rests', type: 'system' }
                
                // Add actions to HUD
                this.addActions(actions, groupData)
        }
        
        /**
         * Build saves
         * @private
         */
        #buildSaves () {
            const actionTypeId = 'save'

            // Set save types
            const saveTypes = {
                easy: { id: 'easy', name: coreModule.api.Utils.i18n('ARCHMAGE.SAVE.easyShort') },
                normal: { id: 'normal', name: coreModule.api.Utils.i18n('ARCHMAGE.SAVE.normalShort') },
                hard: { id: 'hard', name: coreModule.api.Utils.i18n('ARCHMAGE.SAVE.hardShort') },
                disengage: { id: 'disengage', name: coreModule.api.Utils.i18n('ARCHMAGE.disengage') },
                death: { id: 'death', name: coreModule.api.Utils.i18n('ARCHMAGE.SAVE.death') },
                lastGasp: { id: 'lastGasp', name: coreModule.api.Utils.i18n('ARCHMAGE.SAVE.lastGasp') }
            }

            
            // Get actions
            const actions = Object.entries(saveTypes).map((saveType) => {
                const id = saveType[1].id
                const name = saveType[1].name
                const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId])}: ` ?? ''
                const listName = `${actionTypeName}${name}`
                const encodedValue = [actionTypeId, id].join(this.delimiter)
                return {
                    id,
                    name,
                    encodedValue,
                    listName
                }
            })

            // Create group data
            const groupData = { id: 'saves', type: 'system' }

            // Add actions to HUD
            this.addActions(actions, groupData)
        }
        
        /**
         * Get actors
         * @private
         * @returns {object}
         */
        #getActors () {
            const allowedTypes = ['character', 'npc']
            const tokens = coreModule.api.Utils.getControlledTokens()
            const actors = tokens?.filter(token => token.actor).map((token) => token.actor)
            if (actors.every((actor) => allowedTypes.includes(actor.type))) {
                return actors
            } else {
                return []
            }
        }
        
        /**
         * Get tokens
         * @private
         * @returns {object}
         */
        #getTokens () {
            const allowedTypes = ['character', 'npc']
            const tokens = coreModule.api.Utils.getControlledTokens()
            const actors = tokens?.filter(token => token.actor).map((token) => token.actor)
            if (actors.every((actor) => allowedTypes.includes(actor.type))) {
                return tokens
            } else {
                return []
            }
        }
        
            /**
             * Get item info
             * @private
             * @param {object} itemData
             * @returns {object}
             */
        #getItemInfo (data) {
            
            const actionData = this.#getActionData(data)
            const usesData = this.#getUsesData(data)
            const rechargeData = this.#getRechargeData(data)
            
            return {
            info1: { text: actionData },
            info2: { text: usesData },
            info3: { text: rechargeData }
            }
        }
            /**
             * Get action
             * @private
             * @param {object} itemData
             * @returns {string}
             */
            #getActionData (data) {
                if (!data) return ''
                const type = (this.powersGroup === 'powerUsage') ? 'actionType' : (this.style != 'template') ? 'powerUsage' : ''
                const action = data.system[type]?.value
                if (!action) return ''
                return coreModule.api.Utils.i18n(ACTION_NAME[action]) ?? ''
            }
            

            /**
             * Get uses
             * @private
             * @param {object} itemData
             * @returns {string}
             */
            #getUsesData (data) {
                if (!data) return ''
                return (data.system?.quantity.value > 0 || data.system?.maxQuantity.value > 0) ? `${data.system.quantity.value ?? '0'}${(data.system.maxQuantity.value > 0) ? `/${data.system?.maxQuantity.value}` : ''}` : ''
            }

            /**
             * Get recharge
             * @private
             * @param {object} itemData
             * @returns {string}
             */
            #getRechargeData (data) {
                if (!data) return ''
                const recharge = data.system?.recharge.value
                if (!recharge) return ''
                return `${recharge}+ ` ?? ''
            }
        
            #getTooltipData (data) {
                if (this.tooltipsSetting === 'none') return ''
                const name = data?.name ?? ''
                if (this.tooltipsSetting === 'nameOnly') return name
                const description = data.system?.description?.value
                const properties = Object.entries(data?.system).filter(entry => entry[1]?.value && TOOLTIP_PROPERTIES.includes(entry[0])).map(entry => entry[1].value)
                const traits = Object.entries(data?.system).filter(entry => entry[1]?.value && ![...TOOLTIP_PROPERTIES, ...NOT_USED_TOOLTIP_TRAITS].includes(entry[0])).map(([traitName, traitText]) =>[
                        traitName,
                        traitText?.value
                    ])
                const feats = (data.system?.feats) ? Object.values(data.system.feats).filter(feat => feat.isActive.value).map(feat => [feat.tier.value,feat.description.value])
                     : []
                const range = data.system?.range?.value
                const level = data.system?.powerLevel?.value
                return { name, description, properties, traits, feats, range, level}
            }

        
            /**
             * Get tooltip
             * @param {object} tooltipData The tooltip data
             * @returns {string}           The tooltip
             */
            #getTooltip (tooltipData, actor) {
                if (this.tooltipsSetting === 'none') return ''
                if (typeof tooltipData === 'string') return tooltipData

                const name = coreModule.api.Utils.i18n(tooltipData.name)

                if (this.tooltipsSetting === 'nameOnly') return name

                const nameHtml = `<h3>${name}</h3>`

                const description = tooltipData?.description ?? ''
                
                const rangeHtml = tooltipData?.range
                    ? `<em>${tooltipData.range}</em>`
                    : ''
                    
                const traitsHtmlInline = tooltipData?.traits
                ? `<div class="tah-tags">${rangeHtml}${tooltipData.traits.map(([traitName, traitText]) => `<div><span class="tah-tag"><strong>${coreModule.api.Utils.i18n("ARCHMAGE.CHAT." + traitName)}:</strong> ${traitText}</span></div>`).join('')}</div>`
                    : ''
                
                const diceFormulaMode = actor?.flags?.archmage?.diceFormulaMode ?? 'short'
                
                const traitsHtml = this.#wrapRolls(traitsHtmlInline, [], diceFormulaMode, this.actor.getRollData())
                
                const levelHtml = tooltipData?.level ? `<span class="tah-property">${coreModule.api.Utils.i18n("ARCHMAGE.level")} ${tooltipData.level}</span>` : ''
                
                const propertiesHtml = tooltipData?.properties
                    ? `<div class="tah-properties">${tooltipData.properties.map(property => `<span class="tah-property">${coreModule.api.Utils.i18n("ARCHMAGE." + property)}</span>`).join('')}${levelHtml}</div>`
                    : ''
                
                const featsHtmlInline = tooltipData?.feats
                ? `${tooltipData.feats.map(([featTier, featText]) => `<div class="tah-tags tah-tag-feat"><span class="tah-tag"><strong>${coreModule.api.Utils.i18n("ARCHMAGE.CHAT." + featTier)}:</strong> ${featText}</span></div>`).join('')}`
                    : ''
                
                
                
                const featsHtml = this.#wrapRolls(featsHtmlInline, [], diceFormulaMode, this.actor.getRollData())
                
                const headerTags = (traitsHtml || featsHtml) ? `<div class="tah-tags-wrapper">${traitsHtml}${featsHtml}</div>` : ''

                if (!description && !traitsHtml && !featsHtml) return name
                    
                return `<div>${nameHtml}${headerTags}${description}${propertiesHtml}</div>`
            }
       
            /**
             * Is usable item
             * @private
             * @param {object} item The item
             * @returns {boolean}
             */
            #isUsableItem (data) {
                if (this.showUsedItems) return true
                const uses = data.system?.quantity.value
                const maxUses = data.system?.maxQuantity.value
                if (!uses && maxUses) return false
                return true
            }
        
        /**
         * Replace inline rolls with alternate formatting and wrap with an additional
         * span tag for formatting.
         *
         * @param {string} text String to run replacements on.
         * @param {array} replacements Array of replacements. Each array item should be
         *   an array with the first index being the key to replace and the second index
         *   being the replacement.
         * @param {string} diceFormulaMode Defaults to 'short'. The replacement mode for
         *   dice formulas, which can be 'short', 'long', or 'numeric'.
         * @param {object|null} rollData Optional roll data to pass for numeric
         *   replacements.
         * @param {string} field Field the replacement is happening for, such as the
         *   'attack' field.
         *
         * @returns {string}
         */
        #wrapRolls(text, replacements = [], diceFormulaMode = 'short', rollData = null, field = null) {
          // Unproxy the roll data object.
          rollData = rollData ? JSON.parse(JSON.stringify(rollData)) : {};

          // Fallback.
          if (!diceFormulaMode) diceFormulaMode = 'short';

          // Build a map of string replacements.
          let replaceMap = replacements.concat([
            // Put these at the top for higher replacement priority
            ['[[/r', '<span class="expression">'],
            ['(@lvl)d(@wpn.m.dieNum-2)', '(WPN-2)'],
            ['(@lvl)d(@wpn.r.dieNum-2)', '(WPN-2)'],
            // Common replacements
            ['[[', '<span class="expression">'],
            [']]', '</span>'],
            ['@ed', 'ED'],
            ['@lvl', 'LVL'],
            ['@std', 'LVL+ED'], //STD
            ['@tier', 'TIER'],
            ['@str.mod', 'STR'],
            ['@str.dmg', 'STR×TIER'],
            ['@con.mod', 'CON'],
            ['@con.dmg', 'CON×TIER'],
            ['@dex.mod', 'DEX'],
            ['@dex.dmg', 'DEX×TIER'],
            ['@int.mod', 'INT'],
            ['@int.dmg', 'INT×TIER'],
            ['@wis.mod', 'WIS'],
            ['@wis.dmg', 'WIS×TIER'],
            ['@cha.mod', 'CHA'],
            ['@cha.dmg', 'CHA×TIER'],
            ['@atk.mod', 'ATK'],
            ['@wpn.m.dice', 'WPN'],
            ['@wpn.r.dice', 'WPN'],
            ['@wpn.j.dice', 'JAB'],
            ['@wpn.p.dice', 'PUNCH'],
            ['@wpn.k.dice', 'KICK'],
            ['@atk.m.bonus', 'ITM'], //ITM_MLE
            ['@atk.r.bonus', 'ITM'], //ITM_RNG
            ['@atk.a.bonus', 'ITM'], //ITM_ARC
            ['@atk.d.bonus', 'ITM'], //ITM_DIV
          ]);

          // Remove whitespace from inline rolls.
          let clean = text.toString();  // cast to string, could be e.g. number

          // Handle replacements for the 'short' syntax. Ex: WPN+DEX+LVL
          if (diceFormulaMode == 'short') {
            // Remove additional whitespace.
            text.toString().replace(/(\[\[)([^\[]*)(\]\])/g, (match) => {
              clean = clean.replace(match, match.replaceAll(' ', ''));
            });
            // Iterate over all of our potential replacements and replace them if
            // they're present.
            for (let [needle, replacement] of replaceMap) {
              clean = clean.replaceAll(needle, replacement);
            };
          }
          // Handle replacements for the 'long' syntax, which is the original inline
          // roll. Ex: [[@wpn.m.dice+@dex+@lvl]]
          else if (diceFormulaMode == 'long') {
            // Run a regex over all inline rolls.
            clean = text.toString().replaceAll(/(\[\[)([^\[]*)(\]\])/g, (match, p1, p2, p3) => {
              return `<span class="expression">[${p2}]</span>`;
            });
          }
          // Handle replacements for the 'numeric' syntax, which replacements all
          // numeric and static terms and condenses them into as few numbers as
          // possible. Ex: 5d8+9
          else if (diceFormulaMode == 'numeric') {
            // Run a regex over all inline rolls.
            clean = text.toString().replaceAll(/(\[\[)([^\[]*)(\]\])/g, (match, p1, p2, p3) => {
              // Get the roll formula. If this is an attack, append the attack mod.
              let rollFormula = field == 'attack' && p2.includes('d20') ? `${p2} + @atk.mod` : p2;
              // Create the roll and evaluate it.
              let roll = null;
              try {
                roll = new Roll(rollFormula, rollData);
                // @todo this will need to be updated to work with async, but that's
                // complicated in a regex.
                roll.evaluate({async: false});
              } catch (error) {
                roll = null;
                if (rollFormula.startsWith('/')) {
                  rollFormula = `[[${rollFormula}]]`;
                  console.log(`Skipping numeric roll replacement for ${rollFormula}`);
                }
                else {
                  rollFormula = `[${rollFormula}]`;
                  console.warn(error);
                }
              }
              // Duplicate the roll into a condensed version that combines numbers
              // where possible.
              const newRoll = roll?.formula ? this.#rollCondenser(roll) : { formula: rollFormula };
              // Return the replacement.
              return `<span class="expression">${newRoll.formula}</span>`;
            });
          }

          // Call TextEditor.enrichHTML to process remaining object links
          clean = TextEditor.enrichHTML(clean, { async: false})

          // Return the revised text and convert markdown to HTML.
          return parseMarkdown(clean);
        }
        
        /**
         * Condense numeric and operator terms into a single numeric term.
         *
         * @param {array} terms Array of roll term objects.
         * @returns {array}
         */
        #termCondenser(terms) {
          const last = terms.length - 1;
          // Deal with trailing operators.
          if (terms[last]?.operator) {
            terms.splice(last, 1);
          }
          // If there aren't enough terms, exit early.
          if (terms.length < 1) {
            return false;
          }
          // Attempt to create a roll from the terms.
          let r = null;
          try {
            r = Roll.fromTerms(terms);
          } catch (error) {
            console.warn(error);
            return false;
          }
          // Create a new term from the total.
          let t = new NumericTerm({number: r.total}).toJSON();
          t.evaluated = true;
          // Return the new NumericTerm instance.
          return NumericTerm.fromJSON(JSON.stringify(t));
        }
        
        /**
         * Duplicate a roll and return a new version where numeric terms are combined
         * into as few numeric terms as possible. For example, d20+5+3 will become
         * d20+8.
         *
         * @param {object} roll Roll object to modify.
         * @returns
         */
        #rollCondenser(roll) {
          // Initialize our variables.
          let originalTerms = roll.terms;
          let newTerms = [];
          let nestedTerms = [];
          let operator = null;
          let condensedTerm = null;
          let previousTermType = null;

          // Iterate over the original terms.
          originalTerms.forEach(term => {
            // Check to see what kind of term this is.
            switch (term.constructor.name) {
              // If this is a numeric term, push it to our temporary nestedTerms array.
              case 'NumericTerm':
                nestedTerms.push(term);
                break;

              // If this is an operator term, also push it to the temporary nestedTerms
              // array (but skip in certain cases).
              case 'OperatorTerm':
                // If this is the first operator, store that for later when we build
                // our final terms array. Don't store it if it's a double operator and
                // negative (usually means something like d12 + -2).
                // @todo this isn't quite functional yet. Doesn't work well with d12 - d8 + d6 + -3.
                if (previousTermType !== 'OperatorTerm') {
                  operator = term;
                }
                // If this is the first term and is multiplication or division, don't
                // include it in our array since we can't condense it.
                if (nestedTerms.length < 1) {
                  if (['*', '/'].includes(term.operator)) {
                    break;
                  }
                }
                // Append the operator.
                nestedTerms.push(term);
                break;

              // If this is any other kind of term, add to our newTerms array.
              default:
                // If our nestedTerms array has been modified, append it.
                if (nestedTerms.length > 0) {
                  // If there's an operator, we neeed to append it first.
                  if ((operator) && (nestedTerms.length > 1 || nestedTerms[0].constructor.name !== 'OperatorTerm')) {
                    newTerms.push(operator);
                  }
                  // Condense the nestedTerms array into a single numeric term and
                  // append it.
                  condensedTerm = nestedTerms.length > 1 ? this.#termCondenser(nestedTerms) : nestedTerms[0];
                  if (condensedTerm) newTerms.push(condensedTerm);
                }
                // Make sure that there's an operator if we're appending a dice after
                // we previously appended a non-operator.
                if (newTerms.length > 0 && !newTerms[newTerms.length - 1]?.operator) {
                  operator = OperatorTerm.fromJSON(JSON.stringify({
                    class: 'OperatorTerm',
                    evaluated: true,
                    operator: '+'
                  }));
                  newTerms.push(operator);
                }
                // Append our current term as well.
                newTerms.push(term);
                // Reset the nested terms and operator now that they're part of the
                // newTerms array.
                nestedTerms = [];
                operator = null;
                break;
            }

            // Update our previous term for the next iteration.
            previousTermType = term.constructor.name;
          });

          // After the loop completes, we need to also append the operator and
          // nestedTerms if there are any stragglers.
          if (nestedTerms.length > 0) {
            if (operator) {
              newTerms.push(operator);
            }
            condensedTerm = nestedTerms.length > 1 ? this.#termCondenser(nestedTerms) : nestedTerms[0];
            if (condensedTerm) newTerms.push(condensedTerm);
          }

          // Generate the roll and return it.
          let newRoll = false;
          try {
            newRoll = Roll.fromTerms(newTerms);
          } catch (error) {
            // Return the unmodified roll if there's an error.
            console.warn(error);
            return roll;
          }

          return newRoll;
        }
    }
})
