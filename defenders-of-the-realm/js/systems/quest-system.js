// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Quest System & Special Cards UI
// ═══════════════════════════════════════════════════════════════

Object.assign(game, {
    wizardFireball() {
        // Cancel any active movement
        if (this.activeMovement) {
            this.clearMovementMode();
        }
        
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        if (hero.name !== 'Wizard') {
            this.showInfoModal('⚠️', '<div>Only the Wizard can cast Fireball!</div>');
            return;
        }
        
        const minionsHere = this.minions[hero.location];
        if (!minionsHere) {
            this.showInfoModal('⚠️', '<div>No minions at your current location!</div>');
            return;
        }
        
        // Find minion colors present and matching cards
        const minionColors = Object.entries(minionsHere).filter(([c, n]) => n > 0).map(([c]) => c);
        const matchingCards = [];
        hero.cards.forEach((card, idx) => {
            if (minionColors.includes(card.color)) {
                matchingCards.push({ card, idx });
            }
        });
        
        if (matchingCards.length === 0) {
            this.showInfoModal('⚠️', '<div>No cards matching minion colors at this location!</div>');
            return;
        }
        
        // Build card selection UI
        const cardColorMap = {
            'red': '#dc2626',
            'blue': '#2563eb',
            'green': '#16a34a',
            'black': '#1f2937'
        };
        
        let cardsHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px;">';
        matchingCards.forEach(({ card, idx }) => {
            const borderColor = (card.special ? '#9333ea' : (cardColorMap[card.color] || '#666'));
            cardsHTML += `
                <div onclick="game.executeFireball(${idx})" 
                    style="border: 3px solid ${borderColor}; cursor: pointer; padding: 10px; border-radius: 8px; text-align: center; background: rgba(0,0,0,0.3); transition: background 0.2s;"
                    onmouseover="this.style.background='rgba(255,215,0,0.2)'" onmouseout="this.style.background='rgba(0,0,0,0.3)'">
                    <div style="font-size: 2em; margin-bottom: 5px;">${card.icon || '🎴'}</div>
                    <div style="font-weight: bold; color: ${borderColor};">${card.name}</div>
                    <div style="font-size: 0.9em; color: #999; margin-top: 3px;">🎲 ${card.dice} ${card.dice === 1 ? 'die' : 'dice'}</div>
                </div>
            `;
        });
        cardsHTML += '</div>';
        
        const contentHTML = `
            <div style="color: #d4af37; margin-bottom: 12px;">
                Discard a card matching any minion color present to incinerate ALL minions at this location. A roll of 2+ defeats each minion, regardless of type!
            </div>
            <div style="margin-bottom: 8px; font-weight: bold; color: #ffd700;">Select a card to discard:</div>
            ${cardsHTML}
        `;
        
        this.showInfoModal('🔥 Fireball', contentHTML);
        // Hide the Continue button div since we have card buttons
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv) defaultBtnDiv.style.display = 'none';
    },
    
    executeFireball(cardIndex) {
        const hero = this.heroes[this.currentPlayerIndex];
        const card = hero.cards[cardIndex];
        if (!card) return;
        
        const minionsHere = this.minions[hero.location];
        if (!minionsHere) return;
        
        // Close the selection modal
        this.closeInfoModal();
        
        // Discard the card
        hero.cards.splice(cardIndex, 1);
        this.heroDiscardPile++;
        this.updateDeckCounts();
        this.addLog(`🔥 ${hero.name} discards ${card.name} to cast Fireball!`);
        
        // Roll dice for ALL minions at this location with 2+ hit requirement
        const hitReq = 2; // Fireball: 2+ incinerates regardless of type
        const colorResults = [];
        let totalDefeated = 0;
        
        for (let [color, count] of Object.entries(minionsHere)) {
            if (count === 0) continue;
            
            let defeated = 0;
            const rolls = [];
            
            for (let i = 0; i < count; i++) {
                const roll = Math.floor(Math.random() * 6) + 1;
                const hit = roll >= hitReq;
                if (hit) defeated++;
                rolls.push({ roll, hit });
            }
            
            colorResults.push({
                color: color,
                count: count,
                hitReq: hitReq,
                diceColor: this.getMinionColor(color),
                defeated: defeated,
                rolls: rolls
            });
            totalDefeated += defeated;
        }
        
        // Check for Battle Luck before applying results
        const blCard = this._findBattleLuckCard();
        const hasFailedDice = colorResults.some(cr => cr.rolls.some(r => !r.hit));
        
        if (blCard && hasFailedDice) {
            const failedCount = colorResults.reduce((sum, cr) => sum + cr.rolls.filter(r => !r.hit).length, 0);
            this._pendingBattleLuck = {
                type: 'fireball',
                colorResults: colorResults,
                totalDefeated: totalDefeated,
                cardName: card.name,
                battleLuckCard: blCard
            };
            const resultsHTML = this._buildMinionResultsHTML(colorResults, true);
            const fireballBanner = `
                <div style="background: rgba(239, 68, 68, 0.2); padding: 10px; border: 2px solid #ef4444; border-radius: 8px; margin-bottom: 10px; text-align: center;">
                    <div style="font-size: 1.2em; color: #ef4444; font-weight: bold;">🔥 Fireball! 🔥</div>
                    <div style="color: #d4af37; font-size: 0.9em;">Discarded: ${card.name} | All minions targeted (2+ to hit)</div>
                </div>
            `;
            const rerollHTML = fireballBanner + resultsHTML + this._buildBattleLuckHTML(blCard, failedCount);
            this.showCombatResults(rerollHTML, `🔥 Fireball: ${totalDefeated} defeated — Battle Luck?`, true);
            return;
        }
        
        this._applyFireballResults(colorResults, totalDefeated, card.name);
    },
    
    _applyFireballResults(colorResults, totalDefeated, cardName) {
        const hero = this.heroes[this.currentPlayerIndex];
        const minionsHere = this.minions[hero.location];
        
        // Apply kills for all colors
        colorResults.forEach(cr => {
            minionsHere[cr.color] -= cr.defeated;
            if (minionsHere[cr.color] < 0) minionsHere[cr.color] = 0;
        });
        
        const totalMinions = colorResults.reduce((sum, cr) => sum + cr.count, 0);
        
        // Build results display
        const resultsHTML = this._buildMinionResultsHTML(colorResults, true);
        const fireballBanner = `
            <div style="background: rgba(239, 68, 68, 0.2); padding: 10px; border: 2px solid #ef4444; border-radius: 8px; margin-bottom: 10px; text-align: center;">
                <div style="font-size: 1.2em; color: #ef4444; font-weight: bold;">🔥 Fireball! 🔥</div>
                <div style="color: #d4af37; font-size: 0.9em;">Discarded: ${cardName} | All minions targeted (2+ to hit)</div>
            </div>
        `;
        
        this.actionsRemaining--;
        this.addLog(`🔥 Fireball: ${hero.name} incinerated ${totalDefeated} of ${totalMinions} minions!`);
        
        // Show results
        this.showCombatResults(fireballBanner + resultsHTML, `🔥 Fireball: ${totalDefeated} of ${totalMinions} minion(s) defeated!`);
        
        this.updateGameStatus();
        this.renderHeroes();
        this.renderTokens();
        
        // Update map if open
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            this.updateMapStatus();
            this.updateMovementButtons();
            this.updateActionButtons();
        }
    },
    
    getCardDisplayColor(card) {
        if (card.special) return '#9333ea'; // Purple for special cards
        const colorMap = { 'red': '#dc2626', 'blue': '#2563eb', 'green': '#16a34a', 'black': '#1f2937' };
        return (card.special ? '#9333ea' : (colorMap[card.color] || '#8B7355'));
    },
    
    showSpecialCardsModal() {
        // Collect special cards from ALL active heroes
        const specialCards = [];
        this.heroes.forEach((hero, heroIndex) => {
            hero.cards.forEach((card, cardIndex) => {
                if (card.special) {
                    specialCards.push({ hero, heroIndex, card, cardIndex });
                }
            });
        });
        
        if (specialCards.length === 0) {
            this.showInfoModal('🌟 Special Cards', '<div>No heroes have any special cards!</div>');
            return;
        }
        
        this._selectedSpecialCard = null;
        
        let cardsHTML = '<div id="special-cards-list" style="display: flex; flex-direction: column; gap: 10px;">';
        specialCards.forEach(({ hero, heroIndex, card, cardIndex }, i) => {
            cardsHTML += `
                <div id="special-card-option-${i}" onclick="game.selectSpecialCard(${i}, ${heroIndex}, ${cardIndex})"
                     style="border: 3px solid #9333ea; cursor: pointer; padding: 12px; border-radius: 8px; background: rgba(147,51,234,0.1); transition: all 0.2s; display: flex; align-items: center; gap: 12px;"
                     onmouseover="if(!this.classList.contains('selected-special')) this.style.background='rgba(147,51,234,0.25)'" 
                     onmouseout="if(!this.classList.contains('selected-special')) this.style.background='rgba(147,51,234,0.1)'">
                    <div style="font-size: 2em;">${card.icon || '💫'}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: #9333ea; font-size: 1.1em;">${card.name}</div>
                        <div style="font-size: 0.85em; color: #d4af37; margin-top: 2px;">${card.description || card.type}</div>
                        <div style="font-size: 0.85em; color: #999; margin-top: 2px;">🎲 ${card.dice} ${card.dice === 1 ? 'die' : 'dice'} vs ${card.color === 'any' ? 'Any General' : ({'red':'Demons','blue':'Dragonkin','green':'Orcs','black':'Undead'}[card.color] || 'Any')} in combat</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.85em; color: #a78bfa;">${hero.symbol} ${hero.name}</div>
                    </div>
                </div>
            `;
        });
        cardsHTML += '</div>';
        
        const contentHTML = `
            <div style="color: #d4af37; margin-bottom: 12px;">
                Special cards can be played at any time without using an action. Select a card:
            </div>
            ${cardsHTML}
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn" style="flex: 1; background: #666;" onclick="game.closeInfoModal()">Cancel</button>
                <button id="use-special-card-btn" class="btn" style="flex: 1; opacity: 0.5; cursor: not-allowed; background: #666;" disabled onclick="game.confirmSpecialCard()">Use Card</button>
            </div>
        `;
        
        this.showInfoModal('🌟 Special Cards', contentHTML);
        // Hide the default Continue button
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv && !defaultBtnDiv.querySelector('#use-special-card-btn')) defaultBtnDiv.style.display = 'none';
    },
    
    selectSpecialCard(displayIndex, heroIndex, cardIndex) {
        this._selectedSpecialCard = { heroIndex, cardIndex };
        
        // Clear all selections
        document.querySelectorAll('#special-cards-list > div').forEach(el => {
            el.classList.remove('selected-special');
            el.style.background = 'rgba(147,51,234,0.1)';
            el.style.borderColor = '#9333ea';
        });
        
        // Highlight selected
        const selected = document.getElementById(`special-card-option-${displayIndex}`);
        if (selected) {
            selected.classList.add('selected-special');
            selected.style.background = 'rgba(255,215,0,0.2)';
            selected.style.borderColor = '#d4af37';
        }
        
        // Enable Use Card button
        const useBtn = document.getElementById('use-special-card-btn');
        if (useBtn) {
            useBtn.disabled = false;
            useBtn.style.opacity = '1';
            useBtn.style.cursor = 'pointer';
            useBtn.style.background = '';
            useBtn.className = 'btn btn-primary';
        }
    },
    
    confirmSpecialCard() {
        if (!this._selectedSpecialCard) return;
        const { heroIndex, cardIndex } = this._selectedSpecialCard;
        this._selectedSpecialCard = null;
        this.playSpecialCard(heroIndex, cardIndex);
    },
    
    playSpecialCard(heroIndex, cardIndex) {
        const hero = this.heroes[heroIndex];
        const card = hero.cards[cardIndex];
        if (!card || !card.special) return;
        
        this.closeInfoModal();
        
        if (card.specialAction === 'place_magic_gate') {
            this.executeSpecialMagicGate(heroIndex, cardIndex);
        } else if (card.specialAction === 'move_hero') {
            this.executeSpecialMoveHero(heroIndex, cardIndex);
        } else if (card.specialAction === 'purify_location') {
            this.executeSpecialPurify(heroIndex, cardIndex);
        } else if (card.specialAction === 'elven_archers') {
            this.executeElvenArchers(heroIndex, cardIndex);
        } else if (card.specialAction === 'battle_strategy') {
            this.executeBattleStrategy(heroIndex, cardIndex);
        } else if (card.specialAction === 'skip_darkness') {
            this.executeSkipDarkness(heroIndex, cardIndex);
        } else if (card.specialAction === 'battle_luck') {
            this.showInfoModal('🍀 Battle Luck', `
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 2em; margin-bottom: 10px;">🍀</div>
                    <div style="color: #d4af37;">This card is used automatically during combat.</div>
                    <div style="color: #999; margin-top: 8px; font-size: 0.9em;">When dice are rolled, a "Battle Luck" button will appear to re-roll all failed dice.</div>
                </div>
            `);
        } else if (card.specialAction === 'battle_fury') {
            this.executeBattleFury(heroIndex, cardIndex);
        } else if (card.specialAction === 'local_information') {
            this.executeLocalInformation(heroIndex, cardIndex);
        } else if (card.specialAction === 'kings_guard') {
            this.executeKingsGuard(heroIndex, cardIndex);
        } else if (card.specialAction === 'cavalry_sweep') {
            this.executeCavalrySweep(heroIndex, cardIndex);
        } else if (card.specialAction === 'dark_visions') {
            this.executeDarkVisions(heroIndex, cardIndex);
        } else if (card.specialAction === 'militia_secures') {
            this.showInfoModal('🛡️ Militia Secures Area', `
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 2em; margin-bottom: 10px;">🛡️</div>
                    <div style="color: #d4af37;">This card is used automatically during the Night Phase.</div>
                    <div style="color: #999; margin-top: 8px; font-size: 0.9em;">When a Darkness Spreads card is drawn, a "Militia Secures Area" button will appear to cancel one minion placement.</div>
                </div>
            `);
        } else if (card.specialAction === 'strong_defenses') {
            this.showInfoModal('🏰 Strong Defenses', `
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 2em; margin-bottom: 10px;">🏰</div>
                    <div style="color: #d4af37;">This card is used automatically during the Night Phase.</div>
                    <div style="color: #999; margin-top: 8px; font-size: 0.9em;">When a Darkness Spreads card is drawn, a "Strong Defenses" button will appear to prevent the General from moving.</div>
                </div>
            `);
        } else if (card.specialAction === 'spy_in_camp') {
            this.showInfoModal('👤 Spy In The Camp', `
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 2em; margin-bottom: 10px;">👤</div>
                    <div style="color: #d4af37;">This card is used during Step 1 — Daytime.</div>
                    <div style="color: #999; margin-top: 8px; font-size: 0.9em;">When a wounded General would heal, a "Spy In The Camp" button will appear to block their healing for that turn.</div>
                </div>
            `);
        }
    },
    
    showQuestCardsModal() {
        this._showQuestCardsForHeroes(null); // null = all heroes
    },
    
    showHeroQuestCardsModal(heroIndex) {
        this._showQuestCardsForHeroes(heroIndex);
    },
    
    _showQuestCardsForHeroes(filterHeroIndex) {
        // Collect quest cards from heroes (all or filtered)
        const allQuests = [];
        this.heroes.forEach((hero, heroIndex) => {
            if (filterHeroIndex !== null && heroIndex !== filterHeroIndex) return;
            if (hero.questCards) {
                hero.questCards.forEach((quest, questIndex) => {
                    allQuests.push({ hero, heroIndex, quest, questIndex });
                });
            }
        });
        
        const filterHero = filterHeroIndex !== null ? this.heroes[filterHeroIndex] : null;
        const modalTitle = filterHero ? `📜 ${filterHero.symbol} ${filterHero.name}'s Quests` : '📜 Quest Cards';
        
        if (allQuests.length === 0) {
            this.showInfoModal(modalTitle, filterHero ? `<div>${filterHero.name} has no quest cards!</div>` : '<div>No heroes have any quest cards!</div>');
            return;
        }
        
        this._selectedQuestCard = null;
        this._questCardsList = allQuests;
        
        let cardsHTML = '<div id="quest-cards-list" style="display: flex; flex-direction: column; gap: 10px;">';
        allQuests.forEach(({ hero, heroIndex, quest, questIndex }, i) => {
            const statusIcon = quest.completed ? '✅' : '⏳';
            const statusText = quest.completed ? 'COMPLETED' : 'In Progress';
            const statusColor = quest.completed ? '#4ade80' : '#ef4444';
            const borderColor = quest.completed ? '#4ade80' : '#dc2626';
            const bgColor = quest.completed ? 'rgba(74,222,128,0.1)' : 'rgba(220,38,38,0.1)';
            let locationText = quest.location ? `📍 ${quest.location}` : '';
            
            // Multi-location progress (Rumors, Organize Militia)
            const colorEmojis = { red: '🔴', black: '⚫', green: '🟢', blue: '🔵' };
            if (!quest.completed && quest.mechanic && quest.mechanic.type === 'multi_location_visit' && quest.mechanic.locations) {
                locationText = Object.entries(quest.mechanic.locations).map(([loc, data]) => {
                    const emoji = colorEmojis[data.color] || '⭕';
                    const check = data.visited ? '✅' : '⬜';
                    const color = data.visited ? '#4ade80' : '#999';
                    return `<span style="color: ${color};">${emoji} ${loc} ${check}</span>`;
                }).join(' &nbsp;');
            }
            if (!quest.completed && quest.mechanic && quest.mechanic.type === 'multi_location_action' && quest.mechanic.locations) {
                locationText = Object.entries(quest.mechanic.locations).map(([loc, data]) => {
                    const emoji = colorEmojis[data.color] || '⭕';
                    const check = data.organized ? '✅' : '⬜';
                    const color = data.organized ? '#4ade80' : '#999';
                    return `<span style="color: ${color};">${emoji} ${loc} ${check}</span>`;
                }).join(' &nbsp;');
            }
            if (quest.mechanic && quest.mechanic.type === 'build_gate_red' && !quest.completed) {
                locationText = '📍 Any Red Location (with matching card)';
            }
            
            cardsHTML += `
                <div id="quest-card-option-${i}" onclick="game.selectQuestCard(${i}, ${heroIndex}, ${questIndex})"
                     data-border-color="${borderColor}" data-bg-color="${bgColor}"
                     style="border: 3px solid ${borderColor}; cursor: pointer; padding: 12px; border-radius: 8px; background: ${bgColor}; display: flex; align-items: flex-start; gap: 12px; transition: all 0.2s;"
                     onmouseover="if(!this.classList.contains('selected-quest')) this.style.background='rgba(255,215,0,0.15)'" 
                     onmouseout="if(!this.classList.contains('selected-quest')) this.style.background='${bgColor}'">
                    <div style="font-size: 2em; flex-shrink: 0;">📜</div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px;">
                            <div style="font-weight: bold; color: #ef4444; font-size: 1.05em;">${quest.name}</div>
                            <div style="font-size: 0.8em; padding: 2px 8px; border-radius: 10px; background: rgba(0,0,0,0.3); color: ${statusColor}; font-weight: bold;">${statusIcon} ${statusText}</div>
                        </div>
                        <div style="font-size: 0.85em; color: #d4af37; margin-top: 4px;">${quest.description}</div>
                        ${locationText ? `<div style="font-size: 0.8em; color: #999; margin-top: 4px;">${locationText}</div>` : ''}
                        <div style="font-size: 0.8em; color: #a78bfa; margin-top: 2px;">🏆 ${quest.reward}</div>
                    </div>
                    ${filterHeroIndex === null ? `<div style="text-align: right; flex-shrink: 0;"><div style="font-size: 0.85em; color: ${hero.color};">${hero.symbol} ${hero.name}</div></div>` : ''}
                </div>
            `;
        });
        cardsHTML += '</div>';
        
        const contentHTML = `
            <div style="color: #d4af37; margin-bottom: 12px;">
                ${filterHero ? `${filterHero.name}'s quest cards. Select a quest to view or use.` : 'Quest cards assigned to heroes. Select a quest to view or use.'}
            </div>
            ${cardsHTML}
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn" style="flex: 1; background: #666;" onclick="game.closeInfoModal()">Close</button>
                <button id="view-quest-btn" class="btn" style="flex: 1; opacity: 0.5; cursor: not-allowed; background: #666;" disabled onclick="game.confirmViewQuest()">🗺️ View Quest</button>
                <button id="use-quest-btn" class="btn" style="flex: 1; opacity: 0.5; cursor: not-allowed; background: #666;" disabled onclick="game.confirmUseQuest()">✨ Use</button>
            </div>
            <div id="quest-use-context-hint" style="text-align: center;"></div>
        `;
        
        this.showInfoModal(modalTitle, contentHTML);
        // Hide the default Continue button since we have our own Close button
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv && defaultBtnDiv.querySelector('.btn-primary')) defaultBtnDiv.style.display = 'none';
        
        // Auto-select if only one quest
        if (allQuests.length === 1) {
            this.selectQuestCard(0, allQuests[0].heroIndex, allQuests[0].questIndex);
        }
    },
    
    selectQuestCard(displayIndex, heroIndex, questIndex) {
        this._selectedQuestCard = { displayIndex, heroIndex, questIndex };
        
        const quest = this.heroes[heroIndex].questCards[questIndex];
        
        // Clear all selections
        document.querySelectorAll('#quest-cards-list > div').forEach(el => {
            el.classList.remove('selected-quest');
            el.style.background = el.getAttribute('data-bg-color');
            el.style.borderColor = el.getAttribute('data-border-color');
        });
        
        // Highlight selected
        const selected = document.getElementById(`quest-card-option-${displayIndex}`);
        if (selected) {
            selected.classList.add('selected-quest');
            selected.style.background = 'rgba(255,215,0,0.2)';
            selected.style.borderColor = '#d4af37';
        }
        
        // Update View Quest button
        const viewBtn = document.getElementById('view-quest-btn');
        if (viewBtn) {
            // Can view if quest has a single location and is not completed
            const hasSingleLoc = quest.location && !quest.completed;
            // Multi-location quests: show first unvisited/unorganized location
            let multiLocTarget = null;
            if (!quest.completed && quest.mechanic) {
                if (quest.mechanic.type === 'multi_location_visit' && quest.mechanic.locations) {
                    const unvisited = Object.entries(quest.mechanic.locations).find(([, d]) => !d.visited);
                    if (unvisited) multiLocTarget = unvisited[0];
                }
                if (quest.mechanic.type === 'multi_location_action' && quest.mechanic.locations) {
                    const undone = Object.entries(quest.mechanic.locations).find(([, d]) => !d.organized);
                    if (undone) multiLocTarget = undone[0];
                }
            }
            const canView = hasSingleLoc || multiLocTarget;
            viewBtn.disabled = !canView;
            viewBtn.style.opacity = canView ? '1' : '0.5';
            viewBtn.style.cursor = canView ? 'pointer' : 'not-allowed';
            viewBtn.style.background = canView ? '#dc2626' : '#666';
        }
        
        // Update Use button
        const useBtn = document.getElementById('use-quest-btn');
        if (useBtn) {
            let canUse = quest.completed && quest.mechanic && quest.mechanic.rewardType === 'use_quest_card_anytime';
            // Exclude context-dependent rewards (these have their own buttons in combat/darkness phase)
            if (canUse && quest.mechanic.rewardValue === 'combat_bonus_dice') canUse = false;
            if (canUse && quest.mechanic.rewardValue === 'block_general_advance') canUse = false;
            // If requirePresence, check hero is on a valid location
            if (canUse && quest.mechanic.requirePresence && quest.mechanic.rewardValue === 'remove_taint') {
                const hero = this.heroes[heroIndex];
                canUse = this.taintCrystals[hero.location] && this.taintCrystals[hero.location] > 0;
            }
            
            // Show context hint for combat/darkness quests
            let contextHint = '';
            if (quest.completed && quest.mechanic) {
                if (quest.mechanic.rewardValue === 'combat_bonus_dice') {
                    contextHint = '<div style="color: #d4af37; font-size: 0.8em; margin-top: 4px;">⚔️ Used automatically before combat rolls</div>';
                } else if (quest.mechanic.rewardValue === 'block_general_advance') {
                    contextHint = '<div style="color: #d4af37; font-size: 0.8em; margin-top: 4px;">🌙 Used during Darkness Spreads phase</div>';
                }
            }
            const hintDiv = document.getElementById('quest-use-context-hint');
            if (hintDiv) hintDiv.innerHTML = contextHint;
            
            useBtn.disabled = !canUse;
            useBtn.style.opacity = canUse ? '1' : '0.5';
            useBtn.style.cursor = canUse ? 'pointer' : 'not-allowed';
            useBtn.style.background = canUse ? '#4ade80' : '#666';
            useBtn.style.color = canUse ? '#000' : '';
            useBtn.style.fontWeight = canUse ? 'bold' : '';
        }
    },
    
    confirmViewQuest() {
        if (!this._selectedQuestCard) return;
        const { heroIndex, questIndex } = this._selectedQuestCard;
        this._selectedQuestCard = null;
        this.closeInfoModal();
        this.viewQuestOnMap(heroIndex, questIndex);
    },
    
    confirmUseQuest() {
        if (!this._selectedQuestCard) return;
        const { heroIndex, questIndex } = this._selectedQuestCard;
        this._selectedQuestCard = null;
        this.closeInfoModal();
        this.useCompletedQuestCard(heroIndex, questIndex);
    },
    
    viewQuestOnMap(heroIndex, questIndex) {
        const hero = this.heroes[heroIndex];
        const quest = hero.questCards[questIndex];
        if (!quest) return;
        
        // Determine target location(s) to highlight
        let targetLocation = quest.location;
        let multiLocations = null;
        
        if (quest.mechanic) {
            if (quest.mechanic.type === 'multi_location_visit' && quest.mechanic.locations) {
                multiLocations = Object.entries(quest.mechanic.locations);
                const unvisited = multiLocations.find(([, d]) => !d.visited);
                targetLocation = unvisited ? unvisited[0] : multiLocations[0][0];
            }
            if (quest.mechanic.type === 'multi_location_action' && quest.mechanic.locations) {
                multiLocations = Object.entries(quest.mechanic.locations);
                const undone = multiLocations.find(([, d]) => !d.organized);
                targetLocation = undone ? undone[0] : multiLocations[0][0];
            }
            if (quest.mechanic.type === 'build_gate_red') {
                // Highlight hero's current location if red, or first red location
                const locData = this.locationCoords[hero.location];
                if (locData && locData.faction === 'red') {
                    targetLocation = hero.location;
                } else {
                    targetLocation = Object.entries(this.locationCoords).find(([, c]) => c.faction === 'red')?.[0] || hero.location;
                }
            }
        }
        
        if (!targetLocation) return;
        const coords = this.locationCoords[targetLocation];
        if (!coords) return;
        
        // Ensure map is showing
        this.showMap();
        
        // Remove old quest highlights
        document.querySelectorAll('.quest-location-highlight').forEach(el => el.remove());
        
        const svg = document.getElementById('game-map');
        
        // Create pulsing red highlight on quest location(s)
        const effectsLayer = document.getElementById('effects-layer') || svg;
        
        const addHighlight = (locName) => {
            const c = this.locationCoords[locName];
            if (!c) return;
            const hl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            hl.classList.add('quest-location-highlight');
            hl.setAttribute('cx', c.x);
            hl.setAttribute('cy', c.y);
            hl.setAttribute('r', c.type === 'inn' ? '34' : '45');
            hl.setAttribute('fill', 'rgba(140, 0, 0, 0.55)');
            hl.setAttribute('stroke', '#ff3333');
            hl.setAttribute('stroke-width', '4');
            hl.setAttribute('stroke-dasharray', '6,4');
            hl.setAttribute('pointer-events', 'none');
            const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            anim.setAttribute('attributeName', 'opacity');
            anim.setAttribute('values', '0.6;1;0.6');
            anim.setAttribute('dur', '2s');
            anim.setAttribute('repeatCount', 'indefinite');
            hl.appendChild(anim);
            effectsLayer.appendChild(hl);
        };
        
        if (multiLocations) {
            multiLocations.forEach(([locName]) => addHighlight(locName));
        } else {
            addHighlight(targetLocation);
        }
        
        // Build location text for banner
        const colorEmojis = { red: '🔴', black: '⚫', green: '🟢', blue: '🔵' };
        let locationDisplay = '';
        if (multiLocations) {
            locationDisplay = multiLocations.map(([locName, data]) => {
                const emoji = colorEmojis[data.color] || '⭕';
                const done = data.visited || data.organized;
                const check = done ? '✅' : '⬜';
                return `<span style="color: ${done ? '#4ade80' : '#ef4444'};">${emoji} ${locName} ${check}</span>`;
            }).join(' &nbsp;');
        } else {
            locationDisplay = `<span style="color: #ef4444;">📍 ${targetLocation}</span>`;
        }
        
        // Show quest indicator banner
        let indicator = document.getElementById('quest-view-indicator');
        if (indicator) indicator.remove();
        
        indicator = document.createElement('div');
        indicator.id = 'quest-view-indicator';
        indicator.style.cssText = `
            position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.95); border: 3px solid #dc2626; border-radius: 10px;
            padding: 15px 25px; z-index: 25000; text-align: center; max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.8);
        `;
        
        indicator.innerHTML = `
            <div style="color: #ef4444; font-weight: bold; font-size: 1.2em; margin-bottom: 8px;">
                📜 ${quest.name}
            </div>
            <div style="color: #d4af37; font-size: 0.9em; margin-bottom: 8px;">${quest.description}</div>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; font-size: 0.85em; margin-bottom: 8px;">
                ${locationDisplay}
                <span style="color: ${hero.color};">${hero.symbol} ${hero.name}</span>
            </div>
            <div style="color: #a78bfa; font-size: 0.85em; margin-bottom: 12px;">🏆 ${quest.reward}</div>
            <button class="btn" onclick="game._closeQuestView()" style="background: #666; padding: 6px 20px;">Close</button>
        `;
        document.body.appendChild(indicator);
    },
    
    _closeQuestView() {
        document.querySelectorAll('.quest-location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('quest-view-indicator');
        if (indicator) indicator.remove();
    },
    
    useCompletedQuestCard(heroIndex, questIndex) {
        const hero = this.heroes[heroIndex];
        const quest = hero.questCards[questIndex];
        if (!quest || !quest.completed) return;
        
        const m = quest.mechanic;
        if (m.rewardType === 'use_quest_card_anytime' && m.rewardValue === 'remove_taint') {
            // Find all tainted locations
            let taintedLocations = Object.keys(this.taintCrystals).filter(loc => this.taintCrystals[loc] > 0);
            
            // If requirePresence, hero must be on a tainted location
            if (m.requirePresence) {
                if (!taintedLocations.includes(hero.location)) {
                    this.showInfoModal('📜', `<div>${hero.name} must be on a location with a Tainted Crystal to use ${quest.name}!</div>`);
                    return;
                }
                // Only the hero's location is valid
                taintedLocations = [hero.location];
                
                // Execute directly — no need for map targeting since there's only one valid location
                this._executeQuestRemoveTaint(heroIndex, questIndex, hero.location);
                return;
            }
            
            if (taintedLocations.length === 0) {
                this.showInfoModal('📜', '<div>There are no Tainted Crystals on the board to remove!</div>');
                return;
            }
            
            // Open map if not already open
            const mapModal = document.getElementById('map-modal');
            if (!mapModal.classList.contains('active')) {
                mapModal.classList.add('active');
                this.updateMapStatus();
                this.updateMovementButtons();
                this.updateActionButtons();
            }
            
            // Set quest use mode
            this.questUseMode = {
                heroIndex: heroIndex,
                questIndex: questIndex,
                quest: quest,
                validLocations: taintedLocations
            };
            
            // Disable map dragging
            const boardContainer = document.getElementById('board-container');
            if (boardContainer) {
                boardContainer.style.cursor = 'default';
                boardContainer.style.pointerEvents = 'none';
            }
            const svg = document.getElementById('game-map');
            if (svg) svg.style.pointerEvents = 'auto';
            
            // Highlight all tainted locations
            document.querySelectorAll('.quest-use-highlight').forEach(el => el.remove());
            
            taintedLocations.forEach(loc => {
                const coords = this.locationCoords[loc];
                if (!coords) return;
                
                const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                highlight.classList.add('quest-use-highlight');
                highlight.setAttribute('cx', coords.x);
                highlight.setAttribute('cy', coords.y);
                highlight.setAttribute('r', coords.type === 'inn' ? '34' : '45');
                highlight.setAttribute('fill', 'rgba(140, 0, 0, 0.55)');
                highlight.setAttribute('stroke', '#ff3333');
                highlight.setAttribute('stroke-width', '4');
                highlight.setAttribute('stroke-dasharray', '6,4');
                highlight.setAttribute('pointer-events', 'none');
                const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                animate.setAttribute('attributeName', 'opacity');
                animate.setAttribute('values', '0.6;1;0.6');
                animate.setAttribute('dur', '2s');
                animate.setAttribute('repeatCount', 'indefinite');
                highlight.appendChild(animate);
                (document.getElementById('effects-layer') || svg).appendChild(highlight);
            });
            
            // Show indicator banner
            let indicator = document.getElementById('quest-use-indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'quest-use-indicator';
            }
            indicator.style.cssText = `
                position: fixed; top: 60px; left: 50%; transform: translateX(-50%); z-index: 14000;
                background: rgba(0,0,0,0.9); border: 2px solid #dc2626; border-radius: 10px;
                padding: 12px 20px; color: white; text-align: center; max-width: 400px;
            `;
            indicator.innerHTML = `
                <div style="color: #ef4444; font-weight: bold; font-size: 1.1em; margin-bottom: 6px;">
                    📜 ${quest.name}
                </div>
                <div style="color: #d4af37; font-size: 0.9em; margin-bottom: 8px;">
                    Click a highlighted location to remove 1 Tainted Crystal
                </div>
                <button class="btn" onclick="game.clearQuestUseMode()" style="background: #666; padding: 6px 20px;">Cancel</button>
            `;
            document.body.appendChild(indicator);
        }
    },
    
    handleQuestUseClick(locationName) {
        if (!this.questUseMode) return false;
        
        // Check if clicked location is a valid tainted location
        if (!this.questUseMode.validLocations.includes(locationName)) {
            return false; // Not a valid target, let normal click handling continue
        }
        
        const { heroIndex, questIndex, quest } = this.questUseMode;
        
        // Clear the quest use mode first
        this.clearQuestUseMode();
        
        // Execute the taint removal
        this._executeQuestRemoveTaint(heroIndex, questIndex, locationName);
        
        return true; // Consumed the click
    },
    
    clearQuestUseMode() {
        this.questUseMode = null;
        
        // Remove highlights
        document.querySelectorAll('.quest-use-highlight').forEach(el => el.remove());
        
        // Remove indicator
        const indicator = document.getElementById('quest-use-indicator');
        if (indicator) indicator.remove();
        
        // Re-enable map dragging
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'grab';
            boardContainer.style.pointerEvents = 'auto';
        }
    },
    
    _executeQuestRemoveTaint(heroIndex, questIndex, locationName) {
        const hero = this.heroes[heroIndex];
        const quest = hero.questCards[questIndex];
        if (!quest) return;
        
        // Remove 1 taint crystal
        if (this.taintCrystals[locationName] && this.taintCrystals[locationName] > 0) {
            this.taintCrystals[locationName]--;
            if (this.taintCrystals[locationName] <= 0) {
                delete this.taintCrystals[locationName];
            }
            this.taintCrystalsRemaining++;
        }
        
        // Discard the quest card
        hero.questCards.splice(questIndex, 1);
        this.questDiscardPile++;
        
        this.addLog(`📜 ✨ ${hero.name} used ${quest.name} to remove a Tainted Crystal at ${locationName}!`);
        
        // Draw a new quest card
        const newQuest = this.drawQuestCard(heroIndex);
        
        this.updateDeckCounts();
        this.updateGameStatus();
        this.updateActionButtons();
        this.renderHeroes();
        this.renderTokens();
        
        // Show success modal, then show new quest if drawn
        const successHTML = `
            <div style="text-align: center;">
                <div style="font-size: 2.5em; margin-bottom: 8px;">✨</div>
                <div style="color: #4ade80; font-weight: bold; font-size: 1.3em; margin-bottom: 12px;">Tainted Crystal Removed!</div>
                <div style="color: #ef4444; font-weight: bold; font-size: 1.1em; margin-bottom: 8px;">📜 ${quest.name}</div>
                <div style="color: #d4af37; margin-bottom: 8px;">Removed 1 Tainted Crystal at ${locationName}</div>
                <div style="color: #999; font-size: 0.9em;">Quest card discarded.</div>
            </div>
        `;
        
        this.showInfoModal('📜 Quest Used', successHTML, () => {
            if (newQuest) {
                this._drawAndShowNewQuest_display(heroIndex, newQuest);
            }
        });
    },
    
    _drawAndShowNewQuest_display(heroIndex, newQuest) {
        const hero = this.heroes[heroIndex];
        const locationText = newQuest.location ? `📍 ${newQuest.location}` : '';
        
        const contentHTML = `
            <div style="text-align: center; margin-bottom: 12px;">
                <div style="font-size: 2em; margin-bottom: 8px;">📜</div>
                <div style="color: #d4af37; font-size: 1.1em;">${hero.name} draws a new quest!</div>
            </div>
            <div style="padding: 14px; background: rgba(220,38,38,0.1); border: 2px solid #dc2626; border-radius: 8px;">
                <div style="font-weight: bold; color: #ef4444; font-size: 1.1em; margin-bottom: 6px;">📜 ${newQuest.name}</div>
                <div style="font-size: 0.9em; color: #d4af37; margin-bottom: 6px;">${newQuest.description}</div>
                ${locationText ? `<div style="font-size: 0.85em; color: #999; margin-bottom: 4px;">${locationText}</div>` : ''}
                <div style="font-size: 0.85em; color: #a78bfa; margin-top: 4px;">🏆 ${newQuest.reward}</div>
            </div>
        `;
        
        this.showInfoModal('📜 New Quest Drawn', contentHTML);
    },
    
    _getCompletableQuest(hero) {
        if (!hero.questCards) return null;
        for (let i = 0; i < hero.questCards.length; i++) {
            const quest = hero.questCards[i];
            if (quest.completed) continue;
            if (!quest.mechanic) continue;
            
            // Standard dice_roll: must be at quest location
            if (quest.mechanic.type === 'dice_roll' && quest.location && hero.location === quest.location) {
                return { quest, questIndex: i };
            }
            
            // Variable dice roll (Unicorn Steed): must be at quest location
            if (quest.mechanic.type === 'variable_dice_roll' && quest.location && hero.location === quest.location) {
                return { quest, questIndex: i };
            }
            
            // Build gate at red location: hero must be at a red location without a gate, with a matching card
            if (quest.mechanic.type === 'build_gate_red') {
                const locData = this.locationCoords[hero.location];
                if (locData && locData.faction === 'red' && !locData.magicGate) {
                    const hasMatchingCard = hero.cards.some(c => c.name === hero.location);
                    if (hasMatchingCard) {
                        return { quest, questIndex: i };
                    }
                }
            }
            
            // Multi-location action (Organize Militia): hero at an unvisited location
            if (quest.mechanic.type === 'multi_location_action' && quest.mechanic.locations) {
                const locEntry = quest.mechanic.locations[hero.location];
                if (locEntry && !locEntry.organized) {
                    return { quest, questIndex: i };
                }
            }
        }
        return null;
    },
    
    _getQuestActionBonus(hero) {
        // Check all heroes for completed quest bonuses that grant actions
        let bonus = 0;
        if (hero.questCards) {
            hero.questCards.forEach(q => {
                if (q.completed && q.mechanic && q.mechanic.rewardType === 'bonus_actions') {
                    bonus += q.mechanic.rewardValue;
                }
            });
        }
        return bonus;
    },
    
    _getQuestHeroCardBonus(hero) {
        // Check for completed quest bonuses that grant extra hero card draws
        let bonus = 0;
        if (hero.questCards) {
            hero.questCards.forEach(q => {
                if (q.completed && q.mechanic && q.mechanic.rewardType === 'bonus_hero_card') {
                    bonus += q.mechanic.rewardValue;
                }
            });
        }
        return bonus;
    },
    
    completeQuestAction() {
        const hero = this.heroes[this.currentPlayerIndex];
        const result = this._getCompletableQuest(hero);
        if (!result) {
            this.showInfoModal('📜', '<div>No completable quest at this location!</div>');
            return;
        }
        
        const { quest, questIndex } = result;
        const m = quest.mechanic;
        
        // Build Gate at Red Location (Find Magic Gate)
        if (m.type === 'build_gate_red') {
            // Delegate to the normal gate building flow — quest completes in confirmBuildMagicGate hook
            this._pendingFindMagicGateQuest = { questIndex };
            this.buildMagicGate();
            return;
        }
        
        // Variable dice roll (Unicorn Steed) — show action selector
        if (m.type === 'variable_dice_roll') {
            this._showUnicornSteedRollModal(hero, quest, questIndex);
            return;
        }
        
        // Multi-location action (Organize Militia)
        if (m.type === 'multi_location_action') {
            if (this.actionsRemaining < (m.actionCost || 1)) {
                this.showInfoModal('📜', '<div>Not enough actions remaining!</div>');
                return;
            }
            this._organizeLocationAction(hero, quest, questIndex);
            return;
        }
        
        if (this.actionsRemaining < (m.actionCost || 1)) {
            this.showInfoModal('📜', '<div>Not enough actions remaining!</div>');
            return;
        }
        
        // Spend action
        this.actionsRemaining -= (m.actionCost || 1);
        this.addLog(`📜 ${hero.name} spends ${m.actionCost || 1} action to attempt quest: ${quest.name}`);
        
        if (m.type === 'dice_roll') {
            this._rollQuestDice(hero, quest, questIndex);
        }
        
        this.updateGameStatus();
        this.updateActionButtons();
        this.renderHeroes();
        
        // Update map if open
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            this.updateMapStatus();
            this.updateMovementButtons();
        }
    },
    
    _rollQuestDice(hero, quest, questIndex) {
        const m = quest.mechanic;
        const rolls = [];
        let successes = 0;
        
        // Sorceress Visions: +1 extra die for quest rolls
        const visionsBonus = hero.name === 'Sorceress' ? 1 : 0;
        const totalDice = m.diceCount + visionsBonus;
        if (visionsBonus > 0) {
            this.addLog(`⚡ Visions: ${hero.name} rolls ${totalDice} dice instead of ${m.diceCount}!`);
        }
        
        for (let i = 0; i < totalDice; i++) {
            const roll = Math.floor(Math.random() * 6) + 1;
            const hit = roll >= m.successOn;
            if (hit) successes++;
            rolls.push({ roll, hit });
        }
        
        const passed = successes >= (m.successCount || 1);
        
        const visionsNote = visionsBonus > 0 ? `<div style="color: #ec4899; margin-bottom: 8px; font-size: 0.9em;">⚡ Visions: +1 bonus die!</div>` : '';
        
        let diceHTML = '<div style="display: flex; gap: 8px; justify-content: center; margin: 15px 0; flex-wrap: wrap;">';
        rolls.forEach(r => {
            const color = r.hit ? '#4ade80' : '#ef4444';
            const bg = r.hit ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)';
            const border = r.hit ? '#4ade80' : '#ef4444';
            diceHTML += `<div style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; 
                font-size: 1.5em; font-weight: bold; border-radius: 8px; color: ${color}; 
                background: ${bg}; border: 2px solid ${border};">${r.roll}</div>`;
        });
        diceHTML += '</div>';
        
        const heroIndex = this.currentPlayerIndex;
        
        if (passed) {
            // SUCCESS
            this.addLog(`📜 ✅ ${hero.name} completed quest: ${quest.name}!`);
            
            const contentHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 2.5em; margin-bottom: 8px;">✅</div>
                    <div style="color: #4ade80; font-weight: bold; font-size: 1.3em; margin-bottom: 12px;">Quest Complete!</div>
                    <div style="color: #ef4444; font-weight: bold; font-size: 1.1em; margin-bottom: 8px;">📜 ${quest.name}</div>
                    <div style="color: #999; margin-bottom: 8px;">Need ${m.successOn}+ on any die</div>
                    ${visionsNote}
                    ${diceHTML}
                    <div style="color: #a78bfa; font-weight: bold; margin-top: 10px; padding: 8px; background: rgba(167,139,250,0.15); border: 1px solid #a78bfa; border-radius: 6px;">
                        🏆 Reward: ${quest.reward}
                    </div>
                </div>
            `;
            
            // Mark completed (keep on hero card for passive effects)
            quest.completed = true;
            
            // Apply immediate reward if applicable
            if (m.rewardType === 'bonus_actions') {
                this.actionsRemaining += m.rewardValue;
                this.addLog(`📜 ${quest.name}: ${hero.name} gains +${m.rewardValue} actions per turn!`);
            } else if (m.rewardType === 'bonus_hero_card') {
                this.addLog(`📜 ${quest.name}: ${hero.name} draws +${m.rewardValue} extra Hero Card each turn!`);
            } else if (m.rewardType === 'quest_magic_item') {
                this.addLog(`📜 ${quest.name}: ${hero.name} gains +1 to all dice in combat!`);
            } else if (m.rewardType === 'ignore_hero_defeated') {
                this.addLog(`📜 ${quest.name}: ${hero.name} now ignores Hero Defeated penalties against Generals!`);
            } else if (m.rewardType === 'placeholder') {
                this.addLog(`📜 ${quest.name}: ${hero.name} completed the quest! (Reward not yet implemented)`);
            }
            
            this.showInfoModal('📜 Quest Complete!', contentHTML, () => {
                // Draw new quest card — but NOT for use_quest_card_anytime (card stays until used)
                if (m.rewardType !== 'use_quest_card_anytime') {
                    this._drawAndShowNewQuest(heroIndex);
                }
            });
        } else {
            // FAILURE
            this.addLog(`📜 ❌ ${hero.name} failed quest: ${quest.name}`);
            
            const contentHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 2.5em; margin-bottom: 8px;">❌</div>
                    <div style="color: #ef4444; font-weight: bold; font-size: 1.3em; margin-bottom: 12px;">Quest Failed!</div>
                    <div style="color: #ef4444; font-weight: bold; font-size: 1.1em; margin-bottom: 8px;">📜 ${quest.name}</div>
                    <div style="color: #999; margin-bottom: 8px;">Needed ${m.successOn}+ on any die</div>
                    ${visionsNote}
                    ${diceHTML}
                    ${m.failDiscard ? '<div style="color: #ef4444; margin-top: 10px;">Quest card discarded.</div>' : ''}
                </div>
            `;
            
            if (m.failDiscard) {
                hero.questCards.splice(questIndex, 1);
                this.questDiscardPile++;
                this.updateDeckCounts();
            }
            
            this.showInfoModal('📜 Quest Failed', contentHTML, () => {
                if (m.failDiscard) {
                    this._drawAndShowNewQuest(heroIndex);
                }
            });
        }
        
        this.updateGameStatus();
        this.updateActionButtons();
        this.renderHeroes();
        
        // Update map if open
        const mapModal2 = document.getElementById('map-modal');
        if (mapModal2 && mapModal2.classList.contains('active')) {
            this.updateMapStatus();
            this.updateMovementButtons();
        }
    },
    
    _drawAndShowNewQuest(heroIndex) {
        const hero = this.heroes[heroIndex];
        const newQuest = this.drawQuestCard(heroIndex);
        
        if (newQuest) {
            const locationText = newQuest.location ? `📍 ${newQuest.location}` : '';
            
            const contentHTML = `
                <div style="text-align: center; margin-bottom: 12px;">
                    <div style="font-size: 2em; margin-bottom: 8px;">📜</div>
                    <div style="color: #d4af37; font-size: 1.1em;">${hero.name} draws a new quest!</div>
                </div>
                <div style="padding: 14px; background: rgba(220,38,38,0.1); border: 2px solid #dc2626; border-radius: 8px;">
                    <div style="font-weight: bold; color: #ef4444; font-size: 1.1em; margin-bottom: 6px;">📜 ${newQuest.name}</div>
                    <div style="font-size: 0.9em; color: #d4af37; margin-bottom: 6px;">${newQuest.description}</div>
                    ${locationText ? `<div style="font-size: 0.85em; color: #999; margin-bottom: 4px;">${locationText}</div>` : ''}
                    <div style="font-size: 0.85em; color: #a78bfa; margin-top: 4px;">🏆 ${newQuest.reward}</div>
                </div>
            `;
            
            this.showInfoModal('📜 New Quest Drawn', contentHTML);
        } else {
            this.showInfoModal('📜', '<div>Quest deck is empty — no new quest drawn.</div>');
        }
    },
    
    drawQuestCard(heroIndex) {
        const hero = this.heroes[heroIndex];
        if (!hero.questCards) hero.questCards = [];
        
        if (this.questDeck.length === 0) {
            this.addLog(`📜 Quest deck is empty — no quest card drawn for ${hero.name}.`);
            return null;
        }
        
        const quest = this.questDeck.pop();
        hero.questCards.push(quest);
        this.addLog(`📜 ${hero.name} draws a new quest: ${quest.name}`);
        this.updateDeckCounts();
        this.updateActionButtons();
        return quest;
    },
    
    discardQuestCard(heroIndex, questIndex) {
        const hero = this.heroes[heroIndex];
        if (!hero.questCards || questIndex >= hero.questCards.length) return;
        
        const quest = hero.questCards.splice(questIndex, 1)[0];
        this.questDiscardPile++;
        this.addLog(`📜 ${hero.name}'s quest "${quest.name}" was discarded.`);
        this.updateDeckCounts();
        this.updateActionButtons();
    },
    
    executeSpecialMagicGate(heroIndex, cardIndex) {
        const hero = this.heroes[heroIndex];
        const card = hero.cards[cardIndex];
        
        // Find locations without magic gates (excluding current hero location is fine to include)
        const availableLocations = [];
        for (let [locName, data] of Object.entries(this.locationCoords)) {
            if (!data.magicGate) {
                availableLocations.push(locName);
            }
        }
        
        if (availableLocations.length === 0) {
            this.showInfoModal('💫', '<div>All locations already have Magic Gates!</div>');
            return;
        }
        
        // Store special card info for when location is clicked
        this.specialMagicGateCard = { heroIndex, cardIndex };
        
        // Set movement state for Special Magic Gate placement
        const currentHero = this.heroes[this.currentPlayerIndex];
        this.activeMovement = {
            cardIndex: -1,
            movementType: 'Special Magic Gate',
            maxMoves: 1,
            movesRemaining: 1,
            startLocation: currentHero.location,
            cardUsed: null,
            validDestinations: availableLocations,
            isSpecialMagicGate: true
        };
        
        // Disable map dragging
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'default';
            boardContainer.style.pointerEvents = 'none';
        }
        
        const svg = document.getElementById('game-map');
        if (svg) {
            svg.style.pointerEvents = 'auto';
        }
        
        this.showMovementIndicator();
        this.highlightMagicGateLocations(availableLocations);
    },
    
    executeSpecialMoveHero(heroIndex, cardIndex) {
        const cardHero = this.heroes[heroIndex];
        const card = cardHero.cards[cardIndex];
        
        // Show hero selection modal
        this._hammerCard = { heroIndex, cardIndex };
        this._hammerSelectedHero = null;
        
        let heroesHTML = '<div style="display: flex; flex-direction: column; gap: 10px;">';
        this.heroes.forEach((hero, i) => {
            if (hero.health <= 0) return;
            heroesHTML += `
                <div id="hammer-hero-${i}" onclick="game.selectHammerHero(${i})"
                     style="border: 3px solid ${hero.color}; cursor: pointer; padding: 12px; border-radius: 8px; background: rgba(0,0,0,0.3); transition: all 0.2s; display: flex; align-items: center; gap: 12px;"
                     onmouseover="if(!this.classList.contains('hammer-selected')) this.style.background='rgba(255,255,255,0.1)'"
                     onmouseout="if(!this.classList.contains('hammer-selected')) this.style.background='rgba(0,0,0,0.3)'">
                    <div style="font-size: 2em;">${hero.symbol}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: ${hero.color}; font-size: 1.1em;">${hero.name}</div>
                        <div style="font-size: 0.85em; color: #999;">Currently at: ${hero.location}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.85em; color: #ef4444;">❤️ ${hero.health}/${hero.maxHealth}</div>
                    </div>
                </div>
            `;
        });
        heroesHTML += '</div>';
        
        const contentHTML = `
            <div style="color: #d4af37; margin-bottom: 12px;">
                Playing: <strong style="color: #9333ea;">🔨 Hammer of Valor</strong> from ${cardHero.symbol} ${cardHero.name}'s hand
            </div>
            <div style="color: #a78bfa; margin-bottom: 10px;">Select a hero to move:</div>
            ${heroesHTML}
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn" style="flex: 1; background: #666;" onclick="game.closeInfoModal(); game._hammerCard = null; game._hammerSelectedHero = null;">Cancel</button>
                <button id="hammer-confirm-btn" class="btn" style="flex: 1; opacity: 0.5; cursor: not-allowed; background: #666;" disabled onclick="game.confirmHammerHero()">Confirm Hero</button>
            </div>
        `;
        
        this.showInfoModal('🔨 Hammer of Valor', contentHTML);
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv && !defaultBtnDiv.querySelector('#hammer-confirm-btn')) defaultBtnDiv.style.display = 'none';
    },
    
    selectHammerHero(heroIdx) {
        this._hammerSelectedHero = heroIdx;
        
        // Clear all selections
        this.heroes.forEach((h, i) => {
            const el = document.getElementById(`hammer-hero-${i}`);
            if (el) {
                el.classList.remove('hammer-selected');
                el.style.background = 'rgba(0,0,0,0.3)';
                el.style.borderColor = h.color;
            }
        });
        
        // Highlight selected
        const selected = document.getElementById(`hammer-hero-${heroIdx}`);
        if (selected) {
            selected.classList.add('hammer-selected');
            selected.style.background = 'rgba(255,215,0,0.2)';
            selected.style.borderColor = '#d4af37';
        }
        
        // Enable confirm button
        const btn = document.getElementById('hammer-confirm-btn');
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.style.background = '';
            btn.className = 'btn btn-primary';
        }
    },
    
    confirmHammerHero() {
        if (this._hammerSelectedHero == null || !this._hammerCard) return;
        
        const targetHeroIndex = this._hammerSelectedHero;
        const { heroIndex, cardIndex } = this._hammerCard;
        const targetHero = this.heroes[targetHeroIndex];
        
        this.closeInfoModal();
        
        // All locations except target hero's current location
        const allLocations = [];
        for (let [locName] of Object.entries(this.locationCoords)) {
            if (locName !== targetHero.location) {
                allLocations.push(locName);
            }
        }
        
        // Store info for click handler
        this.specialMoveHeroCard = { heroIndex, cardIndex, targetHeroIndex };
        
        // Set movement state
        this.activeMovement = {
            cardIndex: -1,
            movementType: 'Hammer of Valor',
            maxMoves: 1,
            movesRemaining: 1,
            startLocation: targetHero.location,
            cardUsed: null,
            validDestinations: allLocations,
            isSpecialMoveHero: true
        };
        
        // Disable map dragging
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'default';
            boardContainer.style.pointerEvents = 'none';
        }
        
        const svg = document.getElementById('game-map');
        if (svg) {
            svg.style.pointerEvents = 'auto';
        }
        
        this.showMovementIndicator();
        this.highlightMagicGateLocations(allLocations);
    },
    
    executeSpecialPurify(heroIndex, cardIndex) {
        const cardHero = this.heroes[heroIndex];
        const card = cardHero.cards[cardIndex];
        
        // Find locations with taint crystals
        const taintedLocations = [];
        for (let [locName, count] of Object.entries(this.taintCrystals)) {
            if (count > 0) {
                taintedLocations.push(locName);
            }
        }
        
        if (taintedLocations.length === 0) {
            this.showInfoModal('✨', '<div>No locations have Tainted Crystals!</div>');
            return;
        }
        
        // Store card info for click handler
        this.specialPurifyCard = { heroIndex, cardIndex };
        
        // Set movement state
        const currentHero = this.heroes[this.currentPlayerIndex];
        this.activeMovement = {
            cardIndex: -1,
            movementType: 'Spell of Purity',
            maxMoves: 1,
            movesRemaining: 1,
            startLocation: currentHero.location,
            cardUsed: null,
            validDestinations: taintedLocations,
            isSpecialPurify: true
        };
        
        // Disable map dragging
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'default';
            boardContainer.style.pointerEvents = 'none';
        }
        
        const svg = document.getElementById('game-map');
        if (svg) {
            svg.style.pointerEvents = 'auto';
        }
        
        this.showMovementIndicator();
        this.highlightMagicGateLocations(taintedLocations);
    },
    
    executeElvenArchers(heroIndex, cardIndex) {
        const cardHero = this.heroes[heroIndex];
        const card = cardHero.cards[cardIndex];
        
        // Find green locations with minions
        const greenWithMinions = this._getGreenLocationsWithMinions();
        
        if (greenWithMinions.length === 0) {
            this.showInfoModal('🏹', '<div>No Green locations have enemy minions!</div>');
            return;
        }
        
        // Remove card from hero's hand immediately (played — removed from game)
        this._playSpecialCard(cardHero, cardIndex);
        this.updateDeckCounts();
        
        // Store state for click handler
        this.elvenArchersState = {
            heroIndex,
            heroName: cardHero.name,
            heroSymbol: cardHero.symbol,
            usesRemaining: 2,
            results: [] // Track what was cleared
        };
        
        this._startElvenArchersHighlight();
    },
    
    _getGreenLocationsWithMinions() {
        const locations = [];
        for (let [locName, data] of Object.entries(this.locationCoords)) {
            if (data.faction === 'green') {
                const minionsHere = this.minions[locName];
                if (minionsHere) {
                    const total = Object.values(minionsHere).reduce((a, b) => a + b, 0);
                    if (total > 0) locations.push(locName);
                }
            }
        }
        return locations;
    },
    
    _startElvenArchersHighlight() {
        const greenWithMinions = this._getGreenLocationsWithMinions();
        
        // If no valid targets remain or no uses left, finish
        if (greenWithMinions.length === 0 || this.elvenArchersState.usesRemaining <= 0) {
            this._finishElvenArchers();
            return;
        }
        
        // Set movement state
        const currentHero = this.heroes[this.currentPlayerIndex];
        this.activeMovement = {
            cardIndex: -1,
            movementType: 'Elven Archers',
            maxMoves: this.elvenArchersState.usesRemaining,
            movesRemaining: this.elvenArchersState.usesRemaining,
            startLocation: currentHero.location,
            cardUsed: null,
            validDestinations: greenWithMinions,
            isElvenArchers: true
        };
        
        // Disable map dragging
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'default';
            boardContainer.style.pointerEvents = 'none';
        }
        
        const svg = document.getElementById('game-map');
        if (svg) {
            svg.style.pointerEvents = 'auto';
        }
        
        this.showMovementIndicator();
        this.highlightMagicGateLocations(greenWithMinions);
    },
    
    _finishElvenArchers() {
        const state = this.elvenArchersState;
        if (!state) return;
        
        // Clean up movement state
        this.activeMovement = null;
        this.elvenArchersState = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        // Re-enable map dragging
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'grab';
            boardContainer.style.pointerEvents = 'auto';
        }
        
        // Build results summary
        let resultsHTML = '';
        if (state.results.length === 0) {
            resultsHTML = '<div style="color: #999;">No locations were targeted.</div>';
        } else {
            state.results.forEach(r => {
                resultsHTML += `<div style="margin: 8px 0; padding: 8px; background: rgba(22,163,74,0.15); border: 1px solid #16a34a; border-radius: 6px;">
                    <strong style="color: #16a34a;">${r.location}</strong> — ${r.details}
                </div>`;
            });
        }
        
        const locCount = state.results.length;
        this.addLog(`🏹 Special Card: ${state.heroName} plays Elven Archers — cleared minions from ${locCount} Green location${locCount !== 1 ? 's' : ''}! (No action used)`);
        
        // Update everything
        this.renderMap();
        this.renderTokens();
        this.renderHeroes();
        this.updateGameStatus();
        this.updateMovementButtons();
        this.updateActionButtons();
        
        this.showInfoModal('🏹 Elven Archers — Complete!', `
            <div style="text-align: center;">
                <div style="font-size: 2em; margin-bottom: 10px;">🏹</div>
                <div style="color: #16a34a; font-size: 1.1em; font-weight: bold; margin-bottom: 10px;">
                    ${locCount} Green location${locCount !== 1 ? 's' : ''} cleared!
                </div>
                ${resultsHTML}
                <div style="color: #d4af37; margin-top: 10px; font-size: 0.9em;">Card played from ${state.heroSymbol} ${state.heroName}'s hand — No action used</div>
            </div>
        `);
    },
    
    executeBattleStrategy(heroIndex, cardIndex) {
        const cardHero = this.heroes[heroIndex];
        const card = cardHero.cards[cardIndex];
        
        // Remove card immediately (played — removed from game)
        this._playSpecialCard(cardHero, cardIndex);
        this.updateDeckCounts();
        
        this.battleStrategyState = {
            heroName: cardHero.name,
            heroSymbol: cardHero.symbol,
            phase: 'minions', // 'minions' then 'general'
            minionsUsesRemaining: 3,
            minionResults: [],
            generalResult: null
        };
        
        this._startBattleStrategyMinionPhase();
    },
    
    // ===== UNICORN STEED: Variable Dice Roll =====
    _showUnicornSteedRollModal(hero, quest, questIndex) {
        const maxActions = this.actionsRemaining;
        if (maxActions <= 0) {
            this.showInfoModal('📜', '<div>No actions remaining!</div>');
            return;
        }
        
        let optionsHTML = '<div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin: 15px 0;">';
        for (let i = 1; i <= Math.min(maxActions, 6); i++) {
            optionsHTML += `
                <div onclick="game._rollUnicornSteedDice(${i}, ${questIndex})" 
                     style="cursor: pointer; width: 70px; height: 70px; display: flex; flex-direction: column; align-items: center; justify-content: center;
                            border: 3px solid #d4af37; border-radius: 10px; background: rgba(212,175,55,0.1); transition: all 0.2s;"
                     onmouseover="this.style.background='rgba(212,175,55,0.3)'" onmouseout="this.style.background='rgba(212,175,55,0.1)'">
                    <div style="font-size: 1.5em; font-weight: bold; color: #d4af37;">${i}</div>
                    <div style="font-size: 0.7em; color: #999;">${i} action${i > 1 ? 's' : ''}</div>
                </div>
            `;
        }
        optionsHTML += '</div>';
        
        const contentHTML = `
            <div style="text-align: center;">
                <div style="font-size: 2em; margin-bottom: 8px;">🦄</div>
                <div style="color: #d4af37; margin-bottom: 12px;">
                    Spend actions to roll dice. Each action = 1 die. Need 5+ on any die to succeed.
                </div>
                <div style="color: #999; margin-bottom: 8px; font-size: 0.9em;">
                    You have ${maxActions} action${maxActions > 1 ? 's' : ''} remaining. Choose how many to spend:
                </div>
                ${optionsHTML}
            </div>
        `;
        
        this.showInfoModal('🦄 Unicorn Steed', contentHTML);
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv) defaultBtnDiv.style.display = 'none';
    },
    
    _rollUnicornSteedDice(actionCount, questIndex) {
        const hero = this.heroes[this.currentPlayerIndex];
        const quest = hero.questCards[questIndex];
        if (!quest) return;
        
        this.closeInfoModal();
        
        const m = quest.mechanic;
        this.actionsRemaining -= actionCount;
        this.addLog(`📜 ${hero.name} spends ${actionCount} action${actionCount > 1 ? 's' : ''} to attempt Unicorn Steed quest (${actionCount} dice)`);
        
        const rolls = [];
        let successes = 0;
        
        // Sorceress Visions: +1 extra die
        const visionsBonus = hero.name === 'Sorceress' ? 1 : 0;
        const totalDice = actionCount + visionsBonus;
        if (visionsBonus > 0) {
            this.addLog(`⚡ Visions: ${hero.name} rolls ${totalDice} dice instead of ${actionCount}!`);
        }
        
        for (let i = 0; i < totalDice; i++) {
            const roll = Math.floor(Math.random() * 6) + 1;
            const hit = roll >= m.successOn;
            if (hit) successes++;
            rolls.push({ roll, hit });
        }
        
        const passed = successes >= (m.successCount || 1);
        
        const visionsNote = visionsBonus > 0 ? `<div style="color: #ec4899; margin-bottom: 8px; font-size: 0.9em;">⚡ Visions: +1 bonus die!</div>` : '';
        
        let diceHTML = '<div style="display: flex; gap: 8px; justify-content: center; margin: 15px 0; flex-wrap: wrap;">';
        rolls.forEach(r => {
            const color = r.hit ? '#4ade80' : '#ef4444';
            const bg = r.hit ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)';
            const border = r.hit ? '#4ade80' : '#ef4444';
            diceHTML += `<div style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; 
                font-size: 1.5em; font-weight: bold; border-radius: 8px; color: ${color}; 
                background: ${bg}; border: 2px solid ${border};">${r.roll}</div>`;
        });
        diceHTML += '</div>';
        
        const heroIndex = this.currentPlayerIndex;
        
        if (passed) {
            quest.completed = true;
            this.addLog(`📜 ✅ ${hero.name} completed quest: Unicorn Steed! Horse movement + combat re-roll unlocked!`);
            
            const contentHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 2.5em; margin-bottom: 8px;">🦄</div>
                    <div style="color: #4ade80; font-weight: bold; font-size: 1.3em; margin-bottom: 12px;">Unicorn Steed Tamed!</div>
                    <div style="color: #999; margin-bottom: 8px;">Need 5+ on any die (spent ${actionCount} action${actionCount > 1 ? 's' : ''})</div>
                    ${visionsNote}
                    ${diceHTML}
                    <div style="color: #a78bfa; font-weight: bold; margin-top: 10px; padding: 8px; background: rgba(167,139,250,0.15); border: 1px solid #a78bfa; border-radius: 6px;">
                        🏆 Permanent Horse Movement + Re-roll all failed dice once per combat
                    </div>
                </div>
            `;
            
            this.showInfoModal('🦄 Quest Complete!', contentHTML);
        } else {
            this.addLog(`📜 ❌ ${hero.name} failed Unicorn Steed quest (${actionCount} dice, no 5+)`);
            
            const contentHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 2.5em; margin-bottom: 8px;">🦄</div>
                    <div style="color: #ef4444; font-weight: bold; font-size: 1.3em; margin-bottom: 12px;">The Unicorn Escapes!</div>
                    <div style="color: #999; margin-bottom: 8px;">Need 5+ on any die (spent ${actionCount} action${actionCount > 1 ? 's' : ''})</div>
                    ${visionsNote}
                    ${diceHTML}
                    <div style="color: #d4af37; margin-top: 10px; font-size: 0.9em;">Quest card stays — try again!</div>
                </div>
            `;
            
            this.showInfoModal('🦄 Quest Failed', contentHTML);
        }
        
        this.updateGameStatus();
        this.updateActionButtons();
        this.renderHeroes();
        
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            this.updateMapStatus();
            this.updateMovementButtons();
        }
    },
    
    // ===== ORGANIZE MILITIA: Spend action at location =====
    _organizeLocationAction(hero, quest, questIndex) {
        const m = quest.mechanic;
        const locEntry = m.locations[hero.location];
        if (!locEntry || locEntry.organized) return;
        
        this.actionsRemaining -= (m.actionCost || 1);
        locEntry.organized = true;
        
        const colorEmojis = { red: '🔴', black: '⚫', green: '🟢', blue: '🔵' };
        const emoji = colorEmojis[locEntry.color] || '⭕';
        this.addLog(`📜 ${hero.name} organizes militia at ${hero.location} ${emoji}`);
        
        // Check if all locations are organized
        const allOrganized = Object.values(m.locations).every(loc => loc.organized);
        
        if (allOrganized) {
            quest.completed = true;
            this.addLog(`📜 ✅ ${hero.name} completed quest: Organize Militia!`);
            
            const contentHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 2.5em; margin-bottom: 8px;">🛡️</div>
                    <div style="color: #4ade80; font-weight: bold; font-size: 1.3em; margin-bottom: 12px;">Militia Organized!</div>
                    <div style="color: #d4af37; margin-bottom: 8px;">All locations organized:</div>
                    ${Object.entries(m.locations).map(([loc, data]) => {
                        const e = colorEmojis[data.color] || '⭕';
                        return `<div style="color: #4ade80; margin: 4px 0;">${e} ${loc} ✅</div>`;
                    }).join('')}
                    <div style="color: #a78bfa; font-weight: bold; margin-top: 10px; padding: 8px; background: rgba(167,139,250,0.15); border: 1px solid #a78bfa; border-radius: 6px;">
                        🏆 Can be discarded to prevent a General from advancing!
                    </div>
                </div>
            `;
            
            this.showInfoModal('📜 Quest Complete!', contentHTML);
        } else {
            const progress = Object.entries(m.locations).map(([loc, data]) => {
                const e = colorEmojis[data.color] || '⭕';
                const status = data.organized ? '✅' : '⏳';
                return `<div style="color: ${data.organized ? '#4ade80' : '#999'}; margin: 4px 0;">${e} ${loc} ${status}</div>`;
            }).join('');
            
            this.showInfoModal('📜 Militia Organized!', `
                <div style="text-align: center;">
                    <div style="font-size: 2em; margin-bottom: 8px;">🛡️</div>
                    <div style="color: #d4af37; font-weight: bold; margin-bottom: 12px;">Organized locals at ${hero.location}!</div>
                    ${progress}
                </div>
            `);
        }
        
        this.updateGameStatus();
        this.updateActionButtons();
        this.renderHeroes();
        
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            this.updateMapStatus();
            this.updateMovementButtons();
        }
    },
    
    // ===== RUMORS QUEST: Auto-track inn visits =====
    _checkRumorsQuestProgress(hero, locationName) {
        if (!hero.questCards) return;
        
        for (let i = 0; i < hero.questCards.length; i++) {
            const quest = hero.questCards[i];
            if (quest.completed) continue;
            if (!quest.mechanic || quest.mechanic.type !== 'multi_location_visit') continue;
            
            const locEntry = quest.mechanic.locations[locationName];
            if (!locEntry || locEntry.visited) continue;
            
            // Mark as visited
            locEntry.visited = true;
            const colorEmojis = { red: '🔴', black: '⚫', green: '🟢', blue: '🔵' };
            const emoji = colorEmojis[locEntry.color] || '⭕';
            this.addLog(`📜 ${hero.name} visits ${locationName} ${emoji} — Rumors quest progress updated!`);
            
            // Check if all visited
            const allVisited = Object.values(quest.mechanic.locations).every(loc => loc.visited);
            
            if (allVisited) {
                quest.completed = true;
                this.addLog(`📜 ✅ ${hero.name} completed quest: Rumors! Drawing ${quest.mechanic.rewardValue} Hero Cards!`);
                
                // Draw hero cards
                const cardsToDraw = quest.mechanic.rewardValue;
                let drawnCards = [];
                for (let c = 0; c < cardsToDraw; c++) {
                    if (this.heroDeck && this.heroDeck.length > 0) {
                        const card = this.heroDeck.pop();
                        hero.cards.push(card);
                        drawnCards.push(card);
                    }
                }
                this.updateDeckCounts();
                
                // Discard quest card and draw new one
                const heroIndex = this.heroes.indexOf(hero);
                hero.questCards.splice(i, 1);
                this.questDiscardPile++;
                
                // Defer modal display — store data for showing after movement completes
                this._pendingRumorsCompletion = {
                    heroIndex,
                    hero,
                    quest,
                    drawnCards,
                    colorEmojis
                };
                
                this.renderHeroes();
                return;
            }
        }
    },
    
    _showPendingRumorsCompletion() {
        const data = this._pendingRumorsCompletion;
        if (!data) return;
        this._pendingRumorsCompletion = null;
        
        const { heroIndex, quest, drawnCards, colorEmojis } = data;
        
        const progress = Object.entries(quest.mechanic.locations).map(([loc, locData]) => {
            const e = colorEmojis[locData.color] || '⭕';
            return `<div style="color: #4ade80; margin: 4px 0;">${e} ${loc} ✅</div>`;
        }).join('');
        
        const cardColorMap = { 'red': '#dc2626', 'blue': '#2563eb', 'green': '#16a34a', 'black': '#1f2937' };
        const drawnHTML = drawnCards.map(c => {
            const borderColor = c.special ? '#9333ea' : (cardColorMap[c.color] || '#666');
            return `<span style="color: ${borderColor}; font-weight: bold;">${c.icon || '🎴'} ${c.name}</span>`;
        }).join(', ');
        
        this.showInfoModal('📜 Rumors Complete!', `
            <div style="text-align: center;">
                <div style="font-size: 2.5em; margin-bottom: 8px;">🍺</div>
                <div style="color: #4ade80; font-weight: bold; font-size: 1.3em; margin-bottom: 12px;">All Rumors Gathered!</div>
                ${progress}
                <div style="color: #d4af37; font-weight: bold; margin-top: 10px;">Drew ${drawnCards.length} Hero Cards:</div>
                <div style="margin-top: 6px; font-size: 0.9em;">${drawnHTML || 'Deck empty!'}</div>
            </div>
        `, () => {
            // Draw new quest
            const newQuest = this.drawQuestCard(heroIndex);
            if (newQuest) {
                this._drawAndShowNewQuest_display(heroIndex, newQuest);
            }
        });
    },
    
    // ===== FIND MAGIC GATE: Hook after gate building =====
    _checkFindMagicGateCompletion(hero) {
        if (!this._pendingFindMagicGateQuest) return;
        
        const questIndex = this._pendingFindMagicGateQuest.questIndex;
        this._pendingFindMagicGateQuest = null;
        
        if (!hero.questCards || !hero.questCards[questIndex]) return;
        const quest = hero.questCards[questIndex];
        
        quest.completed = true;
        this.addLog(`📜 ✅ ${hero.name} completed quest: Find Magic Gate!`);
        // NOTE: Modal shown by confirmBuildMagicGate in land-turns.js (combined with gate built modal)
    },
    
    // ===== UNICORN STEED: Horse movement action =====
    useUnicornSteed() {
        if (this.activeMovement) {
            this.clearMovementMode();
        }
        
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        
        // Same as Noble Steed: 2-space horse movement, no card required
        this.activeMovement = {
            cardIndex: -1,
            movementType: 'Unicorn Steed',
            maxMoves: 2,
            movesRemaining: 2,
            startLocation: hero.location,
            cardUsed: null
        };
        
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'default';
            boardContainer.style.pointerEvents = 'none';
        }
        
        const svg = document.getElementById('game-map');
        if (svg) {
            svg.style.pointerEvents = 'auto';
        }
        
        this.showMovementIndicator();
        this.highlightReachableLocations();
    },
    
    // ===== UNICORN STEED: Check if hero has completed steed =====
    _hasUnicornSteed(hero) {
        if (!hero.questCards) return false;
        return hero.questCards.some(q => q.completed && q.mechanic && q.mechanic.rewardType === 'unicorn_steed');
    },
    
    // ===== FIND MAGIC GATE: Check for completed combat bonus quest =====
    _findCombatBonusDiceQuest(hero) {
        if (!hero.questCards) return null;
        for (let i = 0; i < hero.questCards.length; i++) {
            const q = hero.questCards[i];
            if (q.completed && q.mechanic && q.mechanic.rewardType === 'use_quest_card_anytime' && q.mechanic.rewardValue === 'combat_bonus_dice') {
                return { quest: q, questIndex: i };
            }
        }
        return null;
    },
    
    // ===== ORGANIZE MILITIA: Find completed quest on any hero =====
    _findOrganizeMilitiaQuestCard() {
        for (let i = 0; i < this.heroes.length; i++) {
            const hero = this.heroes[i];
            if (!hero.questCards || hero.health <= 0) continue;
            for (let j = 0; j < hero.questCards.length; j++) {
                const q = hero.questCards[j];
                if (q.completed && q.mechanic && q.mechanic.rewardType === 'use_quest_card_anytime' && q.mechanic.rewardValue === 'block_general_advance') {
                    return { hero, heroIndex: i, questIndex: j, quest: q };
                }
            }
        }
        return null;
    },
    
    // ===== ORGANIZE MILITIA: Confirm use during darkness phase =====
    _organizeMilitiaConfirm() {
        const holder = this._findOrganizeMilitiaQuestCard();
        if (!holder) return;
        
        const card = this.darknessCurrentCard;
        const generalName = this.generals.find(g => g.color === card.general)?.name || 'Unknown';
        
        // Remove quest card from hero
        holder.hero.questCards.splice(holder.questIndex, 1);
        this.questDiscardPile++;
        
        // Store blocked state (reuse strongDefensesActive pattern)
        this.organizeMilitiaActive = true;
        
        this.addLog(`📜 🛡️ ${holder.hero.name} uses Organize Militia — prevents ${generalName} from advancing!`);
        
        this.closeInfoModal();
        this.renderHeroes();
        this.updateDeckCounts();
        
        // Draw new quest card for the hero
        const newQuest = this.drawQuestCard(holder.heroIndex);
        
        // Re-render the preview with blocked general shown
        const cardNum = this.darknessCardsDrawn;
        const totalCards = this.darknessCardsToDraw;
        const generalOnly = this.darknessCurrentGeneralOnly;
        this.showDarknessCardPreview(card, cardNum, totalCards, generalOnly);
    },
    
    _getLocationsWithMinions() {
        const locations = [];
        for (let [locName, data] of Object.entries(this.locationCoords)) {
            const minionsHere = this.minions[locName];
            if (minionsHere) {
                const total = Object.values(minionsHere).reduce((a, b) => a + b, 0);
                if (total > 0) locations.push(locName);
            }
        }
        return locations;
    },
});
