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
        
        // Track minion defeats for quest progress (e.g. Orc Hunter)
        this._trackQuestMinionDefeats(colorResults);
        
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
        
        let cardsHTML = '<div id="special-cards-list" style="display: flex; flex-direction: column; gap: 8px;">';
        specialCards.forEach(({ hero, heroIndex, card, cardIndex }, i) => {
            cardsHTML += `
                <div id="special-card-option-${i}" onclick="game.selectSpecialCard(${i}, ${heroIndex}, ${cardIndex})"
                     style="background:linear-gradient(135deg,#f0e6d3 0%,#ddd0b8 50%,#c8bb9f 100%);border:3px solid #6d28a8;border-radius:10px;overflow:hidden;box-shadow:0 0 8px rgba(109,40,168,0.4);cursor:pointer;transition:all 0.2s;">
                    <div style="background:linear-gradient(135deg,#6d28a8cc 0%,#6d28a899 100%);padding:6px 14px;border-bottom:2px solid #8b7355;display:flex;align-items:center;justify-content:space-between;">
                        <span class="hero-banner-name">${card.icon || '💫'} ${card.name}</span>
                        <span class="hero-banner-name" style="font-size:0.85em">${hero.symbol} ${hero.name}</span>
                    </div>
                    <div style="padding:10px 14px;">
                        <div class="modal-desc-text" style="font-size:0.75em;color:#3d2b1f;line-height:1.5;margin-bottom:6px;">${card.description || card.type}</div>
                        <div style="padding-top:6px;border-top:1px solid rgba(139,115,85,0.3);display:flex;justify-content:space-between;align-items:center;">
                            <span class="modal-desc-text" style="font-size:0.75em;color:#3d2b1f;">🎲 ${card.dice} ${card.dice === 1 ? 'die' : 'dice'} vs ${card.color === 'any' ? 'Any General' : ({'red':'Demons','blue':'Dragonkin','green':'Orcs','black':'Undead'}[card.color] || 'Any')}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        cardsHTML += '</div>';
        
        const contentHTML = `
            <div class="modal-heading" style="text-align:center;color:#d4af37;font-size:0.85em;margin-bottom:12px">
                Special cards can be played at any time without using an action.
            </div>
            ${this._parchmentBoxOpen('Select a Card')}
                ${cardsHTML}
            ${this._parchmentBoxClose()}
            <button id="use-special-card-btn" class="phase-btn" style="opacity: 0.4; cursor: not-allowed; margin-top: 12px;" disabled onclick="game.confirmSpecialCard()">Use Card</button>
            <button class="phase-btn" onclick="game.closeInfoModal()">Cancel</button>
        `;
        
        this.showInfoModal('🌟 Special Cards', contentHTML);
        const titleEl = document.getElementById('info-modal-title');
        if (titleEl) { titleEl.className = 'modal-heading'; titleEl.style.textAlign = 'center'; titleEl.style.fontSize = '1.15em'; titleEl.style.marginBottom = '4px'; }
        // Hide the default Continue button
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv && !defaultBtnDiv.querySelector('#use-special-card-btn')) defaultBtnDiv.style.display = 'none';
    },
    
    selectSpecialCard(displayIndex, heroIndex, cardIndex) {
        this._selectedSpecialCard = { heroIndex, cardIndex };
        
        // Clear all selections
        document.querySelectorAll('#special-cards-list > div').forEach(el => {
            el.classList.remove('selected-special');
            el.style.borderColor = '#6d28a8';
            el.style.boxShadow = '0 0 8px rgba(109,40,168,0.4)';
        });
        
        // Highlight selected
        const selected = document.getElementById(`special-card-option-${displayIndex}`);
        if (selected) {
            selected.classList.add('selected-special');
            selected.style.borderColor = '#d4af37';
            selected.style.boxShadow = '0 0 12px rgba(212,175,55,0.5), 0 4px 12px rgba(0,0,0,0.4)';
        }
        
        // Enable Use Card button
        const useBtn = document.getElementById('use-special-card-btn');
        if (useBtn) {
            useBtn.disabled = false;
            useBtn.style.opacity = '1';
            useBtn.style.cursor = '';
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
        const activeQuests = [];
        const retiredQuests = [];
        this.heroes.forEach((hero, heroIndex) => {
            if (filterHeroIndex !== null && heroIndex !== filterHeroIndex) return;
            if (hero.questCards) {
                hero.questCards.forEach((quest, questIndex) => {
                    if (quest.discarded) {
                        retiredQuests.push({ hero, heroIndex, quest, questIndex });
                    } else {
                        activeQuests.push({ hero, heroIndex, quest, questIndex });
                    }
                });
            }
            // Legacy archived quests (from before in-place tracking)
            if (hero.completedQuests) {
                hero.completedQuests.forEach((quest) => {
                    retiredQuests.push({ hero, heroIndex, quest, isLegacy: true });
                });
            }
        });
        
        const filterHero = filterHeroIndex !== null ? this.heroes[filterHeroIndex] : null;
        const modalTitle = filterHero ? `📜 ${filterHero.symbol} ${filterHero.name}'s Quests` : '📜 Quest Cards';
        
        if (activeQuests.length === 0 && retiredQuests.length === 0) {
            this.showInfoModal(modalTitle, filterHero ? `<div>${filterHero.name} has no quest cards!</div>` : '<div>No heroes have any quest cards!</div>');
            return;
        }
        
        this._selectedQuestCard = null;
        this._questCardsList = activeQuests;
        
        let cardsHTML = '<div id="quest-cards-list" style="display: flex; flex-direction: column; gap: 8px;">';
        activeQuests.forEach(({ hero, heroIndex, quest, questIndex }, i) => {
            const statusIcon = quest.completed ? '✅' : '⏳';
            const statusText = quest.completed ? 'COMPLETED' : 'In Progress';
            const bannerBg = quest.completed ? 'linear-gradient(135deg,#16a34acc 0%,#16a34a99 100%)' : 'linear-gradient(135deg,#b91c1ccc 0%,#b91c1c99 100%)';
            let locationText = quest.location ? `📍 ${quest.location}` : '';
            
            // Multi-location progress (Rumors, Organize Militia)
            const colorEmojis = { red: '🔴', black: '⚫', green: '🟢', blue: '🔵' };
            if (!quest.completed && quest.mechanic && quest.mechanic.type === 'multi_location_visit' && quest.mechanic.locations) {
                locationText = Object.entries(quest.mechanic.locations).map(([loc, data]) => {
                    const emoji = colorEmojis[data.color] || '⭕';
                    const check = data.visited ? '✅' : '⬜';
                    const color = data.visited ? '#16a34a' : '#8b7355';
                    return `<span style="color: ${color};">${emoji} ${loc} ${check}</span>`;
                }).join(' &nbsp;');
            }
            if (!quest.completed && quest.mechanic && quest.mechanic.type === 'multi_location_action' && quest.mechanic.locations) {
                locationText = Object.entries(quest.mechanic.locations).map(([loc, data]) => {
                    const emoji = colorEmojis[data.color] || '⭕';
                    const check = data.organized ? '✅' : '⬜';
                    const color = data.organized ? '#16a34a' : '#8b7355';
                    return `<span style="color: ${color};">${emoji} ${loc} ${check}</span>`;
                }).join(' &nbsp;');
            }
            if (quest.mechanic && quest.mechanic.type === 'build_gate_red' && !quest.completed) {
                locationText = '📍 Any Red Location (with matching card)';
            }
            
            cardsHTML += `
                <div id="quest-card-option-${i}" onclick="game.selectQuestCard(${i}, ${heroIndex}, ${questIndex})"
                     style="background:linear-gradient(135deg,#f0e6d3 0%,#ddd0b8 50%,#c8bb9f 100%);border:3px solid #8b7355;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.4),inset 0 0 0 1px rgba(139,115,85,0.3);cursor:pointer;transition:all 0.2s;">
                    <div style="background:${bannerBg};padding:6px 14px;border-bottom:2px solid #8b7355;display:flex;align-items:center;justify-content:space-between;">
                        <span class="hero-banner-name">${statusIcon} ${quest.name}</span>
                        <span class="hero-banner-name" style="font-size:0.85em">${filterHeroIndex === null ? hero.symbol + ' ' + hero.name : statusText}</span>
                    </div>
                    <div style="padding:10px 14px;">
                        <div class="modal-desc-text" style="font-size:0.75em;color:#3d2b1f;line-height:1.5;margin-bottom:6px;">${quest.description}</div>
                        ${locationText ? `<div style="font-size:0.75em;color:#5c4a3a;margin-bottom:4px;">${locationText}</div>` : ''}
                        <div style="padding-top:6px;border-top:1px solid rgba(139,115,85,0.3);">
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.75em;color:#b91c1c;">Reward:</span>
                            <span class="modal-desc-text" style="font-size:0.75em;color:#3d2b1f;line-height:1.5;"> ${quest.reward}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        cardsHTML += '</div>';
        
        // Build retired quests section (used/discarded/failed)
        let archivedHTML = '';
        if (retiredQuests.length > 0) {
            archivedHTML = '<div style="margin-top: 12px;">';
            archivedHTML += `${this._parchmentBoxOpen('📋 Quest History')}`;
            retiredQuests.forEach(({ hero, quest, isLegacy }) => {
                const icon = quest.failed ? '❌' : '🏆';
                const label = isLegacy ? (quest.useReason || 'Used') : (quest.failed ? 'Failed' : (quest.discardReason || 'Used'));
                archivedHTML += `
                    <div style="background:linear-gradient(135deg,#e8dcc8 0%,#d5c9b3 100%);border:2px solid rgba(139,115,85,0.5);border-radius:8px;padding:8px 12px;margin-bottom:6px;opacity:0.7;">
                        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.75em;color:#5c4a3a;">📜 ${quest.name}</span>
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.65em;color:#8b7355;">${icon} ${quest.failed ? 'FAILED' : 'USED'}</span>
                        </div>
                        <div class="modal-desc-text" style="font-size:0.7em;color:#5c4a3a;margin-top:3px;">${label}</div>
                        ${filterHeroIndex === null ? `<div style="font-size:0.7em;color:${hero.color};margin-top:2px;font-family:'Cinzel',Georgia,serif;font-weight:900;">${hero.symbol} ${hero.name}</div>` : ''}
                    </div>
                `;
            });
            archivedHTML += `${this._parchmentBoxClose()}</div>`;
        }
        
        const contentHTML = `
            <div class="modal-heading" style="text-align:center;color:#d4af37;font-size:0.85em;margin-bottom:12px">
                ${filterHero ? `${filterHero.name}'s quest cards. Select a quest to view or use.` : 'Quest cards assigned to heroes. Select a quest to view or use.'}
            </div>
            ${this._parchmentBoxOpen('Active Quests')}
                ${activeQuests.length > 0 ? cardsHTML : '<div class="modal-desc-text" style="text-align:center;font-size:0.75em;color:#5c4a3a;">No active quest cards.</div>'}
            ${this._parchmentBoxClose()}
            ${archivedHTML}

            <div id="quest-use-context-hint" style="text-align: center;"></div>
            <button id="use-quest-btn" class="phase-btn" style="opacity: 0.4; cursor: not-allowed; margin-top: 12px;" disabled onclick="game.confirmUseQuest()">Use</button>
            <button class="phase-btn" onclick="game.closeInfoModal()">Cancel</button>
        `;
        
        this.showInfoModal(modalTitle, contentHTML);
        const titleEl = document.getElementById('info-modal-title');
        if (titleEl) { titleEl.className = 'modal-heading'; titleEl.style.textAlign = 'center'; titleEl.style.fontSize = '1.15em'; titleEl.style.marginBottom = '4px'; }
        // Hide the default Continue button since we have our own Close button
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv && defaultBtnDiv.querySelector('.btn-primary')) defaultBtnDiv.style.display = 'none';
        
        // Auto-select if only one active quest
        if (activeQuests.length === 1) {
            this.selectQuestCard(0, activeQuests[0].heroIndex, activeQuests[0].questIndex);
        }
    },
    
    selectQuestCard(displayIndex, heroIndex, questIndex) {
        this._selectedQuestCard = { displayIndex, heroIndex, questIndex };
        
        const quest = this.heroes[heroIndex].questCards[questIndex];
        
        // Clear all selections
        document.querySelectorAll('#quest-cards-list > div').forEach(el => {
            el.classList.remove('selected-quest');
            el.style.borderColor = '#8b7355';
            el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4),inset 0 0 0 1px rgba(139,115,85,0.3)';
        });
        
        // Highlight selected
        const selected = document.getElementById(`quest-card-option-${displayIndex}`);
        if (selected) {
            selected.classList.add('selected-quest');
            selected.style.borderColor = '#d4af37';
            selected.style.boxShadow = '0 0 12px rgba(212,175,55,0.5), 0 4px 12px rgba(0,0,0,0.4)';
        }
        
        // Update Use button
        const useBtn = document.getElementById('use-quest-btn');
        if (useBtn) {
            let canUse = quest.completed && quest.mechanic && quest.mechanic.rewardType === 'use_quest_card_anytime';
            // Exclude context-dependent rewards (these have their own buttons in combat/darkness phase)
            if (canUse && quest.mechanic.rewardValue === 'combat_bonus_dice') canUse = false;
            if (canUse && quest.mechanic.rewardValue === 'block_general_advance') canUse = false;
            if (canUse && quest.mechanic.rewardValue && quest.mechanic.rewardValue.startsWith('block_minion_placement')) canUse = false;
            if (canUse && quest.mechanic.rewardValue === 'amarak_ignore_combat_skill') canUse = false;
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
                } else if (quest.mechanic.rewardValue && quest.mechanic.rewardValue.startsWith('block_minion_placement')) {
                    contextHint = '<div style="color: #d4af37; font-size: 0.8em; margin-top: 4px;">🌙 Used during Darkness Spreads phase</div>';
                } else if (quest.mechanic.rewardValue === 'amarak_ignore_combat_skill') {
                    contextHint = '<div style="color: #d4af37; font-size: 0.8em; margin-top: 4px;">⚔️ Used when attacking a General</div>';
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
        const mapBar = document.querySelector('.map-top-bar');
        const topPos = mapBar ? (mapBar.getBoundingClientRect().top) + 'px' : '40px';
        indicator.style.cssText = `
            position: fixed; top: ${topPos}; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.95); border: 3px solid #dc2626; border-radius: 10px;
            padding: 12px 18px; z-index: 25000; text-align: center; max-width: 280px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.8);
        `;
        
        indicator.innerHTML = `
            <div style="color: #ef4444; font-weight: bold; font-size: 1em; margin-bottom: 6px; font-family:'Cinzel',Georgia,serif;">
                📜 ${quest.name}
            </div>
            <div style="color: #d4af37; font-size: 0.8em; margin-bottom: 6px;">${quest.description}</div>
            <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; font-size: 0.8em; margin-bottom: 6px;">
                ${locationDisplay}
                <span style="color: ${hero.color};">${hero.symbol} ${hero.name}</span>
            </div>
            <div style="color: #a78bfa; font-size: 0.8em; margin-bottom: 8px;">🏆 ${quest.reward}</div>
            <button class="btn" onclick="game._closeQuestView()" style="background: #666; padding: 5px 16px; font-size: 0.85em;">Close</button>
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
        if (!quest || !quest.completed || quest.discarded) return;
        
        const m = quest.mechanic;
        if (m.rewardType === 'use_quest_card_anytime' && m.rewardValue === 'raids_skip_darkness') {
            // Confirm usage
            this.showInfoModal('📜 Use Raids?', `
                <div style="text-align:center;">
                    <div style="font-size:2em;margin-bottom:10px;">⚔️</div>
                    <div style="color:#d4af37;font-weight:bold;font-size:1.1em;margin-bottom:10px;">Discard ${quest.name}?</div>
                    <div style="color:#999;font-size:0.9em;margin-bottom:15px;">This will skip ALL Darkness Spreads cards at the end of your current turn.</div>
                    <div style="display:flex;gap:10px;">
                        <button class="btn" style="flex:1;background:#666;" onclick="game.closeInfoModal()">Cancel</button>
                        <button class="btn btn-primary" style="flex:1;" onclick="game.closeInfoModal(); game._confirmRaidsSkip(${heroIndex}, ${questIndex})">Confirm</button>
                    </div>
                </div>
            `);
            const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
            if (defaultBtnDiv && defaultBtnDiv.querySelector('.btn-primary')) defaultBtnDiv.style.display = 'none';
            return;
        }
        if (m.rewardType === 'use_quest_card_anytime' && m.rewardValue === 'gryphon_move_heroes') {
            this._startGryphonMoveHeroes(heroIndex, questIndex);
            return;
        }
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
            const mapBar2 = document.querySelector('.map-top-bar');
            const topPos2 = mapBar2 ? (mapBar2.getBoundingClientRect().top) + 'px' : '40px';
            indicator.style.cssText = `
                position: fixed; top: ${topPos2}; left: 50%; transform: translateX(-50%); z-index: 25000;
                background: rgba(0,0,0,0.9); border: 2px solid #dc2626; border-radius: 10px;
                padding: 12px 18px; color: white; text-align: center; max-width: 280px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.8);
            `;
            indicator.innerHTML = `
                <div style="color: #ef4444; font-weight: bold; font-size: 1em; margin-bottom: 4px; font-family:'Cinzel',Georgia,serif;">
                    📜 ${quest.name}
                </div>
                <div style="color: #d4af37; font-size: 0.8em; margin-bottom: 6px;">
                    Click a highlighted location to remove 1 Tainted Crystal
                </div>
                <button class="btn" onclick="game.clearQuestUseMode()" style="background: #666; padding: 5px 16px; font-size: 0.85em;">Cancel</button>
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
        
        // Retire the quest card (mark as used, keep in questCards for history)
        this._retireQuest(hero, quest, `Removed Taint Crystal at ${locationName}`);
        
        this.addLog(`📜 ✨ ${hero.name} used ${quest.name} to remove a Tainted Crystal at ${locationName}!`);
        
        this.updateDeckCounts();
        this.updateGameStatus();
        this.updateActionButtons();
        this.renderHeroes();
        this.renderTokens();
        
        // Show success modal
        const successHTML = `
            <div class="modal-heading" style="text-align:center;color:#16a34a;font-size:1.15em;margin-bottom:4px">✨ Tainted Crystal Removed!</div>
            ${this._parchmentBoxOpen('📜 ' + quest.name)}
                <div style="text-align:center;padding:8px 0;">
                    <div class="modal-desc-text" style="font-size:0.8em;color:#d4af37;margin-bottom:8px;">Removed 1 Tainted Crystal at ${locationName}</div>
                    <div class="modal-desc-text" style="font-size:0.8em;color:#5c4a3a;">Quest card discarded.</div>
                </div>
            ${this._parchmentBoxClose()}
        `;
        
        this.showInfoModal('📜 Quest Used', successHTML);
    },
    
    _drawAndShowNewQuest_display(heroIndex, newQuest) {
        const hero = this.heroes[heroIndex];
        
        const questCardHTML = `
            <div style="background:linear-gradient(135deg,#f0e6d3 0%,#ddd0b8 50%,#c8bb9f 100%);border:3px solid #8b7355;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.4),inset 0 0 0 1px rgba(139,115,85,0.3);">
                <div style="background:linear-gradient(135deg,#b91c1ccc 0%,#b91c1c99 100%);padding:6px 14px;border-bottom:2px solid #8b7355;display:flex;align-items:center;justify-content:space-between;">
                    <span class="hero-banner-name">📜 ${newQuest.name}</span>
                    <span class="hero-banner-name" style="font-size:0.85em">${hero.symbol} ${hero.name}</span>
                </div>
                <div style="padding:12px 14px;">
                    <div class="modal-desc-text" style="font-size:0.75em;color:#3d2b1f;line-height:1.5;margin-bottom:8px;">${newQuest.description}</div>
                    <div style="padding-top:6px;border-top:1px solid rgba(139,115,85,0.3);">
                        <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.75em;color:#b91c1c;">Reward:</span>
                        <span class="modal-desc-text" style="font-size:0.75em;color:#3d2b1f;line-height:1.5;"> ${newQuest.reward}</span>
                    </div>
                </div>
            </div>
        `;
        
        const contentHTML = `
            <div class="modal-heading" style="text-align:center;color:#d4af37;font-size:0.85em;margin-bottom:12px">
                ${hero.name} draws a new quest!
            </div>
            <div class="parchment-box"><div class="parchment-banner"><span class="hero-banner-name">New Quest</span></div>
                ${questCardHTML}
            </div>
        `;
        
        this.showInfoModal('📜 New Quest Drawn', contentHTML);
        const titleEl = document.getElementById('info-modal-title');
        if (titleEl) { titleEl.className = 'modal-heading'; titleEl.style.textAlign = 'center'; titleEl.style.fontSize = '1.15em'; titleEl.style.marginBottom = '4px'; }
    },
    
    _getCompletableQuest(hero) {
        if (!hero.questCards) return null;
        for (let i = 0; i < hero.questCards.length; i++) {
            const quest = hero.questCards[i];
            if (quest.completed || quest.discarded) continue;
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
            
            // Scout the General: hero must be at the same location as the named general (not defeated)
            if (quest.mechanic.type === 'scout_general') {
                const targetGeneral = this.generals.find(g => g.name === quest.mechanic.generalName);
                if (targetGeneral && !targetGeneral.defeated && hero.location === targetGeneral.location) {
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
                if (q.completed && !q.discarded && q.mechanic && q.mechanic.rewardType === 'bonus_actions') {
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
                if (q.completed && !q.discarded && q.mechanic && q.mechanic.rewardType === 'bonus_hero_card') {
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
        
        // Multi-location action (Organize Militia) — show confirmation before spending action
        if (m.type === 'multi_location_action') {
            if (this.actionsRemaining < (m.actionCost || 1)) {
                this.showInfoModal('📜', '<div>Not enough actions remaining!</div>');
                return;
            }
            this._confirmOrganizeAction(hero, quest, questIndex);
            return;
        }
        
        // Scout the General — auto-complete, search deck for matching card
        if (m.type === 'scout_general') {
            if (this.actionsRemaining < (m.actionCost || 1)) {
                this.showInfoModal('📜', '<div>Not enough actions remaining!</div>');
                return;
            }
            this._executeScoutGeneral(hero, quest, questIndex);
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
                <div class="modal-heading" style="text-align:center;color:#16a34a;font-size:1.15em;margin-bottom:4px">✅ Quest Complete!</div>
                ${this._parchmentBoxOpen('📜 ' + quest.name)}
                    <div style="text-align:center;padding:8px 0;">
                        <div class="modal-desc-text" style="font-size:0.8em;color:#3d2b1f;margin-bottom:8px;">Need ${m.successOn}+ on any die</div>
                        ${visionsNote}
                        ${diceHTML}
                        <div style="margin-top:12px;padding:8px;background:rgba(167,139,250,0.15);border:1px solid #a78bfa;border-radius:6px;">
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.8em;color:#7c3aed;">🏆 Reward:</span>
                            <span class="modal-desc-text" style="font-size:0.75em;color:#3d2b1f;"> ${quest.reward}</span>
                        </div>
                    </div>
                ${this._parchmentBoxClose()}
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
            } else if (m.rewardType === 'amazon_envoy_sweep') {
                // Roll d6 for how many minions to defeat
                const sweepRoll = Math.floor(Math.random() * 6) + 1;
                this.addLog(`📜 ${quest.name}: ${hero.name} convinced the Amazons! Rolling D6 for warriors: ${sweepRoll}`);
                
                // Store state for the sweep picker
                this._amazonEnvoyState = {
                    heroIndex,
                    heroName: hero.name,
                    heroSymbol: hero.symbol,
                    questName: quest.name,
                    originLocation: m.rewardValue,
                    sweepRoll,
                    remaining: sweepRoll,
                    results: []
                };
                
                // Retire quest and draw new one BEFORE starting sweep
                this._retireQuest(hero, quest, `Amazon warriors deployed (${sweepRoll})`);
                
                // Build dice result + sweep roll into a combined modal
                const sweepDieHTML = `<div style="display:flex;justify-content:center;margin-top:12px;">
                    <div style="width:60px;height:60px;display:flex;align-items:center;justify-content:center;
                        font-size:1.8em;font-weight:bold;border-radius:8px;color:#d4af37;
                        background:rgba(212,175,55,0.2);border:2px solid #d4af37;">${sweepRoll}</div>
                </div>
                <div style="color:#d4af37;font-size:0.9em;margin-top:6px;">Defeat up to ${sweepRoll} minion${sweepRoll !== 1 ? 's' : ''} within 2 spaces of ${m.rewardValue}</div>`;
                
                const sweepContentHTML = `
                    <div class="modal-heading" style="text-align:center;color:#16a34a;font-size:1.15em;margin-bottom:4px">✅ Quest Complete!</div>
                    ${this._parchmentBoxOpen('📜 ' + quest.name)}
                        <div style="text-align:center;padding:8px 0;">
                            <div class="modal-desc-text" style="font-size:0.8em;color:#3d2b1f;margin-bottom:8px;">Need ${m.successOn}+ on any die</div>
                            ${visionsNote}
                            ${diceHTML}
                            <div style="margin-top:12px;padding:8px;background:rgba(167,139,250,0.15);border:1px solid #a78bfa;border-radius:6px;">
                                <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.8em;color:#7c3aed;">🏆 Amazon Warriors Roll:</span>
                                ${sweepDieHTML}
                            </div>
                        </div>
                    ${this._parchmentBoxClose()}
                `;
                
                this.showInfoModal('📜 Quest Complete!', sweepContentHTML, () => {
                    this._startAmazonEnvoyHighlight();
                });
                
                // Skip normal completion modal
                this.updateGameStatus();
                this.updateActionButtons();
                this.renderHeroes();
                return;
            }
            
            this.showInfoModal('📜 Quest Complete!', contentHTML, () => {
                // Draw new quest card on completion
                this._drawAndShowNewQuest(heroIndex);
            });
        } else {
            // FAILURE
            this.addLog(`📜 ❌ ${hero.name} failed quest: ${quest.name}`);
            
            const contentHTML = `
                <div class="modal-heading" style="text-align:center;color:#dc2626;font-size:1.15em;margin-bottom:4px">❌ Quest Failed!</div>
                ${this._parchmentBoxOpen('📜 ' + quest.name)}
                    <div style="text-align:center;padding:8px 0;">
                        <div class="modal-desc-text" style="font-size:0.8em;color:#3d2b1f;margin-bottom:8px;">Needed ${m.successOn}+ on any die</div>
                        ${visionsNote}
                        ${diceHTML}
                        ${m.failDiscard ? '<div class="modal-desc-text" style="color:#dc2626;font-size:0.8em;margin-top:10px;">Quest card discarded.</div>' : ''}
                    </div>
                ${this._parchmentBoxClose()}
            `;
            
            if (m.failDiscard) {
                this._retireQuest(hero, quest, 'Quest failed');
                quest.failed = true;
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
            const questCardHTML = `
                <div style="background:linear-gradient(135deg,#f0e6d3 0%,#ddd0b8 50%,#c8bb9f 100%);border:3px solid #8b7355;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.4),inset 0 0 0 1px rgba(139,115,85,0.3);">
                    <div style="background:linear-gradient(135deg,#b91c1ccc 0%,#b91c1c99 100%);padding:6px 14px;border-bottom:2px solid #8b7355;display:flex;align-items:center;justify-content:space-between;">
                        <span class="hero-banner-name">📜 ${newQuest.name}</span>
                        <span class="hero-banner-name" style="font-size:0.85em">${hero.symbol} ${hero.name}</span>
                    </div>
                    <div style="padding:12px 14px;">
                        <div class="modal-desc-text" style="font-size:0.75em;color:#3d2b1f;line-height:1.5;margin-bottom:8px;">${newQuest.description}</div>
                        <div style="padding-top:6px;border-top:1px solid rgba(139,115,85,0.3);">
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.75em;color:#b91c1c;">Reward:</span>
                            <span class="modal-desc-text" style="font-size:0.75em;color:#3d2b1f;line-height:1.5;"> ${newQuest.reward}</span>
                        </div>
                    </div>
                </div>
            `;
            
            const contentHTML = `
                <div class="modal-heading" style="text-align:center;color:#d4af37;font-size:0.85em;margin-bottom:12px">
                    ${hero.name} draws a new quest!
                </div>
                <div class="parchment-box"><div class="parchment-banner"><span class="hero-banner-name">New Quest</span></div>
                    ${questCardHTML}
                </div>
            `;
            
            this.showInfoModal('📜 New Quest Drawn', contentHTML);
            const titleEl = document.getElementById('info-modal-title');
            if (titleEl) { titleEl.className = 'modal-heading'; titleEl.style.textAlign = 'center'; titleEl.style.fontSize = '1.15em'; titleEl.style.marginBottom = '4px'; }
        } else {
            this.showInfoModal('📜', '<div>Quest deck is empty — no new quest drawn.</div>');
        }
    },
    
    drawQuestCard(heroIndex) {
        const hero = this.heroes[heroIndex];
        if (!hero.questCards) hero.questCards = [];
        if (!hero.completedQuests) hero.completedQuests = [];
        
        if (this.questDeck.length === 0) {
            this.addLog(`📜 Quest deck is empty — no quest card drawn for ${hero.name}.`);
            return null;
        }
        
        const quest = this.questDeck.pop();
        
        // Scout the General: if the general is already defeated, discard and draw again
        if (quest.mechanic && quest.mechanic.type === 'scout_general') {
            const targetGeneral = this.generals ? this.generals.find(g => g.name === quest.mechanic.generalName) : null;
            if (targetGeneral && targetGeneral.defeated) {
                quest.discarded = true;
                quest.discardReason = 'General already defeated';
                this.questDiscardPile++;
                this.addLog(`📜 ${hero.name} drew ${quest.name} but ${quest.mechanic.generalName} is already defeated — discarded, drawing again...`);
                this.updateDeckCounts();
                return this.drawQuestCard(heroIndex);
            }
        }
        
        hero.questCards.push(quest);
        this.addLog(`📜 ${hero.name} draws a new quest: ${quest.name}`);
        this.updateDeckCounts();
        this.updateActionButtons();
        return quest;
    },
    
    discardQuestCard(heroIndex, questIndex) {
        const hero = this.heroes[heroIndex];
        if (!hero.questCards || questIndex >= hero.questCards.length) return;
        
        const quest = hero.questCards[questIndex];
        if (quest.discarded) return; // Already discarded
        this._retireQuest(hero, quest, 'Discarded');
        this.addLog(`📜 ${hero.name}'s quest "${quest.name}" was discarded.`);
        this.updateDeckCounts();
        this.updateActionButtons();
    },
    
    // Mark a quest as retired (discarded/used/failed) — keeps it in questCards for history display
    _retireQuest(hero, quest, reason) {
        quest.discarded = true;
        quest.discardReason = reason || 'Used';
        this.questDiscardPile++;
        console.log(`[QUEST] Retired "${quest.name}" for ${hero.name} — ${reason}`);
    },
    
    // Show a Quest Detail modal for a specific quest card
    showQuestDetailModal(hero, quest) {
        // Determine heroIndex and questIndex for Use button
        const heroIndex = this.heroes.indexOf(hero);
        const questIndex = hero.questCards ? hero.questCards.indexOf(quest) : -1;
        
        // Determine status
        let statusLabel, statusBg, statusBorder, statusColor;
        if (quest.discarded) {
            const isFailed = quest.failed;
            statusLabel = isFailed ? 'Discarded' : 'Used';
            statusBg = 'rgba(220,38,38,0.15)';
            statusBorder = '#dc2626';
            statusColor = '#b91c1c';
        } else if (quest.completed) {
            statusLabel = 'Completed';
            statusBg = 'rgba(22,163,74,0.15)';
            statusBorder = '#16a34a';
            statusColor = '#15803d';
        } else {
            statusLabel = 'In Progress';
            statusBg = 'rgba(202,138,4,0.15)';
            statusBorder = '#ca8a04';
            statusColor = '#a16207';
        }

        // Progress note for multi-location quests
        let progressHTML = '';
        if (!quest.completed && !quest.discarded && quest.mechanic) {
            const colorEmojis = { red: '🔴', black: '⚫', green: '🟢', blue: '🔵' };
            if (quest.mechanic.type === 'multi_location_visit' && quest.mechanic.locations) {
                progressHTML = '<div style="margin-top:8px;">';
                for (const [loc, data] of Object.entries(quest.mechanic.locations)) {
                    const emoji = colorEmojis[data.color] || '⭕';
                    const check = data.visited ? '✅' : '⬜';
                    const clr = data.visited ? '#15803d' : '#8b7355';
                    progressHTML += `<div style="color:${clr};font-size:0.85em;padding:2px 0;">${emoji} ${loc} ${check}</div>`;
                }
                progressHTML += '</div>';
            }
            if (quest.mechanic.type === 'multi_location_action' && quest.mechanic.locations) {
                progressHTML = '<div style="margin-top:8px;">';
                for (const [loc, data] of Object.entries(quest.mechanic.locations)) {
                    const emoji = colorEmojis[data.color] || '⭕';
                    const check = data.organized ? '✅' : '⬜';
                    const clr = data.organized ? '#15803d' : '#8b7355';
                    progressHTML += `<div style="color:${clr};font-size:0.85em;padding:2px 0;">${emoji} ${loc} ${check}</div>`;
                }
                progressHTML += '</div>';
            }
            if (quest.mechanic.type === 'defeat_all_factions' && quest.mechanic.factionKills) {
                const fk = quest.mechanic.factionKills;
                const req = quest.mechanic.requiredPerFaction;
                const factionInfo = [
                    { color: 'blue', name: 'Dragonkin', emoji: '🔵' },
                    { color: 'green', name: 'Orc', emoji: '🟢' },
                    { color: 'red', name: 'Demon', emoji: '🔴' },
                    { color: 'black', name: 'Undead', emoji: '⚫' }
                ];
                progressHTML = '<div style="margin-top:8px;">';
                factionInfo.forEach(f => {
                    const done = (fk[f.color] || 0) >= req;
                    const check = done ? '✅' : '⬜';
                    const clr = done ? '#15803d' : '#8b7355';
                    progressHTML += `<div style="color:${clr};font-size:0.85em;padding:2px 0;">${f.emoji} ${f.name} ${check}</div>`;
                });
                progressHTML += '</div>';
            }
        }

        // Check if this quest has a usable reward (Use Card button)
        let useButtonHTML = '';
        if (quest.completed && !quest.discarded && quest.mechanic && quest.mechanic.rewardType === 'use_quest_card_anytime' && heroIndex >= 0 && questIndex >= 0) {
            let canUse = true;
            // Exclude context-dependent rewards
            if (quest.mechanic.rewardValue === 'combat_bonus_dice') canUse = false;
            if (quest.mechanic.rewardValue === 'block_general_advance') canUse = false;
            if (quest.mechanic.rewardValue && quest.mechanic.rewardValue.startsWith('block_minion_placement')) canUse = false;
            if (quest.mechanic.rewardValue === 'amarak_ignore_combat_skill') canUse = false;
            // requirePresence check
            if (canUse && quest.mechanic.requirePresence && quest.mechanic.rewardValue === 'remove_taint') {
                canUse = this.taintCrystals[hero.location] && this.taintCrystals[hero.location] > 0;
            }
            
            let contextHint = '';
            if (!canUse && quest.mechanic.rewardValue === 'combat_bonus_dice') {
                contextHint = '<div style="color:#d4af37;font-size:0.75em;margin-top:4px;">⚔️ Used automatically before combat rolls</div>';
            } else if (!canUse && quest.mechanic.rewardValue === 'block_general_advance') {
                contextHint = '<div style="color:#d4af37;font-size:0.75em;margin-top:4px;">🌙 Used during Darkness Spreads phase</div>';
            } else if (!canUse && quest.mechanic.rewardValue && quest.mechanic.rewardValue.startsWith('block_minion_placement')) {
                contextHint = '<div style="color:#d4af37;font-size:0.75em;margin-top:4px;">🌙 Used during Darkness Spreads phase</div>';
            } else if (!canUse && quest.mechanic.rewardValue === 'amarak_ignore_combat_skill') {
                contextHint = '<div style="color:#d4af37;font-size:0.75em;margin-top:4px;">⚔️ Used when attacking a General</div>';
            }
            
            if (canUse) {
                useButtonHTML = `
                    <div style="margin-top:10px;text-align:center;">
                        <button class="btn btn-primary" onclick="game.closeInfoModal(); game.useCompletedQuestCard(${heroIndex}, ${questIndex});"
                            style="padding:8px 20px;background:#4ade80;color:#000;font-weight:bold;">
                            📜 Use Card
                        </button>
                    </div>`;
            } else {
                useButtonHTML = `<div style="text-align:center;">${contextHint}</div>`;
            }
        }

        const contentHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <h2 class="modal-title modal-heading" style="margin:0;font-size:1.2em;">📜 Quest Details</h2>
                <button onclick="game.closeInfoModal()" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;color:#fff;background:rgba(100,100,100,0.9);border:2px solid #666;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);" title="Close">×</button>
            </div>
            <div style="background:linear-gradient(135deg,#f0e6d3 0%,#ddd0b8 50%,#c8bb9f 100%);border:3px solid #8b7355;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.4),inset 0 0 0 1px rgba(139,115,85,0.3);">
                <div style="background:linear-gradient(135deg,#b91c1ccc 0%,#b91c1c99 100%);padding:6px 14px;border-bottom:2px solid #8b7355;text-align:center;">
                    <div class="hero-banner-name">📜 ${quest.name}</div>
                </div>
                <div style="padding:14px;">
                    <div class="modal-desc-text" style="font-size:0.75em;color:#3d2b1f;line-height:1.5;margin-bottom:8px;">${quest.description || ''}</div>
                    ${quest.reward ? `
                    <div style="margin-top:8px;">
                        <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.75em;color:#b91c1c;">Reward:</span>
                        <span class="modal-desc-text" style="font-size:0.75em;color:#3d2b1f;line-height:1.5;"> ${quest.reward}</span>
                    </div>` : ''}
                    ${quest.mechanic && quest.mechanic.failDiscard && !quest.completed && !quest.discarded ? `
                    <div style="margin-top:6px;">
                        <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.7em;color:#ef4444;">Discard if Failed</span>
                    </div>` : ''}
                    ${progressHTML}
                    <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;">
                        <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.75em;padding:2px 8px;border-radius:4px;background:${statusBg};border:1px solid ${statusBorder};color:${statusColor};">${statusLabel}</span>
                    </div>
                    ${useButtonHTML}
                </div>
            </div>
            <div style="text-align:center;margin-top:10px;">
                <button class="btn btn-primary" onclick="game.closeInfoModal()" style="padding:8px 24px;">Close</button>
            </div>
        `;

        this.showInfoModal('📜 Quest Details', contentHTML);
        // Hide the default Continue button since we have our own Close button
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv && defaultBtnDiv.querySelector('.btn-primary')) defaultBtnDiv.style.display = 'none';
    },

    // Build quest cards section for hero detail modal
    _buildHeroQuestSection(hero) {
        const allQuests = hero.questCards || [];
        const legacyCompleted = hero.completedQuests || []; // backwards compat
        
        if (allQuests.length === 0 && legacyCompleted.length === 0) return '';
        
        const active = allQuests.filter(q => !q.completed && !q.discarded);
        const ready = allQuests.filter(q => q.completed && !q.discarded);
        const retired = allQuests.filter(q => q.discarded);
        
        let html = '<div class="cards-section" style="margin-top: 10px;">';
        html += `<div style="font-weight: bold; color: #ffd700; margin-bottom: 8px;">📜 Quests (${active.length + ready.length} active${retired.length + legacyCompleted.length > 0 ? `, ${retired.length + legacyCompleted.length} used` : ''})</div>`;
        
        // Ready-to-use quests (completed, not discarded)
        ready.forEach(q => {
            html += `<div class="card-item" style="border-left: 3px solid #4ade80; padding-left: 8px; margin-bottom: 4px;">
                <span style="color: #4ade80; font-weight: bold;">✅</span> ${q.name}
                <span style="color: #4ade80; font-size: 0.8em;">(ready to use)</span>
            </div>`;
        });
        
        // In-progress quests
        active.forEach(q => {
            let progressNote = '';
            if (q.mechanic?.type === 'multi_location_visit' && q.mechanic.locations) {
                const visited = Object.values(q.mechanic.locations).filter(l => l.visited).length;
                const total = Object.values(q.mechanic.locations).length;
                progressNote = ` <span style="color: #d4af37; font-size: 0.8em;">(${visited}/${total} visited)</span>`;
            } else if (q.mechanic?.type === 'multi_location_action' && q.mechanic.locations) {
                const done = Object.values(q.mechanic.locations).filter(l => l.organized).length;
                const total = Object.values(q.mechanic.locations).length;
                progressNote = ` <span style="color: #d4af37; font-size: 0.8em;">(${done}/${total} organized)</span>`;
            }
            html += `<div class="card-item" style="border-left: 3px solid #ef4444; padding-left: 8px; margin-bottom: 4px;">
                <span style="color: #ef4444; font-weight: bold;">⏳</span> ${q.name}${progressNote}
            </div>`;
        });
        
        // Retired quests (used/discarded/failed)
        retired.forEach(q => {
            const icon = q.failed ? '❌' : '🏆';
            const label = q.failed ? 'Failed' : (q.discardReason || 'Used');
            html += `<div class="card-item" style="border-left: 3px solid #555; padding-left: 8px; margin-bottom: 4px; opacity: 0.6;">
                <span style="color: #888;">${icon}</span> <span style="color: #777;">${q.name}</span>
                <span style="color: #666; font-size: 0.75em; font-style: italic;"> — ${label}</span>
            </div>`;
        });
        
        // Legacy archived quests (from before this system)
        legacyCompleted.forEach(q => {
            html += `<div class="card-item" style="border-left: 3px solid #555; padding-left: 8px; margin-bottom: 4px; opacity: 0.6;">
                <span style="color: #888;">🏆</span> <span style="color: #777;">${q.name}</span>
                <span style="color: #666; font-size: 0.75em; font-style: italic;"> — ${q.useReason}</span>
            </div>`;
        });
        
        html += '</div>';
        return html;
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
            <div class="modal-heading" style="text-align:center;color:#d4af37;font-size:1.15em;margin-bottom:4px">🦄 Unicorn Steed</div>
            ${this._parchmentBoxOpen('📜 Choose Actions')}
                <div style="text-align:center;padding:8px 0;">
                    <div class="modal-desc-text" style="font-size:0.8em;color:#3d2b1f;margin-bottom:8px;">
                        Spend actions to roll dice. Each action = 1 die. Need 5+ on any die to succeed.
                    </div>
                    <div class="modal-desc-text" style="font-size:0.75em;color:#5c4a3a;margin-bottom:8px;">
                        You have ${maxActions} action${maxActions > 1 ? 's' : ''} remaining. Choose how many to spend:
                    </div>
                    ${optionsHTML}
                </div>
            ${this._parchmentBoxClose()}
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
                <div class="modal-heading" style="text-align:center;color:#16a34a;font-size:1.15em;margin-bottom:4px">🦄 Unicorn Steed Tamed!</div>
                ${this._parchmentBoxOpen('📜 Unicorn Steed')}
                    <div style="text-align:center;padding:8px 0;">
                        <div class="modal-desc-text" style="font-size:0.8em;color:#3d2b1f;margin-bottom:8px;">Need 5+ on any die (spent ${actionCount} action${actionCount > 1 ? 's' : ''})</div>
                        ${visionsNote}
                        ${diceHTML}
                        <div style="margin-top:12px;padding:8px;background:rgba(167,139,250,0.15);border:1px solid #a78bfa;border-radius:6px;">
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.8em;color:#7c3aed;">🏆 Reward:</span>
                            <span class="modal-desc-text" style="font-size:0.75em;color:#3d2b1f;"> Permanent Horse Movement + Re-roll all failed dice once per combat</span>
                        </div>
                    </div>
                ${this._parchmentBoxClose()}
            `;
            
            this.showInfoModal('🦄 Quest Complete!', contentHTML, () => {
                this._drawAndShowNewQuest(heroIndex);
            });
        } else {
            this.addLog(`📜 ❌ ${hero.name} failed Unicorn Steed quest (${actionCount} dice, no 5+)`);
            
            const contentHTML = `
                <div class="modal-heading" style="text-align:center;color:#dc2626;font-size:1.15em;margin-bottom:4px">🦄 The Unicorn Escapes!</div>
                ${this._parchmentBoxOpen('📜 Unicorn Steed')}
                    <div style="text-align:center;padding:8px 0;">
                        <div class="modal-desc-text" style="font-size:0.8em;color:#3d2b1f;margin-bottom:8px;">Need 5+ on any die (spent ${actionCount} action${actionCount > 1 ? 's' : ''})</div>
                        ${visionsNote}
                        ${diceHTML}
                        <div class="modal-desc-text" style="color:#d4af37;font-size:0.8em;margin-top:10px;">Quest card stays — try again!</div>
                    </div>
                ${this._parchmentBoxClose()}
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
    _confirmOrganizeAction(hero, quest, questIndex) {
        const m = quest.mechanic;
        const locEntry = m.locations[hero.location];
        if (!locEntry || locEntry.organized) return;
        
        const colorEmojis = { red: '🔴', black: '⚫', green: '🟢', blue: '🔵' };
        const emoji = colorEmojis[locEntry.color] || '⭕';
        const actionCost = m.actionCost || 1;
        
        // Show progress so far
        const progress = Object.entries(m.locations).map(([loc, data]) => {
            const e = colorEmojis[data.color] || '⭕';
            const isCurrent = loc === hero.location;
            const status = data.organized ? '✅' : (isCurrent ? '👉' : '⬜');
            const color = data.organized ? '#16a34a' : (isCurrent ? '#d4af37' : '#5c4a3a');
            return `<div class="modal-desc-text" style="color:${color};font-size:0.8em;margin:3px 0;font-weight:${isCurrent ? 'bold' : 'normal'};">${e} ${loc} ${status}</div>`;
        }).join('');
        
        this.showInfoModal('📜 Organize Militia', `
            <div class="modal-heading" style="text-align:center;color:#d4af37;font-size:1.15em;margin-bottom:4px">🛡️ Organize Militia</div>
            ${this._parchmentBoxOpen('📜 ' + hero.location)}
                <div style="text-align:center;padding:8px 0;">
                    <div class="modal-desc-text" style="font-size:0.85em;color:#3d2b1f;margin-bottom:8px;">Organize locals at ${hero.location}?</div>
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.8em;color:#b91c1c;margin-bottom:12px;">Cost: ${actionCost} Action (${this.actionsRemaining} remaining)</div>
                    <div style="margin-bottom:12px;padding:8px;background:rgba(0,0,0,0.05);border:1px solid rgba(139,115,85,0.3);border-radius:6px;">
                        ${progress}
                    </div>
                    <div style="display:flex;gap:10px;margin-top:10px;">
                        <button class="btn" style="flex:1;background:#666;" onclick="game.closeInfoModal()">Cancel</button>
                        <button class="btn btn-primary" style="flex:1;background:#dc2626;" onclick="game.closeInfoModal(); game._organizeLocationAction(game.heroes[game.currentPlayerIndex], game.heroes[game.currentPlayerIndex].questCards[${questIndex}], ${questIndex})">⚡ Organize (${actionCost} Action)</button>
                    </div>
                </div>
            ${this._parchmentBoxClose()}
        `);
        // Hide the default Continue button
        const defaultBtn = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtn && defaultBtn.querySelector('.btn-primary')) defaultBtn.style.display = 'none';
    },
    
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
                <div class="modal-heading" style="text-align:center;color:#16a34a;font-size:1.15em;margin-bottom:4px">🛡️ Militia Organized!</div>
                ${this._parchmentBoxOpen('📜 Organize Militia')}
                    <div style="text-align:center;padding:8px 0;">
                        <div class="modal-desc-text" style="font-size:0.8em;color:#3d2b1f;margin-bottom:8px;">All locations organized:</div>
                        ${Object.entries(m.locations).map(([loc, data]) => {
                            const e = colorEmojis[data.color] || '⭕';
                            return `<div class="modal-desc-text" style="color:#16a34a;font-size:0.8em;margin:4px 0;">${e} ${loc} ✅</div>`;
                        }).join('')}
                        <div style="margin-top:12px;padding:8px;background:rgba(167,139,250,0.15);border:1px solid #a78bfa;border-radius:6px;">
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.8em;color:#7c3aed;">🏆 Reward:</span>
                            <span class="modal-desc-text" style="font-size:0.75em;color:#3d2b1f;"> Can be discarded to prevent a General from advancing!</span>
                        </div>
                    </div>
                ${this._parchmentBoxClose()}
            `;
            
            this.showInfoModal('📜 Quest Complete!', contentHTML, () => {
                // Draw new quest card on completion
                const heroIndex = this.heroes.indexOf(hero);
                this._drawAndShowNewQuest(heroIndex);
            });
        } else {
            const progress = Object.entries(m.locations).map(([loc, data]) => {
                const e = colorEmojis[data.color] || '⭕';
                const status = data.organized ? '✅' : '⏳';
                return `<div class="modal-desc-text" style="color:${data.organized ? '#16a34a' : '#5c4a3a'};font-size:0.8em;margin:4px 0;">${e} ${loc} ${status}</div>`;
            }).join('');
            
            this.showInfoModal('📜 Militia Organized!', `
                <div class="modal-heading" style="text-align:center;color:#d4af37;font-size:1.15em;margin-bottom:4px">🛡️ Location Organized!</div>
                ${this._parchmentBoxOpen('📜 Organize Militia')}
                    <div style="text-align:center;padding:8px 0;">
                        <div class="modal-desc-text" style="font-size:0.8em;color:#3d2b1f;margin-bottom:8px;">Organized locals at ${hero.location}!</div>
                        ${progress}
                    </div>
                ${this._parchmentBoxClose()}
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
        
        console.log(`[RUMORS] Checking progress for ${hero.name} at ${locationName}, questCards count: ${hero.questCards.length}`);
        
        for (let i = 0; i < hero.questCards.length; i++) {
            const quest = hero.questCards[i];
            if (quest.completed) continue;
            if (quest.discarded) continue;
            if (!quest.mechanic || quest.mechanic.type !== 'multi_location_visit') continue;
            
            console.log(`[RUMORS] Found multi_location_visit quest: ${quest.name}`);
            console.log(`[RUMORS] Quest locations:`, JSON.stringify(quest.mechanic.locations));
            
            const locEntry = quest.mechanic.locations[locationName];
            if (!locEntry) {
                console.log(`[RUMORS] Location "${locationName}" not in quest locations`);
                continue;
            }
            if (locEntry.visited) {
                console.log(`[RUMORS] Location "${locationName}" already visited`);
                continue;
            }
            
            // Mark as visited
            locEntry.visited = true;
            const colorEmojis = { red: '🔴', black: '⚫', green: '🟢', blue: '🔵' };
            const emoji = colorEmojis[locEntry.color] || '⭕';
            this.addLog(`📜 ${hero.name} visits ${locationName} ${emoji} — Rumors quest progress updated!`);
            console.log(`[RUMORS] ✅ Marked ${locationName} as visited!`);
            
            // Check if all visited
            const allVisited = Object.values(quest.mechanic.locations).every(loc => loc.visited);
            console.log(`[RUMORS] All visited?`, allVisited);
            
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
                
                // Retire quest (mark as used, keep in questCards for history) and draw new one
                const heroIndex = this.heroes.indexOf(hero);
                this._retireQuest(hero, quest, 'Reward: Drew 4 Hero Cards');
                
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
            return `<div class="modal-desc-text" style="color:#16a34a;font-size:0.8em;margin:4px 0;">${e} ${loc} ✅</div>`;
        }).join('');
        
        const cardColorMap = { 'red': '#dc2626', 'blue': '#2563eb', 'green': '#16a34a', 'black': '#1f2937' };
        const drawnHTML = drawnCards.map(c => {
            const borderColor = c.special ? '#9333ea' : (cardColorMap[c.color] || '#666');
            return `<span style="color: ${borderColor}; font-weight: bold;">${c.icon || '🎴'} ${c.name}</span>`;
        }).join(', ');
        
        this.showInfoModal('📜 Rumors Complete!', `
            <div class="modal-heading" style="text-align:center;color:#16a34a;font-size:1.15em;margin-bottom:4px">🍺 All Rumors Gathered!</div>
            ${this._parchmentBoxOpen('📜 Rumors')}
                <div style="text-align:center;padding:8px 0;">
                    ${progress}
                    <div style="margin-top:12px;padding:8px;background:rgba(212,175,55,0.15);border:1px solid #d4af37;border-radius:6px;">
                        <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.8em;color:#d4af37;">Drew ${drawnCards.length} Hero Cards:</span>
                        <div class="modal-desc-text" style="font-size:0.8em;color:#3d2b1f;margin-top:6px;">${drawnHTML || 'Deck empty!'}</div>
                    </div>
                </div>
            ${this._parchmentBoxClose()}
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
        return hero.questCards.some(q => q.completed && !q.discarded && q.mechanic && q.mechanic.rewardType === 'unicorn_steed');
    },
    
    // ===== FIND MAGIC GATE: Check for completed combat bonus quest =====
    _findCombatBonusDiceQuest(hero) {
        if (!hero.questCards) return null;
        for (let i = 0; i < hero.questCards.length; i++) {
            const q = hero.questCards[i];
            if (q.completed && !q.discarded && q.mechanic && q.mechanic.rewardType === 'use_quest_card_anytime' && q.mechanic.rewardValue === 'combat_bonus_dice') {
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
                if (q.completed && !q.discarded && q.mechanic && q.mechanic.rewardType === 'use_quest_card_anytime' && q.mechanic.rewardValue === 'block_general_advance') {
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
        
        // Retire quest card (mark as used, keep in questCards for history)
        this._retireQuest(holder.hero, holder.quest, `Blocked ${generalName} from advancing`);
        
        // Store blocked state (reuse strongDefensesActive pattern)
        this.organizeMilitiaActive = true;
        
        this.addLog(`📜 🛡️ ${holder.hero.name} uses Organize Militia — prevents ${generalName} from advancing!`);
        
        this.closeInfoModal();
        this.renderHeroes();
        this.updateDeckCounts();
        
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
    
    // ===== RAIDS QUEST: Skip Darkness =====
    
    _confirmRaidsSkip(heroIndex, questIndex) {
        const hero = this.heroes[heroIndex];
        const quest = hero.questCards[questIndex];
        if (!quest || !quest.completed || quest.discarded) return;
        
        // Set the flag for darkness phase to check
        this.raidsSkipDarkness = true;
        this._raidsSkipQuestName = quest.name;
        this._raidsSkipHeroName = hero.name;
        this._raidsSkipHeroSymbol = hero.symbol;
        
        // Retire the quest card
        this._retireQuest(hero, quest, 'Skipped Darkness Spreads');
        this.updateDeckCounts();
        
        this.addLog(`📜 ${hero.name} uses ${quest.name} — Darkness Spreads cards will be skipped this turn!`);
        
        this.renderHeroes();
        this.updateActionButtons();
        
        this.showInfoModal('📜 Raids Activated!', `
            <div style="text-align:center;">
                <div style="font-size:2em;margin-bottom:10px;">⚔️</div>
                <div style="color:#4ade80;font-weight:bold;font-size:1.1em;margin-bottom:10px;">Darkness Spreads Skipped!</div>
                <div style="color:#999;font-size:0.9em;">All Darkness Spreads cards will be skipped at the end of ${hero.name}'s turn.</div>
                <div style="color:#d4af37;margin-top:10px;font-size:0.9em;">Quest card discarded.</div>
            </div>
        `);
    },
    
    // ===== KING OF THE GRYPHONS: Move 2 Heroes =====
    
    _startGryphonMoveHeroes(heroIndex, questIndex) {
        const hero = this.heroes[heroIndex];
        const quest = hero.questCards[questIndex];
        
        this._gryphonState = {
            heroIndex,
            questIndex,
            quest,
            questHeroName: hero.name,
            movesTotal: 2,
            movesRemaining: 2,
            results: [] // { heroName, heroSymbol, from, to }
        };
        
        this._gryphonShowHeroPicker();
    },
    
    _gryphonShowHeroPicker() {
        const state = this._gryphonState;
        if (!state) return;
        
        state._selectedHero = null;
        
        let heroesHTML = '<div style="display: flex; flex-direction: column; gap: 10px;">';
        this.heroes.forEach((hero, i) => {
            if (hero.health <= 0) return;
            heroesHTML += `
                <div id="gryph-hero-${i}" onclick="game._gryphonSelectHero(${i})"
                     style="border: 3px solid ${hero.color}; cursor: pointer; padding: 12px; border-radius: 8px; background: rgba(0,0,0,0.3); transition: all 0.2s; display: flex; align-items: center; gap: 12px;"
                     onmouseover="if(!this.classList.contains('gryph-selected')) this.style.background='rgba(255,255,255,0.1)'"
                     onmouseout="if(!this.classList.contains('gryph-selected')) this.style.background='rgba(0,0,0,0.3)'">
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
        
        const moveNum = state.movesTotal - state.movesRemaining + 1;
        const contentHTML = `
            <div style="color: #d4af37; margin-bottom: 12px;">
                Using: <strong style="color: #ef4444;">📜 ${state.quest.name}</strong>
            </div>
            <div style="color: #a78bfa; margin-bottom: 10px;">Select hero ${moveNum} of ${state.movesTotal} to move:</div>
            ${heroesHTML}
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn" style="flex: 1; background: #666;" onclick="game._gryphonFinishEarly()">
                    ${state.results.length > 0 ? 'Finish' : 'Cancel'}
                </button>
                <button id="gryph-confirm-btn" class="btn" style="flex: 1; opacity: 0.5; cursor: not-allowed; background: #666;" disabled onclick="game._gryphonConfirmHero()">Confirm Hero</button>
            </div>
        `;
        
        this.showInfoModal('📜 ' + state.quest.name, contentHTML);
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv && !defaultBtnDiv.querySelector('#gryph-confirm-btn')) defaultBtnDiv.style.display = 'none';
    },
    
    _gryphonSelectHero(heroIdx) {
        const state = this._gryphonState;
        if (!state) return;
        
        state._selectedHero = heroIdx;
        
        // Clear all selections
        this.heroes.forEach((h, i) => {
            const el = document.getElementById(`gryph-hero-${i}`);
            if (el) {
                el.classList.remove('gryph-selected');
                el.style.background = 'rgba(0,0,0,0.3)';
                el.style.borderColor = h.color;
            }
        });
        
        // Highlight selected
        const selected = document.getElementById(`gryph-hero-${heroIdx}`);
        if (selected) {
            selected.classList.add('gryph-selected');
            selected.style.background = 'rgba(255,215,0,0.2)';
            selected.style.borderColor = '#d4af37';
        }
        
        // Enable confirm button
        const btn = document.getElementById('gryph-confirm-btn');
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.style.background = '';
            btn.className = 'btn btn-primary';
        }
    },
    
    _gryphonConfirmHero() {
        const state = this._gryphonState;
        if (!state || state._selectedHero == null) return;
        
        const targetHeroIndex = state._selectedHero;
        const targetHero = this.heroes[targetHeroIndex];
        
        // Store for click handler
        state._currentTargetHeroIndex = targetHeroIndex;
        
        this.closeInfoModal();
        
        // All locations except target hero's current location
        const allLocations = [];
        for (let [locName] of Object.entries(this.locationCoords)) {
            if (locName !== targetHero.location) {
                allLocations.push(locName);
            }
        }
        
        // Open map if not already open
        const mapModal = document.getElementById('map-modal');
        if (!mapModal.classList.contains('active')) {
            mapModal.classList.add('active');
            this.updateMapStatus();
            this.updateMovementButtons();
            this.updateActionButtons();
        }
        
        // Set movement state
        this.activeMovement = {
            cardIndex: -1,
            movementType: 'King of the Gryphons',
            maxMoves: 1,
            movesRemaining: 1,
            startLocation: targetHero.location,
            cardUsed: null,
            validDestinations: allLocations,
            isGryphonMove: true
        };
        
        // Disable map dragging
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'default';
            boardContainer.style.pointerEvents = 'none';
        }
        const svg = document.getElementById('game-map');
        if (svg) svg.style.pointerEvents = 'auto';
        
        this.showMovementIndicator();
        this.highlightMagicGateLocations(allLocations);
        
        // Update indicator text
        const indicator = document.getElementById('movement-indicator');
        if (indicator) {
            indicator.innerHTML = `<span style="color: #ffd700;">📜 ${state.quest.name}</span> — Select destination for ${targetHero.symbol} ${targetHero.name}<br><span style="font-size: 0.85em;">Move ${state.movesTotal - state.movesRemaining + 1} of ${state.movesTotal}</span>`;
        }
    },
    
    _gryphonLocationSelected(locationName) {
        const state = this._gryphonState;
        if (!state) return;
        
        const targetHeroIndex = state._currentTargetHeroIndex;
        const targetHero = this.heroes[targetHeroIndex];
        const oldLocation = targetHero.location;
        
        // Move the hero
        targetHero.location = locationName;
        state.movesRemaining--;
        
        state.results.push({
            heroName: targetHero.name,
            heroSymbol: targetHero.symbol,
            from: oldLocation,
            to: locationName
        });
        
        this.addLog(`📜 ${state.quest.name}: ${targetHero.name} moved from ${oldLocation} to ${locationName}`);
        
        // Clean up movement state
        this.activeMovement = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'grab';
            boardContainer.style.pointerEvents = 'auto';
        }
        
        // Update display
        this.renderTokens();
        this.renderHeroes();
        this.updateMapStatus();
        this.updateMovementButtons();
        this.updateActionButtons();
        
        // If moves remain, show hero picker again
        if (state.movesRemaining > 0) {
            this._gryphonShowHeroPicker();
        } else {
            this._finishGryphonMove();
        }
    },
    
    _gryphonFinishEarly() {
        const state = this._gryphonState;
        if (!state) return;
        
        this.closeInfoModal();
        
        if (state.results.length === 0) {
            // Cancel — no moves made, don't consume quest
            this._gryphonState = null;
            return;
        }
        
        this._finishGryphonMove();
    },
    
    _finishGryphonMove() {
        const state = this._gryphonState;
        if (!state) return;
        
        // Clean up
        this.activeMovement = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'grab';
            boardContainer.style.pointerEvents = 'auto';
        }
        
        // Retire the quest card
        const hero = this.heroes[state.heroIndex];
        const quest = state.quest;
        this._retireQuest(hero, quest, 'Gryphon King moved heroes');
        this.updateDeckCounts();
        
        // Build results
        let resultsHTML = '';
        state.results.forEach(r => {
            resultsHTML += `<div style="margin:6px 0;padding:8px;background:rgba(22,163,74,0.15);border:1px solid #16a34a;border-radius:6px;">
                <strong style="color:#d4af37;">${r.heroSymbol} ${r.heroName}</strong>
                <span style="color:#999;"> moved from </span>
                <span style="color:#ef4444;">${r.from}</span>
                <span style="color:#999;"> → </span>
                <span style="color:#4ade80;">${r.to}</span>
            </div>`;
        });
        
        const unused = state.movesRemaining;
        this.addLog(`📜 ${state.quest.name}: ${state.results.length} hero${state.results.length !== 1 ? 'es' : ''} moved! (No action used)`);
        
        this.renderMap();
        this.renderTokens();
        this.renderHeroes();
        this.updateGameStatus();
        this.updateMovementButtons();
        this.updateActionButtons();
        
        const heroIndex = state.heroIndex;
        this._gryphonState = null;
        
        this.showInfoModal('📜 King of the Gryphons — Complete!', `
            <div style="text-align:center;">
                <div style="font-size:2em;margin-bottom:10px;">🦅</div>
                <div style="color:#16a34a;font-size:1.1em;font-weight:bold;margin-bottom:10px;">
                    ${state.results.length} hero${state.results.length !== 1 ? 'es' : ''} moved!
                </div>
                ${resultsHTML}
                ${unused > 0 ? `<div style="color:#999;font-size:0.85em;margin-top:8px;">${unused} move${unused !== 1 ? 's' : ''} unused</div>` : ''}
                <div style="color:#d4af37;margin-top:10px;font-size:0.9em;">Quest card discarded — No action used</div>
            </div>
        `);
    },
    
    // ===== AMAZON ENVOY QUEST: Sweep Picker =====
    
    _getLocationsWithinSteps(origin, maxSteps) {
        // BFS using actual board connections (locationConnections adjacency graph)
        const visited = new Set();
        const queue = [{ location: origin, distance: 0 }];
        const results = [];
        
        while (queue.length > 0) {
            const { location, distance } = queue.shift();
            if (visited.has(location)) continue;
            visited.add(location);
            
            if (distance > 0 && distance <= maxSteps) {
                results.push(location);
            }
            
            if (distance < maxSteps) {
                const neighbors = this.locationConnections[location] || [];
                neighbors.forEach(n => {
                    if (!visited.has(n)) {
                        queue.push({ location: n, distance: distance + 1 });
                    }
                });
            }
        }
        return results;
    },
    
    _getAmazonEnvoyValidLocations() {
        const state = this._amazonEnvoyState;
        if (!state) return [];
        
        const locationsInRange = this._getLocationsWithinSteps(state.originLocation, 2);
        // Include origin itself
        locationsInRange.push(state.originLocation);
        
        // Filter to only locations that still have minions (removals already applied)
        return locationsInRange.filter(loc => {
            const m = this.minions[loc];
            if (!m) return false;
            return Object.values(m).reduce((a, b) => a + b, 0) > 0;
        });
    },
    
    _startAmazonEnvoyHighlight() {
        const state = this._amazonEnvoyState;
        if (!state) return;
        
        const validLocations = this._getAmazonEnvoyValidLocations();
        
        // If no valid targets remain or no kills left, finish
        if (validLocations.length === 0 || state.remaining <= 0) {
            this._finishAmazonEnvoy();
            return;
        }
        
        // Set movement state for click handling
        const currentHero = this.heroes[this.currentPlayerIndex];
        this.activeMovement = {
            cardIndex: -1,
            movementType: 'Amazon Envoy',
            maxMoves: state.remaining,
            movesRemaining: state.remaining,
            startLocation: currentHero.location,
            cardUsed: null,
            validDestinations: validLocations,
            isAmazonEnvoy: true
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
        this.highlightMagicGateLocations(validLocations);
    },
    
    _amazonEnvoyShowPicker(locationName) {
        const state = this._amazonEnvoyState;
        if (!state) return;
        
        state.currentLocation = locationName;
        
        const minionsObj = this.minions[locationName];
        const remaining = state.remaining;
        const factionNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
        const factionColors = { green: '#16a34a', black: '#6b7280', red: '#ef4444', blue: '#3b82f6' };
        const factionIcons = { green: '🪓', black: '💀', red: '🔥', blue: '🐉' };
        
        // Calculate already-picked minions at this location (from previous visits)
        const pendingForLoc = {};
        state.results.filter(r => r.location === locationName).forEach(r => {
            pendingForLoc[r.color] = (pendingForLoc[r.color] || 0) + 1;
        });
        
        this._aeSelected = new Set();
        
        let minionId = 0;
        let listHTML = '<div id="ae-minion-list" style="max-height: 280px; overflow-y: auto; padding-right: 5px;">';
        
        const factionOrder = ['green', 'red', 'black', 'blue'];
        factionOrder.forEach(color => {
            const totalCount = (minionsObj && minionsObj[color]) || 0;
            const alreadyPicked = pendingForLoc[color] || 0;
            const availableCount = Math.max(0, totalCount - alreadyPicked);
            if (availableCount === 0) return;
            const fname = factionNames[color];
            const fcolor = factionColors[color];
            const ficon = factionIcons[color];
            
            for (let i = 0; i < availableCount; i++) {
                const id = `ae-m-${minionId}`;
                listHTML += `
                    <div id="${id}" data-color="${color}" data-mid="${minionId}"
                         onclick="game._amazonEnvoyToggle(${minionId})"
                         style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; margin: 3px 0; border: 2px solid ${fcolor}; border-radius: 6px; cursor: pointer; background: rgba(0,0,0,0.3); transition: all 0.15s;"
                         onmouseover="if(!this.classList.contains('ae-sel')) this.style.background='rgba(255,255,255,0.08)'"
                         onmouseout="if(!this.classList.contains('ae-sel')) this.style.background='rgba(0,0,0,0.3)'">
                        <span style="font-size: 1.3em;">${ficon}</span>
                        <span style="flex: 1; color: ${fcolor}; font-weight: bold;">${fname} Minion</span>
                        <span id="${id}-check" style="font-size: 1.2em; opacity: 0.3;">☐</span>
                    </div>
                `;
                minionId++;
            }
        });
        
        listHTML += '</div>';
        
        const contentHTML = `
            <div style="text-align: center; margin-bottom: 10px;">
                <div style="font-size: 1.5em; margin-bottom: 3px;">⚔️</div>
                <div style="color: #ffd700; font-weight: bold; font-size: 1.05em;">📍 ${locationName}</div>
                <div style="color: #d4af37; margin-top: 4px; font-size: 0.9em;">Select minions to defeat at this location.</div>
                <div id="ae-budget-display" style="color: #4ade80; font-weight: bold; margin-top: 6px;">Remaining: ${remaining} / ${state.sweepRoll} — Selected: 0 at this location</div>
            </div>
            ${listHTML}
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn" style="flex: 1; background: #666;" onclick="game._amazonEnvoyFinishEarly()">Finish</button>
                <button id="ae-confirm-btn" class="btn btn-primary" style="flex: 1;" onclick="game._amazonEnvoyConfirmLocation()">Skip Location</button>
            </div>
        `;
        
        this.showInfoModal('⚔️ ' + state.questName, contentHTML);
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv && !defaultBtnDiv.querySelector('#ae-confirm-btn')) defaultBtnDiv.style.display = 'none';
    },
    
    _amazonEnvoyToggle(minionId) {
        const state = this._amazonEnvoyState;
        if (!state) return;
        
        const el = document.getElementById(`ae-m-${minionId}`);
        const check = document.getElementById(`ae-m-${minionId}-check`);
        if (!el) return;
        
        const remaining = state.remaining;
        
        if (this._aeSelected.has(minionId)) {
            // Deselect
            this._aeSelected.delete(minionId);
            el.classList.remove('ae-sel');
            el.style.background = 'rgba(0,0,0,0.3)';
            if (check) { check.textContent = '☐'; check.style.opacity = '0.3'; check.style.color = ''; }
        } else {
            // Check total limit
            if (this._aeSelected.size >= remaining) return;
            this._aeSelected.add(minionId);
            el.classList.add('ae-sel');
            el.style.background = 'rgba(255,215,0,0.2)';
            if (check) { check.textContent = '☑'; check.style.opacity = '1'; check.style.color = '#4ade80'; }
        }
        
        // Update budget display
        const display = document.getElementById('ae-budget-display');
        if (display) display.textContent = `Remaining: ${remaining - this._aeSelected.size} / ${state.sweepRoll} — Selected: ${this._aeSelected.size} at this location`;
        
        // Update confirm button
        const btn = document.getElementById('ae-confirm-btn');
        if (btn) {
            btn.textContent = this._aeSelected.size > 0 ? `Confirm (${this._aeSelected.size})` : 'Skip Location';
        }
        
        // Update affordability of unselected
        document.querySelectorAll('#ae-minion-list > div').forEach(div => {
            const mid = parseInt(div.getAttribute('data-mid'));
            if (this._aeSelected.has(mid)) return;
            const canSelect = this._aeSelected.size < remaining;
            div.style.opacity = canSelect ? '1' : '0.4';
            div.style.cursor = canSelect ? 'pointer' : 'not-allowed';
        });
    },
    
    _amazonEnvoyConfirmLocation() {
        const state = this._amazonEnvoyState;
        if (!state) return;
        
        const locationName = state.currentLocation;
        const factionNames = { red: 'Demons', green: 'Orcs', blue: 'Dragonkin', black: 'Undead' };
        
        // Collect selected minions by color
        const colorCounts = {};
        this._aeSelected.forEach(mid => {
            const el = document.getElementById(`ae-m-${mid}`);
            if (!el) return;
            const color = el.getAttribute('data-color');
            colorCounts[color] = (colorCounts[color] || 0) + 1;
        });
        
        // Apply removals immediately and record results
        for (const [color, count] of Object.entries(colorCounts)) {
            if (this.minions[locationName]) {
                this.minions[locationName][color] = Math.max(0, (this.minions[locationName][color] || 0) - count);
            }
            state.remaining -= count;
            
            // Track for faction hunter quest progress
            this._trackQuestMinionDefeatsRaw(color, count);
            
            const fName = factionNames[color] || color;
            for (let i = 0; i < count; i++) {
                state.results.push({ location: locationName, color, faction: fName });
            }
            
            this.addLog(`⚔️ ${state.questName}: Defeated ${count} ${fName} at ${locationName}`);
        }
        
        this.closeInfoModal();
        
        // Update map
        this.renderMap();
        this.renderTokens();
        this.renderHeroes();
        this.updateGameStatus();
        
        // Clean up movement highlights
        this.activeMovement = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        // Check if budget exhausted
        if (state.remaining <= 0) {
            this._finishAmazonEnvoy();
            return;
        }
        
        // Re-highlight locations that still have minions
        const validLocations = this._getAmazonEnvoyValidLocations();
        if (validLocations.length === 0) {
            this._finishAmazonEnvoy();
            return;
        }
        
        this._startAmazonEnvoyHighlight();
    },
    
    _amazonEnvoyFinishEarly() {
        const state = this._amazonEnvoyState;
        if (!state) return;
        
        const locationName = state.currentLocation;
        const factionNames = { red: 'Demons', green: 'Orcs', blue: 'Dragonkin', black: 'Undead' };
        
        // Record any current selections before finishing
        if (this._aeSelected && this._aeSelected.size > 0) {
            const colorCounts = {};
            this._aeSelected.forEach(mid => {
                const el = document.getElementById(`ae-m-${mid}`);
                if (!el) return;
                const color = el.getAttribute('data-color');
                colorCounts[color] = (colorCounts[color] || 0) + 1;
            });
            for (const [color, count] of Object.entries(colorCounts)) {
                if (this.minions[locationName]) {
                    this.minions[locationName][color] = Math.max(0, (this.minions[locationName][color] || 0) - count);
                }
                state.remaining -= count;
                this._trackQuestMinionDefeatsRaw(color, count);
                const fName = factionNames[color] || color;
                for (let i = 0; i < count; i++) {
                    state.results.push({ location: locationName, color, faction: fName });
                }
                this.addLog(`⚔️ ${state.questName}: Defeated ${count} ${fName} at ${locationName}`);
            }
        }
        
        this.closeInfoModal();
        this.activeMovement = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        this._finishAmazonEnvoy();
    },
    
    _amazonEnvoyBackToMap() {
        // Skip Location without selecting — same as confirm with nothing selected
        this.closeInfoModal();
        this.activeMovement = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        this._startAmazonEnvoyHighlight();
    },
    
    _finishAmazonEnvoy() {
        const state = this._amazonEnvoyState;
        if (!state) return;
        
        // Clean up movement state
        this.activeMovement = null;
        this._amazonEnvoyState = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        // Re-enable map dragging
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'grab';
            boardContainer.style.pointerEvents = 'auto';
        }
        
        // Build results summary (removals already applied in _amazonEnvoyConfirmLocation)
        const totalDefeated = state.results.length;
        let resultsHTML = '';
        if (totalDefeated === 0) {
            resultsHTML = '<div style="color:#999;">No minions were defeated.</div>';
        } else {
            // Group by location
            const byLoc = {};
            state.results.forEach(r => {
                if (!byLoc[r.location]) byLoc[r.location] = {};
                byLoc[r.location][r.faction] = (byLoc[r.location][r.faction] || 0) + 1;
            });
            
            for (const [loc, factions] of Object.entries(byLoc)) {
                const details = Object.entries(factions).map(([fname, count]) => `${count} ${fname}`).join(', ');
                resultsHTML += `<div style="margin:6px 0;padding:8px;background:rgba(22,163,74,0.15);border:1px solid #16a34a;border-radius:6px;">
                    <strong style="color:#16a34a;">${loc}</strong> — ${details}
                </div>`;
            }
        }
        
        const unused = state.sweepRoll - totalDefeated;
        this.addLog(`⚔️ ${state.questName}: ${state.heroName} deployed warriors — ${totalDefeated} minion${totalDefeated !== 1 ? 's' : ''} defeated!`);
        
        // Update everything
        this.renderMap();
        this.renderTokens();
        this.renderHeroes();
        this.updateGameStatus();
        this.updateMovementButtons();
        this.updateActionButtons();
        
        const heroIndex = state.heroIndex;
        this.showInfoModal('⚔️ ' + state.questName + ' — Complete!', `
            <div style="text-align:center;">
                <div style="font-size:2em;margin-bottom:10px;">⚔️</div>
                <div style="color:#16a34a;font-size:1.1em;font-weight:bold;margin-bottom:10px;">
                    ${totalDefeated} minion${totalDefeated !== 1 ? 's' : ''} defeated!
                </div>
                ${resultsHTML}
                ${unused > 0 ? `<div style="color:#999;font-size:0.85em;margin-top:8px;">${unused} warrior${unused !== 1 ? 's' : ''} unused (no more targets in range)</div>` : ''}
                <div style="color:#d4af37;margin-top:10px;font-size:0.9em;">Rolled ${state.sweepRoll} on D6</div>
            </div>
        `, () => {
            // Draw new quest after sweep completes
            this._drawAndShowNewQuest(heroIndex);
        });
    },
    
    // ===== SCOUT THE GENERAL QUEST =====
    // Auto-complete: spend 1 action at the general's location, search deck for matching card
    _executeScoutGeneral(hero, quest, questIndex) {
        const m = quest.mechanic;
        const heroIndex = this.currentPlayerIndex;
        const targetColor = m.faction;
        const generalName = m.generalName;
        const factionNames = { red: 'Red', green: 'Green', blue: 'Blue', black: 'Black' };
        const colorName = factionNames[targetColor] || targetColor;
        
        // Spend action
        this.actionsRemaining -= (m.actionCost || 1);
        this.addLog(`📜 ${hero.name} spends 1 action scouting ${generalName}'s forces`);
        
        // Search deck for first card matching target color
        let foundCard = null;
        let foundIndex = -1;
        if (this.heroDeck && this.heroDeck.length > 0) {
            // Search from top of deck (end of array) to bottom
            for (let i = this.heroDeck.length - 1; i >= 0; i--) {
                if (this.heroDeck[i].color === targetColor) {
                    foundCard = this.heroDeck[i];
                    foundIndex = i;
                    break;
                }
            }
        }
        
        let cardDrawHTML = '';
        if (foundCard) {
            // Remove card from deck and add to hand
            this.heroDeck.splice(foundIndex, 1);
            hero.cards.push(foundCard);
            
            // Shuffle remaining deck (Fisher-Yates)
            for (let i = this.heroDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.heroDeck[i], this.heroDeck[j]] = [this.heroDeck[j], this.heroDeck[i]];
            }
            
            const cardColorMap = { red: '#dc2626', green: '#16a34a', blue: '#3b82f6', black: '#6b7280' };
            const borderColor = cardColorMap[foundCard.color] || '#8B7355';
            
            cardDrawHTML = `
                <div style="margin-top:12px;padding:10px;background:rgba(212,175,55,0.1);border:2px solid #d4af37;border-radius:8px;">
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#d4af37;font-size:0.9em;margin-bottom:8px;text-align:center;">Card Found!</div>
                    <div style="display:flex;justify-content:center;">
                        <div style="padding:8px 16px;background:rgba(0,0,0,0.3);border:3px solid ${borderColor};border-radius:8px;text-align:center;">
                            <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:${borderColor};font-size:1em;">${foundCard.name}</div>
                            ${foundCard.special ? '<div style="color:#9333ea;font-size:0.8em;">Special Card</div>' : ''}
                        </div>
                    </div>
                    <div style="color:#8b7355;font-size:0.8em;text-align:center;margin-top:6px;">Hero deck reshuffled (${this.heroDeck.length} cards)</div>
                </div>`;
            
            this.addLog(`📜 ✅ ${hero.name} found ${foundCard.name} (${colorName}) while scouting ${generalName}! Deck reshuffled.`);
        } else {
            // No matching card found — still complete quest, just no card drawn
            // Shuffle deck anyway per quest rules
            if (this.heroDeck) {
                for (let i = this.heroDeck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [this.heroDeck[i], this.heroDeck[j]] = [this.heroDeck[j], this.heroDeck[i]];
                }
            }
            
            cardDrawHTML = `
                <div style="margin-top:12px;padding:10px;background:rgba(239,68,68,0.1);border:2px solid #ef4444;border-radius:8px;text-align:center;">
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#ef4444;font-size:0.9em;">No ${colorName} Cards in Deck</div>
                    <div style="color:#8b7355;font-size:0.8em;margin-top:4px;">Hero deck reshuffled</div>
                </div>`;
            
            this.addLog(`📜 ✅ ${hero.name} scouted ${generalName} but found no ${colorName} cards. Deck reshuffled.`);
        }
        
        // Mark quest complete
        quest.completed = true;
        this._retireQuest(hero, quest, `Scouted ${generalName}`);
        this.updateDeckCounts();
        
        const generalEmojis = { red: '😈', green: '👺', blue: '🐉', black: '💀' };
        const emoji = generalEmojis[targetColor] || '🔍';
        
        this.showInfoModal('📜 Quest Complete!', `
            <div class="modal-heading" style="text-align:center;color:#16a34a;font-size:1.15em;margin-bottom:4px">${emoji} ${quest.name} Complete!</div>
            ${this._parchmentBoxOpen('📜 Scout the General')}
                <div style="text-align:center;padding:8px 0;">
                    <div class="modal-desc-text" style="font-size:0.8em;color:#d4af37;margin-bottom:8px;">Scouted ${generalName}'s forces at ${hero.location}</div>
                    ${cardDrawHTML}
                </div>
            ${this._parchmentBoxClose()}
        `, () => {
            this._drawAndShowNewQuest(heroIndex);
        });
        
        this.updateGameStatus();
        this.updateActionButtons();
        this.renderHeroes();
        
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            this.updateMapStatus();
            this.updateMovementButtons();
            this.updateActionButtons();
        }
    },
    
    // ===== DEFEAT FACTION MINIONS QUEST TRACKING =====
    // Called after minion combat results are applied (colorResults format)
    _trackQuestMinionDefeats(colorResults) {
        for (let i = 0; i < this.heroes.length; i++) {
            const hero = this.heroes[i];
            if (!hero.questCards) continue;
            hero.questCards.forEach(quest => {
                if (quest.completed || quest.discarded) return;
                if (!quest.mechanic) return;
                
                // Single-faction hunter quests
                if (quest.mechanic.type === 'defeat_faction_minions') {
                const faction = quest.mechanic.faction;
                const killed = colorResults.reduce((sum, cr) => {
                    return sum + (cr.color === faction ? cr.defeated : 0);
                }, 0);
                
                if (killed > 0) {
                    quest.mechanic.currentKills = Math.min(
                        (quest.mechanic.currentKills || 0) + killed,
                        quest.mechanic.requiredKills
                    );
                    const factionDisplayNames = { red: 'Demon', green: 'Orc', blue: 'Dragonkin', black: 'Undead' };
                    const factionDisplayPlurals = { red: 'Demons', green: 'Orcs', blue: 'Dragonkin', black: 'Undead' };
                    const factionSingular = factionDisplayNames[faction] || faction;
                    const factionPlural = factionDisplayPlurals[faction] || faction;
                    this.addLog(`📜 ${quest.name}: ${hero.name} defeated ${killed} ${killed !== 1 ? factionPlural : factionSingular}! (${quest.mechanic.currentKills}/${quest.mechanic.requiredKills})`);
                    
                    if (quest.mechanic.currentKills >= quest.mechanic.requiredKills && !quest.completed) {
                        quest.completed = true;
                        this.addLog(`📜 ✅ ${hero.name} completed quest: ${quest.name}!`);
                        const heroIndex = i;
                        // Show completion modal, then draw new quest
                        setTimeout(() => {
                            this.showInfoModal('📜 Quest Complete!', `
                                <div class="modal-heading" style="text-align:center;color:#16a34a;font-size:1.15em;margin-bottom:4px">🏹 ${quest.name} Complete!</div>
                                ${this._parchmentBoxOpen('📜 ' + quest.name)}
                                    <div style="text-align:center;padding:8px 0;">
                                        <div class="modal-desc-text" style="font-size:0.8em;color:#d4af37;margin-bottom:8px;">${quest.mechanic.requiredKills} ${factionPlural} defeated!</div>
                                        <div style="margin-top:12px;padding:8px;background:rgba(167,139,250,0.15);border:1px solid #a78bfa;border-radius:6px;">
                                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.8em;color:#7c3aed;">🏆 Reward:</span>
                                            <span class="modal-desc-text" style="font-size:0.75em;color:#3d2b1f;"> ${quest.reward}</span>
                                        </div>
                                    </div>
                                ${this._parchmentBoxClose()}
                            `, () => {
                                this._drawAndShowNewQuest(heroIndex);
                            });
                        }, 600);
                    }
                    
                    this.renderHeroes();
                    this.updateActionButtons();
                }
                }
                
                // All-factions quest (Raids)
                if (quest.mechanic.type === 'defeat_all_factions') {
                    const fk = quest.mechanic.factionKills;
                    const req = quest.mechanic.requiredPerFaction;
                    let anyProgress = false;
                    
                    colorResults.forEach(cr => {
                        if (cr.defeated > 0 && fk[cr.color] !== undefined && fk[cr.color] < req) {
                            fk[cr.color] = Math.min(fk[cr.color] + cr.defeated, req);
                            anyProgress = true;
                        }
                    });
                    
                    if (anyProgress) {
                        const done = Object.values(fk).filter(v => v >= req).length;
                        this.addLog(`📜 ${quest.name}: ${hero.name} — ${done}/4 factions defeated`);
                        
                        if (done >= 4 && !quest.completed) {
                            quest.completed = true;
                            this.addLog(`📜 ✅ ${hero.name} completed quest: ${quest.name}!`);
                            const heroIndex = i;
                            setTimeout(() => {
                                this.showInfoModal('📜 Quest Complete!', `
                                    <div class="modal-heading" style="text-align:center;color:#16a34a;font-size:1.15em;margin-bottom:4px">⚔️ ${quest.name} Complete!</div>
                                    ${this._parchmentBoxOpen('📜 ' + quest.name)}
                                        <div style="text-align:center;padding:8px 0;">
                                            <div class="modal-desc-text" style="font-size:0.8em;color:#d4af37;margin-bottom:8px;">All 4 faction minions defeated!</div>
                                            <div style="margin-top:12px;padding:8px;background:rgba(167,139,250,0.15);border:1px solid #a78bfa;border-radius:6px;">
                                                <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.8em;color:#7c3aed;">🏆 Reward:</span>
                                                <span class="modal-desc-text" style="font-size:0.75em;color:#3d2b1f;"> ${quest.reward}</span>
                                            </div>
                                        </div>
                                    ${this._parchmentBoxClose()}
                                `, () => {
                                    this._drawAndShowNewQuest(heroIndex);
                                });
                            }, 600);
                        }
                        
                        this.renderHeroes();
                        this.updateActionButtons();
                    }
                }
            });
        }
    },
    
    // Called from non-standard kill paths (e.g. Elven Archers) with raw faction + count
    _trackQuestMinionDefeatsRaw(faction, count) {
        if (count <= 0) return;
        this._trackQuestMinionDefeats([{ color: faction, defeated: count, rolls: [] }]);
    },
    
    // Find any hero with a completed faction hunter quest matching the given color
    _findFactionHunterQuestCard(faction) {
        for (let i = 0; i < this.heroes.length; i++) {
            const hero = this.heroes[i];
            if (!hero.questCards || hero.health <= 0) continue;
            for (let j = 0; j < hero.questCards.length; j++) {
                const q = hero.questCards[j];
                if (q.completed && !q.discarded && q.mechanic
                    && q.mechanic.rewardType === 'use_quest_card_anytime'
                    && q.mechanic.rewardValue === `block_minion_placement_${faction}`) {
                    return { hero, heroIndex: i, questIndex: j, quest: q };
                }
            }
        }
        return null;
    },
    
    // Confirm use of a faction hunter quest to block minion placement
    _factionHunterBlockConfirm(slot) {
        const card = this.darknessCurrentCard;
        const slotFaction = slot === 1 ? card.faction1 : card.faction2;
        const holder = this._findFactionHunterQuestCard(slotFaction);
        if (!holder) return;
        
        const slotLocation = slot === 1 ? card.location1 : card.location2;
        const factionNames = { red: 'Demons', green: 'Orcs', blue: 'Dragonkin', black: 'Undead' };
        const factionName = factionNames[slotFaction] || slotFaction;
        
        // Retire quest card
        this._retireQuest(holder.hero, holder.quest, `Blocked ${factionName} placement at ${slotLocation}`);
        
        // Store blocked state
        this.factionHunterBlockedSlot = slot;
        this._factionHunterUsedQuestName = holder.quest.name;
        
        this.addLog(`📜 🏹 ${holder.hero.name} uses ${holder.quest.name} — prevents ${factionName} placement at ${slotLocation}!`);
        
        this.closeInfoModal();
        this.renderHeroes();
        this.updateDeckCounts();
        
        // Re-render the preview with blocked placement shown
        const cardNum = this.darknessCardsDrawn;
        const totalCards = this.darknessCardsToDraw;
        const generalOnly = this.darknessCurrentGeneralOnly;
        this.showDarknessCardPreview(card, cardNum, totalCards, generalOnly);
    },
});
