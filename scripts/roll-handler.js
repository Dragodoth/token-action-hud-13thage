export let RollHandler = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    /**
     * Extends Token Action HUD Core's RollHandler class and handles action events triggered when an action is clicked
     */
    RollHandler = class RollHandler extends coreModule.api.RollHandler {
        /**
         * Handle action click
         * Called by Token Action HUD Core when an action is left or right-clicked
         * @override
         * @param {object} event        The event
         * @param {string} encodedValue The encoded value
         */
        async handleActionClick(event, encodedValue) {
            const [actionTypeId, actionId] = encodedValue.split('|')

            const renderable = ['item']

            if (renderable.includes(actionTypeId) && this.isRenderItem()) {
                return this.doRenderItem(this.actor, actionId)
            }

            const knownCharacters = ['character']

            // If single actor is selected
            if (this.actor) {
                await this.#handleAction(event, this.actor, this.token, actionTypeId, actionId)
                return
            }

            const controlledTokens = canvas.tokens.controlled
                .filter((token) => knownCharacters.includes(token.actor?.type))

            // If multiple actors are selected
            for (const token of controlledTokens) {
                const actor = token.actor
                await this.#handleAction(event, actor, token, actionTypeId, actionId)
            }
        }

        /**
         * Handle action hover
         * Called by Token Action HUD Core when an action is hovered on or off
         * @override
         * @param {object} event        The event
         * @param {string} encodedValue The encoded value
         */
        async handleActionHover(event, encodedValue) {
            console.log(encodedValue)
            const types = ['feature', 'item', 'spell', 'weapon', 'magicItem']
            const [actionType, actionId] = encodedValue.split('|')

            if (!types.includes(actionType)) return

            const item = coreModule.api.Utils.getItem(this.actor, actionId)

            switch (event.type) {
                case 'mouseenter':
                case 'mouseover':
                    Hooks.call('tokenActionHudSystemActionHoverOn', event, item)
                    break
                case 'mouseleave':
                case 'mouseout':
                    Hooks.call('tokenActionHudSystemActionHoverOff', event, item)
                    break
            }
        }

        /**
         * Handle group click
         * Called by Token Action HUD Core when a group is right-clicked while the HUD is locked
         * @override
         * @param {object} event The event
         * @param {object} group The group
         */
        async handleGroupClick(event, group) {}

        /**
         * Handle action
         * @private
         * @param {object} event        The event
         * @param {object} actor        The actor
         * @param {object} token        The token
         * @param {string} actionTypeId The action type id
         * @param {string} actionId     The actionId
         */
        async #handleAction(event, actor, token, actionTypeId, actionId) {
            switch (actionTypeId) {
                case 'item':
                    this.#handleItemAction(actor, actionId)
                    break
                case 'utility':
                    this.#handleUtilityAction(event, actor, token, actionId)
                    break
                case 'ability':
                    this.#handleAbilityAction(actor, actionId)
                    break
                case 'save':
                    this.#handleSaveAction(actor, actionId)
                    break
                case 'icon':
                    this.#handleIconAction(event, actor, actionId)
                    break
                case 'recovery':
                    this.#handleRecoveryAction(event, actor, actionId)
                    break
                case 'effect':
                    this.#handleEffectAction(event, actor, token, actionId)
                    break
                case 'condition':
                    if (!token) return
                    await this.#toggleCondition(event, actor, token, actionId)
                    break
            }
        }

        /**
         * Handle item action
         * @private
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleItemAction(actor, actionId) {
            if (!actor) return
            const item = actor.items.get(actionId)
            //item.toChat(event)
            item.roll()
        }
        
        /**
         * Handle ability action
         * @private
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleAbilityAction(actor, actionId) {
            if (!actor) return
            const abilities = actor?.system?.abilities
            if (!abilities) return
            (Object.keys(abilities).includes(actionId)) ? actor.rollAbilityTest(actionId) : actor.rollAbilityTest(null, actionId)
        }
        
        /**
         * Handle effect action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {object} token    The token
         * @param {string} actionId The action id
         */
        async #handleEffectAction(event, actor, token, actionId) {
            try {
                if (!actor) return
                const effects = 'find' in actor.effects.entries ? actor.effects.entries : actor.effects
                let effect = effects.find(effect => effect.id === actionId)
                
                // only allow deletion if effect is directly on this actor
                let internalEffect = true
                
                // if the effect isn't directly on the actor, search all applicable effects for it
                if (!effect) {
                    internalEffect = false
                    for (const e of actor.allApplicableEffects()) {
                        if (e.id === actionId) {
                            effect = e
                        }
                    }
                }
                
                
                
                if (!effect) return
                    
                    const isRightClick = this.isRightClick(event)
                    const isShift = this.isShift(event)
                    
                    if (isRightClick && isShift && internalEffect) {
                        await effect.delete()
                    } else {
                        await effect.update({ disabled: !effect.disabled })
                    }
                
                Hooks.callAll('forceUpdateTokenActionHud')
            } catch (e) {
                coreModule.api.Logger.error(e);
                return null;
            }
        }
        
        /**
         * Toggle Condition
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {object} token    The token
         * @param {string} actionId The action id
         */
        async #toggleCondition (event, actor, token, actionId) {
            if (!token) return

            const isRightClick = this.isRightClick(event)
            const statusEffect = CONFIG.statusEffects.find(statusEffect => statusEffect.id === actionId)
            const condition = this.#findCondition(actionId)
            if (!condition) return
            const effect = this.#findEffect(actor, actionId)
            if (effect?.disabled) { await effect.delete() }

            isRightClick
                ? await token.toggleEffect(condition, { overlay: true })
                : await token.toggleEffect(condition)
            

            Hooks.callAll('forceUpdateTokenActionHud')
        }

        /**
         * Handle save action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {object} token    The token
         * @param {string} actionId The action id
         */
        async #handleSaveAction(actor, actionId) {
            if (!actor) return
            await actor.rollSave(actionId)
        }
        
        /**
         * Handle recovery action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {object} token    The token
         * @param {string} actionId The action id
         */
        async #handleRecoveryAction(event, actor, actionId) {
            if (!actor) return
            if (actionId === 'dialog') {
                await actor.rollRecoveryDialog(event)
                return
            }
            const isFree = (actionId === 'free')
            const labelFree = (actionId === 'free') ? game.i18n.localize("ARCHMAGE.recoveryFreeChat") : ''
            await actor.rollRecovery({label: labelFree, free: isFree, createMessage: true})
        }
        
        /**
         * Handle icon action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {object} token    The token
         * @param {string} actionId The action id
         */
        async #handleIconAction(event, actor, actionId) {
            if (!actor) return
                
            const actorData = actor.system
                try {
                    const isRightClick = this.isRightClick(event)
                    if (actorData.icons[actionId] && isRightClick) {
                        let icon = actorData.icons[actionId];
                        let roll = new Roll(`${icon.bonus.value}d6`);
                        let result = await roll.roll({async: true});
                        
                        let fives = 0;
                        let sixes = 0;
                        var rollResults;
                        
                        let actorIconResults = [];
                        
                        rollResults = result.terms[0].results;
                        rollResults.forEach(rollResult => {
                            if (rollResult.result == 5) {
                                fives++;
                                actorIconResults.push(5);
                            }
                            else if (rollResult.result == 6) {
                                sixes++;
                                actorIconResults.push(6);
                            }
                            else {
                                actorIconResults.push(0);
                            }
                        });
                        
                        // Basic template rendering data
                        const template = `systems/archmage/templates/chat/icon-relationship-card.html`
                        const token = this.actor.token;
                        
                        // Basic chat message data
                        const chatData = {
                        user: game.user.id,
                        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                        roll: roll,
                        speaker: game.archmage.ArchmageUtility.getSpeaker(this.actor)
                        };
                        
                        const templateData = {
                        actor: this.actor,
                        tokenId: token ? `${token.id}` : null,
                        icon: icon,
                        fives: fives,
                        sixes: sixes,
                        hasFives: fives > 0,
                        hasSixes: sixes > 0,
                        data: chatData
                        };
                        
                        // Render the template
                        chatData["content"] = await renderTemplate(template, templateData);
                        
                        let message = await game.archmage.ArchmageUtility.createChatMessage(chatData);
                        
                        // Update actor.
                        let updateData = {};
                        updateData[`data.icons.${actionId}.results`] = actorIconResults;
                        await this.actor.update(updateData);
                        
                        // Card support
                        if (game.decks) {
                            
                            for (var x = 0; x < fives; x++) {
                                await addIconCard(icon.name.value, 5);
                            }
                            for (var x = 0; x < sixes; x++) {
                                await addIconCard(icon.name.value, 6);
                            }
                            
                            async function addIconCard(icon, value) {
                                let decks = game.decks.decks;
                                for (var deckId in decks) {
                                    let msg = {
                                    type: "GETALLCARDSBYDECK",
                                    playerID: game.users.find(el => el.isGM && el.active).id,
                                    deckID: deckId
                                    };
                                    
                                    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
                                    
                                    let foundCard = undefined;
                                    game.socket.on("module.cardsupport", async (recieveMsg) => {
                                        if (recieveMsg?.cards == undefined || foundCard) return;
                                        let card = recieveMsg.cards.find(x => x?.flags?.world?.cardData?.icon && x.flags.world.cardData.icon == icon && x.flags.world.cardData.value == value);
                                        
                                        if (card) {
                                            await ui.cardHotbar.populator.addToPlayerHand([card]);
                                            foundCard = true;
                                            // Unbind
                                            game.socket.off("module.cardsupport");
                                        }
                                        foundCard = false;
                                    });
                                    
                                    game.socket.emit("module.cardsupport", msg);
                                    
                                    await wait(200);
                                    // Unbind
                                    game.socket.off("module.cardsupport");
                                    if (foundCard) return;
                                }
                            }
                        }
                        
                        return message;
                    }
                } catch (e) {
                coreModule.api.Logger.error(e);
                return null;
            }
        }
        
        /**
         * Handle utility action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {object} token    The token
         * @param {string} actionId The action id
         */
        async #handleUtilityAction(event, actor, token, actionId) {
            switch (actionId) {
                case 'endTurn':
                    if (game.combat?.current?.tokenId === token.id) {
                        await game.combat?.nextTurn()
                    }
                    break
                case 'quickRest':
                    if (!actor) return
                    actor.restQuick()
                    break
                case 'fullHeal':
                    if (!actor) return
                    actor.restFull()
                    break
                case 'initiative':
                    if (!actor) return
                    let combat = game.combat;
                    if (!combat) {
                        ui.notifications.warn(game.i18n.localize("COMBAT.NoneActive"));
                        break
                    }
                    await actor.rollInitiative({createCombatants: true})
                    Hooks.callAll('forceUpdateTokenActionHud')
                    break
            }
        }
        
        /**
         * Find condition
         * @private
         * @param {string} actionId The action id
         * @returns {object}        The condition
         */
        #findCondition (actionId) {
            return CONFIG.statusEffects.find((effect) => effect.id === actionId)
        }

        /**
         * Find effect
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         * @returns {object}        The effect
         */
        #findEffect (actor, actionId) {
            if (game.version.startsWith('11')) {
                return actor.effects.find(effect => effect.statuses.every(status => status === actionId))
            } else {
                // V10
                return actor.effects.find(effect => effect.flags?.core?.statusId === actionId)
            }
        }
    }
})
