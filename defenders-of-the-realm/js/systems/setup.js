// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Setup & Initialization
// ═══════════════════════════════════════════════════════════════

Object.assign(game, {
    init() {
        // Create the official hero deck (81 cards) - deep copy from data module
        this.heroDeck = HERO_DECK_DATA.map(c => ({...c}));
        
        // Shuffle the hero deck
        this.heroDeck = this.heroDeck.sort(() => Math.random() - 0.5);
        console.log('Hero deck initialized with', this.heroDeck.length, 'official cards');
        
        // Create the official darkness deck
        this.darknessDeck = this.createDarknessDeck();
        console.log('Darkness deck initialized with', this.darknessDeck.length, 'official cards');
        
        // Create quest deck (24 cards) from data module
        this.questDeck = createQuestDeck();
        // Shuffle quest deck
        this.questDeck = this.questDeck.sort(() => Math.random() - 0.5);
        console.log('Quest deck initialized with', this.questDeck.length, 'cards');
        
        this.renderSetupScreen();
        this.setupDragAndDrop();
        
        // Initialize minions at general locations
        this.generals.forEach(g => {
            if (!this.minions[g.location]) {
                this.minions[g.location] = { red: 0, blue: 0, green: 0, black: 0 };
            }
            this.minions[g.location][g.color] = 3;
        });
        
        // Place taint crystal at Scorpion Canyon (demon starting location has 3 red minions)
        this.taintCrystals['Scorpion Canyon'] = 1;
        this.taintCrystalsRemaining = 11; // Start with 11 remaining (1 already placed)
    },
    
    createDarknessDeck() {
        // Deep copy from data module and shuffle
        const darknessCards = DARKNESS_DECK_DATA.map(c => ({...c}));
        return darknessCards.sort(() => Math.random() - 0.5);
    },
    
    // Remove a special card that was PLAYED for its effect (removed from game, not reshuffled)
    _playSpecialCard(hero, cardIndex) {
        const card = hero.cards[cardIndex];
        if (card && card.special && card.specialAction) {
            this.playedSpecialCards.push(card.specialAction);
        }
        hero.cards.splice(cardIndex, 1);
        // Do NOT increment heroDiscardPile — card is removed from the game
    },
    
    generateRandomCard() {
        // Check if deck is empty, reshuffle discard pile
        if (this.heroDeck.length === 0) {
            if (this.heroDiscardPile > 0) {
                // Reshuffle discard into deck
                this.heroDeck = this.createHeroDeckFromDiscard();
                this.heroDiscardPile = 0;
                this.showInfoModal('🔄 Deck Reshuffled', '<div>Hero deck empty! Reshuffling discard pile into deck...</div>');
                this.addLog('--- Hero deck reshuffled from discard pile ---');
                this.updateDeckCounts();
            } else {
                console.warn('Hero deck is empty and no cards to reshuffle!');
                return null;
            }
        }
        
        if (this.heroDeck && this.heroDeck.length > 0) {
            return this.heroDeck.shift();
        } else {
            console.warn('Hero deck is empty!');
            return null;
        }
    },
    
    createHeroDeckFromDiscard() {
        // Recreate the full 81-card deck from data module and shuffle
        const fullDeck = HERO_DECK_DATA.map(c => ({...c}));
        
        // Remove special cards that are currently in heroes' hands OR have been played
        // (Battle Luck has 2 copies, so track by specialAction count)
        const unavailableSpecials = {};
        // Count specials held by heroes
        this.heroes.forEach(hero => {
            hero.cards.forEach(card => {
                if (card.special && card.specialAction) {
                    unavailableSpecials[card.specialAction] = (unavailableSpecials[card.specialAction] || 0) + 1;
                }
            });
        });
        
        // Count specials still in the draw deck (shouldn't happen on reshuffle, but be safe)
        if (this.heroDeck) {
            this.heroDeck.forEach(card => {
                if (card.special && card.specialAction) {
                    unavailableSpecials[card.specialAction] = (unavailableSpecials[card.specialAction] || 0) + 1;
                }
            });
        }
        
        // Count specials that were played (removed from game permanently)
        if (this.playedSpecialCards) {
            this.playedSpecialCards.forEach(action => {
                unavailableSpecials[action] = (unavailableSpecials[action] || 0) + 1;
            });
        }
        
        const filteredDeck = [];
        const specialRemoveCount = {};
        for (const card of fullDeck) {
            if (card.special && card.specialAction && unavailableSpecials[card.specialAction]) {
                // This special is held or played — skip this copy
                if (!specialRemoveCount[card.specialAction]) specialRemoveCount[card.specialAction] = 0;
                if (specialRemoveCount[card.specialAction] < unavailableSpecials[card.specialAction]) {
                    specialRemoveCount[card.specialAction]++;
                    continue; // Skip — not available for reshuffling
                }
            }
            filteredDeck.push(card);
        }
        
        // Shuffle and return
        return filteredDeck.sort(() => Math.random() - 0.5);
    },
    
    renderSetupScreen() {
        const selection = document.getElementById('hero-selection');
        if (!selection) {
            return;
        }
        
        // Create sorted array with original indices for selection
        const heroesWithIndices = this.heroes.map((hero, index) => ({
            hero: hero,
            originalIndex: index
        }));
        
        // Sort alphabetically by hero name
        heroesWithIndices.sort((a, b) => a.hero.name.localeCompare(b.hero.name));
        
        // Hide heroes not yet ready for play
        const hiddenHeroes = ['Druid', 'White Rabbit'];
        const visibleHeroes = heroesWithIndices.filter(({hero}) => !hiddenHeroes.includes(hero.name));
        
        selection.innerHTML = visibleHeroes.map(({hero, originalIndex}) => `
            <div class="hero-select" onclick="game.toggleHeroSelection(${originalIndex})" id="hero-select-${originalIndex}">
                <div class="hero-name">${hero.symbol} ${hero.name}</div>
                <div style="margin: 5px 0; font-size: 0.85em;">${hero.ability}</div>
                <div class="hero-stats">
                    <div class="stat">❤️ ${hero.health}</div>
                </div>
            </div>
        `).join('');
    },
    
    toggleHeroSelection(index) {
        const heroSelect = document.getElementById(`hero-select-${index}`);
        const heroIndex = this.selectedHeroes.indexOf(index);
        
        if (heroIndex > -1) {
            this.selectedHeroes.splice(heroIndex, 1);
            heroSelect.classList.remove('selected');
        } else {
            if (this.selectedHeroes.length < 4) {
                this.selectedHeroes.push(index);
                heroSelect.classList.add('selected');
            }
        }
    },
    
    startGame() {
        if (this.selectedHeroes.length === 0) {
            this.showInfoModal('⚠️', '<div>Please select at least one hero!</div>');
            return;
        }
        
        this.heroes = this.selectedHeroes.map(i => this.heroes[i]);
        
        // Give each hero 2 starting cards
        this.heroes.forEach(hero => {
            hero.cards = [];
            for (let i = 0; i < 2; i++) {
                hero.cards.push(this.generateRandomCard());
            }
            // Give each hero 1 quest card
            hero.questCards = [];
            if (this.questDeck.length > 0) {
                hero.questCards.push(this.questDeck.pop());
            }
        });
        
        // Check if White Rabbit test general should be added
        const whiteRabbitCheckbox = document.getElementById('white-rabbit-checkbox');
        if (whiteRabbitCheckbox && whiteRabbitCheckbox.checked) {
            // Add White Rabbit test general
            this.generals.push({
                name: 'White Rabbit',
                color: 'black', // Uses black cards for combat
                symbol: '🐰',
                health: 3,
                maxHealth: 3,
                location: 'Father Oak Forest',
                defeated: false,
                faction: 'Undead', // Uses Undead hit requirement (4+)
                heroDefeatedPenalty: { wounds: 2, cardsLost: 2 }, // Same as Gorgutt
                combatSkill: 'parry', // Same as Gorgutt
                isTestGeneral: true // Flag to prevent movement
            });
            this.addLog('🐰 White Rabbit test general added at Father Oak Forest!');
        }
        
        document.getElementById('setup-modal').classList.remove('active');
        
        // Set actions for first hero based on their health
        this.actionsRemaining = this.heroes[0].health;
        this.eagleRiderFreshMountPending = false;
        
        this.renderTokens();
        this.renderHeroes();
        this.renderGenerals();
        this.updateGameStatus();
        this.addLog('Game started! Each hero received 2 cards and 1 quest card.');
        
        // Show Quest Setup modal, then General Setup modal
        this._showQuestSetupModal();
    },
    
    _showQuestSetupModal() {
        let questsHTML = '';
        this.heroes.forEach(hero => {
            const quest = hero.questCards && hero.questCards.length > 0 ? hero.questCards[0] : null;
            if (!quest) return;
            
            questsHTML += `
                <div style="padding: 12px; margin: 8px 0; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 4px solid ${hero.color};">
                    <div style="display: flex; align-items: flex-start; gap: 12px;">
                        <div style="flex-shrink: 0; text-align: center; min-width: 50px;">
                            <div style="font-size: 1.8em;">${hero.symbol}</div>
                            <div style="font-size: 0.8em; color: ${hero.color}; font-weight: bold; margin-top: 2px;">${hero.name}</div>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                <span style="font-size: 1.2em;">📜</span>
                                <span style="font-weight: bold; color: #ef4444; font-size: 1.05em;">${quest.name}</span>
                            </div>
                            <div style="font-size: 0.9em; color: #d4af37; margin-bottom: 4px;">${quest.description}</div>
                            <div style="font-size: 0.8em; color: #a78bfa;">🏆 Reward: ${quest.reward}</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        const contentHTML = `
            <div style="text-align: center; margin-bottom: 16px;">
                <div style="font-size: 2.5em; margin-bottom: 8px;">📜</div>
                <div style="color: #d4af37; font-size: 1.1em;">Each hero has been assigned a quest to complete!</div>
                <div style="color: #999; font-size: 0.85em; margin-top: 6px;">
                    Quests may not be discarded. Complete them to earn rewards and draw new quests.
                </div>
            </div>
            ${questsHTML}
        `;
        
        this.showInfoModal('📜 Quest Cards Drawn', contentHTML, () => {
            this._showGeneralSetupModal();
        });
    },
    
    _showGeneralSetupModal() {
        const factionColors = { red: '#dc2626', green: '#16a34a', black: '#6b7280', blue: '#3b82f6' };
        
        let generalsHTML = '';
        this.generals.forEach(g => {
            const gc = factionColors[g.color] || '#ccc';
            const hasTaint = g.color === 'red';
            
            generalsHTML += `
                <div style="padding: 10px 12px; margin: 6px 0; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 4px solid ${gc};">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                        <div>
                            <span style="font-size: 1.3em;">${g.symbol}</span>
                            <strong style="color: ${gc}; font-size: 1.05em; margin-left: 4px;">${g.name}</strong>
                            <span style="color: #999; font-size: 0.9em; margin-left: 6px;">${g.faction}</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="color: #ccc; font-size: 0.9em;">❤️ ${g.health}/${g.maxHealth}</span>
                        </div>
                    </div>
                    <div style="margin-top: 6px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px;">
                        <div style="color: #d4af37; font-size: 0.9em;">
                            📍 ${g.location}
                        </div>
                        <div style="font-size: 0.85em;">
                            <span style="color: ${gc};">●●● 3 minions</span>
                        </div>
                    </div>${hasTaint ? `
                    <div style="margin-top: 5px; padding: 5px 8px; background: rgba(147,51,234,0.2); border: 1px solid #9333ea; border-radius: 4px;">
                        <strong style="color: #9333ea; font-size: 0.85em;">💎 Taint Crystal placed!</strong>
                    </div>` : ''}
                </div>`;
        });
        
        const contentHTML = `
            <div style="max-height: 420px; overflow-y: auto; padding: 2px;">
                <div style="text-align: center; color: #999; font-size: 0.9em; margin-bottom: 10px;">
                    Each General begins with 3 minions at their starting location.
                </div>
                ${generalsHTML}
            </div>
        `;
        
        this.showInfoModal('⚔️ Generals Take Position', contentHTML, () => {
            this._runSetupDarkness();
        });
    },
    
    _drawValidSetupCard() {
        // Draw a regular 2-location darkness card, discarding special types
        let maxAttempts = 50;
        while (maxAttempts-- > 0 && this.darknessDeck.length > 0) {
            const card = this.darknessDeck.shift();
            // Must be a regular card with 2 minion placement slots
            if (card.faction1 && card.faction2 && card.location1 && card.location2) {
                return card;
            }
            // Discard non-regular cards (all_quiet, patrol, monarch_city_special)
            this.darknessDiscardPile++;
        }
        return null;
    },
    
    _wouldCauseOverrun(faction, count, location) {
        const locMinions = this.minions[location];
        if (!locMinions) return false; // No minions = no overrun possible with count <= 3
        const total = Object.values(locMinions).reduce((a, b) => a + b, 0);
        return (total + count) >= 4;
    },
    
    _setupPlaceMinions(faction, count, location) {
        if (!this.minions[location]) this.minions[location] = { red: 0, blue: 0, green: 0, black: 0 };
        if (!this.minions[location][faction]) this.minions[location][faction] = 0;
        this.minions[location][faction] += count;
        
        // Taint crystals: 3+ demons at a location
        let taintAdded = false;
        if (faction === 'red') {
            const demonCount = this.minions[location]['red'] || 0;
            if (demonCount >= 3) {
                if (!this.taintCrystals[location]) this.taintCrystals[location] = 0;
                this.taintCrystals[location]++;
                this.taintCrystalsRemaining--;
                taintAdded = true;
            }
        }
        return taintAdded;
    },
    
    _runSetupDarkness() {
        const setupCards = [];
        const factionNames = { red: 'Demon', blue: 'Dragon', green: 'Orc', black: 'Undead' };
        const factionIcons = { red: '🔴', blue: '🔵', green: '🟢', black: '⚫' };
        
        // Phase 1: 3 cards, 2 minions per slot
        for (let i = 0; i < 3; i++) {
            let card = null;
            let attempts = 0;
            while (attempts++ < 30) {
                card = this._drawValidSetupCard();
                if (!card) break;
                // Check both placements won't cause overrun
                if (this._wouldCauseOverrun(card.faction1, 2, card.location1) ||
                    this._wouldCauseOverrun(card.faction2, 2, card.location2)) {
                    this.darknessDiscardPile++;
                    card = null;
                    continue;
                }
                break;
            }
            if (card) {
                const t1 = this._setupPlaceMinions(card.faction1, 2, card.location1);
                const t2 = this._setupPlaceMinions(card.faction2, 2, card.location2);
                setupCards.push({ card, count: 2, taint1: t1, taint2: t2, phase: 1 });
                this.darknessDiscardPile++;
                this.addLog(`Setup: +2 ${factionNames[card.faction1]} → ${card.location1}, +2 ${factionNames[card.faction2]} → ${card.location2}`);
            }
        }
        
        // Phase 2: 3 cards, 1 minion per slot
        for (let i = 0; i < 3; i++) {
            let card = null;
            let attempts = 0;
            while (attempts++ < 30) {
                card = this._drawValidSetupCard();
                if (!card) break;
                if (this._wouldCauseOverrun(card.faction1, 1, card.location1) ||
                    this._wouldCauseOverrun(card.faction2, 1, card.location2)) {
                    this.darknessDiscardPile++;
                    card = null;
                    continue;
                }
                break;
            }
            if (card) {
                const t1 = this._setupPlaceMinions(card.faction1, 1, card.location1);
                const t2 = this._setupPlaceMinions(card.faction2, 1, card.location2);
                setupCards.push({ card, count: 1, taint1: t1, taint2: t2, phase: 2 });
                this.darknessDiscardPile++;
                this.addLog(`Setup: +1 ${factionNames[card.faction1]} → ${card.location1}, +1 ${factionNames[card.faction2]} → ${card.location2}`);
            }
        }
        
        this.renderTokens();
        this.updateDeckCounts();
        this.updateGameStatus();
        
        // Build summary modal
        let phase1HTML = '';
        let phase2HTML = '';
        
        setupCards.forEach(entry => {
            const c = entry.card;
            const n = entry.count;
            const gc1 = this.getGeneralColor(c.faction1);
            const gc2 = this.getGeneralColor(c.faction2);
            const fn1 = factionNames[c.faction1];
            const fn2 = factionNames[c.faction2];
            const fi1 = factionIcons[c.faction1];
            const fi2 = factionIcons[c.faction2];
            
            let taintHTML = '';
            if (entry.taint1) {
                taintHTML += `<div style="margin-top: 5px; padding: 5px 8px; background: rgba(147,51,234,0.2); border: 1px solid #9333ea; border-radius: 4px;">
                    <strong style="color: #9333ea; font-size: 0.85em;">💎 Taint Crystal placed!</strong>
                </div>`;
            }
            if (entry.taint2) {
                taintHTML += `<div style="margin-top: 5px; padding: 5px 8px; background: rgba(147,51,234,0.2); border: 1px solid #9333ea; border-radius: 4px;">
                    <strong style="color: #9333ea; font-size: 0.85em;">💎 Taint Crystal placed!</strong>
                </div>`;
            }
            
            const cardHTML = `
                <div style="padding: 8px 10px; margin: 5px 0; background: rgba(0,0,0,0.3); border-radius: 6px; border-left: 3px solid #d4af37;">
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 120px;">
                            <span style="color: ${gc1};">${fi1}</span> 
                            <strong style="color: ${gc1};">+${n} ${fn1}</strong> 
                            <span style="color: #ccc;">→ ${c.location1}</span>
                        </div>
                        <div style="flex: 1; min-width: 120px;">
                            <span style="color: ${gc2};">${fi2}</span> 
                            <strong style="color: ${gc2};">+${n} ${fn2}</strong> 
                            <span style="color: #ccc;">→ ${c.location2}</span>
                        </div>
                    </div>
                    ${taintHTML}
                </div>`;
            
            if (entry.phase === 1) phase1HTML += cardHTML;
            else phase2HTML += cardHTML;
        });
        
        const totalMinions = setupCards.reduce((sum, e) => sum + e.count * 2, 0);
        
        const summaryHTML = `
            <div style="max-height: 400px; overflow-y: auto; padding: 5px;">
                <div style="margin-bottom: 12px;">
                    <div style="color: #fbbf24; font-weight: bold; margin-bottom: 6px;">Phase 1 — 2 minions per location (${setupCards.filter(e => e.phase === 1).length} cards)</div>
                    ${phase1HTML || '<div style="color: #888; padding: 5px;">No cards drawn</div>'}
                </div>
                <div style="margin-bottom: 12px;">
                    <div style="color: #60a5fa; font-weight: bold; margin-bottom: 6px;">Phase 2 — 1 minion per location (${setupCards.filter(e => e.phase === 2).length} cards)</div>
                    ${phase2HTML || '<div style="color: #888; padding: 5px;">No cards drawn</div>'}
                </div>
                <div style="text-align: center; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 6px; margin-top: 8px;">
                    <span style="color: #d4af37; font-size: 1.05em;">${totalMinions} minions placed across ${setupCards.length} cards</span>
                </div>
            </div>
        `;
        
        this.showInfoModal('🌑 Initial Darkness Spreads', summaryHTML, () => {
            // Reshuffle all darkness cards (deck + discard) as final setup step
            this.darknessDeck = this.createDarknessDeck();
            this.darknessDiscardPile = 0;
            this.updateDeckCounts();
            this.addLog('🔄 Darkness Spreads deck reshuffled after setup.');
            this.addLog('--- Darkness setup complete. Defend the realm! ---');
            this._checkEagleRiderTurnStart();
            this._applyMountainLoreBonus(this.heroes[0]);
            this._applyElfSupportBonus(this.heroes[0]);
        });
    },
    
    setupDragAndDrop() {
        // DISABLED: Drag and drop was interfering with the new movement system
        // The card-based movement (Foot, Horse, Eagle, Magic Gate) provides
        // better control and follows game rules more accurately
        
        // RESTORED: Hero token click to show cards (without drag functionality)
        const svg = document.getElementById('game-map');
        if (!svg) return;
        
        // Click on hero token to show cards tooltip
        svg.addEventListener('click', (e) => {
            // Try to find hero token - check both target and what's at the click point
            let heroToken = e.target.closest('.hero-token-svg');
            
            // If target is SVG itself, look for hero tokens at click coordinates
            if (!heroToken && e.target.tagName === 'svg') {
                const elements = document.elementsFromPoint(e.clientX, e.clientY);
                for (let el of elements) {
                    heroToken = el.closest('.hero-token-svg');
                    if (heroToken) break;
                }
            }
            
            const tooltip = document.getElementById('hover-tooltip');
            const clickedTooltip = e.target.closest('#hover-tooltip');
            
            // If clicked on a hero token, toggle that hero's tooltip
            if (heroToken) {
                e.stopPropagation();
                const heroIndex = parseInt(heroToken.dataset.heroIndex);
                const hero = this.heroes[heroIndex];
                
                // If tooltip is already showing for this hero, hide it
                if (tooltip.classList.contains('active') && 
                    tooltip.getAttribute('data-hero-name') === hero.name) {
                    this.hideTooltip(true);
                } else {
                    // Show tooltip for this hero
                    this.showHeroCardsTooltip(hero, e, true);
                }
            }
            // Close tooltip if clicking outside hero tokens and tooltip
            else if (!clickedTooltip && tooltip.classList.contains('active')) {
                this.hideTooltip(true); // Force close
            }
        });
        
        /* ORIGINAL DRAG AND DROP CODE - COMMENTED OUT
        const svg = document.getElementById('game-map');
        if (!svg) return;
        
        let draggedHeroIndex = null;
        let isDragging = false;
        let mouseDownPos = null; // Track where mouse was pressed
        
        // Click anywhere on map to close tooltip OR toggle hero tooltips
        svg.addEventListener('click', (e) => {
            
            // Try to find hero token - check both target and what's at the click point
            let heroToken = e.target.closest('.hero-token-svg');
            
            // If target is SVG itself, look for hero tokens at click coordinates
            if (!heroToken && e.target.tagName === 'svg') {
                const elements = document.elementsFromPoint(e.clientX, e.clientY);
                for (let el of elements) {
                    heroToken = el.closest('.hero-token-svg');
                    if (heroToken) break;
                }
            }
            
            const tooltip = document.getElementById('hover-tooltip');
            const clickedTooltip = e.target.closest('#hover-tooltip');
            
            // If clicked on a hero token, toggle that hero's tooltip
            if (heroToken) {
                e.stopPropagation();
                const heroIndex = parseInt(heroToken.dataset.heroIndex);
                const hero = this.heroes[heroIndex];
                
                // If tooltip is already showing for this hero, hide it
                if (tooltip.classList.contains('active') && 
                    tooltip.getAttribute('data-hero-name') === hero.name) {
                    this.hideTooltip(true);
                } else {
                    // Show tooltip for this hero
                    this.showHeroCardsTooltip(hero, e, true);
                }
            }
            // Close tooltip if clicking outside hero tokens and tooltip
            else if (!clickedTooltip && tooltip.classList.contains('active')) {
                this.hideTooltip(true); // Force close
            }
        });
        
        // Mouse down on hero
        svg.addEventListener('mousedown', (e) => {
            mouseDownPos = { x: e.clientX, y: e.clientY }; // Track where clicked
            
            const heroToken = e.target.closest('.hero-token-svg');
            if (!heroToken) return;
            
            const heroIndex = parseInt(heroToken.dataset.heroIndex);
            
            // For non-active heroes, don't handle mousedown at all (let click work)
            if (heroIndex !== this.currentPlayerIndex) {
                return; // Don't prevent default - allow click to work
            }
            
            if (this.actionsRemaining <= 0) {
                this.addLog('No actions remaining!');
                return;
            }
            
            draggedHeroIndex = heroIndex;
            isDragging = false; // Don't set to true yet - wait for movement
            heroToken.style.opacity = '0.6';
        });
        
        // Mouse move - detect if actually dragging
        svg.addEventListener('mousemove', (e) => {
            if (draggedHeroIndex !== null && mouseDownPos) {
                const dx = e.clientX - mouseDownPos.x;
                const dy = e.clientY - mouseDownPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // If moved more than 5 pixels, it's a drag
                if (distance > 5) {
                    isDragging = true;
                }
            }
        });
        
        // Touch start on hero
        svg.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            const heroToken = element?.closest('.hero-token-svg');
            if (!heroToken) return;
            
            const heroIndex = parseInt(heroToken.dataset.heroIndex);
            if (heroIndex !== this.currentPlayerIndex) {
                this.addLog('It\'s not this hero\'s turn!');
                return;
            }
            
            if (this.actionsRemaining <= 0) {
                this.addLog('No actions remaining!');
                return;
            }
            
            draggedHeroIndex = heroIndex;
            isDragging = true;
            heroToken.style.opacity = '0.6';
            e.preventDefault();
        }, { passive: false });
        
        // Mouse up/touch end - drop on location
        const endDrag = (clientX, clientY) => {
            if (!isDragging || draggedHeroIndex === null) return;
            
            const element = document.elementFromPoint(clientX, clientY);
            const locationMarker = element?.closest('.location-marker');
            
            if (locationMarker) {
                const newLocation = locationMarker.dataset.location;
                const hero = this.heroes[draggedHeroIndex];
                
                if (newLocation && newLocation !== hero.location) {
                    // Check if locations are connected by a path
                    if (!this.areLocationsConnected(hero.location, newLocation)) {
                        this.addLog(`❌ Cannot move to ${newLocation} - no path from ${hero.location}!`);
                        this.showInfoModal('⚠️', `<div>No path connects ${hero.location} to ${newLocation}!</div>`);
                    } else {
                        hero.location = newLocation;
                        this.actionsRemaining--;
                        this.addLog(`${hero.name} moved to ${newLocation}`);
                        this.updateGameStatus();
                        this.renderTokens();
                        this.renderHeroes();
                        
                        // Check if there are minions or general at new location
                        this.checkForCombatAtLocation(newLocation);
                    }
                }
            }
            
            // Reset drag state
            isDragging = false;
            draggedHeroIndex = null;
            mouseDownPos = null;
            this.renderTokens(); // Re-render to reset opacity
        };
        
        svg.addEventListener('mouseup', (e) => {
            endDrag(e.clientX, e.clientY);
        });
        
        svg.addEventListener('touchend', (e) => {
            if (e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                endDrag(touch.clientX, touch.clientY);
            }
        });
        */ // END OF COMMENTED OUT DRAG AND DROP CODE
    },
    
    checkForCombatAtLocation(location) {
        const minionsHere = this.minions[location];
        const generalHere = this.generals.find(g => g.location === location && !g.defeated);
        
        const totalMinions = minionsHere ? Object.values(minionsHere).reduce((a, b) => a + b, 0) : 0;
        
        if (totalMinions > 0) {
            this.addLog(`⚠️ Minions detected at ${location}! Click on minions to attack.`);
        } else if (generalHere) {
            this.addLog(`⚠️ General ${generalHere.name} is here! You can attack the general.`);
        }
    },
    
    // Check if two locations are connected by a path
    areLocationsConnected(location1, location2) {
        // Define all connections (same as in renderMap)
        const connections = [
            ['Dark Woods', 'Golden Oak Forest'], ['Dark Woods', 'Windy Pass'],
            ['Golden Oak Forest', 'Rock Bridge Pass'], ['Eagle Nest Inn', 'Enchanted Glade'],
            ['Enchanted Glade', 'Unicorn Forest'], ['Enchanted Glade', 'Rock Bridge Pass'],
            ['Unicorn Forest', 'Blood Flats'], ['Unicorn Forest', 'Brookdale Village'],
            ['Blood Flats', 'Scorpion Canyon'], ['Blood Flats', 'Brookdale Village'],
            ['Blood Flats', 'Raven Forest'], ['Scorpion Canyon', 'Raven Forest'],
            ['Windy Pass', 'Rock Bridge Pass'], ['Windy Pass', 'Sea Bird Port'],
            ['Rock Bridge Pass', 'Brookdale Village'], ['Rock Bridge Pass', 'Sea Bird Port'],
            ['Brookdale Village', 'Sea Bird Port'], ['Brookdale Village', 'Pleasant Hill'],
            ['Brookdale Village', 'Father Oak Forest'], ['Raven Forest', 'Pleasant Hill'],
            ['Raven Forest', 'Angel Tear Falls'], ['Sea Bird Port', 'Father Oak Forest'],
            ['Pleasant Hill', 'Father Oak Forest'], ['Pleasant Hill', 'Angel Tear Falls'],
            ['Minotaur Forest', 'Seagaul Lagoon'], ['Minotaur Forest', 'Wolf Pass'],
            ['Father Oak Forest', 'Wolf Pass'], ['Father Oak Forest', 'Monarch City'],
            ['Angel Tear Falls', 'Dragon\'s Teeth Range'], ['Angel Tear Falls', 'Bounty Bay'],
            ['Angel Tear Falls', 'Fire River'], ['Seagaul Lagoon', 'Wolf Pass'],
            ['Wolf Pass', 'Monarch City'], ['Wolf Pass', 'Orc Valley'],
            ['Monarch City', 'Bounty Bay'], ['Monarch City', 'Orc Valley'],
            ['Monarch City', 'Dancing Stone'], ['Monarch City', 'Greenleaf Village'],
            ['Bounty Bay', 'Greenleaf Village'], ['Bounty Bay', 'Mermaid Harbor'],
            ['Gryphon Forest', 'Seagaul Lagoon'], ['Gryphon Forest', 'Gryphon Inn'],
            ['Gryphon Forest', 'Serpent Swamp'], ['Orc Valley', 'Dancing Stone'],
            ['Orc Valley', 'Eagle Peak Pass'], ['Orc Valley', 'Whispering Woods'],
            ['Dancing Stone', 'Greenleaf Village'], ['Dancing Stone', 'Whispering Woods'],
            ['Greenleaf Village', 'Ancient Ruins'], ['Greenleaf Village', 'Mountains of Mist'],
            ['Mermaid Harbor', 'Fire River'], ['Mermaid Harbor', 'Land of Amazons'],
            ['Mermaid Harbor', 'Crystal Hills'], ['Mermaid Harbor', 'Wyvern Forest'],
            ['Fire River', 'Crystal Hills'], ['Eagle Peak Pass', 'Whispering Woods'],
            ['Eagle Peak Pass', 'Amarak Peak'], ['Serpent Swamp', 'McCorm Highlands'],
            ['Whispering Woods', 'Ancient Ruins'], ['Whispering Woods', 'Heaven\'s Glade'],
            ['Ancient Ruins', 'Heaven\'s Glade'], ['Mountains of Mist', 'Land of Amazons'],
            ['Mountains of Mist', 'Withered Hills'], ['Land of Amazons', 'Wyvern Forest'],
            ['Land of Amazons', 'Cursed Plateau'], ['Crystal Hills', 'Wyvern Forest'],
            ['McCorm Highlands', 'Amarak Peak'], ['Amarak Peak', 'Ghost Marsh'],
            ['Amarak Peak', 'Thorny Woods'], ['Heaven\'s Glade', 'Thorny Woods'],
            ['Heaven\'s Glade', 'Blizzard Mountains'], ['Wyvern Forest', 'Cursed Plateau'],
            ['Blizzard Mountains', 'Withered Hills'], ['Withered Hills', 'Cursed Plateau'],
            ['Chimera Inn', 'Withered Hills']
        ];
        
        // Check if there's a direct connection (bidirectional)
        for (const conn of connections) {
            if ((conn[0] === location1 && conn[1] === location2) ||
                (conn[0] === location2 && conn[1] === location1)) {
                return true;
            }
        }
        
        return false;
    },
    
});
