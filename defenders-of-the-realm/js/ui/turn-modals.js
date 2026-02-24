// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Turn Phase Modals (Day/Evening/Night)
// ═══════════════════════════════════════════════════════════════

Object.assign(game, {
    // ── SHARED MODAL HELPERS ──
    _factionNames: { red: 'Demons', blue: 'Dragonkin', green: 'Orcs', black: 'Undead' },
    _factionIcons: { green: '🪓', black: '💀', red: '🔥', blue: '🐉' },
    _generalColors: { red: '#dc2626', blue: '#3b82f6', green: '#16a34a', black: '#374151', purple: '#7c3aed' },
    _generalIcons: { red: '👹', blue: '🐉', green: '👺', black: '💀' },
    _generalNames: { red: 'Balazarg', blue: 'Sapphire', green: 'Gorgutt', black: 'Varkolak' },
    _heartIcons: { green: '💚', blue: '💙', black: '🖤', red: '❤️' },

    _locationFaction: {
        "Monarch City": "purple", "Dark Woods": "black", "Scorpion Canyon": "red", "Thorny Woods": "green", "Blizzard Mountains": "blue",
        "Father Oak Forest": "green", "Wolf Pass": "blue", "Bounty Bay": "blue", "Orc Valley": "red", "Dancing Stone": "black", "Greenleaf Village": "green",
        "Golden Oak Forest": "green", "Windy Pass": "red", "Sea Bird Port": "black", "Mountains of Mist": "blue",
        "Blood Flats": "red", "Raven Forest": "green", "Pleasant Hill": "red", "Unicorn Forest": "green", "Brookdale Village": "black",
        "Dragon's Teeth Range": "blue", "Amarak Peak": "blue", "Eagle Peak Pass": "blue", "Ghost Marsh": "red",
        "Heaven's Glade": "green", "Ancient Ruins": "red", "Whispering Woods": "green", "McCorm Highlands": "black", "Serpent Swamp": "red",
        "Cursed Plateau": "red", "Rock Bridge Pass": "blue", "Enchanted Glade": "black", "Angel Tear Falls": "black",
        "Fire River": "black", "Mermaid Harbor": "black", "Land of Amazons": "black", "Wyvern Forest": "green", "Crystal Hills": "blue",
        "Minotaur Forest": "green", "Seagaul Lagoon": "blue", "Gryphon Forest": "green", "Withered Hills": "red",
    },
    _generalPaths: {
        black: ["Dark Woods", "Windy Pass", "Sea Bird Port", "Father Oak Forest", "Monarch City"],
        red: ["Scorpion Canyon", "Raven Forest", "Angel Tear Falls", "Bounty Bay", "Monarch City"],
        green: ["Thorny Woods", "Amarak Peak", "Eagle Peak Pass", "Orc Valley", "Monarch City"],
        blue: ["Blizzard Mountains", "Heaven's Glade", "Ancient Ruins", "Greenleaf Village", "Monarch City"],
    },

    _abilityToHiBlock(abilityHTML) {
        if (!abilityHTML) return '';
        const lines = abilityHTML.split(/<br\s*\/?>/i);
        const wrapped = lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '';
            if (/^[•\-]\s*<strong/i.test(trimmed)) {
                return `<div class="hi-sub">${trimmed}</div>`;
            } else if (/^<strong/i.test(trimmed)) {
                return `<div class="hi-title">${trimmed}</div>`;
            } else {
                return `<div class="hi-cont">${trimmed}</div>`;
            }
        }).filter(l => l).join('');
        return wrapped;
    },

    _stepIndicatorHTML(currentStep) {
        const steps = [{ num: 1, icon: '☀️', label: 'Daytime' }, { num: 2, icon: '🌅', label: 'Evening' }, { num: 3, icon: '🌙', label: 'Night' }];
        let html = '<div class="step-indicator-bar">';
        steps.forEach((s, i) => {
            const cls = s.num === currentStep ? 'active' : s.num < currentStep ? 'past' : 'future';
            const icon = s.num < currentStep ? '✓' : s.icon;
            html += `<div class="step-item"><div class="step-badge ${cls}"><span style="font-size:0.9em">${icon}</span><span class="step-label ${cls}">${s.label}</span></div>`;
            if (i < 2) html += `<span class="step-arrow ${cls}">→</span>`;
            html += '</div>';
        });
        html += '</div>';
        return html;
    },

    _parchmentBoxOpen(bannerText) {
        return `<div class="parchment-box"><div class="parchment-banner"><span class="hero-banner-name">${bannerText}</span></div>`;
    },
    _parchmentBoxClose() { return '</div>'; },

    _phaseButtonHTML(label, disabled) {
        return `<button class="phase-btn" ${disabled ? 'disabled' : ''} onclick="game.closeEndOfTurnModal()">${label}</button>`;
    },

    _locationRingHTML(name, color, size, highlight, highlightColor) {
        // Use location's own faction color, falling back to passed color
        const locColor = this._locationFaction[name] || color;
        const gc = this._generalColors[locColor] || '#888';
        const s = size || 60;
        let hlStyle = '';
        if (highlight) {
            const hc = highlightColor || this._generalColors[color] || '#7c3aed';
            hlStyle = `outline:3px solid ${hc};outline-offset:2px;box-shadow:0 2px 6px rgba(0,0,0,0.3),inset 0 0 8px rgba(255,255,255,0.15),0 0 12px ${hc}99;`;
        }
        return `<div class="location-ring" style="width:${s}px;height:${s}px;background:${gc};${hlStyle}">` +
            `<span class="location-ring-name" style="font-size:${s * 0.0082}em">${name}</span></div>`;
    },

    _generalTokenHTML(color) {
        const gc = this._generalColors[color] || '#888';
        const icon = this._generalIcons[color] || '⚔️';
        return `<div class="modal-general-token" style="background:${gc}">${icon}</div>`;
    },

    _minionDotsHTML(color, count) {
        const gc = this._generalColors[color] || '#888';
        let html = '<div style="display:flex;flex-direction:column;align-items:center;gap:3px">';
        for (let i = 0; i < count; i++) html += `<span class="modal-minion-dot" style="background:${gc}"></span>`;
        html += '</div>';
        return html;
    },

    _warningStyleHTML(type) {
        if (type === 'advance' || type === 'monarch') return { border: '#ef4444', bg: 'rgba(239,68,68,0.08)', color: '#b91c1c' };
        if (type === 'overrun') return { border: '#ef4444', bg: 'rgba(239,68,68,0.08)', color: '#b91c1c' };
        if (type === 'taint') return { border: '#9333ea', bg: 'rgba(147,51,234,0.08)', color: '#7e22ce' };
        return { border: '#dc2626', bg: 'rgba(220,38,38,0.08)', color: '#b91c1c' };
    },

    _darknessLocationCardHTML(location, color, count, isGeneral, strikethrough, warnings, militiaCancelled, generalPosition) {
        const gc = this._generalColors[color] || '#888';
        const gn = this._generalNames[color] || 'Unknown';
        const warningsHTML = (warnings || []).map(w => {
            const ws = this._warningStyleHTML(w.type);
            return `<div style="margin-top:4px;padding:2px 6px;border:1px solid ${ws.border};background:${ws.bg};border-radius:3px;font-size:0.75em;color:${ws.color};font-weight:bold;text-align:center;font-family:'Comic Sans MS','Comic Sans',cursive">${w.text}</div>`;
        }).join('');

        if (isGeneral) {
            const isNextLoc = location === 'Next Location';
            let destinationHTML = '';

            if (isNextLoc) {
                const path = this._generalPaths[color] || [];
                const nextIdx = Math.min((generalPosition || 0) + 1, path.length - 1);
                let pathCircles = '';
                path.forEach((loc, li) => {
                    const isTarget = li === nextIdx;
                    const zIdx = isTarget ? path.length + 1 : path.length - li;
                    const ml = li === 0 ? 0 : -12;
                    pathCircles += `<div style="margin-left:${ml}px;z-index:${zIdx};position:relative">${this._locationRingHTML(loc, color, 60, isTarget)}</div>`;
                });
                destinationHTML = `<div style="position:relative;display:flex;flex-direction:column;align-items:center">
                    <div style="display:flex;align-items:center;padding:6px">${pathCircles}</div>
                    <div style="position:absolute;top:100%;margin-top:-2px;white-space:nowrap;font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.8em;color:${gc}">Next Location</div>
                </div>`;
            } else {
                destinationHTML = this._locationRingHTML(location, color, 60);
            }

            return `<div class="darkness-loc-general" style="opacity:${strikethrough ? 0.4 : 1}">
                <div style="display:flex;align-items:center;justify-content:center;gap:8px">
                    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                        ${count > 0 ? this._minionDotsHTML(color, count) : ''}
                        <div style="position:relative;display:flex;flex-direction:column;align-items:center">
                            ${this._generalTokenHTML(color)}
                            <div style="position:absolute;top:100%;margin-top:2px;white-space:nowrap;font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.8em;color:${gc}">${gn}</div>
                        </div>
                    </div>
                    <div style="font-size:2.5em;color:#fff;font-weight:900;-webkit-text-stroke:2px rgba(0,0,0,0.25);text-shadow:0 2px 6px rgba(0,0,0,0.6);line-height:1;flex-shrink:0">→</div>
                    ${destinationHTML}
                </div>
                ${warningsHTML}
            </div>`;
        }

        // Minion placement card
        const skippedLabel = strikethrough && !militiaCancelled ? `<div style="font-family:'Comic Sans MS','Comic Sans',cursive;font-size:0.6em;color:#a16207;margin-top:4px;text-align:center">(skipped)</div>` : '';
        const militiaLabel = militiaCancelled ? `<div style="font-family:'Comic Sans MS','Comic Sans',cursive;font-size:0.6em;color:#15803d;margin-top:4px;text-align:center">🛡️ cancelled</div>` : '';
        return `<div class="darkness-loc-card" style="flex:1 1 120px;max-width:200px;min-width:130px;opacity:${strikethrough ? 0.4 : 1}">
            <div style="display:flex;align-items:center;justify-content:center;gap:10px">
                ${this._minionDotsHTML(color, count)}
                ${this._locationRingHTML(location, color, 60)}
            </div>
            ${skippedLabel}${militiaLabel}
            ${warningsHTML}
        </div>`;
    },

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

        const hadMinions = Object.keys(damageInfo.minions || {}).length > 0 || damageInfo.fearDamage > 0 || damageInfo.fearBlocked || damageInfo.shadowHidden || damageInfo.skyAttackProtected || damageInfo.shapeshiftProtected;
        const borderColor = damageInfo.totalDamage > 0 ? '#dc2626' : '#16a34a';
        const bgColor = damageInfo.totalDamage > 0 ? 'rgba(220,38,38,0.08)' : 'rgba(22,163,74,0.08)';
        const titleColor = damageInfo.totalDamage > 0 ? '#b91c1c' : '#15803d';

        // Build wounds title
        let woundsTitle = 'No Wounds Inflicted';
        if (hadMinions) {
            woundsTitle = damageInfo.totalDamage > 0 ? `💔 Wounds Inflicted: ${damageInfo.totalDamage}` : 'Wounds Inflicted: 0';
        }

        // Build wound details
        let woundDetails = '';
        if (hadMinions) {
            const fNames = this._factionNames;
            if (damageInfo.minionDamage > 0) {
                const minionBreakdown = Object.entries(damageInfo.minions || {}).map(([c,n]) => `${n} ${fNames[c] || c}`).join(', ');
                woundDetails += `<div class="hi-title" style="font-family:'Comic Sans MS','Comic Sans',cursive;font-size:0.75em;color:#3d2b1f;line-height:1.5">⚔️ ${damageInfo.minionDamage} from minions (${minionBreakdown})</div>`;
            }
            if (damageInfo.fearDamage > 0) {
                woundDetails += `<div class="hi-title" style="margin-top:2px;font-family:'Comic Sans MS','Comic Sans',cursive;font-size:0.75em;color:#3d2b1f;line-height:1.5">💀 ${damageInfo.fearDamage} from Undead fear (1 additional wound is inflicted)</div>`;
            }
        }

        // Build ability mitigation lines
        let abilityLines = '';
        if (hadMinions) {
            if (damageInfo.auraReduction > 0) {
                const abilityName = hero.name === 'Dwarf' ? 'Armor and Toughness' : 'Aura of Righteousness';
                abilityLines += `<div class="hi-sub" style="margin-top:3px;font-family:'Comic Sans MS','Comic Sans',cursive;color:#3d2b1f;font-size:0.75em;line-height:1.5">${hero.symbol} <strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a">${abilityName}:</strong> Ignore ${damageInfo.auraReduction} wound from minions and Generals</div>`;
            }
            if (damageInfo.fearBlocked) {
                abilityLines += `<div class="hi-sub" style="margin-top:3px;font-family:'Comic Sans MS','Comic Sans',cursive;color:#3d2b1f;font-size:0.75em;line-height:1.5">${hero.symbol} <strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a">Bravery:</strong> Does not suffer any penalties from fear</div>`;
            }
            if (damageInfo.shadowHidden) {
                abilityLines += `<div class="hi-sub" style="margin-top:3px;font-family:'Comic Sans MS','Comic Sans',cursive;color:#3d2b1f;font-size:0.75em;line-height:1.5">${hero.symbol} <strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a">Hide In The Shadows:</strong> Does not suffer life token loss when in a location with enemy minions</div>`;
            }
            if (damageInfo.skyAttackProtected) {
                abilityLines += `<div class="hi-sub" style="margin-top:3px;font-family:'Comic Sans MS','Comic Sans',cursive;color:#3d2b1f;font-size:0.75em;line-height:1.5">${hero.symbol} <strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a">Sky Attack:</strong> No end-of-turn penalties (fear, damage, or card loss)</div>`;
            }
            if (damageInfo.shapeshiftProtected) {
                const fname = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' }[damageInfo.shapeshiftForm] || damageInfo.shapeshiftForm;
                abilityLines += `<div class="hi-sub" style="margin-top:3px;font-family:'Comic Sans MS','Comic Sans',cursive;color:#3d2b1f;font-size:0.75em;line-height:1.5">${hero.symbol} <strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#1a0f0a">Shape Shifter (${fname} Form):</strong> Avoided ${damageInfo.shapeshiftDamageBlocked || 0} ${fname} wound${(damageInfo.shapeshiftDamageBlocked || 0) !== 1 ? 's' : ''}</div>`;
            }
        }

        // Fresh Mount display
        let freshMountSection = '';
        if (damageInfo.freshMountTriggered) {
            freshMountSection = `
                <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(139,115,85,0.3)">
                    <div class="hero-section-label" style="color:#2c1810;font-size:0.85em;margin-bottom:6px">🦅 Fresh Mount</div>
                    <div style="background:rgba(139,115,85,0.1);border:1px solid rgba(139,115,85,0.3);border-radius:5px;padding:5px 10px">
                        <div style="font-family:'Comic Sans MS','Comic Sans',cursive;font-size:0.75em;color:#3d2b1f;line-height:1.5">
                            Ending turn at ${hero.location} grants <strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#15803d">+1 action</strong> next turn.
                        </div>
                    </div>
                </div>`;
        }

        // Process general healing at end of each player's turn (only once per turn)
        if (!this._daytimeHealingDone) {
            this._daytimeHealingResults = this._processGeneralHealing();
            this._daytimeHealingDone = true;
        }
        const healingResults = this._daytimeHealingResults;
        this.renderGenerals(); // Update panels with new health/wounds

        // Build healing HTML in parchment style
        let healingSection = '';
        if (healingResults && healingResults.filter(r => r.woundType !== null).length > 0) {
            let healingRows = '';
            healingResults.filter(r => r.woundType !== null).forEach(r => {
                const gc = this._generalColors[r.color] || '#888';
                const heartIcon = this._heartIcons[r.color] || '🖤';
                healingRows += `
                    <div style="background:rgba(139,115,85,0.1);border:1px solid rgba(139,115,85,0.3);border-radius:5px;padding:5px 10px;color:#2c1810;margin:4px 0">
                        <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.9em">
                            <span style="display:flex;align-items:center;gap:6px">
                                <span class="modal-general-token" style="background:${gc};width:24px;height:24px;font-size:0.7em">${r.icon || this._generalIcons[r.color] || '⚔️'}</span>
                                <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:${gc}">${r.general}</span>
                            </span>
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:${r.health <= 2 ? '#b91c1c' : '#2c1810'}">${heartIcon} ${r.health}/${r.maxHealth}</span>
                        </div>
                        <div class="hi-title" style="margin-top:4px;font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS','Comic Sans',cursive;color:#3d2b1f">
                            <strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1.15em;color:#1a0f0a">${r.woundType === 'major' ? 'Major Wound' : 'Minor Wound'}:</strong> ${r.description}
                        </div>
                    </div>`;
            });
            healingSection = `
                <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(139,115,85,0.3)">
                    <div class="hero-section-label" style="color:#2c1810;font-size:0.85em;margin-bottom:6px">🖤 General Healing</div>
                    ${healingRows}
                </div>`;
        }

        // Check if Spy In The Camp can be used
        let spyButtonHTML = '';
        const spyHolder = this._findSpyInCampCard();
        const woundedGenerals = this._getWoundedGeneralsForSpy();
        if (spyHolder && woundedGenerals.length > 0 && !this.spyBlockedGeneral) {
            spyButtonHTML = `
                <div style="text-align:center;margin:8px 0">
                    <button class="btn" onclick="game._spyInCampShowPicker()" style="background:rgba(185,28,28,0.3);border:2px solid #b91c1c;color:#f87171;padding:8px 16px;font-size:0.95em">
                        👤 Spy In The Camp (${spyHolder.hero.symbol} ${spyHolder.hero.name})
                    </button>
                </div>`;
        }

        content.innerHTML = `
            ${this._stepIndicatorHTML(1)}
            <div class="modal-heading" style="text-align:center;color:#d4af37;font-size:1.15em;margin-bottom:12px">Step 1 — ☀️ Daytime</div>
            ${this._parchmentBoxOpen('End of Turn')}
                <div>
                    <div class="hero-section-label" style="color:#2c1810;font-size:0.85em;margin-bottom:6px">⚔️ Suffering Wounds</div>
                    <div style="padding:8px 10px;background:${bgColor};border:1px solid ${borderColor};border-radius:6px">
                        <span style="color:${titleColor};font-weight:900;font-family:'Cinzel',Georgia,serif;font-size:0.9em">${woundsTitle}</span>
                        ${woundDetails ? `<div style="margin-top:5px">${woundDetails}</div>` : ''}
                        ${abilityLines ? `<div style="margin-top:5px">${abilityLines}</div>` : ''}
                    </div>
                </div>
                <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(139,115,85,0.3)">
                    <div class="hero-section-label" style="color:#2c1810;font-size:0.85em;margin-bottom:6px">❤️ Hero Life Tokens</div>
                    <div style="background:rgba(139,115,85,0.1);border:1px solid rgba(139,115,85,0.3);border-radius:5px;padding:5px 10px;color:#2c1810;display:flex;justify-content:space-between;align-items:center;font-size:0.9em">
                        <span style="font-family:'Cinzel',Georgia,serif;font-weight:900">${hero.symbol} ${hero.name}</span>
                        <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:${hero.health <= 2 ? '#b91c1c' : '#2c1810'}">❤️ ${hero.health}/${hero.maxHealth}</span>
                    </div>
                </div>
                ${freshMountSection}
                ${healingSection}
                ${spyButtonHTML}
            ${this._parchmentBoxClose()}
        `;

        this._endOfTurnModalMode = 'daytime';
        const endBtn = document.getElementById('end-of-turn-btn');
        if (endBtn) {
            endBtn.textContent = 'End Daytime Phase';
            endBtn.className = 'phase-btn';
        }
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

        const ccMap = {
            blue: { bg: 'rgba(37,99,235,0.12)', border: '#3b82f6', text: '#2563eb' },
            red: { bg: 'rgba(220,38,38,0.12)', border: '#dc2626', text: '#dc2626' },
            green: { bg: 'rgba(22,163,74,0.12)', border: '#16a34a', text: '#16a34a' },
            black: { bg: 'rgba(55,65,81,0.12)', border: '#374151', text: '#374151' },
            any: { bg: 'rgba(109,40,168,0.12)', border: '#6d28a8', text: '#6d28a8' },
        };

        // Determine which cards are bonus cards
        const baseCount = 2;
        const thieveryCount = thieveryBonus ? 1 : 0;
        const questStart = baseCount + thieveryCount;

        const cardsHTML = drawnCards.map((card, idx) => {
            const cc = card.special ? { border: '#6d28a8', text: '#6d28a8' } : (ccMap[card.color] || ccMap.any);
            const isThieveryCard = thieveryBonus && idx === baseCount;
            const isQuestCard = questCardBonus > 0 && idx >= questStart;
            const isBonusCard = isThieveryCard || isQuestCard;
            const bc = isThieveryCard ? '#7c3aed' : isQuestCard ? '#dc2626' : cc.border;
            const shadow = isBonusCard ? `box-shadow:0 0 10px ${isThieveryCard ? 'rgba(124,58,237,0.6)' : 'rgba(220,38,38,0.6)'};` : card.special ? 'box-shadow:0 0 10px rgba(109,40,168,0.5);' : 'box-shadow:0 2px 8px rgba(0,0,0,0.3);';

            let bonusLabel = '';
            if (isThieveryCard) bonusLabel = `<div style="font-size:0.65em;color:#7c3aed;font-weight:bold;font-family:'Cinzel',Georgia,serif">🗡️ THIEVERY</div>`;
            if (isQuestCard) bonusLabel = `<div style="font-size:0.65em;color:#dc2626;font-weight:bold;font-family:'Cinzel',Georgia,serif">📜 ${questCardBonusName || 'QUEST BONUS'}</div>`;

            const iconDisplay = card.special ? '🌟' : (card.icon || '🎴');
            const diceHTML = Array.from({ length: card.dice }).map((_, i) =>
                `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;background:${cc.border};border-radius:3px;font-size:0.7em;border:1.5px solid rgba(0,0,0,0.3)">🎲</span>`
            ).join('');

            return `<div class="card-reveal-anim" style="flex:1 1 120px;max-width:160px;min-width:100px;background:linear-gradient(135deg,#f0e6d3 0%,#ddd0b8 50%,#c8bb9f 100%);border:3px solid ${bc};border-radius:8px;padding:8px 10px;text-align:center;${shadow};animation-delay:${idx * 0.15}s">
                ${bonusLabel}
                <div style="font-size:1.4em;margin-bottom:2px">${iconDisplay}</div>
                <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.72em;color:${cc.text}">${card.name}</div>
                <div style="display:flex;justify-content:center;gap:3px;margin-top:4px">${diceHTML}</div>
            </div>`;
        }).join('');

        content.innerHTML = `
            ${this._stepIndicatorHTML(2)}
            <div class="modal-heading" style="text-align:center;color:#d4af37;font-size:1.15em;margin-bottom:12px">Step 2 — 🌅 Evening</div>
            ${this._parchmentBoxOpen('🎴 Hero Cards Drawn')}
                <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">${cardsHTML}</div>
                <div style="text-align:center;margin-top:10px;padding-top:8px;border-top:1px solid rgba(139,115,85,0.3)">
                    <span style="font-size:0.9em;color:#2c1810;font-family:'Cinzel',Georgia,serif;font-weight:900">🎴 Total Cards: ${hero.cards.length}</span>
                </div>
            ${this._parchmentBoxClose()}
        `;

        this._endOfTurnModalMode = 'evening';
        const endBtn = document.getElementById('end-of-turn-btn');
        if (endBtn) {
            endBtn.textContent = 'End Evening Phase';
            endBtn.className = 'phase-btn';
        }
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

        const ccMap = {
            blue: { border: '#3b82f6', text: '#2563eb' },
            red: { border: '#dc2626', text: '#dc2626' },
            green: { border: '#16a34a', text: '#16a34a' },
            black: { border: '#374151', text: '#374151' },
            any: { border: '#6d28a8', text: '#6d28a8' },
        };

        let cardsHTML = '';
        hero.cards.forEach((card, index) => {
            const cc = card.special ? { border: '#6d28a8', text: '#6d28a8' } : (ccMap[card.color] || ccMap.any);
            const iconDisplay = card.special ? '🌟' : (card.icon || '🎴');
            const shadow = card.special ? 'box-shadow:0 0 8px rgba(109,40,168,0.4);' : 'box-shadow:0 2px 6px rgba(0,0,0,0.3);';
            const diceHTML = Array.from({ length: card.dice }).map((_, i) =>
                `<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:${cc.border};border-radius:3px;font-size:0.65em;border:1.5px solid rgba(0,0,0,0.3)">🎲</span>`
            ).join('');

            cardsHTML += `
                <div id="hand-limit-card-${index}" onclick="game.toggleHandLimitCard(${index})"
                     style="flex:1 1 90px;max-width:120px;min-width:80px;background:linear-gradient(135deg,#f0e6d3 0%,#ddd0b8 50%,#c8bb9f 100%);border:3px solid ${cc.border};border-radius:8px;padding:8px 6px;text-align:center;cursor:pointer;position:relative;transition:all 0.2s;${shadow}">
                    <div style="font-size:1.2em;margin-bottom:2px">${iconDisplay}</div>
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.62em;color:${cc.text};line-height:1.2">${card.name}</div>
                    <div style="display:flex;justify-content:center;gap:2px;margin-top:4px">${diceHTML}</div>
                    <div id="hand-limit-check-${index}" style="display:none;position:absolute;top:-8px;right:-8px;background:#dc2626;border-radius:50%;width:22px;height:22px;display:none;align-items:center;justify-content:center;font-size:13px;color:#fff;font-weight:bold;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.4)">✕</div>
                </div>`;
        });

        content.innerHTML = `
            ${this._stepIndicatorHTML(2)}
            <div class="modal-heading" style="text-align:center;color:#d4af37;font-size:1.15em;margin-bottom:12px">✋ Hand Limit Exceeded</div>
            ${this._parchmentBoxOpen(`Select ${excessCards} more card${excessCards !== 1 ? 's' : ''} to discard`)}
                <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
                    ${cardsHTML}
                </div>
                <div style="text-align:center;margin-top:10px;padding-top:8px;border-top:1px solid rgba(139,115,85,0.3)">
                    <span style="font-size:0.82em;color:#2c1810;font-family:'Cinzel',Georgia,serif;font-weight:900">🎴 ${hero.cards.length} cards (limit: 10)</span>
                </div>
            ${this._parchmentBoxClose()}
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
            if (checkEl) { checkEl.style.display = 'none'; }
            if (cardEl) {
                cardEl.style.opacity = '1';
                cardEl.style.transform = 'scale(1)';
                cardEl.style.borderColor = '';
            }
        } else {
            // Don't allow selecting more than required
            if (this.handLimitSelectedCards.size >= this.handLimitRequired) {
                return;
            }
            this.handLimitSelectedCards.add(index);
            if (checkEl) { checkEl.style.display = 'flex'; }
            if (cardEl) {
                cardEl.style.opacity = '0.45';
                cardEl.style.transform = 'scale(0.93)';
                cardEl.style.borderColor = '#dc2626';
            }
        }

        // Update remaining count and banner
        const remaining = this.handLimitRequired - this.handLimitSelectedCards.size;
        const bannerEl = document.querySelector('.parchment-banner .hero-banner-name');
        if (bannerEl) {
            bannerEl.textContent = remaining > 0
                ? `Select ${remaining} more card${remaining !== 1 ? 's' : ''} to discard`
                : '✓ Ready to discard!';
        }

        // Enable/disable confirm button - exactly the required number
        const confirmBtn = document.getElementById('hand-limit-confirm-btn');
        if (confirmBtn) {
            const excess = this.handLimitRequired;
            if (this.handLimitSelectedCards.size === excess) {
                confirmBtn.disabled = false;
                confirmBtn.className = 'phase-btn';
                confirmBtn.style.opacity = '1';
                confirmBtn.textContent = `✓ Discard ${excess} Cards`;
            } else {
                confirmBtn.disabled = true;
                confirmBtn.className = 'phase-btn';
                confirmBtn.style.opacity = '0.5';
                confirmBtn.textContent = `Discard ${this.handLimitSelectedCards.size}/${excess} Cards`;
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
                ${this._stepIndicatorHTML(3)}
                <div class="modal-heading" style="text-align:center;color:#d4af37;font-size:1.15em;margin-bottom:12px">Step 3 — 🌙 Night</div>
                ${this._parchmentBoxOpen('Darkness Spreads')}
                    <div style="padding:15px;text-align:center">
                        <div style="font-size:1.2em;color:#6d28a8;font-weight:bold;font-family:'Cinzel',Georgia,serif">🌅 All Is Quiet</div>
                        <div style="color:#3d2b1f;margin-top:8px;font-size:0.75em;font-family:'Comic Sans MS','Comic Sans',cursive">No Darkness Spreads cards drawn this turn.</div>
                        <div style="color:#3d2b1f;margin-top:5px;font-size:0.75em;font-family:'Comic Sans MS','Comic Sans',cursive">The land rests easy tonight.</div>
                    </div>
                ${this._parchmentBoxClose()}
            `;

            if (btn) {
                btn.textContent = 'Continue';
                btn.className = 'phase-btn';
            }

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
                // Skip zero-count spawns — the taint/overrun event that follows explains what happened
                if (event.count === 0) return;
                const fName = this._factionNames[event.color] || event.color;
                const displayCount = event.count;
                html += `
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid ${this.getGeneralColor(event.color)}; background: rgba(0,0,0,0.3); border-radius: 3px;">
                        <strong style="${colorStyle}">${event.general}:</strong> ${displayCount} ${fName} minion${displayCount > 1 ? 's' : ''} → <strong>${event.location}</strong>
                    </div>
                `;
            } else if (event.type === 'taint') {
                const fName = this._factionNames[event.color] || event.color;
                const reasonText = event.reason ? `<br><span style="font-size: 0.85em; color: #fbbf24;">(${event.reason})</span>` : '';
                const notPlaced = event.wouldBeMinions - event.minionsPlaced;
                const placedText = event.minionsPlaced > 0 
                    ? `${event.minionsPlaced} ${fName} minion${event.minionsPlaced !== 1 ? 's' : ''} placed` 
                    : '';
                const notPlacedText = notPlaced > 0 
                    ? `${notPlaced} ${fName} minion${notPlaced !== 1 ? 's' : ''} <span style="color: #ef4444; font-weight: bold;">NOT placed</span>` 
                    : '';
                const minionSummary = [placedText, notPlacedText].filter(Boolean).join(', ');
                html += `
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid #9333ea; background: rgba(147,51,234,0.2); border-radius: 3px;">
                        <strong style="${colorStyle}">${event.general}:</strong> ${minionSummary} → <strong>${event.location}</strong>${reasonText}<br>
                        <strong style="color: #9333ea;">Taint Crystal placed!</strong>
                    </div>
                `;
            } else if (event.type === 'overrun') {
                const fName = this._factionNames[event.color] || event.color;
                let overrunInner = '';
                if (event.sourceTaint) {
                    const st = event.sourceTaint;
                    const stFName = this._factionNames[st.color] || st.color;
                    const notPlaced = st.wouldBeMinions - st.minionsPlaced;
                    const placedText = st.minionsPlaced > 0 
                        ? `${st.minionsPlaced} ${stFName} minion${st.minionsPlaced !== 1 ? 's' : ''} placed` 
                        : '';
                    const notPlacedText = notPlaced > 0 
                        ? `${notPlaced} ${stFName} minion${notPlaced !== 1 ? 's' : ''} <span style="color: #ef4444; font-weight: bold;">NOT placed</span>` 
                        : '';
                    const minionSummary = [placedText, notPlacedText].filter(Boolean).join(', ');
                    const reasonText = st.reason ? `<br><span style="font-size: 0.85em; color: #fbbf24;">(${st.reason})</span>` : '';
                    overrunInner += `
                        <div style="padding: 8px; margin: 5px 0; border-left: 3px solid #9333ea; background: rgba(147,51,234,0.2); border-radius: 3px;">
                            <strong style="${colorStyle}">${st.general}:</strong> ${minionSummary} → <strong>${st.location}</strong>${reasonText}<br>
                            <strong style="color: #9333ea;">Taint Crystal placed!</strong>
                        </div>
                    `;
                }
                event.spread.forEach(s => {
                    const sFName = this._factionNames[s.color] || s.color;
                    if (s.addedMinion && !s.addedTaint) {
                        overrunInner += `
                            <div style="padding: 8px; margin: 5px 0; border-left: 3px solid ${this.getGeneralColor(s.color)}; background: rgba(0,0,0,0.3); border-radius: 3px;">
                                <strong style="${colorStyle}">${event.general}:</strong> 1 ${sFName} minion → <strong>${s.location}</strong>
                            </div>
                        `;
                    } else if (s.addedTaint) {
                        const notPlacedText = `1 ${sFName} minion <span style="color: #ef4444; font-weight: bold;">NOT placed</span>`;
                        overrunInner += `
                            <div style="padding: 8px; margin: 5px 0; border-left: 3px solid #9333ea; background: rgba(147,51,234,0.2); border-radius: 3px;">
                                <strong style="${colorStyle}">${event.general}:</strong> ${notPlacedText} → <strong>${s.location}</strong>
                                <br><span style="font-size: 0.85em; color: #fbbf24;">(location at max (3 minions))</span><br>
                                <strong style="color: #9333ea;">Taint Crystal placed!</strong>
                            </div>
                        `;
                    }
                });
                html += `
                    <div style="padding: 10px; margin: 5px 0; border: 2px solid #ef4444; background: rgba(239,68,68,0.1); border-radius: 5px;">
                        <strong style="color: #ef4444; font-size: 1em;">OVERRUN at ${event.sourceLocation}!</strong>
                        <div style="font-size: 0.85em; color: #fbbf24; margin: 3px 0 8px 0;">${event.general} minions spread to connected locations</div>
                        ${overrunInner}
                    </div>
                `;
            } else if (event.type === 'advance' || event.type === 'general_move') {
                const cardText = event.isWildCard ? 'Next Location' : event.to;
                const wildCardNote = event.isWildCard ? '<br><span style="font-size: 0.85em; color: #fbbf24;">(advances along colored path)</span>' : '';
                html += `
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid ${this.getGeneralColor(event.color)}; background: rgba(220,38,38,0.2); border-radius: 3px;">
                        <strong style="${colorStyle}; font-size: 1em;">${event.general}:</strong> ${event.minionCount || 0} minion${(event.minionCount || 0) !== 1 ? 's' : ''} → <strong>${cardText}</strong>${wildCardNote}<br>
                        <strong style="color: #4ade80; font-size: 1em;">✓ GENERAL ADVANCES</strong> (${event.from} → ${event.to})
                    </div>
                `;
            } else if (event.type === 'monarch_city_reached') {
                html += `
                    <div style="padding: 8px; margin: 5px 0; border: 3px solid #dc2626; background: rgba(220,38,38,0.4); border-radius: 3px;">
                        <strong style="${colorStyle}; font-size: 1em;">${event.general}:</strong> ${event.minionCount || 0} minion${(event.minionCount || 0) !== 1 ? 's' : ''} → <strong>Monarch City</strong><br>
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

                // Build corner minion tokens for placed colors
                const minionPositions = [
                    { color: 'black', pos: 'top:-6px;left:-6px' },
                    { color: 'green', pos: 'top:-6px;right:-6px' },
                    { color: 'red', pos: 'bottom:-6px;left:-6px' },
                    { color: 'blue', pos: 'bottom:-6px;right:-6px' }
                ];
                let cornerTokens = '';
                minionPositions.forEach(p => {
                    if ((event.colorsPlaced || []).includes(p.color)) {
                        cornerTokens += `<div style="position:absolute;${p.pos}"><span style="display:inline-block;width:16px;height:16px;background:${factionColors[p.color]};border-radius:50%;border:1.5px solid rgba(0,0,0,0.3);box-shadow:0 1px 2px rgba(0,0,0,0.3)"></span></div>`;
                    }
                });

                // Build minion placement lines
                let colorLines = '';
                if (event.colorsPlaced.length === 0) {
                    colorLines = `<div style="color:#15803d;padding:4px 0;font-family:'Comic Sans MS','Comic Sans',cursive;font-size:0.75em">No minions adjacent — nothing placed</div>`;
                } else {
                    event.colorsPlaced.forEach(color => {
                        colorLines += `<div style="color:${factionColors[color]};padding:2px 0;font-family:'Comic Sans MS','Comic Sans',cursive;font-size:0.75em">${factionIcons[color]} +1 ${factionNames[color]} minion → Monarch City</div>`;
                    });
                }

                html += `
                    <div style="text-align:center;font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:2.2em;color:#7c3aed;margin-bottom:8px">Monarch City</div>
                    <div style="display:flex;align-items:center;margin-bottom:8px">
                        <div style="flex:1;display:flex;justify-content:center">
                            <div style="position:relative;display:inline-block">
                                ${this._locationRingHTML('Monarch City', 'purple', 80)}
                                ${cornerTokens}
                            </div>
                        </div>
                        <div style="flex:1;display:flex;flex-direction:column;align-items:center;text-align:center">
                            <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;color:#dc2626;margin-bottom:4px">Special</div>
                            <div style="font-family:'Comic Sans MS','Comic Sans',cursive;font-size:0.75em;color:#3d2b1f;line-height:1.5;margin-bottom:6px">Place 1 minion of each color that has minions adjacent to Monarch City</div>
                            <div style="font-family:'Comic Sans MS','Comic Sans',cursive;font-size:0.75em;color:#dc2626;line-height:1.4">No Overrun Can Occur</div>
                        </div>
                    </div>
                    <div style="margin-top:12px;padding-top:12px;border-top:2px solid rgba(139,115,85,0.4)">
                        <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#2c1810;font-size:0.85em;margin-bottom:6px">Minion Placement</div>
                        <div style="background:rgba(139,115,85,0.1);border:1px solid rgba(139,115,85,0.3);border-radius:5px;padding:5px 10px">
                            ${colorLines}
                        </div>
                    </div>
                `;
            } else if (event.type === 'deck_reshuffle') {
                html += `
                    <div style="text-align:center;font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1.9em;color:#7c3aed;margin-top:8px;margin-bottom:2px">Reshuffle All Decks</div>
                `;
            } else if (event.type === 'no_generals') {
                html += `
                    <div style="text-align:center;font-family:'Comic Sans MS','Comic Sans',cursive;font-size:0.75em;color:#dc2626;margin-bottom:6px">No Generals Move</div>
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
