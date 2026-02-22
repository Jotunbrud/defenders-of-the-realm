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
            const locationText = quest.location ? `📍 ${quest.location}` : '';
            
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
            const canView = quest.location && !quest.completed;
            viewBtn.disabled = !canView;
            viewBtn.style.opacity = canView ? '1' : '0.5';
            viewBtn.style.cursor = canView ? 'pointer' : 'not-allowed';
            viewBtn.style.background = canView ? '#dc2626' : '#666';
        }
        
        // Update Use button
        const useBtn = document.getElementById('use-quest-btn');
        if (useBtn) {
            let canUse = quest.completed && quest.mechanic && quest.mechanic.rewardType === 'use_quest_card_anytime';
            // If requirePresence, check hero is on a valid location
            if (canUse && quest.mechanic.requirePresence && quest.mechanic.rewardValue === 'remove_taint') {
                const hero = this.heroes[heroIndex];
                canUse = this.taintCrystals[hero.location] && this.taintCrystals[hero.location] > 0;
            }
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
        if (!quest || !quest.location) return;
        
        const coords = this.locationCoords[quest.location];
        if (!coords) return;
        
        // Ensure map is showing
        this.showMap();
        
        // Remove old quest highlights
        document.querySelectorAll('.quest-location-highlight').forEach(el => el.remove());
        
        const svg = document.getElementById('game-map');
        
        // Create pulsing red highlight on quest location (matches standard location-highlight style)
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highlight.classList.add('quest-location-highlight');
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
                <span style="color: #ef4444;">📍 ${quest.location}</span>
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
            if (quest.location && hero.location === quest.location) {
                return { quest, questIndex: i };
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
    
    _getLocationsWithMinions() {
});
