// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - UI Panels, Buttons & Map Modal
// ═══════════════════════════════════════════════════════════════

Object.assign(game, {
        const tooltip = document.getElementById('hover-tooltip');
        const content = document.getElementById('tooltip-content');
        
        const cardColorMap = {
            'red': '#dc2626',
            'blue': '#2563eb',
            'green': '#16a34a',
            'black': '#1f2937'
        };
        
        let cardsHTML = '';
        if (hero.cards.length === 0) {
            cardsHTML = '<div style="font-style: italic; color: #999;">No cards</div>';
        } else {
            const colorToGeneralWithFaction = {
                'red': 'Balazarg (Demons)',
                'blue': 'Sapphire (Dragonkin)',
                'green': 'Gorgutt (Orcs)',
                'black': 'Varkolak (Undead)'
            };
            
            cardsHTML = '<div style="margin-top: 5px;">';
            hero.cards.forEach((card, cardIndex) => {
                const borderColor = (card.special ? '#9333ea' : (cardColorMap[card.color] || '#8B7355'));
                const generalWithFaction = colorToGeneralWithFaction[card.color] || 'Any General';
                const cardIcon = card.icon || '🎴'; // Default icon if missing
                
                // Store card in global scope with unique key
                const cardKey = `heroCard_${hero.name}_${cardIndex}`;
                window[cardKey] = card;
                
                cardsHTML += `
                    <div class="modal-card-item-${cardIndex}" data-card-index="${cardIndex}"
                         onmousedown="console.log('mousedown on card'); window.game.showCardDetailModal(window['${cardKey}']); return false;"
                         style="padding: 8px; margin: 5px 0; border-left: 3px solid ${borderColor}; background: rgba(0,0,0,0.3); cursor: pointer; border-radius: 3px; transition: background 0.2s;">
                        <div style="font-weight: bold; color: ${borderColor};">${cardIcon} ${card.name}</div>
                        <div style="font-size: 0.85em;">${card.special ? "🌟 Special — Play anytime" : "🎲 " + card.dice + " dice vs " + generalWithFaction}</div>
                    </div>
                `;
            });
            cardsHTML += '</div>';
        }
        
        const closeButton = `<div style="position: absolute; top: 5px; right: 5px; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 24px; font-weight: bold; color: #fff; background: rgba(220,38,38,0.8); border-radius: 50%; z-index: 10; user-select: none; border: 2px solid #d4af37;" 
              onclick="event.stopPropagation(); game.hideTooltip(true);">×</div>`;
        
        // Eagle Rider attack style badge
        let attackStyleBadgeHTML = '';
        if (hero.name === 'Eagle Rider' && this.eagleRiderAttackStyle) {
            const isSky = this.eagleRiderAttackStyle === 'sky';
            const badgeBg = isSky ? 'rgba(96, 165, 250, 0.3)' : 'rgba(245, 158, 11, 0.3)';
            const badgeBorder = isSky ? '#60a5fa' : '#f59e0b';
            const badgeColor = isSky ? '#60a5fa' : '#f59e0b';
            const badgeText = isSky ? '☁️ Sky' : '⚔️ Ground';
            attackStyleBadgeHTML = ` <span style="margin-left: 6px; padding: 2px 7px; border-radius: 4px; font-size: 0.75em; font-weight: bold; vertical-align: top;
                background: ${badgeBg}; border: 1px solid ${badgeBorder}; color: ${badgeColor};">${badgeText}</span>`;
        }
        
        // Sorceress Shape Shifter badge
        if (hero.name === 'Sorceress' && this.heroes.indexOf(hero) === this.currentPlayerIndex) {
            if (this.shapeshiftForm) {
                const sfNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
                const sfIcons = { green: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#16a34a;border:1.5px solid #000;vertical-align:middle;"></span>', black: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#1f2937;border:1.5px solid #000;vertical-align:middle;"></span>', red: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#dc2626;border:1.5px solid #000;vertical-align:middle;"></span>', blue: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#2563eb;border:1.5px solid #000;vertical-align:middle;"></span>' };
                const sfColors = { green: '#16a34a', black: '#6b7280', red: '#dc2626', blue: '#3b82f6' };
                attackStyleBadgeHTML += ` <span style="margin-left: 4px; padding: 2px 7px; border-radius: 4px; font-size: 0.75em; font-weight: bold; vertical-align: top;
                    background: rgba(236,72,153,0.2); border: 1px solid ${sfColors[this.shapeshiftForm]}; color: ${sfColors[this.shapeshiftForm]};"><span class="shapeshift-desktop">${sfIcons[this.shapeshiftForm]} ${sfNames[this.shapeshiftForm]}</span><span class="shapeshift-mobile">${sfIcons[this.shapeshiftForm]}</span></span>`;
            }
        }
        
        const titlePadding2 = attackStyleBadgeHTML ? 'padding-bottom: 8px;' : '';
        
        content.innerHTML = `
            ${closeButton}
            <div class="tooltip-title" style="color: ${hero.color}; ${titlePadding2}">${hero.symbol} ${hero.name}${attackStyleBadgeHTML}</div>
            <div class="tooltip-stat">${this.getTooltipLifeTokensHTML(hero)}</div>
            <div class="tooltip-stat">${this.getTooltipActionsHTML(hero)}</div>
            <div class="tooltip-stat"><span style="color: #ffd700; font-weight: bold;">Location:</span> ${hero.location}</div>
            <div class="tooltip-stat" style="margin-top: 5px;">${this.getTooltipCardsHTML(hero)}</div>
            <div id="hero-cards-list" style="max-height: 250px; overflow-y: auto;" onmousedown="console.log('mousedown on hero-cards-list container');">
                ${cardsHTML}
            </div>
            <div style="font-size: 0.8em; color: #999; margin-top: 8px; font-style: italic;">Click × or hero to close • Click cards for details</div>
        `;
        
        // Debug: Add listener to the entire tooltip to see what's being clicked
        tooltip.onmousedown = function(e) {
            console.log('Mousedown on tooltip, target:', e.target);
            console.log('Target className:', e.target.className);
            console.log('Target tagName:', e.target.tagName);
        };
        
        tooltip.classList.add('active');
        tooltip.setAttribute('data-stationary', 'modal'); // Mark as modal tooltip - stays open
        
        // CRITICAL: Move tooltip to body so it's not blocked by modal backdrop
        if (tooltip.parentElement !== document.body) {
            document.body.appendChild(tooltip);
            console.log('Moved tooltip to body');
        }
        
        // Use fixed positioning for modal context
        tooltip.style.position = 'fixed';
        tooltip.style.left = (event.clientX + 15) + 'px';
        tooltip.style.top = (event.clientY + 15) + 'px';
        tooltip.style.setProperty('z-index', '20000', 'important'); // Higher than heroes modal (10000), lower than card detail (30000)
        tooltip.style.border = ''; // Clear any debug styling
        tooltip.style.background = ''; // Clear any debug styling
        
        // Add click event listeners to card items after rendering (same as working showHeroCardsTooltip)
        setTimeout(() => {
            console.log('Adding card click handlers to modal cards');
            hero.cards.forEach((card, cardIndex) => {
                const cardElement = content.querySelector(`.modal-card-item-${cardIndex}`);
                console.log(`Card ${cardIndex} element:`, cardElement);
                if (cardElement) {
                    cardElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        console.log('Card clicked via addEventListener:', card.name);
                        this.showCardDetailModal(card);
                    });
                    cardElement.addEventListener('mouseenter', (e) => {
                        cardElement.style.background = 'rgba(0,0,0,0.5)';
                    });
                    cardElement.addEventListener('mouseleave', (e) => {
                        cardElement.style.background = 'rgba(0,0,0,0.3)';
                    });
                }
            });
        }, 100);
    },
    
    showMap() {
        document.getElementById('map-modal').classList.add('active');
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
        
        // Find the hero's token on the map to position tooltip near it
        const heroTokenSvg = document.querySelector(`.hero-token-svg[data-hero-index="${this.currentPlayerIndex}"]`);
        let fakeEvent = event;
        if (heroTokenSvg) {
            const circle = heroTokenSvg.querySelector('circle');
            if (circle) {
                const svg = document.getElementById('game-map');
                const pt = svg.createSVGPoint();
                pt.x = parseFloat(circle.getAttribute('cx'));
                pt.y = parseFloat(circle.getAttribute('cy'));
                const screenPt = pt.matrixTransform(svg.getScreenCTM());
                fakeEvent = { clientX: screenPt.x, clientY: screenPt.y };
            }
        }
        
        // Show/toggle the hero tooltip
        const tooltip = document.getElementById('hover-tooltip');
        if (tooltip.classList.contains('active') && 
            tooltip.getAttribute('data-hero-name') === hero.name) {
            this.hideTooltip(true);
        } else {
            this.showHeroCardsTooltip(hero, fakeEvent, true);
        }
        
        // Pulse the hero token gold
        this.pulseHeroToken(this.currentPlayerIndex);
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
            return; // Map not open, skip update
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        const mapActiveHero = document.getElementById('map-active-hero');
        
        if (mapActiveHero) {
            if (hero.name === 'Eagle Rider' && this.eagleRiderAttackStyle) {
                const isSky = this.eagleRiderAttackStyle === 'sky';
                const tooltipText = isSky ? 'Sky Attack' : 'Ground Attack';
                const icon = isSky ? '☁️' : '⚔️';
                mapActiveHero.innerHTML = `${hero.symbol} ${hero.name} <span title="${tooltipText}" style="cursor: help;">(${icon})</span>`;
            } else if (hero.name === 'Sorceress' && this.shapeshiftForm) {
                const sfNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
                const sfIcons = { green: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#16a34a;border:1.5px solid #000;vertical-align:middle;"></span>', black: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#1f2937;border:1.5px solid #000;vertical-align:middle;"></span>', red: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#dc2626;border:1.5px solid #000;vertical-align:middle;"></span>', blue: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#2563eb;border:1.5px solid #000;vertical-align:middle;"></span>' };
                mapActiveHero.innerHTML = `${hero.symbol} ${hero.name} <span title="${sfNames[this.shapeshiftForm]} Form" style="cursor: help;">(${sfIcons[this.shapeshiftForm]})</span>`;
            } else {
                mapActiveHero.textContent = `${hero.symbol} ${hero.name}`;
            }
        }
        
        // Re-enable end turn button (in case it was disabled)
        const endTurnBtn = document.getElementById('map-end-turn-btn');
        if (endTurnBtn) {
            endTurnBtn.disabled = false;
            endTurnBtn.style.opacity = '1';
            endTurnBtn.style.cursor = 'pointer';
        }
        
        // Update token positions - renderTokens clears the layer itself
        this.renderTokens();
        
        // Update life tokens, action tokens, and minion/taint tracker
        this.renderMapHeroLifeTokens();
        this.renderMapActionTokens();
        this.renderMinionTracker();
    },
    
    renderMapActionTokens() {
        const container = document.getElementById('map-hero-action-tokens');
        if (!container) return;
        
        const hero = this.heroes[this.currentPlayerIndex];
        if (!hero) return;
        
        // Use the higher of health or actionsRemaining to account for bonus actions
        const questActionBonus = this._getQuestActionBonus(hero);
        const baseMax = hero.health + questActionBonus;
        const maxActions = Math.max(baseMax, this.actionsRemaining);
        const bonusSource = hero.name === 'Eagle Rider' ? 'Fresh Mount' : hero.name === 'Dwarf' ? 'Mountain Lore' : 'Bonus';
        const questBonusSource = questActionBonus > 0 ? 'Boots of Speed' : '';
        let html = '<span class="tray-label"><span class="tray-label-text">Actions:</span><span class="tray-label-icon">⚡</span></span>';
        html += '<span class="tray-icons">';
        for (let i = 0; i < maxActions; i++) {
            if (i < this.actionsRemaining) {
                // Mark bonus actions with a different style
                if (i >= hero.health && i < hero.health + questActionBonus) {
                    html += `<span class="tray-icon" title="Bonus action (${questBonusSource})" style="filter: hue-rotate(300deg);">⚡</span>`;
                } else if (i >= hero.health + questActionBonus) {
                    html += `<span class="tray-icon" title="Bonus action (${bonusSource})" style="filter: hue-rotate(180deg);">⚡</span>`;
                } else {
                    html += '<span class="tray-icon" title="Action available">⚡</span>';
                }
            } else {
                html += '<span class="tray-icon-dim" title="Action spent">⚡</span>';
            }
        }
        html += '</span>';
        html += `<span class="tray-text-counter">${this.actionsRemaining}/${maxActions}</span>`;
        container.innerHTML = html;
    },
    
    renderMapHeroLifeTokens() {
        const container = document.getElementById('map-hero-life-tokens');
        if (!container) return;
        
        const hero = this.heroes[this.currentPlayerIndex];
        if (!hero) return;
        
        let html = '<span class="tray-label"><span class="tray-label-text">Life Tokens:</span><span class="tray-label-icon">❤️</span></span>';
        html += '<span class="tray-icons">';
        for (let i = 0; i < hero.maxHealth; i++) {
            if (i < hero.health) {
                html += '<span class="tray-icon" title="Life token">❤️</span>';
            } else {
                html += '<span class="tray-icon-dim" title="Lost life token">❤️</span>';
            }
        }
        html += '</span>';
        html += `<span class="tray-text-counter">${hero.health}/${hero.maxHealth}</span>`;
        container.innerHTML = html;
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
        
        let html = '<span class="threat-label">Threat:</span>';
        for (const faction of factions) {
            let count = 0;
            for (const loc in this.minions) {
                if (this.minions[loc] && this.minions[loc][faction.color]) {
                    count += this.minions[loc][faction.color];
                }
            }
            const countColor = getMinionCountColor(count);
            html += `<span class="threat-item"><span class="threat-faction" style="color: ${faction.css};"><span class="threat-faction-name">${faction.name}</span><span class="threat-faction-icon">${faction.symbol}</span></span>
                <span class="threat-count" style="color: ${countColor};">${count}/25</span></span>`;
        }
        
        // Tainted Crystals
        let placed = 0;
        for (const loc in this.taintCrystals) {
            if (this.taintCrystals[loc]) {
                placed += this.taintCrystals[loc];
            }
        }
        const total = 12;
        const taintColor = placed >= 10 ? '#ef4444' : placed >= 7 ? '#b8860b' : '#f4e4c1';
        html += `<span class="threat-item"><span class="threat-faction" style="color: #9333ea;"><span class="threat-faction-name">Tainted Crystals</span><span class="threat-faction-icon">💎</span></span>
            <span class="threat-count" style="color: ${taintColor};">${placed}/${total}</span></span>`;
        
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
                footBtn.className = 'btn btn-primary';
                footBtn.style.opacity = '1';
                footBtn.style.cursor = 'pointer';
                footBtn.style.background = '';
            } else {
                footBtn.disabled = true;
                footBtn.className = 'btn';
                footBtn.style.opacity = '0.5';
                footBtn.style.cursor = 'not-allowed';
                footBtn.style.background = '#666';
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
                magicGateBtn.className = 'btn btn-primary';
                magicGateBtn.style.opacity = '1';
                magicGateBtn.style.cursor = 'pointer';
                magicGateBtn.style.background = '';
            } else {
                magicGateBtn.disabled = true;
                magicGateBtn.className = 'btn';
                magicGateBtn.style.opacity = '0.5';
                magicGateBtn.style.cursor = 'not-allowed';
                magicGateBtn.style.background = '#666';
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
                horseBtn.className = 'btn btn-primary';
                horseBtn.style.opacity = '1';
                horseBtn.style.cursor = 'pointer';
                horseBtn.style.background = '';
            } else {
                horseBtn.disabled = true;
                horseBtn.className = 'btn';
                horseBtn.style.opacity = '0.5';
                horseBtn.style.cursor = 'not-allowed';
                horseBtn.style.background = '#666';
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
                eagleBtn.className = 'btn btn-primary';
                eagleBtn.style.opacity = '1';
                eagleBtn.style.cursor = 'pointer';
                eagleBtn.style.background = '';
            } else {
                eagleBtn.disabled = true;
                eagleBtn.className = 'btn';
                eagleBtn.style.opacity = '0.5';
                eagleBtn.style.cursor = 'not-allowed';
                eagleBtn.style.background = '#666';
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
                engageBtn.className = 'btn btn-primary';
                engageBtn.style.opacity = '1';
                engageBtn.style.cursor = 'pointer';
                engageBtn.style.background = '';
            } else {
                engageBtn.disabled = true;
                engageBtn.className = 'btn';
                engageBtn.style.opacity = '0.5';
                engageBtn.style.cursor = 'not-allowed';
                engageBtn.style.background = '#666';
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
                    fireballBtn.className = 'btn btn-primary';
                    fireballBtn.style.opacity = '1';
                    fireballBtn.style.cursor = 'pointer';
                    fireballBtn.style.background = '';
                } else {
                    fireballBtn.disabled = true;
                    fireballBtn.className = 'btn';
                    fireballBtn.style.opacity = '0.5';
                    fireballBtn.style.cursor = 'not-allowed';
                    fireballBtn.style.background = '#666';
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
                    archeryBtn.className = 'btn btn-primary';
                    archeryBtn.style.opacity = '1';
                    archeryBtn.style.cursor = 'pointer';
                    archeryBtn.style.background = '';
                } else {
                    archeryBtn.disabled = true;
                    archeryBtn.className = 'btn';
                    archeryBtn.style.opacity = '0.5';
                    archeryBtn.style.cursor = 'not-allowed';
                    archeryBtn.style.background = '#666';
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
                    sanctifyLandBtn.className = 'btn btn-primary';
                    sanctifyLandBtn.style.opacity = '1';
                    sanctifyLandBtn.style.cursor = 'pointer';
                    sanctifyLandBtn.style.background = '';
                } else {
                    sanctifyLandBtn.disabled = true;
                    sanctifyLandBtn.className = 'btn';
                    sanctifyLandBtn.style.opacity = '0.5';
                    sanctifyLandBtn.style.cursor = 'not-allowed';
                    sanctifyLandBtn.style.background = '#666';
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
                specialCardsBtn.className = 'btn btn-primary';
                specialCardsBtn.style.opacity = '1';
                specialCardsBtn.style.cursor = 'pointer';
                specialCardsBtn.style.background = '';
            } else {
                specialCardsBtn.disabled = true;
                specialCardsBtn.className = 'btn';
                specialCardsBtn.style.opacity = '0.5';
                specialCardsBtn.style.cursor = 'not-allowed';
                specialCardsBtn.style.background = '#666';
            }
        }
        
        // Update Quest Cards button
        const questCardsBtn = document.getElementById('quest-cards-btn');
        if (questCardsBtn) {
            const anyQuestCards = this.heroes.some(h => h.questCards && h.questCards.length > 0);
            if (anyQuestCards) {
                questCardsBtn.disabled = false;
                questCardsBtn.className = 'btn btn-primary';
                questCardsBtn.style.opacity = '1';
                questCardsBtn.style.cursor = 'pointer';
                questCardsBtn.style.background = '';
            } else {
                questCardsBtn.disabled = true;
                questCardsBtn.className = 'btn';
                questCardsBtn.style.opacity = '0.5';
                questCardsBtn.style.cursor = 'not-allowed';
                questCardsBtn.style.background = '#666';
            }
        }
        
        // Update Complete Quest button
        const completeQuestBtn = document.getElementById('complete-quest-btn');
        if (completeQuestBtn) {
            const canComplete = hasActions && this._getCompletableQuest(hero) !== null;
            if (canComplete) {
                completeQuestBtn.disabled = false;
                completeQuestBtn.className = 'btn btn-primary';
                completeQuestBtn.style.opacity = '1';
                completeQuestBtn.style.cursor = 'pointer';
                completeQuestBtn.style.background = '#dc2626';
            } else {
                completeQuestBtn.disabled = true;
                completeQuestBtn.className = 'btn';
                completeQuestBtn.style.opacity = '0.5';
                completeQuestBtn.style.cursor = 'not-allowed';
                completeQuestBtn.style.background = '#666';
            }
        }
        
        // Update Attack General button
        const attackGeneralBtn = document.getElementById('attack-general-btn');
        if (attackGeneralBtn) {
            const canAttackGeneral = hasActions && generalHere && totalMinions === 0;
            console.log('[ACTION BUTTONS] Attack General should enable:', canAttackGeneral);
            if (canAttackGeneral) {
                attackGeneralBtn.disabled = false;
                attackGeneralBtn.className = 'btn btn-primary';
                attackGeneralBtn.style.opacity = '1';
                attackGeneralBtn.style.cursor = 'pointer';
                attackGeneralBtn.style.background = '';
            } else {
                attackGeneralBtn.disabled = true;
                attackGeneralBtn.className = 'btn';
                attackGeneralBtn.style.opacity = '0.5';
                attackGeneralBtn.style.cursor = 'not-allowed';
                attackGeneralBtn.style.background = '#666';
            }
        }
        
        // Update Rumors button
        const rumorsBtn = document.getElementById('rumors-btn');
        if (rumorsBtn) {
            const canRumors = hasActions && isInn && rumorsLeft > 0;
            console.log('[ACTION BUTTONS] Rumors should enable:', canRumors, '(hasActions:', hasActions, 'isInn:', isInn, 'rumorsLeft:', rumorsLeft, ')');
            if (canRumors) {
                rumorsBtn.disabled = false;
                rumorsBtn.className = 'btn btn-primary';
                rumorsBtn.style.opacity = '1';
                rumorsBtn.style.cursor = 'pointer';
                rumorsBtn.style.background = '';
                rumorsBtn.innerHTML = `<span class="action-btn-icon">🍺 </span>Rumors`;
            } else {
                rumorsBtn.disabled = true;
                rumorsBtn.className = 'btn';
                rumorsBtn.style.opacity = '0.5';
                rumorsBtn.style.cursor = 'not-allowed';
                rumorsBtn.style.background = '#666';
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
                    craftyBtn.className = 'btn btn-primary';
                    craftyBtn.style.opacity = '1';
                    craftyBtn.style.cursor = 'pointer';
                    craftyBtn.style.background = '';
                } else {
                    craftyBtn.disabled = true;
                    craftyBtn.className = 'btn';
                    craftyBtn.style.opacity = '0.5';
                    craftyBtn.style.cursor = 'not-allowed';
                    craftyBtn.style.background = '#666';
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
                healLandBtn.className = 'btn btn-primary';
                healLandBtn.style.opacity = '1';
                healLandBtn.style.cursor = 'pointer';
                healLandBtn.style.background = '';
            } else {
                healLandBtn.disabled = true;
                healLandBtn.className = 'btn';
                healLandBtn.style.opacity = '0.5';
                healLandBtn.style.cursor = 'not-allowed';
                healLandBtn.style.background = '#666';
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
                healingWoundsBtn.className = 'btn btn-primary';
                healingWoundsBtn.style.opacity = '1';
                healingWoundsBtn.style.cursor = 'pointer';
                healingWoundsBtn.style.background = '';
            } else {
                healingWoundsBtn.disabled = true;
                healingWoundsBtn.className = 'btn';
                healingWoundsBtn.style.opacity = '0.5';
                healingWoundsBtn.style.cursor = 'not-allowed';
                healingWoundsBtn.style.background = '#666';
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
                    specialSkillBtn.className = 'btn btn-primary';
                    specialSkillBtn.style.opacity = '1';
                    specialSkillBtn.style.cursor = 'pointer';
                    specialSkillBtn.style.background = '';
                } else {
                    specialSkillBtn.disabled = true;
                    specialSkillBtn.className = 'btn';
                    specialSkillBtn.style.opacity = '0.5';
                    specialSkillBtn.style.cursor = 'not-allowed';
                    specialSkillBtn.style.background = '#666';
                }
            } else {
                // Hero has no special skill - hide button
                specialSkillBtn.style.display = 'none';
            }
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
                buildGateBtn.className = 'btn btn-primary';
                buildGateBtn.style.opacity = '1';
                buildGateBtn.style.cursor = 'pointer';
                buildGateBtn.style.background = '';
            } else {
                buildGateBtn.disabled = true;
                buildGateBtn.className = 'btn';
                buildGateBtn.style.opacity = '0.5';
                buildGateBtn.style.cursor = 'not-allowed';
                buildGateBtn.style.background = '#666';
            }
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
        indicator.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.9);
            border: 3px solid #d4af37;
            border-radius: 10px;
            padding: 15px 25px;
            z-index: 25000;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.8);
        `;
        indicator.innerHTML = `
            <div style="color: #ffd700; font-size: 1.2em; font-weight: bold; margin-bottom: 5px;">
                🏹 Archery Mode Active
            </div>
            <div style="font-size: 0.9em; color: #d4af37;">
                Click a highlighted location to attack
            </div>
            <button class="btn btn-danger" onclick="game.clearArcheryMode()" style="margin-top: 10px; width: 100%;">
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
