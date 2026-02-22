// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Map Rendering & Tooltips
// ═══════════════════════════════════════════════════════════════

Object.assign(game, {
    renderMap() {
        const locationsGroup = document.getElementById('locations');
        const pathsGroup = document.getElementById('paths');
        
        if (!locationsGroup) return;
        
        // Clear existing
        locationsGroup.innerHTML = '';
        pathsGroup.innerHTML = '';
        
        // Define connections from Excel - includes general path colors
        // Format: [location1, location2, pathColor] where pathColor is 'red', 'blue', 'green', 'black', or null
        const connections = [
            ['Dark Woods', 'Golden Oak Forest', 'black'],
            ['Dark Woods', 'Windy Pass', 'black'],
            ['Golden Oak Forest', 'Rock Bridge Pass', null],
            ['Eagle Nest Inn', 'Enchanted Glade', null],
            ['Enchanted Glade', 'Unicorn Forest', null],
            ['Enchanted Glade', 'Rock Bridge Pass', null],
            ['Unicorn Forest', 'Blood Flats', null],
            ['Unicorn Forest', 'Brookdale Village', null],
            ['Blood Flats', 'Scorpion Canyon', 'red'],
            ['Blood Flats', 'Brookdale Village', null],
            ['Blood Flats', 'Raven Forest', 'red'],
            ['Scorpion Canyon', 'Raven Forest', 'red'],
            ['Windy Pass', 'Rock Bridge Pass', 'black'],
            ['Windy Pass', 'Sea Bird Port', 'black'],
            ['Rock Bridge Pass', 'Brookdale Village', null],
            ['Rock Bridge Pass', 'Sea Bird Port', 'black'],
            ['Brookdale Village', 'Sea Bird Port', 'black'],
            ['Brookdale Village', 'Pleasant Hill', null],
            ['Brookdale Village', 'Father Oak Forest', 'black'],
            ['Raven Forest', 'Pleasant Hill', 'red'],
            ['Raven Forest', 'Angel Tear Falls', 'red'],
            ['Sea Bird Port', 'Father Oak Forest', 'black'],
            ['Pleasant Hill', 'Father Oak Forest', 'black'],
            ['Pleasant Hill', 'Angel Tear Falls', 'red'],
            ['Minotaur Forest', 'Seagaul Lagoon', null],
            ['Minotaur Forest', 'Wolf Pass', null],
            ['Father Oak Forest', 'Wolf Pass', 'black'],
            ['Father Oak Forest', 'Monarch City', 'black'],
            ['Angel Tear Falls', 'Dragon\'s Teeth Range', 'red'],
            ['Angel Tear Falls', 'Bounty Bay', 'red'],
            ['Angel Tear Falls', 'Fire River', 'red'],
            ['Seagaul Lagoon', 'Wolf Pass', null],
            ['Wolf Pass', 'Monarch City', null],
            ['Wolf Pass', 'Orc Valley', 'green'],
            ['Monarch City', 'Bounty Bay', 'red'],
            ['Monarch City', 'Orc Valley', 'green'],
            ['Monarch City', 'Dancing Stone', null],
            ['Monarch City', 'Greenleaf Village', 'blue'],
            ['Bounty Bay', 'Greenleaf Village', 'red'],
            ['Bounty Bay', 'Mermaid Harbor', 'red'],
            ['Gryphon Forest', 'Seagaul Lagoon', null],
            ['Gryphon Forest', 'Gryphon Inn', null],
            ['Gryphon Forest', 'Serpent Swamp', null],
            ['Orc Valley', 'Dancing Stone', 'green'],
            ['Orc Valley', 'Eagle Peak Pass', 'green'],
            ['Orc Valley', 'Whispering Woods', 'green'],
            ['Dancing Stone', 'Greenleaf Village', 'blue'],
            ['Dancing Stone', 'Whispering Woods', null],
            ['Greenleaf Village', 'Ancient Ruins', 'blue'],
            ['Greenleaf Village', 'Mountains of Mist', 'blue'],
            ['Mermaid Harbor', 'Fire River', null],
            ['Mermaid Harbor', 'Land of Amazons', null],
            ['Mermaid Harbor', 'Crystal Hills', null],
            ['Mermaid Harbor', 'Wyvern Forest', null],
            ['Fire River', 'Crystal Hills', null],
            ['Eagle Peak Pass', 'Whispering Woods', 'green'],
            ['Eagle Peak Pass', 'Amarak Peak', 'green'],
            ['Serpent Swamp', 'McCorm Highlands', null],
            ['Whispering Woods', 'Ancient Ruins', null],
            ['Whispering Woods', 'Heaven\'s Glade', null],
            ['Ancient Ruins', 'Heaven\'s Glade', 'blue'],
            ['Mountains of Mist', 'Land of Amazons', null],
            ['Mountains of Mist', 'Withered Hills', null],
            ['Land of Amazons', 'Wyvern Forest', null],
            ['Land of Amazons', 'Cursed Plateau', null],
            ['Crystal Hills', 'Wyvern Forest', null],
            ['McCorm Highlands', 'Amarak Peak', 'green'],
            ['Amarak Peak', 'Ghost Marsh', 'green'],
            ['Amarak Peak', 'Thorny Woods', 'green'],
            ['Heaven\'s Glade', 'Thorny Woods', 'blue'],
            ['Heaven\'s Glade', 'Blizzard Mountains', 'blue'],
            ['Wyvern Forest', 'Cursed Plateau', null],
            ['Blizzard Mountains', 'Withered Hills', 'blue'],
            ['Withered Hills', 'Cursed Plateau', null],
            ['Chimera Inn', 'Withered Hills', null]
        ];
        
        // Draw paths with colors
        // Define general movement paths (from Excel Path entries)
        const generalPaths = {
            'black': [
                ['Dark Woods', 'Windy Pass'],
                ['Windy Pass', 'Sea Bird Port'],
                ['Sea Bird Port', 'Father Oak Forest'],
                ['Father Oak Forest', 'Monarch City']
            ],
            'red': [
                ['Scorpion Canyon', 'Raven Forest'],
                ['Raven Forest', 'Angel Tear Falls'],
                ['Angel Tear Falls', 'Bounty Bay'],
                ['Bounty Bay', 'Monarch City']
            ],
            'green': [
                ['Thorny Woods', 'Amarak Peak'],
                ['Amarak Peak', 'Eagle Peak Pass'],
                ['Eagle Peak Pass', 'Orc Valley'],
                ['Orc Valley', 'Monarch City']
            ],
            'blue': [
                ['Blizzard Mountains', "Heaven's Glade"],
                ["Heaven's Glade", 'Ancient Ruins'],
                ['Ancient Ruins', 'Greenleaf Village'],
                ['Greenleaf Village', 'Monarch City']
            ]
        };
        
        // Build lookup map for colored segments
        const coloredSegments = {};
        for (const [color, segments] of Object.entries(generalPaths)) {
            for (const [loc1, loc2] of segments) {
                const key = [loc1, loc2].sort().join('|');
                coloredSegments[key] = color;
            }
        }
        
        connections.forEach(([loc1, loc2, pathColor]) => {
            const coord1 = this.locationCoords[loc1];
            const coord2 = this.locationCoords[loc2];
            if (coord1 && coord2) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                path.setAttribute('x1', coord1.x);
                path.setAttribute('y1', coord1.y);
                path.setAttribute('x2', coord2.x);
                path.setAttribute('y2', coord2.y);
                
                // Check if this is a general movement path
                const key = [loc1, loc2].sort().join('|');
                const generalColor = coloredSegments[key];
                
                if (generalColor) {
                    // General movement path - invisible (image shows paths)
                    const colorMap = {
                        'black': '#1f2937',
                        'red': '#dc2626',
                        'green': '#16a34a',
                        'blue': '#2563eb'
                    };
                    path.setAttribute('stroke', colorMap[generalColor]);
                    path.setAttribute('stroke-width', '5');
                    path.setAttribute('opacity', '0');
                } else {
                    // Normal path - invisible (image shows paths)
                    path.setAttribute('stroke', '#8B4513');
                    path.setAttribute('stroke-width', '2');
                    path.setAttribute('opacity', '0');
                }
                
                pathsGroup.appendChild(path);
            }
        });
        
        // Draw location circles
        for (let [name, coords] of Object.entries(this.locationCoords)) {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'location-marker');
            g.setAttribute('data-location', name);
            g.style.cursor = 'pointer';
            
            // Color based on faction - used for data only, circles are invisible
            let fillColor = '#8B7355';
            let strokeColor = '#000';
            let radius = 35;
            
            if (coords.type === 'city') {
                fillColor = '#9333EA';
                strokeColor = '#FFD700';
            } else if (coords.type === 'general') {
                strokeColor = '#000';
                if (coords.faction === 'red') fillColor = '#DC2626';
                else if (coords.faction === 'blue') fillColor = '#2563EB';
                else if (coords.faction === 'green') fillColor = '#16A34A';
                else if (coords.faction === 'black') fillColor = '#1F2937';
            } else if (coords.type === 'inn') {
                fillColor = '#9333EA';
                strokeColor = '#FFD700';
                radius = 24;  // 75% of original 32
            } else {
                if (coords.faction === 'red') fillColor = '#EF4444';
                else if (coords.faction === 'blue') fillColor = '#3B82F6';
                else if (coords.faction === 'green') fillColor = '#22C55E';
                else if (coords.faction === 'black') fillColor = '#374151';
                strokeColor = '#000';
            }
            
            // Main circle - invisible but clickable
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', coords.x);
            circle.setAttribute('cy', coords.y);
            circle.setAttribute('r', radius);
            circle.setAttribute('fill', 'transparent');
            circle.setAttribute('stroke', 'none');
            g.appendChild(circle);
            
            // Built Magic Gate token (visible) - only for gates built during gameplay
            if (coords.magicGate && coords.builtGate) {
                const locationRadius = coords.type === 'inn' ? 24 : 35;
                
                const magicGateX = coords.x + locationRadius;
                const magicGateY = coords.y;
                
                const magicGateCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                magicGateCircle.setAttribute('cx', magicGateX);
                magicGateCircle.setAttribute('cy', magicGateY);
                magicGateCircle.setAttribute('r', '12');
                magicGateCircle.setAttribute('fill', '#9333ea');
                magicGateCircle.setAttribute('stroke', '#c084fc');
                magicGateCircle.setAttribute('stroke-width', '2');
                magicGateCircle.setAttribute('filter', 'url(#shadow)');
                g.appendChild(magicGateCircle);
                
                const magicGateIcon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                magicGateIcon.setAttribute('x', magicGateX);
                magicGateIcon.setAttribute('y', magicGateY + 6);
                magicGateIcon.setAttribute('text-anchor', 'middle');
                magicGateIcon.setAttribute('font-size', '16');
                magicGateIcon.setAttribute('pointer-events', 'none');
                magicGateIcon.textContent = '🌀';
                g.appendChild(magicGateIcon);
            }
            
            // Click to show/hide location tooltip (no hover) OR handle movement
            g.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Check if we're in quest use targeting mode
                if (this.questUseMode) {
                    const consumed = this.handleQuestUseClick(name);
                    if (consumed) return;
                }
                
                // Check if we're in archery targeting mode
                if (this.archeryTargeting) {
                    const consumed = this.handleArcheryClick(name);
                    if (consumed) return;
                    // Clicked non-target — cancel archery mode
                    this.clearArcheryMode();
                }
                
                // Check if we're in movement mode
                if (this.activeMovement) {
                    const consumed = this.handleMovementClick(name);
                    if (consumed) return; // Movement handled, don't show tooltip
                }
                
                const tooltip = document.getElementById('hover-tooltip');
                
                // If tooltip is already showing this location, close it
                if (tooltip.classList.contains('active') && 
                    tooltip.getAttribute('data-location') === name) {
                    this.hideTooltip(true);
                } else {
                    // Show tooltip for this location
                    this.showLocationTooltip(name, e);
                }
            });
            
            locationsGroup.appendChild(g);
        }
    },
    
    showLocationTooltip(locationName, event) {
        const tooltip = document.getElementById('hover-tooltip');
        
        // Don't show if there's a stationary hero tooltip open
        if (tooltip.getAttribute('data-stationary') === 'true' || 
            tooltip.getAttribute('data-stationary') === 'modal') {

            return;
        }
        
        const content = document.getElementById('tooltip-content');
        
        const location = this.locationCoords[locationName];
        const minionsHere = this.minions[locationName];
        const heroesHere = this.heroes.filter(h => h.location === locationName);
        const currentHero = this.heroes[this.currentPlayerIndex];
        const isHeroHere = currentHero.location === locationName;
        
        // Add close button to tooltip container (not content)
        let closeBtn = tooltip.querySelector('.tooltip-close-x');
        if (!closeBtn) {
            closeBtn = document.createElement('button');
            closeBtn.className = 'tooltip-close-x';
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = 'position: absolute; top: 10px; right: 10px; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 24px; font-weight: bold; color: #fff; background: rgba(220,38,38,0.9); border: 2px solid #d4af37; border-radius: 50%; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.5);';
            closeBtn.onclick = (e) => { e.stopPropagation(); this.hideTooltip(true); };
            tooltip.appendChild(closeBtn);
        }
        
        let html = '';
        html += `<div class="tooltip-title">${locationName}</div>`;
        
        if (location.type === 'inn') {
            html += `<div class="tooltip-stat">🍺 Inn - Draw 2 cards with Rumors action</div>`;
        } else if (location.type === 'city') {
            html += `<div class="tooltip-stat">👑 Monarch City - Safe Haven</div>`;
        } else if (location.type === 'general') {
            html += `<div class="tooltip-stat">⚠️ General's Lair</div>`;
        }
        
        if (heroesHere.length > 0) {
            html += `<div class="tooltip-stat">👥 Heroes: ${heroesHere.map(h => h.name).join(', ')}</div>`;
        }
        
        if (minionsHere) {
            const totalMinions = Object.values(minionsHere).reduce((a, b) => a + b, 0);
            if (totalMinions > 0) {
                html += `<div class="tooltip-stat">👹 Minions: ${totalMinions}</div>`;
            }
        }
        
        // Show taint crystals
        const taintCount = this.taintCrystals[locationName] || 0;
        if (taintCount > 0) {
            html += `<div class="tooltip-stat" style="color: #9333ea;">💎 Taint Crystals: ${taintCount}</div>`;
        }
        
        // Add action buttons if hero is at this location
        if (isHeroHere) {

            const generalHere = this.generals.find(g => g.location === locationName && !g.defeated);
            const totalMinions = minionsHere ? Object.values(minionsHere).reduce((a, b) => a + b, 0) : 0;
            const isInn = location.type === 'inn';
            const hasTaint = this.taintCrystals[locationName] && this.taintCrystals[locationName] > 0;


            
            const hasCompletableQuest = this.actionsRemaining > 0 && this._getCompletableQuest(currentHero)?.quest?.location === locationName;
            
            if (totalMinions > 0 || generalHere || (isInn && this.actionsRemaining > 0) || hasTaint || (this.actionsRemaining > 0 && !location.magicGate && currentHero.cards.some(c => c.name === locationName)) || hasCompletableQuest) {

                // Escape location name for use in onclick
                const escapedLocation = locationName.replace(/'/g, "\\'");
                html += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #d4af37;">`;
                html += `<div style="font-weight: bold; color: #ffd700; margin-bottom: 5px;">Available Actions:</div>`;
                
                if (totalMinions > 0) {
                    html += `<button class="btn btn-primary" onclick="event.stopPropagation(); game.engageMinionsAtLocation('${escapedLocation}')" style="width: 100%; margin-bottom: 5px;">⚔️ Engage Minions</button>`;
                    // Wizard Fireball
                    if (currentHero.name === 'Wizard') {
                        const minionColors = Object.entries(minionsHere).filter(([c, n]) => n > 0).map(([c]) => c);
                        const hasFireballCard = minionColors.some(color => currentHero.cards.some(card => card.color === color));
                        if (hasFireballCard) {
                            html += `<button class="btn btn-primary" onclick="event.stopPropagation(); game.wizardFireball()" style="width: 100%; margin-bottom: 5px; background: #dc2626;">🔥 Fireball</button>`;
                        }
                    }
                }
                
                if (generalHere && totalMinions === 0) {
                    html += `<button class="btn btn-primary" onclick="event.stopPropagation(); game.attackGeneralAtLocation('${escapedLocation}')" style="width: 100%; margin-bottom: 5px;">👹 Attack General</button>`;
                }
                
                if (isInn && this.actionsRemaining > 0) {
                    const rumorsLeft = 2 - this.rumorsUsedThisTurn;
                    if (rumorsLeft > 0) {
                        html += `<button class="btn" onclick="event.stopPropagation(); game.rumorsAction()" style="width: 100%; background: #d97706; margin-bottom: 5px;">🍺 Rumors</button>`;
                        if (currentHero.name === 'Rogue') {
                            html += `<button class="btn" onclick="event.stopPropagation(); game.craftyAction()" style="width: 100%; background: #7c3aed; margin-bottom: 5px;">🗡️ Crafty</button>`;
                        }
                    } else {
                        html += `<button class="btn" disabled style="width: 100%; background: #666; cursor: not-allowed; opacity: 0.5; margin-bottom: 5px;">🍺 Rumors</button>`;
                        if (currentHero.name === 'Rogue') {
                            html += `<button class="btn" disabled style="width: 100%; background: #666; cursor: not-allowed; opacity: 0.5; margin-bottom: 5px;">🗡️ Crafty</button>`;
                        }
                    }
                }
                
                // Build Magic Gate button
                if (this.actionsRemaining > 0 && !location.magicGate && currentHero.cards.some(c => c.name === locationName)) {
                    html += `<button class="btn" onclick="event.stopPropagation(); game.buildMagicGate()" style="width: 100%; margin-bottom: 5px; background: #9333ea;">💫 Build Magic Gate</button>`;
                }
                
                if (hasTaint && this.actionsRemaining > 0) {
                    const locationColor = location.faction;
                    const isDruid = currentHero.name === 'Druid';
                    const isCleric = currentHero.name === 'Cleric';
                    const hasMatchingCard = currentHero.cards.some(card => card.color === locationColor);
                    
                    if (isDruid) {
                        html += `<button class="btn" onclick="event.stopPropagation(); game.healLandFromLocation('${escapedLocation}')" style="width: 100%; margin-bottom: 5px; background: #9333ea;">🌳 Heal the Land (Druid - Free)</button>`;
                    } else if (isCleric) {
                        html += `<button class="btn" onclick="event.stopPropagation(); game.healLandFromLocation('${escapedLocation}')" style="width: 100%; margin-bottom: 5px; background: #9333ea;">✝️ Sanctify Land</button>`;
                    } else if (hasMatchingCard) {
                        html += `<button class="btn" onclick="event.stopPropagation(); game.healLandFromLocation('${escapedLocation}')" style="width: 100%; margin-bottom: 5px; background: #9333ea;">🌳 Heal the Land</button>`;
                    } else {
                        html += `<button class="btn" disabled style="width: 100%; margin-bottom: 5px; background: #666; cursor: not-allowed; opacity: 0.5;">🌳 Heal the Land</button>`;
                    }
                }
                
                // Heal button - show if hero is wounded and location is safe OR at Inn
                if (this.actionsRemaining > 0 && currentHero.health < currentHero.maxHealth) {
                    // Full heal at Inn (no enemies required)
                    if (isInn) {
                        html += `<button class="btn" onclick="event.stopPropagation(); game.healAtLocation('${escapedLocation}')" style="width: 100%; margin-bottom: 5px; background: #10b981;">❤️ Healing Wounds</button>`;
                    }
                    // Full heal at Monarch City ONLY if safe (no minions or generals)
                    else if (locationName === 'Monarch City' && totalMinions === 0 && !generalHere) {
                        html += `<button class="btn" onclick="event.stopPropagation(); game.healAtLocation('${escapedLocation}')" style="width: 100%; margin-bottom: 5px; background: #10b981;">❤️ Healing Wounds</button>`;
                    }
                    // Heal 2 wounds at safe location (no minions or generals)
                    else if (totalMinions === 0 && !generalHere) {
                        html += `<button class="btn" onclick="event.stopPropagation(); game.healAtLocation('${escapedLocation}')" style="width: 100%; margin-bottom: 5px; background: #10b981;">❤️ Healing Wounds</button>`;
                    }
                }
                
                // Complete Quest button - show if hero has a completable quest at this location
                if (this.actionsRemaining > 0 && locationName === currentHero.location) {
                    const questResult = this._getCompletableQuest(currentHero);
                    if (questResult) {
                        const q = questResult.quest;
                        // Show if: standard quest at this location, OR new quest types (already validated by _getCompletableQuest)
                        const isHere = q.location === locationName || q.mechanic.type === 'build_gate_red' || q.mechanic.type === 'multi_location_action' || q.mechanic.type === 'variable_dice_roll';
                        if (isHere) {
                            // Use specific label for multi-location action quests (requires action spend)
                            const btnLabel = q.mechanic.type === 'multi_location_action'
                                ? `📜 Organize: ${q.name} (1 action)`
                                : `🎯 Complete Quest: ${q.name}`;
                            html += `<button class="btn" onclick="event.stopPropagation(); game.hideTooltip(true); game.completeQuestAction()" style="width: 100%; margin-bottom: 5px; background: #dc2626;">${btnLabel}</button>`;
                        }
                    }
                }
                
                // Use Quest Card button - show if hero has a completed usable quest applicable here
                if (currentHero.questCards) {
                    const heroIdx = this.currentPlayerIndex;
                    currentHero.questCards.forEach((quest, qIdx) => {
                        if (quest.completed && !quest.discarded && quest.mechanic && quest.mechanic.rewardType === 'use_quest_card_anytime') {
                            if (quest.mechanic.rewardValue === 'remove_taint') {
                                const hasTaintHere = this.taintCrystals[locationName] && this.taintCrystals[locationName] > 0;
                                if (quest.mechanic.requirePresence) {
                                    // Must be on the space - only show at hero's location
                                    if (locationName === currentHero.location && hasTaintHere) {
                                        html += `<button class="btn" onclick="event.stopPropagation(); game.hideTooltip(true); game.useCompletedQuestCard(${heroIdx}, ${qIdx})" style="width: 100%; margin-bottom: 5px; background: #4ade80; color: #000; font-weight: bold;">✨ Use: ${quest.name}</button>`;
                                    }
                                } else {
                                    // Can use from anywhere - show button that opens map targeting
                                    if (locationName === currentHero.location) {
                                        html += `<button class="btn" onclick="event.stopPropagation(); game.hideTooltip(true); game.useCompletedQuestCard(${heroIdx}, ${qIdx})" style="width: 100%; margin-bottom: 5px; background: #4ade80; color: #000; font-weight: bold;">✨ Use: ${quest.name}</button>`;
                                    }
                                }
                            }
                        }
                    });
                }
                
                html += `</div>`;
            }
        } else {

            // Check if hero can move to this location (connected by path)
            const canMove = this.areLocationsConnected(currentHero.location, locationName);

            // Check if wizard can teleport (has any card since no card is required)
            const isWizard = currentHero.name === 'Wizard';
            const locationFaction = this.locationCoords[locationName].faction;
            // Wizard can teleport to ANY location if they have at least one card and haven't used it this turn
            const hasMatchingCard = isWizard && currentHero.cards.length > 0 && !this.wizardTeleportUsedThisTurn;
            
            if (canMove && this.actionsRemaining > 0) {
                // Escape location name for use in onclick
                const escapedLocation = locationName.replace(/'/g, "\\'");
                html += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #d4af37;">`;
                html += `<div style="font-weight: bold; color: #ffd700; margin-bottom: 5px;">Available Actions:</div>`;
                html += `<button class="btn btn-primary" onclick="event.stopPropagation(); game.hideTooltip(true); game.moveToLocation('${escapedLocation}')" style="width: 100%; margin-bottom: 5px;" title="Move to ${escapedLocation} by foot (1 action)">🥾 Foot</button>`;
                
                // Ranger Archery: direct ranged attack at connected location
                if (currentHero.name === 'Ranger') {
                    const targetMinions = minionsHere ? Object.values(minionsHere).reduce((a, b) => a + b, 0) : 0;
                    if (targetMinions > 0) {
                        html += `<button class="btn btn-primary" onclick="event.stopPropagation(); game.engageMinionsAtLocation('${escapedLocation}')" style="width: 100%; margin-bottom: 5px;">🏹 Archery</button>`;
                    }
                }
                
                // Add teleport button for wizard with matching card
                if (hasMatchingCard) {
                    html += `<button class="btn" onclick="event.stopPropagation(); game.showWizardTeleport('${escapedLocation}')" style="width: 100%; background: #9333ea;">✨ Teleport</button>`;
                } else if (isWizard && this.wizardTeleportUsedThisTurn) {
                    html += `<button class="btn" disabled style="width: 100%; background: #666; opacity: 0.5; cursor: not-allowed;">✨ Teleport (used this turn)</button>`;
                }
                
                html += `</div>`;
            } else if (!canMove && hasMatchingCard && this.actionsRemaining > 0) {
                // Can't walk but wizard can teleport
                const escapedLocation = locationName.replace(/'/g, "\\'");
                html += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #d4af37;">`;
                html += `<div style="font-weight: bold; color: #ffd700; margin-bottom: 5px;">Available Actions:</div>`;
                html += `<button class="btn" onclick="event.stopPropagation(); game.showWizardTeleport('${escapedLocation}')" style="width: 100%; background: #9333ea;">✨ Teleport</button>`;
                html += `</div>`;
                html += `<div style="margin-top: 10px; padding: 8px; background: rgba(255,165,0,0.2); border-radius: 5px; font-size: 0.9em;">
                    ⚠️ No path - but Wizard can teleport!
                </div>`;
            } else if (!canMove) {
                html += `<div style="margin-top: 10px; padding: 8px; background: rgba(255,0,0,0.2); border-radius: 5px; font-size: 0.9em;">
                    ❌ No path connects ${currentHero.location} to ${locationName}
                </div>`;
            } else if (this.actionsRemaining === 0) {
                html += `<div style="margin-top: 10px; padding: 8px; background: rgba(255,0,0,0.2); border-radius: 5px; font-size: 0.9em;">
                    ❌ No actions remaining
                </div>`;
            }
        }
        
        html += `<div style="font-size: 0.8em; color: #999; margin-top: 8px; font-style: italic;">Click location or × to close</div>`;
        
        content.innerHTML = html;
        tooltip.classList.add('active');
        tooltip.setAttribute('data-stationary', 'location'); // Mark as location tooltip
        tooltip.setAttribute('data-location', locationName); // Track which location
        
        // Position using updateTooltipPosition to stay within SVG bounds
        tooltip.style.position = 'absolute'; // Use absolute, not fixed
        tooltip.style.setProperty('z-index', '20000', 'important');
        tooltip.style.border = '';
        tooltip.style.background = '';
        
        // Use the same positioning logic as minion/general tooltips
        this.updateTooltipPosition(event);
    },
    
    showGeneralTooltip(general, event) {
        const tooltip = document.getElementById('hover-tooltip');
        
        // Don't show if there's a stationary tooltip open
        if (tooltip.getAttribute('data-stationary') === 'true') {
            return;
        }
        
        const content = document.getElementById('tooltip-content');
        
        // Check if hero is at same location
        const currentHero = this.heroes[this.currentPlayerIndex];
        const heroAtLocation = currentHero && currentHero.location === general.location;
        const minionsHere = this.minions[general.location];
        const totalMinions = minionsHere ? Object.values(minionsHere).reduce((a, b) => a + b, 0) : 0;
        
        let actionsHTML = '';
        if (heroAtLocation && !general.defeated && this.actionsRemaining > 0) {
            const escapedLocation = general.location.replace(/'/g, "\\'");
            actionsHTML = `
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #d4af37;">
                    <div style="font-weight: bold; color: #ffd700; margin-bottom: 5px;">Available Actions:</div>
            `;
            
            if (totalMinions > 0) {
                actionsHTML += `<button class="btn btn-primary" onclick="event.stopPropagation(); game.engageMinionsAtLocation('${escapedLocation}')" style="width: 100%; margin-bottom: 5px;">⚔️ Engage Minions (${totalMinions})</button>`;
                // Wizard Fireball
                if (currentHero.name === 'Wizard') {
                    const minionColors = Object.entries(minionsHere).filter(([c, n]) => n > 0).map(([c]) => c);
                    const hasFireballCard = minionColors.some(color => currentHero.cards.some(card => card.color === color));
                    if (hasFireballCard) {
                        actionsHTML += `<button class="btn btn-primary" onclick="event.stopPropagation(); game.wizardFireball()" style="width: 100%; margin-bottom: 5px; background: #dc2626;">🔥 Fireball</button>`;
                    }
                }
            } else {
                actionsHTML += `<button class="btn btn-primary" onclick="event.stopPropagation(); game.attackGeneralAtLocation('${escapedLocation}')" style="width: 100%; margin-bottom: 5px;">👹 Attack General</button>`;
            }
            
            actionsHTML += `</div>`;
        }
        
        // Add close button to tooltip container (not content)
        let closeBtn = tooltip.querySelector('.tooltip-close-x');
        if (!closeBtn) {
            closeBtn = document.createElement('button');
            closeBtn.className = 'tooltip-close-x';
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = 'position: absolute; top: 10px; right: 10px; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 24px; font-weight: bold; color: #fff; background: rgba(220,38,38,0.9); border: 2px solid #d4af37; border-radius: 50%; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.5);';
            closeBtn.onclick = (e) => { e.stopPropagation(); this.hideTooltip(true); };
            tooltip.appendChild(closeBtn);
        }
        
        // Wound status for tooltip
        let woundStatusHTML = '';
        const wound = this.generalWounds[general.color];
        if (wound && !general.defeated) {
            const wColor = wound.type === 'major' ? '#ef4444' : '#f59e0b';
            const wLabel = wound.type === 'major' ? '⚠️ MAJOR WOUNDS' : '⚔️ Minor Wounds';
            const healStatus = wound.healingCountdown > 0 
                ? `Not healing (${wound.healingCountdown} turn${wound.healingCountdown !== 1 ? 's' : ''})` 
                : 'Healing (+1 HP/turn)';
            const statusColor = wound.healingCountdown > 0 ? '#999' : '#4ade80';
            woundStatusHTML = `<div class="tooltip-stat" style="margin-top: 5px; padding: 4px 6px; border: 1px solid ${wColor}; border-radius: 4px; background: rgba(0,0,0,0.3);">
                <span style="color: ${wColor}; font-weight: bold;">${wLabel}</span><br>
                <span style="color: ${statusColor}; font-size: 0.9em;">${healStatus}</span>
                ${wound.type === 'major' ? '<br><span style="color: #ef4444; font-size: 0.85em;">🚫 Cannot advance</span>' : ''}
            </div>`;
        }
        
        content.innerHTML = `
            <div class="tooltip-title" style="color: ${this.getGeneralTooltipNameColor(general)};">${general.symbol} ${general.name}</div>
            <div class="tooltip-stat">${this.getGeneralLifeTokensHTML(general)}</div>
            <div class="tooltip-stat"><span style="color: #ffd700; font-weight: bold;">Location:</span> ${general.location}</div>
            <div class="tooltip-stat"><span style="color: #ffd700; font-weight: bold;">Combat Skill:</span> ${this.getGeneralCombatSkillDesc(general)}</div>
            <div class="tooltip-stat"><span style="color: #ffd700; font-weight: bold;">Hero Defeated:</span> ${this.getGeneralPenaltyDesc(general)}</div>
            ${woundStatusHTML}
            ${general.defeated ? '<div class="tooltip-stat" style="color: #4ade80; margin-top: 5px;">✓ DEFEATED</div>' : ''}
            ${actionsHTML}
        `;
        
        tooltip.classList.add('active');
        tooltip.setAttribute('data-stationary', 'false');
        this.updateTooltipPosition(event);
    },
    
    showHeroCardsTooltip(hero, event, stationary = false) {
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
                const cardName = card.name.replace(/'/g, "\\'");
                const generalWithFaction = colorToGeneralWithFaction[card.color] || 'Any General';
                const cardIcon = card.icon || '🎴';
                cardsHTML += `
                    <div class="hero-card-item-${cardIndex}" data-card-index="${cardIndex}"
                         style="padding: 8px; margin: 5px 0; border-left: 3px solid ${borderColor}; background: rgba(0,0,0,0.3); cursor: pointer; border-radius: 3px; transition: background 0.2s;">
                        <div style="font-weight: bold; color: ${borderColor};">${cardIcon} ${card.name}</div>
                        <div style="font-size: 0.85em;">${card.special ? "🌟 Special — Play anytime" : "🎲 " + card.dice + " dice vs " + generalWithFaction}</div>
                    </div>
                `;
            });
            cardsHTML += '</div>';
        }
        
        // Add close button to tooltip container if stationary (not content)
        if (stationary) {
            let closeBtn = tooltip.querySelector('.tooltip-close-x');
            if (!closeBtn) {
                closeBtn = document.createElement('button');
                closeBtn.className = 'tooltip-close-x';
                closeBtn.innerHTML = '×';
                closeBtn.style.cssText = 'position: absolute; top: 10px; right: 10px; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 24px; font-weight: bold; color: #fff; background: rgba(220,38,38,0.9); border: 2px solid #d4af37; border-radius: 50%; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.5);';
                closeBtn.onclick = (e) => { e.stopPropagation(); this.hideTooltip(true); };
                tooltip.appendChild(closeBtn);
            }
        }
        
        // Check if Druid or Cleric is on a location with taint
        const hasTaint = this.taintCrystals[hero.location] && this.taintCrystals[hero.location] > 0;
        const isDruid = hero.name === 'Druid';
        const isCleric = hero.name === 'Cleric';
        const canRemoveTaint = (isDruid || isCleric) && hasTaint && this.actionsRemaining > 0;
        
        let actionButtonsHTML = '';
        if (canRemoveTaint) {
            const escapedLocation = hero.location.replace(/'/g, "\\'");
            const abilityLabel = isDruid ? 'Druid Ability' : 'Cleric Ability';
            const buttonIcon = isDruid ? '🌳' : '✝️';
            const buttonText = isDruid ? 'Heal the Land Crystal (No card needed!)' : 'Sanctify Land';
            actionButtonsHTML = `
                <div style="margin: 10px 0; padding: 10px; border-top: 1px solid #d4af37; border-bottom: 1px solid #d4af37;">
                    <div style="font-weight: bold; color: #ffd700; margin-bottom: 5px;">${abilityLabel}:</div>
                    <button class="btn" onclick="event.stopPropagation(); game.healLandFromLocation('${escapedLocation}')" 
                            style="width: 100%; background: #9333ea; margin-bottom: 5px;">
                        ${buttonIcon} ${buttonText}
                    </button>
                    <div style="font-size: 0.85em; color: #d4af37; font-style: italic;">
                        Roll 2 dice, remove on 5 or 6
                    </div>
                </div>
            `;
        }
        
        // Eagle Rider attack style badge for tooltip
        let attackStyleTooltipHTML = '';
        if (hero.name === 'Eagle Rider' && this.eagleRiderAttackStyle) {
            const isSky = this.eagleRiderAttackStyle === 'sky';
            const badgeBg = isSky ? 'rgba(96, 165, 250, 0.3)' : 'rgba(245, 158, 11, 0.3)';
            const badgeBorder = isSky ? '#60a5fa' : '#f59e0b';
            const badgeColor = isSky ? '#60a5fa' : '#f59e0b';
            const badgeText = isSky ? '☁️ Sky' : '⚔️ Ground';
            attackStyleTooltipHTML = ` <span style="margin-left: 6px; padding: 2px 7px; border-radius: 4px; font-size: 0.75em; font-weight: bold; vertical-align: top;
                background: ${badgeBg}; border: 1px solid ${badgeBorder}; color: ${badgeColor};">${badgeText}</span>`;
        }
        
        // Sorceress Shape Shifter badge for tooltip
        if (hero.name === 'Sorceress' && this.heroes.indexOf(hero) === this.currentPlayerIndex) {
            if (this.shapeshiftForm) {
                const sfNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
                const sfIcons = { green: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#16a34a;border:1.5px solid #000;vertical-align:middle;"></span>', black: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#1f2937;border:1.5px solid #000;vertical-align:middle;"></span>', red: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#dc2626;border:1.5px solid #000;vertical-align:middle;"></span>', blue: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#2563eb;border:1.5px solid #000;vertical-align:middle;"></span>' };
                const sfColors = { green: '#16a34a', black: '#6b7280', red: '#dc2626', blue: '#3b82f6' };
                attackStyleTooltipHTML += ` <span style="margin-left: 4px; padding: 2px 7px; border-radius: 4px; font-size: 0.75em; font-weight: bold; vertical-align: top;
                    background: rgba(236,72,153,0.2); border: 1px solid ${sfColors[this.shapeshiftForm]}; color: ${sfColors[this.shapeshiftForm]};"><span class="shapeshift-desktop">${sfIcons[this.shapeshiftForm]} ${sfNames[this.shapeshiftForm]}</span><span class="shapeshift-mobile">${sfIcons[this.shapeshiftForm]}</span></span>`;
            } else {
                attackStyleTooltipHTML += ` <span style="margin-left: 4px; padding: 2px 7px; border-radius: 4px; font-size: 0.75em; font-weight: bold; vertical-align: top;
                    background: rgba(236,72,153,0.1); border: 1px solid #ec4899; color: #ec4899;">⚡ Normal</span>`;
            }
        }
        
        const titlePadding = attackStyleTooltipHTML ? 'padding-bottom: 8px;' : '';
        
        content.innerHTML = `
            <div class="tooltip-title" style="color: ${hero.color}; ${titlePadding}">${hero.symbol} ${hero.name}${attackStyleTooltipHTML}</div>
            <div class="tooltip-stat">${this.getTooltipLifeTokensHTML(hero)}</div>
            <div class="tooltip-stat">${this.getTooltipActionsHTML(hero)}</div>
            <div class="tooltip-stat"><span style="color: #ffd700; font-weight: bold;">Location:</span> ${hero.location}</div>
            ${actionButtonsHTML}
            <div class="tooltip-stat" style="margin-top: 5px;">${this.getTooltipCardsHTML(hero)}</div>
            <div id="hero-cards-list" style="max-height: 250px; overflow-y: auto;">
                ${cardsHTML}
            </div>
            ${stationary ? '<div style="font-size: 0.8em; color: #999; margin-top: 8px; font-style: italic;">Click hero, outside, or × to close • Click cards for details</div>' : 
                           '<div style="font-size: 0.8em; color: #999; margin-top: 8px; font-style: italic;">Hover over cards for details</div>'}
        `;
        
        tooltip.classList.add('active');
        tooltip.setAttribute('data-stationary', stationary ? 'true' : 'false');
        tooltip.setAttribute('data-hero-name', hero.name); // Track which hero
        this.updateTooltipPosition(event);
        
        // Add click event listeners to card items after rendering
        setTimeout(() => {
            hero.cards.forEach((card, cardIndex) => {
                const cardElement = content.querySelector(`.hero-card-item-${cardIndex}`);
                if (cardElement) {
                    cardElement.addEventListener('click', (e) => {
                        e.stopPropagation();
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
        }, 10);
    },
    
    showCardDetailModal(card) {
        console.log('showCardDetailModal called with card:', card);
        
        const modal = document.getElementById('card-detail-modal');
        const content = document.getElementById('card-detail-content');
        
        console.log('Modal element:', modal);
        console.log('Content element:', content);
        
        if (!modal) {
            console.error('Card detail modal not found!');
            this.showInfoModal('⚠️', '<div>Error: Card detail modal not found!</div>');
            return;
        }
        
        if (!content) {
            console.error('Card detail content not found!');
            this.showInfoModal('⚠️', '<div>Error: Card detail content not found!</div>');
            return;
        }
        
        const colorMap = {
            'red': '#dc2626',
            'blue': '#2563eb',
            'green': '#16a34a',
            'black': '#1f2937'
        };
        
        const colorToGeneral = {
            'red': 'Balazarg (Demons)',
            'blue': 'Sapphire (Dragonkin)',
            'green': 'Gorgutt (Orcs)',
            'black': 'Varkolak (Undead)'
        };
        
        const colorToFaction = {
            'red': 'Demons',
            'blue': 'Dragonkin',
            'green': 'Orcs',
            'black': 'Undead'
        };
        
        const borderColor = (card.special ? '#9333ea' : (colorMap[card.color] || '#8B7355'));
        const general = colorToGeneral[card.color] || 'Any General';
        const faction = colorToFaction[card.color] || 'any';
        
        content.innerHTML = `
            <div style="border: 3px solid ${borderColor}; border-radius: 8px; padding: 20px; background: linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%);">
                <div style="text-align: center; font-size: 1.5em; margin-bottom: 10px;">
                    ${card.icon || '🎴'}
                </div>
                <div style="text-align: center; font-size: 1.3em; font-weight: bold; color: ${borderColor}; margin-bottom: 15px;">
                    ${card.name}
                </div>
                <div style="text-align: center; margin: 15px 0;">
                    ${Array(card.dice).fill(0).map(() => 
                        `<span style="display: inline-block; width: 35px; height: 35px; background: ${borderColor}; border-radius: 4px; margin: 3px; line-height: 35px; font-weight: bold; font-size: 1.2em;">🎲</span>`
                    ).join('')}
                </div>
                ${card.special ? `
                    <div style="text-align: center; font-size: 1.1em; margin: 15px 0; color: #9333ea;">
                        <strong>🌟 Special Card</strong>
                    </div>
                    <div style="margin-top: 10px; padding: 10px; background: rgba(147,51,234,0.15); border-radius: 4px; border: 1px solid #9333ea;">
                        <strong style="color: #9333ea;">Effect:</strong> ${card.description || 'Special ability'}
                    </div>
                    <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px; font-size: 0.95em;">
                        <strong>Play anytime</strong> — Does not use an action<br>
                        <strong>OR</strong> use ${card.dice} dice in combat vs ${general}
                    </div>
                ` : `
                    <div style="text-align: center; font-size: 1.1em; margin: 15px 0;">
                        <strong>Roll ${card.dice} dice against ${faction} generals</strong>
                    </div>
                    <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 4px;">
                        <strong>Target:</strong> ${general}
                    </div>
                    <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px; font-size: 0.95em;">
                        <strong>Location:</strong> Can be used at ${card.name} or to fight any ${faction} general
                    </div>
                `}
            </div>
        `;
        
        console.log('Setting modal content and activating...');
        modal.classList.add('active');
        console.log('Modal activated, classList:', modal.classList.toString());
        console.log('Modal style.display:', modal.style.display);
    },
    
    closeCardDetail() {
        const modal = document.getElementById('card-detail-modal');
        modal.classList.remove('active');
    },
    
    showMinionTooltip(location, event) {
        const tooltip = document.getElementById('hover-tooltip');
        
        // Don't show if there's a stationary tooltip open
        if (tooltip.getAttribute('data-stationary') === 'true') {
            return;
        }
        
        const content = document.getElementById('tooltip-content');
        const minionsObj = this.minions[location];
        
        let html = `<div class="tooltip-title">Minions at ${location}</div>`;
        
        for (let [color, count] of Object.entries(minionsObj)) {
            if (count > 0) {
                const colorName = color.charAt(0).toUpperCase() + color.slice(1);
                html += `<div class="tooltip-stat">${colorName}: ${count}</div>`;
            }
        }
        
        content.innerHTML = html;
        tooltip.classList.add('active');
        tooltip.setAttribute('data-stationary', 'false');
        this.updateTooltipPosition(event);
    },
    
    updateTooltipPosition(event) {
        const tooltip = document.getElementById('hover-tooltip');
        const container = document.getElementById('board-container');
        const containerRect = container.getBoundingClientRect();
        
        // Force tooltip to render to get accurate dimensions
        tooltip.style.visibility = 'hidden';
        tooltip.style.display = 'block';
        const tooltipRect = tooltip.getBoundingClientRect();
        tooltip.style.visibility = '';
        tooltip.style.display = '';
        
        const tooltipWidth = tooltipRect.width || 300;
        const tooltipHeight = tooltipRect.height || 200;
        
        // Detect mobile/small screens
        const isMobile = window.innerWidth < 768;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (isMobile) {
            // On mobile, center the tooltip and make it easier to access
            const margin = 10;
            
            // Center horizontally with small margins
            const maxWidth = Math.min(viewportWidth - (margin * 2), 400);
            tooltip.style.maxWidth = maxWidth + 'px';
            
            const x = (viewportWidth - maxWidth) / 2;
            
            // Position vertically - prefer bottom half for easier thumb access
            let y;
            if (tooltipHeight + (margin * 2) < viewportHeight) {
                // Tooltip fits - position in lower third for easy thumb access
                y = Math.max(margin, viewportHeight - tooltipHeight - 100);
            } else {
                // Tooltip too tall - position at top with scrolling enabled
                y = margin;
            }
            
            tooltip.style.left = x + 'px';
            tooltip.style.top = y + 'px';
            tooltip.style.position = 'fixed';
            tooltip.style.zIndex = '20000';
        } else {
            // Desktop - position near click location
            const clickX = event.clientX - containerRect.left;
            const clickY = event.clientY - containerRect.top;
            
            const isTopHalf = clickY < containerRect.height / 2;
            const margin = 20;
            
            let x = clickX + 15;
            let y;
            
            if (isTopHalf) {
                // Show tooltip BELOW
                y = clickY + 40;
                
                if (y + tooltipHeight + margin > containerRect.height) {
                    y = containerRect.height - tooltipHeight - margin;
                }
            } else {
                // Show tooltip ABOVE
                y = clickY - tooltipHeight - 40;
                
                if (y < margin) {
                    y = margin;
                }
            }
            
            // Final vertical bounds check
            if (y < margin) {
                y = margin;
            }
            if (y + tooltipHeight > containerRect.height - margin) {
                y = Math.max(margin, containerRect.height - tooltipHeight - margin);
            }
            
            // Keep tooltip in horizontal bounds
            if (x + tooltipWidth > containerRect.width - margin) {
                x = clickX - tooltipWidth - 15;
            }
            if (x < margin) {
                x = margin;
            }
            
            // Ensure tooltip stays fully visible
            if (x + tooltipWidth > containerRect.width) {
                x = containerRect.width - tooltipWidth - 10;
            }
            
            // Convert container coordinates to viewport coordinates
            tooltip.style.left = (containerRect.left + x) + 'px';
            tooltip.style.top = (containerRect.top + y) + 'px';
            tooltip.style.position = 'fixed';
            tooltip.style.zIndex = '20000';
        }
    },
    
    hideTooltip(force = false) {
        const tooltip = document.getElementById('hover-tooltip');
        const stationaryAttr = tooltip.getAttribute('data-stationary');
        const isStationary = stationaryAttr === 'true' || stationaryAttr === 'modal' || stationaryAttr === 'location';
        
        // Only hide if forcing (click outside/close button) or if not stationary
        if (force || !isStationary) {
            tooltip.classList.remove('active');
            tooltip.setAttribute('data-stationary', 'false');
            tooltip.removeAttribute('data-location');
            tooltip.removeAttribute('data-hero-name');
        }
    },
    
    renderTokens() {
        const tokenLayer = document.getElementById('token-layer-svg');
        if (!tokenLayer) return;
        
        tokenLayer.innerHTML = '';
        
        // Render hero tokens - positioned in quadrants INSIDE location
        this.heroes.forEach((hero, index) => {
            const coords = this.locationCoords[hero.location];
            if (!coords) return;
            
            // Get location radius
            const locationRadius = coords.type === 'inn' ? 24 : 35;
            
            // Hero token is 20px radius (can extend past location edge)
            const heroRadius = 20;
            
            // Count how many heroes at this location
            const heroesHere = this.heroes.filter(h => h.location === hero.location);
            const heroIndexAtLocation = heroesHere.indexOf(hero);
            
            // Position heroes so they TOUCH the quadrant centerlines (vertical and horizontal)
            // Quadrant centerlines are at x=0 and y=0 (relative to location center)
            // Hero should touch these lines with its edge
            // 
            // For a hero in top-left quadrant:
            // - Right edge touches vertical centerline (x=0): center at x = -heroRadius
            // - Bottom edge touches horizontal centerline (y=0): center at y = -heroRadius
            //
            // This means center is at (-heroRadius, -heroRadius)
            
            // Quadrant positions based on player order:
            // Player 1: top-left, Player 2: top-right, Player 3: bottom-left, Player 4: bottom-right
            const quadrantOffsets = [
                { x: -heroRadius, y: -heroRadius },  // Top-left (Player 1) - right & bottom edges touch centerlines
                { x: heroRadius, y: -heroRadius },   // Top-right (Player 2) - left & bottom edges touch centerlines
                { x: -heroRadius, y: heroRadius },   // Bottom-left (Player 3) - right & top edges touch centerlines
                { x: heroRadius, y: heroRadius }     // Bottom-right (Player 4) - left & top edges touch centerlines
            ];
            
            const offset = quadrantOffsets[heroIndexAtLocation] || { x: 0, y: 0 };
            
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'hero-token-svg');
            g.setAttribute('data-hero-index', index);
            
            // Only active player's hero is draggable
            if (index === this.currentPlayerIndex) {
                g.style.cursor = 'move';
            } else {
                g.style.cursor = 'pointer';  // Changed from 'default' to show it's clickable
            }
            
            // Hero circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', coords.x + offset.x);
            circle.setAttribute('cy', coords.y + offset.y);
            circle.setAttribute('r', heroRadius);
            circle.setAttribute('fill', hero.color);
            circle.setAttribute('stroke', index === this.currentPlayerIndex ? '#FFD700' : '#000');
            circle.setAttribute('stroke-width', index === this.currentPlayerIndex ? '3' : '2');
            circle.setAttribute('filter', 'url(#shadow)');
            g.appendChild(circle);
            
            // Hero symbol - larger font for 20px radius
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', coords.x + offset.x);
            text.setAttribute('y', coords.y + offset.y + 7);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '22');
            text.setAttribute('pointer-events', 'none');
            text.textContent = hero.symbol;
            g.appendChild(text);
            
            // Click handling is done at SVG level in setupDragAndDrop()
            
            tokenLayer.appendChild(g);
        });
        
        // Render general tokens
        this.generals.forEach(general => {
            if (general.defeated) return;
            
            const coords = this.locationCoords[general.location];
            if (!coords) return;
            
            // Check if there are minions at this location
            const minionsHere = this.minions[general.location];
            const totalMinions = minionsHere ? Object.values(minionsHere).reduce((a, b) => a + b, 0) : 0;
            const canAttack = totalMinions === 0;
            
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('data-general', general.name);
            g.style.cursor = 'pointer';  // Always pointer - shows it's clickable for info
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', coords.x);
            circle.setAttribute('cy', coords.y);  // Centered in location
            circle.setAttribute('r', '20');  // Shrunk from 28 to 20
            circle.setAttribute('fill', this.getGeneralTokenColor(general));
            circle.setAttribute('stroke', canAttack ? '#FFD700' : '#000');
            circle.setAttribute('stroke-width', canAttack ? '3' : '2');
            circle.setAttribute('filter', 'url(#shadow)');
            if (!canAttack) {
                circle.setAttribute('opacity', '0.6');
            }
            g.appendChild(circle);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', coords.x);
            text.setAttribute('y', coords.y + 6);  // Centered in location
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '18');  // Smaller font from 26 to 18
            text.setAttribute('pointer-events', 'none');
            text.textContent = general.symbol;
            g.appendChild(text);
            
            // Click to show tooltip or attack
            g.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const tooltip = document.getElementById('hover-tooltip');
                
                // If tooltip is showing for this general, close it
                if (tooltip.classList.contains('active') && 
                    tooltip.getAttribute('data-general-name') === general.name) {
                    this.hideTooltip(true);
                    return;
                }
                
                // Show tooltip
                this.showGeneralTooltip(general, e);
                tooltip.setAttribute('data-general-name', general.name);
            });
            
            tokenLayer.appendChild(g);
        });
        
        // Render minion tokens - positioned at edges based on faction
        // Black (NW) = top-left edge, Green (NE) = top-right edge, Blue (SE) = bottom-right edge, Red (SW) = bottom-left edge
        for (let [location, minionsObj] of Object.entries(this.minions)) {
            const coords = this.locationCoords[location];
            if (!coords) continue;
            
            const totalMinions = Object.values(minionsObj).reduce((a, b) => a + b, 0);
            if (totalMinions === 0) continue;
            
            const locationRadius = this.locationCoords[location].type === 'inn' ? 24 : 35;
            
            // Position minions at edge corners (using 45-degree angles)
            const angleOffset = locationRadius * Math.sqrt(2) / 2; // Distance to corner from center
            const colorPositions = {
                'black': { baseX: -angleOffset, baseY: -angleOffset },     // Top-left corner
                'green': { baseX: angleOffset, baseY: -angleOffset },      // Top-right corner
                'blue': { baseX: angleOffset, baseY: angleOffset },        // Bottom-right corner
                'red': { baseX: -angleOffset, baseY: angleOffset }         // Bottom-left corner
            };
            
            for (let [color, count] of Object.entries(minionsObj)) {
                if (count === 0) continue;
                
                const pos = colorPositions[color];
                if (!pos) continue;
                
                // Create clickable group for this color's minions
                const minionColorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                minionColorGroup.style.cursor = 'pointer';
                minionColorGroup.setAttribute('data-location', location);
                minionColorGroup.setAttribute('data-color', color);
                
                // Draw token at edge corner
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', coords.x + pos.baseX);
                circle.setAttribute('cy', coords.y + pos.baseY);
                circle.setAttribute('r', '12');
                circle.setAttribute('fill', this.getMinionColor(color));
                circle.setAttribute('stroke', '#000');
                circle.setAttribute('stroke-width', '2');
                minionColorGroup.appendChild(circle);
                
                // Add count number (always show, even for 1 minion)
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', coords.x + pos.baseX);
                text.setAttribute('y', coords.y + pos.baseY); // Centered vertically with dominant-baseline
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '14');
                text.setAttribute('font-weight', 'bold');
                text.setAttribute('fill', '#000');
                text.setAttribute('stroke', '#fff');
                text.setAttribute('stroke-width', '3');
                text.setAttribute('paint-order', 'stroke');
                text.setAttribute('pointer-events', 'none');
                text.setAttribute('dominant-baseline', 'central'); // Center vertically
                text.textContent = count;
                minionColorGroup.appendChild(text);
                
                // Click to show tooltip or attack
                minionColorGroup.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent location click
                    
                    const hero = this.heroes[this.currentPlayerIndex];
                    const tooltip = document.getElementById('hover-tooltip');
                    
                    // If tooltip is showing for this minion group, close it
                    if (tooltip.classList.contains('active') && 
                        tooltip.getAttribute('data-minion-location') === location &&
                        tooltip.getAttribute('data-minion-color') === color) {
                        this.hideTooltip(true);
                        return;
                    }
                    
                    // Show tooltip
                    this.showMinionTooltip(location, e);
                    tooltip.setAttribute('data-minion-location', location);
                    tooltip.setAttribute('data-minion-color', color);
                });
                
                tokenLayer.appendChild(minionColorGroup);
            }
        }
        
        // Render taint crystals - positioned at TOP edge, halfway through like minions
        for (let [location, count] of Object.entries(this.taintCrystals)) {
            if (count === 0) continue;
            
            const coords = this.locationCoords[location];
            if (!coords) continue;
            
            const locationRadius = coords.type === 'inn' ? 24 : 35;
            
            // Position at top center of location, halfway through edge
            const taintGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            taintGroup.style.cursor = 'pointer'; // Make it clear it's clickable
            
            // Top edge position (halfway through like minions)
            const taintY = coords.y - locationRadius;
            
            // Create diamond path (rotated square) - slightly larger than minion for visibility
            const diamondSize = 14; // Slightly larger than minion radius (12)
            const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const diamondPath = `
                M ${coords.x},${taintY - diamondSize} 
                L ${coords.x + diamondSize},${taintY} 
                L ${coords.x},${taintY + diamondSize} 
                L ${coords.x - diamondSize},${taintY} 
                Z
            `;
            diamond.setAttribute('d', diamondPath);
            diamond.setAttribute('fill', '#9333EA'); // Purple crystal
            diamond.setAttribute('stroke', '#000');
            diamond.setAttribute('stroke-width', '2');
            diamond.setAttribute('filter', 'url(#shadow)');
            taintGroup.appendChild(diamond);
            
            // Add counter INSIDE the crystal - same style as minion counter
            const counterText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            counterText.setAttribute('x', coords.x);
            counterText.setAttribute('y', taintY); // Centered in diamond
            counterText.setAttribute('text-anchor', 'middle');
            counterText.setAttribute('font-size', '14'); // Match minion counter
            counterText.setAttribute('font-weight', 'bold');
            counterText.setAttribute('fill', '#000'); // Black fill
            counterText.setAttribute('stroke', '#fff'); // White stroke
            counterText.setAttribute('stroke-width', '3'); // Match minion counter
            counterText.setAttribute('paint-order', 'stroke'); // Stroke behind fill
            counterText.setAttribute('dominant-baseline', 'central'); // Center vertically
            counterText.setAttribute('pointer-events', 'none');
            counterText.textContent = count;
            taintGroup.appendChild(counterText);
            
            // Add click tooltip (consistent with other map elements)
            taintGroup.addEventListener('click', (e) => {
                e.stopPropagation();
                const tooltip = document.getElementById('hover-tooltip');
                
                // If tooltip is already showing for this taint, close it
                if (tooltip.classList.contains('active') && 
                    tooltip.getAttribute('data-taint-location') === location) {
                    this.hideTooltip(true);
                } else {
                    // Show tooltip for this taint
                    this.showTooltip(`💎 Taint Crystal${count > 1 ? 's' : ''}: ${count}`, e);
                    tooltip.setAttribute('data-taint-location', location);
                }
            });
            
            tokenLayer.appendChild(taintGroup);
        }
    },
    
    getGeneralColor(color) {
        const colors = {
            red: '#dc2626',
            blue: '#2563eb',
            green: '#16a34a',
            black: '#a0a0a0'
        };
        return colors[color] || '#666';
    },
    
    getGeneralTokenColor(general) {
        if (general.name === 'White Rabbit') return '#ffffff';
        const colors = {
            red: '#dc2626',
            blue: '#2563eb',
            green: '#16a34a',
            black: '#1f2937'
        };
        return colors[general.color] || '#666';
    },
    
    getGeneralTooltipNameColor(general) {
        if (general.name === 'White Rabbit') return '#ffffff';
        return this.getGeneralColor(general.color);
    },
    
    getMinionColor(color) {
        const colors = {
            red: '#dc2626',
            blue: '#2563eb',
            green: '#16a34a',
            black: '#1f2937'
        };
        return colors[color] || '#666';
    },
    
    // Generate 8-bit pixel art for heroes
    getHeroPixelArt(heroName) {
        const pixelSize = 4;
        const patterns = {
            'Paladin': [
                '  XXX  ',
                ' XXXXX ',
                'XXXXXXX',
                ' XXXXX ',
                '  XXX  ',
                ' X X X ',
                ' X   X ',
                'XX   XX'
            ],
            'Cleric': [
                '  XXX  ',
                ' XXXXX ',
                ' XXXXX ',
                '  XXX  ',
                ' XXXXX ',
                '  XXX  ',
                ' X   X ',
                'XX   XX'
            ],
            'Wizard': [
                ' XXXXX ',
                'XXXXXXX',
                ' XXXXX ',
                '  XXX  ',
                '  XXX  ',
                ' XXXXX ',
                ' X   X ',
                'X     X'
            ],
            'Sorceress': [
                ' XXXXX ',
                'XXXXXXX',
                'XXXXXXX',
                '  XXX  ',
                ' XXXXX ',
                '  XXX  ',
                ' XX XX ',
                'XX   XX'
            ],
            'Dwarf': [
                ' XXXXX ',
                'XXXXXXX',
                'XXXXXXX',
                ' XXXXX ',
                'XXXXXXX',
                ' XXXXX ',
                ' XX XX ',
                'XXX XXX'
            ],
            'Ranger': [
                '  X X  ',
                ' XXXXX ',
                'XXXXXXX',
                '  XXX  ',
                ' XXXXX ',
                '  X X  ',
                ' X   X ',
                'XX   XX'
            ]
        };
        
        const pattern = patterns[heroName] || patterns['Paladin'];
        let svg = '<svg width="32" height="32" viewBox="0 0 32 32" style="display: block; margin: 10px auto;">';
        
        for (let y = 0; y < pattern.length; y++) {
            for (let x = 0; x < pattern[y].length; x++) {
                if (pattern[y][x] === 'X') {
                    const color = this.heroes.find(h => h.name === heroName)?.color || '#3b82f6';
                    svg += `<rect x="${x * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}" stroke="#000" stroke-width="0.5"/>`;
                }
            }
        }
        
        svg += '</svg>';
        return svg;
    },
    
    renderHeroes() {
        // Render current hero summary
        const currentHero = this.heroes[this.currentPlayerIndex];
        // Update deck counts
        this.updateDeckCounts();

        // Render heroes list for modal
        const heroesModalList = document.getElementById('heroes-modal-list');
        if (heroesModalList) {
            heroesModalList.innerHTML = this.heroes.map((hero, index) => {
                // Eagle Rider attack style badge
                let attackStyleBadge = '';
                if (hero.name === 'Eagle Rider' && this.eagleRiderAttackStyle) {
                    const isSky = this.eagleRiderAttackStyle === 'sky';
                    attackStyleBadge = `<div style="margin-top: 6px; padding: 4px 8px; border-radius: 5px; font-size: 0.8em; font-weight: bold; display: inline-block;
                        background: ${isSky ? 'rgba(96, 165, 250, 0.3)' : 'rgba(245, 158, 11, 0.3)'}; 
                        border: 1px solid ${isSky ? '#60a5fa' : '#f59e0b'}; 
                        color: ${isSky ? '#60a5fa' : '#f59e0b'};">
                        ${isSky ? '☁️ Sky Attack' : '⚔️ Ground Attack'}
                    </div>`;
                }
                
                // Sorceress Shape Shifter badge
                const isActive = index === this.currentPlayerIndex;
                let shapeshiftBadge = '';
                if (hero.name === 'Sorceress' && isActive) {
                    if (this.shapeshiftForm) {
                        const sfNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
                        const sfIcons = { green: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#16a34a;border:1.5px solid #000;vertical-align:middle;"></span>', black: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#1f2937;border:1.5px solid #000;vertical-align:middle;"></span>', red: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#dc2626;border:1.5px solid #000;vertical-align:middle;"></span>', blue: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#2563eb;border:1.5px solid #000;vertical-align:middle;"></span>' };
                        const sfColors = { green: '#16a34a', black: '#6b7280', red: '#dc2626', blue: '#3b82f6' };
                        const sfn = sfNames[this.shapeshiftForm];
                        const sfi = sfIcons[this.shapeshiftForm];
                        const sfc = sfColors[this.shapeshiftForm];
                        shapeshiftBadge = `<div style="margin-top: 6px; padding: 4px 8px; border-radius: 5px; font-size: 0.8em; font-weight: bold; display: inline-block;
                            background: rgba(236,72,153,0.2); border: 1px solid ${sfc}; color: ${sfc};">
                            <span class="shapeshift-desktop">${sfi} ${sfn} Form</span><span class="shapeshift-mobile">${sfi}</span>
                        </div>`;
                    } else {
                        shapeshiftBadge = `<div style="margin-top: 6px; padding: 4px 8px; border-radius: 5px; font-size: 0.8em; font-weight: bold; display: inline-block;
                            background: rgba(236,72,153,0.1); border: 1px solid #ec4899; color: #ec4899;">
                            ⚡ Normal Form
                        </div>`;
                    }
                }
                
                const heroQuestBonus = this._getQuestActionBonus(hero);
                const heroActions = isActive ? this.actionsRemaining : (hero.health + heroQuestBonus);
                const heroMaxActions = isActive ? Math.max(hero.health + heroQuestBonus, this.actionsRemaining) : (hero.health + heroQuestBonus);
                const actionsColor = (isActive && this.actionsRemaining > hero.health) ? 'color: #0ea5e9;' : (heroQuestBonus > 0 ? 'color: #0ea5e9;' : '');
                
                return `
                <div class="hero-card ${isActive ? 'active' : ''}" 
                     data-hero-index="${index}">
                    <div class="hero-name">${hero.symbol} ${hero.name}</div>
                    <div class="hero-stats">
                        <div class="stat">❤️ ${hero.health}/${hero.maxHealth}</div>
                        <div class="stat" style="${actionsColor}">⚡ ${heroActions}/${heroMaxActions}</div>
                        <div class="stat card-stat" data-hero-index="${index}" style="cursor: pointer; text-decoration: underline;">🎴 ${hero.cards.length}</div>
                        <div class="stat quest-stat" data-hero-index="${index}" style="color: #ef4444; cursor: pointer; text-decoration: underline;">📜 ${hero.questCards ? hero.questCards.filter(q => !q.discarded).length : 0}</div>
                    </div>
                    <div style="font-size: 0.75em; margin-top: 5px; color: #333;">
                        📍 ${hero.location}
                    </div>
                    ${attackStyleBadge}
                    ${shapeshiftBadge}
                    ${(hero.questCards || []).filter(q => q.completed && !q.discarded).map(q => `
                        <div style="margin-top: 6px; padding: 4px 8px; border-radius: 5px; font-size: 0.8em; font-weight: bold; display: inline-block;
                            background: rgba(220,38,38,0.15); border: 1px solid #dc2626; color: #ef4444;">
                            📜 ${q.name}
                        </div>`).join('')}
                    <div style="margin-top: 8px; padding: 8px; background: transparent; border-radius: 4px; font-size: 0.8em; color: #000; line-height: 1.4;">
                        <div style="font-weight: bold; margin-bottom: 4px;">⚡ Special Ability:</div>
                        <div style="color: #333;">${hero.ability}</div>
                    </div>
                </div>
            `}).join('');
            
            // Add hover events to CARD STAT ONLY (not entire hero card)
            this.heroes.forEach((hero, index) => {
                const cardStat = heroesModalList.querySelector(`.card-stat[data-hero-index="${index}"]`);
                if (cardStat) {
                    // Show on hover over card icon
                    cardStat.addEventListener('mouseenter', (e) => {
                        this.showHeroCardsInModal(hero, e);
                    });
                    
                    // Click to close
                    cardStat.addEventListener('click', (e) => {
                        const tooltip = document.getElementById('hover-tooltip');
                        if (tooltip.classList.contains('active')) {
                            this.hideTooltip(true);
                        }
                    });
                }
                
                // Quest stat click handler
                const questStat = heroesModalList.querySelector(`.quest-stat[data-hero-index="${index}"]`);
                if (questStat) {
                    questStat.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.showHeroQuestCardsModal(index);
                    });
                }
            });
        }
    },
    
    updateDeckCounts() {
        // Update hero deck count
        const heroDeckCount = document.getElementById('hero-deck-count');
        if (heroDeckCount) {
            heroDeckCount.textContent = this.heroDeck ? this.heroDeck.length : 0;
        }
        
        // Update darkness deck count
        const darknessDeckCount = document.getElementById('darkness-deck-count');
        if (darknessDeckCount) {
            darknessDeckCount.textContent = this.darknessDeck ? this.darknessDeck.length : 0;
        }
        
        // Update hero discard count
        const heroDiscardCount = document.getElementById('hero-discard-count');
        if (heroDiscardCount) {
            heroDiscardCount.textContent = this.heroDiscardPile;
        }
        
        // Update darkness discard count
        const darknessDiscardCount = document.getElementById('darkness-discard-count');
        if (darknessDiscardCount) {
            darknessDiscardCount.textContent = this.darknessDiscardPile;
        }
        
        // Update quest deck count
        const questDeckCount = document.getElementById('quest-deck-count');
        if (questDeckCount) {
            questDeckCount.textContent = this.questDeck ? this.questDeck.length : 0;
        }
        
        // Update quest discard count
        const questDiscardCount = document.getElementById('quest-discard-count');
        if (questDiscardCount) {
            questDiscardCount.textContent = this.questDiscardPile;
        }
    },
    
    showHeroCardsInModal(hero, event) {
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
});
