// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Game Status, Win/Lose Conditions
// ═══════════════════════════════════════════════════════════════

Object.assign(game, {
    showInfoModal(title, contentHTML, callback) {
        document.getElementById('info-modal-title').innerHTML = title;
        document.getElementById('info-modal-content').innerHTML = contentHTML;
        this._infoModalCallback = callback || null;
        document.getElementById('info-modal').classList.add('active');
    },
    
    closeInfoModal() {
        document.getElementById('info-modal').classList.remove('active');
        // Restore default Continue button visibility
        const defaultBtn = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtn) defaultBtn.style.display = '';
        if (this._infoModalCallback) {
            const cb = this._infoModalCallback;
            this._infoModalCallback = null;
            cb();
        }
    },
    
    showGameOver(title, subtitle, icon, conditionKey, defeatDesc) {
        this._currentLoseConditionKey = conditionKey || 'unknown';
        this._currentLoseConditionTitle = defeatDesc || title;
        const content = document.getElementById('game-over-content');
        content.innerHTML = `
            <div style="font-size: 80px; margin: 20px 0;">
                ${icon}
            </div>
            <h1 style="color: #dc2626; font-size: 2.5em; margin: 20px 0;">
                💀 DEFEAT 💀
            </h1>
            <div style="font-size: 1.5em; color: #ffd700; margin: 15px 0;">
                ${title}
            </div>
            <div style="font-size: 1.2em; color: #d4af37; margin: 10px 0;">
                ${subtitle}
            </div>
        `;
        document.getElementById('game-over-modal').classList.add('active');
    },
    
    continueGame() {
        // Disable only the specific lose condition that triggered this modal
        const key = this._currentLoseConditionKey || 'unknown';
        const title = this._currentLoseConditionTitle || 'Unknown defeat';
        this.loseConditionsDisabled[key] = true;
        this.defeatList.push(title);
        document.getElementById('game-over-modal').classList.remove('active');
        this.addLog(`--- Player chose to continue past defeat: ${title} (defeat #${this.defeatList.length}) ---`);
        
        // Resume turn flow that was interrupted by the lose condition
        if (this.showingDarknessOnMap && this.lastDarknessEvents) {
            this.showingDarknessOnMap = false;
            this.showDarknessEffectsOnMap(this.lastDarknessEvents);
            this.completeMapTurnEndWithPlayerChange();
        } else if (this.pendingPlayerChange) {
            this.pendingPlayerChange = false;
            
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.heroes.length;
            
            const nextHero = this.heroes[this.currentPlayerIndex];
            this.actionsRemaining = nextHero.health;
            this._applyFreshMountBonus(nextHero);
            this._applyMountainLoreBonus(nextHero);
            this._applyElfSupportBonus(nextHero);
            const questBonus1 = this._getQuestActionBonus(nextHero);
            if (questBonus1 > 0) {
                this.actionsRemaining += questBonus1;
                this.addLog(`📜 Boots of Speed: ${nextHero.name} gains +${questBonus1} actions!`);
            }
            this.rumorsUsedThisTurn = 0;
            this.wizardTeleportUsedThisTurn = false;
            
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
    
    checkWinCondition() {
        // Win Condition: All 4 generals defeated
        const allDefeated = this.generals.every(g => g.defeated);
        if (allDefeated) {
            let defeatNote = '';
            if (this.defeatList.length > 0) {
                const defeatLines = this.defeatList.map(d => `<div style="padding: 6px 8px; margin: 4px 0; border-left: 3px solid #ef4444; background: rgba(0,0,0,0.3); border-radius: 3px;">💀 ${d}</div>`).join('');
                defeatNote = `
                    <div style="margin-top: 15px; padding: 10px; border: 2px solid #ef4444; background: rgba(239,68,68,0.1); border-radius: 5px;">
                        <strong style="color: #ef4444;">Lose conditions triggered:</strong>
                        <div style="margin-top: 8px;">${defeatLines}</div>
                    </div>`;
            }
            setTimeout(() => {
                this.showInfoModal('🎉 Victory!', `<div>All generals have been defeated! The realm is safe!</div>${defeatNote}`);
                this.addLog('=== VICTORY! THE REALM IS SAVED! ===');
            }, 500);
            return;
        }
        
        // Check Lose Conditions
        this.checkLoseConditions();
    },
    
    checkLoseConditions() {
        // Lose Condition 1: Any general reaches Monarch City
        for (const general of this.generals) {
            const key = `general_monarch_${general.color}`;
            if (!general.defeated && general.location === 'Monarch City' && !this.loseConditionsDisabled[key]) {
                setTimeout(() => {
                    this.showGameOver(`${general.name} has reached Monarch City!`, 'The realm has fallen!', general.symbol, key, `${general.name} has reached Monarch City`);
                    this.addLog(`=== DEFEAT! ${general.name} CONQUERED MONARCH CITY! ===`);
                }, 500);
                return true;
            }
        }
        
        // Lose Condition 2: 5 total minions on Monarch City (any combination)
        if (!this.loseConditionsDisabled['monarch_minions']) {
            const monarchMinions = this.minions['Monarch City'];
            if (monarchMinions) {
                const totalMinions = Object.values(monarchMinions).reduce((a, b) => a + b, 0);
                if (totalMinions >= 5) {
                    setTimeout(() => {
                        this.showGameOver('5 minions have overrun Monarch City!', 'The capital has fallen!', '🏰', 'monarch_minions', '5 minions have overrun Monarch City');
                        this.addLog(`=== DEFEAT! MONARCH CITY OVERRUN! ===`);
                    }, 500);
                    return true;
                }
            }
        }
        
        // Lose Condition 3: 12 taint crystals on the board
        if (!this.loseConditionsDisabled['taint_crystals'] && this.taintCrystalsRemaining <= 0) {
            setTimeout(() => {
                this.showGameOver('The land is consumed by corruption!', 'All taint crystals have been placed!', '💎', 'taint_crystals', '12 Tainted Crystals added to the board');
                this.addLog('=== DEFEAT! THE REALM IS CORRUPTED! ===');
            }, 500);
            return true;
        }
        
        // Lose Condition 4: No minions left to place when a card tries to add them
        // This is triggered during processMinionPlacement when all 25 of a color are on the board
        if (this.pendingMinionExhaustion) {
            for (const [color, info] of Object.entries(this.pendingMinionExhaustion)) {
                const key = `minion_exhausted_${color}`;
                if (!this.loseConditionsDisabled[key]) {
                    const generalSymbol = this.generals.find(g => g.color === color)?.symbol || '👹';
                    // Clear the pending flag for this color
                    delete this.pendingMinionExhaustion[color];
                    if (Object.keys(this.pendingMinionExhaustion).length === 0) {
                        this.pendingMinionExhaustion = null;
                    }
                    setTimeout(() => {
                        this.showGameOver(
                            `No ${color} minions remaining!`, 
                            `${info.generalName}'s forces tried to place ${info.count} minion${info.count > 1 ? 's' : ''} at ${info.location} but none are left!`, 
                            generalSymbol, key, 
                            `No additional ${info.generalName} minions can be added to the board`
                        );
                        this.addLog(`=== DEFEAT! ${color.toUpperCase()} MINIONS EXHAUSTED! ===`);
                    }, 500);
                    return true;
                }
            }
            this.pendingMinionExhaustion = null;
        }
        
        return false;
    },
    
    updateWarStatus() {
        const defeatedCount = this.generals.filter(g => g.defeated).length;
        const oldStatus = this.warStatus;
        
        if (this.warTrackerLocked) {
            this.warStatus = 'early';
        } else if (defeatedCount >= 3) {
            this.warStatus = 'late';
        } else if (defeatedCount >= 1) {
            this.warStatus = 'mid';
        } else {
            this.warStatus = 'early';
        }
        
        if (this.warStatus !== oldStatus) {
            this.addLog(`⚔️ War Status advanced to ${this.warStatus.toUpperCase()} WAR! (${defeatedCount} general${defeatedCount !== 1 ? 's' : ''} defeated)`);
        } else if (this.warTrackerLocked && defeatedCount >= 1 && oldStatus === 'early') {
            this.addLog(`🔒 War Tracker locked at Early War (${defeatedCount} general${defeatedCount !== 1 ? 's' : ''} defeated)`);
        }
        
        this.renderWarStatus();
    },
    
    renderWarStatus() {
        const boxes = [
            document.getElementById('war-early'),
            document.getElementById('war-mid1'),
            document.getElementById('war-mid2'),
            document.getElementById('war-late')
        ];
        const descEl = document.getElementById('war-status-desc');
        
        if (!boxes[0]) return;
        
        const defeatedCount = this.generals.filter(g => g.defeated).length;
        
        // Determine which box the icon sits on (0-3) based on generals defeated
        // 0 defeated = box 0 (Early), 1 = box 1 (Mid), 2 = box 2 (Mid), 3+ = box 3 (Late)
        let activeIndex;
        if (this.warTrackerLocked) {
            activeIndex = 0;
        } else {
            activeIndex = Math.min(defeatedCount, 3);
        }
        
        // Phase colors
        const phaseThemes = {
            early:  { accent: '#4ade80', glow: 'rgba(74,222,128,0.25)' },
            mid:    { accent: '#d4af37', glow: 'rgba(212,175,55,0.25)' },
            late:   { accent: '#dc2626', glow: 'rgba(220,38,38,0.25)' }
        };
        const theme = phaseThemes[this.warStatus];
        
        // Reset all boxes to inactive
        boxes.forEach(el => {
            el.style.background = 'rgba(139,115,85,0.1)';
            el.style.borderColor = '#8b7355';
            el.style.boxShadow = 'none';
            const label = el.querySelector('.war-label');
            if (label) label.style.color = '#6b5b4a';
            const icon = el.querySelector('.war-icon');
            if (icon) icon.textContent = '';
        });
        
        // Style active box
        const activeEl = boxes[activeIndex];
        activeEl.style.background = `linear-gradient(135deg, ${theme.glow}, rgba(139,115,85,0.15))`;
        activeEl.style.borderColor = theme.accent;
        activeEl.style.boxShadow = `0 0 8px ${theme.glow}, inset 0 0 6px ${theme.glow}`;
        const activeLabel = activeEl.querySelector('.war-label');
        if (activeLabel) activeLabel.style.color = theme.accent;
        
        // Place icon in active box
        const activeIcon = activeEl.querySelector('.war-icon');
        if (activeIcon) activeIcon.textContent = '⚔️';
        
        // Update description
        if (descEl) {
            if (this.warStatus === 'early') {
                descEl.innerHTML = 'Draw <strong>1</strong> Darkness Spreads card per Night Phase';
            } else if (this.warStatus === 'mid') {
                descEl.innerHTML = 'Draw <strong>2</strong> Darkness Spreads cards per Night Phase<br><span style="font-size: 0.9em; color: #999;">Card 1: Minions + General &nbsp;|&nbsp; Card 2: General only</span>';
            } else {
                descEl.innerHTML = 'Draw <strong>3</strong> Darkness Spreads cards per Night Phase<br><span style="font-size: 0.9em; color: #999;">Cards 1-2: Minions + General &nbsp;|&nbsp; Card 3: General only</span>';
            }
        }
    },
    
    addLog(message) {
        this.gameLog.unshift(message);
        if (this.gameLog.length > 30) this.gameLog.pop();
        
        const logDiv = document.getElementById('game-log');
        logDiv.innerHTML = this.gameLog.map(log => 
            `<div class="log-entry">${log}</div>`
        ).join('');
    },
    
    showSettings() {
        // Sync checkboxes with current state
        const generalColors = ['red', 'green', 'black', 'blue'];
        const anyGeneralDisabled = generalColors.some(c => this.loseConditionsDisabled[`general_monarch_${c}`]);
        document.getElementById('setting-check-general-monarch').checked = !anyGeneralDisabled;
        document.getElementById('setting-check-monarch-minions').checked = !this.loseConditionsDisabled['monarch_minions'];
        document.getElementById('setting-check-taint-crystals').checked = !this.loseConditionsDisabled['taint_crystals'];
        const anyExhaustionDisabled = generalColors.some(c => this.loseConditionsDisabled[`minion_exhausted_${c}`]);
        document.getElementById('setting-check-minion-exhaustion').checked = !anyExhaustionDisabled;
        document.getElementById('setting-check-overruns').checked = !this.overrunsDisabled;
        document.getElementById('setting-check-war-tracker-lock').checked = this.warTrackerLocked;
        document.getElementById('settings-modal').classList.add('active');
    },
    
    confirmSettings() {
        const generalColors = ['red', 'green', 'black', 'blue'];
        const changes = [];
        
        // General Monarch
        const generalMonarchEnabled = document.getElementById('setting-check-general-monarch').checked;
        const wasGeneralDisabled = generalColors.some(c => this.loseConditionsDisabled[`general_monarch_${c}`]);
        if (generalMonarchEnabled && wasGeneralDisabled) {
            generalColors.forEach(c => delete this.loseConditionsDisabled[`general_monarch_${c}`]);
            changes.push('Enabled: General Reaches Monarch City');
        } else if (!generalMonarchEnabled && !wasGeneralDisabled) {
            generalColors.forEach(c => this.loseConditionsDisabled[`general_monarch_${c}`] = true);
            changes.push('Disabled: General Reaches Monarch City');
        }
        
        // Monarch Minions
        const monarchMinionsEnabled = document.getElementById('setting-check-monarch-minions').checked;
        if (monarchMinionsEnabled && this.loseConditionsDisabled['monarch_minions']) {
            delete this.loseConditionsDisabled['monarch_minions'];
            changes.push('Enabled: Monarch City Overrun');
        } else if (!monarchMinionsEnabled && !this.loseConditionsDisabled['monarch_minions']) {
            this.loseConditionsDisabled['monarch_minions'] = true;
            changes.push('Disabled: Monarch City Overrun');
        }
        
        // Taint Crystals
        const taintEnabled = document.getElementById('setting-check-taint-crystals').checked;
        if (taintEnabled && this.loseConditionsDisabled['taint_crystals']) {
            delete this.loseConditionsDisabled['taint_crystals'];
            changes.push('Enabled: 12 Tainted Crystals');
        } else if (!taintEnabled && !this.loseConditionsDisabled['taint_crystals']) {
            this.loseConditionsDisabled['taint_crystals'] = true;
            changes.push('Disabled: 12 Tainted Crystals');
        }
        
        // Minion Exhaustion
        const exhaustionEnabled = document.getElementById('setting-check-minion-exhaustion').checked;
        const wasExhaustionDisabled = generalColors.some(c => this.loseConditionsDisabled[`minion_exhausted_${c}`]);
        if (exhaustionEnabled && wasExhaustionDisabled) {
            generalColors.forEach(c => delete this.loseConditionsDisabled[`minion_exhausted_${c}`]);
            changes.push('Enabled: Minion Exhaustion');
        } else if (!exhaustionEnabled && !wasExhaustionDisabled) {
            generalColors.forEach(c => this.loseConditionsDisabled[`minion_exhausted_${c}`] = true);
            changes.push('Disabled: Minion Exhaustion');
        }
        
        // Overruns
        const overrunsEnabled = document.getElementById('setting-check-overruns').checked;
        if (overrunsEnabled && this.overrunsDisabled) {
            this.overrunsDisabled = false;
            changes.push('Enabled: Overrun Rule');
        } else if (!overrunsEnabled && !this.overrunsDisabled) {
            this.overrunsDisabled = true;
            changes.push('Disabled: Overrun Rule');
        }
        
        // War Tracker Lock
        const warLocked = document.getElementById('setting-check-war-tracker-lock').checked;
        if (warLocked && !this.warTrackerLocked) {
            this.warTrackerLocked = true;
            changes.push('Enabled: War Tracker locked at Early War');
        } else if (!warLocked && this.warTrackerLocked) {
            this.warTrackerLocked = false;
            changes.push('Disabled: War Tracker lock');
        }
        
        // Log changes
        if (changes.length > 0) {
            changes.forEach(c => this.addLog(`⚙️ ${c}`));
        }
        
        document.getElementById('settings-modal').classList.remove('active');
    },
    
    cancelSettings() {
        document.getElementById('settings-modal').classList.remove('active');
    },
    
    showRules() {
        const rulesModal = document.getElementById('rules-modal');
        rulesModal.classList.add('active');
    },
    
    closeRules() {
        const rulesModal = document.getElementById('rules-modal');
        rulesModal.classList.remove('active');
    },
    
    // ==========================================
    // STEP 1 - DAYTIME: Resolve damage
    // ==========================================
    
});
