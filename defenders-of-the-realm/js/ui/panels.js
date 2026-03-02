// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - UI Panels, Buttons & Map Modal
// ═══════════════════════════════════════════════════════════════

Object.assign(game, {
    showMap() {
        document.getElementById('map-modal').classList.add('active');
        this._fixMobileViewportHeight();
        this.renderMap();
        this.renderTokens();
        this.updateMapStatus();
        this.updateMovementButtons();
            this.updateActionButtons();
        
        // Show pulse on current active hero for 10 seconds
        this.showCurrentHeroPulse();
        
        // Initialize pan and zoom if not already done
        if (!this.mapPanZoomInitialized) {
            this.initializeMapPanZoom();
            this.mapPanZoomInitialized = true;
        }
    },
    
    _fixMobileViewportHeight() {
        // Mobile browsers: window.innerHeight = actual visible height
        const setVh = () => {
            const modal = document.querySelector('#map-modal .modal-content');
            if (modal && window.innerWidth <= 700) {
                // Account for #map-modal padding (4px*2) + border (2px*2)
                const available = window.innerHeight - 12;
                modal.style.height = available + 'px';
                modal.style.maxHeight = available + 'px';
            }
        };
        setVh();
        if (!this._vhListenerAdded) {
            window.addEventListener('resize', setVh);
            window.addEventListener('orientationchange', () => setTimeout(setVh, 100));
            this._vhListenerAdded = true;
        }
    },
    
    initializeMapPanZoom() {
        const container = document.getElementById('board-container');
        const svg = document.getElementById('game-map');
        const tooltip = document.getElementById('hover-tooltip');
        
        let scale = 1;
        let translateX = 0;
        let translateY = 0;
        let isPanning = false;
        let startX = 0;
        let startY = 0;
        let lastTouchDistance = 0;
        let lastMouseEvent = null;
        
        const updateTransform = () => {
            svg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            
            // Update tooltip position if it's open and we have the last event
            if (tooltip.classList.contains('active') && lastMouseEvent) {
                this.updateTooltipPosition(lastMouseEvent);
            }
        };
        
        // Mouse wheel zoom
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.max(0.5, Math.min(3, scale * delta));
            
            // Zoom towards mouse position
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const scaleChange = newScale / scale;
            translateX = mouseX - (mouseX - translateX) * scaleChange;
            translateY = mouseY - (mouseY - translateY) * scaleChange;
            
            scale = newScale;
            lastMouseEvent = e;
            updateTransform();
        });
        
        // Mouse pan
        container.addEventListener('mousedown', (e) => {
            // Don't pan if clicking on interactive SVG elements (locations, tokens, etc.)
            // Allow pan on: svg itself, container, background image, path lines, non-interactive elements
            const isInteractive = e.target.closest('.location-marker, .location-highlight, [data-hero], [data-general]');
            if (isInteractive) return;
            
            isPanning = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            container.style.cursor = 'grabbing';
        });
        
        window.addEventListener('mousemove', (e) => {
            if (!isPanning) return;
            e.preventDefault();
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            lastMouseEvent = e;
            updateTransform();
        });
        
        window.addEventListener('mouseup', () => {
            if (isPanning) {
                isPanning = false;
                container.style.cursor = 'grab';
            }
        });
        
        // Touch pan
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                // Single touch - pan
                isPanning = true;
                startX = e.touches[0].clientX - translateX;
                startY = e.touches[0].clientY - translateY;
                
                // Store as mouse event for tooltip positioning
                lastMouseEvent = {
                    clientX: e.touches[0].clientX,
                    clientY: e.touches[0].clientY
                };
            } else if (e.touches.length === 2) {
                // Two touches - prepare for pinch zoom
                isPanning = false;
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
            }
        });
        
        container.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1 && isPanning) {
                // Single touch pan
                translateX = e.touches[0].clientX - startX;
                translateY = e.touches[0].clientY - startY;
                
                lastMouseEvent = {
                    clientX: e.touches[0].clientX,
                    clientY: e.touches[0].clientY
                };
                
                updateTransform();
            } else if (e.touches.length === 2) {
                // Pinch zoom
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (lastTouchDistance > 0) {
                    const delta = distance / lastTouchDistance;
                    const newScale = Math.max(0.5, Math.min(3, scale * delta));
                    
                    // Zoom towards center of pinch
                    const rect = container.getBoundingClientRect();
                    const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
                    const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
                    
                    const scaleChange = newScale / scale;
                    translateX = centerX - (centerX - translateX) * scaleChange;
                    translateY = centerY - (centerY - translateY) * scaleChange;
                    
                    scale = newScale;
                    
                    lastMouseEvent = {
                        clientX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                        clientY: (e.touches[0].clientY + e.touches[1].clientY) / 2
                    };
                    
                    updateTransform();
                }
                
                lastTouchDistance = distance;
            }
        }, { passive: false });
        
        container.addEventListener('touchend', (e) => {
            if (e.touches.length === 0) {
                isPanning = false;
                lastTouchDistance = 0;
            } else if (e.touches.length === 1) {
                // Back to single touch - reset pan
                startX = e.touches[0].clientX - translateX;
                startY = e.touches[0].clientY - translateY;
                isPanning = true;
                lastTouchDistance = 0;
            }
        });
        
        // Prevent zoom/pan events from firing when interacting with tooltip
        if (tooltip) {
            tooltip.addEventListener('wheel', (e) => { e.stopPropagation(); }, { passive: false });
            tooltip.addEventListener('mousedown', (e) => { e.stopPropagation(); });
            tooltip.addEventListener('touchstart', (e) => { e.stopPropagation(); }, { passive: false });
            tooltip.addEventListener('touchmove', (e) => { e.stopPropagation(); }, { passive: false });
        }
    },
    
    resetMapZoom() {
        const svg = document.getElementById('game-map');
        if (svg) {
            svg.style.transform = 'translate(0px, 0px) scale(1)';
        }
    },
    
    onHeroTrayClick(event) {
        const hero = this.heroes[this.currentPlayerIndex];
        if (!hero) return;

        // Open the hero details modal for the active hero
        this.showHeroDetail(this.currentPlayerIndex);
    },
    
    pulseHeroToken(heroIndex) {
        const heroTokenSvg = document.querySelector(`.hero-token-svg[data-hero-index="${heroIndex}"]`);
        if (!heroTokenSvg) return;
        
        const circle = heroTokenSvg.querySelector('circle');
        if (!circle) return;
        
        const effectsLayer = document.getElementById('effects-layer');
        if (!effectsLayer) return;
        
        // Remove any existing pulse from hero tray click
        const existing = effectsLayer.querySelector('.hero-tray-pulse');
        if (existing) existing.remove();
        
        const cx = parseFloat(circle.getAttribute('cx'));
        const cy = parseFloat(circle.getAttribute('cy'));
        
        // Same style as showCurrentHeroPulse
        const pulseCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pulseCircle.setAttribute('class', 'hero-tray-pulse');
        pulseCircle.setAttribute('cx', cx);
        pulseCircle.setAttribute('cy', cy);
        pulseCircle.setAttribute('r', '25');
        pulseCircle.setAttribute('fill', 'none');
        pulseCircle.setAttribute('stroke', '#ffd700');
        pulseCircle.setAttribute('stroke-width', '5');
        pulseCircle.setAttribute('opacity', '0.9');
        pulseCircle.setAttribute('pointer-events', 'none');
        pulseCircle.style.animation = 'pulse-ring 1.5s ease-out infinite';
        
        effectsLayer.appendChild(pulseCircle);
        
        // Remove after 5 seconds
        setTimeout(() => pulseCircle.remove(), 5000);
    },
    
    showMapForMove() {
        this.showMap();
    },
    
    updateMapStatus() {
        const mapModal = document.getElementById('map-modal');
        if (!mapModal || !mapModal.classList.contains('active')) {
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        
        // Re-enable end turn button
        const endTurnBtn = document.getElementById('map-end-turn-btn');
        if (endTurnBtn) {
            endTurnBtn.disabled = false;
        }
        
        // Update token positions
        this.renderTokens();
        
        // Update overlay panels
        this.renderTurnTracker();
        this.renderHeroOverlay();
        this.renderMinionTracker();
    },

    
    renderTurnTracker() {
        const container = document.getElementById('map-turn-tracker');
        if (!container) return;
        
        let html = '';
        for (let i = 0; i < this.heroes.length; i++) {
            const h = this.heroes[i];
            const isActive = i === this.currentPlayerIndex;
            html += `<div class="turn-hero${isActive ? ' active' : ''}" onclick="game.showHeroesModal()" style="cursor:pointer;" title="View Heroes">${h.symbol} <span class="hero-label-name">${h.name}</span></div>`;
        }
        container.innerHTML = html;
    },
    
    renderHeroOverlay() {
        const container = document.getElementById('map-hero-overlay');
        if (!container) return;
        
        const hero = this.heroes[this.currentPlayerIndex];
        if (!hero) return;
        
        // Build hero name with special status
        let nameExtra = '';
        if (hero.name === 'Eagle Rider' && this.eagleRiderAttackStyle) {
            const isSky = this.eagleRiderAttackStyle === 'sky';
            nameExtra = ` <span title="${isSky ? 'Sky Attack' : 'Ground Attack'}" style="cursor: help;">(${isSky ? '☁️' : '⚔️'})</span>`;
        } else if (hero.name === 'Sorceress' && this.shapeshiftForm) {
            const sfNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
            const sfColors = { green: '#16a34a', black: '#1f2937', red: '#dc2626', blue: '#2563eb' };
            nameExtra = ` <span title="${sfNames[this.shapeshiftForm]} Form" style="cursor: help;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${sfColors[this.shapeshiftForm]};border:1px solid #000;vertical-align:middle;"></span></span>`;
        }
        
        // Health icons
        let healthIcons = '';
        for (let i = 0; i < hero.maxHealth; i++) {
            if (i < hero.health) {
                healthIcons += '<span title="Life token">❤️</span>';
            } else {
                healthIcons += '<span class="ic-off" title="Lost life token">❤️</span>';
            }
        }
        
        // Action icons
        const questActionBonus = this._getQuestActionBonus(hero);
        const baseMax = hero.health + questActionBonus;
        const maxActions = Math.max(baseMax, this.actionsRemaining);
        let actionIcons = '';
        for (let i = 0; i < maxActions; i++) {
            if (i < this.actionsRemaining) {
                if (i >= hero.health && i < hero.health + questActionBonus) {
                    actionIcons += '<span title="Bonus action (Boots of Speed)" style="filter: hue-rotate(300deg);">⚡</span>';
                } else if (i >= hero.health + questActionBonus) {
                    const bonusSource = hero.name === 'Eagle Rider' ? 'Fresh Mount' : hero.name === 'Dwarf' ? 'Mountain Lore' : 'Bonus';
                    actionIcons += `<span title="Bonus action (${bonusSource})" style="filter: hue-rotate(180deg);">⚡</span>`;
                } else {
                    actionIcons += '<span title="Action available">⚡</span>';
                }
            } else {
                actionIcons += '<span class="ic-off" title="Action spent">⚡</span>';
            }
        }
        
        container.innerHTML = `
            <div class="hero-name" onclick="game.onHeroTrayClick(event)" title="Click to view hero details">${hero.symbol} <span class="hero-label-name">${hero.name}${nameExtra}</span></div>
            <div class="hero-stats">
                <div class="stat-row health-row">
                    <div class="stat-icons">${healthIcons}</div>
                    <span class="stat-compact">❤️ ${hero.health}/${hero.maxHealth}</span>
                </div>
                <div class="stat-row actions-row">
                    <div class="stat-icons">${actionIcons}</div>
                    <span class="stat-compact">⚡ ${this.actionsRemaining}/${maxActions}</span>
                </div>
            </div>
        `;
    },

    
    getTooltipLifeTokensHTML(hero) {
        let html = '<span style="color: #ffd700; font-weight: bold;">Life Tokens:</span> ';
        for (let i = 0; i < hero.maxHealth; i++) {
            if (i < hero.health) {
                html += '<span style="font-size: 1.1em;">❤️</span>';
            } else {
                html += '<span style="font-size: 1.1em; opacity: 0.3; filter: grayscale(100%);">❤️</span>';
            }
        }
        return html;
    },
    
    getTooltipActionsHTML(hero) {
        const isCurrentHero = this.currentPlayerIndex === this.heroes.indexOf(hero);
        const questBonus = this._getQuestActionBonus(hero);
        const currentActions = isCurrentHero ? this.actionsRemaining : (hero.health + questBonus);
        const maxActions = isCurrentHero ? Math.max(hero.health + questBonus, this.actionsRemaining) : (hero.health + questBonus);
        let html = '<span style="color: #ffd700; font-weight: bold;">Actions:</span> ';
        for (let i = 0; i < maxActions; i++) {
            if (i < currentActions) {
                if (i >= hero.health) {
                    // Bonus action from ability
                    const bonusSource = hero.name === 'Eagle Rider' ? 'Fresh Mount' : hero.name === 'Dwarf' ? 'Mountain Lore' : 'Bonus';
                    html += `<span style="font-size: 1.1em; filter: hue-rotate(180deg);" title="Bonus action (${bonusSource})">⚡</span>`;
                } else {
                    html += '<span style="font-size: 1.1em;">⚡</span>';
                }
            } else {
                html += '<span style="font-size: 1.1em; opacity: 0.3; filter: grayscale(100%);">⚡</span>';
            }
        }
        return html;
    },
    
    getTooltipCardsHTML(hero) {
        let html = '<span style="color: #ffd700; font-weight: bold;">Cards:</span> ';
        for (let i = 0; i < hero.cards.length; i++) {
            html += '<span style="font-size: 1.1em;">🎴</span>';
        }
        if (hero.cards.length === 0) {
            html += '<span style="color: #999; font-style: italic;">None</span>';
        }
        return html;
    },
    
    getGeneralLifeTokensHTML(general) {
        let html = '<span style="color: #ffd700; font-weight: bold;">Life Tokens:</span> ';
        for (let i = 0; i < general.maxHealth; i++) {
            if (i < general.health) {
                html += '<span style="font-size: 1.1em;">❤️</span>';
            } else {
                html += '<span style="font-size: 1.1em; opacity: 0.3; filter: grayscale(100%);">❤️</span>';
            }
        }
        return html;
    },
    
    getGeneralCombatSkillDesc(general) {
        const skills = {
            'demonic_curse': 'Players must roll a die for each card to be played prior to the Battle. Discard a card for each 1 rolled.',
            'parry': 'Gorgutt parries successful attacks for each 1 rolled. Eliminate 1 hit for each die with a 1 at the end of re-rolls.',
            'no_rerolls': 'Player may not use any re-rolls or special skills against Varkolak.',
            'regeneration': 'Returns to full health if not defeated in a single combat.'
        };
        return skills[general.combatSkill] || 'None';
    },
    
    getGeneralPenaltyDesc(general) {
        const penalties = {
            'Balazarg': 'Hero loses D3 life tokens & ALL hero cards',
            'Gorgutt': 'Hero loses 2 life tokens & 2 hero cards',
            'Varkolak': 'Hero loses D6 life tokens & D6 hero cards',
            'Sapphire': 'Hero loses 3 life tokens & D6 hero cards',
            'White Rabbit': 'Hero loses 2 life tokens & 2 hero cards'
        };
        return penalties[general.name] || 'None';
    },
    
    renderMinionTracker() {
        const container = document.getElementById('map-minion-tracker');
        if (!container) return;
        
        const factions = [
            { color: 'red', name: 'Demons', symbol: '👹', css: '#dc2626' },
            { color: 'green', name: 'Orcs', symbol: '👺', css: '#16a34a' },
            { color: 'black', name: 'Undead', symbol: '💀', css: '#a0a0a0' },
            { color: 'blue', name: 'Dragonkin', symbol: '🐉', css: '#2563eb' }
        ];
        
        const getMinionCountColor = (count) => {
            if (count >= 20) return '#ef4444';
            if (count >= 13) return '#b8860b';
            return '#f4e4c1';
        };
        
        let html = '';
        for (const faction of factions) {
            let count = 0;
            for (const loc in this.minions) {
                if (this.minions[loc] && this.minions[loc][faction.color]) {
                    count += this.minions[loc][faction.color];
                }
            }
            const countColor = getMinionCountColor(count);
            html += `<div class="t-row"><span class="t-faction" style="color: ${faction.css};">${faction.name}</span><span class="t-faction-icon">${faction.symbol}</span><span class="t-count" style="color: ${countColor};">${count}/25</span></div>`;
        }
        
        // Taint Crystals
        let placed = 0;
        for (const loc in this.taintCrystals) {
            if (this.taintCrystals[loc]) {
                placed += this.taintCrystals[loc];
            }
        }
        const total = 12;
        const taintColor = placed >= 10 ? '#ef4444' : placed >= 7 ? '#b8860b' : '#f4e4c1';
        html += `<div class="t-row"><span class="t-faction taint-label" style="color: #9333ea;">Taint Crystals</span><span class="t-faction-icon">💎</span><span class="t-count" style="color: ${taintColor};">${placed}/${total}</span></div>`;
        
        container.innerHTML = html;
    },

    
    updateMovementButtons() {
        const hero = this.heroes[this.currentPlayerIndex];
        const hasActions = this.actionsRemaining > 0;
        
        // Check if hero has each card type
        const hasMagicGate = hero.cards.some(card => card.type === 'Magic Gate');
        const hasHorse = hero.cards.some(card => card.type === 'Horse');
        const hasEagle = hero.cards.some(card => card.type === 'Eagle');
        
        console.log('[BUTTONS] Updating movement buttons');
        console.log('[BUTTONS] Has actions:', hasActions);
        console.log('[BUTTONS] Has Magic Gate:', hasMagicGate);
        console.log('[BUTTONS] Has Horse:', hasHorse);
        console.log('[BUTTONS] Has Eagle:', hasEagle);
        console.log('[BUTTONS] Hero cards:', hero.cards.map(c => c.type));
        
        // Update Foot button (only requires actions, no card needed)
        const footBtn = document.getElementById('foot-movement-btn');
        console.log('[BUTTONS] Foot button found:', !!footBtn);
        if (footBtn) {
            if (hasActions) {
                footBtn.disabled = false;
                footBtn.className = 'phase-btn';
                footBtn.style.background = '';
            } else {
                footBtn.disabled = true;
                footBtn.className = 'phase-btn';
            }
        }
        
        // Update Magic Gate button
        const magicGateBtn = document.getElementById('magic-gate-btn');
        console.log('[BUTTONS] Magic Gate button found:', !!magicGateBtn);
        if (magicGateBtn) {
            // Can use if has magic gate cards OR is standing on a gate with other gates available
            const heroLocationData = this.locationCoords[hero.location];
            const isOnGate = heroLocationData && heroLocationData.magicGate;
            const otherGatesExist = isOnGate && Object.entries(this.locationCoords).some(
                ([name, coords]) => coords.magicGate && name !== hero.location
            );
            const shouldEnable = hasActions && (hasMagicGate || otherGatesExist);
            console.log('[BUTTONS] Magic Gate should enable:', shouldEnable);
            if (shouldEnable) {
                magicGateBtn.disabled = false;
                magicGateBtn.className = 'phase-btn';
                magicGateBtn.style.background = '';
            } else {
                magicGateBtn.disabled = true;
                magicGateBtn.className = 'phase-btn';
            }
        }
        
        // Update Horse button
        const horseBtn = document.getElementById('horse-btn');
        console.log('[BUTTONS] Horse button found:', !!horseBtn);
        if (horseBtn) {
            const shouldEnable = hasHorse && hasActions;
            console.log('[BUTTONS] Horse should enable:', shouldEnable);
            if (shouldEnable) {
                horseBtn.disabled = false;
                horseBtn.className = 'phase-btn';
                horseBtn.style.background = '';
            } else {
                horseBtn.disabled = true;
                horseBtn.className = 'phase-btn';
            }
        }
        
        // Update Eagle button
        const eagleBtn = document.getElementById('eagle-btn');
        console.log('[BUTTONS] Eagle button found:', !!eagleBtn);
        if (eagleBtn) {
            const shouldEnable = hasEagle && hasActions;
            console.log('[BUTTONS] Eagle should enable:', shouldEnable);
            if (shouldEnable) {
                eagleBtn.disabled = false;
                eagleBtn.className = 'phase-btn';
                eagleBtn.style.background = '';
            } else {
                eagleBtn.disabled = true;
                eagleBtn.className = 'phase-btn';
            }
        }
    },
    
    updateActionButtons() {
        const hero = this.heroes[this.currentPlayerIndex];
        const hasActions = this.actionsRemaining > 0;
        
        // Get current location info
        const location = this.locationCoords[hero.location];
        const minionsHere = this.minions[hero.location];
        const totalMinions = minionsHere ? Object.values(minionsHere).reduce((a, b) => a + b, 0) : 0;
        const generalHere = this.generals.find(g => g.location === hero.location && !g.defeated);
        const isInn = location && location.type === 'inn';
        const rumorsLeft = 2 - this.rumorsUsedThisTurn;
        const hasTaint = this.taintCrystals[hero.location] > 0;
        
        console.log('[ACTION BUTTONS] Updating action buttons');
        console.log('[ACTION BUTTONS] Hero location:', hero.location);
        console.log('[ACTION BUTTONS] Has actions:', hasActions);
        console.log('[ACTION BUTTONS] Actions remaining:', this.actionsRemaining);
        console.log('[ACTION BUTTONS] Is inn:', isInn);
        console.log('[ACTION BUTTONS] Rumors left:', rumorsLeft);
        console.log('[ACTION BUTTONS] Total minions:', totalMinions);
        console.log('[ACTION BUTTONS] General here:', !!generalHere);
        console.log('[ACTION BUTTONS] Has taint:', hasTaint);
        
        // Update Engage Minions button
        const engageBtn = document.getElementById('engage-minions-btn');
        if (engageBtn) {
            const canEngage = hasActions && totalMinions > 0;
            console.log('[ACTION BUTTONS] Engage should enable:', canEngage);
            if (canEngage) {
                engageBtn.disabled = false;
                engageBtn.className = 'phase-btn';
                engageBtn.style.background = '';
            } else {
                engageBtn.disabled = true;
                engageBtn.className = 'phase-btn';
            }
        }
        
        // Update Fireball button (Wizard only)
        const fireballBtn = document.getElementById('fireball-btn');
        if (fireballBtn) {
            if (hero.name === 'Wizard') {
                fireballBtn.style.display = '';
                // Check if wizard has cards matching any minion colors at this location
                const minionColors = minionsHere ? Object.entries(minionsHere).filter(([c, n]) => n > 0).map(([c]) => c) : [];
                const hasMatchingCard = minionColors.some(color => hero.cards.some(card => card.color === color));
                const canFireball = hasActions && totalMinions > 0 && hasMatchingCard;
                if (canFireball) {
                    fireballBtn.disabled = false;
                    fireballBtn.className = 'phase-btn';
                    fireballBtn.style.background = '';
                } else {
                    fireballBtn.disabled = true;
                    fireballBtn.className = 'phase-btn';
                }
            } else {
                fireballBtn.style.display = 'none';
            }
        }
        
        // Update Archery button (Ranger only)
        const archeryBtn = document.getElementById('archery-btn');
        if (archeryBtn) {
            if (hero.name === 'Ranger') {
                archeryBtn.style.display = '';
                const archeryTargets = this._getRangerArcheryTargets(hero);
                const canArchery = hasActions && archeryTargets.length > 0;
                if (canArchery) {
                    archeryBtn.disabled = false;
                    archeryBtn.className = 'phase-btn';
                    archeryBtn.style.background = '';
                } else {
                    archeryBtn.disabled = true;
                    archeryBtn.className = 'phase-btn';
                }
            } else {
                archeryBtn.style.display = 'none';
            }
        }
        
        // Update Sanctify Land button (Cleric only)
        const sanctifyLandBtn = document.getElementById('sanctify-land-btn');
        if (sanctifyLandBtn) {
            if (hero.name === 'Cleric') {
                sanctifyLandBtn.style.display = '';
                const canSanctify = hasActions && hasTaint && totalMinions === 0 && !generalHere;
                if (canSanctify) {
                    sanctifyLandBtn.disabled = false;
                    sanctifyLandBtn.className = 'phase-btn';
                    sanctifyLandBtn.style.background = '';
                } else {
                    sanctifyLandBtn.disabled = true;
                    sanctifyLandBtn.className = 'phase-btn';
                }
            } else {
                sanctifyLandBtn.style.display = 'none';
            }
        }
        
        // Update Special Cards button
        const specialCardsBtn = document.getElementById('special-cards-btn');
        if (specialCardsBtn) {
            // Check if ANY active hero has a special card
            const anySpecialCards = this.heroes.some(h => h.cards && h.cards.some(c => c.special));
            if (anySpecialCards) {
                specialCardsBtn.disabled = false;
                specialCardsBtn.className = 'phase-btn';
                specialCardsBtn.style.background = '';
            } else {
                specialCardsBtn.disabled = true;
                specialCardsBtn.className = 'phase-btn';
            }
        }
        
        // Update Quest Cards button
        const questCardsBtn = document.getElementById('quest-cards-btn');
        if (questCardsBtn) {
            const anyQuestCards = this.heroes.some(h => h.questCards && h.questCards.length > 0);
            if (anyQuestCards) {
                questCardsBtn.disabled = false;
                questCardsBtn.className = 'phase-btn';
                questCardsBtn.style.background = '';
            } else {
                questCardsBtn.disabled = true;
                questCardsBtn.className = 'phase-btn';
            }
        }
        
        // Update Complete Quest button
        const completeQuestBtn = document.getElementById('complete-quest-btn');
        if (completeQuestBtn) {
            const questResult = hasActions ? this._getCompletableQuest(hero) : null;
            const canComplete = questResult !== null;
            if (canComplete) {
                completeQuestBtn.disabled = false;
                completeQuestBtn.className = 'phase-btn';
                completeQuestBtn.style.background = '#dc2626';
                // Show specific label for multi-location action quests
                if (questResult.quest.mechanic?.type === 'multi_location_action') {
                    completeQuestBtn.innerHTML = `<span class="action-btn-icon">📜 </span>Organize: ${questResult.quest.name}`;
                } else {
                    completeQuestBtn.innerHTML = `<span class="action-btn-icon">🎯 </span>Complete Quest`;
                }
            } else {
                completeQuestBtn.disabled = true;
                completeQuestBtn.className = 'phase-btn';
                completeQuestBtn.style.background = '';
                completeQuestBtn.innerHTML = `<span class="action-btn-icon">🎯 </span>Complete Quest`;
            }
        }
        
        // Update Attack General button
        const attackGeneralBtn = document.getElementById('attack-general-btn');
        if (attackGeneralBtn) {
            const canAttackGeneral = hasActions && generalHere && totalMinions === 0;
            console.log('[ACTION BUTTONS] Attack General should enable:', canAttackGeneral);
            if (canAttackGeneral) {
                attackGeneralBtn.disabled = false;
                attackGeneralBtn.className = 'phase-btn';
                attackGeneralBtn.style.background = '';
            } else {
                attackGeneralBtn.disabled = true;
                attackGeneralBtn.className = 'phase-btn';
            }
        }
        
        // Update Rumors button
        const rumorsBtn = document.getElementById('rumors-btn');
        if (rumorsBtn) {
            const canRumors = hasActions && isInn && rumorsLeft > 0;
            console.log('[ACTION BUTTONS] Rumors should enable:', canRumors, '(hasActions:', hasActions, 'isInn:', isInn, 'rumorsLeft:', rumorsLeft, ')');
            if (canRumors) {
                rumorsBtn.disabled = false;
                rumorsBtn.className = 'phase-btn';
                rumorsBtn.style.background = '';
                rumorsBtn.innerHTML = `<span class="action-btn-icon">🍺 </span>Rumors`;
            } else {
                rumorsBtn.disabled = true;
                rumorsBtn.className = 'phase-btn';
                rumorsBtn.innerHTML = `<span class="action-btn-icon">🍺 </span>Rumors`;
            }
        }
        
        // Update Crafty button (Rogue only)
        const craftyBtn = document.getElementById('crafty-btn');
        if (craftyBtn) {
            if (hero.name === 'Rogue') {
                craftyBtn.style.display = '';
                const canCrafty = hasActions && isInn && rumorsLeft > 0;
                if (canCrafty) {
                    craftyBtn.disabled = false;
                    craftyBtn.className = 'phase-btn';
                    craftyBtn.style.background = '';
                } else {
                    craftyBtn.disabled = true;
                    craftyBtn.className = 'phase-btn';
                }
            } else {
                craftyBtn.style.display = 'none';
            }
        }
        
        // Update Heal the Land button
        const healLandBtn = document.getElementById('heal-land-btn');
        if (healLandBtn) {
            const canHealLand = hasActions && hasTaint && totalMinions === 0 && !generalHere;
            console.log('[ACTION BUTTONS] Heal the Land should enable:', canHealLand, '(hasActions:', hasActions, 'hasTaint:', hasTaint, 'noMinions:', totalMinions === 0, 'noGeneral:', !generalHere, ')');
            if (canHealLand) {
                healLandBtn.disabled = false;
                healLandBtn.className = 'phase-btn';
                healLandBtn.style.background = '';
            } else {
                healLandBtn.disabled = true;
                healLandBtn.className = 'phase-btn';
            }
        }
        
        // Update Healing Wounds button
        const healingWoundsBtn = document.getElementById('healing-wounds-btn');
        if (healingWoundsBtn) {
            const isWounded = hero.health < hero.maxHealth;
            const isInn = location && location.type === 'inn';
            const isMonarchCity = hero.location === 'Monarch City';
            const isSafe = totalMinions === 0 && !generalHere;
            
            // Can heal if: wounded AND has actions AND (at inn OR at safe location OR at safe Monarch City)
            const canHeal = hasActions && isWounded && (isInn || isSafe || (isMonarchCity && isSafe));
            
            console.log('[ACTION BUTTONS] Healing Wounds should enable:', canHeal, '(hasActions:', hasActions, 'isWounded:', isWounded, 'isInn:', isInn, 'isSafe:', isSafe, ')');
            if (canHeal) {
                healingWoundsBtn.disabled = false;
                healingWoundsBtn.className = 'phase-btn';
                healingWoundsBtn.style.background = '';
            } else {
                healingWoundsBtn.disabled = true;
                healingWoundsBtn.className = 'phase-btn';
            }
        }
        
        // Update Special Skill button
        const specialSkillBtn = document.getElementById('special-skill-btn');
        if (specialSkillBtn) {
            // Define which heroes have active skills
            const heroSkills = {
                'Paladin': { name: 'Noble Steed', icon: '🐴', title: 'Noble Steed' },
                'Wizard': { name: 'Teleport', icon: '✨', title: 'Teleport' },
                'Eagle Rider': { name: 'Eagle Flight', icon: '🦅', title: 'Eagle Flight' }
            };
            
            const heroSkill = heroSkills[hero.name];
            
            if (heroSkill) {
                // Hero has a special skill - show button
                specialSkillBtn.style.display = '';
                specialSkillBtn.innerHTML = `<span class="action-btn-icon">${heroSkill.icon} </span>${heroSkill.title}`;
                specialSkillBtn.title = `Perform special skill`;
                
                // Check if skill can be used (Wizard teleport limited to once per turn)
                let canUseSkill = hasActions;
                if (hero.name === 'Wizard' && this.wizardTeleportUsedThisTurn) {
                    canUseSkill = false;
                }
                console.log('[ACTION BUTTONS] Special Skill should enable:', canUseSkill, '(hasActions:', hasActions, ')');
                
                if (canUseSkill) {
                    specialSkillBtn.disabled = false;
                    specialSkillBtn.className = 'phase-btn';
                    specialSkillBtn.style.background = '';
                } else {
                    specialSkillBtn.disabled = true;
                    specialSkillBtn.className = 'phase-btn';
                }
            } else {
                // Hero has no special skill - hide button
                specialSkillBtn.style.display = 'none';
            }
        }
        
        // Update Unicorn Steed button (dynamic — only shown when hero has completed quest)
        // Placed in top action row with movement buttons
        let unicornBtn = document.getElementById('unicorn-steed-btn');
        const hasUnicornSteed = this._hasUnicornSteed(hero);
        
        if (hasUnicornSteed) {
            // Create button if it doesn't exist
            if (!unicornBtn) {
                const topRow = document.querySelector('.action-row-top');
                if (topRow) {
                    unicornBtn = document.createElement('button');
                    unicornBtn.id = 'unicorn-steed-btn';
                    unicornBtn.innerHTML = '<span class="action-btn-icon">🦄 </span>Unicorn';
                    unicornBtn.title = 'Unicorn Steed (move 2 spaces, no card required)';
                    unicornBtn.onclick = () => game.useUnicornSteed();
                    topRow.appendChild(unicornBtn);
                }
            }
            if (unicornBtn) {
                unicornBtn.style.display = '';
                if (hasActions) {
                    unicornBtn.disabled = false;
                    unicornBtn.className = 'phase-btn';
                    unicornBtn.style.background = '';
                } else {
                    unicornBtn.disabled = true;
                    unicornBtn.className = 'phase-btn';
                }
            }
        } else if (unicornBtn) {
            unicornBtn.style.display = 'none';
        }
        
        // Update Build Magic Gate button
        const buildGateBtn = document.getElementById('build-magic-gate-btn');
        if (buildGateBtn) {
            const locationData = this.locationCoords[hero.location];
            const alreadyHasGate = locationData && locationData.magicGate;
            const hasMatchingLocationCard = hero.cards.some(card => card.name === hero.location);
            const canBuildGate = hasActions && !alreadyHasGate && hasMatchingLocationCard;
            
            if (canBuildGate) {
                buildGateBtn.disabled = false;
                buildGateBtn.className = 'phase-btn';
                buildGateBtn.style.background = '';
            } else {
                buildGateBtn.disabled = true;
                buildGateBtn.className = 'phase-btn';
            }
        }
        
        // Failsafe: ensure Rumors quest progress is tracked for current location
        // Catches edge cases where mid-movement checks may be missed
        if (hero.questCards && !this.activeMovement) {
            this._checkRumorsQuestProgress(hero, hero.location);
        }
        
        // Show deferred Rumors quest completion modal
        // Triggers here because updateActionButtons runs after every state change
        // Only show when movement and combat are fully resolved
        if (this._pendingRumorsCompletion && !this.activeMovement && !this.currentCombat) {
            // Use a microtask to ensure all rendering is done first
            Promise.resolve().then(() => this._showPendingRumorsCompletion());
        }
    },
    
    closeMap(event) {
        if (this.questUseMode) this.clearQuestUseMode();
        document.getElementById('map-modal').classList.remove('active');
        this.hideTooltip(true); // Force close any tooltips (including stationary ones)
    },
    
    closeMapOnBackground(event) {
        if (event.target.id === 'map-modal') {
            this.closeMap();
        }
    },
    
    engageMinionsFromMap() {
        // Cancel any active movement, archery, or quest use
        if (this.activeMovement) {
            this.clearMovementMode();
        }
        if (this.archeryTargeting) {
            this.clearArcheryMode();
        }
        if (this.questUseMode) {
            this.clearQuestUseMode();
        }
        
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
            this.showInfoModal('⚠️', '<div>No minions at your current location!</div>');
            return;
        }
        
        this.showCombatModal('minions', hero.location);
    },
    
    archeryFromMap() {
        // Cancel any active movement
        if (this.activeMovement) {
            this.clearMovementMode();
        }
        
        // Toggle off if already active
        if (this.archeryTargeting) {
            this.clearArcheryMode();
            return;
        }
        
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        if (hero.name !== 'Ranger') {
            this.showInfoModal('⚠️', '<div>Only the Ranger can use Archery!</div>');
            return;
        }
        
        const archeryTargets = this._getRangerArcheryTargets(hero);
        if (archeryTargets.length === 0) {
            this.showInfoModal('⚠️', '<div>No minions at connected locations to target!</div>');
            return;
        }
        
        this.showArcheryTargeting(archeryTargets);
    },
    
    showArcheryTargeting(archeryTargets) {
        const hero = this.heroes[this.currentPlayerIndex];
        
        // Store targeting state
        this.archeryTargeting = true;
        this._archeryValidTargets = archeryTargets.slice();
        
        // Remove old highlights
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        
        const svg = document.getElementById('game-map');
        
        // Highlight archery targets
        archeryTargets.forEach(locationName => {
            const coords = this.locationCoords[locationName];
            if (!coords) return;
            
            const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            highlight.classList.add('location-highlight');
            highlight.setAttribute('cx', coords.x);
            highlight.setAttribute('cy', coords.y);
            highlight.setAttribute('r', coords.type === 'inn' ? '34' : '45');
            highlight.setAttribute('fill', 'rgba(0, 80, 20, 0.55)');
            highlight.setAttribute('stroke', '#00ff55');
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
        
        // Show indicator
        const indicator = document.createElement('div');
        indicator.id = 'archery-indicator';
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
        indicator.innerHTML = `
            <div style="color: #ffd700; font-size: 1em; font-weight: bold; margin-bottom: 4px; font-family:'Cinzel',Georgia,serif;">
                🏹 Archery Mode
            </div>
            <div style="font-size: 0.8em; color: #d4af37;">
                Click a highlighted location to attack
            </div>
            <button class="btn btn-danger" onclick="game.clearArcheryMode()" style="margin-top: 8px; width: 100%; font-size: 0.85em; padding: 6px;">
                ✕ Cancel
            </button>
        `;
        document.body.appendChild(indicator);
    },
    
    handleArcheryClick(locationName) {
        if (!this.archeryTargeting || !this._archeryValidTargets) return false;
        
        if (!this._archeryValidTargets.includes(locationName)) return false;
        
        // Clear archery targeting UI
        this.clearArcheryMode();
        
        this.rangedAttack = true;
        this.showCombatModal('minions', locationName);
        return true;
    },
    
    clearArcheryMode() {
        this.archeryTargeting = false;
        this._archeryValidTargets = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('archery-indicator');
        if (indicator) indicator.remove();
    },
    
});
