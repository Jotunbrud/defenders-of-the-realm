// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Minion Combat & Location Actions
// ═══════════════════════════════════════════════════════════════

Object.assign(game, {
    closeLocationActions(event) {
        if (!event || event.target.id === 'location-actions-modal') {
            document.getElementById('location-actions-modal').classList.remove('active');
        }
    },
    
    renderGenerals() {
        const panel = document.getElementById('generals-panel');
        if (!panel) return;

        // General display metadata
        const GENERAL_META = {
            'Balazarg': {
                bannerGradient: 'linear-gradient(135deg, #dc2626cc 0%, #dc262699 100%)',
                tokenColor: '#dc2626',
                hitReq: '4+ to Hit',
                majorWoundThreshold: 1,
                combatSkillName: 'Demonic Curse',
                combatSkillDesc: 'Players must roll a die for each card to be played prior to the Battle. Discard a card for each 1 rolled.',
                heroDefeatedDesc: 'Hero loses D3 life tokens & ALL hero cards.'
            },
            'Gorgutt': {
                bannerGradient: 'linear-gradient(135deg, #16a34acc 0%, #16a34a99 100%)',
                tokenColor: '#16a34a',
                hitReq: '3+ to Hit',
                majorWoundThreshold: 2,
                combatSkillName: 'Parry',
                combatSkillDesc: 'Gorgutt parries successful attacks for each 1 rolled. Eliminate 1 hit for each die with a 1 at the end of re-rolls.',
                heroDefeatedDesc: 'Hero loses 2 life tokens & 2 hero cards.'
            },
            'Varkolak': {
                bannerGradient: 'linear-gradient(135deg, #1f2937cc 0%, #1f293799 100%)',
                tokenColor: '#1f2937',
                hitReq: '4+ to Hit',
                majorWoundThreshold: 0,
                combatSkillName: 'No Rerolls',
                combatSkillDesc: 'Player may not use any re-rolls or special skills against Varkolak.',
                heroDefeatedDesc: 'Hero loses D6 life tokens & D6 hero cards.'
            },
            'Sapphire': {
                bannerGradient: 'linear-gradient(135deg, #2563ebcc 0%, #2563eb99 100%)',
                tokenColor: '#2563eb',
                hitReq: '5+ to Hit',
                majorWoundThreshold: 0,
                combatSkillName: 'Regeneration',
                combatSkillDesc: 'Returns to full health if not defeated in a single combat.',
                heroDefeatedDesc: 'Hero loses 3 life tokens & D6 hero cards.'
            },
            'White Rabbit': {
                bannerGradient: 'linear-gradient(135deg, #ffffffcc 0%, #cccccc99 100%)',
                tokenColor: '#ffffff',
                hitReq: '3+ to Hit',
                majorWoundThreshold: 0,
                combatSkillName: 'Test',
                combatSkillDesc: 'Test general for development.',
                heroDefeatedDesc: 'Hero loses 2 life tokens & 2 hero cards.'
            }
        };

        panel.innerHTML = this.generals.map(general => {
            const meta = GENERAL_META[general.name];
            if (!meta) return '';

            // Build life tracker boxes
            let trackerBoxes = '';
            for (let i = general.maxHealth; i >= 1; i--) {
                const isLost = i > general.health;
                const isMajor = meta.majorWoundThreshold > 0 && i <= meta.majorWoundThreshold;
                const isCurrent = i === general.health && !general.defeated;

                let classes = 'lt-box';
                if (isLost) classes += ' lost';
                if (isMajor) classes += ' major';

                const marker = isCurrent
                    ? `<span class="lt-marker" style="background:${meta.tokenColor}">${general.symbol}</span>`
                    : '';

                trackerBoxes += `<div class="${classes}">${marker}${i}</div>`;
            }

            // Skull box
            const skullMarker = general.defeated
                ? `<span class="lt-marker" style="background:${meta.tokenColor}">${general.symbol}</span>`
                : '';
            trackerBoxes += `<div class="lt-box skull">${skullMarker}☠️</div>`;

            // Wound status line
            let woundHTML = '';
            const wound = this.generalWounds[general.color];
            if (wound && !general.defeated) {
                const wLabel = wound.type === 'major' ? '⚠️ Major Wounds' : '⚔️ Minor Wounds';
                const healingStatus = wound.healingCountdown > 0 
                    ? `Not healing (${wound.healingCountdown} turn${wound.healingCountdown !== 1 ? 's' : ''} remaining)`
                    : 'Healing (+1 HP/turn)';
                const healColor = wound.healingCountdown > 0 ? '#8b7355' : '#16a34a';
                const movementNote = wound.type === 'major' ? '<div style="margin-top:2px"><strong>🚫 Cannot advance</strong></div>' : '';
                woundHTML = `<div style="margin-top:6px; padding-top:6px; border-top:1px solid rgba(139,115,85,0.25);">
                    <div class="g-hi-title" style="font-size:0.72em;"><strong>${wLabel}:</strong> <span style="color:${healColor}">${healingStatus}</span>${movementNote}</div>
                </div>`;
            }

            // Defeated state
            if (general.defeated) {
                return `
                    <div class="general-placard defeated">
                        <div class="general-banner" style="background: ${meta.bannerGradient};">
                            <div>
                                <div class="general-banner-name">${general.symbol} ${general.name}</div>
                            </div>
                        </div>
                        <div class="general-body">
                            <div class="g-defeated-badge">✅ DEFEATED</div>
                            <div class="life-tracker-wrap">
                                <div class="lt-hit-req">${meta.hitReq}</div>
                                <div class="life-tracker">${trackerBoxes}</div>
                            </div>
                        </div>
                    </div>`;
            }

            // Active general
            return `
                <div class="general-placard">
                    <div class="general-banner" style="background: ${meta.bannerGradient};">
                        <div>
                            <div class="general-banner-name">${general.symbol} ${general.name}</div>
                        </div>
                    </div>
                    <div class="general-body">
                        <div class="g-hi-block">
                            <div class="g-hi-title"><strong>Combat Skill:</strong> ${meta.combatSkillDesc}</div>
                        </div>
                        <div class="g-hi-block">
                            <div class="g-hi-title"><strong>Hero Defeated:</strong> ${meta.heroDefeatedDesc}</div>
                        </div>
                        <div class="life-tracker-wrap">
                            <div class="lt-hit-req">${meta.hitReq}</div>
                            <div class="life-tracker">${trackerBoxes}</div>
                        </div>
                        ${woundHTML}
                    </div>
                </div>`;
        }).join('');
    },
    
    updateGameStatus() {
        // Update taint crystal tracker
        const taintElement = document.getElementById('taint-remaining');
        if (taintElement) {
            taintElement.textContent = this.taintCrystalsRemaining;
        }
        
        // Re-render generals panel to update minion counts
        this.renderGenerals();
        
        // Show/hide hero-specific ability buttons
        const currentHero = this.heroes[this.currentPlayerIndex];
        // COMMENTED OUT: Cleric Heal Ally removed - may be used for future hero
        // const clericBtn = document.getElementById('cleric-heal-btn');
        const wizardBtn = document.getElementById('wizard-teleport-btn');
        
        // if (clericBtn) {
        //     clericBtn.style.display = currentHero.name === 'Cleric' ? 'inline-block' : 'none';
        // }
        if (wizardBtn) {
            wizardBtn.style.display = currentHero.name === 'Wizard' ? 'inline-block' : 'none';
        }
        
        // Also update map status if map modal is open
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            this.updateMapStatus();
        }
    },
    
    selectHero(index) {
        this.currentPlayerIndex = index;
        this.updateGameStatus();
        this.renderHeroes();
        this.renderTokens();
    },
    
    engageMinions() {
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        const locationMinions = this.minions[hero.location];
        
        if (!locationMinions) {
            this.minions[hero.location] = { red: 0, blue: 0, green: 0, black: 0 };
        }
        
        const totalMinions = Object.values(this.minions[hero.location]).reduce((a, b) => a + b, 0);
        if (totalMinions === 0) {
            this.showInfoModal('⚠️', '<div>No minions at this location!</div>');
            return;
        }
        
        this.showCombatModal('minions', hero.location);
    },
    
    attackGeneral() {
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        const general = this.generals.find(g => g.location === hero.location && !g.defeated);
        
        if (!general) {
            this.showInfoModal('⚠️', '<div>No general at this location!</div>');
            return;
        }
        
        this.showCombatModal('general', general);
    },
    
    showCombatModal(type, target) {

        const modal = document.getElementById('combat-modal');
        const title = document.getElementById('combat-title');
        const content = document.getElementById('combat-content');
        
        // Apply correct title styling (Cinzel 900, #d4af37, 1.15em — matches modal-title-bar in mockup)
        if (title) {
            title.style.cssText = "font-family:'Cinzel',Georgia,serif;font-weight:900;text-align:center;font-size:1.15em;color:#d4af37;margin-bottom:8px;font-size:1.15em;";
        }
        
        if (type === 'minions') {

            title.textContent = this.rangedAttack ? '🏹 Archery — Engage Minions' : '⚔️ Engage Minions';
            const minionsObj = this.minions[target];

            const colorToFaction = {
                'green': { name: 'Orcs', hitReq: 3, color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
                'black': { name: 'Undead', hitReq: 4, color: '#374151', bg: 'rgba(55,65,81,0.1)' },
                'red': { name: 'Demons', hitReq: 4, color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
                'blue': { name: 'Dragons', hitReq: 5, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' }
            };
            
            const hero = this.heroes[this.currentPlayerIndex];
            const woodsBonus = this._getWoodsLoreBonus(hero);
            const questBonus = this._getQuestCombatBonus(hero);
            const hasBlessed = hero.name === 'Cleric' && Object.entries(minionsObj).some(([c, n]) => n > 0 && (c === 'black' || c === 'red'));
            const hasAmbush = hero.name === 'Sorceress' && this.shapeshiftForm && !this.ambushMinionUsed && Object.entries(minionsObj).some(([c, n]) => n > 0 && c === this.shapeshiftForm);

            // Build faction rows
            const minionsList = Object.entries(minionsObj)
                .filter(([color, count]) => count > 0)
                .map(([color, count]) => {
                    const faction = colorToFaction[color] || { name: color, hitReq: 5, color: '#888', bg: 'rgba(128,128,128,0.1)' };
                    const blessedBonus = this._getBlessedAttacksBonus(hero, color);
                    const ambushBonus = this._getAmbushBonus(hero, 'minion', color);
                    const effectiveHitReq = Math.max(2, faction.hitReq - woodsBonus - blessedBonus - ambushBonus - questBonus);

                    // Build bonus notices per faction
                    let bonusHTML = '';
                    if (this.rangedAttack) bonusHTML += `<div style="font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS',cursive;color:#3d2b1f;margin-top:3px;"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a;">🏹 Archery:</strong> Ranged attack</div>`;
                    if (woodsBonus > 0) bonusHTML += `<div style="font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS',cursive;color:#3d2b1f;margin-top:3px;"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a;">🏹 Woods Lore:</strong> +1 to all rolls</div>`;
                    if (hasBlessed && (color === 'black' || color === 'red')) bonusHTML += `<div style="font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS',cursive;color:#3d2b1f;margin-top:3px;"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a;">✝️ Blessed Attacks:</strong> +1 vs Undead & Demons</div>`;
                    if (hasAmbush && color === this.shapeshiftForm) bonusHTML += `<div style="font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS',cursive;color:#3d2b1f;margin-top:3px;"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a;">${hero.abilityIcon || '⚡'} Ambush:</strong> +2 to each die</div>`;
                    if (questBonus > 0) bonusHTML += `<div style="font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS',cursive;color:#3d2b1f;margin-top:3px;"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a;">📜 Amulet of the Gods:</strong> +1 to all rolls</div>`;

                    return `<div style="background:${faction.bg};border:1px solid ${faction.color};border-radius:5px;padding:5px 10px;margin:4px 0;">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="width:12px;height:12px;border-radius:50%;background:${faction.color};border:1.5px solid rgba(0,0,0,0.3);flex-shrink:0;display:inline-block;"></span>
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;color:${faction.color};">${count}x ${faction.name}</span>
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#2c1810;margin-left:auto;">${effectiveHitReq}+ to hit</span>
                        </div>
                        ${bonusHTML}
                    </div>`;
                })
                .join('');
            
            content.innerHTML = `
                <div class="parchment-box">
                    <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Attacking: ${target}</span></div>
                    ${minionsList}
                </div>
            `;
            
            // Enable roll button for minion combat (no cards required)
            const rollBtn = document.getElementById('combat-roll-btn');
            rollBtn.disabled = false;
            rollBtn.className = 'phb';
            rollBtn.textContent = 'Confirm';
            rollBtn.style.cssText = 'opacity:1;cursor:pointer;display:block;width:100%;margin-top:8px;';

            // Restyle the Close/Cancel button to match gold phb design
            const modalEl = document.getElementById('combat-modal');
            if (modalEl) {
                // Hide close X and fix the extra padding it causes via :has() selector
                const closeX = modalEl.querySelector('.modal-close-btn');
                if (closeX) closeX.style.display = 'none';
                const modalContent = modalEl.querySelector('.modal-content');
                if (modalContent) modalContent.style.paddingTop = '20px';

                // Force button container to stack vertically
                modalEl.querySelectorAll('button').forEach(btn => {
                    if (btn !== rollBtn && btn !== closeX) {
                        btn.className = 'phb';
                        btn.style.cssText = 'opacity:1;cursor:pointer;display:block;width:100%;margin-top:6px;';
                        btn.textContent = 'Cancel';
                        if (btn.parentElement && btn.parentElement !== modalEl) {
                            btn.parentElement.style.cssText = 'display:block;width:100%;';
                        }
                    }
                });
                // Force rollBtn parent to block too
                if (rollBtn.parentElement && rollBtn.parentElement !== modalEl) {
                    rollBtn.parentElement.style.cssText = 'display:block;width:100%;';
                }
            }

        } else {
            title.textContent = `Attack ${target.name}`;
            
            // Check if hero has cards for this general
            const hero = this.heroes[this.currentPlayerIndex];
            const applicableCards = hero.cards.filter(card => 
                card.general === target.name || card.general === 'Any'
            );
            
            if (applicableCards.length === 0) {
                content.innerHTML = `
                    <p style="color: #ef4444;">You need a card for ${target.name} to attack!</p>
                    <p style="margin-top: 10px; font-size: 0.9em;">
                        Draw cards to get weapons or items that work against this general.
                    </p>
                `;
                const rollBtn = document.getElementById('combat-roll-btn');
                rollBtn.disabled = true;
                rollBtn.className = 'btn';
                rollBtn.style.opacity = '0.5';
                rollBtn.style.cursor = 'not-allowed';
            } else {
                // Check for Amarak's Blessing quest
                const amarakQuest = this._findAmarakBlessingQuest();
                const amarakHTML = amarakQuest && target.combatSkill ? `
                    <div id="amarak-blessing-area" style="margin: 10px 0; padding: 10px; background: rgba(147,51,234,0.15); border: 2px solid #9333ea; border-radius: 6px; text-align: center;">
                        <div style="color: #c084fc; font-weight: bold; margin-bottom: 6px;">📜 Amarak's Blessing Available</div>
                        <div style="color: #d4af37; font-size: 0.85em; margin-bottom: 8px;">
                            Ignore <strong>${target.name}'s</strong> combat skill: <strong>${target.combatSkillName}</strong>
                        </div>
                        <div style="color: #999; font-size: 0.8em; margin-bottom: 8px;">
                            (Does not affect Hero Defeated penalty)
                        </div>
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <button class="btn btn-primary" style="background: #9333ea; padding: 6px 16px;" onclick="game._useAmarakBlessing()">
                                📜 Use Blessing
                            </button>
                        </div>
                    </div>
                ` : '';
                
                // Show active Amarak indicator if already activated
                const amarakActiveHTML = this._amarakBlessingActive && target.combatSkill ? `
                    <div style="margin: 10px 0; padding: 8px; background: rgba(147,51,234,0.2); border: 1px solid #9333ea; border-radius: 5px; text-align: center;">
                        <span style="color: #c084fc; font-weight: bold;">📜 Amarak's Blessing Active — ${target.combatSkillName} Ignored!</span>
                    </div>
                ` : '';
                
                content.innerHTML = `
                    <p>Select a card to use against ${target.name}:</p>
                    ${amarakHTML}
                    ${amarakActiveHTML}
                    <div style="margin: 10px 0;">
                        ${applicableCards.map((card, i) => `
                            <div style="margin: 8px 0; padding: 10px; background: rgba(0,0,0,0.3); 
                                        border-radius: 5px; cursor: pointer; border: 2px solid #666;"
                                 onclick="game.selectCombatCard(${i})" id="combat-card-${i}">
                                <strong>${card.name}</strong> - ${card.dice} dice
                            </div>
                        `).join('')}
                    </div>
                    <p style="font-size: 0.9em; margin-top: 10px;">
                        Roll 6 on each die to deal 1 damage to the general.
                    </p>
                `;
                this.applicableCards = applicableCards;
                this.selectedCardIndex = null;
                const rollBtn = document.getElementById('combat-roll-btn');
                rollBtn.disabled = false;
                rollBtn.className = 'btn btn-primary';
                rollBtn.style.opacity = '1';
                rollBtn.style.cursor = 'pointer';
            }
        }
        

        modal.classList.add('active');


        this.currentCombat = { type, target };

    },
    
    selectCombatCard(index) {
        // Deselect all cards
        this.applicableCards.forEach((_, i) => {
            const cardDiv = document.getElementById(`combat-card-${i}`);
            if (cardDiv) cardDiv.style.borderColor = '#666';
        });
        
        // Select this card
        const cardDiv = document.getElementById(`combat-card-${index}`);
        if (cardDiv) cardDiv.style.borderColor = '#ffd700';
        
        this.selectedCardIndex = index;
    },
    
    rollCombatDice() {
        const hero = this.heroes[this.currentPlayerIndex];
        
        // Reset Eagle Rider re-roll for each combat encounter
        this.eagleRiderRerollUsed = false;
        // Reset Dwarf Dragon Slayer re-roll for each combat encounter
        this.dwarfDragonSlayerUsed = false;
        // Reset Battle Luck check
        this._battleLuckChecked = false;
        this._pendingBattleLuck = null;
        // Reset Unicorn Steed re-roll
        this._unicornSteedRerollUsed = false;
        this._pendingUnicornReroll = null;
        // Reset combat bonus dice
        this._combatBonusDiceActive = false;
        
        if (this.currentCombat.type === 'minions') {
            // Check for Find Magic Gate quest (combat bonus dice) — minion path
            const bonusDiceQuest = this._findCombatBonusDiceQuest(hero);
            if (bonusDiceQuest) {
                this._pendingCombatBonusDice = bonusDiceQuest;
                
                this.showInfoModal('💫 Find Magic Gate', `
                    <div style="text-align: center;">
                        <div style="font-size: 2em; margin-bottom: 8px;">💫</div>
                        <div style="color: #d4af37; margin-bottom: 12px;">
                            Discard <strong>Find Magic Gate</strong> quest card to add <strong>+2 bonus dice</strong> to this minion combat?
                        </div>
                        <div style="color: #999; font-size: 0.9em; margin-bottom: 15px;">
                            This quest card will be permanently discarded.
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-primary" style="flex: 1; background: #dc2626;" onclick="game._useCombatBonusDice()">
                                💫 Use (+2 Dice)
                            </button>
                            <button class="btn" style="flex: 1; background: #666;" onclick="game._skipCombatBonusDice()">
                                Skip
                            </button>
                        </div>
                    </div>
                `);
                const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
                if (defaultBtnDiv) defaultBtnDiv.style.display = 'none';
                return;
            }
            this.rollMinionCombat();
        } else {
            // General combat — bonus dice check handled inside rollGeneralCombat
            this.rollGeneralCombat();
        }
    },
    
    _useCombatBonusDice() {
        const hero = this.heroes[this.currentPlayerIndex];
        const bonusDice = this._pendingCombatBonusDice;
        if (!bonusDice) return;
        
        // Retire quest card (mark as used, keep in questCards for history)
        const quest = hero.questCards[bonusDice.questIndex];
        if (quest) this._retireQuest(hero, quest, '+2 bonus dice (minion combat)');
        this._combatBonusDiceActive = true;
        this._pendingCombatBonusDice = null;
        
        this.addLog(`💫 ${hero.name} discards Find Magic Gate quest for +2 bonus combat dice!`);
        
        this.renderHeroes();
        this.updateDeckCounts();
        this.closeInfoModal();
        
        this.rollMinionCombat();
    },
    
    _skipCombatBonusDice() {
        this._pendingCombatBonusDice = null;
        this._combatBonusDiceActive = false;
        this.closeInfoModal();
        this.rollMinionCombat();
    },
    
    _useGeneralBonusDice() {
        const hero = this.heroes[this.currentPlayerIndex];
        const bonusDice = this._pendingCombatBonusDice;
        if (!bonusDice) return;
        
        const quest = hero.questCards[bonusDice.questIndex];
        if (quest) this._retireQuest(hero, quest, '+2 bonus dice (general combat)');
        this._combatBonusDiceActive = true;
        this._pendingCombatBonusDice = null;
        
        this.addLog(`💫 ${hero.name} discards Find Magic Gate quest for +2 bonus combat dice!`);
        
        this.renderHeroes();
        this.updateDeckCounts();
        this.closeInfoModal();
        
        this.rollGeneralCombat();
    },
    
    _skipGeneralBonusDice() {
        this._pendingCombatBonusDice = null;
        this._combatBonusDiceActive = false;
        this.closeInfoModal();
        this.rollGeneralCombat();
    },
    
    rollMinionCombat() {
        const hero = this.heroes[this.currentPlayerIndex];
        const location = this.currentCombat.target;
        const minionsObj = this.minions[location];
        
        // Get hit requirement based on faction
        const getHitRequirement = (color) => {
            if (color === 'green') return 3;  // Orcs
            if (color === 'black') return 4;  // Undead
            if (color === 'red') return 4;    // Demons
            if (color === 'blue') return 5;   // Dragons
            return 5; // Default
        };
        
        // Roll dice and store results per color
        const colorResults = [];
        let totalDefeated = 0;
        const woodsLoreBonus = this._getWoodsLoreBonus(hero);
        if (this.rangedAttack) {
            this.addLog(`🏹 Archery: ${hero.name} fires arrows at minions in ${location} from ${hero.location}!`);
        }
        if (woodsLoreBonus > 0) {
            this.addLog(`🏹 Woods Lore: ${hero.name} gains +1 to all attack rolls in ${hero.location}!`);
        }
        if (hero.name === 'Cleric') {
            const hasBlessed = Object.entries(minionsObj).some(([c, n]) => n > 0 && (c === 'black' || c === 'red'));
            if (hasBlessed) {
                this.addLog(`✝️ Blessed Attacks: ${hero.name} gains +1 to attack rolls vs Undead & Demons!`);
            }
        }
        if (this._getQuestCombatBonus(hero) > 0) {
            this.addLog(`📜 Amulet of the Gods: ${hero.name} gains +1 to all attack rolls!`);
        }
        
        // Sorceress Ambush check
        const hasAmbush = hero.name === 'Sorceress' && this.shapeshiftForm && !this.ambushMinionUsed;
        if (hasAmbush) {
            const formToName = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
            const matchingMinions = Object.entries(minionsObj).some(([c, n]) => n > 0 && c === this.shapeshiftForm);
            if (matchingMinions) {
                this.addLog(`⚡ Ambush: ${hero.name} strikes from ${formToName[this.shapeshiftForm]} form — +2 to each die vs ${formToName[this.shapeshiftForm]} minions!`);
            }
        }
        
        // Combat bonus dice from Find Magic Gate quest
        let combatBonusDiceRemaining = this._combatBonusDiceActive ? 2 : 0;
        if (combatBonusDiceRemaining > 0) {
            this.addLog(`💫 Find Magic Gate: +${combatBonusDiceRemaining} bonus combat dice!`);
        }
        
        for (let [color, count] of Object.entries(minionsObj)) {
            if (count === 0) continue;
            
            const baseHitReq = getHitRequirement(color);
            const blessedBonus = this._getBlessedAttacksBonus(hero, color);
            const ambushBonus = this._getAmbushBonus(hero, 'minion', color);
            const questBonus = this._getQuestCombatBonus(hero);
            const hitReq = Math.max(2, baseHitReq - woodsLoreBonus - blessedBonus - ambushBonus - questBonus);
            const diceColor = this.getMinionColor(color);
            let defeated = 0;
            const rolls = [];
            
            // Roll base dice (1 per minion)
            const bonusForThisColor = Math.min(combatBonusDiceRemaining, 2);
            const totalDiceForColor = count + bonusForThisColor;
            combatBonusDiceRemaining -= bonusForThisColor;
            
            for (let i = 0; i < totalDiceForColor; i++) {
                const roll = Math.floor(Math.random() * 6) + 1;
                const hit = roll >= hitReq;
                if (hit) defeated++;
                const isBonus = i >= count;
                rolls.push({roll, hit, isBonus});
            }
            
            // Can't defeat more minions than exist
            defeated = Math.min(defeated, count);
            
            colorResults.push({ color, count, hitReq, diceColor, defeated, rolls });
            totalDefeated += defeated;
        }
        
        // Mark ambush as used after first engage
        if (hero.name === 'Sorceress') {
            this.ambushMinionUsed = true;
        }
        
        // Check if Eagle Rider can re-roll (Ground Attack, not vs Undead faction specifically excluded)
        const canReroll = hero.name === 'Eagle Rider' 
            && this.eagleRiderAttackStyle === 'ground' 
            && !this.eagleRiderRerollUsed;
        
        if (canReroll) {
            // Store for re-roll
            this._pendingRerollCombat = {
                type: 'minions',
                hero: hero,
                location: location,
                minionsObj: minionsObj,
                colorResults: colorResults,
                totalDefeated: totalDefeated,
                // Save original minion counts to undo
                originalMinions: {}
            };
            for (let cr of colorResults) {
                this._pendingRerollCombat.originalMinions[cr.color] = cr.count;
            }
            
            // Build results HTML with re-roll option
            const resultsHTML = this._buildMinionResultsHTML(colorResults, true);
            
            this.showCombatResults(
                '⚔️ Engage Minions',
                resultsHTML,
                '',
                `<button class="phb" style="margin-top:8px;" onclick="game.eagleRerollMinionCombat()">Ground Attack (Re-Roll All Dice)</button>
                 <button class="phb" style="margin-top:6px;" onclick="game.acceptMinionCombatRoll()">Continue</button>`,
                true
            );
            return;
        }
        
        // ===== DWARF DRAGON SLAYER RE-ROLL PHASE (minions) =====
        const hasBlueMinions = colorResults.some(cr => cr.color === 'blue');
        const hasFailedBlueDice = colorResults.some(cr => cr.color === 'blue' && cr.rolls.some(r => !r.hit));
        const canDwarfReroll = hero.name === 'Dwarf' 
            && hasBlueMinions
            && hasFailedBlueDice
            && !this.dwarfDragonSlayerUsed;
        
        if (canDwarfReroll) {
            this._pendingRerollCombat = {
                type: 'minions',
                subtype: 'dragon_slayer',
                hero: hero,
                location: location,
                minionsObj: minionsObj,
                colorResults: colorResults,
                totalDefeated: totalDefeated,
                originalMinions: {}
            };
            for (let cr of colorResults) {
                this._pendingRerollCombat.originalMinions[cr.color] = cr.count;
            }
            
            const resultsHTML = this._buildMinionResultsHTML(colorResults, true);
            const failedBlueCount = colorResults.filter(cr => cr.color === 'blue').reduce((sum, cr) => sum + cr.rolls.filter(r => !r.hit).length, 0);
            
            this.showCombatResults(
                '⚔️ Engage Minions',
                resultsHTML,
                '',
                `<button class="phb" style="margin-top:8px;" onclick="game.dwarfRerollMinionCombat()">Dragon Slayer (Re-Roll ${failedBlueCount} Failed Dice)</button>
                 <button class="phb" style="margin-top:6px;" onclick="game.acceptMinionCombatRoll()">Continue</button>`,
                true
            );
            return;
        }
        // ================================
        
        // No re-roll: apply results immediately
        this._applyMinionCombatResults(colorResults, totalDefeated);
    },
    
    _buildMinionResultsHTML(colorResults, showTotal, location) {
        const hero = this.heroes[this.currentPlayerIndex];
        const woodsBonus = this._getWoodsLoreBonus(hero);
        const combatLocation = location || (this.currentCombat && this.currentCombat.target) || hero.location;
        const hasAmulet = this._getQuestCombatBonus(hero) > 0;
        const hasBonusDice = this._combatBonusDiceActive;
        const hasRanged = this.rangedAttack;
        const hasWoods = woodsBonus > 0;
        const hasBlessed = hero.name === 'Cleric' && colorResults.some(cr => cr.color === 'black' || cr.color === 'red');
        const dieClassMap = { green: 'die-green', black: 'die-black', red: 'die-red', blue: 'die-blue' };

        let html = '<div class="parchment-box"><div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Combat Roll</span></div>';

        colorResults.forEach(cr => {
            const factionName = cr.color === 'green' ? 'Orc' :
                               cr.color === 'black' ? 'Undead' :
                               cr.color === 'red' ? 'Demon' : 'Dragon';
            const dieColorClass = dieClassMap[cr.color] || 'die-black';

            let bonusHTML = '';
            if (hasRanged) bonusHTML += `<div style="font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS',cursive;color:#3d2b1f;margin-bottom:4px;"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a;">🏹 Archery:</strong> Ranged attack</div>`;
            if (hasWoods) bonusHTML += `<div style="font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS',cursive;color:#3d2b1f;margin-bottom:4px;"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a;">🏹 Woods Lore:</strong> +1 to all rolls</div>`;
            if (hasBlessed && (cr.color === 'black' || cr.color === 'red')) bonusHTML += `<div style="font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS',cursive;color:#3d2b1f;margin-bottom:4px;"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a;">✝️ Blessed Attacks:</strong> +1 vs Undead & Demons</div>`;
            if (hasAmulet) bonusHTML += `<div style="font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS',cursive;color:#3d2b1f;margin-bottom:4px;"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a;">📜 Amulet of the Gods:</strong> +1 to all rolls</div>`;
            if (hasBonusDice) bonusHTML += `<div style="font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS',cursive;color:#3d2b1f;margin-bottom:4px;"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a;">📜 Find Magic Gate:</strong> +2 bonus dice</div>`;

            let diceHTML = '';
            cr.rolls.forEach(r => {
                // Inline styles as fallback (in case CSS not yet deployed)
                const bg = r.hit
                    ? { green:'linear-gradient(145deg,#16a34a,#15803d)', black:'linear-gradient(145deg,#374151,#1f2937)', red:'linear-gradient(145deg,#dc2626,#991b1b)', blue:'linear-gradient(145deg,#3b82f6,#1d4ed8)' }[cr.color] || 'linear-gradient(145deg,#374151,#1f2937)'
                    : { green:'linear-gradient(145deg,#16a34a,#15803d)', black:'linear-gradient(145deg,#374151,#1f2937)', red:'linear-gradient(145deg,#dc2626,#991b1b)', blue:'linear-gradient(145deg,#3b82f6,#1d4ed8)' }[cr.color] || 'linear-gradient(145deg,#374151,#1f2937)';
                const borderStyle = r.isBonus ? '2px solid #d4af37' : '2px solid rgba(0,0,0,0.3)';
                const opacity = r.hit ? '1' : '0.28';
                const fadeClass = r.hit ? '' : ' die-fade-miss';
                const bonusClass = r.isBonus ? ' die-bonus' : '';
                diceHTML += `<div class="die ${dieColorClass}${fadeClass}${bonusClass}" style="background:${bg};color:#fff;border:${borderStyle};opacity:${opacity};">${r.roll}</div>`;
            });

            html += `<div style="margin:10px 0;">
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#1a0f0a;margin-bottom:${bonusHTML ? '4px' : '6px'};">
                        ${factionName.toUpperCase()} MINIONS — ${cr.hitReq}+ to hit
                    </div>
                    ${bonusHTML}
                    <div style="display:flex;gap:8px;justify-content:center;margin:8px 0;flex-wrap:wrap;">${diceHTML}</div>
                </div>`;
        });

        const totalDefeated = colorResults.reduce((sum, cr) => sum + cr.defeated, 0);
        html += '<div class="combat-results-label">Defeated Minions:</div>';
        if (totalDefeated > 0) {
            colorResults.forEach(cr => {
                if (cr.defeated <= 0) return;
                const factionLabel = cr.color === 'green' ? 'Orcs' : cr.color === 'black' ? 'Undead' : cr.color === 'red' ? 'Demons' : 'Dragonkin';
                const pillColor = cr.color === 'green' ? '#16a34a' : cr.color === 'black' ? '#374151' : cr.color === 'red' ? '#dc2626' : '#3b82f6';
                const pillBg = cr.color === 'green' ? 'rgba(22,163,74,0.1)' : cr.color === 'black' ? 'rgba(55,65,81,0.1)' : cr.color === 'red' ? 'rgba(220,38,38,0.1)' : 'rgba(59,130,246,0.1)';
                for (let i = 0; i < cr.defeated; i++) {
                    html += `<div class="faction-pill" style="background:${pillBg};border:1px solid ${pillColor};"><div class="faction-pill-row"><span class="faction-pill-left" style="color:${pillColor};"><span class="dot" style="background:${pillColor};"></span>${factionLabel}</span><span class="faction-pill-right">→ ${combatLocation}</span></div></div>`;
                }
            });
        } else {
            html += `<div class="fx-note blocked" style="display:flex;justify-content:space-between;align-items:center;padding:5px 10px;margin:3px 0;border-radius:5px;background:rgba(139,115,85,0.1);border:1px solid rgba(139,115,85,0.3);font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.78em;"><span style="color:#8b7355;">No Minions Defeated</span></div>`;
        }

        html += '</div>';
        return html;
    },
    
    eagleRerollMinionCombat() {
        const state = this._pendingRerollCombat;
        if (!state || state.type !== 'minions') return;
        
        this.eagleRiderRerollUsed = true;
        
        // Re-roll all dice for all colors
        const newColorResults = [];
        let newTotalDefeated = 0;
        
        state.colorResults.forEach(cr => {
            const newRolls = [];
            let newDefeated = 0;
            
            for (let i = 0; i < cr.count; i++) {
                const roll = Math.floor(Math.random() * 6) + 1;
                const hit = roll >= cr.hitReq;
                if (hit) newDefeated++;
                newRolls.push({roll, hit});
            }
            
            newColorResults.push({ ...cr, defeated: newDefeated, rolls: newRolls });
            newTotalDefeated += newDefeated;
        });
        
        this.addLog(`🦅 Eagle Rider re-rolls all dice! New result: ${newTotalDefeated} minion(s) defeated`);
        
        // Close results modal and apply new results
        document.getElementById('combat-results-modal').classList.remove('active');
        this._pendingRerollCombat = null;
        
        this._applyMinionCombatResults(newColorResults, newTotalDefeated);
    },
    
    dwarfRerollMinionCombat() {
        const state = this._pendingRerollCombat;
        if (!state || state.type !== 'minions') return;
        
        this.dwarfDragonSlayerUsed = true;
        
        // Re-roll only FAILED dice for BLUE (Dragonkin) minions
        const newColorResults = [];
        let newTotalDefeated = 0;
        
        state.colorResults.forEach(cr => {
            if (cr.color === 'blue') {
                // Re-roll only failed dice
                const newRolls = [];
                let newDefeated = 0;
                
                for (let i = 0; i < cr.rolls.length; i++) {
                    if (cr.rolls[i].hit) {
                        // Keep successful rolls
                        newRolls.push(cr.rolls[i]);
                        newDefeated++;
                    } else {
                        // Re-roll failed dice
                        const roll = Math.floor(Math.random() * 6) + 1;
                        const hit = roll >= cr.hitReq;
                        if (hit) newDefeated++;
                        newRolls.push({roll, hit});
                    }
                }
                
                newColorResults.push({ ...cr, defeated: newDefeated, rolls: newRolls });
                newTotalDefeated += newDefeated;
            } else {
                // Keep non-blue results unchanged
                newColorResults.push(cr);
                newTotalDefeated += cr.defeated;
            }
        });
        
        this.addLog(`⛏️ Dragon Slayer: Dwarf re-rolls failed dice against Dragonkin! New result: ${newTotalDefeated} minion(s) defeated`);
        
        document.getElementById('combat-results-modal').classList.remove('active');
        this._pendingRerollCombat = null;
        
        this._applyMinionCombatResults(newColorResults, newTotalDefeated);
    },
    
    acceptMinionCombatRoll() {
        const state = this._pendingRerollCombat;
        if (!state || state.type !== 'minions') return;
        
        document.getElementById('combat-results-modal').classList.remove('active');
        const colorResults = state.colorResults;
        const totalDefeated = state.totalDefeated;
        this._pendingRerollCombat = null;
        
        this._applyMinionCombatResults(colorResults, totalDefeated);
    },
    
    // ===== BATTLE LUCK SYSTEM =====
    _findBattleLuckCard() {
        for (let i = 0; i < this.heroes.length; i++) {
            const hero = this.heroes[i];
            if (!hero.cards || hero.health <= 0) continue;
            for (let j = 0; j < hero.cards.length; j++) {
                if (hero.cards[j].specialAction === 'battle_luck') {
                    return { heroIndex: i, cardIndex: j, hero: hero };
                }
            }
        }
        return null;
    },
    
    _buildBattleLuckHTML(blCard, failedCount) {
        return `
            <div class="parchment-box" style="margin-top:10px;">
                <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">🍀 Battle Luck — Re-roll Available</span></div>
                <p style="font-family:'Comic Sans MS',cursive; font-size:0.9em; color:#3d2b1f; margin:8px 0 4px 0;">Re-roll ${failedCount} failed dice. Card from ${blCard.hero.symbol} ${blCard.hero.name}'s hand will be discarded.</p>
                <p style="font-family:'Comic Sans MS',cursive; font-size:0.85em; color:#6b5a3e; margin-bottom:8px;">This cannot be undone.</p>
                <button class="phb" onclick="game.useBattleLuck()">Battle Luck (Re-Roll All Failed Dice)</button>
                <button class="phb" onclick="game.declineBattleLuck()">Continue</button>
            </div>
        `;
    },
    
    useBattleLuck() {
        const state = this._pendingBattleLuck;
        if (!state) return;
        
        const blCard = state.battleLuckCard;
        
        // Remove the Battle Luck card (played — removed from game)
        this._playSpecialCard(blCard.hero, blCard.cardIndex);
        this.updateDeckCounts();
        
        document.getElementById('combat-results-modal').classList.remove('active');
        
        if (state.type === 'minions') {
            // Re-roll only failed dice for each color
            const newColorResults = [];
            let newTotalDefeated = 0;
            
            state.colorResults.forEach(cr => {
                const newRolls = [];
                let newDefeated = 0;
                
                cr.rolls.forEach(r => {
                    if (r.hit) {
                        newRolls.push(r);
                        newDefeated++;
                    } else {
                        const roll = Math.floor(Math.random() * 6) + 1;
                        const hit = roll >= cr.hitReq;
                        if (hit) newDefeated++;
                        newRolls.push({roll, hit});
                    }
                });
                
                newColorResults.push({ ...cr, defeated: newDefeated, rolls: newRolls });
                newTotalDefeated += newDefeated;
            });
            
            this.addLog(`🍀 Battle Luck: ${blCard.hero.name}'s card used to re-roll failed dice! New result: ${newTotalDefeated} minion(s) defeated`);
            this._pendingBattleLuck = null;
            
            this._applyMinionCombatResults(newColorResults, newTotalDefeated);
            
        } else if (state.type === 'solo_general') {
            const newRolls = [];
            let newDamage = 0;
            
            state.diceRolls.forEach(r => {
                if (r.hit) {
                    newRolls.push(r);
                    newDamage++;
                } else {
                    const roll = Math.floor(Math.random() * 6) + 1;
                    const hit = roll >= state.hitReq;
                    if (hit) newDamage++;
                    newRolls.push({roll, hit});
                }
            });
            
            this.addLog(`🍀 Battle Luck: ${blCard.hero.name}'s card used to re-roll failed dice! New result: ${newDamage} hit(s)`);
            this._pendingBattleLuck = null;
            
            this._finalizeSoloCombat(state.hero, state.general, state.cardsToUse, state.totalDice, state.hitReq, newRolls, newDamage);
            
        } else if (state.type === 'group_general') {
            const newRolls = [];
            let newDamage = 0;
            
            state.diceRolls.forEach(r => {
                if (r.hit) {
                    newRolls.push(r);
                    newDamage++;
                } else {
                    const roll = Math.floor(Math.random() * 6) + 1;
                    const hit = roll >= state.hitReq;
                    if (hit) newDamage++;
                    newRolls.push({roll, hit});
                }
            });
            
            this.addLog(`🍀 Battle Luck: ${blCard.hero.name}'s card used to re-roll failed dice! New result: ${newDamage} hit(s)`);
            this._pendingBattleLuck = null;
            
            this._finalizeGroupAttackerCombat(state.hero, state.general, state.cardsToUse, state.totalDice, state.hitReq, newRolls, newDamage);
            
        } else if (state.type === 'fireball') {
            const newColorResults = [];
            let newTotalDefeated = 0;
            
            state.colorResults.forEach(cr => {
                const newRolls = [];
                let newDefeated = 0;
                
                cr.rolls.forEach(r => {
                    if (r.hit) {
                        newRolls.push(r);
                        newDefeated++;
                    } else {
                        const roll = Math.floor(Math.random() * 6) + 1;
                        const hit = roll >= cr.hitReq;
                        if (hit) newDefeated++;
                        newRolls.push({roll, hit});
                    }
                });
                
                newColorResults.push({ ...cr, defeated: newDefeated, rolls: newRolls });
                newTotalDefeated += newDefeated;
            });
            
            this.addLog(`🍀 Battle Luck: ${blCard.hero.name}'s card used to re-roll failed dice! New result: ${newTotalDefeated} minion(s) defeated`);
            this._pendingBattleLuck = null;
            
            this._applyFireballResults(newColorResults, newTotalDefeated, state.cardName);
        }
    },
    
    declineBattleLuck() {
        const state = this._pendingBattleLuck;
        if (!state) return;
        
        document.getElementById('combat-results-modal').classList.remove('active');
        this._pendingBattleLuck = null;
        
        if (state.type === 'minions') {
            this._battleLuckChecked = true;
            this._applyMinionCombatResults(state.colorResults, state.totalDefeated, true);
        } else if (state.type === 'solo_general') {
            this._battleLuckChecked = true;
            this._finalizeSoloCombat(state.hero, state.general, state.cardsToUse, state.totalDice, state.hitReq, state.diceRolls, state.damage);
        } else if (state.type === 'group_general') {
            this._battleLuckChecked = true;
            this._finalizeGroupAttackerCombat(state.hero, state.general, state.cardsToUse, state.totalDice, state.hitReq, state.diceRolls, state.damage);
        } else if (state.type === 'fireball') {
            this._applyFireballResults(state.colorResults, state.totalDefeated, state.cardName);
        }
    },
    // ===== END BATTLE LUCK SYSTEM =====
    
    // ===== UNICORN STEED RE-ROLL SYSTEM =====
    _useUnicornSteedReroll() {
        const state = this._pendingUnicornReroll;
        if (!state) return;
        this._unicornSteedRerollUsed = true;
        this._pendingUnicornReroll = null;
        
        document.getElementById('combat-results-modal').classList.remove('active');
        
        const hero = this.heroes[this.currentPlayerIndex];
        this.addLog(`🦄 ${hero.name} uses Unicorn Steed to re-roll failed dice!`);
        
        if (state.type === 'minions') {
            const newColorResults = [];
            let newTotalDefeated = 0;
            
            state.colorResults.forEach(cr => {
                const newRolls = [];
                let newDefeated = 0;
                
                cr.rolls.forEach(r => {
                    if (r.hit) {
                        newRolls.push(r);
                        newDefeated++;
                    } else {
                        const roll = Math.floor(Math.random() * 6) + 1;
                        const hit = roll >= cr.hitReq;
                        if (hit) newDefeated++;
                        newRolls.push({roll, hit});
                    }
                });
                
                newColorResults.push({ ...cr, rolls: newRolls, defeated: newDefeated });
                newTotalDefeated += newDefeated;
            });
            
            this._applyMinionCombatResults(newColorResults, newTotalDefeated);
        } else if (state.type === 'solo_general') {
            const newDiceRolls = [];
            let newDamage = 0;
            
            state.diceRolls.forEach(r => {
                if (r.hit) {
                    newDiceRolls.push(r);
                    newDamage++;
                } else {
                    const roll = Math.floor(Math.random() * 6) + 1;
                    const hit = roll >= state.hitReq;
                    if (hit) newDamage++;
                    newDiceRolls.push({roll, hit});
                }
            });
            
            this._finalizeSoloCombat(state.hero, state.general, state.cardsToUse, newDamage, state.hitReq, newDiceRolls, newDamage);
        } else if (state.type === 'group_general') {
            const newDiceRolls = [];
            let newDamage = 0;
            
            state.diceRolls.forEach(r => {
                if (r.hit) {
                    newDiceRolls.push(r);
                    newDamage++;
                } else {
                    const roll = Math.floor(Math.random() * 6) + 1;
                    const hit = roll >= state.hitReq;
                    if (hit) newDamage++;
                    newDiceRolls.push({roll, hit});
                }
            });
            
            this._finalizeGroupAttackerCombat(state.hero, state.general, state.cardsToUse, state.totalDice, state.hitReq, newDiceRolls, newDamage);
        }
    },
    
    _declineUnicornSteedReroll() {
        const state = this._pendingUnicornReroll;
        if (!state) return;
        this._unicornSteedRerollUsed = true;
        this._pendingUnicornReroll = null;
        
        document.getElementById('combat-results-modal').classList.remove('active');
        
        if (state.type === 'minions') {
            this._applyMinionCombatResults(state.colorResults, state.totalDefeated, true);
        } else if (state.type === 'solo_general') {
            this._finalizeSoloCombat(state.hero, state.general, state.cardsToUse, state.damage, state.hitReq, state.diceRolls, state.damage);
        } else if (state.type === 'group_general') {
            this._finalizeGroupAttackerCombat(state.hero, state.general, state.cardsToUse, state.totalDice, state.hitReq, state.diceRolls, state.damage);
        }
    },
    // ===== END UNICORN STEED RE-ROLL SYSTEM =====
    
    _applyMinionCombatResults(colorResults, totalDefeated, skipModal = false) {
        // Check for Battle Luck re-roll opportunity
        if (!this._battleLuckChecked) {
            const blCard = this._findBattleLuckCard();
            const hasFailedDice = colorResults.some(cr => cr.rolls.some(r => !r.hit));
            if (blCard && hasFailedDice) {
                const failedCount = colorResults.reduce((sum, cr) => sum + cr.rolls.filter(r => !r.hit).length, 0);
                this._pendingBattleLuck = { type: 'minions', colorResults, totalDefeated, battleLuckCard: blCard };
                const resultsHTML = this._buildMinionResultsHTML(colorResults, true);
                this.showCombatResults(
                    '⚔️ Engage Minions',
                    resultsHTML,
                    '',
                    `<button class="phb" style="margin-top:8px;" onclick="game.useBattleLuck()">Battle Luck (Re-Roll ${failedCount} Failed Dice)</button>
                     <button class="phb" style="margin-top:6px;" onclick="game.declineBattleLuck()">Continue</button>`,
                    true
                );
                return;
            }
        }
        this._battleLuckChecked = false;
        
        // Unicorn Steed: re-roll ALL failed dice once per combat
        if (!this._unicornSteedRerollUsed) {
            const hero2 = this.heroes[this.currentPlayerIndex];
            if (this._hasUnicornSteed(hero2)) {
                const hasFailedDice = colorResults.some(cr => cr.rolls.some(r => !r.hit));
                if (hasFailedDice) {
                    const failedCount = colorResults.reduce((sum, cr) => sum + cr.rolls.filter(r => !r.hit).length, 0);
                    this._pendingUnicornReroll = { type: 'minions', colorResults, totalDefeated };
                    const resultsHTML = this._buildMinionResultsHTML(colorResults, true);
                    this.showCombatResults(
                        '⚔️ Engage Minions',
                        resultsHTML,
                        '',
                        `<button class="phb" style="margin-top:8px;" onclick="game._useUnicornSteedReroll()">Unicorn Steed (Re-Roll ${failedCount} Failed Dice)</button>
                         <button class="phb" style="margin-top:6px;" onclick="game._declineUnicornSteedReroll()">Continue</button>`,
                        true
                    );
                    return;
                }
            }
        }
        this._unicornSteedRerollUsed = false;
        
        const hero = this.heroes[this.currentPlayerIndex];
        const location = (this.currentCombat && this.currentCombat.target) || hero.location;
        const minionsObj = this.minions[location];
        
        // Apply kills
        colorResults.forEach(cr => {
            minionsObj[cr.color] -= cr.defeated;
            if (minionsObj[cr.color] < 0) minionsObj[cr.color] = 0;
        });
        
        // Track minion defeats for quest progress (e.g. Orc Hunter)
        this._trackQuestMinionDefeats(colorResults);
        
        const resultsHTML = this._buildMinionResultsHTML(colorResults, true);
        
        this.actionsRemaining--;
        this.addLog(`${hero.name} defeated ${totalDefeated} minions!`);
        
        // Show results modal
        if (!skipModal) {
            this.showCombatResults(
                '⚔️ Engage Minions',
                resultsHTML,
                '',
                `<button class="phb" style="margin-top:8px;" onclick="game.closeCombatResults()">Continue</button>`
            );
        }
        
        this.closeCombat();
        this.renderTokens();
        this.updateGameStatus();
        
        // Update map if open - DIRECT update
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            const mapActionsLeft = document.getElementById('map-actions-left');
            if (mapActionsLeft) {
                mapActionsLeft.textContent = this.actionsRemaining;
            }
        }
    },
    
    rollGeneralCombat() {
        try {
            const hero = this.heroes[this.currentPlayerIndex];
            const general = this.currentCombat.target;
            
            // Validate we have a general
            if (!general) {
                this.showInfoModal('⚠️', '<div>No general target found!</div>');
                this.selectedCardsForAttack = [];
                return;
            }
            
            // Reset reroll flags if not already set by rollCombatDice
            if (!this._generalBonusDiceChecked) {
                this.eagleRiderRerollUsed = false;
                this.dwarfDragonSlayerUsed = false;
                this._battleLuckChecked = false;
                this._pendingBattleLuck = null;
                this._unicornSteedRerollUsed = false;
                this._pendingUnicornReroll = null;
                this._combatBonusDiceActive = false;
            }
            
            // Check for Find Magic Gate quest (combat bonus dice)
            if (!this._generalBonusDiceChecked) {
                this._generalBonusDiceChecked = true;
                const bonusDiceQuest = this._findCombatBonusDiceQuest(hero);
                if (bonusDiceQuest) {
                    this._pendingCombatBonusDice = bonusDiceQuest;
                    
                    this.showInfoModal('💫 Find Magic Gate', `
                        <div style="text-align: center;">
                            <div style="font-size: 2em; margin-bottom: 8px;">💫</div>
                            <div style="color: #d4af37; margin-bottom: 12px;">
                                Discard <strong>Find Magic Gate</strong> quest card to add <strong>+2 bonus dice</strong> to this general combat?
                            </div>
                            <div style="color: #999; font-size: 0.9em; margin-bottom: 15px;">
                                This quest card will be permanently discarded.
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button class="btn btn-primary" style="flex: 1; background: #dc2626;" onclick="game._useGeneralBonusDice()">
                                    💫 Use (+2 Dice)
                                </button>
                                <button class="btn" style="flex: 1; background: #666;" onclick="game._skipGeneralBonusDice()">
                                    Skip
                                </button>
                            </div>
                        </div>
                    `);
                    const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
                    if (defaultBtnDiv) defaultBtnDiv.style.display = 'none';
                    return;
                }
            }
            this._generalBonusDiceChecked = false;
            
            // Use selected cards from card selection modal
            // Filter out any undefined cards (in case indices are out of bounds)
            const cardsToUse = this.selectedCardsForAttack && this.selectedCardsForAttack.length > 0
                ? this.selectedCardsForAttack
                    .map(index => hero.cards[index])
                    .filter(card => card !== undefined)
                : [];
            
            if (cardsToUse.length === 0) {
                this.showInfoModal('⚠️', '<div>No valid cards selected! You must use at least one card to attack a general.</div>');
                this.selectedCardsForAttack = [];
                return;
            }
            
            // BALAZARG COMBAT SKILL: Demonic Curse
            // Roll D6 for each card before battle - discard on 1
            if (general.combatSkill === 'demonic_curse' && !this._amarakBlessingActive) {
                const curseRolls = [];
                const cardsLost = [];
                
                cardsToUse.forEach((card, idx) => {
                    const roll = Math.floor(Math.random() * 6) + 1;
                    curseRolls.push({ card: card.name, roll: roll, lost: roll === 1 });
                    
                    if (roll === 1) {
                        cardsLost.push({ card: card, originalIndex: this.selectedCardsForAttack[idx] });
                    }
                });
                
                // Build styled curse results
                let curseHTML = `<div style="margin-bottom: 12px;">Balazarg forces you to test each card!</div>`;
                curseRolls.forEach(result => {
                    const icon = result.lost ? '💀' : '✅';
                    const color = result.lost ? '#ef4444' : '#4ade80';
                    curseHTML += `<div style="padding: 4px 0; color: ${color};">${result.card}: [${result.roll}] ${result.lost ? 'LOST!' : 'Survived'} ${icon}</div>`;
                });
                
                if (cardsLost.length > 0) {
                    curseHTML += `<div style="margin-top: 10px; color: #ef4444; font-weight: bold;">${cardsLost.length} card(s) lost to the curse!</div>`;
                    
                    // Remove cursed cards from hero's hand
                    cardsLost.sort((a, b) => b.originalIndex - a.originalIndex);
                    cardsLost.forEach(lost => {
                        const actualIndex = hero.cards.indexOf(lost.card);
                        if (actualIndex !== -1) {
                            hero.cards.splice(actualIndex, 1);
                            this.heroDiscardPile++;
                        }
                        
                        const selectedIdx = this.selectedCardsForAttack.indexOf(lost.originalIndex);
                        if (selectedIdx !== -1) {
                            this.selectedCardsForAttack.splice(selectedIdx, 1);
                        }
                    });
                    
                    this.addLog(`${hero.name} loses ${cardsLost.length} card(s) to Balazarg's Demonic Curse!`);
                    this.renderHeroes();
                } else {
                    curseHTML += `<div style="margin-top: 10px; color: #4ade80; font-weight: bold;">All cards survived the curse!</div>`;
                }
                
                // Rebuild cardsToUse after curse
                const remainingCards = this.selectedCardsForAttack
                    .map(index => hero.cards[index])
                    .filter(card => card !== undefined);
                
                if (remainingCards.length === 0) {
                    curseHTML += `<div style="margin-top: 10px; color: #ef4444; font-weight: bold;">All cards were destroyed! ${hero.name} must still face ${general.name} unarmed!</div>`;
                    this.showInfoModal('🔥 Demonic Curse! 🔥', curseHTML, () => {
                        // Hero must still attack with 0 cards = 0 dice = 0 damage
                        // Proceed directly to finalize with 0 damage → general survives → hero suffers penalty
                        this._finalizeSoloCombat(hero, general, [], 0, 6, [], 0);
                    });
                    return;
                }
                
                // Continue with remaining cards via callback
                cardsToUse.length = 0;
                cardsToUse.push(...remainingCards);
                
                // Show curse results, then continue combat in callback
                this.showInfoModal('🔥 Demonic Curse! 🔥', curseHTML, () => {
                    this._continueSoloCombat(hero, general, cardsToUse);
                });
                return;
            }
            
            this._continueSoloCombat(hero, general, cardsToUse);
            
        } catch (error) {
            console.error('Combat error:', error);
            this.showInfoModal('⚠️ Combat Error', `<div style="color: #ef4444;">${error.message}<br><br>Please report this bug.</div>`);
            this.selectedCardsForAttack = [];
            this.currentCombat = null;
            this.closeCombat();
        }
    },
    
    _continueSoloCombat(hero, general, cardsToUse) {
        try {
            // Calculate total dice from all selected cards (after curse)
            const baseDice = cardsToUse.reduce((sum, card) => sum + card.dice, 0);
            const combatBonusDice = this._combatBonusDiceActive ? 2 : 0;
            const totalDice = baseDice + combatBonusDice;
            
            if (combatBonusDice > 0) {
                this.addLog(`💫 Find Magic Gate: +${combatBonusDice} bonus combat dice!`);
            }
            
            if (totalDice === 0) {
                // 0 dice = 0 damage — proceed to finalize (hero suffers penalty)
                this._finalizeSoloCombat(hero, general, cardsToUse, 0, 6, [], 0);
                return;
            }
        
        // Get hit requirement based on general faction
        const getGeneralHitRequirement = (faction) => {
            // Orcs: 3+, Undead: 4+, Demons: 4+, Dragons: 5+
            if (faction === 'Orc') return 3;
            if (faction === 'Undead') return 4;
            if (faction === 'Demon') return 4;
            if (faction === 'Dragon') return 5;
            return 6; // Default (old behavior)
        };
        
        const ambushBonusSolo = this._getAmbushBonus(hero, 'general', general.faction);
        const questBonusSolo = this._getQuestCombatBonus(hero);
        const hitReq = Math.max(2, getGeneralHitRequirement(general.faction) - this._getWoodsLoreBonus(hero) - ambushBonusSolo - questBonusSolo);
        if (this._getWoodsLoreBonus(hero) > 0) {
            this.addLog(`🏹 Woods Lore: ${hero.name} gains +1 to all attack rolls in ${hero.location}!`);
        }
        if (ambushBonusSolo > 0) {
            this.addLog(`⚡ Ambush: ${hero.name} strikes from matching form — +1 to each die vs ${general.name}!`);
            this.ambushGeneralUsed = true;
        }
        if (questBonusSolo > 0) {
            this.addLog(`📜 Amulet of the Gods: ${hero.name} gains +1 to all attack rolls vs ${general.name}!`);
        }
        
        let damage = 0;
        let diceHTML = '';
        const diceRolls = []; // Track rolls for logging
        
        // Map general faction to die CSS class and inline bg
        const _factionDieClass = general.faction === 'Orc' ? 'die-green' : general.faction === 'Undead' ? 'die-black' : general.faction === 'Demon' ? 'die-red' : 'die-blue';
        const _factionDieBg = { 'die-green':'linear-gradient(145deg,#16a34a,#15803d)', 'die-black':'linear-gradient(145deg,#374151,#1f2937)', 'die-red':'linear-gradient(145deg,#dc2626,#991b1b)', 'die-blue':'linear-gradient(145deg,#3b82f6,#1d4ed8)' }[_factionDieClass];

        // Roll all dice from all selected cards
        for (let i = 0; i < totalDice; i++) {
            const roll = Math.floor(Math.random() * 6) + 1;
            const hit = roll >= hitReq;
            if (hit) damage++;
            diceRolls.push({roll, hit});
            diceHTML += `<div class="die ${_factionDieClass}${hit ? '' : ' die-fade-miss'}" style="background:${_factionDieBg};color:#fff;border:2px solid rgba(0,0,0,0.3);${hit ? '' : 'opacity:0.28;'}">${roll}</div>`;
        }
        
        // ===== EAGLE RIDER GROUND ATTACK RE-ROLL PHASE =====
        // Check if Eagle Rider can re-roll (Ground Attack + not Varkolak)
        const canReroll = hero.name === 'Eagle Rider' 
            && this.eagleRiderAttackStyle === 'ground' 
            && (general.combatSkill !== 'no_rerolls' || this._amarakBlessingActive)
            && !this.eagleRiderRerollUsed;
        
        if (canReroll) {
            // Store combat state for re-roll
            this._pendingRerollCombat = {
                type: 'solo_general',
                hero: hero,
                general: general,
                cardsToUse: cardsToUse,
                totalDice: totalDice,
                hitReq: hitReq,
                diceRolls: diceRolls,
                damage: damage
            };
            
            // Show dice results with re-roll option
            const cardNames = cardsToUse.map(c => c.name).join(', ');
            const rerollHTML = `
                <div class="parchment-box">
                    <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Combat Roll</span></div>
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#1a0f0a;margin-bottom:6px;">
                        ${general.name.toUpperCase()} — ${hitReq}+ to Hit
                    </div>
                    <div style="background:linear-gradient(135deg,${hero.color}cc 0%,${hero.color}99 100%);padding:5px 10px;margin:6px 0 4px 0;border-radius:5px;border:1px solid rgba(0,0,0,0.3);"><span style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#fff;font-size:0.9em;text-shadow:0 2px 4px rgba(0,0,0,0.9),0 0 10px rgba(0,0,0,0.5);letter-spacing:1.5px;">${hero.symbol} ${hero.name.toUpperCase()}</span></div>
                    ${questBonusSolo > 0 ? '<div style="font-size:0.75em;line-height:1.5;font-family:\'Comic Sans MS\',cursive;color:#3d2b1f;margin:2px 0 4px 0;"><strong style="font-family:\'Cinzel\',Georgia,serif;font-weight:900;color:#1a0f0a;">📜 Amulet of the Gods:</strong> +1 to all rolls</div>' : ''}
                    <div style="display:flex;gap:8px;justify-content:center;margin:8px 0;flex-wrap:wrap;">
                        ${diceHTML}
                    </div>
                    ${this._buildGeneralResultsPip(general, damage)}
                </div>
            `;
            
            this.showCombatResults(
                '💥 Attack General',
                rerollHTML,
                '',
                `<button class="phb" style="margin-top:8px;" onclick="game.eagleRerollSoloCombat()">Ground Attack (Re-Roll All Dice)</button>
                 <button class="phb" style="margin-top:6px;" onclick="game.acceptSoloCombatRoll()">Continue</button>`,
                true
            );
            return; // Wait for user decision
        }
        // ================================
        
        // ===== DWARF DRAGON SLAYER RE-ROLL PHASE (solo general) =====
        const hasFailedDice = diceRolls.some(r => !r.hit);
        const canDwarfReroll = hero.name === 'Dwarf' 
            && general.faction === 'Dragon'
            && hasFailedDice
            && !this.dwarfDragonSlayerUsed;
        
        if (canDwarfReroll) {
            this._pendingRerollCombat = {
                type: 'solo_general',
                subtype: 'dragon_slayer',
                hero: hero,
                general: general,
                cardsToUse: cardsToUse,
                totalDice: totalDice,
                hitReq: hitReq,
                diceRolls: diceRolls,
                damage: damage
            };
            
            const cardNames = cardsToUse.map(c => c.name).join(', ');
            const failedCount = diceRolls.filter(r => !r.hit).length;
            const rerollHTML = `
                <div class="parchment-box">
                    <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Combat Roll</span></div>
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#1a0f0a;margin-bottom:6px;">
                        ${general.name.toUpperCase()} — ${hitReq}+ to Hit
                    </div>
                    <div style="background:linear-gradient(135deg,${hero.color}cc 0%,${hero.color}99 100%);padding:5px 10px;margin:6px 0 4px 0;border-radius:5px;border:1px solid rgba(0,0,0,0.3);"><span style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#fff;font-size:0.9em;text-shadow:0 2px 4px rgba(0,0,0,0.9),0 0 10px rgba(0,0,0,0.5);letter-spacing:1.5px;">${hero.symbol} ${hero.name.toUpperCase()}</span></div>
                    ${questBonusSolo > 0 ? '<div style="font-size:0.75em;line-height:1.5;font-family:\'Comic Sans MS\',cursive;color:#3d2b1f;margin:2px 0 4px 0;"><strong style="font-family:\'Cinzel\',Georgia,serif;font-weight:900;color:#1a0f0a;">📜 Amulet of the Gods:</strong> +1 to all rolls</div>' : ''}
                    <div style="display:flex;gap:8px;justify-content:center;margin:8px 0;flex-wrap:wrap;">
                        ${diceHTML}
                    </div>
                    ${this._buildGeneralResultsPip(general, damage)}
                </div>
            `;
            
            this.showCombatResults(
                '💥 Attack General',
                rerollHTML,
                '',
                `<button class="phb" style="margin-top:8px;" onclick="game.dwarfRerollSoloCombat()">Dragon Slayer (Re-Roll ${failedCount} Failed Dice)</button>
                 <button class="phb" style="margin-top:6px;" onclick="game.acceptSoloCombatRoll()">Continue</button>`,
                true
            );
            return;
        }
        // ================================
        
        this._finalizeSoloCombat(hero, general, cardsToUse, totalDice, hitReq, diceRolls, damage);
        
        } catch (error) {
            console.error('Combat error:', error);
            this.showInfoModal('⚠️ Combat Error', `<div style="color: #ef4444;">${error.message}<br><br>Please report this bug.</div>`);
            this.selectedCardsForAttack = [];
            this.currentCombat = null;
            this.closeCombat();
        }
    },
    
    eagleRerollSoloCombat() {
        const state = this._pendingRerollCombat;
        if (!state) return;
        
        this.eagleRiderRerollUsed = true;
        
        // Re-roll all dice
        const newRolls = [];
        let newDamage = 0;
        let newDiceHTML = '';
        
        for (let i = 0; i < state.totalDice; i++) {
            const roll = Math.floor(Math.random() * 6) + 1;
            const hit = roll >= state.hitReq;
            if (hit) newDamage++;
            newRolls.push({roll, hit});
            const _bg = hit ? 'linear-gradient(145deg,#16a34a 0%,#15803d 100%)' : 'linear-gradient(145deg,#dc2626 0%,#b91c1c 100%)';
            const _shadow = hit ? '0 3px 6px rgba(0,0,0,0.3),0 1px 2px rgba(0,0,0,0.2),inset 0 1px 0 rgba(255,255,255,0.4),0 0 8px rgba(22,163,74,0.3)' : '0 3px 6px rgba(0,0,0,0.3),0 1px 2px rgba(0,0,0,0.2),inset 0 1px 0 rgba(255,255,255,0.4),0 0 8px rgba(185,28,28,0.3)';
            newDiceHTML += `<div style="width:50px;height:50px;display:flex;align-items:center;justify-content:center;font-size:1.5em;font-weight:900;border-radius:8px;color:#ffffff;background:${_bg};border:2px solid rgba(0,0,0,0.3);box-shadow:${_shadow};">${roll}</div>`;
        }
        
        this.addLog(`🦅 Eagle Rider re-rolls all dice! New result: ${newDamage} hit(s)`);
        
        // Close results modal and finalize with new rolls
        document.getElementById('combat-results-modal').classList.remove('active');
        this._pendingRerollCombat = null;
        
        this._finalizeSoloCombat(state.hero, state.general, state.cardsToUse, state.totalDice, state.hitReq, newRolls, newDamage);
    },
    
    dwarfRerollSoloCombat() {
        const state = this._pendingRerollCombat;
        if (!state) return;
        
        this.dwarfDragonSlayerUsed = true;
        
        // Re-roll only FAILED dice
        const newRolls = [];
        let newDamage = 0;
        
        for (let i = 0; i < state.diceRolls.length; i++) {
            if (state.diceRolls[i].hit) {
                // Keep successful rolls
                newRolls.push(state.diceRolls[i]);
                newDamage++;
            } else {
                // Re-roll failed dice
                const roll = Math.floor(Math.random() * 6) + 1;
                const hit = roll >= state.hitReq;
                if (hit) newDamage++;
                newRolls.push({roll, hit});
            }
        }
        
        this.addLog(`⛏️ Dragon Slayer: Dwarf re-rolls failed dice! New result: ${newDamage} hit(s)`);
        
        document.getElementById('combat-results-modal').classList.remove('active');
        this._pendingRerollCombat = null;
        
        this._finalizeSoloCombat(state.hero, state.general, state.cardsToUse, state.totalDice, state.hitReq, newRolls, newDamage);
    },
    
    acceptSoloCombatRoll() {
        const state = this._pendingRerollCombat;
        if (!state) return;
        
        // Close results modal and finalize with original rolls
        document.getElementById('combat-results-modal').classList.remove('active');
        this._pendingRerollCombat = null;
        
        this._finalizeSoloCombat(state.hero, state.general, state.cardsToUse, state.totalDice, state.hitReq, state.diceRolls, state.damage);
    },
    
    _finalizeSoloCombat(hero, general, cardsToUse, totalDice, hitReq, diceRolls, damage) {
        try {
        
        // Check for Battle Luck re-roll opportunity (not against Varkolak)
        if (!this._battleLuckChecked && (general.combatSkill !== 'no_rerolls' || this._amarakBlessingActive)) {
            const blCard = this._findBattleLuckCard();
            const hasFailedDice = diceRolls.some(r => !r.hit);
            if (blCard && hasFailedDice) {
                const failedCount = diceRolls.filter(r => !r.hit).length;
                const cardNames = cardsToUse.map(c => c.name).join(', ');
                let dicePreviewHTML = '';
                const _generalFactionDieClass = general.faction === 'Orc' ? 'die-green' : general.faction === 'Undead' ? 'die-black' : general.faction === 'Demon' ? 'die-red' : 'die-blue';
                const _blDieBg = { 'die-green':'linear-gradient(145deg,#16a34a,#15803d)', 'die-black':'linear-gradient(145deg,#374151,#1f2937)', 'die-red':'linear-gradient(145deg,#dc2626,#991b1b)', 'die-blue':'linear-gradient(145deg,#3b82f6,#1d4ed8)' }[_generalFactionDieClass];
                diceRolls.forEach(d => {
                    dicePreviewHTML += `<div class="die ${_generalFactionDieClass}${d.hit ? '' : ' die-fade-miss'}" style="background:${_blDieBg};color:#fff;border:2px solid rgba(0,0,0,0.3);${d.hit ? '' : 'opacity:0.28;'}">${d.roll}</div>`;
                });
                this._pendingBattleLuck = { type: 'solo_general', hero, general, cardsToUse, totalDice, hitReq, diceRolls, damage, battleLuckCard: blCard };
                const blCardNames = cardsToUse.map(c => c.name).join(', ');
                const rerollHTML = `
                    <div class="parchment-box">
                        <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Combat Roll</span></div>
                        <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#1a0f0a;margin-bottom:6px;">
                            ${general.name.toUpperCase()} — ${hitReq}+ to Hit
                        </div>
                        <div style="background:linear-gradient(135deg,${hero.color}cc 0%,${hero.color}99 100%);padding:5px 10px;margin:6px 0 4px 0;border-radius:5px;border:1px solid rgba(0,0,0,0.3);"><span style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#fff;font-size:0.9em;text-shadow:0 2px 4px rgba(0,0,0,0.9),0 0 10px rgba(0,0,0,0.5);letter-spacing:1.5px;">${hero.symbol} ${hero.name.toUpperCase()}</span></div>
                        ${this._getQuestCombatBonus(hero) > 0 ? '<div style="font-size:0.75em;line-height:1.5;font-family:\'Comic Sans MS\',cursive;color:#3d2b1f;margin:2px 0 4px 0;"><strong style="font-family:\'Cinzel\',Georgia,serif;font-weight:900;color:#1a0f0a;">📜 Amulet of the Gods:</strong> +1 to all rolls</div>' : ''}
                        <div style="display:flex;gap:8px;justify-content:center;margin:8px 0;flex-wrap:wrap;">${dicePreviewHTML}</div>
                        ${this._buildGeneralResultsPip(general, damage)}
                    </div>
                `;
                this.showCombatResults(
                    '💥 Attack General',
                    rerollHTML,
                    '',
                    `<button class="phb" style="margin-top:8px;" onclick="game.useBattleLuck()">Battle Luck (Re-Roll ${failedCount} Failed Dice)</button>
                     <button class="phb" style="margin-top:6px;" onclick="game.declineBattleLuck()">Continue</button>`,
                    true
                );
                return;
            }
        }
        this._battleLuckChecked = false;
        
        // Unicorn Steed: re-roll ALL failed dice once per combat (not against Varkolak)
        if (!this._unicornSteedRerollUsed && (general.combatSkill !== 'no_rerolls' || this._amarakBlessingActive)) {
            if (this._hasUnicornSteed(hero)) {
                const hasFailedDice = diceRolls.some(r => !r.hit);
                if (hasFailedDice) {
                    const failedCount = diceRolls.filter(r => !r.hit).length;
                    const _generalFactionDieClass2 = general.faction === 'Orc' ? 'die-green' : general.faction === 'Undead' ? 'die-black' : general.faction === 'Demon' ? 'die-red' : 'die-blue';
                    const _usDieBg = { 'die-green':'linear-gradient(145deg,#16a34a,#15803d)', 'die-black':'linear-gradient(145deg,#374151,#1f2937)', 'die-red':'linear-gradient(145deg,#dc2626,#991b1b)', 'die-blue':'linear-gradient(145deg,#3b82f6,#1d4ed8)' }[_generalFactionDieClass2];
                    let dicePreviewHTML = '';
                    diceRolls.forEach(d => {
                        dicePreviewHTML += `<div class="die ${_generalFactionDieClass2}${d.hit ? '' : ' die-fade-miss'}" style="background:${_usDieBg};color:#fff;border:2px solid rgba(0,0,0,0.3);${d.hit ? '' : 'opacity:0.28;'}">${d.roll}</div>`;
                    });
                    this._pendingUnicornReroll = { type: 'solo_general', hero, general, cardsToUse, totalDice, hitReq, diceRolls, damage };
                    const rerollHTML = `
                        <div class="parchment-box">
                            <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Combat Roll</span></div>
                            <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#1a0f0a;margin-bottom:6px;">
                                ${general.name.toUpperCase()} — ${hitReq}+ to Hit
                            </div>
                            <div style="background:linear-gradient(135deg,${hero.color}cc 0%,${hero.color}99 100%);padding:5px 10px;margin:6px 0 4px 0;border-radius:5px;border:1px solid rgba(0,0,0,0.3);"><span style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#fff;font-size:0.9em;text-shadow:0 2px 4px rgba(0,0,0,0.9),0 0 10px rgba(0,0,0,0.5);letter-spacing:1.5px;">${hero.symbol} ${hero.name.toUpperCase()}</span></div>
                            <div style="display:flex;gap:8px;justify-content:center;margin:8px 0;flex-wrap:wrap;">${dicePreviewHTML}</div>
                            ${this._buildGeneralResultsPip(general, damage)}
                        </div>
                    `;
                    this.showCombatResults(
                        '💥 Attack General',
                        rerollHTML,
                        '',
                        `<button class="phb" style="margin-top:8px;" onclick="game._useUnicornSteedReroll()">Unicorn Steed (Re-Roll ${failedCount} Failed Dice)</button>
                         <button class="phb" style="margin-top:6px;" onclick="game._declineUnicornSteedReroll()">Continue</button>`,
                        true
                    );
                    return;
                }
            }
        }
        this._unicornSteedRerollUsed = false;
        
        // GORGUTT COMBAT SKILL: Parry — mark cancelled hits, then build final dice HTML
        let hitsParried = 0;
        let parryInlineMsg = '';
        if (general.combatSkill === 'parry' && !this._amarakBlessingActive) {
            const onesRolled = diceRolls.filter(d => d.roll === 1).length;
            if (onesRolled > 0) {
                hitsParried = Math.min(onesRolled, damage);
                damage -= hitsParried;
                parryInlineMsg = `<div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.8em;color:#b91c1c;text-align:center;margin:-4px 0 6px 0;">Gorgutt parries: ${hitsParried} hit(s) eliminated</div>`;
                this.addLog(`Gorgutt parries ${hitsParried} hit(s)! (${onesRolled} 1's rolled after re-rolls)`);
            }
        }

        // Build final dice HTML (with parry-cancel overlay on last N hits)
        const _finalDieClass = general.faction === 'Orc' ? 'die-green' : general.faction === 'Undead' ? 'die-black' : general.faction === 'Demon' ? 'die-red' : 'die-blue';
        let remainingParryMarks = hitsParried;
        // Mark from the end of hit dice
        const _markedRolls = diceRolls.map(d => ({ ...d, parried: false }));
        for (let _i = _markedRolls.length - 1; _i >= 0 && remainingParryMarks > 0; _i--) {
            if (_markedRolls[_i].hit) { _markedRolls[_i].parried = true; remainingParryMarks--; }
        }
        let diceHTML = '';
        _markedRolls.forEach(d => {
            const _diceBg = { 'die-green':'linear-gradient(145deg,#16a34a,#15803d)', 'die-black':'linear-gradient(145deg,#374151,#1f2937)', 'die-red':'linear-gradient(145deg,#dc2626,#991b1b)', 'die-blue':'linear-gradient(145deg,#3b82f6,#1d4ed8)' }[_finalDieClass] || 'linear-gradient(145deg,#374151,#1f2937)';
            if (d.parried) {
                // Parry-cancelled hit: faded + red ✕ overlay (inline, no CSS ::after required)
                diceHTML += `<div class="die ${_finalDieClass} die-parry-cancel" style="background:${_diceBg};color:#fff;border:2px solid rgba(0,0,0,0.3);opacity:0.35;position:relative;"><span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:1.6em;font-weight:900;color:#b91c1c;pointer-events:none;line-height:1;">✕</span>${d.roll}</div>`;
            } else if (d.hit) {
                diceHTML += `<div class="die ${_finalDieClass}" style="background:${_diceBg};color:#fff;border:2px solid rgba(0,0,0,0.3);">${d.roll}</div>`;
            } else {
                diceHTML += `<div class="die ${_finalDieClass} die-fade-miss" style="background:${_diceBg};color:#fff;border:2px solid rgba(0,0,0,0.3);opacity:0.28;">${d.roll}</div>`;
            }
        });
        
        general.health -= damage;
        
        // Set wound info if general survived
        if (general.health > 0 && damage > 0) {
            this._setGeneralWound(general, this.currentPlayerIndex);
        }
        
        // Remove all used cards from hero's hand BEFORE any rewards
        // This must happen before drawing reward cards to avoid array mutation issues
        cardsToUse.forEach(cardToRemove => {
            const currentIndex = hero.cards.indexOf(cardToRemove);
            if (currentIndex !== -1) {
                hero.cards.splice(currentIndex, 1);
                this.heroDiscardPile++;
            }
        });
        
        // Clear selected cards for next attack
        this.selectedCardsForAttack = [];
        
        if (general.health <= 0) {
            general.health = 0;
            general.defeated = true;
            delete this.generalWounds[general.color]; // Clear wounds on defeat
            this.updateWarStatus();
            
            console.log('General defeated! Drawing reward cards for attacking hero');
            console.log('heroDeck exists:', !!this.heroDeck);
            console.log('heroDeck length:', this.heroDeck ? this.heroDeck.length : 'undefined');
            
            // Collect all drawn cards for display
            const allDrawnCards = [];
            
            // When a general is defeated in solo attack, only the attacking hero draws 3 cards
            const rewardHeroes = [hero];
            rewardHeroes.forEach(h => {
                const drawnCards = [];
                for (let i = 0; i < 3; i++) {
                    const drawnCard = this.generateRandomCard();
                    if (drawnCard) {
                        h.cards.push(drawnCard);
                        drawnCards.push(drawnCard);
                    } else {
                        console.warn('Hero deck is empty, cannot draw more cards');
                        break;
                    }
                }
                
                // Store for modal display
                if (drawnCards.length > 0) {
                    allDrawnCards.push({
                        hero: h,
                        cards: drawnCards
                    });
                    this.addLog(`${h.name} draws: ${drawnCards.map(c => c.name).join(', ')}`);
                } else {
                    console.log(`${h.name} could not draw any cards (deck empty)`);
                }
            });
            
            // Store for showing after combat results
            this.pendingRewardCards = allDrawnCards;
            
            this.addLog(`${general.name} DEFEATED! ${hero.name} draws 3 cards as reward!`);
            
            // Check if all generals are defeated (VICTORY!)
            const allGeneralsDefeated = this.generals.every(g => g.defeated);
            if (allGeneralsDefeated) {
                this.pendingVictory = true; // Flag to show victory after reward modal closes
            }
        }
        
        this.actionsRemaining--;
        
        const cardNames = cardsToUse.map(c => c.name).join(', ');
        
        // Log detailed combat results to game log
        const rollsText = diceRolls.map(r => r.hit ? `[${r.roll}✓]` : `[${r.roll}✗]`).join(' ');
        this.addLog(`${hero.name} vs ${general.name}: ${cardNames} → ${rollsText} → ${damage} damage!`);
        
        // Add Varkolak no-reroll message to results HTML if applicable
        let noRerollWarning = '';
        if (general.combatSkill === 'no_rerolls' && !this._amarakBlessingActive) {
            noRerollWarning = `
                <div class="parchment-box" style="margin-top:10px;">
                    <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">💀 Undead Curse</span></div>
                    <p style="font-family:'Comic Sans MS',cursive; font-size:0.9em; color:#3d2b1f; margin:8px 0;">Varkolak prevents all re-rolls and special skills in combat!</p>
                </div>
            `;
        }
        
        const resultsHTML = `
            <div class="parchment-box">
                <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Combat Roll</span></div>
                <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#1a0f0a;margin-bottom:6px;">
                    ${general.name.toUpperCase()} — ${hitReq}+ to Hit
                </div>
                <div style="background:linear-gradient(135deg,${hero.color}cc 0%,${hero.color}99 100%);padding:5px 10px;margin:6px 0 4px 0;border-radius:5px;border:1px solid rgba(0,0,0,0.3);"><span style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#fff;font-size:0.9em;text-shadow:0 2px 4px rgba(0,0,0,0.9),0 0 10px rgba(0,0,0,0.5);letter-spacing:1.5px;">${hero.symbol} ${hero.name.toUpperCase()}</span></div>
                ${this._getQuestCombatBonus(hero) > 0 ? '<div style="font-size:0.75em;line-height:1.5;font-family:\'Comic Sans MS\',cursive;color:#3d2b1f;margin:2px 0 4px 0;"><strong style="font-family:\'Cinzel\',Georgia,serif;font-weight:900;color:#1a0f0a;">📜 Amulet of the Gods:</strong> +1 to all rolls</div>' : ''}
                ${this._amarakBlessingActive && general.combatSkill ? '<div style="font-size:0.75em;line-height:1.5;font-family:\'Comic Sans MS\',cursive;color:#3d2b1f;margin:2px 0 4px 0;"><strong style="font-family:\'Cinzel\',Georgia,serif;font-weight:900;color:#1a0f0a;">📜 Amarak\'s Blessing:</strong> ' + general.combatSkillName + ' Ignored!</div>' : ''}
                <div style="display:flex;gap:8px;justify-content:center;margin:8px 0;flex-wrap:wrap;">
                    ${diceHTML}
                </div>
                ${parryInlineMsg}
                ${this._buildGeneralResultsPip(general, damage)}
                ${noRerollWarning}
            </div>
        `;
        
        const message = damage > 0 ? 
            `${damage} damage dealt! ${general.name} has ${general.health}/${general.maxHealth} life tokens remaining.` :
            `No damage dealt. ${general.name} still has ${general.health}/${general.maxHealth} life tokens.`;
        
        // Show combat results BEFORE any other cleanup
        if (general.defeated) {
            this.showCombatResults(
                '💥 Attack General',
                resultsHTML,
                '',
                `<button class="phb" style="margin-top:8px;" onclick="game.closeCombatResults()">Continue</button>`
            );
            // Victory check handled by pendingVictory flag → closeGeneralRewardModal → showVictoryModal
        } else {
            // General survived - check for combat skills
            let combatSkillMessage = '';
            
            // Sapphire's Regeneration: Returns to full health if not defeated in single combat
            if (general.combatSkill === 'regeneration' && !this._amarakBlessingActive && damage < general.maxHealth) {
                const healedAmount = general.maxHealth - general.health;
                general.health = general.maxHealth;
                combatSkillMessage = `<br><br><span style="color: #ef4444; font-weight: bold;">⚡ REGENERATION!</span><br><span style="color: #d4af37;">${general.name} was not defeated and heals ${healedAmount} life token(s) back to full!</span>`;
                this.addLog(`${general.name} regenerates to full health (${general.maxHealth}/${general.maxHealth})!`);
            }
            
            // General survived - hero defeated penalty!
            const penalty = general.heroDefeatedPenalty;
            
            if (penalty) {
                // Eagle Rider Sky Attack: No penalties from failing to defeat generals
                if (hero.name === 'Eagle Rider' && this.eagleRiderAttackStyle === 'sky') {
                    combatSkillMessage += `<br><br><span style="color: #60a5fa; font-weight: bold;">☁️ SKY ATTACK</span><br><span style="color: #d4af37;">Eagle Rider soars away — no wounds or card loss!</span>`;
                    this.addLog(`☁️ Eagle Rider's Sky Attack negates all penalties from ${general.name}!`);
                    this.showCombatResults('💥 Attack General', resultsHTML, '', `<button class="phb" style="margin-top:8px;" onclick="game.closeCombatResults()">Continue</button>`);
                    return;
                }
                
                // War Banner of Valor: Ignore Hero Defeated penalties
                if (this._hasWarBanner(hero)) {
                    combatSkillMessage += `<br><br><span style="color: #a78bfa; font-weight: bold;">🚩 WAR BANNER OF VALOR</span><br><span style="color: #d4af37;">${hero.name} ignores all wounds and penalties!</span>`;
                    this.addLog(`🚩 War Banner of Valor: ${hero.name} ignores Hero Defeated penalties from ${general.name}!`);
                    this.showCombatResults('💥 Attack General', resultsHTML, '', `<button class="phb" style="margin-top:8px;" onclick="game.closeCombatResults()">Continue</button>`);
                    return;
                }
                
                let woundsTaken = 0;
                let woundRoll = null;
                
                // Apply wounds
                if (penalty.woundsType === 'd3') {
                    // Roll D3 for wounds (Balazarg)
                    woundRoll = Math.floor(Math.random() * 3) + 1; // 1-3
                    woundsTaken = woundRoll;
                    this.addLog(`${hero.name} rolls D3 for wounds: [${woundRoll}] - takes ${woundsTaken} wound(s) from failing to defeat ${general.name}!`);
                } else if (penalty.woundsType === 'd6') {
                    // Roll D6 for wounds (Varkolak)
                    woundRoll = Math.floor(Math.random() * 6) + 1; // 1-6
                    woundsTaken = woundRoll;
                    this.addLog(`${hero.name} rolls D6 for wounds: [${woundRoll}] - takes ${woundsTaken} wound(s) from failing to defeat ${general.name}!`);
                } else if (penalty.wounds > 0) {
                    // Fixed wounds (other generals)
                    woundsTaken = penalty.wounds;
                    this.addLog(`${hero.name} takes ${woundsTaken} wound(s) from failing to defeat ${general.name}!`);
                }
                
                // Paladin's Aura of Righteousness / Dwarf's Armor and Toughness: Ignore 1 wound from generals
                if ((hero.name === 'Paladin' || hero.name === 'Dwarf') && woundsTaken > 0) {
                    woundsTaken = Math.max(0, woundsTaken - 1);
                    const abilityName = hero.name === 'Paladin' ? 'Aura of Righteousness' : 'Armor and Toughness';
                    this.addLog(`${hero.symbol} ${hero.name}'s ${abilityName} reduces damage by 1! Final damage: ${woundsTaken}`);
                }
                
                // ALL solo attacks now use group penalty modal for consistency
                console.log('=== Solo attack: Using group penalty modal ===');
                
                // Store as group penalty (even though only 1 hero)
                this.pendingGroupPenalty = {
                    general: general,
                    heroes: [hero],
                    retreatHeroes: [hero]
                };
                
                // Clear solo-from-group flag if set
                if (this.soloFromGroupAttack) {
                    this.soloFromGroupAttack = false;
                }
                
                this.showCombatResults('💥 Attack General', resultsHTML, '', `<button class="phb" style="margin-top:8px;" onclick="game.closeCombatResults()">Continue</button>`);
                return; // Skip immediate wound application - modal handles it
                
                // OLD CODE BELOW IS UNREACHABLE - Kept for reference only
                // All penalty application now goes through group penalty modal
            }
            
            this.showCombatResults('💥 Attack General', resultsHTML, '', `<button class="phb" style="margin-top:8px;" onclick="game.closeCombatResults()">Continue</button>`);
        }
        
        // IMPORTANT: Don't call closeCombat() - let the user close the results modal
        // this.closeCombat();  // REMOVED - was hiding the combat modal before results shown
        
        this.renderGenerals();
        this.renderTokens();
        this.renderHeroes();
        this.updateGameStatus();
        
        // Update map if open - DIRECT update
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            const mapActionsLeft = document.getElementById('map-actions-left');
            if (mapActionsLeft) {
                mapActionsLeft.textContent = this.actionsRemaining;
            }
        }
        
        } catch (error) {
            console.error('Combat error:', error);
            this.showInfoModal('⚠️ Combat Error', `<div style="color: #ef4444;">${error.message}<br><br>Please report this bug.</div>`);
            this.selectedCardsForAttack = [];
            this.currentCombat = null;
            this.closeCombat();
        }
    },
    
    _buildGeneralResultsPip(general, damage) {
        const META = {
            'Balazarg': { tokenColor:'#dc2626', majorWoundThreshold:1, combatSkillDesc:'Players must roll a die for each card to be played prior to the Battle. Discard a card for each 1 rolled.' },
            'Gorgutt':  { tokenColor:'#16a34a', majorWoundThreshold:2, combatSkillDesc:'Gorgutt parries successful attacks for each 1 rolled. Eliminate 1 hit for each die with a 1 at the end of re-rolls.' },
            'Varkolak': { tokenColor:'#1f2937', majorWoundThreshold:0, combatSkillDesc:'Player may not use any re-rolls or special skills against Varkolak.' },
            'Sapphire': { tokenColor:'#2563eb', majorWoundThreshold:0, combatSkillDesc:'Returns to full health if not defeated in a single combat.' },
        };
        const meta = META[general.name] || { tokenColor:'#374151', majorWoundThreshold:0, combatSkillDesc:'' };
        const tokenColor = meta.tokenColor;
        const majorT = meta.majorWoundThreshold;
        const currentHealth = Math.max(0, general.health);
        const emoji = general.symbol || '⚔️';

        // Life tracker: boxes from maxHealth → 1, then skull
        let trackerHTML = '';
        for (let n = general.maxHealth; n >= 1; n--) {
            const isLost = n > currentHealth;
            const isMajor = majorT > 0 && n <= majorT;
            const isActive = !general.defeated && n === currentHealth;
            let cls = 'lt-box';
            if (isLost) cls += ' lost';
            if (isMajor) cls += ' major';
            const bg = isLost ? 'rgba(139,115,85,0.1)' : isMajor ? 'rgba(220,38,38,0.2)' : 'rgba(139,115,85,0.1)';
            const border = isLost ? '2px solid #8b7355' : isMajor ? '2px solid #b91c1c' : '2px solid #8b7355';
            const opacity = isLost ? '0.35' : '1';
            const marker = isActive ? `<span class="lt-marker" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:30px;height:30px;border-radius:50%;border:2px solid rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:1.05em;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,0.4);background:${tokenColor};">${emoji}</span>` : '';
            trackerHTML += `<div class="${cls}" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:4px;border:${border};background:${bg};font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1.05em;color:#3d2b1f;position:relative;opacity:${opacity};flex-shrink:0;">${marker}${n}</div>`;
        }
        // Skull box
        const skullMarker = general.defeated ? `<span class="lt-marker" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:30px;height:30px;border-radius:50%;border:2px solid rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:1.05em;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,0.4);background:${tokenColor};">${emoji}</span>` : '';
        trackerHTML += `<div class="lt-box skull" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:4px;border:2px solid #7c3aed;background:rgba(88,28,135,0.35);font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1.05em;color:#3d2b1f;position:relative;flex-shrink:0;">${skullMarker}☠️</div>`;

        // Wound type
        let woundLabel, woundDesc;
        if (general.defeated) {
            woundLabel = 'Defeated:'; woundDesc = 'General removed from play.';
        } else if (damage === 0) {
            woundLabel = 'No Wound:'; woundDesc = 'No damage dealt.';
        } else if (majorT > 0 && currentHealth <= majorT) {
            woundLabel = 'Major Wound:'; woundDesc = 'Start healing after this hero\'s next turn.';
        } else {
            woundLabel = 'Minor Wound:'; woundDesc = 'Start Healing after the next hero\'s turn.';
        }

        const tokenCircle = `<span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:${tokenColor};border-radius:50%;border:2px solid rgba(0,0,0,0.4);box-shadow:0 1px 4px rgba(0,0,0,0.4),inset 0 0 6px rgba(255,255,255,0.15);font-size:0.7em;">${emoji}</span>`;
        const woundCount = `${damage} wound${damage !== 1 ? 's' : ''}`;

        return `
            <div class="combat-results-label">Combat Results:</div>
            <div style="background:rgba(139,115,85,0.1);border:1px solid rgba(139,115,85,0.3);border-radius:5px;padding:5px 10px;color:#2c1810;margin:4px 0;">
                <div style="display:flex;align-items:center;gap:6px;font-size:0.9em;">${tokenCircle}<span style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:${tokenColor};">${general.name}</span><span style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#b91c1c;">— ${woundCount}</span></div>
                <div class="lt-tracker" style="display:flex;gap:4px;justify-content:center;margin:6px 0 4px 0;flex-wrap:wrap;">${trackerHTML}</div>
                <div style="margin-top:2px;font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS',cursive;color:#3d2b1f;"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1.15em;color:#1a0f0a;">${woundLabel}</strong> ${woundDesc}</div>
                <div style="margin-top:4px;font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS',cursive;color:#3d2b1f;"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1.15em;color:#1a0f0a;">Combat Skill:</strong> ${meta.combatSkillDesc}</div>
            </div>`;
    },

    showCombatResults(title, resultsHTML, summaryText, buttonsHTML, hideClose) {
        console.log('showCombatResults called');
        
        const content = document.getElementById('combat-results-content');
        if (!content) {
            console.error('combat-results-content element not found!');
            this.addLog('ERROR: Cannot show combat results - modal element missing');
            return;
        }

        // Only render summary bar if summaryText is provided
        const summaryHTML = summaryText
            ? `<div style="margin-top:10px; padding:10px 14px; background:linear-gradient(135deg,#5c3d2e,#4a2f20); border:2px solid #8b7355; border-radius:8px; text-align:center;"><span class="hero-banner-name" style="font-size:0.95em">${summaryText}</span></div>`
            : '';
        
        content.innerHTML = `
            ${resultsHTML}
            ${summaryHTML}
            ${buttonsHTML || ''}
        `;
        
        const modal = document.getElementById('combat-results-modal');
        if (!modal) {
            console.error('combat-results-modal element not found!');
            this.addLog('ERROR: Cannot show combat results - modal not found');
            return;
        }

        // Update modal chrome title dynamically
        if (title) {
            const titleEl = modal.querySelector('h2, .modal-title, [id*="title"], [class*="title"]');
            if (titleEl) {
                titleEl.textContent = title;
                titleEl.style.cssText = "font-family:'Cinzel',Georgia,serif;font-weight:900;text-align:center;font-size:1.15em;color:#d4af37;margin-bottom:8px;";
            }
        }
        
        // Always hide default Continue button (buttons are injected inline)
        // Always hide X close button and fix the extra padding-top its :has() selector causes
        const defaultBtn = modal.querySelector('.modal-content > .btn-primary');
        const closeBtn = modal.querySelector('.modal-close-btn');
        const modalContent = modal.querySelector('.modal-content');
        if (defaultBtn) defaultBtn.style.display = 'none';
        if (closeBtn) closeBtn.style.display = 'none';
        if (modalContent) modalContent.style.paddingTop = '20px';
        
        modal.classList.add('active');
        console.log('Combat results modal activated, classList:', modal.classList.toString());
    },
    
    closeCombatResults() {
        console.log('=== closeCombatResults called ===');
        console.log('pendingGroupPenalty:', this.pendingGroupPenalty);
        
        this.rangedAttack = false;
        
        const resultsModal = document.getElementById('combat-results-modal');
        resultsModal.classList.remove('active');
        
        // Restore default button visibility (close btn stays hidden — never used in results modal)
        const defaultBtn = resultsModal.querySelector('.modal-content > .btn-primary');
        if (defaultBtn) defaultBtn.style.display = '';
        
        // Update action buttons since minions/generals may have changed
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            this.updateActionButtons();
        }
        
        // If there's a pending GROUP penalty (group failed to defeat general)
        if (this.pendingGroupPenalty) {
            console.log('=== Processing GROUP PENALTY ===');
            const general = this.pendingGroupPenalty.general;
            const heroes = this.pendingGroupPenalty.heroes;
            const penalty = general.heroDefeatedPenalty;
            
            console.log('General:', general.name);
            console.log('Heroes:', heroes.map(h => h.name));
            console.log('Penalty:', penalty);
            
            // Build summary of all penalties
            let summaryHTML = `<div style="background: rgba(239,68,68,0.2); padding: 20px; border-radius: 10px; margin: 20px 0;">`;
            summaryHTML += `<h3 style="color: #ef4444; margin-bottom: 15px;">🤝 GROUP DEFEATED!</h3>`;
            summaryHTML += `<p style="color: #d4af37; margin-bottom: 15px;">All ${heroes.length} heroes suffer ${general.name}'s penalty:</p>`;
            
            const penaltyResults = [];
            
            // Calculate penalties for each hero
            heroes.forEach(hero => {
                let woundsTaken = 0;
                let woundRoll = null;
                let cardsToLose = 0;
                let cardRoll = null;
                
                // Eagle Rider Sky Attack: No penalties
                if (hero.name === 'Eagle Rider' && this.eagleRiderAttackStyle === 'sky') {
                    summaryHTML += `<div style="margin: 5px 0; color: #60a5fa;">☁️ ${hero.name}: Sky Attack — No penalties!</div>`;
                    penaltyResults.push({
                        hero: hero,
                        woundsTaken: 0,
                        cardsToLose: 0,
                        cardRoll: null,
                        skyAttackProtected: true
                    });
                    return; // Skip to next hero
                }
                
                // War Banner of Valor: Ignore Hero Defeated penalties
                if (this._hasWarBanner(hero)) {
                    summaryHTML += `<div style="margin: 5px 0; color: #a78bfa;">🚩 ${hero.name}: War Banner of Valor — No penalties!</div>`;
                    this.addLog(`🚩 War Banner of Valor: ${hero.name} ignores Hero Defeated penalties from ${general.name}!`);
                    penaltyResults.push({
                        hero: hero,
                        woundsTaken: 0,
                        cardsToLose: 0,
                        cardRoll: null,
                        warBannerProtected: true
                    });
                    return; // Skip to next hero
                }
                
                // Calculate wounds
                const woundDieType = penalty.woundsType === 'd3' ? 'D3' : penalty.woundsType === 'd6' ? 'D6' : null;
                if (penalty.woundsType === 'd3') {
                    woundRoll = Math.floor(Math.random() * 3) + 1;
                    woundsTaken = woundRoll;
                } else if (penalty.woundsType === 'd6') {
                    woundRoll = Math.floor(Math.random() * 6) + 1;
                    woundsTaken = woundRoll;
                } else if (penalty.wounds > 0) {
                    woundsTaken = penalty.wounds;
                }
                
                // Paladin's Aura / Dwarf's Armor and Toughness
                if ((hero.name === 'Paladin' || hero.name === 'Dwarf') && woundsTaken > 0) {
                    const original = woundsTaken;
                    woundsTaken = Math.max(0, woundsTaken - 1);
                    const abilityName = hero.name === 'Paladin' ? 'Aura' : 'Armor';
                    const rollText = woundDieType && woundRoll !== null ? ` (${woundDieType}: [${woundRoll}])` : '';
                    summaryHTML += `<div style="margin: 5px 0; color: ${hero.color};">${hero.symbol} ${hero.name}: ${original} wounds${rollText} - 1 (${abilityName}) = ${woundsTaken} wounds</div>`;
                } else {
                    summaryHTML += `<div style="margin: 5px 0;">${hero.symbol} ${hero.name}: ${woundsTaken} wound${woundsTaken !== 1 ? 's' : ''}`;
                    if (woundDieType && woundRoll !== null) summaryHTML += ` (${woundDieType}: [${woundRoll}])`;
                    summaryHTML += `</div>`;
                }
                
                // Calculate card loss
                const cardDieType = penalty.cardsLostType === 'd6' ? 'D6' : null;
                if (penalty.cardsLost === 'all') {
                    cardsToLose = 'all';
                } else if (penalty.cardsLostType === 'd6') {
                    cardRoll = Math.floor(Math.random() * 6) + 1;
                    cardsToLose = cardRoll;
                } else if (penalty.cardsLost > 0) {
                    cardsToLose = penalty.cardsLost;
                }
                
                penaltyResults.push({
                    hero: hero,
                    woundsTaken: woundsTaken,
                    cardsToLose: cardsToLose,
                    cardRoll: cardRoll
                });
            });
            
            summaryHTML += `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #666;">`;
            summaryHTML += `<strong>Card Loss:</strong><br>`;
            penaltyResults.forEach(result => {
                if (result.cardsToLose === 'all') {
                    summaryHTML += `<div style="margin: 5px 0;">${result.hero.symbol} ${result.hero.name}: ALL cards</div>`;
                } else if (result.cardRoll !== null) {
                    summaryHTML += `<div style="margin: 5px 0;">${result.hero.symbol} ${result.hero.name}: ${result.cardsToLose} cards (D6: [${result.cardRoll}])</div>`;
                } else if (result.cardsToLose > 0) {
                    summaryHTML += `<div style="margin: 5px 0;">${result.hero.symbol} ${result.hero.name}: ${result.cardsToLose} cards</div>`;
                }
            });
            summaryHTML += `</div></div>`;
            
            // Show penalty summary in modal instead of alert
            console.log('=== Showing GROUP PENALTY MODAL ===');
            console.log('Summary HTML length:', summaryHTML.length);
            
            const penaltyModal = document.getElementById('group-penalty-modal');
            const penaltyContent = document.getElementById('group-penalty-content');
            
            if (!penaltyModal || !penaltyContent) {
                console.error('Group penalty modal elements not found!');
                this.showInfoModal('⚠️', '<div>ERROR: Cannot show group penalty modal</div>');
                return;
            }
            
            penaltyContent.innerHTML = summaryHTML;
            penaltyModal.classList.add('active');
            console.log('Group penalty modal activated');
            
            // Store penalty results AND general AND retreat info for application after modal closes
            this.pendingGroupPenaltyResults = penaltyResults;
            this.pendingGroupPenaltyGeneral = general;
            this.pendingGroupPenaltyRetreat = {
                heroes: heroes,
                generalName: general.name
            };
            
            // Clear the main pending group penalty (we'll handle it in closeGroupPenaltyModal)
            this.pendingGroupPenalty = null;
            return; // Don't process yet - wait for modal to close
        }
        
        // If there's a pending general penalty (failed to defeat general), apply card loss
        if (this.pendingGeneralPenalty) {
            const hero = this.heroes[this.currentPlayerIndex];
            const cardsToLose = this.pendingGeneralPenalty.cardsLost;
            const cardsLostType = this.pendingGeneralPenalty.cardsLostType;
            const generalName = this.pendingGeneralPenalty.generalName;
            const woundRoll = this.pendingGeneralPenalty.woundRoll;
            
            // Build reason text with wound roll if present
            let reasonText = `Failed to defeat ${generalName}`;
            if (woundRoll !== null && woundRoll !== undefined) {
                reasonText += ` (Rolled [${woundRoll}] for wounds)`;
            }
            
            if (cardsToLose === 'all') {
                // Balazarg: Lose ALL cards
                if (hero.cards.length > 0) {
                    const allCards = hero.cards.map(c => c.name).join(', ');
                    const cardCount = hero.cards.length;
                    
                    // Remove all cards
                    hero.cards = [];
                    this.heroDiscardPile += cardCount;
                    
                    this.addLog(`${hero.name} loses ALL cards (${cardCount}) from failing to defeat ${generalName}!`);
                    this.addLog(`Discarded: ${allCards}`);
                    
                    // Show alert since no modal needed
                    this.showInfoModal('⚠️', `<div>${hero.name} loses ALL ${cardCount} cards!<br><br>Discarded: ${allCards}</div>`);
                    
                    // Update UI
                    this.renderHeroes();
                    this.updateGameStatus();
                    
                    // Check for retreat (no card modal shown)
                    if (this.pendingGeneralPenalty.retreatHeroes) {
                        this.pendingRetreat = {
                            heroes: this.pendingGeneralPenalty.retreatHeroes,
                            generalName: generalName
                        };
                        // Show retreat modal after a brief delay
                        setTimeout(() => this.showRetreatModal(), 500);
                    }
                } else {
                    this.addLog(`${hero.name} has no cards to discard from failing to defeat ${generalName}`);
                    
                    // Check for retreat (no card modal shown)
                    if (this.pendingGeneralPenalty.retreatHeroes) {
                        this.pendingRetreat = {
                            heroes: this.pendingGeneralPenalty.retreatHeroes,
                            generalName: generalName
                        };
                        // Show retreat modal immediately
                        setTimeout(() => this.showRetreatModal(), 100);
                    }
                }
            } else if (cardsLostType === 'd6') {
                // Varkolak: Roll D6 for number of cards to lose
                if (hero.cards.length > 0) {
                    const cardRoll = Math.floor(Math.random() * 6) + 1; // 1-6
                    const actualCardsToLose = Math.min(cardRoll, hero.cards.length);
                    
                    // Update reason text with card roll
                    reasonText += ` (Rolled [${cardRoll}] for cards)`;
                    
                    this.addLog(`${hero.name} rolls D6 for cards: [${cardRoll}] - must discard ${actualCardsToLose} card(s) from failing to defeat ${generalName}!`);
                    this.showCardDiscardModal(actualCardsToLose, reasonText);
                } else {
                    this.addLog(`${hero.name} has no cards to discard from failing to defeat ${generalName}`);
                    
                    // Check for retreat (no card modal shown)
                    if (this.pendingGeneralPenalty.retreatHeroes) {
                        this.pendingRetreat = {
                            heroes: this.pendingGeneralPenalty.retreatHeroes,
                            generalName: generalName
                        };
                        setTimeout(() => this.showRetreatModal(), 100);
                    }
                }
            } else if (cardsToLose > 0) {
                // Other generals: Choose specific number of cards
                if (hero.cards.length > 0) {
                    const actualCardsToLose = Math.min(cardsToLose, hero.cards.length);
                    this.addLog(`${hero.name} must discard ${actualCardsToLose} card(s) from failing to defeat ${generalName}!`);
                    this.showCardDiscardModal(actualCardsToLose, reasonText);
                } else {
                    this.addLog(`${hero.name} has no cards to discard from failing to defeat ${generalName}`);
                    
                    // Check for retreat (no card modal shown)
                    if (this.pendingGeneralPenalty.retreatHeroes) {
                        this.pendingRetreat = {
                            heroes: this.pendingGeneralPenalty.retreatHeroes,
                            generalName: generalName
                        };
                        setTimeout(() => this.showRetreatModal(), 100);
                    }
                }
            }
            
            // Store retreat info for showing after card discard
            if (this.pendingGeneralPenalty.retreatHeroes) {
                this.pendingRetreat = {
                    heroes: this.pendingGeneralPenalty.retreatHeroes,
                    generalName: generalName
                };
            }
            
            // Clear pending penalty
            this.pendingGeneralPenalty = null;
        }
        // If there are pending reward cards from defeating a general, show them
        else if (this.pendingRewardCards && this.pendingRewardCards.length > 0) {
            const defeatedGeneral = this.currentCombat && this.currentCombat.target ? 
                this.currentCombat.target.name : 'the General';
            this.showGeneralRewardModal(defeatedGeneral, this.pendingRewardCards);
        }
        
        // Clear group attack if no penalties/rewards to process
        if (!this.pendingGroupPenalty && !this.pendingGeneralPenalty && !this.pendingRewardCards) {
            this.groupAttack = null;
        }
        
        // Restore original active player if this was a solo-converted-from-group attack
        if (this.soloAttackOriginalPlayer !== undefined) {
            console.log('=== Restoring original player after solo-from-group attack ===');
            console.log('Changing from:', this.currentPlayerIndex, 'to:', this.soloAttackOriginalPlayer);
            this.currentPlayerIndex = this.soloAttackOriginalPlayer;
            this.soloAttackOriginalPlayer = undefined;
        }
    },
    
    showCardDiscardModal(numCards, reason) {
        const hero = this.heroes[this.currentPlayerIndex];
        console.log('=== showCardDiscardModal called ===');
        console.log('NumCards:', numCards, 'Hero has:', hero.cards.length);
        
        // Special case: 0 cards to discard OR hero has no cards
        // Show acknowledgment modal instead
        if (numCards <= 0 || hero.cards.length === 0) {
            const message = numCards <= 0 
                ? `${hero.name} would lose 0 cards - no penalty!`
                : `${hero.name} has no cards to discard`;
            
            this.addLog(message);
            
            // Show acknowledgment alert
            this.showInfoModal('📋 Card Loss Penalty', `<div>${reason}<br><br>${message}</div>`);
            return;
        }
        
        // Store discard state
        this.pendingCardDiscard = {
            numCards: numCards,
            selectedIndices: []
        };
        
        // If hero has exactly the number of cards needed or fewer, auto-select all
        if (hero.cards.length <= numCards) {
            const allCardIndices = hero.cards.map((_, i) => i);
            this.pendingCardDiscard.selectedIndices = allCardIndices;
            console.log('=== Auto-selected all', allCardIndices.length, 'cards ===');
            // Don't auto-confirm - show the modal so player sees what's happening
        }
        
        // Set reason text
        const reasonElement = document.getElementById('card-discard-reason');
        if (reasonElement) {
            reasonElement.textContent = reason;
        }
        
        // Set instruction text
        const instructionElement = document.getElementById('card-discard-instruction');
        if (instructionElement) {
            if (hero.cards.length <= numCards) {
                instructionElement.textContent = `All ${hero.cards.length} cards will be discarded:`;
            } else {
                instructionElement.textContent = `Select ${numCards} card(s) to discard:`;
            }
        }
        
        // Render cards
        const cardsContainer = document.getElementById('card-discard-cards');
        if (cardsContainer) {
            const cardColorMap = {
                'red': '#dc2626',
                'blue': '#2563eb',
                'green': '#16a34a',
                'black': '#1f2937'
            };
            
            cardsContainer.innerHTML = hero.cards.map((card, index) => {
                const isSelected = this.pendingCardDiscard.selectedIndices.includes(index);
                return `
                <div class="card-select-item" 
                     id="discard-card-${index}"
                     onclick="game.toggleDiscardCard(${index})"
                     style="
                         border: 3px solid ${(card.special ? '#9333ea' : (cardColorMap[card.color] || '#666'))};
                         padding: 10px;
                         border-radius: 8px;
                         cursor: pointer;
                         background: ${isSelected ? '#4a4a4a' : '#1a1a1a'};
                         opacity: ${isSelected ? '0.5' : '1'};
                         min-width: 120px;
                         text-align: center;
                     ">
                    <div style="font-size: 2em; margin-bottom: 5px;">${card.icon}</div>
                    <div style="font-weight: bold; color: ${(card.special ? '#9333ea' : (cardColorMap[card.color] || '#666'))};">${card.name}</div>
                    <div style="font-size: 0.9em; color: #999;">🎲 ${card.dice} ${card.dice === 1 ? 'die' : 'dice'}</div>
                </div>
            `;
            }).join('');
        }
        
        // Show modal
        document.getElementById('card-discard-modal').classList.add('active');
        
        // Update button state
        this.updateDiscardButton();
    },
    
    toggleDiscardCard(index) {
        const selectedIndices = this.pendingCardDiscard.selectedIndices;
        const indexPos = selectedIndices.indexOf(index);
        
        if (indexPos > -1) {
            // Deselect
            selectedIndices.splice(indexPos, 1);
            document.getElementById(`discard-card-${index}`).style.opacity = '1';
            document.getElementById(`discard-card-${index}`).style.background = '#1a1a1a';
        } else {
            // Select (if not at limit)
            if (selectedIndices.length < this.pendingCardDiscard.numCards) {
                selectedIndices.push(index);
                document.getElementById(`discard-card-${index}`).style.opacity = '0.5';
                document.getElementById(`discard-card-${index}`).style.background = '#4a4a4a';
            }
        }
        
        this.updateDiscardButton();
    },
    
    updateDiscardButton() {
        const btn = document.getElementById('confirm-discard-btn');
        if (btn) {
            const canConfirm = this.pendingCardDiscard.selectedIndices.length === this.pendingCardDiscard.numCards;
            btn.disabled = !canConfirm;
            btn.style.opacity = canConfirm ? '1' : '0.5';
            btn.style.cursor = canConfirm ? 'pointer' : 'not-allowed';
        }
    },
    
    confirmCardDiscard() {
        // Safety check: make sure we have pending discard state
        if (!this.pendingCardDiscard) {
            console.error('confirmCardDiscard called with no pending discard!');
            return;
        }
        
        if (this.pendingCardDiscard.selectedIndices.length !== this.pendingCardDiscard.numCards) {
            return; // Button should be disabled, but just in case
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        
        // Safety check: hero still exists
        if (!hero) {
            console.error('Hero not found!');
            this.pendingCardDiscard = null;
            document.getElementById('card-discard-modal').classList.remove('active');
            return;
        }
        
        // Sort indices in descending order so we remove from end to start
        const sortedIndices = [...this.pendingCardDiscard.selectedIndices].sort((a, b) => b - a);
        
        const discardedCards = [];
        sortedIndices.forEach(index => {
            // Safety check: card still exists at index
            if (index < hero.cards.length) {
                const card = hero.cards[index];
                if (card) {
                    discardedCards.push(card.name);
                    hero.cards.splice(index, 1);
                    this.heroDiscardPile++;
                }
            }
        });
        
        if (discardedCards.length > 0) {
            this.addLog(`${hero.name} discarded: ${discardedCards.join(', ')}`);
        } else {
            this.addLog(`${hero.name} attempted to discard cards but none were available`);
        }
        
        // Clear pending state
        this.pendingCardDiscard = null;
        
        // Close modal
        document.getElementById('card-discard-modal').classList.remove('active');
        
        // If we're processing a queue, restore player index BEFORE updating UI
        if (this.pendingCardDiscardQueue && this.pendingCardDiscardQueue.length > 0) {
            console.log('=== Removing completed discard from queue ===');
            this.pendingCardDiscardQueue.shift(); // Remove first item
            
            // Restore original player index if we temporarily changed it
            if (this.tempPlayerIndex !== undefined) {
                this.currentPlayerIndex = this.tempPlayerIndex;
                this.tempPlayerIndex = undefined;
            }
            
            // Update UI after restoring player index
            this.renderHeroes();
            this.updateGameStatus();
            
            // Process next in queue (or show retreat if done)
            this.processNextCardDiscard();
            return;
        }
        
        // No queue - update UI normally
        this.renderHeroes();
        this.updateGameStatus();
        
        // No queue - check if there's a pending retreat
        if (this.pendingRetreat) {
            this.showRetreatModal();
        }
    },
    
    _findAmarakBlessingQuest() {
        // Find any hero with a completed Amarak's Blessing quest
        for (let i = 0; i < this.heroes.length; i++) {
            const hero = this.heroes[i];
            if (!hero.questCards || hero.health <= 0) continue;
            for (let j = 0; j < hero.questCards.length; j++) {
                const q = hero.questCards[j];
                if (q.completed && !q.discarded && q.mechanic &&
                    q.mechanic.rewardType === 'use_quest_card_anytime' &&
                    q.mechanic.rewardValue === 'amarak_ignore_combat_skill') {
                    return { heroIndex: i, questIndex: j, hero, quest: q };
                }
            }
        }
        return null;
    },
    
    _useAmarakBlessing() {
        const found = this._findAmarakBlessingQuest();
        if (!found) return;
        
        const { heroIndex, questIndex, hero, quest } = found;
        // Get general from whichever combat flow is active
        const general = this.groupAttack ? this.groupAttack.general
            : this.selectedGeneralForAttack
            || (this.currentCombat ? this.currentCombat.target : null);
        
        // Set the active flag
        this._amarakBlessingActive = true;
        
        // Retire the quest card
        this._retireQuest(hero, quest, 'Ignored general combat skill');
        this.updateDeckCounts();
        
        const skillName = general ? general.combatSkillName : 'combat skill';
        this.addLog(`📜 ${hero.name} uses Amarak's Blessing — ${general ? general.name + "'s" : "General's"} ${skillName} is ignored!`);
        
        this.renderHeroes();
        this.updateActionButtons();
        
        // Refresh the active combat modal to show active indicator instead of button
        if (this.groupAttack) {
            this.showGroupAttackCardSelection();
        } else if (this.selectedGeneralForAttack) {
            this.showGeneralCardSelection(this.selectedGeneralForAttack);
        } else if (this.currentCombat && this.currentCombat.type === 'general') {
            this.showCombatModal('general', this.currentCombat.target);
        }
    },
    
    closeCombat() {
        document.getElementById('combat-modal').classList.remove('active');
        document.getElementById('dice-display').innerHTML = '';
        this.currentCombat = null;
        this.rangedAttack = false;
        this._combatBonusDiceActive = false;
        this._generalBonusDiceChecked = false;
        this._amarakBlessingActive = false;
    },
    
});
