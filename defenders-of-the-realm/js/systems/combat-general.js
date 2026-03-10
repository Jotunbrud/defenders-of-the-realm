// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - General & Group Combat
// ═══════════════════════════════════════════════════════════════

Object.assign(game, {
    useSpecialSkill() {
        // Cancel any active movement
        if (this.activeMovement) {
            this.clearMovementMode();
        }
        
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        
        // Route to appropriate skill based on hero
        switch(hero.name) {
            case 'Paladin':
                this.useNobleSteed();
                break;
            case 'Wizard':
                this.showWizardTeleport();
                break;
            case 'Eagle Rider':
                this.useEagleFlight();
                break;
            default:
                this.showInfoModal('⚠️', `<div>${hero.name} has no active special skill</div>`);
        }
    },
    
    useNobleSteed() {
        // Paladin's Noble Steed - same as Horse movement but no card required
        const hero = this.heroes[this.currentPlayerIndex];
        
        console.log(`[NOBLE STEED] Starting Noble Steed movement for Paladin`);
        console.log(`[NOBLE STEED] Hero at: ${hero.location}`);
        
        // Set movement state (similar to Horse but no card index)
        this.activeMovement = {
            cardIndex: -1, // No card used
            movementType: 'Noble Steed',
            maxMoves: 2,
            movesRemaining: 2,
            startLocation: hero.location,
            cardUsed: null // No card
        };
        
        console.log(`[NOBLE STEED] Movement state created:`, this.activeMovement);
        
        // Disable map dragging during movement
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'default';
            boardContainer.style.pointerEvents = 'none';
        }
        
        // Re-enable pointer events on the SVG itself so location clicks work
        const svg = document.getElementById('game-map');
        if (svg) {
            svg.style.pointerEvents = 'auto';
        }
        
        // Show movement indicator on map
        this.showMovementIndicator();
        
        // Highlight reachable locations
        this.highlightReachableLocations();
        
        console.log(`[NOBLE STEED] ✅ Noble Steed ready! Waiting for location click...`);
    },
    
    useEagleFlight() {
        // Eagle Rider's Eagle Flight - same as Eagle movement but no card required
        const hero = this.heroes[this.currentPlayerIndex];
        
        console.log(`[EAGLE FLIGHT] Starting Eagle Flight movement for Eagle Rider`);
        console.log(`[EAGLE FLIGHT] Hero at: ${hero.location}`);
        
        // Set movement state (similar to Eagle but no card index)
        this.activeMovement = {
            cardIndex: -1, // No card used
            movementType: 'Eagle Flight',
            maxMoves: 4,
            movesRemaining: 4,
            startLocation: hero.location,
            cardUsed: null // No card
        };
        
        console.log(`[EAGLE FLIGHT] Movement state created:`, this.activeMovement);
        
        // Disable map dragging during movement
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'default';
            boardContainer.style.pointerEvents = 'none';
        }
        
        // Re-enable pointer events on the SVG itself so location clicks work
        const svg = document.getElementById('game-map');
        if (svg) {
            svg.style.pointerEvents = 'auto';
        }
        
        // Show movement indicator on map
        this.showMovementIndicator();
        
        // Highlight reachable locations
        this.highlightReachableLocations();
        
        console.log(`[EAGLE FLIGHT] ✅ Eagle Flight ready! Waiting for location click...`);
    },
    
    attackGeneralFromMap() {
        console.log('=== attackGeneralFromMap called ===');
        
        // Cancel any active movement
        if (this.activeMovement) {
            this.clearMovementMode();
        }
        
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        console.log('Current hero:', hero.name, 'at location:', hero.location);
        
        const general = this.generals.find(g => g.location === hero.location && !g.defeated);
        console.log('General found:', general ? general.name : 'NONE');
        
        if (!general) {
            this.showInfoModal('⚠️', '<div>No general at your current location!</div>');
            return;
        }
        
        // Check if there are minions blocking
        const minionsHere = this.minions[hero.location];
        const totalMinions = minionsHere ? Object.values(minionsHere).reduce((a, b) => a + b, 0) : 0;
        console.log('Minions at location:', totalMinions);
        
        if (totalMinions > 0) {
            this.showInfoModal('⚠️', '<div>You must defeat all minions before attacking the general!</div>');
            return;
        }
        
        // Check if other heroes are at the same location
        const heroesAtLocation = this.heroes.filter(h => h.location === hero.location && h.health > 0);
        console.log('Heroes at location:', heroesAtLocation.length, heroesAtLocation.map(h => h.name));
        
        if (heroesAtLocation.length > 1) {
            // GROUP ATTACK!
            console.log('=== Initiating GROUP ATTACK ===');
            this.initiateGroupAttack(general, heroesAtLocation);
        } else {
            // Solo attack - Show card selection modal
            console.log('=== Initiating SOLO ATTACK ===');
            this.showGeneralCardSelection(general);
        }
    },
    
    initiateGroupAttack(general, heroesAtLocation) {
        console.log('=== initiateGroupAttack called ===');
        console.log('currentPlayerIndex:', this.currentPlayerIndex);
        console.log('Current hero:', this.heroes[this.currentPlayerIndex].name);
        
        // Count how many heroes have matching cards
        const heroesWithMatchingCards = heroesAtLocation.filter(hero => {
            const matchingCards = hero.cards.filter(card => (card.color === general.color || card.color === "any"));
            return matchingCards.length > 0;
        });
        
        // Need at least 1 hero with matching cards
        if (heroesWithMatchingCards.length === 0) {
            this.showInfoModal('⚠️', `<div>No heroes have ${general.color} cards to attack ${general.name}!</div>`);
            return;
        }
        
        // If only 1 hero total at location, it's solo
        if (heroesAtLocation.length === 1) {
            const soloHero = heroesAtLocation[0];
            this.addLog(`${soloHero.name} attacks solo`);
            this.showGeneralCardSelection(general);
            return;
        }
        
        // GROUP ATTACK with ALL heroes at location (even those without matching cards)
        // They can participate by spending action, even if they skip card selection
        this.groupAttack = {
            general: general,
            heroes: heroesAtLocation, // ALL heroes, not just those with cards
            heroCardSelections: {}, // Will store each hero's selected cards
            currentSelectionHeroIndex: 0,
            totalDamage: 0,
            attackOrder: [], // Will determine who attacks when
            initiatorPlayerIndex: this.currentPlayerIndex, // Track who started the attack
            hitReq: null // Set when first attacker rolls
        };
        
        // Store general for modal
        this.selectedGeneralForAttack = general;
        
        this.addLog(`🤝 GROUP ATTACK initiated! ${heroesAtLocation.length} heroes vs ${general.name} (${heroesWithMatchingCards.length} with ${general.color} cards)`);
        
        // Start card selection for first hero
        this.showGroupAttackCardSelection();
    },
    
    showGroupAttackCardSelection() {
        const heroIndex = this.groupAttack.currentSelectionHeroIndex;
        const hero = this.groupAttack.heroes[heroIndex];
        const heroGlobalIndex = this.heroes.indexOf(hero);
        const general = this.groupAttack.general;
        
        // Filter cards by general's faction color (same as solo attack)
        const applicableCards = hero.cards.filter(card => (card.color === general.color || card.color === "any"));
        
        // Show modal for this hero to select cards
        const modal = document.getElementById('general-card-selection-modal');
        const title = document.getElementById('general-card-selection-title');
        const cardsContent = document.getElementById('general-card-selection-content');
        
        title.textContent = `💥 Group Attacking A General`;
        
        // Render cards
        const cardColorMap = {
            'red': '#dc2626',
            'blue': '#2563eb',
            'green': '#16a34a',
            'black': '#374151'
        };
        
        if (applicableCards.length === 0) {
            cardsContent.innerHTML = `
                <div class="parchment-box">
                    <div class="parchment-banner"><span class="hero-banner-name">Select Cards To Attack General</span></div>
                    <div style="font-family:'Comic Sans MS',cursive;font-size:0.85em;color:#3d2b1f;padding:10px;text-align:center;">
                        ${hero.name} has no matching cards to attack this general.
                    </div>
                </div>
            `;
        } else {
            // Check for Amarak's Blessing
            const amarakQuest = this._findAmarakBlessingQuest ? this._findAmarakBlessingQuest() : null;
            // Check for Find Magic Gate
            const bonusDiceQuest = this._findCombatBonusDiceQuest(hero);

            cardsContent.innerHTML = `
                <div class="parchment-box">
                    <div class="parchment-banner"><span class="hero-banner-name">Select Cards To Attack General — ${hero.name} (${this.groupAttack.currentSelectionHeroIndex + 1}/${this.groupAttack.heroes.length})</span></div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;padding:4px 0;">
                        ${applicableCards.map((card) => {
                            const actualIndex = hero.cards.indexOf(card);
                            const isSelected = this.selectedCardsForAttack.includes(actualIndex);
                            const cc = card.special ? { border: '#6d28a8', text: '#6d28a8' } : { border: cardColorMap[card.color] || '#8b7355', text: cardColorMap[card.color] || '#8b7355' };
                            const diceHTML = Array.from({ length: card.dice }).map(() =>
                                `<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:${cc.border};border-radius:3px;font-size:0.65em;border:1.5px solid rgba(0,0,0,0.3)">🎲</span>`
                            ).join('');
                            const selectedStyle = isSelected
                                ? 'border:3px solid #dc2626;opacity:0.45;transform:scale(0.93);'
                                : `border:3px solid ${cc.border};`;
                            const badgeHTML = isSelected
                                ? `<div style="position:absolute;top:-8px;right:-8px;background:#dc2626;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;font-weight:bold;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.4);pointer-events:none;z-index:5;">✕</div>`
                                : '';
                            return `
                                <div onclick="game.toggleCardForGroupAttack(${actualIndex})"
                                     style="flex:1 1 90px;max-width:120px;min-width:80px;background:linear-gradient(135deg,#f0e6d3 0%,#ddd0b8 50%,#c8bb9f 100%);${selectedStyle}border-radius:8px;padding:8px 6px;text-align:center;cursor:pointer;transition:all 0.2s;position:relative;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
                                    ${badgeHTML}
                                    <div style="font-size:1.2em;margin-bottom:2px">${card.special ? '🌟' : (card.icon || '🎴')}</div>
                                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.62em;color:${cc.text};line-height:1.2">${card.name}</div>
                                    <div style="display:flex;justify-content:center;gap:2px;margin-top:4px">${diceHTML}</div>
                                </div>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        // Update buttons for group attack mode
        const buttonsContainer = document.getElementById('general-card-selection-buttons');
        const amarakQuestBtn = this._findAmarakBlessingQuest ? this._findAmarakBlessingQuest() : null;
        const bonusDiceQuestBtn = this._findCombatBonusDiceQuest(hero);
        const amarakBtnHTML = (amarakQuestBtn && general.combatSkill)
            ? `<button class="phb${this._amarakBlessingActive ? ' checked' : ''}" onclick="game._useAmarakBlessing()">
                ${this._amarakBlessingActive ? '☑' : '☐'} Amarak's Blessing</button>`
            : '';
        const magicGateBtnHTML = bonusDiceQuestBtn
            ? `<button class="phb${this._findMagicGateToggled ? ' checked' : ''}" onclick="game._toggleFindMagicGate()">
                ${this._findMagicGateToggled ? '☑' : '☐'} Find Magic Gate</button>`
            : '';
        buttonsContainer.innerHTML = `
            ${amarakBtnHTML}
            ${magicGateBtnHTML}
            <button class="phb" onclick="game.confirmGroupCardSelection();">
                Confirm
            </button>
            <button class="phb" onclick="game.skipHeroInGroupAttack();">
                Skip ${hero.name}
            </button>
            <button class="phb" onclick="game.cancelGeneralAttack()">
                Cancel Attack
            </button>
        `;
        
        modal.classList.add('active');
    },
    
    toggleCardForGroupAttack(cardIndex) {
        const index = this.selectedCardsForAttack.indexOf(cardIndex);
        if (index > -1) {
            this.selectedCardsForAttack.splice(index, 1);
        } else {
            this.selectedCardsForAttack.push(cardIndex);
        }
        this.showGroupAttackCardSelection(); // Re-render
    },
    
    skipHeroInGroupAttack() {
        const heroIndex = this.groupAttack.currentSelectionHeroIndex;
        const hero = this.groupAttack.heroes[heroIndex];
        
        // Clear any selected cards
        this.selectedCardsForAttack = [];
        
        // Log the skip
        this.addLog(`⏭️ ${hero.name} skipped - will not participate in group attack`);
        
        // Move to next hero (same as confirmGroupCardSelection with 0 cards)
        this.confirmGroupCardSelection();
    },
    
    confirmGroupCardSelection() {
        const heroIndex = this.groupAttack.currentSelectionHeroIndex;
        const hero = this.groupAttack.heroes[heroIndex];
        const heroGlobalIndex = this.heroes.indexOf(hero);

        // If Find Magic Gate was toggled for this hero, retire the quest now
        if (this._findMagicGateToggled) {
            const bonusDiceQuest = this._findCombatBonusDiceQuest(hero);
            if (bonusDiceQuest) {
                const quest = hero.questCards[bonusDiceQuest.questIndex];
                if (quest) this._retireQuest(hero, quest, '+2 bonus dice (group combat)');
                this.addLog(`💫 ${hero.name} uses Find Magic Gate for +2 bonus dice!`);
                this.updateDeckCounts();
                this.renderHeroes();
            }
            // Store the bonus per hero in the groupAttack selections
            if (!this.groupAttack.heroFindMagicGate) this.groupAttack.heroFindMagicGate = {};
            this.groupAttack.heroFindMagicGate[heroGlobalIndex] = true;
            this._findMagicGateToggled = false;
        }
        
        // Check if hero selected any cards
        if (this.selectedCardsForAttack.length === 0) {
            this.addLog(`${hero.name} selected 0 cards - will not participate in group attack`);
        } else {
            // Store this hero's card selection
            this.groupAttack.heroCardSelections[heroGlobalIndex] = [...this.selectedCardsForAttack];
            this.addLog(`${hero.name} commits ${this.selectedCardsForAttack.length} cards to group attack`);
        }
        
        // Reset for next hero
        this.selectedCardsForAttack = [];
        this.groupAttack.currentSelectionHeroIndex++;
        
        // Check if all heroes have made their selection
        if (this.groupAttack.currentSelectionHeroIndex >= this.groupAttack.heroes.length) {
            // All selections complete - check how many are actually participating
            const participatingHeroIndices = Object.keys(this.groupAttack.heroCardSelections)
                .map(idx => parseInt(idx))
                .filter(idx => this.groupAttack.heroCardSelections[idx].length > 0);
            
            if (participatingHeroIndices.length === 0) {
                this.showInfoModal('⚠️', '<div>No heroes selected any cards! Attack cancelled.</div>');
                document.getElementById('general-card-selection-modal').classList.remove('active');
                this.groupAttack = null;
                this.selectedGeneralForAttack = null;
                this._amarakBlessingActive = false;
                return;
            }
            
            if (participatingHeroIndices.length === 1) {
                // Only one hero participating - convert to solo attack
                const soloHeroIndex = participatingHeroIndices[0];
                const soloHero = this.heroes[soloHeroIndex];
                this.addLog(`Only ${soloHero.name} participating - converting to solo attack`);
                
                // STORE the original active player (group attack initiator)
                const originalPlayerIndex = this.currentPlayerIndex;
                
                // Set up solo attack (temporarily change to solo attacker for card access)
                this.currentPlayerIndex = soloHeroIndex;
                this.selectedCardsForAttack = this.groupAttack.heroCardSelections[soloHeroIndex];
                const general = this.groupAttack.general;
                
                // Mark this as a solo-from-group attack (show penalty modal)
                this.soloFromGroupAttack = true;
                
                // Clear group state
                this.groupAttack = null;
                
                // Store original player for restoration after combat
                this.soloAttackOriginalPlayer = originalPlayerIndex;
                
                // Close modal and execute solo attack
                document.getElementById('general-card-selection-modal').classList.remove('active');
                this.currentCombat = { type: 'general', target: general };
                this.rollGeneralCombat();
                return;
            }
            
            // Multiple heroes participating - proceed with group attack
            document.getElementById('general-card-selection-modal').classList.remove('active');
            this.executeGroupAttack();
        } else {
            // Show next hero's card selection
            this.showGroupAttackCardSelection();
        }
    },
    
    executeGroupAttack() {
        // Store the ORIGINAL active player (don't change during group attack!)
        this.groupAttack.originalPlayerIndex = this.currentPlayerIndex;
        
        // Filter to only heroes who actually selected cards
        const participatingHeroes = this.groupAttack.heroes.filter(hero => {
            const heroGlobalIndex = this.heroes.indexOf(hero);
            const cards = this.groupAttack.heroCardSelections[heroGlobalIndex];
            return cards && cards.length > 0;
        });
        
        // Update attack order with only participating heroes
        this.groupAttack.attackOrder = participatingHeroes;
        this.groupAttack.heroes = participatingHeroes; // Update heroes list to only participants
        
        this.addLog(`🤝 ${participatingHeroes.length} heroes attacking: ${participatingHeroes.map(h => h.name).join(', ')}`);
        
        // Set up combat context
        this.currentCombat = { 
            type: 'group_general', 
            target: this.groupAttack.general 
        };
        
        // Start with first hero
        this.groupAttack.currentAttackerIndex = 0;
        this.rollNextGroupAttacker();
    },
    
    rollNextGroupAttacker() {
        console.log('=== rollNextGroupAttacker ===');
        console.log('currentAttackerIndex:', this.groupAttack.currentAttackerIndex);
        console.log('attackOrder length:', this.groupAttack.attackOrder.length);
        
        if (this.groupAttack.currentAttackerIndex >= this.groupAttack.attackOrder.length) {
            // All heroes have attacked - resolve group combat
            console.log('=== ALL HEROES ATTACKED - Calling resolveGroupAttack ===');
            this.resolveGroupAttack();
            return;
        }
        
        const hero = this.groupAttack.attackOrder[this.groupAttack.currentAttackerIndex];
        const heroGlobalIndex = this.heroes.indexOf(hero);
        const selectedCardIndices = this.groupAttack.heroCardSelections[heroGlobalIndex];
        
        console.log('Next attacker:', hero.name, 'with', selectedCardIndices.length, 'cards');
        
        // Set up for this hero's roll (but DON'T change currentPlayerIndex)
        this.selectedCardsForAttack = selectedCardIndices;
        
        // Roll combat for this hero
        this.rollGeneralCombatForGroup(hero, selectedCardIndices);
    },
    
    rollGeneralCombatForGroup(hero, selectedCardIndices) {
        console.log('=== rollGeneralCombatForGroup ===');
        console.log('Hero:', hero.name, 'Cards:', selectedCardIndices.length);
        const general = this.groupAttack.general;
        
        // Get cards to use
        const cardsToUse = selectedCardIndices
            .map(index => hero.cards[index])
            .filter(card => card !== undefined);
        
        if (cardsToUse.length === 0) {
            // This hero contributes no damage
            this.addLog(`${hero.name} has no valid cards - contributes 0 damage`);
            
            // Store hero's contribution
            if (!this.groupAttack.heroContributions) {
                this.groupAttack.heroContributions = [];
            }
            this.groupAttack.heroContributions.push({
                hero: hero,
                damage: 0,
                cardsUsed: []
            });
            
            // Move to next hero
            this.groupAttack.currentAttackerIndex++;
            this.rollNextGroupAttacker();
            return;
        }
        
        // BALAZARG COMBAT SKILL: Demonic Curse (apply to each hero in group)
        if (general.combatSkill === 'demonic_curse' && !this._amarakBlessingActive) {
            const curseRolls = [];
            const cardsLost = [];
            
            cardsToUse.forEach((card, idx) => {
                const roll = Math.floor(Math.random() * 6) + 1;
                curseRolls.push({ card: card.name, roll: roll, lost: roll === 1 });
                
                if (roll === 1) {
                    cardsLost.push({ card: card, originalIndex: selectedCardIndices[idx] });
                }
            });
            
            // Build styled curse results
            let curseHTML = `<div style="margin-bottom: 12px;">${hero.name} must test each card!</div>`;
            curseRolls.forEach(result => {
                const icon = result.lost ? '💀' : '✅';
                const color = result.lost ? '#ef4444' : '#4ade80';
                curseHTML += `<div style="padding: 4px 0; color: ${color};">${result.card}: [${result.roll}] ${result.lost ? 'LOST!' : 'Survived'} ${icon}</div>`;
            });
            
            if (cardsLost.length > 0) {
                curseHTML += `<div style="margin-top: 10px; color: #ef4444; font-weight: bold;">${cardsLost.length} card(s) lost to the curse!</div>`;
                
                // Remove cursed cards
                cardsLost.sort((a, b) => b.originalIndex - a.originalIndex);
                cardsLost.forEach(lost => {
                    const actualIndex = hero.cards.indexOf(lost.card);
                    if (actualIndex !== -1) {
                        hero.cards.splice(actualIndex, 1);
                        this.heroDiscardPile++;
                    }
                });
                
                this.addLog(`${hero.name} loses ${cardsLost.length} card(s) to Balazarg's curse!`);
            } else {
                curseHTML += `<div style="margin-top: 10px; color: #4ade80; font-weight: bold;">All cards survived the curse!</div>`;
            }
            
            // Rebuild cardsToUse after curse
            const remainingIndices = selectedCardIndices.filter(idx => {
                return !cardsLost.some(lost => lost.originalIndex === idx);
            });
            
            cardsToUse.length = 0;
            remainingIndices.forEach(idx => {
                const card = hero.cards[idx];
                if (card) cardsToUse.push(card);
            });
            
            if (cardsToUse.length === 0) {
                this.addLog(`${hero.name} lost all cards to curse - must still face ${general.name} unarmed (0 damage)`);
                
                curseHTML += `<div style="margin-top: 10px; color: #ef4444; font-weight: bold;">All cards destroyed! ${hero.name} must still face ${general.name} unarmed!</div>`;
                
                this.showInfoModal(`🔥 Demonic Curse vs ${hero.name}! 🔥`, curseHTML, () => {
                    if (!this.groupAttack.heroContributions) {
                        this.groupAttack.heroContributions = [];
                    }
                    this.groupAttack.heroContributions.push({
                        hero: hero,
                        damage: 0,
                        cardsUsed: [],
                        cursedNoCards: true // Still counts as contributor for penalties
                    });
                    
                    this.groupAttack.currentAttackerIndex++;
                    this.rollNextGroupAttacker();
                });
                return;
            }
            
            // Show curse results, then continue combat in callback
            this.showInfoModal(`🔥 Demonic Curse vs ${hero.name}! 🔥`, curseHTML, () => {
                this._continueGroupAttackerCombat(hero, general, cardsToUse);
            });
            return;
        }
        
        this._continueGroupAttackerCombat(hero, general, cardsToUse);
    },
    
    _continueGroupAttackerCombat(hero, general, cardsToUse) {
        
        // Reset Eagle Rider re-roll for each individual hero's roll in group
        if (hero.name === 'Eagle Rider') {
            this.eagleRiderRerollUsed = false;
        }
        // Reset Dwarf Dragon Slayer for each individual hero's roll in group
        if (hero.name === 'Dwarf') {
            this.dwarfDragonSlayerUsed = false;
        }
        // Reset combat bonus dice for each hero — unless already set via card-selection checkbox
        const heroGlobalIdx = this.heroes.indexOf(hero);
        const preToggled = this.groupAttack && this.groupAttack.heroFindMagicGate && this.groupAttack.heroFindMagicGate[heroGlobalIdx];
        if (!preToggled) {
            this._combatBonusDiceActive = false;
        } else {
            this._combatBonusDiceActive = true;
        }
        
        // Check for Find Magic Gate quest popup — skip if already handled via card-selection checkbox
        if (!preToggled) {
            const bonusDiceQuest = this._findCombatBonusDiceQuest(hero);
        if (bonusDiceQuest) {
            this._pendingCombatBonusDice = bonusDiceQuest;
            this._pendingGroupCombatArgs = { hero, general, cardsToUse };
            
            this.showInfoModal('💫 Find Magic Gate', `
                <div style="text-align: center;">
                    <div style="font-size: 2em; margin-bottom: 8px;">💫</div>
                    <div style="color: #d4af37; margin-bottom: 12px;">
                        Discard <strong>Find Magic Gate</strong> quest card to add <strong>+2 bonus dice</strong> to ${hero.name}'s roll vs ${general.name}?
                    </div>
                    <div style="color: #999; font-size: 0.9em; margin-bottom: 15px;">
                        This quest card will be permanently discarded.
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-primary" style="flex: 1; background: #dc2626;" onclick="game._useCombatBonusDiceGroup()">
                            💫 Use (+2 Dice)
                        </button>
                        <button class="btn" style="flex: 1; background: #666;" onclick="game._skipCombatBonusDiceGroup()">
                            Skip
                        </button>
                    </div>
                </div>
            `);
            const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
            if (defaultBtnDiv) defaultBtnDiv.style.display = 'none';
            return;
        }
        } // end !preToggled
        
        this._rollGroupAttackerDice(hero, general, cardsToUse);
    },
    
    _useCombatBonusDiceGroup() {
        const args = this._pendingGroupCombatArgs;
        const bonusDice = this._pendingCombatBonusDice;
        if (!args || !bonusDice) return;
        
        const hero = args.hero;
        
        // Retire quest card (mark as used, keep in questCards for history)
        const quest = hero.questCards[bonusDice.questIndex];
        if (quest) this._retireQuest(hero, quest, '+2 bonus dice (group combat)');
        this._combatBonusDiceActive = true;
        this._pendingCombatBonusDice = null;
        this._pendingGroupCombatArgs = null;
        
        this.addLog(`💫 ${hero.name} discards Find Magic Gate quest for +2 bonus combat dice!`);
        
        this.renderHeroes();
        this.updateDeckCounts();
        this.closeInfoModal();
        
        this._rollGroupAttackerDice(args.hero, args.general, args.cardsToUse);
    },
    
    _skipCombatBonusDiceGroup() {
        const args = this._pendingGroupCombatArgs;
        this._pendingCombatBonusDice = null;
        this._pendingGroupCombatArgs = null;
        this._combatBonusDiceActive = false;
        this.closeInfoModal();
        
        if (args) {
            this._rollGroupAttackerDice(args.hero, args.general, args.cardsToUse);
        }
    },
    
    _rollGroupAttackerDice(hero, general, cardsToUse) {
        // Calculate total dice
        const baseDice = cardsToUse.reduce((sum, card) => sum + card.dice, 0);
        const combatBonusDice = this._combatBonusDiceActive ? 2 : 0;
        const totalDice = baseDice + combatBonusDice;
        
        if (combatBonusDice > 0) {
            this.addLog(`💫 Find Magic Gate: +${combatBonusDice} bonus combat dice!`);
        }
        
        // Get hit requirement
        const getGeneralHitRequirement = (faction) => {
            if (faction === 'Orc') return 3;
            if (faction === 'Undead') return 4;
            if (faction === 'Demon') return 4;
            if (faction === 'Dragon') return 5;
            return 6;
        };
        
        const ambushBonusGroup = this._getAmbushBonus(hero, 'general', general.faction);
        const questBonusGroup = this._getQuestCombatBonus(hero);
        const hitReq = Math.max(2, getGeneralHitRequirement(general.faction) - this._getWoodsLoreBonus(hero) - ambushBonusGroup - questBonusGroup);
        if (this.groupAttack && this.groupAttack.hitReq === null) this.groupAttack.hitReq = hitReq;
        if (this._getWoodsLoreBonus(hero) > 0) {
            this.addLog(`🏹 Woods Lore: ${hero.name} gains +1 to all attack rolls in ${hero.location}!`);
        }
        if (ambushBonusGroup > 0) {
            this.addLog(`⚡ Ambush: ${hero.name} strikes from matching form — +1 to each die vs ${general.name}!`);
            this.ambushGeneralUsed = true;
        }
        if (questBonusGroup > 0) {
            this.addLog(`📜 Amulet of the Gods: ${hero.name} gains +1 to all attack rolls vs ${general.name}!`);
        }
        let damage = 0;
        const diceRolls = [];
        
        // Roll dice
        for (let i = 0; i < totalDice; i++) {
            const roll = Math.floor(Math.random() * 6) + 1;
            const hit = roll >= hitReq;
            if (hit) damage++;
            diceRolls.push({roll, hit});
        }
        
        // Eagle Rider Ground Attack: offer re-roll before applying parry and storing
        const canReroll = hero.name === 'Eagle Rider' 
            && this.eagleRiderAttackStyle === 'ground' 
            && (general.combatSkill !== 'no_rerolls' || this._amarakBlessingActive)
            && !this.eagleRiderRerollUsed;
        
        if (canReroll) {
            this._pendingRerollCombat = {
                type: 'group_general',
                hero: hero,
                general: general,
                cardsToUse: cardsToUse,
                totalDice: totalDice,
                hitReq: hitReq,
                diceRolls: diceRolls,
                damage: damage
            };
            
            const _erDieClass = { green: 'die-green', black: 'die-black', red: 'die-red', blue: 'die-blue' }[general.color] || 'die-black';
            const _erInlineBg = { 'die-green': 'linear-gradient(145deg,#16a34a,#15803d)', 'die-black': 'linear-gradient(145deg,#374151,#1f2937)', 'die-red': 'linear-gradient(145deg,#dc2626,#991b1b)', 'die-blue': 'linear-gradient(145deg,#3b82f6,#1d4ed8)' }[_erDieClass];
            let diceHTML = '';
            diceRolls.forEach(d => {
                const missStyle = d.hit ? '' : ' die-fade-miss';
                const opacity = d.hit ? '1' : '0.28';
                diceHTML += `<div class="die ${_erDieClass}${missStyle}" style="background:${_erInlineBg};opacity:${opacity};">${d.roll}</div>`;
            });

            const rerollHTML = `<div class="parchment-box" style="background:linear-gradient(135deg,#f0e6d3 0%,#ddd0b8 50%,#c8bb9f 100%);border:2px solid #8b7355;border-radius:8px;padding:10px;">
                <div class="parchment-banner" style="background:linear-gradient(135deg,#5c3d2ecc 0%,#4a2f20cc 100%);padding:6px 14px;margin:-10px -10px 10px -10px;border-radius:8px 8px 0 0;border-bottom:2px solid #8b7355;text-align:center;"><span class="hero-banner-name" style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#fff;font-size:0.9em;text-shadow:0 2px 4px rgba(0,0,0,0.9);letter-spacing:1.5px;">Combat Roll</span></div>
                <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#1a0f0a;margin-bottom:6px;">${general.name.toUpperCase()} — ${hitReq}+ to Hit</div>
                <div style="background:linear-gradient(135deg,${hero.color}cc 0%,${hero.color}99 100%);padding:5px 10px;margin:6px 0 4px 0;border-radius:5px;border:1px solid rgba(0,0,0,0.3);"><span style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#fff;font-size:0.9em;text-shadow:0 2px 4px rgba(0,0,0,0.9),0 0 10px rgba(0,0,0,0.5);letter-spacing:1.5px;">${hero.symbol} ${hero.name.toUpperCase()}</span></div>
                ${questBonusGroup > 0 ? `<div style="font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS',cursive;color:#3d2b1f;margin:2px 0 4px 0;"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a;">📜 Amulet of the Gods:</strong> +1 to all rolls</div>` : ''}
                <div class="dice-row" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:6px 0;">${diceHTML}</div>
                ${this._buildGeneralResultsPip(general, damage)}
            </div>`;

            this.showCombatResults('💥 Attack General', rerollHTML, '',
                `<button class="phb" style="margin-top:8px;" onclick="game.eagleRerollGroupCombat()">Ground Attack (Re-Roll All Dice)</button>
                 <button class="phb" style="margin-top:6px;" onclick="game.acceptGroupCombatRoll()">Continue</button>`,
                true);
            return;
        }
        
        // ===== DWARF DRAGON SLAYER RE-ROLL PHASE (group general) =====
        const hasFailedGroupDice = diceRolls.some(r => !r.hit);
        const canDwarfGroupReroll = hero.name === 'Dwarf' 
            && general.faction === 'Dragon'
            && hasFailedGroupDice
            && !this.dwarfDragonSlayerUsed;
        
        if (canDwarfGroupReroll) {
            this._pendingRerollCombat = {
                type: 'group_general',
                subtype: 'dragon_slayer',
                hero: hero,
                general: general,
                cardsToUse: cardsToUse,
                totalDice: totalDice,
                hitReq: hitReq,
                diceRolls: diceRolls,
                damage: damage
            };
            
            const _dsDieClass = { green: 'die-green', black: 'die-black', red: 'die-red', blue: 'die-blue' }[general.color] || 'die-black';
            const _dsInlineBg = { 'die-green': 'linear-gradient(145deg,#16a34a,#15803d)', 'die-black': 'linear-gradient(145deg,#374151,#1f2937)', 'die-red': 'linear-gradient(145deg,#dc2626,#991b1b)', 'die-blue': 'linear-gradient(145deg,#3b82f6,#1d4ed8)' }[_dsDieClass];
            let dwarfDiceHTML = '';
            diceRolls.forEach(d => {
                const missStyle = d.hit ? '' : ' die-fade-miss';
                const opacity = d.hit ? '1' : '0.28';
                dwarfDiceHTML += `<div class="die ${_dsDieClass}${missStyle}" style="background:${_dsInlineBg};opacity:${opacity};">${d.roll}</div>`;
            });
            const failedGroupCount = diceRolls.filter(r => !r.hit).length;

            const rerollHTML = `<div class="parchment-box" style="background:linear-gradient(135deg,#f0e6d3 0%,#ddd0b8 50%,#c8bb9f 100%);border:2px solid #8b7355;border-radius:8px;padding:10px;">
                <div class="parchment-banner" style="background:linear-gradient(135deg,#5c3d2ecc 0%,#4a2f20cc 100%);padding:6px 14px;margin:-10px -10px 10px -10px;border-radius:8px 8px 0 0;border-bottom:2px solid #8b7355;text-align:center;"><span class="hero-banner-name" style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#fff;font-size:0.9em;text-shadow:0 2px 4px rgba(0,0,0,0.9);letter-spacing:1.5px;">Combat Roll</span></div>
                <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#1a0f0a;margin-bottom:6px;">${general.name.toUpperCase()} — ${hitReq}+ to Hit</div>
                <div style="background:linear-gradient(135deg,${hero.color}cc 0%,${hero.color}99 100%);padding:5px 10px;margin:6px 0 4px 0;border-radius:5px;border:1px solid rgba(0,0,0,0.3);"><span style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#fff;font-size:0.9em;text-shadow:0 2px 4px rgba(0,0,0,0.9),0 0 10px rgba(0,0,0,0.5);letter-spacing:1.5px;">${hero.symbol} ${hero.name.toUpperCase()}</span></div>
                ${questBonusGroup > 0 ? `<div style="font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS',cursive;color:#3d2b1f;margin:2px 0 4px 0;"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a;">📜 Amulet of the Gods:</strong> +1 to all rolls</div>` : ''}
                <div class="dice-row" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:6px 0;">${dwarfDiceHTML}</div>
                ${this._buildGeneralResultsPip(general, damage)}
            </div>`;

            this.showCombatResults('💥 Attack General', rerollHTML, '',
                `<button class="phb" style="margin-top:8px;" onclick="game.dwarfRerollGroupCombat()">Dragon Slayer (Re-Roll ${failedGroupCount} Failed Dice)</button>
                 <button class="phb" style="margin-top:6px;" onclick="game.acceptGroupCombatRoll()">Continue</button>`,
                true);
            return;
        }
        // ================================
        
        this._finalizeGroupAttackerCombat(hero, general, cardsToUse, totalDice, hitReq, diceRolls, damage);
    },
    
    eagleRerollGroupCombat() {
        const state = this._pendingRerollCombat;
        if (!state || state.type !== 'group_general') return;
        
        this.eagleRiderRerollUsed = true;
        
        const newRolls = [];
        let newDamage = 0;
        for (let i = 0; i < state.totalDice; i++) {
            const roll = Math.floor(Math.random() * 6) + 1;
            const hit = roll >= state.hitReq;
            if (hit) newDamage++;
            newRolls.push({roll, hit});
        }
        
        this.addLog(`🦅 Eagle Rider re-rolls all dice! New result: ${newDamage} hit(s)`);
        
        document.getElementById('combat-results-modal').classList.remove('active');
        this._pendingRerollCombat = null;
        
        this._finalizeGroupAttackerCombat(state.hero, state.general, state.cardsToUse, state.totalDice, state.hitReq, newRolls, newDamage);
    },
    
    dwarfRerollGroupCombat() {
        const state = this._pendingRerollCombat;
        if (!state || state.type !== 'group_general') return;
        
        this.dwarfDragonSlayerUsed = true;
        
        // Re-roll only FAILED dice
        const newRolls = [];
        let newDamage = 0;
        for (let i = 0; i < state.diceRolls.length; i++) {
            if (state.diceRolls[i].hit) {
                newRolls.push(state.diceRolls[i]);
                newDamage++;
            } else {
                const roll = Math.floor(Math.random() * 6) + 1;
                const hit = roll >= state.hitReq;
                if (hit) newDamage++;
                newRolls.push({roll, hit});
            }
        }
        
        this.addLog(`⛏️ Dragon Slayer: Dwarf re-rolls failed dice! New result: ${newDamage} hit(s)`);
        
        document.getElementById('combat-results-modal').classList.remove('active');
        this._pendingRerollCombat = null;
        
        this._finalizeGroupAttackerCombat(state.hero, state.general, state.cardsToUse, state.totalDice, state.hitReq, newRolls, newDamage);
    },
    
    acceptGroupCombatRoll() {
        const state = this._pendingRerollCombat;
        if (!state || state.type !== 'group_general') return;
        
        document.getElementById('combat-results-modal').classList.remove('active');
        this._pendingRerollCombat = null;
        
        this._finalizeGroupAttackerCombat(state.hero, state.general, state.cardsToUse, state.totalDice, state.hitReq, state.diceRolls, state.damage);
    },
    
    _finalizeGroupAttackerCombat(hero, general, cardsToUse, totalDice, hitReq, diceRolls, damage) {
        // Check for Battle Luck re-roll opportunity (not against Varkolak)
        if (!this._battleLuckChecked && (general.combatSkill !== 'no_rerolls' || this._amarakBlessingActive)) {
            const blCard = this._findBattleLuckCard();
            const hasFailedDice = diceRolls.some(r => !r.hit);
            if (blCard && hasFailedDice) {
                const failedCount = diceRolls.filter(r => !r.hit).length;
                const _blDieClass = { green: 'die-green', black: 'die-black', red: 'die-red', blue: 'die-blue' }[general.color] || 'die-black';
                const _blInlineBg = { 'die-green': 'linear-gradient(145deg,#16a34a,#15803d)', 'die-black': 'linear-gradient(145deg,#374151,#1f2937)', 'die-red': 'linear-gradient(145deg,#dc2626,#991b1b)', 'die-blue': 'linear-gradient(145deg,#3b82f6,#1d4ed8)' }[_blDieClass];
                let dicePreviewHTML = '';
                diceRolls.forEach(d => {
                    const missStyle = d.hit ? '' : ' die-fade-miss';
                    const opacity = d.hit ? '1' : '0.28';
                    dicePreviewHTML += `<div class="die ${_blDieClass}${missStyle}" style="background:${_blInlineBg};opacity:${opacity};">${d.roll}</div>`;
                });
                this._pendingBattleLuck = { type: 'group_general', hero, general, cardsToUse, totalDice, hitReq, diceRolls, damage, battleLuckCard: blCard };
                const rerollHTML = `<div class="parchment-box" style="background:linear-gradient(135deg,#f0e6d3 0%,#ddd0b8 50%,#c8bb9f 100%);border:2px solid #8b7355;border-radius:8px;padding:10px;">
                    <div class="parchment-banner" style="background:linear-gradient(135deg,#5c3d2ecc 0%,#4a2f20cc 100%);padding:6px 14px;margin:-10px -10px 10px -10px;border-radius:8px 8px 0 0;border-bottom:2px solid #8b7355;text-align:center;"><span class="hero-banner-name" style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#fff;font-size:0.9em;text-shadow:0 2px 4px rgba(0,0,0,0.9);letter-spacing:1.5px;">Combat Roll</span></div>
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#1a0f0a;margin-bottom:6px;">${general.name.toUpperCase()} — ${hitReq}+ to Hit</div>
                    <div style="background:linear-gradient(135deg,${hero.color}cc 0%,${hero.color}99 100%);padding:5px 10px;margin:6px 0 4px 0;border-radius:5px;border:1px solid rgba(0,0,0,0.3);"><span style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#fff;font-size:0.9em;text-shadow:0 2px 4px rgba(0,0,0,0.9),0 0 10px rgba(0,0,0,0.5);letter-spacing:1.5px;">${hero.symbol} ${hero.name.toUpperCase()}</span></div>
                    ${this._getQuestCombatBonus(hero) > 0 ? `<div style="font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS',cursive;color:#3d2b1f;margin:2px 0 4px 0;"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a;">📜 Amulet of the Gods:</strong> +1 to all rolls</div>` : ''}
                    <div class="dice-row" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:6px 0;">${dicePreviewHTML}</div>
                    ${this._buildGeneralResultsPip(general, damage)}
                </div>`;
                this.showCombatResults('💥 Attack General', rerollHTML, '',
                    `<button class="phb" style="margin-top:8px;" onclick="game.useBattleLuck()">Battle Luck (Re-Roll ${failedCount} Failed Dice)</button>
                     <button class="phb" style="margin-top:6px;" onclick="game.declineBattleLuck()">Continue</button>`,
                    true);
                return;
            }
        }
        if (!this.groupAttack) this._battleLuckChecked = false;
        
        // Unicorn Steed: re-roll ALL failed dice once per combat (not against Varkolak)
        if (!this._unicornSteedRerollUsed && (general.combatSkill !== 'no_rerolls' || this._amarakBlessingActive)) {
            if (this._hasUnicornSteed(hero)) {
                const hasFailedDice = diceRolls.some(r => !r.hit);
                if (hasFailedDice) {
                    const failedCount = diceRolls.filter(r => !r.hit).length;
                    const _usDieClass = { green: 'die-green', black: 'die-black', red: 'die-red', blue: 'die-blue' }[general.color] || 'die-black';
                    const _usInlineBg = { 'die-green': 'linear-gradient(145deg,#16a34a,#15803d)', 'die-black': 'linear-gradient(145deg,#374151,#1f2937)', 'die-red': 'linear-gradient(145deg,#dc2626,#991b1b)', 'die-blue': 'linear-gradient(145deg,#3b82f6,#1d4ed8)' }[_usDieClass];
                    let dicePreviewHTML = '';
                    diceRolls.forEach(d => {
                        const missStyle = d.hit ? '' : ' die-fade-miss';
                        const opacity = d.hit ? '1' : '0.28';
                        dicePreviewHTML += `<div class="die ${_usDieClass}${missStyle}" style="background:${_usInlineBg};opacity:${opacity};">${d.roll}</div>`;
                    });
                    this._pendingUnicornReroll = { type: 'group_general', hero, general, cardsToUse, totalDice, hitReq, diceRolls, damage };
                    const rerollHTML = `<div class="parchment-box" style="background:linear-gradient(135deg,#f0e6d3 0%,#ddd0b8 50%,#c8bb9f 100%);border:2px solid #8b7355;border-radius:8px;padding:10px;">
                        <div class="parchment-banner" style="background:linear-gradient(135deg,#5c3d2ecc 0%,#4a2f20cc 100%);padding:6px 14px;margin:-10px -10px 10px -10px;border-radius:8px 8px 0 0;border-bottom:2px solid #8b7355;text-align:center;"><span class="hero-banner-name" style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#fff;font-size:0.9em;text-shadow:0 2px 4px rgba(0,0,0,0.9);letter-spacing:1.5px;">Combat Roll</span></div>
                        <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#1a0f0a;margin-bottom:6px;">${general.name.toUpperCase()} — ${hitReq}+ to Hit</div>
                        <div style="background:linear-gradient(135deg,${hero.color}cc 0%,${hero.color}99 100%);padding:5px 10px;margin:6px 0 4px 0;border-radius:5px;border:1px solid rgba(0,0,0,0.3);"><span style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#fff;font-size:0.9em;text-shadow:0 2px 4px rgba(0,0,0,0.9),0 0 10px rgba(0,0,0,0.5);letter-spacing:1.5px;">${hero.symbol} ${hero.name.toUpperCase()}</span></div>
                        <div class="dice-row" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:6px 0;">${dicePreviewHTML}</div>
                        ${this._buildGeneralResultsPip(general, damage)}
                    </div>`;
                    this.showCombatResults('💥 Attack General', rerollHTML, '',
                        `<button class="phb" style="margin-top:8px;" onclick="game._useUnicornSteedReroll()">Unicorn Steed (Re-Roll ${failedCount} Failed Dice)</button>
                         <button class="phb" style="margin-top:6px;" onclick="game._declineUnicornSteedReroll()">Continue</button>`,
                        true);
                    return;
                }
            }
        }
        if (!this.groupAttack) this._unicornSteedRerollUsed = false;
        
        // GORGUTT PARRY (applies to each hero individually)
        let parryMessage = '';
        if (general.combatSkill === 'parry' && !this._amarakBlessingActive) {
            const onesRolled = diceRolls.filter(d => d.roll === 1).length;
            if (onesRolled > 0) {
                const hitsParried = Math.min(onesRolled, damage);
                damage -= hitsParried;
                parryMessage = ` (${hitsParried} parried by Gorgutt)`;
                this.addLog(`Gorgutt parries ${hitsParried} of ${hero.name}'s hits!`);
            }
        }
        
        // Store contribution
        if (!this.groupAttack.heroContributions) {
            this.groupAttack.heroContributions = [];
        }
        
        this.groupAttack.heroContributions.push({
            hero: hero,
            damage: damage,
            cardsUsed: cardsToUse.map(c => c.name),
            diceRolls: diceRolls,
            parryMessage: parryMessage
        });
        
        // Accumulate total damage
        this.groupAttack.totalDamage += damage;
        
        this.addLog(`${hero.name}: ${cardsToUse.length} cards → ${totalDice} dice → ${damage} damage${parryMessage}`);
        
        // Discard used cards immediately
        cardsToUse.forEach(cardToRemove => {
            const currentIndex = hero.cards.indexOf(cardToRemove);
            if (currentIndex !== -1) {
                hero.cards.splice(currentIndex, 1);
                this.heroDiscardPile++;
            }
        });
        
        this.renderHeroes();
        
        // Move to next hero
        this.groupAttack.currentAttackerIndex++;
        
        // Small delay before next attacker
        setTimeout(() => {
            this.rollNextGroupAttacker();
        }, 500);
    },
    
    resolveGroupAttack() {
        console.log('=== === === resolveGroupAttack CALLED === === ===');
        this._battleLuckChecked = false;
        this._unicornSteedRerollUsed = false;
        const general = this.groupAttack.general;
        const totalDamage = this.groupAttack.totalDamage;
        
        console.log('General:', general.name);
        console.log('Total damage:', totalDamage);
        console.log('General health before damage:', general.health);
        
        // Apply damage to general
        general.health -= totalDamage;
        if (general.health <= 0) {
            general.health = 0;
            general.defeated = true;
        }
        
        // Set wound info if general survived
        if (!general.defeated && totalDamage > 0) {
            const initiatorIdx = this.groupAttack.initiatorPlayerIndex !== undefined 
                ? this.groupAttack.initiatorPlayerIndex : this.currentPlayerIndex;
            this._setGeneralWound(general, initiatorIdx);
        }
        
        this.addLog(`🤝 GROUP ATTACK TOTAL: ${totalDamage} damage to ${general.name}!`);

        // Build results HTML — parchment-box with per-hero pips
        const _grDieClass = { green: 'die-green', black: 'die-black', red: 'die-red', blue: 'die-blue' }[general.color] || 'die-black';
        const _grInlineBg = { 'die-green': 'linear-gradient(145deg,#16a34a,#15803d)', 'die-black': 'linear-gradient(145deg,#374151,#1f2937)', 'die-red': 'linear-gradient(145deg,#dc2626,#991b1b)', 'die-blue': 'linear-gradient(145deg,#3b82f6,#1d4ed8)' }[_grDieClass];

        const hitReqForDisplay = this.groupAttack.hitReq || '?';
        let resultsHTML = `<div class="parchment-box" style="background:linear-gradient(135deg,#f0e6d3 0%,#ddd0b8 50%,#c8bb9f 100%);border:2px solid #8b7355;border-radius:8px;padding:10px;">
            <div class="parchment-banner" style="background:linear-gradient(135deg,#5c3d2ecc 0%,#4a2f20cc 100%);padding:6px 14px;margin:-10px -10px 10px -10px;border-radius:8px 8px 0 0;border-bottom:2px solid #8b7355;text-align:center;"><span class="hero-banner-name" style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#fff;font-size:0.9em;text-shadow:0 2px 4px rgba(0,0,0,0.9);letter-spacing:1.5px;">Combat Roll</span></div>
            <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#1a0f0a;margin-bottom:6px;">${general.name.toUpperCase()} — ${hitReqForDisplay}+ to Hit</div>`;

        this.groupAttack.heroContributions.forEach(contrib => {
            const hasAmulet = this._getQuestCombatBonus(contrib.hero) > 0;
            const hasWoodsLore = this._getWoodsLoreBonus(contrib.hero) > 0;

            resultsHTML += `<div style="background:linear-gradient(135deg,${contrib.hero.color}cc 0%,${contrib.hero.color}99 100%);padding:5px 10px;margin:6px 0 4px 0;border-radius:5px;border:1px solid rgba(0,0,0,0.3);"><span style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#fff;font-size:0.9em;text-shadow:0 2px 4px rgba(0,0,0,0.9),0 0 10px rgba(0,0,0,0.5);letter-spacing:1.5px;">${contrib.hero.symbol} ${contrib.hero.name.toUpperCase()}</span></div>`;

            if (hasAmulet) resultsHTML += `<div style="font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS',cursive;color:#3d2b1f;margin:2px 0 4px 0;"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a;">📜 Amulet of the Gods:</strong> +1 to all rolls</div>`;
            if (hasWoodsLore) resultsHTML += `<div style="font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS',cursive;color:#3d2b1f;margin:2px 0 4px 0;"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a;">🏹 Woods Lore:</strong> +1 to all rolls</div>`;

            if (contrib.diceRolls && contrib.diceRolls.length > 0) {
                resultsHTML += `<div class="dice-row" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:6px 0;">`;
                contrib.diceRolls.forEach(dice => {
                    const missStyle = dice.hit ? '' : ' die-fade-miss';
                    const opacity = dice.hit ? '1' : '0.28';
                    resultsHTML += `<div class="die ${_grDieClass}${missStyle}" style="background:${_grInlineBg};opacity:${opacity};">${dice.roll}</div>`;
                });
                resultsHTML += `</div>`;
            }
        });

        resultsHTML += this._buildGeneralResultsPip(general, totalDamage);
        resultsHTML += `</div>`;

        // Check if general defeated
        if (general.defeated) {
            delete this.generalWounds[general.color]; // Clear wounds on defeat
            this.updateWarStatus();
            const contributingHeroes = this.groupAttack.heroContributions
                .filter(c => c.cardsUsed && c.cardsUsed.length > 0)
                .map(c => c.hero);

            const allDrawnCards = [];
            contributingHeroes.forEach(h => {
                const drawnCards = [];
                for (let i = 0; i < 3; i++) {
                    const drawnCard = this.generateRandomCard();
                    if (drawnCard) {
                        h.cards.push(drawnCard);
                        drawnCards.push(drawnCard);
                    }
                }
                allDrawnCards.push({ hero: h, cards: drawnCards });
            });

            this.pendingRewardCards = allDrawnCards;
            this.addLog(`${general.name} DEFEATED by group attack! ${contributingHeroes.length} contributing hero(es) draw 3 cards!`);

            this.showCombatResults('💥 Attack General', resultsHTML, '',
                `<button class="phb" style="margin-top:8px;" onclick="game.closeCombatResults()">Continue</button>`);

            // Check victory condition
            const allGeneralsDefeated = this.generals.every(g => g.defeated);
            if (allGeneralsDefeated) {
                this.pendingVictory = true;
            }
        } else {
            // General survived - only contributing heroes suffer defeat penalty
            console.log('=== GENERAL SURVIVED - Setting up penalties ===');
            console.log('General:', general.name, 'Health:', general.health);
            console.log('Contributing heroes:', this.groupAttack.heroContributions.filter(c => c.cardsUsed && c.cardsUsed.length > 0).map(c => c.hero.name));

            this.addLog(`${general.name} survived with ${general.health}/${general.maxHealth} life tokens`);

            // Check Sapphire regeneration (group attack counts as single combat)
            if (general.combatSkill === 'regeneration' && !this._amarakBlessingActive && totalDamage < general.maxHealth) {
                const healedAmount = general.maxHealth - general.health;
                general.health = general.maxHealth;
                this.addLog(`${general.name} regenerates to full health (${general.maxHealth}/${general.maxHealth})!`);
            }

            // Only heroes who contributed cards OR were cursed (committed cards but lost them all) suffer the penalty
            const penaltyHeroes = this.groupAttack.heroContributions
                .filter(c => (c.cardsUsed && c.cardsUsed.length > 0) || c.cursedNoCards)
                .map(c => c.hero);

            // Store group for penalty application AND retreat
            this.pendingGroupPenalty = {
                general: general,
                heroes: penaltyHeroes,
                retreatHeroes: penaltyHeroes // Only contributing heroes retreat
            };

            console.log('=== pendingGroupPenalty SET ===');
            console.log('pendingGroupPenalty:', this.pendingGroupPenalty);
            console.log('pendingGroupPenalty.heroes:', this.pendingGroupPenalty.heroes);

            this.showCombatResults('💥 Attack General', resultsHTML, '',
                `<button class="phb" style="margin-top:8px;" onclick="game.closeCombatResults()">Continue</button>`);
        }
        
        // Update UI
        this.actionsRemaining--;
        this.renderGenerals();
        this.renderTokens();
        this.renderHeroes();
        this.updateGameStatus();
        
        console.log('=== Before restoring player index ===');
        console.log('currentPlayerIndex:', this.currentPlayerIndex);
        console.log('originalPlayerIndex:', this.groupAttack ? this.groupAttack.originalPlayerIndex : 'no groupAttack');
        console.log('pendingGroupPenalty exists:', !!this.pendingGroupPenalty);
        
        // Restore original active player AFTER combat resolves
        if (this.groupAttack && this.groupAttack.originalPlayerIndex !== undefined) {
            this.currentPlayerIndex = this.groupAttack.originalPlayerIndex;
            console.log('=== Restored currentPlayerIndex to:', this.currentPlayerIndex);
        }
        
        console.log('=== NOT clearing groupAttack yet - keeping for penalty modal ===');
        
        // DON'T clear group attack state yet - wait for penalty modal to close
        // (It will be cleared in closeCombatResults or closeGroupPenaltyModal)
        this.selectedCardsForAttack = [];
    },
    
    engageMinionsAtLocation(locationName) {

        
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];

        // Ranger Archery: allow engaging at connected locations
        if (hero.location !== locationName) {
            if (hero.name === 'Ranger' && this.areLocationsConnected(hero.location, locationName)) {
                this.rangedAttack = true;
            } else {
                this.showInfoModal('⚠️', '<div>Hero is not at this location!</div>');
                return;
            }
        }
        
        const totalMinions = this.minions[locationName] ? 
            Object.values(this.minions[locationName]).reduce((a, b) => a + b, 0) : 0;

            
        if (totalMinions === 0) {
            this.showInfoModal('⚠️', '<div>No minions at this location!</div>');
            return;
        }
        

        // Hide tooltip before showing combat
        this.hideTooltip(true);

        this.showCombatModal('minions', locationName);

    },
    
    attackGeneralAtLocation(locationName) {
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        if (hero.location !== locationName) {
            this.showInfoModal('⚠️', '<div>Hero is not at this location!</div>');
            return;
        }
        
        const general = this.generals.find(g => g.location === locationName && !g.defeated);
        if (!general) {
            this.showInfoModal('⚠️', '<div>No general at this location!</div>');
            return;
        }
        
        const totalMinions = this.minions[locationName] ? 
            Object.values(this.minions[locationName]).reduce((a, b) => a + b, 0) : 0;
            
        if (totalMinions > 0) {
            this.showInfoModal('⚠️', '<div>You must defeat all minions before attacking the general!</div>');
            return;
        }
        
        // Hide tooltip before showing card selection
        this.hideTooltip(true);
        
        // Check if other heroes are at the same location for group attack
        const heroesAtLocation = this.heroes.filter(h => h.location === locationName && h.health > 0);
        
        if (heroesAtLocation.length > 1) {
            // GROUP ATTACK!
            this.initiateGroupAttack(general, heroesAtLocation);
        } else {
            // Solo attack - Show card selection modal
            this.showGeneralCardSelection(general);
        }
    },
    
    showGeneralCardSelection(general) {
        const hero = this.heroes[this.currentPlayerIndex];
        
        // Get applicable cards for this general - cards match by color
        const applicableCards = hero.cards.filter(card => 
            (card.color === general.color || card.color === "any")
        );
        
        const modal = document.getElementById('general-card-selection-modal');
        const content = document.getElementById('general-card-selection-content');
        
        const cardColorMap = {
            'red': '#dc2626',
            'blue': '#2563eb',
            'green': '#16a34a',
            'black': '#374151'
        };


        // Amarak's Blessing + Find Magic Gate quest checkboxes
        const amarakQuest = this._findAmarakBlessingQuest ? this._findAmarakBlessingQuest() : null;
        const bonusDiceQuest = this._findCombatBonusDiceQuest(hero);

        let cardsHTML = '';
        if (applicableCards.length === 0) {
            cardsHTML = `
                <div class="parchment-box">
                    <div class="parchment-banner"><span class="hero-banner-name">Select Cards To Attack General</span></div>
                    <div style="font-family:'Comic Sans MS',cursive;font-size:0.85em;color:#3d2b1f;padding:10px;text-align:center;">
                        ${hero.name} has no matching cards to attack this general.
                    </div>
                </div>`;
        } else {
            cardsHTML = `
                <div class="parchment-box">
                    <div class="parchment-banner"><span class="hero-banner-name">Select Cards To Attack General</span></div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;padding:4px 0;">
                        ${applicableCards.map((card) => {
                            const actualIndex = hero.cards.indexOf(card);
                            const cc = card.special ? { border: '#6d28a8', text: '#6d28a8' } : { border: cardColorMap[card.color] || '#8b7355', text: cardColorMap[card.color] || '#8b7355' };
                            const diceHTML = Array.from({ length: card.dice }).map(() =>
                                `<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:${cc.border};border-radius:3px;font-size:0.65em;border:1.5px solid rgba(0,0,0,0.3)">🎲</span>`
                            ).join('');
                            return `
                                <div class="general-card-option" data-card-index="${actualIndex}"
                                     onclick="game.toggleGeneralCardSelection(${actualIndex}, this)"
                                     style="flex:1 1 90px;max-width:120px;min-width:80px;background:linear-gradient(135deg,#f0e6d3 0%,#ddd0b8 50%,#c8bb9f 100%);border:3px solid ${cc.border};border-radius:8px;padding:8px 6px;text-align:center;cursor:pointer;transition:all 0.2s;position:relative;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
                                    <div style="font-size:1.2em;margin-bottom:2px">${card.special ? '🌟' : (card.icon || '🎴')}</div>
                                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.62em;color:${cc.text};line-height:1.2">${card.name}</div>
                                    <div style="display:flex;justify-content:center;gap:2px;margin-top:4px">${diceHTML}</div>
                                </div>`;
                        }).join('')}
                    </div>
                </div>`;
        }

        content.innerHTML = cardsHTML;

        // Store general and reset selected cards
        this.selectedGeneralForAttack = general;
        this.selectedCardsForAttack = [];

        // Buttons: quest checkboxes + Confirm + Cancel
        const buttonsContainer = document.getElementById('general-card-selection-buttons');
        const amarakBtnHTML = (amarakQuest && general.combatSkill)
            ? `<button class="phb${this._amarakBlessingActive ? ' checked' : ''}" onclick="game._useAmarakBlessing()">
                ${this._amarakBlessingActive ? '☑' : '☐'} Amarak's Blessing</button>`
            : '';
        const magicGateBtnHTML = bonusDiceQuest
            ? `<button class="phb${this._findMagicGateToggled ? ' checked' : ''}" onclick="game._toggleFindMagicGate()">
                ${this._findMagicGateToggled ? '☑' : '☐'} Find Magic Gate</button>`
            : '';
        buttonsContainer.innerHTML = `
            ${amarakBtnHTML}
            ${magicGateBtnHTML}
            <button class="phb" onclick="game.confirmGeneralAttack();">Confirm</button>
            <button class="phb" onclick="game.cancelGeneralAttack()">Cancel</button>
        `;

        modal.classList.add('active');
    },

    toggleGeneralCardSelection(cardIndex, element) {
        const isSelected = this.selectedCardsForAttack.includes(cardIndex);
        const hero = this.heroes[this.currentPlayerIndex];
        const card = hero ? hero.cards[cardIndex] : null;
        const cardColorMap = { 'red': '#dc2626', 'blue': '#2563eb', 'green': '#16a34a', 'black': '#374151' };
        const baseColor = card && card.special ? '#6d28a8' : (card ? (cardColorMap[card.color] || '#8b7355') : '#8b7355');

        if (isSelected) {
            this.selectedCardsForAttack = this.selectedCardsForAttack.filter(i => i !== cardIndex);
            element.classList.remove('selected');
            element.style.borderColor = baseColor;
            element.style.opacity = '';
            element.style.transform = '';
            const badge = element.querySelector('.card-badge-x');
            if (badge) badge.remove();
        } else {
            this.selectedCardsForAttack.push(cardIndex);
            element.classList.add('selected');
            element.style.borderColor = '#dc2626';
            element.style.opacity = '0.45';
            element.style.transform = 'scale(0.93)';
            if (!element.querySelector('.card-badge-x')) {
                const badge = document.createElement('div');
                badge.className = 'card-badge-x';
                badge.style.cssText = 'position:absolute;top:-8px;right:-8px;background:#dc2626;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;font-weight:bold;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.4);pointer-events:none;z-index:5;';
                badge.textContent = '\u2715';
                element.appendChild(badge);
            }
        }
    },

    confirmGeneralAttack() {
        console.log('=== confirmGeneralAttack called ===');
        console.log('groupAttack state:', this.groupAttack);
        console.log('selectedCardsForAttack:', this.selectedCardsForAttack);
        
        // Check if we're in group attack mode
        if (this.groupAttack) {
            console.log('=== GROUP ATTACK MODE - confirming selection ===');
            console.log('Current hero index:', this.groupAttack.currentSelectionHeroIndex);
            console.log('Total heroes:', this.groupAttack.heroes.length);
            console.log('Cards selected:', this.selectedCardsForAttack.length);
            // Allow 0 cards in group mode - hero can opt out
            this.confirmGroupCardSelection();
            return;
        }
        
        console.log('=== SOLO ATTACK MODE ===');
        
        // SOLO MODE: Require at least 1 card
        if (!this.selectedCardsForAttack || this.selectedCardsForAttack.length === 0) {
            console.error('No cards selected in solo mode');
            this.showInfoModal('⚠️', '<div>Please select at least one card!</div>');
            return;
        }
        
        console.log('selectedGeneralForAttack:', this.selectedGeneralForAttack);
        
        // Check if we have a valid general
        if (!this.selectedGeneralForAttack) {
            console.error('No general selected');
            this.addLog('ERROR: No general selected!');
            this.selectedCardsForAttack = [];
            return;
        }
        
        console.log('Closing modal and starting solo attack');
        
        const modal = document.getElementById('general-card-selection-modal');
        modal.classList.remove('active');
        
        // Set up combat context and roll immediately
        this.currentCombat = { type: 'general', target: this.selectedGeneralForAttack };
        
        console.log('Calling rollGeneralCombat');
        
        try {
            // Roll the dice immediately (skip the old combat modal)
            this.rollGeneralCombat();
            console.log('rollGeneralCombat completed');
        } catch (error) {
            console.error('Error in confirmGeneralAttack:', error);
            this.addLog('ERROR in combat: ' + error.message);
            this.selectedCardsForAttack = [];
            this.currentCombat = null;
        }
    },
    
    cancelGeneralAttack() {
        document.getElementById('general-card-selection-modal').classList.remove('active');
        this.selectedGeneralForAttack = null;
        this.selectedCardsForAttack = [];
        this._amarakBlessingActive = false;
        this._findMagicGateToggled = false;
    },

    _toggleFindMagicGate() {
        this._findMagicGateToggled = !this._findMagicGateToggled;
        // Re-render the active card selection modal to show checked state
        if (this.groupAttack) {
            this.showGroupAttackCardSelection();
        } else if (this.selectedGeneralForAttack) {
            this.showGeneralCardSelection(this.selectedGeneralForAttack);
        }
    },
    
    moveToLocation(locationName) {
        // Cancel any active movement
        if (this.activeMovement) {
            this.clearMovementMode();
        }
        
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        // Sorceress Shape Shifter: cannot enter Monarch City or Inns in enemy form
        if (this._isShapeshiftRestricted(locationName)) {
            this.showInfoModal('⚡ Shape Shifter', '<div style="color: #ef4444;">Cannot enter this location while in enemy form!</div><div style="color: #999; margin-top: 5px; font-size: 0.9em;">Monarch City and Inns are restricted when shape shifted.</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        
        // Check if locations are connected
        if (!this.areLocationsConnected(hero.location, locationName)) {
            this.showInfoModal('⚠️', `<div>No path connects ${hero.location} to ${locationName}!</div>`);
            return;
        }
        
        // Move hero
        hero.location = locationName;
        this.actionsRemaining--;
        this.addLog(`${hero.name} moved to ${locationName}`);
        
        // Hide tooltip and update display
        this.hideTooltip(true);
        this.renderHeroes();
        this.renderTokens(); // Always render tokens
        this.updateGameStatus(); // Update main screen
        
        // ALWAYS update map if it's open - don't rely on updateGameStatus
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            this.updateMapStatus();
            
            // Update action buttons since location and actions changed
            this.updateActionButtons();
        }
        
        // Check if there are minions or general at new location
        this.checkForCombatAtLocation(locationName);
    },
    
    showWizardTeleport(locationName) {
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️ No Actions', '<div>No actions remaining!</div>');
            return;
        }
        
        if (this.wizardTeleportUsedThisTurn) {
            this.showInfoModal('✨ Teleport', '<div>Wizard can only teleport once per turn!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        
        // If called with a specific location (from tooltip), teleport directly
        if (locationName) {
            hero.location = locationName;
            this.actionsRemaining--;
            
            this.wizardTeleportUsedThisTurn = true;
            this.addLog(`${hero.name} teleported to ${locationName} (wizard ability - no card consumed)`);
            
            this.hideTooltip(true);
            this.updateGameStatus();
            this.renderTokens();
            this.renderHeroes();
            
            const mapModal = document.getElementById('map-modal');
            if (mapModal && mapModal.classList.contains('active')) {
                this.updateMapStatus();
                this.updateMovementButtons();
                this.updateActionButtons();
            }
            
            this.checkForCombatAtLocation(locationName);
            return;
        }
        
        // Called from action tray - show interactive map highlighting
        // Wizard can teleport to ANY location except current
        const allLocations = [];
        for (let [locName, coords] of Object.entries(this.locationCoords)) {
            if (locName !== hero.location) {
                allLocations.push(locName);
            }
        }
        
        // Set movement state for Wizard Teleport
        this.activeMovement = {
            cardIndex: -1,
            movementType: 'Wizard Teleport',
            maxMoves: 1,
            movesRemaining: 1,
            startLocation: hero.location,
            cardUsed: null,
            validDestinations: allLocations,
            isWizardTeleport: true
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
    
    executeTeleport(locationName, cardIndex) {
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        const card = hero.cards[cardIndex];
        
        // Wizard teleport does NOT consume the card - that's the wizard's ability!
        // Just use an action and move
        
        // Move hero
        hero.location = locationName;
        this.actionsRemaining--;
        
        this.wizardTeleportUsedThisTurn = true;
            this.addLog(`${hero.name} teleported to ${locationName} (wizard ability - no card consumed)`);
        
        // Close modal and update display
        this.closeWizardTeleport();
        this.updateGameStatus();
        this.renderTokens();
        this.renderHeroes();
        
        // ALWAYS update map if it's open
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            this.updateMapStatus();
            
            // Update action buttons since location changed
            this.updateActionButtons();
        }
        
        // Check for combat
        this.checkForCombatAtLocation(locationName);
    },
    
    closeWizardTeleport() {
        document.getElementById('wizard-teleport-modal').classList.remove('active');
    },
    
    showMagicGateMovement() {
        const hero = this.heroes[this.currentPlayerIndex];
        
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const magicGateCards = [];
        hero.cards.forEach((card, index) => {
            if (card.type === 'Magic Gate') {
                magicGateCards.push(index);
            }
        });
        
        // Check gate-to-gate option
        const heroLocationData = this.locationCoords[hero.location];
        const isOnGate = heroLocationData && heroLocationData.magicGate;
        const otherGates = [];
        if (isOnGate) {
            for (let [name, coords] of Object.entries(this.locationCoords)) {
                if (coords.magicGate && name !== hero.location) {
                    otherGates.push(name);
                }
            }
        }
        const canGateToGate = isOnGate && otherGates.length > 0;
        const hasCards = magicGateCards.length > 0;
        
        if (!hasCards && !canGateToGate) {
            this.showInfoModal('⚠️', '<div>No Magic Gate cards in hand and not at a Magic Gate location!</div>');
            return;
        }
        
        // If only one option available, go directly to it
        if (hasCards && !canGateToGate) {
            this.showMovementCardSelection(magicGateCards, 'Magic Gate');
            return;
        }
        
        if (canGateToGate && !hasCards) {
            this.showGateToGateTravel(otherGates);
            return;
        }
        
        // Both options available - show choice modal
        let optionsHTML = `
            <div class="modal-title" style="margin-bottom: 10px;">🌀 Magic Gate Travel</div>
            <div style="text-align: center; color: #d4af37; margin-bottom: 15px;">
                Choose your travel method:
            </div>
            
            <div onclick="game.closeInfoModal(); game.showGateToGateTravel(null)" 
                 style="padding: 15px; margin: 10px 0; border: 2px solid #9333ea; border-radius: 8px; 
                        background: rgba(147, 51, 234, 0.15); cursor: pointer; transition: all 0.2s;"
                 onmouseover="this.style.background='rgba(147, 51, 234, 0.3)'"
                 onmouseout="this.style.background='rgba(147, 51, 234, 0.15)'">
                <div style="font-size: 1.1em; font-weight: bold; color: #c084fc; margin-bottom: 5px;">
                    🌀 Gate-to-Gate Travel
                </div>
                <div style="font-size: 0.9em; color: #999;">
                    Teleport to another Magic Gate — no card required!
                </div>
                <div style="font-size: 0.85em; color: #4ade80; margin-top: 5px;">
                    ${otherGates.length} gate${otherGates.length > 1 ? 's' : ''} available
                </div>
            </div>
            
            <div onclick="game.closeInfoModal(); game.showMovementCardSelection([${magicGateCards.join(',')}], 'Magic Gate')" 
                 style="padding: 15px; margin: 10px 0; border: 2px solid #d97706; border-radius: 8px; 
                        background: rgba(217, 119, 6, 0.15); cursor: pointer; transition: all 0.2s;"
                 onmouseover="this.style.background='rgba(217, 119, 6, 0.3)'"
                 onmouseout="this.style.background='rgba(217, 119, 6, 0.15)'">
                <div style="font-size: 1.1em; font-weight: bold; color: #fbbf24; margin-bottom: 5px;">
                    🎴 Discard a Magic Gate Card
                </div>
                <div style="font-size: 0.9em; color: #999;">
                    Teleport to the card's location or any existing gate
                </div>
                <div style="font-size: 0.85em; color: #fbbf24; margin-top: 5px;">
                    ${magicGateCards.length} card${magicGateCards.length > 1 ? 's' : ''} available
                </div>
            </div>
        `;
        
        this.showInfoModal('', optionsHTML);
        // Hide default Continue button
        const defaultBtn = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtn && defaultBtn.querySelector('button[onclick="game.closeInfoModal()"]')) {
            defaultBtn.style.display = 'none';
        }
    },
    
    showGateToGateTravel(otherGates) {
        const hero = this.heroes[this.currentPlayerIndex];
        
        // Recalculate if called from choice modal (null passed)
        if (!otherGates) {
            otherGates = [];
            for (let [name, coords] of Object.entries(this.locationCoords)) {
                if (coords.magicGate && name !== hero.location) {
                    otherGates.push(name);
                }
            }
        }
        
        if (otherGates.length === 0) {
            this.showInfoModal('⚠️', '<div>No other Magic Gates on the board!</div>');
            return;
        }
        
        this.gateToGateSelectedLocation = null;
        
        const factionColorMap = {
            'green': '#16a34a',
            'red': '#dc2626',
            'blue': '#2563eb',
            'black': '#6b7280',
            'purple': '#9333ea'
        };
        
        let gatesHTML = otherGates.map((gateName, i) => {
            const coords = this.locationCoords[gateName];
            const factionColor = factionColorMap[coords.faction] || '#8B7355';
            return `
                <div id="gate-travel-option-${i}" onclick="game.selectGateToGateDestination(${i}, '${gateName.replace(/'/g, "\\'")}')" 
                     style="padding: 12px; margin: 5px; border: 3px solid ${factionColor}; border-radius: 8px; 
                            background: rgba(0,0,0,0.5); cursor: pointer; text-align: center; min-width: 120px;
                            transition: all 0.2s; position: relative;">
                    <div style="font-size: 1.3em;">🌀</div>
                    <div style="font-size: 0.95em; font-weight: bold; color: ${factionColor};">${gateName}</div>
                    <div id="gate-travel-check-${i}" style="display: none; position: absolute; top: -5px; right: -5px; 
                         background: #9333ea; border-radius: 50%; width: 22px; height: 22px; line-height: 22px; 
                         font-size: 14px; text-align: center;">✓</div>
                </div>
            `;
        }).join('');
        
        const modalHTML = `
            <div class="modal-title" style="margin-bottom: 5px;">🌀 Gate-to-Gate Travel</div>
            <div style="text-align: center; font-size: 1em; color: #4ade80; font-weight: bold; margin-bottom: 15px;">
                No card required!
            </div>
            <div style="text-align: center; padding: 10px; background: rgba(147, 51, 234, 0.15); border: 2px solid #9333ea; border-radius: 8px; margin-bottom: 15px;">
                <div style="color: #c084fc; font-size: 0.95em;">
                    Select a Magic Gate destination:
                </div>
            </div>
            <div style="display: flex; flex-wrap: wrap; justify-content: center; margin-bottom: 15px;">
                ${gatesHTML}
            </div>
            <div style="text-align: center;">
                <button id="gate-travel-confirm-btn" class="btn" disabled onclick="game.confirmGateToGateTravel()" 
                        style="opacity: 0.5; padding: 10px 30px; font-size: 1.1em;">
                    Continue
                </button>
            </div>
        `;
        
        this.showInfoModal('', modalHTML);
        const defaultBtn = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtn && defaultBtn.querySelector('button[onclick="game.closeInfoModal()"]')) {
            defaultBtn.style.display = 'none';
        }
    },
    
    selectGateToGateDestination(displayIndex, locationName) {
        // Deselect all
        document.querySelectorAll('[id^="gate-travel-option-"]').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = '';
        });
        document.querySelectorAll('[id^="gate-travel-check-"]').forEach(el => {
            el.style.display = 'none';
        });
        
        // Select this one
        const cardEl = document.getElementById(`gate-travel-option-${displayIndex}`);
        const checkEl = document.getElementById(`gate-travel-check-${displayIndex}`);
        if (cardEl) { cardEl.style.opacity = '0.7'; cardEl.style.transform = 'scale(0.95)'; }
        if (checkEl) checkEl.style.display = 'block';
        
        this.gateToGateSelectedLocation = locationName;
        
        // Enable confirm
        const confirmBtn = document.getElementById('gate-travel-confirm-btn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.className = 'btn btn-primary';
            confirmBtn.style.opacity = '1';
        }
    },
    
    confirmGateToGateTravel() {
        const locationName = this.gateToGateSelectedLocation;
        if (!locationName) return;
        
        const hero = this.heroes[this.currentPlayerIndex];
        const oldLocation = hero.location;
        
        this.closeInfoModal();
        
        hero.location = locationName;
        this.actionsRemaining--;
        
        this.addLog(`🌀 ${hero.name} traveled gate-to-gate: ${oldLocation} → ${locationName} (no card discarded)`);
        
        this.renderTokens();
        this.renderHeroes();
        this.updateGameStatus();
        this.updateMapStatus();
        this.updateMovementButtons();
        this.updateActionButtons();
    },
    
    showHorseMovement() {
        const hero = this.heroes[this.currentPlayerIndex];
        const horseCards = [];
        
        hero.cards.forEach((card, index) => {
            if (card.type === 'Horse') {
                horseCards.push(index);
            }
        });
        
        if (horseCards.length === 0) {
            this.showInfoModal('⚠️', '<div>No Horse cards in hand!</div>');
            return;
        }
        
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        // Show card selection modal
        this.showMovementCardSelection(horseCards, 'Horse');
    },
    
    showEagleMovement() {
        const hero = this.heroes[this.currentPlayerIndex];
        const eagleCards = [];
        
        hero.cards.forEach((card, index) => {
            if (card.type === 'Eagle') {
                eagleCards.push(index);
            }
        });
        
        if (eagleCards.length === 0) {
            this.showInfoModal('⚠️', '<div>No Eagle cards in hand!</div>');
            return;
        }
        
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        // Show card selection modal
        this.showMovementCardSelection(eagleCards, 'Eagle');
    },
    
    showFootMovement() {
        if (this.archeryTargeting) this.clearArcheryMode();
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        // Foot movement doesn't require a card - go directly to interactive mode
        this.startInteractiveFootMovement();
    },
    
    startInteractiveFootMovement() {
        const hero = this.heroes[this.currentPlayerIndex];
        
        console.log(`[INIT] Starting Foot movement`);
        console.log(`[INIT] Hero at: ${hero.location}`);
        console.log(`[INIT] Max moves: 1`);
        
        // Set movement state (no card required for foot movement)
        this.activeMovement = {
            cardIndex: -1, // No card for foot movement
            movementType: 'Foot',
            maxMoves: 1,
            movesRemaining: 1,
            startLocation: hero.location,
            cardUsed: null // No card used
        };
        
        console.log(`[INIT] Movement state created:`, this.activeMovement);
        
        // Disable map dragging during movement
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'default';
            boardContainer.style.pointerEvents = 'none';
        }
        
        // Re-enable pointer events on the SVG itself so location clicks work
        const svg = document.getElementById('game-map');
        if (svg) {
            svg.style.pointerEvents = 'auto';
        }
        
        // Show movement indicator on map
        this.showMovementIndicator();
        console.log(`[INIT] After indicator, hero at: ${hero.location}`);
        
        // Highlight reachable locations
        this.highlightReachableLocations();
        console.log(`[INIT] After highlights, hero at: ${hero.location}`);
        console.log(`[INIT] ✅ Movement mode ready! Waiting for location click...`);
    },
    
    showMovementCardSelection(cardIndices, movementType) {
        const hero = this.heroes[this.currentPlayerIndex];
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'movement-card-modal';
        modal.style.zIndex = '16000';
        
        const ccMap = {
            blue: { border: '#3b82f6', text: '#2563eb' },
            red: { border: '#dc2626', text: '#dc2626' },
            green: { border: '#16a34a', text: '#16a34a' },
            black: { border: '#374151', text: '#374151' },
            any: { border: '#6d28a8', text: '#6d28a8' },
        };
        
        let cardsHTML = '';
        cardIndices.forEach(cardIndex => {
            const card = hero.cards[cardIndex];
            const cc = card.special ? { border: '#6d28a8', text: '#6d28a8' } : (ccMap[card.color] || ccMap.any);
            const iconDisplay = card.special ? '🌟' : (card.icon || '🎴');
            const shadow = card.special ? 'box-shadow:0 0 8px rgba(109,40,168,0.4);' : 'box-shadow:0 2px 6px rgba(0,0,0,0.3);';
            const diceHTML = Array.from({ length: card.dice }).map(() =>
                `<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:${cc.border};border-radius:3px;font-size:0.65em;border:1.5px solid rgba(0,0,0,0.3)">🎲</span>`
            ).join('');
            
            cardsHTML += `
                <div onclick="event.stopPropagation(); game.selectMovementCard(${cardIndex}, '${movementType}')" 
                     style="flex:1 1 90px;max-width:120px;min-width:80px;background:linear-gradient(135deg,#f0e6d3 0%,#ddd0b8 50%,#c8bb9f 100%);border:3px solid ${cc.border};border-radius:8px;padding:8px 6px;text-align:center;cursor:pointer;transition:all 0.2s;${shadow}"
                     onmouseover="this.style.boxShadow='0 0 12px rgba(212,175,55,0.5), 0 4px 12px rgba(0,0,0,0.4)';this.style.borderColor='#d4af37'"
                     onmouseout="this.style.boxShadow='${shadow.replace(/;$/,'')}';this.style.borderColor='${cc.border}'">
                    <div style="font-size:1.2em;margin-bottom:2px">${iconDisplay}</div>
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.62em;color:${cc.text};line-height:1.2">${card.name}</div>
                    <div style="display:flex;justify-content:center;gap:2px;margin-top:4px">${diceHTML}</div>
                </div>`;
        });
        
        const typeIcon = movementType === 'Magic Gate' ? '🌀' : movementType === 'Horse' ? '🐎' : '🦅';
        const typeDesc = movementType === 'Magic Gate' ? 'any Magic Gate location or card location' : 
                        movementType === 'Horse' ? 'up to 2 connected locations' : 'up to 4 connected locations';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <button onclick="this.closest('.modal').remove()" class="modal-close-btn">×</button>
                <div class="modal-heading" style="text-align:center;color:#d4af37;font-size:1.15em;margin-bottom:4px">${typeIcon} ${movementType} Movement</div>
                <div class="modal-heading" style="text-align:center;color:#d4af37;font-size:0.85em;margin-bottom:12px">
                    Select a card to discard and move to ${typeDesc}
                </div>
                <div class="parchment-box"><div class="parchment-banner"><span class="hero-banner-name">Select a Card to Discard</span></div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
                        ${cardsHTML}
                    </div>
                </div>
                <button class="phase-btn" onclick="this.closest('.modal').remove()" style="margin-top:12px">
                    Cancel
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    selectMovementCard(cardIndex, movementType) {
        console.log(`[CARD SELECT] Selected card at index ${cardIndex} for ${movementType}`);
        
        // Close card selection modal
        const modal = document.getElementById('movement-card-modal');
        if (modal) modal.remove();
        
        // Show location selection based on movement type
        if (movementType === 'Magic Gate') {
            this.showMagicGateDestinations(cardIndex);
        } else if (movementType === 'Horse') {
            console.log(`[CARD SELECT] Calling showHorseDestinations`);
            this.showHorseDestinations(cardIndex);
        } else if (movementType === 'Eagle') {
            console.log(`[CARD SELECT] Calling showEagleDestinations`);
            this.showEagleDestinations(cardIndex);
        }
    },
    
    showMagicGateDestinations(cardIndex) {
        const hero = this.heroes[this.currentPlayerIndex];
        const card = hero.cards[cardIndex];
        
        // Get all magic gate locations
        const magicGateLocations = [];
        for (let [locationName, coords] of Object.entries(this.locationCoords)) {
            if (coords.magicGate && locationName !== hero.location) {
                magicGateLocations.push(locationName);
            }
        }
        
        // Also add the card's own location (if it's a valid location and not current)
        if (this.locationCoords[card.name] && !magicGateLocations.includes(card.name) && card.name !== hero.location) {
            magicGateLocations.push(card.name);
        }
        
        // Set movement state for Magic Gate
        this.activeMovement = {
            cardIndex: cardIndex,
            movementType: 'Magic Gate',
            maxMoves: 1,
            movesRemaining: 1,
            startLocation: hero.location,
            cardUsed: card,
            validDestinations: magicGateLocations
        };
        
        // Disable map dragging during movement
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'default';
            boardContainer.style.pointerEvents = 'none';
        }
        
        // Re-enable pointer events on the SVG
        const svg = document.getElementById('game-map');
        if (svg) {
            svg.style.pointerEvents = 'auto';
        }
        
        // Show movement indicator
        this.showMovementIndicator();
        
        // Highlight magic gate destinations on map
        this.highlightMagicGateLocations(magicGateLocations);
    },
    
    highlightMagicGateLocations(locations) {
        // Remove old highlights
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        
        locations.forEach(locationName => {
            const coords = this.locationCoords[locationName];
            if (!coords) return;
            
            const svg = document.getElementById('game-map');
            const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            highlight.classList.add('location-highlight');
            highlight.setAttribute('cx', coords.x);
            highlight.setAttribute('cy', coords.y);
            highlight.setAttribute('r', coords.type === 'inn' ? '34' : '45');
            highlight.setAttribute('fill', 'rgba(80, 0, 160, 0.55)');
            highlight.setAttribute('stroke', '#c084fc');
            highlight.setAttribute('stroke-width', '4');
            highlight.setAttribute('stroke-dasharray', '6,4');
            highlight.setAttribute('pointer-events', 'none');
            
            // Add pulsing animation
            const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animate.setAttribute('attributeName', 'opacity');
            animate.setAttribute('values', '0.6;1;0.6');
            animate.setAttribute('dur', '2s');
            animate.setAttribute('repeatCount', 'indefinite');
            highlight.appendChild(animate);
            
            (document.getElementById('effects-layer') || svg).appendChild(highlight);
        });
    },
    
    showHorseDestinations(cardIndex) {
        const hero = this.heroes[this.currentPlayerIndex];
        const card = hero.cards[cardIndex];
        
        // Start interactive movement mode
        this.startInteractiveMovement(cardIndex, 'Horse', 2);
    },
    
    showEagleDestinations(cardIndex) {
        const hero = this.heroes[this.currentPlayerIndex];
        const card = hero.cards[cardIndex];
        
        // Start interactive movement mode
        this.startInteractiveMovement(cardIndex, 'Eagle', 4);
    },
    
    startInteractiveMovement(cardIndex, movementType, maxMoves) {
        const hero = this.heroes[this.currentPlayerIndex];
        const card = hero.cards[cardIndex];
        
        console.log(`[INIT] Starting ${movementType} movement`);
        console.log(`[INIT] Hero at: ${hero.location}`);
        console.log(`[INIT] Max moves: ${maxMoves}`);
        console.log(`[INIT] Card: ${card.name}`);
        
        // Set movement state
        this.activeMovement = {
            cardIndex: cardIndex,
            movementType: movementType,
            maxMoves: maxMoves,
            movesRemaining: maxMoves,
            startLocation: hero.location,
            cardUsed: card
        };
        
        console.log(`[INIT] Movement state created:`, this.activeMovement);
        
        // Disable map dragging during movement
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'default';
            boardContainer.style.pointerEvents = 'none'; // Disable pan/zoom
        }
        
        // Re-enable pointer events on the SVG itself so location clicks work
        const svg = document.getElementById('game-map');
        if (svg) {
            svg.style.pointerEvents = 'auto';
        }
        
        // Show movement indicator on map
        this.showMovementIndicator();
        console.log(`[INIT] After indicator, hero at: ${hero.location}`);
        
        // Highlight reachable locations
        this.highlightReachableLocations();
        console.log(`[INIT] After highlights, hero at: ${hero.location}`);
        console.log(`[INIT] ✅ Movement mode ready! Waiting for location click...`);
    },
    
    showMovementIndicator() {
        const hero = this.heroes[this.currentPlayerIndex];
        const movement = this.activeMovement;
        
        // Create or update movement indicator banner
        let indicator = document.getElementById('movement-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'movement-indicator';
            const mapBar = document.querySelector('.map-top-bar');
            const topPos = mapBar ? (mapBar.getBoundingClientRect().top) + 'px' : '40px';
            indicator.style.cssText = `
                position: fixed;
                top: ${topPos};
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.9);
                border: 3px solid #d4af37;
                border-radius: 10px;
                padding: 12px 18px;
                z-index: 25000;
                text-align: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.8);
                max-width: 280px;
            `;
            document.body.appendChild(indicator);
        }
        
        const icons = {
            'Foot': '🥾',
            'Horse': '🐎',
            'Eagle': '🦅',
            'Magic Gate': '🌀',
            'Wizard Teleport': '✨',
            'Special Magic Gate': '💫',
            'Hammer of Valor': '🔨',
            'Spell of Purity': '✨',
            'Elven Archers': '🏹',
            'Battle Strategy': '⚔️',
            'Battle Strategy — Push General': '🛡️',
            "King's Guard": '👑'
        };
        const icon = icons[movement.movementType] || '🥾';
        
        let cardInfo = '';
        if (movement.cardUsed) {
            cardInfo = `<div style="color: #f4e4c1; margin-bottom: 6px; font-size: 0.85em;">
                Using: ${movement.cardUsed.icon} ${movement.cardUsed.name}
            </div>`;
        }
        
        const isTeleport = movement.movementType === 'Magic Gate' || movement.movementType === 'Wizard Teleport' || movement.movementType === 'Special Magic Gate' || movement.movementType === 'Hammer of Valor' || movement.movementType === 'Spell of Purity' || movement.movementType === 'Elven Archers' || movement.movementType === 'Battle Strategy' || movement.movementType === 'Battle Strategy — Push General' || movement.movementType === "King's Guard";
        const instructionText = movement.movementType === 'Special Magic Gate' ?
            'Click a highlighted location to place a Magic Gate' :
            movement.movementType === 'Hammer of Valor' ?
            `Click a highlighted location to move ${this.heroes[this.specialMoveHeroCard?.targetHeroIndex]?.name || 'hero'}` :
            movement.movementType === 'Spell of Purity' ?
            'Click a highlighted location to purify' :
            movement.movementType === 'Elven Archers' ?
            'Click a highlighted Green location to clear minions' :
            movement.movementType === 'Battle Strategy' ?
            'Click a highlighted location to defeat all minions' :
            movement.movementType === 'Battle Strategy — Push General' ?
            'Click a General to push them back one location' :
            isTeleport ? 
            'Click a highlighted location to teleport' : 
            'Click connected locations to move';
        const movesInfo = (isTeleport && movement.movementType !== 'Elven Archers' && movement.movementType !== 'Battle Strategy') ? '' : `
            <div style="color: #4ade80; font-size: 0.95em; margin-bottom: 6px;">
                ${movement.movementType === 'Elven Archers' ? 'Locations Remaining' : movement.movementType === 'Battle Strategy' ? 'Locations Remaining' : 'Moves Remaining'}: ${movement.movesRemaining} / ${movement.maxMoves}
            </div>`;
        
        indicator.innerHTML = `
            <div style="color: #ffd700; font-size: 1em; font-weight: bold; margin-bottom: 4px; font-family:'Cinzel',Georgia,serif;">
                ${icon} ${isTeleport ? movement.movementType : movement.movementType + ' Movement'}
            </div>
            ${cardInfo}
            ${movesInfo}
            <div style="font-size: 0.8em; color: #d4af37;">
                ${instructionText}
            </div>
            <button class="btn btn-danger" onclick="game.cancelMovement()" style="margin-top: 8px; width: 100%; font-size: 0.85em; padding: 6px;">
                ✕ Cancel Movement
            </button>
        `;
    },
    
    highlightReachableLocations() {
        // Remove old highlights
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        
        const hero = this.heroes[this.currentPlayerIndex];
        let reachable = this.getConnectedLocations(hero.location);
        
        // Sorceress Shape Shifter: filter out restricted locations
        reachable = this._filterShapeshiftLocations(reachable);
        
        // Add highlights to reachable locations on the map
        reachable.forEach(locationName => {
            const coords = this.locationCoords[locationName];
            if (!coords) return;
            
            const svg = document.getElementById('game-map');
            const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            highlight.classList.add('location-highlight');
            highlight.setAttribute('cx', coords.x);
            highlight.setAttribute('cy', coords.y);
            highlight.setAttribute('r', coords.type === 'inn' ? '34' : '45');
            highlight.setAttribute('fill', 'rgba(0, 120, 70, 0.55)');
            highlight.setAttribute('stroke', '#43ffa4');
            highlight.setAttribute('stroke-width', '4');
            highlight.setAttribute('stroke-dasharray', '6,4');
            highlight.setAttribute('pointer-events', 'none');
            
            // Add pulsing animation
            const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animate.setAttribute('attributeName', 'opacity');
            animate.setAttribute('values', '0.6;1;0.6');
            animate.setAttribute('dur', '2s');
            animate.setAttribute('repeatCount', 'indefinite');
            highlight.appendChild(animate);
            
            (document.getElementById('effects-layer') || svg).appendChild(highlight); // Add to background
        });
    },
    
    // Sorceress Shape Shifter: returns true if location is restricted in enemy form
    _isShapeshiftRestricted(locationName) {
        if (!this.shapeshiftForm) return false;
        const hero = this.heroes[this.currentPlayerIndex];
        if (hero.name !== 'Sorceress') return false;
        if (locationName === 'Monarch City') return true;
        const locData = this.locationCoords[locationName];
        if (locData && locData.type === 'inn') return true;
        return false;
    },
    
    // Filter out shapeshift-restricted locations from a list
    _filterShapeshiftLocations(locations) {
        if (!this.shapeshiftForm) return locations;
        const hero = this.heroes[this.currentPlayerIndex];
        if (hero.name !== 'Sorceress') return locations;
        return locations.filter(loc => !this._isShapeshiftRestricted(loc));
    },
    
    getConnectedLocations(fromLocation) {
        // Get locations that are directly connected per spreadsheet data
        return this.locationConnections[fromLocation] || [];
    },
    
});
