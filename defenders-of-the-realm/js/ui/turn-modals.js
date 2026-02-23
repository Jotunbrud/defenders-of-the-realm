// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Turn Phase Modals (Day/Evening/Night)
// ═══════════════════════════════════════════════════════════════

Object.assign(game, {
    // Clean up any dynamic buttons added to the end-of-turn button container
    _cleanupEndOfTurnButtons() {
        const ids = ['wisdom-discard-btn', 'militia-secures-btn', 'strong-defenses-btn', 'organize-militia-btn'];
        ids.forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
        // Also remove indicator divs that may have been appended
        const content = document.getElementById('end-of-turn-content');
        if (content) {
            content.querySelectorAll('[id$="-indicator"]').forEach(el => el.remove());
        }
        // Reset button container styles
        const btn = document.getElementById('end-of-turn-btn');
        if (btn) {
            const btnContainer = btn.parentElement;
            btnContainer.style.display = '';
            btnContainer.style.gap = '';
            btnContainer.style.justifyContent = '';
            btn.style.flex = '';
        }
    },
    
    showDaytimeModal(hero, damageInfo) {
        const modal = document.getElementById('end-of-turn-modal');
        const content = document.getElementById('end-of-turn-content');
        
        // Clean up any buttons from previous turn's darkness phase
        this._cleanupEndOfTurnButtons();
        
        let damageHTML = '';
        const rawDamage = damageInfo.minionDamage + damageInfo.fearDamage;
        const hadMinions = damageInfo.minionDamage > 0 || damageInfo.fearDamage > 0 || damageInfo.fearBlocked || damageInfo.shadowHidden || damageInfo.shapeshiftProtected;
        
        // Eagle Rider Sky Attack: Protected from all end-of-turn damage
        if (damageInfo.skyAttackProtected) {
            const minionCount = Object.values(damageInfo.minions).reduce((sum, n) => sum + n, 0);
            damageHTML = `
                <div style="margin: 15px 0; padding: 12px; background: rgba(96, 165, 250, 0.2); border: 2px solid #60a5fa; border-radius: 8px;">
                    <div style="font-size: 1.1em; color: #60a5fa; font-weight: bold; margin-bottom: 5px;">
                        ☁️ Sky Attack — No Penalties!
                    </div>
                    <div style="font-size: 0.9em; color: #d4af37;">
                        ${minionCount > 0 ? `${minionCount} minion(s) present but Eagle Rider soars above, safe from harm!` : 'Eagle Rider soars safely above the battlefield.'}
                    </div>
                </div>
            `;
        } else if (damageInfo.shadowHidden && damageInfo.totalDamage <= 0) {
            // Rogue: shadow hid and took zero total damage (no fear either, or fear was blocked)
            const minionCount = Object.values(damageInfo.minions).reduce((sum, n) => sum + n, 0);
            damageHTML = `
                <div style="margin: 15px 0; padding: 12px; background: rgba(124, 58, 237, 0.2); border: 2px solid #7c3aed; border-radius: 8px;">
                    <div style="font-size: 1.1em; color: #a78bfa; font-weight: bold; margin-bottom: 5px;">
                        🗡️ Hide In The Shadows — No Minion Damage!
                    </div>
                    <div style="font-size: 0.9em; color: #d4af37;">
                        ${minionCount} minion${minionCount !== 1 ? 's' : ''} present but Rogue hides in the shadows, avoiding ${damageInfo.minionDamageBlocked} wound${damageInfo.minionDamageBlocked !== 1 ? 's' : ''}!
                    </div>
                    ${damageInfo.fearBlocked ? '<div style="margin-top: 5px; font-style: italic; color: #fbbf24;">⚔️ Bravery: Immune to undead fear damage!</div>' : ''}
                </div>
            `;
        } else if (damageInfo.shapeshiftProtected && damageInfo.totalDamage <= 0) {
            // Sorceress: shapeshift protected all damage
            const factionNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
            const factionIcons = { green: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#16a34a;border:1.5px solid #000;vertical-align:middle;"></span>', black: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#1f2937;border:1.5px solid #000;vertical-align:middle;"></span>', red: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#dc2626;border:1.5px solid #000;vertical-align:middle;"></span>', blue: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#2563eb;border:1.5px solid #000;vertical-align:middle;"></span>' };
            const fname = factionNames[damageInfo.shapeshiftForm] || damageInfo.shapeshiftForm;
            const ficon = factionIcons[damageInfo.shapeshiftForm] || '⚡';
            const minionCount = Object.values(damageInfo.minions).reduce((sum, n) => sum + n, 0);
            damageHTML = `
                <div style="margin: 15px 0; padding: 12px; background: rgba(236, 72, 153, 0.15); border: 2px solid #ec4899; border-radius: 8px;">
                    <div style="font-size: 1.1em; color: #ec4899; font-weight: bold; margin-bottom: 5px;">
                        ⚡ Shape Shifter — ${fname} Form ${ficon}
                    </div>
                    <div style="font-size: 0.9em; color: #d4af37;">
                        ${minionCount} minion${minionCount !== 1 ? 's' : ''} present — immune to ${damageInfo.shapeshiftDamageBlocked} ${fname} wound${damageInfo.shapeshiftDamageBlocked !== 1 ? 's' : ''}!
                    </div>
                    ${damageInfo.fearBlocked ? '<div style="margin-top: 5px; font-style: italic; color: #fbbf24;">⚔️ Bravery: Immune to undead fear damage!</div>' : ''}
                </div>
            `;
        } else if (hadMinions) {
            let details = [];
            if (damageInfo.minionDamage > 0) {
                details.push(`${damageInfo.minionDamage} from minions`);
            }
            if (damageInfo.fearDamage > 0) {
                details.push(`${damageInfo.fearDamage} from undead fear`);
            }
            
            // Build ability lines
            let abilityLines = '';
            if (damageInfo.shadowHidden) {
                abilityLines += `<div style="margin-top: 5px; font-style: italic; color: #f87171;">🗡️ Hide In The Shadows: Avoided ${damageInfo.minionDamageBlocked} minion wound${damageInfo.minionDamageBlocked !== 1 ? 's' : ''}!</div>`;
            }
            if (damageInfo.shapeshiftProtected) {
                const factionNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
                const fname = factionNames[damageInfo.shapeshiftForm] || damageInfo.shapeshiftForm;
                abilityLines += `<div style="margin-top: 5px; font-style: italic; color: #fbbf24;">⚡ Shape Shifter: Avoided ${damageInfo.shapeshiftDamageBlocked} ${fname} wound${damageInfo.shapeshiftDamageBlocked !== 1 ? 's' : ''}!</div>`;
            }
            if (damageInfo.fearBlocked) {
                abilityLines += '<div style="margin-top: 5px; font-style: italic; color: #a78bfa;">⚔️ Bravery: Immune to undead fear damage!</div>';
            }
            if (damageInfo.auraReduction > 0) {
                const abilityName = hero.name === 'Dwarf' ? '⛏️ Armor and Toughness' : '✝️ Aura of Righteousness';
                abilityLines += `<div style="margin-top: 5px; font-style: italic; color: ${hero.color};">${abilityName}: Reduced ${damageInfo.auraReduction} damage!</div>`;
            }
            
            if (damageInfo.totalDamage > 0) {
                damageHTML = `
                    <div style="margin: 15px 0; padding: 12px; background: rgba(220, 38, 38, 0.2); border: 2px solid #dc2626; border-radius: 8px;">
                        <div style="font-size: 1.1em; color: #dc2626; font-weight: bold; margin-bottom: 5px;">
                            💔 Damage Taken: ${damageInfo.totalDamage}
                        </div>
                        <div style="font-size: 0.9em;">
                            ${details.join(' + ')}
                        </div>
                        ${abilityLines}
                    </div>
                `;
            } else {
                // Damage was fully absorbed by abilities
                damageHTML = `
                    <div style="margin: 15px 0; padding: 12px; background: rgba(251, 191, 36, 0.15); border: 2px solid #fbbf24; border-radius: 8px;">
                        <div style="font-size: 1.1em; color: #fbbf24; font-weight: bold; margin-bottom: 5px;">
                            🛡️ Damage Absorbed
                        </div>
                        <div style="font-size: 0.9em;">
                            ${details.length > 0 ? details.join(' + ') : 'All incoming damage negated'}
                        </div>
                        ${abilityLines}
                        <div style="margin-top: 5px; font-size: 0.9em; color: #4ade80; font-weight: bold;">Final damage: 0</div>
                    </div>
                `;
            }
        } else {
            damageHTML = `
                <div style="margin: 15px 0; padding: 12px; background: rgba(74, 222, 128, 0.2); border: 2px solid #4ade80; border-radius: 8px;">
                    <div style="font-size: 1em; color: #4ade80; font-weight: bold;">
                        ✓ No damage taken
                    </div>
                </div>
            `;
        }
        
        // Fresh Mount display
        let freshMountHTML = '';
        if (damageInfo.freshMountTriggered) {
            freshMountHTML = `
                <div style="margin: 15px 0; padding: 12px; background: rgba(14, 165, 233, 0.2); border: 2px solid #0ea5e9; border-radius: 8px;">
                    <div style="font-size: 1.1em; color: #0ea5e9; font-weight: bold; margin-bottom: 5px;">
                        🦅 Fresh Mount!
                    </div>
                    <div style="font-size: 0.9em; color: #d4af37;">
                        Ending turn at ${hero.location} grants <strong style="color: #4ade80;">+1 action</strong> next turn.
                    </div>
                </div>
            `;
        }
        
        // Process general healing at end of each player's turn (only once per turn)
        if (!this._daytimeHealingDone) {
            this._daytimeHealingResults = this._processGeneralHealing();
            this._daytimeHealingDone = true;
        }
        const healingResults = this._daytimeHealingResults;
        const healingHTML = this._buildHealingHTML(healingResults);
        this.renderGenerals(); // Update panels with new health/wounds
        
        // Check if Spy In The Camp can be used
        let spyButtonHTML = '';
        const spyHolder = this._findSpyInCampCard();
        const woundedGenerals = this._getWoundedGeneralsForSpy();
        if (spyHolder && woundedGenerals.length > 0 && !this.spyBlockedGeneral) {
            spyButtonHTML = `
                <div style="text-align: center; margin: 8px 0;">
                    <button class="btn" onclick="game._spyInCampShowPicker()" style="background: rgba(185,28,28,0.3); border: 2px solid #b91c1c; color: #f87171; padding: 8px 16px; font-size: 0.95em;">
                        👤 Spy In The Camp (${spyHolder.hero.symbol} ${spyHolder.hero.name})
                    </button>
                </div>`;
        }
        
        content.innerHTML = `
            <div class="modal-title" style="margin-bottom: 15px;">Step 1 - ☀️ Daytime</div>
            
            <div style="text-align: center; color: ${hero.color}; font-size: 1.1em; font-weight: bold; margin-bottom: 10px;">
                ${hero.symbol} ${hero.name}
            </div>
            
            ${damageHTML}
            ${freshMountHTML}
            ${healingHTML}
            ${spyButtonHTML}
            
            <div style="text-align: center; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                <div style="font-size: 0.95em; color: #d4af37;">
                    ❤️ Health: ${hero.health}/${hero.maxHealth}
                </div>
            </div>
        `;
        
        this._endOfTurnModalMode = 'daytime';
        const endBtn = document.getElementById('end-of-turn-btn');
        if (endBtn) endBtn.textContent = 'End Daytime Phase';
        modal.classList.add('active');
    },
    
    closeDaytimeModal() {
        const modal = document.getElementById('end-of-turn-modal');
        modal.classList.remove('active');
        
        // Clear daytime healing tracking
        this._daytimeHealingDone = false;
        this._daytimeHealingResults = null;
        this.spyBlockedGeneral = null;
        
        // Now proceed to Step 2 - draw cards and show evening modal
        const hero = this.endOfTurnState.hero;
        const card1 = this.generateRandomCard();
        const card2 = this.generateRandomCard();
        const drawnCards = [card1, card2];
        hero.cards.push(card1);
        hero.cards.push(card2);
        
        // Rogue Thievery: draw 1 extra card at treasure chest locations
        let thieveryBonus = false;
        if (hero.name === 'Rogue') {
            const locData = this.locationCoords[hero.location];
            if (locData && locData.chest) {
                const bonusCard = this.generateRandomCard();
                if (bonusCard) {
                    drawnCards.push(bonusCard);
                    hero.cards.push(bonusCard);
                    thieveryBonus = true;
                    this.addLog(`🗡️ Thievery: ${hero.name} found an extra card at ${hero.location}!`);
                }
            }
        }
        
        // Quest bonus: draw extra hero cards (e.g. Helm of Power)
        const questCardBonus = this._getQuestHeroCardBonus(hero);
        let questCardBonusDrawn = false;
        let questCardBonusName = '';
        if (questCardBonus > 0) {
            // Find the quest name for logging
            if (hero.questCards) {
                const bonusQuest = hero.questCards.find(q => q.completed && q.mechanic && q.mechanic.rewardType === 'bonus_hero_card');
                if (bonusQuest) questCardBonusName = bonusQuest.name;
            }
            for (let i = 0; i < questCardBonus; i++) {
                const bonusCard = this.generateRandomCard();
                if (bonusCard) {
                    drawnCards.push(bonusCard);
                    hero.cards.push(bonusCard);
                    questCardBonusDrawn = true;
                }
            }
            if (questCardBonusDrawn) {
                this.addLog(`📜 ${questCardBonusName}: ${hero.name} draws ${questCardBonus} extra card(s)!`);
            }
        }
        
        this.addLog(`${hero.name} drew: ${drawnCards.map(c => c.name).join(', ')}`);
        
        this.endOfTurnState.drawnCards = drawnCards;
        this.endOfTurnState.thieveryBonus = thieveryBonus;
        this.endOfTurnState.questCardBonus = questCardBonusDrawn ? questCardBonus : 0;
        this.endOfTurnState.questCardBonusName = questCardBonusName;
        
        this.showEveningModal(hero, drawnCards, thieveryBonus, questCardBonusDrawn ? questCardBonus : 0, questCardBonusName);
    },
    
    // ==========================================
    // STEP 2 - EVENING: Draw cards + hand limit
    // ==========================================
    
    showEveningModal(hero, drawnCards, thieveryBonus, questCardBonus = 0, questCardBonusName = '') {
        const modal = document.getElementById('end-of-turn-modal');
        const content = document.getElementById('end-of-turn-content');
        
        // Clean up any lingering dynamic buttons
        this._cleanupEndOfTurnButtons();
        
        const cardColorMap = {
            'red': '#dc2626',
            'blue': '#2563eb',
            'green': '#16a34a',
            'black': '#1f2937'
        };
        
        const colorToGeneralWithFaction = {
            'red': 'Balazarg (Demons)',
            'blue': 'Sapphire (Dragonkin)',
            'green': 'Gorgutt (Orcs)',
            'black': 'Varkolak (Undead)'
        };
        
        // Determine which cards are bonus cards
        const baseCount = 2;
        const thieveryCount = thieveryBonus ? 1 : 0;
        const questStart = baseCount + thieveryCount;
        
        const cardsHTML = drawnCards.map((card, idx) => {
            const borderColor = (card.special ? '#9333ea' : (cardColorMap[card.color] || '#8B7355'));
            const generalWithFaction = colorToGeneralWithFaction[card.color] || 'Any General';
            const cardIcon = card.icon || '🎴';
            const isThieveryCard = thieveryBonus && idx === baseCount;
            const isQuestCard = questCardBonus > 0 && idx >= questStart;
            const isBonusCard = isThieveryCard || isQuestCard;
            const bonusBorderColor = isThieveryCard ? '#7c3aed' : (isQuestCard ? '#dc2626' : borderColor);
            const bonusBorder = isBonusCard ? `box-shadow: 0 0 8px rgba(${isQuestCard ? '220,38,38' : '124,58,237'},0.6);` : '';
            let bonusLabel = '';
            if (isThieveryCard) bonusLabel = '<div style="text-align: center; font-size: 0.75em; color: #a78bfa; font-weight: bold; margin-bottom: 3px;">🗡️ THIEVERY</div>';
            if (isQuestCard) bonusLabel = '<div style="text-align: center; font-size: 0.75em; color: #ef4444; font-weight: bold; margin-bottom: 3px;">📜 QUEST BONUS</div>';
            return `
                <div style="flex: 1; padding: 12px; margin: 5px; border: 3px solid ${isBonusCard ? bonusBorderColor : borderColor}; border-radius: 8px; background: rgba(0,0,0,0.5); ${bonusBorder}">
                    ${bonusLabel}
                    <div style="text-align: center; font-size: 1.3em; margin-bottom: 5px;">
                        ${cardIcon}
                    </div>
                    <div style="font-size: 1em; font-weight: bold; color: ${borderColor}; margin-bottom: 5px; text-align: center;">
                        ${card.name}
                    </div>
                    <div style="text-align: center; margin: 5px 0;">
                        ${Array(card.dice).fill(0).map(() => 
                            `<span style="display: inline-block; width: 22px; height: 22px; background: ${borderColor}; border-radius: 4px; margin: 1px; line-height: 22px; text-align: center; font-weight: bold;">🎲</span>`
                        ).join('')}
                    </div>
                    <div style="font-size: 0.85em; color: #d4af37; text-align: center;">
                        ${card.special ? "🌟 Special" : "vs " + generalWithFaction}
                    </div>
                </div>
            `;
        }).join('');
        
        const thieveryHTML = thieveryBonus ? `
            <div style="margin-top: 10px; padding: 8px; background: rgba(124,58,237,0.15); border: 1px solid #7c3aed; border-radius: 6px; text-align: center;">
                <span style="color: #a78bfa; font-weight: bold;">🗡️ Thievery:</span>
                <span style="color: #d4af37;"> Drew 1 extra card from treasure chest at ${hero.location}!</span>
            </div>
        ` : '';
        
        const questBonusHTML = questCardBonus > 0 ? `
            <div style="margin-top: 10px; padding: 8px; background: rgba(220,38,38,0.15); border: 1px solid #dc2626; border-radius: 6px; text-align: center;">
                <span style="color: #ef4444; font-weight: bold;">📜 ${questCardBonusName}:</span>
                <span style="color: #d4af37;"> Drew ${questCardBonus} extra card(s)!</span>
            </div>
        ` : '';
        
        content.innerHTML = `
            <div class="modal-title" style="margin-bottom: 5px;">Step 2 - 🌅 Evening</div>
            <div style="text-align: center; font-size: 1.1em; color: #ffd700; font-weight: bold; margin-bottom: 15px;">Hero Cards</div>
            
            <div style="margin: 15px 0;">
                <div style="font-size: 1em; color: #ffd700; font-weight: bold; margin-bottom: 8px;">
                    🎴 Cards Drawn:
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    ${cardsHTML}
                </div>
                ${thieveryHTML}
                ${questBonusHTML}
            </div>
            <div style="text-align: center; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                <div style="font-size: 0.95em; color: #d4af37;">
                    🎴 Total Cards: ${hero.cards.length}
                </div>
            </div>
        `;
        
        this._endOfTurnModalMode = 'evening';
        const endBtn = document.getElementById('end-of-turn-btn');
        if (endBtn) endBtn.textContent = 'End Evening Phase';
        modal.classList.add('active');
    },
    
    closeEveningModal() {
        const modal = document.getElementById('end-of-turn-modal');
        modal.classList.remove('active');
        
        const hero = this.endOfTurnState.hero;
        
        // Check hand limit - must discard down to 10
        if (hero.cards.length > 10) {
            this.showHandLimitModal(hero);
        } else {
            this.proceedToNightPhase();
        }
    },
    
    showHandLimitModal(hero) {
        const modal = document.getElementById('hand-limit-modal');
        const content = document.getElementById('hand-limit-content');
        
        const excessCards = hero.cards.length - 10;
        
        const cardColorMap = {
            'red': '#dc2626',
            'blue': '#2563eb',
            'green': '#16a34a',
            'black': '#1f2937'
        };
        
        let cardsHTML = '';
        hero.cards.forEach((card, index) => {
            const borderColor = (card.special ? '#9333ea' : (cardColorMap[card.color] || '#8B7355'));
            const cardIcon = card.icon || '🎴';
            cardsHTML += `
                <div id="hand-limit-card-${index}" onclick="game.toggleHandLimitCard(${index})" 
                     style="padding: 10px; margin: 4px; border: 3px solid ${borderColor}; border-radius: 8px; 
                            background: rgba(0,0,0,0.5); cursor: pointer; text-align: center; min-width: 80px;
                            transition: all 0.2s; position: relative;">
                    <div style="font-size: 1.2em;">${cardIcon}</div>
                    <div style="font-size: 0.85em; font-weight: bold; color: ${borderColor};">${card.name}</div>
                    <div style="font-size: 0.75em; color: #999;">${card.dice} dice</div>
                    <div id="hand-limit-check-${index}" style="display: none; position: absolute; top: -5px; right: -5px; 
                         background: #dc2626; border-radius: 50%; width: 22px; height: 22px; line-height: 22px; 
                         font-size: 14px; text-align: center;">✕</div>
                </div>
            `;
        });
        
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 10px;">
                <div style="font-size: 1.2em; color: #ffd700; font-weight: bold;">✋ Hand Limit Exceeded</div>
            </div>
            
            <div style="text-align: center; color: ${hero.color}; font-weight: bold; margin-bottom: 10px;">
                ${hero.symbol} ${hero.name} has ${hero.cards.length} cards (limit: 10)
            </div>
            
            <div style="text-align: center; padding: 10px; background: rgba(220, 38, 38, 0.2); border: 2px solid #dc2626; border-radius: 8px; margin-bottom: 15px;">
                <div style="color: #dc2626; font-weight: bold;">
                    Select <span id="hand-limit-remaining">${excessCards}</span> card${excessCards > 1 ? 's' : ''} to discard
                </div>
            </div>
            
            <div style="display: flex; flex-wrap: wrap; justify-content: center; max-height: 300px; overflow-y: auto;">
                ${cardsHTML}
            </div>
        `;
        
        this.handLimitSelectedCards = new Set();
        this.handLimitRequired = excessCards;
        
        modal.classList.add('active');
    },
    
    toggleHandLimitCard(index) {
        const checkEl = document.getElementById(`hand-limit-check-${index}`);
        const cardEl = document.getElementById(`hand-limit-card-${index}`);
        
        if (this.handLimitSelectedCards.has(index)) {
            this.handLimitSelectedCards.delete(index);
            checkEl.style.display = 'none';
            cardEl.style.opacity = '1';
            cardEl.style.transform = '';
        } else {
            // Don't allow selecting more than required
            if (this.handLimitSelectedCards.size >= this.handLimitRequired) {
                return;
            }
            this.handLimitSelectedCards.add(index);
            checkEl.style.display = 'block';
            cardEl.style.opacity = '0.6';
            cardEl.style.transform = 'scale(0.95)';
        }
        
        // Update remaining count
        const remaining = this.handLimitRequired - this.handLimitSelectedCards.size;
        const remainingEl = document.getElementById('hand-limit-remaining');
        if (remainingEl) {
            remainingEl.textContent = Math.max(0, remaining);
        }
        
        // Enable/disable confirm button - exactly the required number
        const confirmBtn = document.getElementById('hand-limit-confirm-btn');
        if (confirmBtn) {
            if (this.handLimitSelectedCards.size === this.handLimitRequired) {
                confirmBtn.disabled = false;
                confirmBtn.className = 'btn btn-primary';
                confirmBtn.style.opacity = '1';
            } else {
                confirmBtn.disabled = true;
                confirmBtn.className = 'btn';
                confirmBtn.style.opacity = '0.5';
            }
        }
    },
    
    confirmHandLimitDiscard() {
        if (this.handLimitSelectedCards.size < this.handLimitRequired) {
            this.showInfoModal('⚠️', `<div>You must select ${this.handLimitRequired} card(s) to discard!</div>`);
            return;
        }
        
        const hero = this.endOfTurnState.hero;
        
        // Remove cards in reverse index order to maintain indices
        const sortedIndices = Array.from(this.handLimitSelectedCards).sort((a, b) => b - a);
        const discardedNames = [];
        sortedIndices.forEach(index => {
            discardedNames.push(hero.cards[index].name);
            hero.cards.splice(index, 1);
            this.heroDiscardPile++;
        });
        
        this.addLog(`${hero.name} discarded ${discardedNames.length} card(s) (hand limit): ${discardedNames.join(', ')}`);
        
        // Update display to reflect new card count
        this.updateGameStatus();
        
        // Close modal and proceed to night
        document.getElementById('hand-limit-modal').classList.remove('active');
        this.proceedToNightPhase();
    },
    
    // ==========================================
    // STEP 3 - NIGHT: Darkness Spreads
    // ==========================================
    
    proceedToNightPhase() {
        const state = this.endOfTurnState;
        
        // Check if darkness is skipped by All Is Quiet card
        if (this.skipDarknessThisTurn) {
            this.skipDarknessThisTurn = false;
            
            this.addLog(`🌅 All Is Quiet — No Darkness Spreads cards drawn this turn!`);
            this.lastDarknessEvents = [];
            
            const modal = document.getElementById('end-of-turn-modal');
            const content = document.getElementById('end-of-turn-content');
            const btn = document.getElementById('end-of-turn-btn');
            this._endOfTurnModalMode = 'night';
            this.pendingPlayerChange = true;
            this.pendingLossCheck = false;
            
            content.innerHTML = `
                <div class="modal-title" style="margin-bottom: 5px;">Step 3 - 🌙 Night</div>
                <div style="padding: 20px; text-align: center; border: 2px solid #4ade80; background: rgba(74,222,128,0.15); border-radius: 8px; margin: 15px 0;">
                    <div style="font-size: 2em; margin-bottom: 10px;">🌅</div>
                    <div style="font-size: 1.3em; color: #4ade80; font-weight: bold;">All Is Quiet</div>
                    <div style="color: #d4af37; margin-top: 8px;">No Darkness Spreads cards are drawn this turn.</div>
                    <div style="color: #d4af37; margin-top: 5px;">The land rests easy tonight.</div>
                </div>
            `;
            
            if (btn) btn.textContent = 'Continue';
            
            modal.classList.add('active');
            return;
        }
        
        // Set flag for map visual effects
        if (state.fromMap) {
            this.showingDarknessOnMap = true;
        }
        
        // Setup darkness phase state (no cards processed yet)
        this.darknessPhase();
        
        // Open the modal first, then draw the first card
        const modal = document.getElementById('end-of-turn-modal');
        this._endOfTurnModalMode = 'darkness_card';
        modal.classList.add('active');
        this.pendingPlayerChange = true;
        this.pendingLossCheck = true;
        
        // Draw first card
        this.drawNextDarknessCard();
    },
    
    renderDarknessEvents(darknessEvents) {
        let html = '';
        if (!darknessEvents || darknessEvents.length === 0) {
            return '<div style="text-align: center; color: #4ade80; font-size: 1.1em; font-weight: bold; padding: 15px;">🌅 All is Quiet - No darkness events</div>';
        }
        
        darknessEvents.forEach(event => {
            const colorStyle = event.color ? `color: ${this.getGeneralColor(event.color)};` : '';
            
            if (event.type === 'card_separator') {
                const modeText = event.generalOnly ? 'General Advance Only' : 'Full Card';
                const modeColor = event.generalOnly ? '#fbbf24' : '#4ade80';
                html += `
                    <div style="padding: 8px; margin: 10px 0 5px 0; border-bottom: 2px solid #555; text-align: center;">
                        <strong style="color: #d4af37;">Card ${event.cardNum} of ${event.totalCards}</strong>
                        <span style="color: ${modeColor}; font-size: 0.9em; margin-left: 8px;">(${modeText})</span>
                    </div>
                `;
            } else if (event.type === 'general_only_notice') {
                html += `
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid #fbbf24; background: rgba(251,191,36,0.1); border-radius: 3px;">
                        <span style="color: #fbbf24; font-size: 0.9em;">⏭️ Minion placements skipped (General Advance Only)</span><br>
                        <span style="color: #666; font-size: 0.8em; text-decoration: line-through;">${event.skippedFaction1}: ${event.skippedMinions1} → ${event.skippedLocation1} &nbsp;|&nbsp; ${event.skippedFaction2}: ${event.skippedMinions2} → ${event.skippedLocation2}</span>
                    </div>
                `;
            } else if (event.type === 'patrol') {
                const generalColorStyle = event.generalColor ? `color: ${this.getGeneralColor(event.generalColor)};` : '';
                html += `
                    <div style="padding: 12px; margin: 5px 0; border: 2px solid #16a34a; background: rgba(22,163,74,0.2); border-radius: 5px;">
                        <div style="font-size: 1.1em; color: #16a34a; font-weight: bold; margin-bottom: 5px; text-align: center;">
                            🥾 ${event.patrolName}
                        </div>
                        <div style="font-size: 0.95em; color: #d4af37; text-align: center;">
                            ${event.locationsPatrolled} green location${event.locationsPatrolled !== 1 ? 's' : ''} patrolled
                        </div>
                        <div style="font-size: 0.85em; color: #999; text-align: center; margin-top: 3px;">
                            1 orc added to each empty green location
                        </div>
                        <div style="font-size: 0.85em; ${generalColorStyle} text-align: center; margin-top: 5px; font-weight: bold;">
                            General: ${event.general}
                        </div>
                    </div>
                `;
            } else if (event.type === 'all_quiet') {
                html += `
                    <div style="padding: 12px; margin: 5px 0; border: 2px solid #4ade80; background: rgba(74,222,128,0.2); border-radius: 5px; text-align: center;">
                        <div style="font-size: 1.2em; color: #4ade80; font-weight: bold; margin-bottom: 3px;">
                            🌅 All is Quiet
                        </div>
                        <div style="font-size: 0.95em; color: #d4af37;">
                            ${event.description}
                        </div>
                    </div>
                `;
            } else if (event.type === 'spawn') {
                html += `
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid ${this.getGeneralColor(event.color)}; background: rgba(0,0,0,0.3); border-radius: 3px;">
                        <strong style="${colorStyle}">${event.general}:</strong> ${event.count} ${event.color} minion${event.count > 1 ? 's' : ''} → <strong>${event.location}</strong>
                    </div>
                `;
            } else if (event.type === 'taint') {
                const reasonText = event.reason ? `<br><span style="font-size: 0.85em; color: #fbbf24;">(${event.reason})</span>` : '';
                const notPlaced = event.wouldBeMinions - event.minionsPlaced;
                const placedText = event.minionsPlaced > 0 
                    ? `${event.minionsPlaced} ${event.color} minion${event.minionsPlaced !== 1 ? 's' : ''} placed` 
                    : '';
                const notPlacedText = notPlaced > 0 
                    ? `${notPlaced} ${event.color} minion${notPlaced !== 1 ? 's' : ''} <span style="color: #ef4444; font-weight: bold;">NOT placed</span>` 
                    : '';
                const minionSummary = [placedText, notPlacedText].filter(Boolean).join(', ');
                html += `
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid #9333ea; background: rgba(147,51,234,0.2); border-radius: 3px;">
                        <strong style="${colorStyle}">${event.general}:</strong> ${minionSummary} → <strong>${event.location}</strong>${reasonText}<br>
                        <strong style="color: #9333ea;">💎 Taint Crystal placed!</strong>
                    </div>
                `;
            } else if (event.type === 'overrun') {
                let overrunInner = '';
                if (event.sourceTaint) {
                    const st = event.sourceTaint;
                    const notPlaced = st.wouldBeMinions - st.minionsPlaced;
                    const placedText = st.minionsPlaced > 0 
                        ? `${st.minionsPlaced} ${st.color} minion${st.minionsPlaced !== 1 ? 's' : ''} placed` 
                        : '';
                    const notPlacedText = notPlaced > 0 
                        ? `${notPlaced} ${st.color} minion${notPlaced !== 1 ? 's' : ''} <span style="color: #ef4444; font-weight: bold;">NOT placed</span>` 
                        : '';
                    const minionSummary = [placedText, notPlacedText].filter(Boolean).join(', ');
                    const reasonText = st.reason ? `<br><span style="font-size: 0.85em; color: #fbbf24;">(${st.reason})</span>` : '';
                    overrunInner += `
                        <div style="padding: 8px; margin: 5px 0; border-left: 3px solid #9333ea; background: rgba(147,51,234,0.2); border-radius: 3px;">
                            <strong style="${colorStyle}">${st.general}:</strong> ${minionSummary} → <strong>${st.location}</strong>${reasonText}<br>
                            <strong style="color: #9333ea;">💎 Taint Crystal placed!</strong>
                        </div>
                    `;
                }
                event.spread.forEach(s => {
                    if (s.addedMinion && !s.addedTaint) {
                        overrunInner += `
                            <div style="padding: 8px; margin: 5px 0; border-left: 3px solid ${this.getGeneralColor(s.color)}; background: rgba(0,0,0,0.3); border-radius: 3px;">
                                <strong style="${colorStyle}">${event.general}:</strong> 1 ${s.color} minion → <strong>${s.location}</strong>
                            </div>
                        `;
                    } else if (s.addedTaint) {
                        const notPlacedText = `1 ${s.color} minion <span style="color: #ef4444; font-weight: bold;">NOT placed</span>`;
                        overrunInner += `
                            <div style="padding: 8px; margin: 5px 0; border-left: 3px solid #9333ea; background: rgba(147,51,234,0.2); border-radius: 3px;">
                                <strong style="${colorStyle}">${event.general}:</strong> ${notPlacedText} → <strong>${s.location}</strong>
                                <br><span style="font-size: 0.85em; color: #fbbf24;">(location at max (3 minions))</span><br>
                                <strong style="color: #9333ea;">💎 Taint Crystal placed!</strong>
                            </div>
                        `;
                    }
                });
                html += `
                    <div style="padding: 10px; margin: 5px 0; border: 2px solid #ef4444; background: rgba(239,68,68,0.1); border-radius: 5px;">
                        <strong style="color: #ef4444; font-size: 1em;">⚠️ OVERRUN at ${event.sourceLocation}!</strong>
                        <div style="font-size: 0.85em; color: #fbbf24; margin: 3px 0 8px 0;">${event.general} minions spread to connected locations</div>
                        ${overrunInner}
                    </div>
                `;
            } else if (event.type === 'advance' || event.type === 'general_move') {
                const cardText = event.isWildCard ? 'Next Location' : event.to;
                const wildCardNote = event.isWildCard ? '<br><span style="font-size: 0.85em; color: #fbbf24;">(advances along colored path)</span>' : '';
                html += `
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid ${this.getGeneralColor(event.color)}; background: rgba(220,38,38,0.2); border-radius: 3px;">
                        <strong style="${colorStyle}; font-size: 1em;">⚠️ ${event.general}:</strong> ${event.minionCount || 0} minion${(event.minionCount || 0) !== 1 ? 's' : ''} → <strong>${cardText}</strong>${wildCardNote}<br>
                        <strong style="color: #4ade80; font-size: 1em;">✓ GENERAL ADVANCES</strong> (${event.from} → ${event.to})
                    </div>
                `;
            } else if (event.type === 'monarch_city_reached') {
                html += `
                    <div style="padding: 8px; margin: 5px 0; border: 3px solid #dc2626; background: rgba(220,38,38,0.4); border-radius: 3px;">
                        <strong style="${colorStyle}; font-size: 1em;">⚠️ ${event.general}:</strong> ${event.minionCount || 0} minion${(event.minionCount || 0) !== 1 ? 's' : ''} → <strong>Monarch City</strong><br>
                        <strong style="color: #4ade80; font-size: 1em;">✓ GENERAL ADVANCES</strong> (${event.from} → Monarch City)<br>
                        <strong style="color: #dc2626; font-size: 1.1em; margin-top: 5px; display: inline-block;">💀 ${event.general} REACHED MONARCH CITY! 💀</strong>
                    </div>
                `;
            } else if (event.type === 'advance_failed') {
                html += `
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid #666; background: rgba(100,100,100,0.2); border-radius: 3px;">
                        <strong style="${colorStyle}">⛔ ${event.general}:</strong> ${event.minionCount || 0} minion${(event.minionCount || 0) !== 1 ? 's' : ''} → ${event.attemptedLocation || event.location}<br>
                        <strong style="color: #ef4444;">✗ GENERAL DOES NOT ADVANCE</strong> (${event.reason || 'No valid path'})<br>
                        <span style="font-size: 0.9em; color: #999;">No minions placed</span>
                    </div>
                `;
            } else if (event.type === 'general_defeated') {
                html += `
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid #4ade80; background: rgba(74,222,128,0.2); border-radius: 3px;">
                        <strong style="${colorStyle}">✓ ${event.general}:</strong> ${event.minionCount || 0} minion${(event.minionCount || 0) !== 1 ? 's' : ''} → ${event.targetLocation}<br>
                        <strong style="color: #4ade80; font-size: 1em;">✓ ${event.general.toUpperCase()} DEFEATED</strong><br>
                        <span style="font-size: 0.9em; color: #4ade80;">No generals advance - general already defeated!</span><br>
                        <span style="font-size: 0.9em; color: #999;">No minions placed</span>
                    </div>
                `;
            } else if (event.type === 'major_wound_blocked') {
                html += `
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid #ef4444; background: rgba(239,68,68,0.15); border-radius: 3px;">
                        <strong style="${colorStyle}">🚫 ${event.general}:</strong> Major Wounds<br>
                        <span style="color: #ef4444; font-weight: bold;">Cannot advance — stays at ${event.currentLocation}</span><br>
                        <span style="font-size: 0.9em; color: #999;">Minions still placed at ${event.currentLocation}</span>
                    </div>
                `;
            } else if (event.type === 'movement_blocked') {
                html += `
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid #fbbf24; background: rgba(251,191,36,0.2); border-radius: 3px;">
                        <strong style="${colorStyle}">🚫 ${event.general}:</strong> ${event.minionCount || 0} minion${(event.minionCount || 0) !== 1 ? 's' : ''} → <strong>${event.attemptedLocation}</strong><br>
                        <strong style="color: #ef4444;">✗ GENERAL DOES NOT ADVANCE</strong> (not next on path)<br>
                        <span style="font-size: 0.9em; color: #d4af37;">Next required: ${event.nextOnPath || 'none'}</span><br>
                        <span style="font-size: 0.9em; color: #999;">No minions placed</span>
                    </div>
                `;
            } else if (event.type === 'monarch_city_special') {
                const factionNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
                const factionColors = { green: '#16a34a', black: '#6b7280', red: '#ef4444', blue: '#3b82f6' };
                const factionIcons = { green: '🪓', black: '💀', red: '🔥', blue: '🐉' };
                let colorLines = '';
                if (event.colorsPlaced.length === 0) {
                    colorLines = '<div style="color: #4ade80;">No minions adjacent — nothing placed</div>';
                } else {
                    event.colorsPlaced.forEach(color => {
                        colorLines += `<div style="color: ${factionColors[color]}; padding: 2px 0;">${factionIcons[color]} +1 ${factionNames[color]} minion → Monarch City</div>`;
                    });
                }
                html += `
                    <div style="padding: 12px; margin: 5px 0; border: 2px solid #fbbf24; background: rgba(251,191,36,0.15); border-radius: 5px;">
                        <div style="font-size: 1.1em; color: #fbbf24; font-weight: bold; margin-bottom: 5px; text-align: center;">🏰 Monarch City</div>
                        <div style="text-align: center; color: #ef4444; font-weight: bold; font-size: 0.9em; margin-bottom: 8px;">⚠️ SPECIAL</div>
                        <div style="padding: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; margin-bottom: 6px;">
                            ${colorLines}
                            <div style="margin-top: 4px; color: #ef4444; font-size: 0.85em; font-weight: bold;">No Overruns occurred</div>
                        </div>
                    </div>
                `;
            } else if (event.type === 'deck_reshuffle') {
                html += `
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid #a78bfa; background: rgba(167,139,250,0.15); border-radius: 3px;">
                        <strong style="color: #a78bfa;">🔄 ${event.description}</strong>
                    </div>
                `;
            } else if (event.type === 'no_generals') {
                html += `
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid #ef4444; background: rgba(239,68,68,0.1); border-radius: 3px;">
                        <strong style="color: #ef4444;">🚫 ${event.description}</strong>
                    </div>
                `;
            } else if (event.type === 'militia_secured') {
                html += `
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid #16a34a; background: rgba(22,163,74,0.2); border-radius: 3px;">
                        <strong style="color: #16a34a;">🛡️ Militia Secures Area:</strong> 
                        <span style="color: ${this.getGeneralColor(event.color)}; text-decoration: line-through;">${event.faction}: ${event.count} minion${event.count > 1 ? 's' : ''} → ${event.location}</span>
                        <span style="color: #4ade80; font-weight: bold; margin-left: 6px;">CANCELLED</span>
                    </div>
                `;
            } else if (event.type === 'strong_defenses') {
                html += `
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid #f59e0b; background: rgba(245,158,11,0.2); border-radius: 3px;">
                        <strong style="color: #f59e0b;">🏰 Strong Defenses:</strong> 
                        <span style="color: ${this.getGeneralColor(event.color)}; text-decoration: line-through;">${event.general}: ${event.minions} minion${event.minions !== 1 ? 's' : ''} → ${event.location}</span>
                        <span style="color: #fbbf24; font-weight: bold; margin-left: 6px;">BLOCKED</span>
                    </div>
                `;
            }
        });
        
        return html;
    },
    
    showEndOfTurnModalOnMap(hero, card1, card2, damageInfo, darknessEvents = []) {
        // No longer used directly - flow goes through daytime/evening/night phases
        this.showDaytimeModal(hero, damageInfo);
    },
    
    closeEndOfTurnModal() {
        // Route based on which phase we're in
        if (this._endOfTurnModalMode === 'daytime') {
            this._endOfTurnModalMode = null;
            this.closeDaytimeModal();
            return;
        }
        if (this._endOfTurnModalMode === 'darkness_card') {
            // Card-by-card darkness flow
            if (this.darknessCardPhase === 'preview') {
                // Resolve the current card
                this.resolveDarknessCard();
                return;
            } else if (this.darknessCardPhase === 'resolved') {
                if (this.darknessCardsDrawn < this.darknessCardsToDraw) {
                    // Draw next card
                    this.drawNextDarknessCard();
                    return;
                } else {
                    // All cards resolved - store accumulated events and close
                    this.lastDarknessEvents = this.darknessAllEvents;
                    this._endOfTurnModalMode = null;
                    this.closeNightModal();
                    return;
                }
            }
        }
        if (this._endOfTurnModalMode === 'night') {
            this._endOfTurnModalMode = null;
            this.closeNightModal();
            return;
        }
        // Default: close evening modal
        this._endOfTurnModalMode = null;
        this.closeEveningModal();
    },
    
    closeNightModal() {
        const modal = document.getElementById('end-of-turn-modal');
        modal.classList.remove('active');
        
        // Check deferred loss conditions now that player has seen darkness spreads
        if (this.pendingLossCheck) {
            this.pendingLossCheck = false;
            if (this.checkLoseConditions()) {
                return; // Game over - don't proceed to next turn
            }
        }
        
        // If we were showing on map, show the visual effects now
        if (this.showingDarknessOnMap && this.lastDarknessEvents) {
            this.showingDarknessOnMap = false;
            this.showDarknessEffectsOnMap(this.lastDarknessEvents);
            this.completeMapTurnEndWithPlayerChange();
            return;
        }
        
        // NOW change to next player (if pending)
        if (this.pendingPlayerChange) {
            this.pendingPlayerChange = false;
            
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.heroes.length;
            
            const nextHero = this.heroes[this.currentPlayerIndex];
            this.actionsRemaining = nextHero.health;
            this._applyFreshMountBonus(nextHero);
            this._applyMountainLoreBonus(nextHero);
            this._applyElfSupportBonus(nextHero);
            const questBonus2 = this._getQuestActionBonus(nextHero);
            if (questBonus2 > 0) {
                this.actionsRemaining += questBonus2;
                this.addLog(`📜 Boots of Speed: ${nextHero.name} gains +${questBonus2} actions!`);
            }
            this.rumorsUsedThisTurn = 0;
            this.wizardTeleportUsedThisTurn = false;
            this.skipDarknessThisTurn = false;
            
            this.addLog(`--- ${nextHero.name}'s turn (${this.actionsRemaining} actions) ---`);
            this.updateGameStatus();
            this.renderHeroes();
            this.renderTokens();
            
            const mapModal = document.getElementById('map-modal');
            if (mapModal && mapModal.classList.contains('active')) {
                this.updateMapStatus();
                this.updateMovementButtons();
                this.updateActionButtons();
            }
            
            // Eagle Rider: Show attack style selection at start of turn
            this._checkEagleRiderTurnStart();
        }
    },
    
    completeMapTurnEndWithPlayerChange() {
        // Called after map animations complete
        if (this.pendingPlayerChange) {
            this.pendingPlayerChange = false;
            
            // Move to next player
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.heroes.length;
            
            // Actions = hero's current health
            const nextHero = this.heroes[this.currentPlayerIndex];
            this.actionsRemaining = nextHero.health;
            this._applyFreshMountBonus(nextHero);
            this._applyMountainLoreBonus(nextHero);
            this._applyElfSupportBonus(nextHero);
            const questBonus3 = this._getQuestActionBonus(nextHero);
            if (questBonus3 > 0) {
                this.actionsRemaining += questBonus3;
                this.addLog(`📜 Boots of Speed: ${nextHero.name} gains +${questBonus3} actions!`);
            }
            this.rumorsUsedThisTurn = 0;
        this.wizardTeleportUsedThisTurn = false;
        this.skipDarknessThisTurn = false;
            
            this.addLog(`--- ${nextHero.name}'s turn (${this.actionsRemaining} actions) ---`);
            this.updateGameStatus();
            this.renderHeroes();
            this.renderTokens();
            
            // Re-enable End Turn button
            const endTurnBtn = document.getElementById('map-end-turn-btn');
            if (endTurnBtn) {
                endTurnBtn.disabled = false;
                endTurnBtn.style.opacity = '1';
                endTurnBtn.style.cursor = 'pointer';
            }
            
            // Update movement buttons for new hero's cards and actions
            const mapModal = document.getElementById('map-modal');
            if (mapModal && mapModal.classList.contains('active')) {
                this.updateMapStatus();
                this.updateMovementButtons();
            this.updateActionButtons();
            }
            
            // Eagle Rider: Show attack style selection at start of turn
            this._checkEagleRiderTurnStart();
        }
    },
    
    // COMMENTED OUT: Cleric Heal Ally removed - may be used for future hero
    // clericHealAlly() {
    //     if (this.actionsRemaining <= 0) {
    //         this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
    //         return;
    //     }
    //     
    //     const cleric = this.heroes[this.currentPlayerIndex];
    //     if (cleric.name !== 'Cleric') {
    //         this.showInfoModal('⚠️', '<div>Only the Cleric can use this ability!</div>');
    //         return;
    //     }
    //     
    //     // Find other heroes at same location
    //     const alliesAtLocation = this.heroes.filter((h, idx) => 
    //         idx !== this.currentPlayerIndex && 
    //         h.location === cleric.location &&
    //         h.health < h.maxHealth
    //     );
    //     
    //     if (alliesAtLocation.length === 0) {
    //         this.showInfoModal('⚠️', '<div>No wounded allies at this location!</div>');
    //         return;
    //     }
    //     
    //     // Let player select which ally to heal
    //     if (alliesAtLocation.length === 1) {
    //         const ally = alliesAtLocation[0];
    //         const healAmount = Math.min(2, ally.maxHealth - ally.health);
    //         ally.health += healAmount;
    //         this.actionsRemaining--;
    //         this.addLog(`${cleric.name} healed ${ally.name} for ${healAmount} wounds!`);
    //         this.showInfoModal('❤️ Healed', `<div>Healed ${ally.name} for ${healAmount} wounds!</div>`);
    //     } else {
    //         const allyList = alliesAtLocation.map((a, i) => 
    //             `${i + 1}. ${a.symbol} ${a.name} (${a.health}/${a.maxHealth})`
    //         ).join('\n');
    //         const selection = prompt(`Select ally to heal:\n${allyList}`);
    //         
    //         if (!selection) return;
    //         
    //         const index = parseInt(selection) - 1;
    //         if (index >= 0 && index < alliesAtLocation.length) {
    //             const ally = alliesAtLocation[index];
    //             const healAmount = Math.min(2, ally.maxHealth - ally.health);
    //             ally.health += healAmount;
    //             this.actionsRemaining--;
    //             this.addLog(`${cleric.name} healed ${ally.name} for ${healAmount} wounds!`);
    //             this.showInfoModal('❤️ Healed', `<div>Healed ${ally.name} for ${healAmount} wounds!</div>`);
    //         }
    //     }
    //     
    //     this.updateGameStatus();
    //     this.renderHeroes();
    //     
    //     // Update map if open
    //     const mapModal = document.getElementById('map-modal');
    //     if (mapModal && mapModal.classList.contains('active')) {
    //         const mapActionsLeft = document.getElementById('map-actions-left');
    //         if (mapActionsLeft) {
    //             mapActionsLeft.textContent = this.actionsRemaining;
    //         }
    //     }
    // },
    
    wizardTeleport() {
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const wizard = this.heroes[this.currentPlayerIndex];
        if (wizard.name !== 'Wizard') {
            this.showInfoModal('⚠️', '<div>Only the Wizard can use this ability!</div>');
            return;
        }
        
        if (wizard.cards.length === 0) {
            this.showInfoModal('⚠️', '<div>No cards to discard!</div>');
            return;
        }
        
        // Show card selection
        const cardList = wizard.cards.map((c, i) => 
            `${i + 1}. ${c.name} (${c.color})`
        ).join('\n');
        const cardSelection = prompt(`Select card to discard for teleport:\n${cardList}`);
        
        if (!cardSelection) return;
        
        const cardIndex = parseInt(cardSelection) - 1;
        if (cardIndex < 0 || cardIndex >= wizard.cards.length) return;
        
        const selectedCard = wizard.cards[cardIndex];
        const cardColor = selectedCard.color;
        
        // Find all locations of that color
        const availableLocations = Object.keys(this.locationCoords).filter(loc => 
            this.locationCoords[loc].faction === cardColor
        );
        
        if (availableLocations.length === 0) {
            this.showInfoModal('⚠️', `<div>No ${cardColor} locations available!</div>`);
            return;
        }
        
        // Show location selection
        const locationList = availableLocations.map((loc, i) => 
            `${i + 1}. ${loc}`
        ).join('\n');
        const locSelection = prompt(`Teleport to which ${cardColor} location?\n${locationList}`);
        
        if (!locSelection) return;
        
        const locIndex = parseInt(locSelection) - 1;
        if (locIndex >= 0 && locIndex < availableLocations.length) {
            const destination = availableLocations[locIndex];
            
            // Discard card and teleport
            wizard.cards.splice(cardIndex, 1);
            wizard.location = destination;
            this.actionsRemaining--;
            
            this.addLog(`${wizard.name} teleported to ${destination} (discarded ${selectedCard.name})!`);
            this.showInfoModal('✨ Teleported', `<div>Teleported to ${destination}!</div>`);
            
            this.updateGameStatus();
            this.renderHeroes();
            this.renderTokens();
        }
    }
});
