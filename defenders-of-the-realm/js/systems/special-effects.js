// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Special Card Effects
// ═══════════════════════════════════════════════════════════════

Object.assign(game, {
    _startBattleStrategyMinionPhase() {
        const state = this.battleStrategyState;
        const locsWithMinions = this._getLocationsWithMinions();
        
        // If no valid targets or no uses left, move to general phase
        if (locsWithMinions.length === 0 || state.minionsUsesRemaining <= 0) {
            this._startBattleStrategyGeneralPhase();
            return;
        }
        
        const currentHero = this.heroes[this.currentPlayerIndex];
        this.activeMovement = {
            cardIndex: -1,
            movementType: 'Battle Strategy',
            maxMoves: state.minionsUsesRemaining,
            movesRemaining: state.minionsUsesRemaining,
            startLocation: currentHero.location,
            cardUsed: null,
            validDestinations: locsWithMinions,
            isBattleStrategyMinions: true
        };
        
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) { boardContainer.style.cursor = 'default'; boardContainer.style.pointerEvents = 'none'; }
        const svg = document.getElementById('game-map');
        if (svg) { svg.style.pointerEvents = 'auto'; }
        
        this.showMovementIndicator();
        this.highlightMagicGateLocations(locsWithMinions);
    },
    
    _startBattleStrategyGeneralPhase() {
        const state = this.battleStrategyState;
        
        // Find non-defeated generals that can be pushed back
        const pushableGenerals = this.generals.filter(g => {
            if (g.defeated) return false;
            const prevLoc = this._getGeneralPreviousLocation(g);
            return prevLoc !== null;
        });
        
        if (pushableGenerals.length === 0) {
            // No generals to push back — finish
            this._finishBattleStrategy();
            return;
        }
        
        const generalLocations = pushableGenerals.map(g => g.location);
        
        state.phase = 'general';
        
        const currentHero = this.heroes[this.currentPlayerIndex];
        this.activeMovement = {
            cardIndex: -1,
            movementType: 'Battle Strategy — Push General',
            maxMoves: 1,
            movesRemaining: 1,
            startLocation: currentHero.location,
            cardUsed: null,
            validDestinations: generalLocations,
            isBattleStrategyGeneral: true
        };
        
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) { boardContainer.style.cursor = 'default'; boardContainer.style.pointerEvents = 'none'; }
        const svg = document.getElementById('game-map');
        if (svg) { svg.style.pointerEvents = 'auto'; }
        
        this.showMovementIndicator();
        this.highlightMagicGateLocations(generalLocations);
    },
    
    _getGeneralPreviousLocation(general) {
        // General paths: each array entry is [from, to] moving TOWARD Monarch City
        const generalPaths = {
            'black': [['Dark Woods', 'Windy Pass'], ['Windy Pass', 'Sea Bird Port'], ['Sea Bird Port', 'Father Oak Forest'], ['Father Oak Forest', 'Monarch City']],
            'red': [['Scorpion Canyon', 'Raven Forest'], ['Raven Forest', 'Angel Tear Falls'], ['Angel Tear Falls', 'Bounty Bay'], ['Bounty Bay', 'Monarch City']],
            'green': [['Thorny Woods', 'Amarak Peak'], ['Amarak Peak', 'Eagle Peak Pass'], ['Eagle Peak Pass', 'Orc Valley'], ['Orc Valley', 'Monarch City']],
            'blue': [['Blizzard Mountains', "Heaven's Glade"], ["Heaven's Glade", 'Ancient Ruins'], ['Ancient Ruins', 'Greenleaf Village'], ['Greenleaf Village', 'Monarch City']]
        };
        
        const path = generalPaths[general.color];
        if (!path) return null;
        
        // Find the segment where general.location is the 'to' (destination)
        // The 'from' of that segment is the previous location
        for (let [from, to] of path) {
            if (to === general.location) {
                return from;
            }
        }
        
        // General is at their starting position (first 'from') — can't push back further
        return null;
    },
    
    _finishBattleStrategy() {
        const state = this.battleStrategyState;
        if (!state) return;
        
        // Clean up
        this.activeMovement = null;
        this.battleStrategyState = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) { boardContainer.style.cursor = 'grab'; boardContainer.style.pointerEvents = 'auto'; }
        
        // Build results — parchment pill style
        const _fcMap = { green: '#16a34a', red: '#dc2626', blue: '#3b82f6', black: '#6b7280' };
        const _fnMap = { green: 'Orcs', red: 'Demons', blue: 'Dragonkin', black: 'Undead' };
        let resultsHTML = '';
        if (state.minionResults.length > 0) {
            resultsHTML += `<div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;color:#3d2b1f;margin-bottom:6px">Minions Removed</div>`;
            state.minionResults.forEach(r => {
                resultsHTML += `<div style="background:rgba(139,115,85,0.1);border:1px solid rgba(139,115,85,0.3);border-radius:5px;padding:5px 10px;margin:4px 0;font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;color:#2c1810">📍 ${r.location}<span style="float:right;font-size:0.85em;color:#3d2b1f">${r.details.replace(/<[^>]*>/g, '')}</span></div>`;
            });
        }
        if (state.generalResult) {
            const gc = this.getGeneralColor(state.generalResult.color);
            const gIcon = { red:'👹', blue:'🐉', green:'👺', black:'💀' }[state.generalResult.color] || '⚔️';
            resultsHTML += `<div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;color:#3d2b1f;margin-top:10px;margin-bottom:6px">General Movement</div>
                <div style="background:rgba(139,115,85,0.1);border:1px solid rgba(139,115,85,0.3);border-radius:5px;padding:5px 10px;margin:3px 0;font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <span style="display:flex;align-items:center;gap:6px;color:#8b7355"><span class="modal-general-token" style="background:${gc};width:24px;height:24px;font-size:0.75em">${gIcon}</span>${state.generalResult.name}</span>
                        <span style="color:#2c1810">${state.generalResult.from} → ${state.generalResult.to}</span>
                    </div>
                    <div style="font-size:0.85em;color:#8b7355;margin-top:3px;padding-left:30px">— Pushed Back</div>
                </div>`;
        }
        
        const locCount = state.minionResults.length;
        this.addLog(`⚔️ Special Card: ${state.heroName} plays Battle Strategy — cleared ${locCount} location${locCount !== 1 ? 's' : ''}${state.generalResult ? ', pushed ' + state.generalResult.name + ' back to ' + state.generalResult.to : ''}! (No action used)`);
        
        this.renderMap();
        this.renderTokens();
        this.renderHeroes();
        this.updateGameStatus();
        this.updateMovementButtons();
        this.updateActionButtons();
        
        this.showInfoModal('🌟 Special Card Details', `
            <div class="parchment-box">
                <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Special Card Result</span></div>
                <div style="margin-top:10px;margin-bottom:10px">${resultsHTML}</div>
                <div class="card-wrap">
                    <div class="card-banner-inner">
                        <span class="hero-banner-name">🌟 ${state.cardName || 'Battle Strategy'}</span>
                        <span class="hero-banner-name" style="font-size:0.8em">${state.heroSymbol} ${state.heroName}</span>
                    </div>
                    <div class="card-body">
                        <div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">Defeat all minions on 3 locations and push 1 General back</span></div>
                        <div style="text-align:center;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px">
                            <div class="modal-general-token" style="background:#6d28a8">⚔️</div>
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#6d28a8">Any General</span>
                        </div>
                        <div style="text-align:center;margin:10px 0;display:flex;gap:4px;justify-content:center">
                            <span class="die" style="background:#6d28a8;width:22px;height:22px;font-size:0.8em;border-radius:4px;animation:none">🎲</span>
                            <span class="die" style="background:#6d28a8;width:22px;height:22px;font-size:0.8em;border-radius:4px;animation:none">🎲</span>
                        </div>
                    </div>
                </div>
            </div>
            <button class="phb" style="margin-top:12px" onclick="game.closeInfoModal()">Continue</button>
        `);
        const _sct_g2bs = document.getElementById('info-modal-title');
        if (_sct_g2bs) { _sct_g2bs.style.fontFamily="'Cinzel',Georgia,serif"; _sct_g2bs.style.fontWeight='700'; _sct_g2bs.style.color='#d4af37'; _sct_g2bs.style.fontSize='1.2em'; _sct_g2bs.style.textAlign='center'; _sct_g2bs.style.margin='0 0 12px 0'; }
        const _sbd_g2bs = document.querySelector('#info-modal .modal-content > div:last-child');
        if (_sbd_g2bs && _sbd_g2bs.querySelector('.btn-primary')) _sbd_g2bs.style.display = 'none';
    },
    
    executeSkipDarkness(heroIndex, cardIndex) {
        const cardHero = this.heroes[heroIndex];
        const card = cardHero.cards[cardIndex];
        
        // Remove card from hand (played — removed from game)
        this._playSpecialCard(cardHero, cardIndex);
        this.updateDeckCounts();
        
        // Set skip flag
        this.skipDarknessThisTurn = true;
        
        this.addLog(`🌅 Special Card: ${cardHero.name} plays All Is Quiet — No Darkness Spreads cards will be drawn this turn!`);
        
        this.showInfoModal('🌟 Special Card Details', `
            <div class="parchment-box">
                <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Special Card Result</span></div>
                <div class="card-wrap" style="margin-top:10px">
                    <div class="card-banner-inner">
                        <span class="hero-banner-name">🌟 All Is Quiet</span>
                        <span class="hero-banner-name" style="font-size:0.8em">${cardHero.symbol} ${cardHero.name}</span>
                    </div>
                    <div class="card-body">
                        <div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">Do not draw any Darkness Spreads cards this turn</span></div>
                        <div style="text-align:center;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px">
                            <div class="modal-general-token" style="background:#16a34a">👺</div>
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#16a34a">Gorgutt</span>
                        </div>
                        <div style="text-align:center;margin:10px 0;display:flex;gap:4px;justify-content:center">
                            <span class="die" style="background:#16a34a;width:22px;height:22px;font-size:0.8em;border-radius:4px;animation:none">🎲</span>
                            <span class="die" style="background:#16a34a;width:22px;height:22px;font-size:0.8em;border-radius:4px;animation:none">🎲</span>
                        </div>
                    </div>
                </div>
            </div>
            <button class="phb" style="margin-top:12px" onclick="game.closeInfoModal()">Continue</button>
        `);
        const _sct_c2ais = document.getElementById('info-modal-title');
        if (_sct_c2ais) { _sct_c2ais.style.fontFamily="'Cinzel',Georgia,serif"; _sct_c2ais.style.fontWeight='700'; _sct_c2ais.style.color='#d4af37'; _sct_c2ais.style.fontSize='1.2em'; _sct_c2ais.style.textAlign='center'; _sct_c2ais.style.margin='0 0 12px 0'; }
        const _sbd_c2ais = document.querySelector('#info-modal .modal-content > div:last-child');
        if (_sbd_c2ais && _sbd_c2ais.querySelector('.btn-primary')) _sbd_c2ais.style.display = 'none';
        
        this.updateGameStatus();
        this.updateActionButtons();
    },
    
    executeBattleFury(heroIndex, cardIndex) {
        const activeHero = this.heroes[this.currentPlayerIndex];
        const cardHero = this.heroes[heroIndex];
        const card = cardHero.cards[cardIndex];
        
        // Must be played by the active hero only
        if (heroIndex !== this.currentPlayerIndex) {
            this.showInfoModal('🌟 Special Card Details', `
                <div class="parchment-box">
                    <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Special Card Play Not Allowed</span></div>
                    <div class="modal-desc-text" style="text-align:center;margin-top:10px;margin-bottom:10px;font-size:0.8em;color:#3d2b1f">Battle Fury can only be played by the active hero!</div>
                    <div class="card-wrap">
                        <div class="card-banner-inner"><span class="hero-banner-name">🌟 Battle Fury</span><span class="hero-banner-name" style="font-size:0.8em">${cardHero.symbol} ${cardHero.name}</span></div>
                        <div class="card-body">
                            <div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">Defeat all enemy minions at your current location</span></div>
                            <div style="text-align:center;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px">
                                <div class="modal-general-token" style="background:#3b82f6">🐉</div>
                                <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#3b82f6">Sapphire</span>
                            </div>
                            <div style="text-align:center;margin:10px 0;display:flex;gap:4px;justify-content:center">
                                <span class="die" style="background:#3b82f6;width:22px;height:22px;font-size:0.8em;border-radius:4px;animation:none">🎲</span>
                                <span class="die" style="background:#3b82f6;width:22px;height:22px;font-size:0.8em;border-radius:4px;animation:none">🎲</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="phb" style="margin-top:12px" onclick="game.closeInfoModal()">Continue</button>
            `);
            return;
        }
        const _sct_c3bfw = document.getElementById('info-modal-title');
        if (_sct_c3bfw) { _sct_c3bfw.style.fontFamily="'Cinzel',Georgia,serif"; _sct_c3bfw.style.fontWeight='700'; _sct_c3bfw.style.color='#d4af37'; _sct_c3bfw.style.fontSize='1.2em'; _sct_c3bfw.style.textAlign='center'; _sct_c3bfw.style.margin='0 0 12px 0'; }
        const _sbd_c3bfw = document.querySelector('#info-modal .modal-content > div:last-child');
        if (_sbd_c3bfw && _sbd_c3bfw.querySelector('.btn-primary')) _sbd_c3bfw.style.display = 'none';
        
        // Requires 1 action
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('🌟 Special Card Details', `
                <div class="parchment-box">
                    <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Special Card Play Not Allowed</span></div>
                    <div class="modal-desc-text" style="text-align:center;margin-top:10px;margin-bottom:10px;font-size:0.8em;color:#3d2b1f">No actions remaining! Battle Fury requires 1 action to play.</div>
                    <div class="card-wrap">
                        <div class="card-banner-inner"><span class="hero-banner-name">🌟 Battle Fury</span><span class="hero-banner-name" style="font-size:0.8em">${cardHero.symbol} ${cardHero.name}</span></div>
                        <div class="card-body">
                            <div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">Defeat all enemy minions at your current location</span></div>
                            <div style="text-align:center;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px">
                                <div class="modal-general-token" style="background:#3b82f6">🐉</div>
                                <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#3b82f6">Sapphire</span>
                            </div>
                            <div style="text-align:center;margin:10px 0;display:flex;gap:4px;justify-content:center">
                                <span class="die" style="background:#3b82f6;width:22px;height:22px;font-size:0.8em;border-radius:4px;animation:none">🎲</span>
                                <span class="die" style="background:#3b82f6;width:22px;height:22px;font-size:0.8em;border-radius:4px;animation:none">🎲</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="phb" style="margin-top:12px" onclick="game.closeInfoModal()">Continue</button>
            `);
            return;
        }
        const _sct_c3bfa = document.getElementById('info-modal-title');
        if (_sct_c3bfa) { _sct_c3bfa.style.fontFamily="'Cinzel',Georgia,serif"; _sct_c3bfa.style.fontWeight='700'; _sct_c3bfa.style.color='#d4af37'; _sct_c3bfa.style.fontSize='1.2em'; _sct_c3bfa.style.textAlign='center'; _sct_c3bfa.style.margin='0 0 12px 0'; }
        const _sbd_c3bfa = document.querySelector('#info-modal .modal-content > div:last-child');
        if (_sbd_c3bfa && _sbd_c3bfa.querySelector('.btn-primary')) _sbd_c3bfa.style.display = 'none';
        
        // Check for minions at location
        const location = activeHero.location;
        const minionsObj = this.minions[location];
        const totalMinions = minionsObj ? Object.values(minionsObj).reduce((a, b) => a + b, 0) : 0;
        
        if (totalMinions === 0) {
            this.showInfoModal('🌟 Special Card Details', `
                <div class="parchment-box">
                    <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Special Card Play Not Allowed</span></div>
                    <div class="modal-desc-text" style="text-align:center;margin-top:10px;margin-bottom:10px;font-size:0.8em;color:#3d2b1f">No minions at ${location}! There are no enemy minions to defeat.</div>
                    <div class="card-wrap">
                        <div class="card-banner-inner"><span class="hero-banner-name">🌟 Battle Fury</span><span class="hero-banner-name" style="font-size:0.8em">${cardHero.symbol} ${cardHero.name}</span></div>
                        <div class="card-body">
                            <div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">Defeat all enemy minions at your current location</span></div>
                            <div style="text-align:center;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px">
                                <div class="modal-general-token" style="background:#3b82f6">🐉</div>
                                <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#3b82f6">Sapphire</span>
                            </div>
                            <div style="text-align:center;margin:10px 0;display:flex;gap:4px;justify-content:center">
                                <span class="die" style="background:#3b82f6;width:22px;height:22px;font-size:0.8em;border-radius:4px;animation:none">🎲</span>
                                <span class="die" style="background:#3b82f6;width:22px;height:22px;font-size:0.8em;border-radius:4px;animation:none">🎲</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="phb" style="margin-top:12px" onclick="game.closeInfoModal()">Continue</button>
            `);
            return;
        }
        const _sct_c3bfm = document.getElementById('info-modal-title');
        if (_sct_c3bfm) { _sct_c3bfm.style.fontFamily="'Cinzel',Georgia,serif"; _sct_c3bfm.style.fontWeight='700'; _sct_c3bfm.style.color='#d4af37'; _sct_c3bfm.style.fontSize='1.2em'; _sct_c3bfm.style.textAlign='center'; _sct_c3bfm.style.margin='0 0 12px 0'; }
        const _sbd_c3bfm = document.querySelector('#info-modal .modal-content > div:last-child');
        if (_sbd_c3bfm && _sbd_c3bfm.querySelector('.btn-primary')) _sbd_c3bfm.style.display = 'none';
        
        // Remove card from hand (played — removed from game)
        this._playSpecialCard(cardHero, cardIndex);
        this.updateDeckCounts();
        
        // Spend 1 action
        this.actionsRemaining--;
        
        // Collect minion details before clearing
        const factionNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
        const factionColors = { green: '#16a34a', black: '#6b7280', red: '#ef4444', blue: '#3b82f6' };
        const removedDetails = [];
        
        for (const [color, count] of Object.entries(minionsObj)) {
            if (count > 0) {
                const fname = factionNames[color] || color;
                const fcolor = factionColors[color] || '#d4af37';
                removedDetails.push({ name: fname, color: fcolor, count: count, colorKey: color });
            }
        }
        
        // Clear all minions
        for (const color in minionsObj) {
            minionsObj[color] = 0;
        }
        
        // Build parchment pill results
        const _bfFcMap = { green: { bg: 'rgba(22,163,74,0.1)', border: '#16a34a', label: 'Orcs' }, red: { bg: 'rgba(239,68,68,0.1)', border: '#dc2626', label: 'Demons' }, blue: { bg: 'rgba(59,130,246,0.1)', border: '#3b82f6', label: 'Dragonkin' }, black: { bg: 'rgba(107,114,128,0.1)', border: '#6b7280', label: 'Undead' } };
        let resultsHTML = '';
        removedDetails.forEach(d => {
            const fc2 = _bfFcMap[d.colorKey] || { bg: 'rgba(139,115,85,0.1)', border: '#8b7355', label: d.name };
            for (let i = 0; i < d.count; i++) {
                resultsHTML += `<div style="background:${fc2.bg};border:1px solid ${fc2.border};border-radius:5px;padding:5px 10px;margin:4px 0"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;color:${fc2.border}"><span class="mdot" style="width:14px;height:14px;background:${fc2.border};margin-right:3px"></span>${fc2.label}</span><span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#2c1810">→ ${location}</span></div></div>`;
            }
        });
        
        this.addLog(`💥 Special Card: ${activeHero.name} plays Battle Fury at ${location} — ${totalMinions} minion(s) defeated!`);
        
        this.showInfoModal('🌟 Special Card Details', `
            <div class="parchment-box">
                <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Special Card Result</span></div>
                <div style="margin-top:10px;margin-bottom:10px">
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;color:#3d2b1f;margin-bottom:6px">Minions Removed at ${location}</div>
                    ${resultsHTML}
                </div>
                <div class="card-wrap">
                    <div class="card-banner-inner"><span class="hero-banner-name">🌟 Battle Fury</span><span class="hero-banner-name" style="font-size:0.8em">${activeHero.symbol} ${activeHero.name}</span></div>
                    <div class="card-body">
                        <div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">Defeat all enemy minions at your current location</span></div>
                        <div style="text-align:center;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px">
                            <div class="modal-general-token" style="background:#3b82f6">🐉</div>
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#3b82f6">Sapphire</span>
                        </div>
                        <div style="text-align:center;margin:10px 0;display:flex;gap:4px;justify-content:center">
                            <span class="die" style="background:#3b82f6;width:22px;height:22px;font-size:0.8em;border-radius:4px;animation:none">🎲</span>
                            <span class="die" style="background:#3b82f6;width:22px;height:22px;font-size:0.8em;border-radius:4px;animation:none">🎲</span>
                        </div>
                    </div>
                </div>
            </div>
            <button class="phb" style="margin-top:12px" onclick="game.closeInfoModal()">Continue</button>
        `);
        const _sct_c4bfr = document.getElementById('info-modal-title');
        if (_sct_c4bfr) { _sct_c4bfr.style.fontFamily="'Cinzel',Georgia,serif"; _sct_c4bfr.style.fontWeight='700'; _sct_c4bfr.style.color='#d4af37'; _sct_c4bfr.style.fontSize='1.2em'; _sct_c4bfr.style.textAlign='center'; _sct_c4bfr.style.margin='0 0 12px 0'; }
        const _sbd_c4bfr = document.querySelector('#info-modal .modal-content > div:last-child');
        if (_sbd_c4bfr && _sbd_c4bfr.querySelector('.btn-primary')) _sbd_c4bfr.style.display = 'none';
        
        this.renderTokens();
        this.renderHeroes();
        this.updateGameStatus();
        this.updateActionButtons();
        
        // Update map if open
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            const mapActionsLeft = document.getElementById('map-actions-left');
            if (mapActionsLeft) {
                mapActionsLeft.textContent = this.actionsRemaining;
            }
        }
    },
    
    executeLocalInformation(heroIndex, cardIndex) {
        const cardHero = this.heroes[heroIndex];
        const card = cardHero.cards[cardIndex];
        const location = cardHero.location;
        const locData = this.locationCoords[location];
        
        // Must be at an Inn
        if (!locData || !locData.inn) {
            this.showInfoModal('🌟 Special Card Details', `
                <div class="parchment-box">
                    <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Special Card Play Not Allowed</span></div>
                    <div class="modal-desc-text" style="text-align:center;margin-top:10px;margin-bottom:10px;font-size:0.8em;color:#3d2b1f">${cardHero.name} must be at an Inn to play this card!</div>
                    <div class="card-wrap">
                        <div class="card-banner-inner"><span class="hero-banner-name">🌟 Local Information</span><span class="hero-banner-name" style="font-size:0.8em">${cardHero.symbol} ${cardHero.name}</span></div>
                        <div class="card-body"><div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">At an Inn, draw 5 cards — keep all that match a chosen color and all Special cards</span></div></div>
                    </div>
                </div>
            `);
            return;
        }
        
        // Store card info for after color selection
        this._localInfoPending = { heroIndex, cardIndex };
        
        // Show color selection modal
        const colorOptions = [
            { color: 'black', label: 'Undead', hex: '#6b7280', icon: '💀' },
            { color: 'blue', label: 'Dragonkin', hex: '#3b82f6', icon: '🐉' },
            { color: 'green', label: 'Orcs', hex: '#16a34a', icon: '🪓' },
            { color: 'red', label: 'Demons', hex: '#dc2626', icon: '🔥' }
        ];
        
        let optionsHTML = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0;">';
        colorOptions.forEach(opt => {
            optionsHTML += `
                <div id="local-info-color-${opt.color}" 
                     onclick="game._localInfoSelectColor('${opt.color}')"
                     style="border: 3px solid ${opt.hex}; cursor: pointer; padding: 14px; border-radius: 8px; background: linear-gradient(135deg, #f0e6d3 0%, #ddd0b8 50%, #c8bb9f 100%); transition: all 0.2s; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"
                     onmouseover="if(!this.classList.contains('li-selected')) this.style.boxShadow='0 4px 12px rgba(0,0,0,0.5)'"
                     onmouseout="if(!this.classList.contains('li-selected')) this.style.boxShadow='0 2px 8px rgba(0,0,0,0.3)'">
                    <div style="color: ${opt.hex}; font-weight: bold; font-family:'Cinzel',Georgia,serif;">${opt.color.toUpperCase()}</div>
                </div>
            `;
        });
        optionsHTML += '</div>';
        
        const contentHTML = `
            <div class="parchment-box">
                <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Choose a Color</span></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;margin-bottom:10px">
                    ${colorOptions.map(opt => `<div id="local-info-color-${opt.color}" onclick="game._localInfoSelectColor('${opt.color}')" style="border:3px solid ${opt.hex};cursor:pointer;padding:14px;border-radius:8px;background:linear-gradient(135deg,#f0e6d3 0%,#ddd0b8 50%,#c8bb9f 100%);transition:all 0.2s;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)" onmouseover="if(!this.classList.contains('li-selected')) this.style.boxShadow='0 4px 12px rgba(0,0,0,0.5)'" onmouseout="if(!this.classList.contains('li-selected')) this.style.boxShadow='0 2px 8px rgba(0,0,0,0.3)'"><div style="color:${opt.hex};font-weight:bold;font-family:'Cinzel',Georgia,serif">${opt.color.toUpperCase()}</div></div>`).join('')}
                </div>
                <div class="card-wrap">
                    <div class="card-banner-inner"><span class="hero-banner-name">🌟 Local Information</span><span class="hero-banner-name" style="font-size:0.8em">${cardHero.symbol} ${cardHero.name}</span></div>
                    <div class="card-body"><div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">At an Inn, draw 5 cards — keep all that match a chosen color and all Special cards</span></div></div>
                </div>
            </div>
            <button id="local-info-confirm-btn" class="phb" onclick="game._localInfoConfirmColor()" disabled>Confirm</button>
            <button class="phb phb-cancel" onclick="game._localInfoPending = null; game.closeInfoModal()">Cancel</button>
        `;
        
        this._localInfoSelectedColor = null;
        this.showInfoModal('🌟 Special Card Details', contentHTML);
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv && !defaultBtnDiv.querySelector('#local-info-confirm-btn')) defaultBtnDiv.style.display = 'none';
    },
    
    _localInfoSelectColor(color) {
        this._localInfoSelectedColor = color;
        
        // Clear all selections
        ['black', 'blue', 'green', 'red'].forEach(c => {
            const el = document.getElementById(`local-info-color-${c}`);
            if (el) {
                el.classList.remove('li-selected');
                el.style.borderColor = '';
                el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            }
        });
        
        // Highlight selected
        const selected = document.getElementById(`local-info-color-${color}`);
        if (selected) {
            selected.classList.add('li-selected');
            selected.style.borderColor = '#d4af37';
            selected.style.boxShadow = '0 0 12px rgba(212,175,55,0.5), 0 4px 12px rgba(0,0,0,0.4)';
        }
        
        // Enable confirm button
        const confirmBtn = document.getElementById('local-info-confirm-btn');
        if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.style.opacity = '1'; confirmBtn.style.cursor = ''; }
    },
    
    _localInfoConfirmColor() {
        const color = this._localInfoSelectedColor;
        const pending = this._localInfoPending;
        if (!color || !pending) return;
        
        const hero = this.heroes[pending.heroIndex];
        const card = hero.cards[pending.cardIndex];
        
        // Remove the Local Information card from hand (played — removed from game)
        this._playSpecialCard(hero, pending.cardIndex);
        this.updateDeckCounts();
        
        this.closeInfoModal();
        
        // Draw 5 cards
        const drawnCards = [];
        for (let i = 0; i < 5; i++) {
            const c = this.generateRandomCard();
            if (c) drawnCards.push(c);
        }
        
        const colorNames = { black: 'Undead', blue: 'Dragonkin', green: 'Orcs', red: 'Demons' };
        const colorHexes = { black: '#6b7280', blue: '#3b82f6', green: '#16a34a', red: '#dc2626' };
        const chosenName = colorNames[color] || color;
        const chosenHex = colorHexes[color] || '#d4af37';
        
        // Partition: keep matching color + special cards
        const kept = [];
        const discarded = [];
        
        drawnCards.forEach(c => {
            if (c.special) {
                kept.push({ card: c, reason: 'special' });
            } else if (c.color === color) {
                kept.push({ card: c, reason: 'color' });
            } else {
                discarded.push(c);
            }
        });
        
        // Add kept cards to hero's hand
        kept.forEach(k => hero.cards.push(k.card));
        
        // Discard the rest
        this.heroDiscardPile += discarded.length;
        this.updateDeckCounts();
        
        // Build results HTML matching Evening modal card style
        const ccMap = {
            blue: { border: '#3b82f6', text: '#2563eb' },
            red: { border: '#dc2626', text: '#dc2626' },
            green: { border: '#16a34a', text: '#16a34a' },
            black: { border: '#374151', text: '#374151' },
            any: { border: '#6d28a8', text: '#6d28a8' },
        };
        
        const renderCardTile = (c, statusLabel) => {
            const cc = c.special ? { border: '#6d28a8', text: '#6d28a8' } : (ccMap[c.color] || ccMap.any);
            const iconDisplay = c.special ? '🌟' : (c.icon || '🎴');
            const shadow = c.special ? 'box-shadow:0 0 10px rgba(109,40,168,0.5);' : 'box-shadow:0 2px 8px rgba(0,0,0,0.3);';
            const diceHTML = Array.from({ length: c.dice }).map(() =>
                `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;background:${cc.border};border-radius:3px;font-size:0.7em;border:1.5px solid rgba(0,0,0,0.3)">🎲</span>`
            ).join('');
            return `<div style="flex:1 1 120px;max-width:160px;min-width:100px;background:linear-gradient(135deg,#f0e6d3 0%,#ddd0b8 50%,#c8bb9f 100%);border:3px solid ${cc.border};border-radius:8px;padding:8px 10px;text-align:center;${shadow}">
                ${statusLabel}
                <div style="font-size:1.4em;margin-bottom:2px">${iconDisplay}</div>
                <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.72em;color:${cc.text}">${c.name}</div>
                <div style="display:flex;justify-content:center;gap:3px;margin-top:4px">${diceHTML}</div>
            </div>`;
        };
        
        let cardsHTML = '';
        kept.forEach(k => {
            const label = `<div style="font-size:0.65em;color:#15803d;font-weight:bold;font-family:'Cinzel',Georgia,serif">✓ KEPT</div>`;
            cardsHTML += renderCardTile(k.card, label);
        });
        discarded.forEach(c => {
            const label = `<div style="font-size:0.65em;color:#b91c1c;font-weight:bold;font-family:'Cinzel',Georgia,serif">✗ DISCARDED</div>`;
            cardsHTML += renderCardTile(c, label);
        });
        
        const summaryHTML = `
            <div class="parchment-box">
                <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Special Card Result</span></div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:10px;margin-bottom:10px">${cardsHTML}</div>
                <div class="card-wrap">
                    <div class="card-banner-inner"><span class="hero-banner-name">🌟 Local Information</span><span class="hero-banner-name" style="font-size:0.8em">${hero.symbol} ${hero.name}</span></div>
                    <div class="card-body"><div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">At an Inn, draw 5 cards — keep all that match a chosen color and all Special cards</span></div></div>
                </div>
            </div>
        `;
        
        this.addLog(`📜 Special Card: ${hero.name} plays Local Information at ${hero.location} — Called ${chosenName}, drew ${drawnCards.length} cards, kept ${kept.length}`);
        
        this._localInfoPending = null;
        this._localInfoSelectedColor = null;
        
        this.renderHeroes();
        this.updateGameStatus();
        this.updateActionButtons();
        
        this.showInfoModal('🌟 Special Card Details', summaryHTML);
        const defaultBtnDiv2 = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv2 && defaultBtnDiv2.querySelector('.btn-primary')) defaultBtnDiv2.style.display = 'none';
    },
    
    
    executeKingsGuard(heroIndex, cardIndex) {
        const cardHero = this.heroes[heroIndex];
        
        // Get Monarch City + connected locations
        const monarchArea = ['Monarch City', ...(this.locationConnections['Monarch City'] || [])];
        
        // Find which have minions
        const locsWithMinions = monarchArea.filter(locName => {
            const minionsObj = this.minions[locName];
            if (!minionsObj) return false;
            return Object.values(minionsObj).reduce((a, b) => a + b, 0) > 0;
        });
        
        if (locsWithMinions.length === 0) {
            this.showInfoModal('🌟 Special Card Details', `
                <div class="parchment-box">
                    <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Special Card Play Not Allowed</span></div>
                    <div class="modal-desc-text" style="text-align:center;margin-top:10px;margin-bottom:10px;font-size:0.8em;color:#3d2b1f">No minions on or adjacent to Monarch City!</div>
                    <div class="card-wrap">
                        <div class="card-banner-inner"><span class="hero-banner-name">🌟 King's Guard Attack</span><span class="hero-banner-name" style="font-size:0.8em">${cardHero.symbol} ${cardHero.name}</span></div>
                        <div class="card-body"><div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">Remove up to 6 minions on or next to Monarch City</span></div></div>
                    </div>
                </div>
            `);
            return;
        }
        
        // Remove card from hand (played — removed from game)
        this._playSpecialCard(cardHero, cardIndex);
        this.updateDeckCounts();
        
        // Initialize state
        this.kingsGuardState = {
            heroName: cardHero.name,
            heroSymbol: cardHero.symbol,
            maxMinions: 6,
            totalSelected: 0,
            monarchArea: monarchArea,
            removals: [], // { location, color, count }
            currentLocation: null
        };
        
        // Start highlighting
        this._kingsGuardHighlight(locsWithMinions, 'Select a location near Monarch City');
    },
    
    _kingsGuardHighlight(validLocations, message) {
        const state = this.kingsGuardState;
        if (!state) return;
        
        const remaining = state.maxMinions - state.totalSelected;
        
        if (validLocations.length === 0 || remaining <= 0) {
            this._finishKingsGuard();
            return;
        }
        
        const currentHero = this.heroes[this.currentPlayerIndex];
        this.activeMovement = {
            cardIndex: -1,
            movementType: "King's Guard",
            maxMoves: 99,
            movesRemaining: 99,
            startLocation: currentHero.location,
            cardUsed: null,
            validDestinations: validLocations,
            isKingsGuard: true
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
        this.highlightMagicGateLocations(validLocations);
        
        // Update movement indicator text
        const indicator = document.getElementById('movement-indicator');
        if (indicator) {
            indicator.innerHTML = `<span style="color: #ffd700;">👑 King's Guard Attack</span> — ${message}<br><span style="font-size: 0.85em;">Minions: ${state.totalSelected} / ${state.maxMinions} selected</span>`;
        }
    },
    
    _kingsGuardShowPicker(locationName) {
        const state = this.kingsGuardState;
        if (!state) return;
        
        state.currentLocation = locationName;
        
        const minionsObj = this.minions[locationName];
        const remaining = state.maxMinions - state.totalSelected;
        const factionLabels = { green: 'Orcs', black: 'Undead', red: 'Demons', blue: 'Dragonkin' };
        const factionColors = { green: '#16a34a', black: '#6b7280', red: '#dc2626', blue: '#3b82f6' };
        const factionBg = { green: 'rgba(22,163,74,0.1)', black: 'rgba(107,114,128,0.1)', red: 'rgba(239,68,68,0.1)', blue: 'rgba(59,130,246,0.1)' };
        
        // Calculate pending removals at this location
        const pendingForLoc = {};
        state.removals.filter(r => r.location === locationName).forEach(r => {
            pendingForLoc[r.color] = (pendingForLoc[r.color] || 0) + r.count;
        });
        
        this._kgSelected = new Set();
        
        // Build pill list — one pill per available minion slot
        let minionId = 0;
        let pillsHTML = '<div id="kg-minion-list" style="max-height:240px;overflow-y:auto;padding-right:3px">';
        const factionOrder = ['green', 'red', 'black', 'blue'];
        factionOrder.forEach(color => {
            const totalCount = (minionsObj && minionsObj[color]) || 0;
            const alreadyPicked = pendingForLoc[color] || 0;
            const availableCount = Math.max(0, totalCount - alreadyPicked);
            if (availableCount === 0) return;
            const label = factionLabels[color];
            const fcolor = factionColors[color];
            const fbg = factionBg[color];
            for (let i = 0; i < availableCount; i++) {
                const id = `kg-m-${minionId}`;
                pillsHTML += `<div id="${id}" data-color="${color}" data-mid="${minionId}"
                    onclick="game._kingsGuardToggle(${minionId})"
                    style="background:${fbg};border:1px solid ${fcolor};border-radius:5px;padding:5px 10px;margin:4px 0;cursor:pointer;transition:opacity 0.15s">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                        <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;color:${fcolor}"><span class="mdot" style="width:14px;height:14px;background:${fcolor};margin-right:3px"></span>${label}</span>
                        <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#2c1810;flex:1;text-align:right">→ ${locationName}</span>
                        <span id="kg-cb-${minionId}" style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border:2px solid ${fcolor};border-radius:3px;font-size:0.75em;font-weight:900;color:#fff;flex-shrink:0;"></span>
                    </div>
                </div>`;
                minionId++;
            }
        });
        pillsHTML += '</div>';
        
        // Get general info for card body
        const blueGeneral = this.generals.find(g => g.color === 'blue') || { name: 'Sapphire' };
        const generalIcon = this._generalIcons ? (this._generalIcons['blue'] || '🐉') : '🐉';
        const generalColor = '#3b82f6';
        
        const contentHTML = `
            <div class="parchment-box">
                <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Remove Minions</span></div>
                <div style="margin-top:10px;margin-bottom:10px">
                    <div class="modal-desc-text" style="font-size:0.8em;color:#3d2b1f;margin-bottom:8px">Remaining minions to remove:</div>
                    <div style="text-align:center;margin-bottom:10px"><div class="die die-g" id="kg-remaining-die" style="display:inline-flex;align-items:center;justify-content:center">${remaining}</div></div>
                    ${pillsHTML}
                </div>
                <div class="card-wrap">
                    <div class="card-banner-inner"><span class="hero-banner-name">🌟 King's Guard Attack</span><span class="hero-banner-name" style="font-size:0.8em">${state.heroSymbol} ${state.heroName}</span></div>
                    <div class="card-body">
                        <div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">Remove up to 6 minions on or next to Monarch City</span></div>
                        <div style="text-align:center;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px">
                            <div class="modal-general-token" style="background:${generalColor}">${generalIcon}</div>
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:${generalColor}">${blueGeneral.name}</span>
                        </div>
                        <div style="text-align:center;margin:10px 0;display:flex;gap:4px;justify-content:center">
                            <span class="die" style="background:${generalColor}">🎲</span>
                        </div>
                    </div>
                </div>
            </div>
            <button id="kg-confirm-btn" class="phb" style="margin-top:12px" onclick="game._kingsGuardConfirmLocation()">Confirm</button>
            <button class="phb phb-cancel" onclick="game.closeInfoModal(); game._finishKingsGuard();">Cancel</button>
        `;
        
        this.showInfoModal('🌟 Special Card Details', contentHTML);
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv && !defaultBtnDiv.querySelector('#kg-confirm-btn')) defaultBtnDiv.style.display = 'none';
    },
    _kingsGuardToggle(minionId) {
        const state = this.kingsGuardState;
        if (!state) return;
        
        const el = document.getElementById(`kg-m-${minionId}`);
        if (!el) return;
        
        const remaining = state.maxMinions - state.totalSelected;
        const color = el.getAttribute('data-color');
        const factionColors = { green: '#16a34a', black: '#6b7280', red: '#dc2626', blue: '#3b82f6' };
        const fcolor = factionColors[color] || '#888';
        
        const cb = document.getElementById(`kg-cb-${minionId}`);
        if (this._kgSelected.has(minionId)) {
            this._kgSelected.delete(minionId);
            el.classList.remove('kg-sel');
            if (cb) { cb.textContent = ''; cb.style.background = ''; }
        } else {
            if (this._kgSelected.size >= remaining) return;
            this._kgSelected.add(minionId);
            el.classList.add('kg-sel');
            if (cb) { cb.textContent = '✓'; cb.style.background = fcolor; }
        }
        
        // Update remaining die counter
        const newRemaining = remaining - this._kgSelected.size;
        const die = document.getElementById('kg-remaining-die');
        if (die) die.textContent = newRemaining;
        
        // Dim unselectable pills when at limit
        document.querySelectorAll('#kg-minion-list > div').forEach(div => {
            const mid = parseInt(div.getAttribute('data-mid'));
            if (this._kgSelected.has(mid)) return;
            const canSelect = this._kgSelected.size < remaining;
            div.style.opacity = canSelect ? '1' : '0.4';
            div.style.cursor = canSelect ? 'pointer' : 'not-allowed';
        });
    },
    
    _kingsGuardConfirmLocation() {
        const state = this.kingsGuardState;
        if (!state) return;
        
        const locationName = state.currentLocation;
        
        // Collect selected minions by color
        const colorCounts = {};
        this._kgSelected.forEach(mid => {
            const el = document.getElementById(`kg-m-${mid}`);
            if (!el) return;
            const color = el.getAttribute('data-color');
            colorCounts[color] = (colorCounts[color] || 0) + 1;
        });
        
        // Record removals
        for (const [color, count] of Object.entries(colorCounts)) {
            state.removals.push({ location: locationName, color, count });
            state.totalSelected += count;
        }
        
        this.closeInfoModal();
        
        // Clean up movement highlights
        this.activeMovement = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        // Check if budget exhausted
        if (state.totalSelected >= state.maxMinions) {
            this._finishKingsGuard();
            return;
        }
        
        // Re-highlight all monarch-area locations that still have minions
        const locsWithMinions = state.monarchArea.filter(locName => {
            const minionsObj = this.minions[locName];
            if (!minionsObj) return false;
            // Subtract any pending removals for this location
            const pendingForLoc = {};
            state.removals.filter(r => r.location === locName).forEach(r => {
                pendingForLoc[r.color] = (pendingForLoc[r.color] || 0) + r.count;
            });
            let remaining = 0;
            for (const [color, count] of Object.entries(minionsObj)) {
                remaining += Math.max(0, count - (pendingForLoc[color] || 0));
            }
            return remaining > 0;
        });
        
        if (locsWithMinions.length === 0) {
            this._finishKingsGuard();
            return;
        }
        
        this._kingsGuardHighlight(locsWithMinions, 'Select another location');
    },
    
    _kingsGuardFinishEarly() {
        const state = this.kingsGuardState;
        if (!state) return;
        
        // Record any current selections
        if (this._kgSelected && this._kgSelected.size > 0) {
            const locationName = state.currentLocation;
            const colorCounts = {};
            this._kgSelected.forEach(mid => {
                const el = document.getElementById(`kg-m-${mid}`);
                if (!el) return;
                const color = el.getAttribute('data-color');
                colorCounts[color] = (colorCounts[color] || 0) + 1;
            });
            for (const [color, count] of Object.entries(colorCounts)) {
                state.removals.push({ location: locationName, color, count });
                state.totalSelected += count;
            }
        }
        
        this.closeInfoModal();
        this.activeMovement = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        this._finishKingsGuard();
    },
    
    _finishKingsGuard() {
        const state = this.kingsGuardState;
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
        
        // Apply all removals
        const factionNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
        const factionColors = { green: '#16a34a', black: '#6b7280', red: '#ef4444', blue: '#3b82f6' };
        let totalRemoved = 0;
        
        const byLocation = {};
        state.removals.forEach(r => {
            if (!byLocation[r.location]) byLocation[r.location] = [];
            byLocation[r.location].push(r);
            
            if (this.minions[r.location]) {
                this.minions[r.location][r.color] = Math.max(0, (this.minions[r.location][r.color] || 0) - r.count);
            }
            totalRemoved += r.count;
        });
        
        // Build parchment pill results
        const _kgFcMap = { green: { bg: 'rgba(22,163,74,0.1)', border: '#16a34a', label: 'Orcs' }, red: { bg: 'rgba(239,68,68,0.1)', border: '#dc2626', label: 'Demons' }, blue: { bg: 'rgba(59,130,246,0.1)', border: '#3b82f6', label: 'Dragonkin' }, black: { bg: 'rgba(107,114,128,0.1)', border: '#6b7280', label: 'Undead' } };
        let resultsHTML = '';
        if (totalRemoved === 0) {
            resultsHTML = `<div style="font-family:'Cinzel',Georgia,serif;font-size:0.8em;color:#8b7355;text-align:center;padding:8px">No minions were removed.</div>`;
        } else {
            resultsHTML += `<div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;color:#3d2b1f;margin-bottom:6px">Minions Removed</div>`;
            for (const [locName, removals] of Object.entries(byLocation)) {
                removals.forEach(r => {
                    const fc = _kgFcMap[r.color] || { bg: 'rgba(139,115,85,0.1)', border: '#8b7355', label: r.color };
                    for (let i = 0; i < r.count; i++) {
                        resultsHTML += `<div style="background:${fc.bg};border:1px solid ${fc.border};border-radius:5px;padding:5px 10px;margin:4px 0"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;color:${fc.border}"><span class="mdot" style="width:14px;height:14px;background:${fc.border};margin-right:3px"></span>${fc.label}</span><span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#2c1810">→ ${locName}</span></div></div>`;
                    }
                });
            }
        }
        
        this.addLog(`👑 Special Card: ${state.heroName} plays King's Guard Attack — ${totalRemoved} minion(s) removed near Monarch City!`);
        
        this.kingsGuardState = null;
        
        this.renderMap();
        this.renderTokens();
        this.renderHeroes();
        this.updateGameStatus();
        this.updateMovementButtons();
        this.updateActionButtons();
        
        this.showInfoModal('🌟 Special Card Details', `
            <div class="parchment-box">
                <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Special Card Result</span></div>
                <div style="margin-top:10px;margin-bottom:10px">${resultsHTML}</div>
                <div class="card-wrap">
                    <div class="card-banner-inner"><span class="hero-banner-name">🌟 King's Guard Attack</span><span class="hero-banner-name" style="font-size:0.8em">${state.heroSymbol} ${state.heroName}</span></div>
                    <div class="card-body">
                        <div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">Remove up to 6 minions on or next to Monarch City</span></div>
                        <div style="text-align:center;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px">
                            <div class="modal-general-token" style="background:#3b82f6">🐉</div>
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#3b82f6">Sapphire</span>
                        </div>
                        <div style="text-align:center;margin:10px 0;display:flex;gap:4px;justify-content:center">
                            <span class="die" style="background:#3b82f6;width:22px;height:22px;font-size:0.8em;border-radius:4px;animation:none">🎲</span>
                        </div>
                    </div>
                </div>
            </div>
            <button class="phb" style="margin-top:12px" onclick="game.closeInfoModal()">Continue</button>
        `);
        const _sct_f2kg = document.getElementById('info-modal-title');
        if (_sct_f2kg) { _sct_f2kg.style.fontFamily="'Cinzel',Georgia,serif"; _sct_f2kg.style.fontWeight='700'; _sct_f2kg.style.color='#d4af37'; _sct_f2kg.style.fontSize='1.2em'; _sct_f2kg.style.textAlign='center'; _sct_f2kg.style.margin='0 0 12px 0'; }
        const _sbd_f2kg = document.querySelector('#info-modal .modal-content > div:last-child');
        if (_sbd_f2kg && _sbd_f2kg.querySelector('.btn-primary')) _sbd_f2kg.style.display = 'none';
    },
    
    
    executeCavalrySweep(heroIndex, cardIndex) {
        const cardHero = this.heroes[heroIndex];
        
        // Find all locations with minions
        const locsWithMinions = [];
        for (const [locName, minionsObj] of Object.entries(this.minions)) {
            const total = Object.values(minionsObj).reduce((a, b) => a + b, 0);
            if (total > 0) locsWithMinions.push(locName);
        }
        
        if (locsWithMinions.length === 0) {
            this.showInfoModal('🌟 Special Card Details', `
                <div class="parchment-box">
                    <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Special Card Play Not Allowed</span></div>
                    <div class="modal-desc-text" style="text-align:center;margin-top:10px;margin-bottom:10px;font-size:0.8em;color:#3d2b1f">No minions anywhere on the board!</div>
                    <div class="card-wrap">
                        <div class="card-banner-inner"><span class="hero-banner-name">🌟 Cavalry Sweep</span><span class="hero-banner-name" style="font-size:0.8em">${cardHero.symbol} ${cardHero.name}</span></div>
                        <div class="card-body"><div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">Remove minions across the board (up to 2 per location, Dragonkin count as 2)</span></div></div>
                    </div>
                </div>
            `);
            return;
        }
        
        // Remove card from hand (played — removed from game)
        this._playSpecialCard(cardHero, cardIndex);
        this.updateDeckCounts();
        
        // Initialize state
        this.cavalrySweepState = {
            heroName: cardHero.name,
            heroSymbol: cardHero.symbol,
            budgetMax: 6,
            budgetUsed: 0,
            currentLocation: null,
            removals: [], // { location, color, count, cost }
            visitedLocations: []
        };
        
        // Start highlighting
        this._cavalrySweepHighlight(locsWithMinions, 'Select a starting location with minions');
    },
    
    _cavalrySweepHighlight(validLocations, message) {
        const state = this.cavalrySweepState;
        if (!state) return;
        
        // Filter to only locations that have minions we can afford
        const budgetLeft = state.budgetMax - state.budgetUsed;
        const affordableLocs = validLocations.filter(locName => {
            const minionsObj = this.minions[locName];
            if (!minionsObj) return false;
            // Need at least one minion we can afford (non-dragon = 1, dragon = 2)
            for (const [color, count] of Object.entries(minionsObj)) {
                if (count > 0) {
                    const cost = color === 'blue' ? 2 : 1;
                    if (cost <= budgetLeft) return true;
                }
            }
            return false;
        });
        
        if (affordableLocs.length === 0 || budgetLeft <= 0) {
            this._finishCavalrySweep();
            return;
        }
        
        const currentHero = this.heroes[this.currentPlayerIndex];
        this.activeMovement = {
            cardIndex: -1,
            movementType: 'Cavalry Sweep',
            maxMoves: 99,
            movesRemaining: 99,
            startLocation: currentHero.location,
            cardUsed: null,
            validDestinations: affordableLocs,
            isCavalrySweep: true
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
        this.highlightMagicGateLocations(affordableLocs);
        
        // Update movement indicator text
        const indicator = document.getElementById('movement-indicator');
        if (indicator) {
            const remaining = state.budgetMax - state.budgetUsed;
            indicator.innerHTML = `<span style="color: #ffd700;">🐎 Cavalry Sweep</span> — ${message}<br><span style="font-size: 0.85em;">Budget: ${remaining} remaining</span>`;
        }
    },
    
    _cavalrySweepShowPicker(locationName) {
        const state = this.cavalrySweepState;
        if (!state) return;
        
        state.currentLocation = locationName;
        
        const minionsObj = this.minions[locationName];
        const budgetLeft = state.budgetMax - state.budgetUsed;
        const factionNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
        const factionColors = { green: '#16a34a', black: '#6b7280', red: '#ef4444', blue: '#3b82f6' };
        const factionIcons = { green: '🪓', black: '💀', red: '🔥', blue: '🐉' };
        
        this._csSweepSelected = new Set();
        this._csSweepCost = 0;
        this._csSweepMaxPerLoc = 2;
        
        let minionId = 0;
        let listHTML = '<div id="cs-minion-list" style="max-height: 280px; overflow-y: auto; padding-right: 5px;">';
        
        // Sort factions for consistent display
        const factionOrder = ['green', 'red', 'black', 'blue'];
        factionOrder.forEach(color => {
            const count = (minionsObj && minionsObj[color]) || 0;
            if (count === 0) return;
            const fname = factionNames[color];
            const fcolor = factionColors[color];
            const ficon = factionIcons[color];
            const cost = color === 'blue' ? 2 : 1;
            
            for (let i = 0; i < count; i++) {
                const canAfford = cost <= budgetLeft;
                const id = `cs-m-${minionId}`;
                listHTML += `
                    <div id="${id}" data-color="${color}" data-cost="${cost}" data-mid="${minionId}"
                         onclick="game._cavalrySweepToggle(${minionId})"
                         style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; margin: 3px 0; border: 2px solid ${fcolor}; border-radius: 6px; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; background: rgba(0,0,0,0.3); transition: all 0.15s; ${!canAfford ? 'opacity: 0.4;' : ''}"
                         onmouseover="if(!this.classList.contains('cs-sel') && this.style.opacity !== '0.4') this.style.background='rgba(255,255,255,0.08)'"
                         onmouseout="if(!this.classList.contains('cs-sel')) this.style.background='rgba(0,0,0,0.3)'">
                        <span style="font-size: 1.3em;">${ficon}</span>
                        <span style="flex: 1; color: ${fcolor}; font-weight: bold;">${fname} Minion</span>
                        <span style="color: #999; font-size: 0.8em;">${cost === 2 ? '⚠️ Cost: 2' : 'Cost: 1'}</span>
                        <span id="${id}-check" style="font-size: 1.2em; opacity: 0.3;">☐</span>
                    </div>
                `;
                minionId++;
            }
        });
        
        listHTML += '</div>';
        
        const contentHTML = `
            <div class="parchment-box">
                <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Remove Minions</span></div>
                <div style="margin-top:10px;margin-bottom:10px">
                    <div class="modal-desc-text" style="font-size:0.8em;color:#3d2b1f;margin-bottom:8px">Budget remaining:</div>
                    <div style="text-align:center;margin-bottom:10px"><div class="die die-g" id="cs-remaining-die" style="display:inline-flex;align-items:center;justify-content:center">${budgetLeft}</div></div>
                    <div class="modal-desc-text" style="font-size:0.8em;color:#3d2b1f;margin-bottom:6px">📍 ${locationName} — Select up to 2 minions (Dragonkin cost 2):</div>
                    <div id="cs-budget-display" style="font-family:'Cinzel',Georgia,serif;font-size:0.75em;color:#3d2b1f;margin-bottom:6px">Selected: 0 at this location</div>
                    ${listHTML}
                </div>
                <div class="card-wrap">
                    <div class="card-banner-inner"><span class="hero-banner-name">🌟 Cavalry Sweep</span><span class="hero-banner-name" style="font-size:0.8em">${state.heroSymbol} ${state.heroName}</span></div>
                    <div class="card-body"><div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">Remove minions across the board (up to 2 per location, Dragonkin count as 2)</span></div></div>
                </div>
            </div>
            <button class="phb phb-cancel" onclick="game._cavalrySweepFinishEarly()">Finish Sweep</button>
            <button id="cs-confirm-btn" class="phb" onclick="game._cavalrySweepConfirmLocation()">Skip Location</button>
        `;
        
        this.showInfoModal('🌟 Special Card Details', contentHTML);
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv && !defaultBtnDiv.querySelector('#cs-confirm-btn')) defaultBtnDiv.style.display = 'none';
    },
    
    _cavalrySweepToggle(minionId) {
        const state = this.cavalrySweepState;
        if (!state) return;
        
        const el = document.getElementById(`cs-m-${minionId}`);
        const check = document.getElementById(`cs-m-${minionId}-check`);
        if (!el) return;
        
        const cost = parseInt(el.getAttribute('data-cost'));
        const budgetLeft = state.budgetMax - state.budgetUsed;
        
        if (this._csSweepSelected.has(minionId)) {
            // Deselect
            this._csSweepSelected.delete(minionId);
            this._csSweepCost -= cost;
            el.classList.remove('cs-sel');
            el.style.background = 'rgba(0,0,0,0.3)';
            if (check) { check.textContent = '☐'; check.style.opacity = '0.3'; check.style.color = ''; }
        } else {
            // Check per-location limit (2 minions)
            if (this._csSweepSelected.size >= this._csSweepMaxPerLoc) return;
            // Check budget
            if (this._csSweepCost + cost > budgetLeft) return;
            
            this._csSweepSelected.add(minionId);
            this._csSweepCost += cost;
            el.classList.add('cs-sel');
            el.style.background = 'rgba(255,215,0,0.2)';
            if (check) { check.textContent = '☑'; check.style.opacity = '1'; check.style.color = '#4ade80'; }
        }
        
        // Update budget display
        const newBudgetLeft = budgetLeft - this._csSweepCost;
        const display = document.getElementById('cs-budget-display');
        if (display) display.textContent = `Budget: ${newBudgetLeft} / ${state.budgetMax} remaining — Selected: ${this._csSweepSelected.size} at this location`;
        
        // Update confirm button text
        const btn = document.getElementById('cs-confirm-btn');
        if (btn) {
            btn.textContent = this._csSweepSelected.size > 0 ? `Confirm (${this._csSweepSelected.size})` : 'Skip Location';
        }
        
        // Update affordability of unselected minions
        document.querySelectorAll('#cs-minion-list > div').forEach(div => {
            const mid = parseInt(div.getAttribute('data-mid'));
            if (this._csSweepSelected.has(mid)) return;
            const c = parseInt(div.getAttribute('data-cost'));
            const canAfford = c <= newBudgetLeft && this._csSweepSelected.size < this._csSweepMaxPerLoc;
            div.style.opacity = canAfford ? '1' : '0.4';
            div.style.cursor = canAfford ? 'pointer' : 'not-allowed';
        });
    },
    
    _cavalrySweepConfirmLocation() {
        const state = this.cavalrySweepState;
        if (!state) return;
        
        const locationName = state.currentLocation;
        
        // Collect selected minions by color
        const colorCounts = {};
        this._csSweepSelected.forEach(mid => {
            const el = document.getElementById(`cs-m-${mid}`);
            if (!el) return;
            const color = el.getAttribute('data-color');
            colorCounts[color] = (colorCounts[color] || 0) + 1;
        });
        
        // Record removals
        for (const [color, count] of Object.entries(colorCounts)) {
            const cost = color === 'blue' ? 2 : 1;
            state.removals.push({ location: locationName, color, count, cost: cost * count });
            state.budgetUsed += cost * count;
        }
        
        state.visitedLocations.push(locationName);
        
        this.closeInfoModal();
        
        // Clean up movement highlights
        this.activeMovement = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        // Check if budget exhausted
        if (state.budgetUsed >= state.budgetMax) {
            this._finishCavalrySweep();
            return;
        }
        
        // Get connected locations with minions (not already visited)
        const connected = this.locationConnections[locationName] || [];
        const validNext = connected.filter(loc => {
            if (state.visitedLocations.includes(loc)) return false;
            const minionsObj = this.minions[loc];
            if (!minionsObj) return false;
            const total = Object.values(minionsObj).reduce((a, b) => a + b, 0);
            return total > 0;
        });
        
        if (validNext.length === 0) {
            this._finishCavalrySweep();
            return;
        }
        
        // Highlight next locations
        this._cavalrySweepHighlight(validNext, 'Select next adjacent location');
    },
    
    _cavalrySweepFinishEarly() {
        const state = this.cavalrySweepState;
        if (!state) return;
        
        // Still record any selections at current location
        if (this._csSweepSelected && this._csSweepSelected.size > 0) {
            const locationName = state.currentLocation;
            const colorCounts = {};
            this._csSweepSelected.forEach(mid => {
                const el = document.getElementById(`cs-m-${mid}`);
                if (!el) return;
                const color = el.getAttribute('data-color');
                colorCounts[color] = (colorCounts[color] || 0) + 1;
            });
            for (const [color, count] of Object.entries(colorCounts)) {
                const cost = color === 'blue' ? 2 : 1;
                state.removals.push({ location: locationName, color, count, cost: cost * count });
                state.budgetUsed += cost * count;
            }
        }
        
        this.closeInfoModal();
        this.activeMovement = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        this._finishCavalrySweep();
    },
    
    _finishCavalrySweep() {
        const state = this.cavalrySweepState;
        if (!state) return;
        
        // Clean up movement state
        this.activeMovement = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        // Re-enable map dragging
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'grab';
            boardContainer.style.pointerEvents = 'auto';
        }
        
        // Apply all removals
        const factionNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
        const factionColors = { green: '#16a34a', black: '#6b7280', red: '#ef4444', blue: '#3b82f6' };
        let totalRemoved = 0;
        let totalCost = 0;
        
        // Group by location for display
        const byLocation = {};
        state.removals.forEach(r => {
            if (!byLocation[r.location]) byLocation[r.location] = [];
            byLocation[r.location].push(r);
            
            // Apply removal to board
            if (this.minions[r.location]) {
                this.minions[r.location][r.color] = Math.max(0, (this.minions[r.location][r.color] || 0) - r.count);
            }
            totalRemoved += r.count;
            totalCost += r.cost;
        });
        
        // Build parchment pill results
        const _csFcMap = { green: { bg: 'rgba(22,163,74,0.1)', border: '#16a34a', label: 'Orcs' }, red: { bg: 'rgba(239,68,68,0.1)', border: '#dc2626', label: 'Demons' }, blue: { bg: 'rgba(59,130,246,0.1)', border: '#3b82f6', label: 'Dragonkin' }, black: { bg: 'rgba(107,114,128,0.1)', border: '#6b7280', label: 'Undead' } };
        let resultsHTML = '';
        if (totalRemoved === 0) {
            resultsHTML = `<div style="font-family:'Cinzel',Georgia,serif;font-size:0.8em;color:#8b7355;text-align:center;padding:8px">No minions were removed.</div>`;
        } else {
            resultsHTML += `<div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;color:#3d2b1f;margin-bottom:6px">Minions Removed</div>`;
            for (const [locName, removals] of Object.entries(byLocation)) {
                removals.forEach(r => {
                    const fc = _csFcMap[r.color] || { bg: 'rgba(139,115,85,0.1)', border: '#8b7355', label: r.color };
                    const costBadge = r.color === 'blue' ? ` <span style="font-size:0.75em;color:#b91c1c">(×2)</span>` : '';
                    for (let i = 0; i < r.count; i++) {
                        resultsHTML += `<div style="background:${fc.bg};border:1px solid ${fc.border};border-radius:5px;padding:5px 10px;margin:4px 0"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;color:${fc.border}"><span class="mdot" style="width:14px;height:14px;background:${fc.border};margin-right:3px"></span>${fc.label}${costBadge}</span><span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#2c1810">→ ${locName}</span></div></div>`;
                    }
                });
            }
        }
        
        this.addLog(`🐎 Special Card: ${state.heroName} plays Cavalry Sweep — ${totalRemoved} minion(s) removed (cost: ${totalCost}/${state.budgetMax})!`);
        
        this.cavalrySweepState = null;
        
        // Update everything
        this.renderMap();
        this.renderTokens();
        this.renderHeroes();
        this.updateGameStatus();
        this.updateMovementButtons();
        this.updateActionButtons();
        
        this.showInfoModal('🌟 Special Card Details', `
            <div class="parchment-box">
                <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Special Card Result</span></div>
                <div style="margin-top:10px;margin-bottom:10px">${resultsHTML}</div>
                <div class="card-wrap">
                    <div class="card-banner-inner"><span class="hero-banner-name">🌟 Cavalry Sweep</span><span class="hero-banner-name" style="font-size:0.8em">${state.heroSymbol} ${state.heroName}</span></div>
                    <div class="card-body"><div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">Remove minions across the board (up to 2 per location, Dragonkin count as 2)</span></div></div>
                </div>
            </div>
        `);
    },
    
    
    // ===== DARK VISIONS SPECIAL CARD =====
    executeDarkVisions(heroIndex, cardIndex) {
        const hero = this.heroes[heroIndex];
        const card = hero.cards[cardIndex];
        
        // Draw up to 5 from darkness deck
        const drawnCards = [];
        const maxDraw = Math.min(5, this.darknessDeck.length);
        for (let i = 0; i < maxDraw; i++) {
            drawnCards.push(this.darknessDeck.shift());
        }
        
        if (drawnCards.length === 0) {
            this.showInfoModal('🌟 Special Card Details', `
                <div class="parchment-box">
                    <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Special Card Play Not Allowed</span></div>
                    <div class="modal-desc-text" style="text-align:center;margin-top:10px;margin-bottom:10px;font-size:0.8em;color:#3d2b1f">The Darkness Spreads deck is empty!</div>
                    <div class="card-wrap">
                        <div class="card-banner-inner"><span class="hero-banner-name">🌟 Dark Visions</span><span class="hero-banner-name" style="font-size:0.8em">${hero.symbol} ${hero.name}</span></div>
                        <div class="card-body"><div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">Draw the top 5 Darkness Spreads cards. Discard any you wish to avoid, then return the rest in any order.</span></div></div>
                    </div>
                </div>
            `);
            // Put card back (not consumed)
            return;
        }
        
        // Remove the special card from hero's hand (played — removed from game)
        this._playSpecialCard(hero, cardIndex);
        
        // Store state
        this._darkVisionsState = {
            heroName: hero.name,
            heroSymbol: hero.symbol,
            drawnCards: drawnCards,
            discarded: new Set(), // indices of cards to discard
            keptOrder: drawnCards.map((_, i) => i) // indices in display order
        };
        
        this.addLog(`🔮 ${hero.name} plays Dark Visions — reveals ${drawnCards.length} Darkness Spreads card(s)`);
        
        this._darkVisionsRender();
        this.renderHeroes();
        this.updateDeckCounts();
    },
    
    _darkVisionsGetCardSummary(card) {
        if (card.type === 'all_quiet') {
            return { title: '🌅 All is Quiet', color: '#4ade80', lines: ['No minions spread, no generals move'] };
        }
        if (card.type === 'monarch_city_special') {
            return { title: '🏰 Monarch City', color: '#fbbf24', lines: [
                '<span style="color:#ef4444;">SPECIAL</span> — 1 minion of each adjacent color → Monarch City',
                'Reshuffle all decks. No generals move.'
            ]};
        }
        if (card.type === 'patrol') {
            const generalName = this.generals.find(g => g.color === card.general)?.name || 'Unknown';
            const generalColor = this.getGeneralColor(card.general);
            const isWarParty = card.patrolType === 'orc_war_party';
            const patrolDesc = isWarParty
                ? '1 orc → each location with exactly 1 orc'
                : '1 orc → each empty green location';
            const patrolIcon = isWarParty ? '⚔️' : '🥾';
            const genLine = card.minions3 === 0
                ? `<span style="color:${generalColor};">${generalName}</span> → ${card.location3} (no minions)`
                : `<span style="color:${generalColor};">${generalName}</span> — ${card.minions3} minion(s) → ${card.location3}`;
            return { title: `${patrolIcon} ${card.patrolName}`, color: isWarParty ? '#dc2626' : '#16a34a', lines: [patrolDesc, genLine] };
        }
        // Regular card
        const f1 = this.generals.find(g => g.color === card.faction1)?.name || 'Unknown';
        const f2 = this.generals.find(g => g.color === card.faction2)?.name || 'Unknown';
        const gen = this.generals.find(g => g.color === card.general)?.name || 'Unknown';
        const c1 = this.getGeneralColor(card.faction1);
        const c2 = this.getGeneralColor(card.faction2);
        const gc = this.getGeneralColor(card.general);
        return { title: '🌙 Darkness Spreads', color: '#7c3aed', lines: [
            `<span style="color:${c1};">${f1}</span>: ${card.minions1} → ${card.location1}`,
            `<span style="color:${c2};">${f2}</span>: ${card.minions2} → ${card.location2}`,
            `<span style="color:${gc};">General ${gen}</span>: ${card.minions3} → ${card.location3}`
        ]};
    },
    
    _darkVisionsRender() {
        const state = this._darkVisionsState;
        if (!state) return;

        const keptIndices    = state.keptOrder.filter(i => !state.discarded.has(i));
        const discardedIndices = [...state.discarded].sort((a, b) => a - b);

        const factionColors = { green:'#16a34a', red:'#dc2626', blue:'#3b82f6', black:'#374151' };
        const generalIcons  = { green:'👺', red:'👹', blue:'🐉', black:'💀' };

        // ── mini-card visual for one DS card ─────────────────────────────────
        const _miniCard = (card) => {
            if (card.type === 'all_quiet') {
                return `<div style="display:flex;flex-direction:column;justify-content:center;gap:3px">
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.82em;color:#6d28a8">All is Quiet</div>
                    <div class="modal-desc-text" style="font-size:0.72em;color:#3d2b1f">No minions spread. No generals move.</div>
                </div>`;
            }
            if (card.type === 'monarch_city_special') {
                return `<div style="display:flex;flex-direction:column;justify-content:center;gap:3px">
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.82em;color:#7c3aed">Monarch City</div>
                    <div class="modal-desc-text" style="font-size:0.72em;color:#3d2b1f">Place 1 minion of each adjacent color. Reshuffle all decks.</div>
                </div>`;
            }
            if (card.type === 'patrol') {
                const isWarParty = card.patrolType === 'orc_war_party';
                const patrolDesc = isWarParty ? '1 orc → each location with exactly 1 orc' : '1 orc → each empty green location';
                const gc = factionColors[card.general] || '#6d28a8';
                const gi = generalIcons[card.general] || '⚔️';
                const gName = this.generals.find(g => g.color === card.general)?.name || 'Unknown';
                return `<div style="display:flex;flex-direction:column;justify-content:center;gap:3px">
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.82em;color:${isWarParty?'#dc2626':'#16a34a'}">${isWarParty?'⚔️ Orc War Party':'🥾 Orc Patrols'}</div>
                    <div class="modal-desc-text" style="font-size:0.72em;color:#3d2b1f">${patrolDesc}</div>
                </div>`;
            }
            // Regular DS card
            const c1 = factionColors[card.faction1] || '#888', c2 = factionColors[card.faction2] || '#888';
            const gc = factionColors[card.general] || '#888';
            const gi = generalIcons[card.general] || '⚔️';
            const gName = this.generals.find(g => g.color === card.general)?.name || 'Unknown';
            const dots1 = Array.from({length: Math.min(card.minions1, 4)}).map(() =>
                `<span class="modal-minion-dot" style="background:${c1};width:22px;height:22px"></span>`).join('');
            const dots2 = Array.from({length: Math.min(card.minions2, 4)}).map(() =>
                `<span class="modal-minion-dot" style="background:${c2};width:22px;height:22px"></span>`).join('');
            return `<div style="overflow:hidden;height:52px;display:flex;align-items:center">
                <div style="transform:scale(0.5);transform-origin:left center;white-space:nowrap;display:flex;gap:10px;align-items:center">
                    <div style="display:flex;align-items:center;gap:8px">
                        <div style="display:flex;flex-direction:column;align-items:center;gap:4px">${dots1}</div>
                        <div class="location-ring" style="width:90px;height:90px;background:${c1}"><span class="location-ring-name" style="font-size:0.74em">${card.location1}</span></div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                        <div style="display:flex;flex-direction:column;align-items:center;gap:4px">${dots2}</div>
                        <div class="location-ring" style="width:90px;height:90px;background:${c2}"><span class="location-ring-name" style="font-size:0.74em">${card.location2}</span></div>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px">
                        <div style="display:flex;flex-direction:column;align-items:center">
                            <div class="modal-general-token" style="background:${gc};width:48px;height:48px;font-size:1.5em">${gi}</div>
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;color:${gc};white-space:nowrap">${gName}</span>
                        </div>
                        <span style="font-size:3em;color:#fff;font-weight:900;-webkit-text-stroke:2px rgba(0,0,0,0.25);text-shadow:0 2px 6px rgba(0,0,0,0.6)">→</span>
                        <div class="location-ring" style="width:90px;height:90px;background:${gc}"><span class="location-ring-name" style="font-size:0.74em">${card.location3}</span></div>
                    </div>
                </div>
            </div>`;
        };

        // ── prediction effects pills ──────────────────────────────────────────
        const _pill = (text, loc, borderColor, bgColor, textColor) =>
            `<div style="border:1px solid ${borderColor};background:${bgColor};border-radius:5px;padding:5px 10px;font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.78em;display:flex;justify-content:space-between;align-items:center;margin:3px 0;overflow:hidden">
                <span style="color:${textColor}">${text}</span>${loc ? `<span style="color:#2c1810">→ ${loc}</span>` : ''}
            </div>`;

        const _effects = (card) => {
            const pills = [];
            if (card.type === 'all_quiet') {
                pills.push(_pill('General will not advance', '', 'rgba(139,115,85,0.3)', 'rgba(139,115,85,0.1)', '#8b7355'));
            } else if (card.type === 'monarch_city_special') {
                pills.push(_pill('General will not advance', '', 'rgba(139,115,85,0.3)', 'rgba(139,115,85,0.1)', '#8b7355'));
            } else {
                // Faction 1 warnings
                const w1 = this.predictMinionOutcome(card.faction1, card.minions1, card.location1);
                w1.forEach(w => {
                    const [bc, bg, tc] = w.type === 'overrun' ? ['#ef4444','rgba(239,68,68,0.08)','#b91c1c'] :
                                         w.type === 'taint'  ? ['#9333ea','rgba(147,51,234,0.08)','#7e22ce'] :
                                                               ['rgba(139,115,85,0.3)','rgba(139,115,85,0.1)','#8b7355'];
                    pills.push(_pill(w.text, w.location, bc, bg, tc));
                });
                // Faction 2 warnings
                const w2 = this.predictMinionOutcome(card.faction2, card.minions2, card.location2);
                w2.forEach(w => {
                    const [bc, bg, tc] = w.type === 'overrun' ? ['#ef4444','rgba(239,68,68,0.08)','#b91c1c'] :
                                         w.type === 'taint'  ? ['#9333ea','rgba(147,51,234,0.08)','#7e22ce'] :
                                                               ['rgba(139,115,85,0.3)','rgba(139,115,85,0.1)','#8b7355'];
                    pills.push(_pill(w.text, w.location, bc, bg, tc));
                });
                // General advance/block
                if (card.minions3 > 0) {
                    pills.push(_pill('General will advance', card.location3, '#ef4444', 'rgba(239,68,68,0.08)', '#b91c1c'));
                } else {
                    pills.push(_pill('General will not advance', card.location3, 'rgba(139,115,85,0.3)', 'rgba(139,115,85,0.1)', '#8b7355'));
                }
            }
            return pills.length > 0
                ? `<div style="margin-top:4px;padding-top:4px;border-top:2px solid rgba(139,115,85,0.4)">
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.82em;color:#2c1810;margin-bottom:5px">Darkness Spreads Effects</div>
                    ${pills.join('')}
                  </div>`
                : '';
        };

        // ── render kept ───────────────────────────────────────────────────────
        let cardsHTML = '';
        if (keptIndices.length > 0) {
            cardsHTML += `<div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.82em;color:#3d2b1f;margin-bottom:4px">Keep:</div>`;
            keptIndices.forEach((cardIdx, pos) => {
                const card = state.drawnCards[cardIdx];
                const isFirst = pos === 0;
                const isLast  = pos === keptIndices.length - 1;
                const upStyle    = isFirst ? 'background:#ccc;color:#999' : 'background:#8b7355;color:#fff';
                const upDisabled = isFirst ? 'disabled' : '';
                // ▼ on last kept = move to discard; otherwise move down
                const downAction = isLast
                    ? `game._darkVisionsToggleDiscard(${cardIdx})`
                    : `game._darkVisionsMoveDown(${cardIdx})`;
                cardsHTML += `<div class="dv-kept">
                    <div class="dv-ctrl">
                        <button class="dv-btn" style="${upStyle}" ${upDisabled} onclick="game._darkVisionsMoveUp(${cardIdx})">▲</button>
                        <button class="dv-btn" style="background:#8b7355;color:#fff" onclick="${downAction}">▼</button>
                    </div>
                    <div style="flex:1;min-width:0;padding:8px">
                        ${_miniCard(card)}
                        ${_effects(card)}
                    </div>
                </div>`;
            });
        }

        // ── render discarded ──────────────────────────────────────────────────
        if (discardedIndices.length > 0) {
            cardsHTML += `<div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.82em;color:#3d2b1f;margin:8px 0 4px">Discard:</div>`;
            discardedIndices.forEach(cardIdx => {
                const card = state.drawnCards[cardIdx];
                cardsHTML += `<div class="dv-disc" style="display:flex;padding:0">
                    <div class="dv-ctrl">
                        <button class="dv-btn" style="background:#8b7355;color:#fff" onclick="game._darkVisionsToggleDiscard(${cardIdx})">▲</button>
                        <button class="dv-btn" style="background:#ccc;color:#999" disabled>▼</button>
                    </div>
                    <div style="flex:1;min-width:0;padding:8px">
                        ${_miniCard(card)}
                        ${_effects(card)}
                    </div>
                </div>`;
            });
        }

        const totalKept = keptIndices.length;
        const totalDisc = discardedIndices.length;

        const contentHTML = `
            <div class="parchment-box">
                <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Darkness Spreads Discard Cards</span></div>
                <div style="max-height:380px;overflow-y:auto;overflow-x:hidden;margin-bottom:10px">
                    <div style="background:rgba(92,61,46,0.08);border:1px solid rgba(139,115,85,0.35);border-radius:5px;padding:6px 10px;margin-bottom:8px">
                        <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.75em;color:#2c1810;margin-bottom:3px">How to use:</div>
                        <div class="modal-desc-text" style="font-size:0.72em;color:#3d2b1f;margin:2px 0">▲ ▼ to reorder and move to Discard or move back to Keep.</div>
                    </div>
                    ${cardsHTML}
                </div>
                <div style="text-align:center;font-family:'Cinzel',Georgia,serif;font-size:0.8em;color:#3d2b1f;margin-bottom:10px">
                    <span style="color:#16a34a;font-weight:900">${totalKept} KEPT</span> &nbsp;|&nbsp; <span style="color:#dc2626;font-weight:900">${totalDisc} DISCARDED</span>
                </div>
                <div class="card-wrap">
                    <div class="card-banner-inner"><span class="hero-banner-name">🌟 Dark Visions</span><span class="hero-banner-name" style="font-size:0.8em">${state.heroSymbol} ${state.heroName}</span></div>
                    <div class="card-body">
                        <div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">Draw the top 5 Darkness Spreads cards. Discard any you wish to avoid, then return the rest in any order.</span></div>
                        <div style="text-align:center;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px">
                            <div class="modal-general-token" style="background:#6d28a8">⚔️</div>
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#6d28a8">Any General</span>
                        </div>
                        <div style="text-align:center;margin:10px 0;display:flex;gap:4px;justify-content:center">
                            <span class="die" style="background:#6d28a8;width:22px;height:22px;font-size:0.8em;border-radius:4px;animation:none">🎲</span>
                            <span class="die" style="background:#6d28a8;width:22px;height:22px;font-size:0.8em;border-radius:4px;animation:none">🎲</span>
                        </div>
                    </div>
                </div>
            </div>
            <button class="phb phb-cancel" onclick="game._darkVisionsDiscardAll()">Discard All ${state.drawnCards.length}</button>
            <button id="dv-confirm-btn" class="phb" onclick="game._darkVisionsConfirm()">Confirm</button>
        `;

        this.showInfoModal('🌟 Special Card Details', contentHTML);
        const _sct_dv = document.getElementById('info-modal-title');
        if (_sct_dv) { _sct_dv.style.fontFamily="'Cinzel',Georgia,serif"; _sct_dv.style.fontWeight='700'; _sct_dv.style.color='#d4af37'; _sct_dv.style.fontSize='1.2em'; _sct_dv.style.textAlign='center'; _sct_dv.style.margin='0 0 12px 0'; }
        const _sbd_dv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (_sbd_dv && !_sbd_dv.querySelector('#dv-confirm-btn')) _sbd_dv.style.display = 'none';
        const closeBtn = document.querySelector('#info-modal .modal-close-btn');
        if (closeBtn) closeBtn.style.display = 'none';
    },
    _darkVisionsToggleDiscard(cardIdx) {
        const state = this._darkVisionsState;
        if (!state) return;
        
        if (state.discarded.has(cardIdx)) {
            state.discarded.delete(cardIdx);
            // Add back to end of kept order
            if (!state.keptOrder.includes(cardIdx)) {
                state.keptOrder.push(cardIdx);
            }
        } else {
            state.discarded.add(cardIdx);
            // Remove from kept order
            state.keptOrder = state.keptOrder.filter(i => i !== cardIdx);
        }
        this._darkVisionsRender();
    },
    
    _darkVisionsMoveUp(cardIdx) {
        const state = this._darkVisionsState;
        if (!state) return;
        
        const keptOnly = state.keptOrder.filter(i => !state.discarded.has(i));
        const pos = keptOnly.indexOf(cardIdx);
        if (pos <= 0) return;
        
        // Swap in keptOrder
        const fullPos = state.keptOrder.indexOf(cardIdx);
        const prevKeptIdx = keptOnly[pos - 1];
        const prevFullPos = state.keptOrder.indexOf(prevKeptIdx);
        
        state.keptOrder[fullPos] = prevKeptIdx;
        state.keptOrder[prevFullPos] = cardIdx;
        
        this._darkVisionsRender();
    },
    
    _darkVisionsMoveDown(cardIdx) {
        const state = this._darkVisionsState;
        if (!state) return;
        
        const keptOnly = state.keptOrder.filter(i => !state.discarded.has(i));
        const pos = keptOnly.indexOf(cardIdx);
        if (pos < 0 || pos >= keptOnly.length - 1) return;
        
        // Swap in keptOrder
        const fullPos = state.keptOrder.indexOf(cardIdx);
        const nextKeptIdx = keptOnly[pos + 1];
        const nextFullPos = state.keptOrder.indexOf(nextKeptIdx);
        
        state.keptOrder[fullPos] = nextKeptIdx;
        state.keptOrder[nextFullPos] = cardIdx;
        
        this._darkVisionsRender();
    },
    
    _darkVisionsDiscardAll() {
        const state = this._darkVisionsState;
        if (!state) return;
        
        state.drawnCards.forEach((_, i) => state.discarded.add(i));
        state.keptOrder = [];
        this._darkVisionsRender();
    },
    
    _darkVisionsConfirm() {
        const state = this._darkVisionsState;
        if (!state) return;
        
        const keptIndices = state.keptOrder.filter(i => !state.discarded.has(i));
        const discardedIndices = [...state.discarded];
        
        // Put kept cards back on TOP of darkness deck in order (first in list = first drawn)
        // unshift in reverse so index 0 ends up on top
        for (let i = keptIndices.length - 1; i >= 0; i--) {
            this.darknessDeck.unshift(state.drawnCards[keptIndices[i]]);
        }
        
        // Discarded cards increase discard pile count
        this.darknessDiscardPile += discardedIndices.length;
        
        // Log results
        const keptNames = keptIndices.map(i => {
            const c = state.drawnCards[i];
            return this._darkVisionsGetCardSummary(c).title;
        });
        const discardedNames = discardedIndices.map(i => {
            const c = state.drawnCards[i];
            return this._darkVisionsGetCardSummary(c).title;
        });
        
        if (keptIndices.length > 0) {
            this.addLog(`  ↩ Returned ${keptIndices.length} card(s) to top of deck`);
        }
        if (discardedIndices.length > 0) {
            this.addLog(`  🗑️ Discarded ${discardedIndices.length} card(s): ${discardedNames.join(', ')}`);
        }
        
        this._darkVisionsState = null;
        this.updateDeckCounts();
        this.closeInfoModal();
        
        // Restore close button
        const closeBtn = document.querySelector('#info-modal .modal-close-btn');
        if (closeBtn) closeBtn.style.display = '';
        
        // Build parchment-style summary
        let keptRows = '';
        keptIndices.forEach((idx, pos) => {
            const summary = this._darkVisionsGetCardSummary(state.drawnCards[idx]);
            keptRows += `<div style="display:flex;align-items:center;margin:4px 0;border:2px solid #8b7355;border-radius:6px;background:rgba(92,61,46,0.08);overflow:hidden"><div style="flex:1;padding:8px"><div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:${summary.color}"><span style="color:#8b7355;font-size:0.8em">#${pos+1}</span> ${summary.title}</div>${summary.lines.map(l=>`<div style="font-size:0.8em;color:#3d2b1f;padding:1px 0">${l}</div>`).join('')}</div></div>`;
        });
        let discardedRows = '';
        discardedIndices.forEach(idx => {
            const summary = this._darkVisionsGetCardSummary(state.drawnCards[idx]);
            discardedRows += `<div style="display:flex;align-items:center;margin:4px 0;border:2px solid #8b7355;border-radius:6px;background:rgba(92,61,46,0.05);opacity:0.6;overflow:hidden"><div style="flex:1;padding:8px"><div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#888;text-decoration:line-through">${summary.title}</div></div></div>`;
        });
        
        const dvHeroSymbol = state.heroSymbol;
        const dvHeroName = state.heroName;
        
        const summaryHTML = `
            <div class="parchment-box">
                <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Special Card Result</span></div>
                <div style="margin-top:10px;max-height:300px;overflow-y:auto">
                    ${keptRows.length > 0 ? `<div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.82em;color:#2c1810;margin-bottom:5px">Kept:</div>${keptRows}` : ''}
                    ${discardedRows.length > 0 ? `<div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.82em;color:#2c1810;margin-top:8px;margin-bottom:5px">Discarded:</div>${discardedRows}` : ''}
                </div>
                <div class="card-wrap" style="margin-top:10px">
                    <div class="card-banner-inner"><span class="hero-banner-name">🌟 Dark Visions</span><span class="hero-banner-name" style="font-size:0.8em">${dvHeroSymbol} ${dvHeroName}</span></div>
                    <div class="card-body"><div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">Draw the top 5 Darkness Spreads cards. Discard any you wish to avoid, then return the rest in any order.</span></div></div>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            this.showInfoModal('🌟 Special Card Details', summaryHTML);
        }, 300);
    },
    
    
    // ===== MILITIA SECURES AREA =====
    _findMilitiaSecuresCard() {
        for (let i = 0; i < this.heroes.length; i++) {
            const hero = this.heroes[i];
            for (let j = 0; j < hero.cards.length; j++) {
                if (hero.cards[j].specialAction === 'militia_secures') {
                    return { hero, heroIndex: i, cardIndex: j };
                }
            }
        }
        return null;
    },
    
    _militiaSecuresShowPicker() {
        const card = this.darknessCurrentCard;
        if (!card || !card.faction1) return;
        
        const f1Name = this.generals.find(g => g.color === card.faction1)?.name || 'Unknown';
        const f2Name = this.generals.find(g => g.color === card.faction2)?.name || 'Unknown';
        const c1 = this.getGeneralColor(card.faction1);
        const c2 = this.getGeneralColor(card.faction2);
        const w1 = this.predictMinionOutcome(card.faction1, card.minions1, card.location1);
        const w2 = this.predictMinionOutcome(card.faction2, card.minions2, card.location2);
        
        const warn1 = w1.length > 0 ? `<div style="margin-top: 4px;">${this.renderPredictionTags(w1)}</div>` : '';
        const warn2 = w2.length > 0 ? `<div style="margin-top: 4px;">${this.renderPredictionTags(w2)}</div>` : '';
        
        const militiaHolder = this._findMilitiaSecuresCard();
        const holderText = militiaHolder ? `${militiaHolder.hero.symbol} ${militiaHolder.hero.name}` : '';
        
        const pickerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="font-size: 1.5em; margin-bottom: 8px;">🛡️</div>
                <div style="color: #d4af37; margin-bottom: 4px;">Choose which minion placement to cancel:</div>
                <div style="color: #888; font-size: 0.85em;">Card from ${holderText}'s hand will be consumed</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px; margin: 15px 0;">
                <div onclick="game._militiaSecuresConfirm(1)" 
                     style="cursor: pointer; padding: 14px; border: 2px solid ${c1}; border-radius: 8px; background: rgba(0,0,0,0.3); transition: all 0.2s;"
                     onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(0,0,0,0.3)'">
                    <div style="color: ${c1}; font-weight: bold; font-size: 1.05em;">Minion 1: ${f1Name}</div>
                    <div style="color: #ccc; margin-top: 4px;">${card.minions1} minion${card.minions1 > 1 ? 's' : ''} → ${card.location1}</div>
                    ${warn1}
                </div>
                <div onclick="game._militiaSecuresConfirm(2)" 
                     style="cursor: pointer; padding: 14px; border: 2px solid ${c2}; border-radius: 8px; background: rgba(0,0,0,0.3); transition: all 0.2s;"
                     onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(0,0,0,0.3)'">
                    <div style="color: ${c2}; font-weight: bold; font-size: 1.05em;">Minion 2: ${f2Name}</div>
                    <div style="color: #ccc; margin-top: 4px;">${card.minions2} minion${card.minions2 > 1 ? 's' : ''} → ${card.location2}</div>
                    ${warn2}
                </div>
            </div>
            <div style="text-align: center;">
                <button class="btn" style="background: #666; min-width: 120px;" onclick="game.closeInfoModal()">Cancel</button>
            </div>
        `;
        
        this.showInfoModal('🌟 Special Card Details', pickerHTML);
        // Hide default OK button
        const defaultBtn = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtn && !defaultBtn.querySelector('.btn[onclick*="closeInfoModal"]')) {
            defaultBtn.style.display = 'none';
        }
    },
    
    _militiaSecuresConfirm(slot) {
        const militiaHolder = this._findMilitiaSecuresCard();
        if (!militiaHolder) return;
        
        const card = this.darknessCurrentCard;
        const faction = slot === 1 ? card.faction1 : card.faction2;
        const location = slot === 1 ? card.location1 : card.location2;
        const count = slot === 1 ? card.minions1 : card.minions2;
        const factionName = this.generals.find(g => g.color === faction)?.name || 'Unknown';
        
        // Remove card from hero's hand (played — removed from game)
        this._playSpecialCard(militiaHolder.hero, militiaHolder.cardIndex);
        
        // Store secured slot
        this.militiaSecuredSlot = slot;
        
        this.addLog(`🛡️ ${militiaHolder.hero.name} plays Militia Secures Area — cancels ${factionName} placement (${count} @ ${location})`);
        
        this.closeInfoModal();
        this.renderHeroes();
        this.updateDeckCounts();
        
        // Build faction pill colours
        const _milFcMap = { green: { bg: 'rgba(22,163,74,0.1)', border: '#16a34a' }, red: { bg: 'rgba(239,68,68,0.1)', border: '#dc2626' }, blue: { bg: 'rgba(59,130,246,0.1)', border: '#3b82f6' }, black: { bg: 'rgba(107,114,128,0.1)', border: '#6b7280' } };
        const _milLabels = { green: 'Orcs', red: 'Demons', blue: 'Dragonkin', black: 'Undead' };
        const milPill = _milFcMap[faction] || { bg: 'rgba(139,115,85,0.1)', border: '#8b7355' };
        const milGc = this.getGeneralColor(faction);
        const milLabel = _milLabels[faction] || factionName;
        
        const milResultHTML = `
            <div class="parchment-box">
                <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Special Card Result</span></div>
                <div style="margin-top:10px;margin-bottom:10px">
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;color:#3d2b1f;margin-bottom:6px">Minion Placement Cancelled:</div>
                    <div style="background:${milPill.bg};border:1px solid ${milPill.border};border-radius:5px;padding:5px 10px;margin:4px 0">
                        <div style="display:flex;justify-content:space-between;align-items:center">
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;color:${milGc}"><span class="mdot" style="width:14px;height:14px;background:${milGc};margin-right:3px"></span>${milLabel}</span>
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#2c1810">→ ${location}</span>
                        </div>
                    </div>
                </div>
                <div class="card-wrap">
                    <div class="card-banner-inner"><span class="hero-banner-name">🌟 Militia Secures Area</span><span class="hero-banner-name" style="font-size:0.8em">${militiaHolder.hero.symbol} ${militiaHolder.hero.name}</span></div>
                    <div class="card-body"><div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">During Night Phase: Cancel 1 minion placement from a Darkness Spreads card.</span></div></div>
                </div>
            </div>`;
        
        // Show result then resume darkness preview on continue
        const cardNum = this.darknessCardsDrawn;
        const totalCards = this.darknessCardsToDraw;
        const generalOnly = this.darknessCurrentGeneralOnly;
        this.showInfoModal('🌟 Special Card Details', milResultHTML, () => {
            this.showDarknessCardPreview(card, cardNum, totalCards, generalOnly);
        });
    },
    
    // ===== STRONG DEFENSES =====
    _findStrongDefensesCard() {
        for (let i = 0; i < this.heroes.length; i++) {
            const hero = this.heroes[i];
            for (let j = 0; j < hero.cards.length; j++) {
                if (hero.cards[j].specialAction === 'strong_defenses') {
                    return { hero, heroIndex: i, cardIndex: j };
                }
            }
        }
        return null;
    },
    
    _strongDefensesConfirm() {
        const holder = this._findStrongDefensesCard();
        if (!holder) return;
        
        const card = this.darknessCurrentCard;
        const generalName = this.generals.find(g => g.color === card.general)?.name || 'Unknown';
        
        // Remove card from hero's hand (played — removed from game)
        this._playSpecialCard(holder.hero, holder.cardIndex);
        
        // Store blocked state
        this.strongDefensesActive = true;
        
        this.addLog(`🏰 ${holder.hero.name} plays Strong Defenses — prevents ${generalName} from moving to ${card.location3}`);
        
        this.closeInfoModal();
        this.renderHeroes();
        this.updateDeckCounts();
        
        // Re-render the preview with blocked general shown
        const cardNum = this.darknessCardsDrawn;
        const totalCards = this.darknessCardsToDraw;
        const generalOnly = this.darknessCurrentGeneralOnly;
        this.showDarknessCardPreview(card, cardNum, totalCards, generalOnly);
    },
    
    
    // ===== GENERAL WOUND SYSTEM =====
    _getWoundType(general) {
        // Sapphire ignores wound system (regeneration)
        if (general.combatSkill === 'regeneration') return null;
        if (general.defeated) return null;
        if (general.health >= general.maxHealth) return null;
        
        // Major wound thresholds
        if (general.name === 'Gorgutt' && general.health <= 2) return 'major';
        if (general.name === 'Balazarg' && general.health <= 1) return 'major';
        // Varkolak cannot have major wounds
        if (general.name === 'Varkolak') return 'minor';
        
        return 'minor';
    },
    
    _setGeneralWound(general, attackerPlayerIndex) {
        // Sapphire ignores wound system
        if (general.combatSkill === 'regeneration') {
            delete this.generalWounds[general.color];
            return;
        }
        if (general.defeated) {
            delete this.generalWounds[general.color];
            return;
        }
        if (general.health >= general.maxHealth) {
            delete this.generalWounds[general.color];
            return;
        }
        
        const woundType = this._getWoundType(general);
        if (!woundType) {
            delete this.generalWounds[general.color];
            return;
        }
        
        const numHeroes = this.heroes.length;
        // Minor: heals at end of NEXT player's turn (skip attacker's own turn end)
        // Major: heals after full round + attacker completes a new turn
        // +1 accounts for the attacker's own turn end being the first decrement
        const countdown = woundType === 'major' ? (numHeroes + 1) : 2;
        
        this.generalWounds[general.color] = {
            type: woundType,
            healingCountdown: countdown,
            woundedByPlayerIndex: attackerPlayerIndex
        };
        
        this.addLog(`  ⚔️ ${general.name} has ${woundType === 'major' ? 'MAJOR' : 'Minor'} Wounds (${general.health}/${general.maxHealth})`);
    },
    
    _processGeneralHealing() {
        const healingResults = [];
        
        for (const general of this.generals) {
            if (general.defeated) continue;
            if (general.combatSkill === 'regeneration') continue; // Sapphire ignores
            
            const wound = this.generalWounds[general.color];
            if (!wound) continue;
            
            // Already at max health - clear wound
            if (general.health >= general.maxHealth) {
                delete this.generalWounds[general.color];
                continue;
            }
            
            // Decrement countdown if still waiting
            if (wound.healingCountdown > 0) {
                wound.healingCountdown--;
            }
            
            if (wound.healingCountdown > 0) {
                // Still waiting to begin healing
                healingResults.push({
                    general: general,
                    wound: wound,
                    healed: false,
                    waiting: true
                });
            } else {
                // Active healing — heal 1 HP
                const oldHealth = general.health;
                general.health = Math.min(general.health + 1, general.maxHealth);
                const healedAmount = general.health - oldHealth;
                
                // Check if wound type changed after healing
                const newWoundType = this._getWoundType(general);
                if (!newWoundType || general.health >= general.maxHealth) {
                    // Fully healed
                    const oldType = wound.type;
                    delete this.generalWounds[general.color];
                    healingResults.push({
                        general: general,
                        wound: { type: oldType },
                        healed: true,
                        healedAmount: healedAmount,
                        fullyHealed: general.health >= general.maxHealth
                    });
                    if (healedAmount > 0) {
                        this.addLog(`💚 ${general.name} heals ${healedAmount} HP → ${general.health}/${general.maxHealth} (Fully healed!)`);
                    }
                } else {
                    // Still wounded, update type if changed
                    if (newWoundType !== wound.type) {
                        wound.type = newWoundType;
                    }
                    healingResults.push({
                        general: general,
                        wound: wound,
                        healed: true,
                        healedAmount: healedAmount,
                        fullyHealed: false
                    });
                    if (healedAmount > 0) {
                        this.addLog(`💚 ${general.name} heals ${healedAmount} HP → ${general.health}/${general.maxHealth} (${wound.type} wounds)`);
                    }
                }
            }
        }
        
        return healingResults;
    },
    
    _buildHealingHTML(healingResults) {
        if (healingResults.length === 0) return '';
        
        let html = `<div style="margin: 12px 0; padding: 10px; border: 2px solid #a78bfa; background: rgba(167,139,250,0.1); border-radius: 8px;">
            <div style="font-weight: bold; color: #a78bfa; margin-bottom: 8px; font-size: 0.95em;">⚔️ General Wounds</div>`;
        
        healingResults.forEach(result => {
            const g = result.general;
            const gc = this.getGeneralColor(g.color);
            const woundColor = result.wound.type === 'major' ? '#ef4444' : '#f59e0b';
            const woundLabel = result.wound.type === 'major' ? 'MAJOR WOUNDS' : 'Minor Wounds';
            
            if (result.spyBlocked) {
                html += `<div style="padding: 6px 8px; margin: 4px 0; border-left: 3px solid #7c3aed; background: rgba(124,58,237,0.15); border-radius: 3px;">
                    <span style="color: ${gc}; font-weight: bold;">${g.symbol} ${g.name}</span>
                    <span style="color: #a78bfa; margin-left: 6px;">👤 Spy In The Camp — Healing blocked!</span>
                    <span style="color: ${woundColor}; font-size: 0.85em; margin-left: 6px;">(${woundLabel} — ${g.health}/${g.maxHealth})</span>
                </div>`;
            } else if (result.healed) {
                if (result.fullyHealed) {
                    html += `<div style="padding: 6px 8px; margin: 4px 0; border-left: 3px solid #4ade80; background: rgba(0,0,0,0.2); border-radius: 3px;">
                        <span style="color: ${gc}; font-weight: bold;">${g.symbol} ${g.name}</span>
                        <span style="color: #4ade80; margin-left: 6px;">+${result.healedAmount} HP → ${g.health}/${g.maxHealth} — Fully Healed!</span>
                    </div>`;
                } else {
                    html += `<div style="padding: 6px 8px; margin: 4px 0; border-left: 3px solid ${woundColor}; background: rgba(0,0,0,0.2); border-radius: 3px;">
                        <span style="color: ${gc}; font-weight: bold;">${g.symbol} ${g.name}</span>
                        <span style="color: #4ade80; margin-left: 6px;">+${result.healedAmount} HP → ${g.health}/${g.maxHealth}</span>
                        <span style="color: ${woundColor}; font-size: 0.85em; margin-left: 6px;">(${woundLabel})</span>
                    </div>`;
                }
            } else {
                // Still waiting for countdown
                const turnsLeft = result.wound.healingCountdown;
                html += `<div style="padding: 6px 8px; margin: 4px 0; border-left: 3px solid ${woundColor}; background: rgba(0,0,0,0.2); border-radius: 3px;">
                    <span style="color: ${gc}; font-weight: bold;">${g.symbol} ${g.name}</span>
                    <span style="color: ${woundColor}; font-size: 0.85em; margin-left: 6px;">${woundLabel} — ${g.health}/${g.maxHealth}</span>
                    <span style="color: #999; font-size: 0.85em; margin-left: 4px;">— Healing in ${turnsLeft} turn${turnsLeft !== 1 ? 's' : ''}</span>
                </div>`;
            }
        });
        
        html += '</div>';
        return html;
    },
    
    // ===== SPY IN THE CAMP =====
    _findSpyInCampCard() {
        for (let i = 0; i < this.heroes.length; i++) {
            const hero = this.heroes[i];
            for (let j = 0; j < hero.cards.length; j++) {
                if (hero.cards[j].specialAction === 'spy_in_camp') {
                    return { hero, heroIndex: i, cardIndex: j };
                }
            }
        }
        return null;
    },
    
    _getWoundedGeneralsForSpy() {
        // Returns generals that have wounds and would heal this turn (countdown === 0 after decrement)
        // OR are already actively healing (countdown already 0)
        return this.generals.filter(g => {
            if (g.defeated) return false;
            if (g.combatSkill === 'regeneration') return false;
            const wound = this.generalWounds[g.color];
            if (!wound) return false;
            // Show if the general has any wound status (even if still counting down)
            return true;
        });
    },
    
    _spyInCampShowPicker() {
        const woundedGenerals = this._getWoundedGeneralsForSpy();
        if (woundedGenerals.length === 0) return;
        
        const spyHolder = this._findSpyInCampCard();
        const holderText = spyHolder ? `${spyHolder.hero.symbol} ${spyHolder.hero.name}` : '';
        
        let generalsHTML = '';
        woundedGenerals.forEach(g => {
            const gc = this.getGeneralColor(g.color);
            const wound = this.generalWounds[g.color];
            const woundColor = wound.type === 'major' ? '#ef4444' : '#f59e0b';
            const woundLabel = wound.type === 'major' ? 'MAJOR WOUNDS' : 'Minor Wounds';
            const healStatus = wound.healingCountdown > 0 
                ? `Healing in ${wound.healingCountdown} turn${wound.healingCountdown !== 1 ? 's' : ''}`
                : 'Currently healing';
            const statusColor = wound.healingCountdown > 0 ? '#999' : '#4ade80';
            
            generalsHTML += `
                <div onclick="game._spyInCampConfirm('${g.color}')" 
                     style="cursor: pointer; padding: 14px; border: 2px solid ${gc}; border-radius: 8px; background: rgba(0,0,0,0.3); transition: all 0.2s; margin-bottom: 8px;"
                     onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(0,0,0,0.3)'">
                    <div style="color: ${gc}; font-weight: bold; font-size: 1.05em;">${g.symbol} ${g.name}</div>
                    <div style="color: #ccc; margin-top: 4px;">${g.health}/${g.maxHealth} HP — <span style="color: ${woundColor};">${woundLabel}</span></div>
                    <div style="color: ${statusColor}; font-size: 0.9em; margin-top: 2px;">${healStatus}</div>
                </div>`;
        });
        
        const pickerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="font-size: 1.5em; margin-bottom: 8px;">👤</div>
                <div style="color: #d4af37; margin-bottom: 4px;">Choose a General to block healing:</div>
                <div style="color: #888; font-size: 0.85em;">Card from ${holderText}'s hand will be consumed</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0; margin: 15px 0;">
                ${generalsHTML}
            </div>
            <div style="text-align: center;">
                <button class="btn" style="background: #666; min-width: 120px;" onclick="game.closeInfoModal()">Cancel</button>
            </div>
        `;
        
        this.showInfoModal('🌟 Special Card Details', pickerHTML);
    },
    
    _spyInCampConfirm(generalColor) {
        const spyHolder = this._findSpyInCampCard();
        if (!spyHolder) return;
        
        const general = this.generals.find(g => g.color === generalColor);
        if (!general) return;
        
        // Remove card from hero's hand (played — removed from game)
        this._playSpecialCard(spyHolder.hero, spyHolder.cardIndex);
        
        // Store blocked general for this turn
        this.spyBlockedGeneral = generalColor;
        
        this.addLog(`👤 ${spyHolder.hero.name} plays Spy In The Camp — blocks ${general.name} from healing this turn`);
        
        // Reverse the healing that already happened for this general in stored results
        if (this._daytimeHealingResults) {
            const resultIdx = this._daytimeHealingResults.findIndex(r => r.general.color === generalColor);
            if (resultIdx !== -1) {
                const result = this._daytimeHealingResults[resultIdx];
                if (result.healed && result.healedAmount > 0) {
                    // Undo the HP gain
                    general.health -= result.healedAmount;
                    // If wound was cleared because it fully healed, restore it
                    if (result.fullyHealed || !this.generalWounds[generalColor]) {
                        this.generalWounds[generalColor] = { 
                            type: result.wound.type, 
                            healingCountdown: 0,
                            woundedByPlayerIndex: result.wound.woundedByPlayerIndex
                        };
                    }
                }
                // Mark result as spy blocked
                result.spyBlocked = true;
                result.healed = false;
                result.healedAmount = 0;
                result.fullyHealed = false;
                // Update wound reference to current state
                result.wound = this.generalWounds[generalColor];
            }
        }
        
        this.closeInfoModal();
        this.renderHeroes();
        this.updateDeckCounts();
        
        // Build result modal
        const _spyGc = this.getGeneralColor(generalColor);
        const _spyHeart = this._heartIcons[generalColor] || '🖤';
        const _spyHpColor = general.health <= 2 ? '#b91c1c' : '#2c1810';
        const _spyGIcon = this._generalIcons[generalColor] || '⚔️';
        const _spyHolder = this._findSpyInCampCard()?.hero || { symbol: '⛏️', name: 'Dwarf' };
        
        const spyResultHTML = `
            <div class="parchment-box">
                <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Special Card Result</span></div>
                <div style="margin-top:10px;margin-bottom:10px">
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;color:#3d2b1f;margin-bottom:6px">Prevent General Healing:</div>
                    <div style="background:rgba(239,68,68,0.1);border:1px solid #dc2626;border-radius:5px;padding:5px 10px;margin:4px 0;font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em">
                        <div style="display:flex;justify-content:space-between;align-items:center">
                            <span style="display:flex;align-items:center;gap:6px;color:${_spyGc}"><span class="modal-general-token" style="background:${_spyGc};width:24px;height:24px;font-size:0.75em">${_spyGIcon}</span>${general.name}</span>
                            <span style="color:${_spyHpColor}">${_spyHeart} ${general.health}/${general.maxHealth}</span>
                        </div>
                        <div style="font-size:0.85em;color:#b91c1c;margin-top:3px;padding-left:30px">— Healing Blocked</div>
                    </div>
                </div>
                <div class="card-wrap">
                    <div class="card-banner-inner"><span class="hero-banner-name">🌟 Spy In The Camp</span><span class="hero-banner-name" style="font-size:0.8em">${_spyHolder.symbol} ${_spyHolder.name}</span></div>
                    <div class="card-body"><div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Special:</strong> <span class="modal-desc-text">During Step 1: Prevent 1 General from healing its battle wounds for 1 player's turn.</span></div></div>
                </div>
            </div>`;
        
        // Show result then resume daytime modal on continue
        const hero = this.endOfTurnState.hero;
        const damageInfo = this.endOfTurnState.damageInfo;
        this.showInfoModal('🌟 Special Card Details', spyResultHTML, () => {
            this.showDaytimeModal(hero, damageInfo);
        });
    },
    

});
