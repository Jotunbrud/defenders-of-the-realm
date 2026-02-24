// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Darkness AI & Visual Effects
// ═══════════════════════════════════════════════════════════════

Object.assign(game, {
    processMinionPlacement(faction, count, location, darknessEvents, suppressSpawn, suppressOverrun) {
        if (count === 0 || !location) return;
        
        // Check if all 25 minions of this color are already on the board
        // Lose condition triggers when a card TRIES to place but none are left
        let totalFactionOnBoard = 0;
        for (const loc in this.minions) {
            totalFactionOnBoard += (this.minions[loc][faction] || 0);
        }
        if (totalFactionOnBoard >= 25) {
            const generalName = this.generals.find(g => g.color === faction)?.name || faction;
            const key = `minion_exhausted_${faction}`;
            if (!this.loseConditionsDisabled[key]) {
                if (!this.pendingMinionExhaustion) this.pendingMinionExhaustion = {};
                this.pendingMinionExhaustion[faction] = { generalName, count, location };
                this.pendingLossCheck = true;
            }
            // Still push a spawn event showing the attempt
            if (!suppressSpawn) {
                darknessEvents.push({
                    type: 'spawn',
                    general: generalName,
                    color: faction,
                    location: location,
                    count: count
                });
            }
            return; // Can't place any minions
        }
        
        // Initialize minions object if needed
        if (!this.minions[location]) {
            this.minions[location] = { red: 0, blue: 0, green: 0, black: 0 };
        }
        // Ensure faction key exists (in case location was created with sparse keys)
        if (this.minions[location][faction] === undefined) {
            this.minions[location][faction] = 0;
        }
        
        const currentColorCount = this.minions[location][faction];
        const totalAtLocation = Object.values(this.minions[location]).reduce((a, b) => a + b, 0);
        
        // Monarch City: special rules - higher capacity, NEVER overruns, NEVER gains taint
        const isMonarchCity = location === 'Monarch City';
        
        // RULE 1: 3rd red minion ALWAYS adds a taint crystal (demons are more corrupt) — except Monarch City
        // RULE 2: Max 3 minions per location (any color combination) — Monarch City allows more (5 = game over)
        
        // Calculate how many minions we can actually place (limited by location AND remaining tokens)
        const remainingTokens = 25 - totalFactionOnBoard;
        const locationCapacity = isMonarchCity ? 99 : 3; // Monarch City has no placement cap (5 = lose checked elsewhere)
        const spaceAvailable = locationCapacity - totalAtLocation;
        const minionsToPlace = Math.min(count, spaceAvailable, remainingTokens);
        const overflow = count - Math.min(count, spaceAvailable);
        
        // Check if placing these minions would create a 3rd red minion
        const wouldBe3rdRedMinion = (faction === 'red' && currentColorCount + minionsToPlace >= 3);
        
        // Will a taint event be generated? Never at Monarch City
        const willTaint = !isMonarchCity && (wouldBe3rdRedMinion || (overflow > 0 && !suppressOverrun)) && this.taintCrystalsRemaining > 0;
        const isOverrun = overflow > 0;
        
        // Place the minions that fit
        if (minionsToPlace > 0) {
            this.minions[location][faction] += minionsToPlace;
        }
        
        // Always push spawn event showing original attempted count (unless suppressSpawn for general movement)
        // BUT skip if a taint or overrun event will follow for the same location — those already show placement details
        if (!suppressSpawn && !willTaint && !isOverrun) {
            const generalName = this.generals.find(g => g.color === faction)?.name || 'Unknown';
            
            darknessEvents.push({
                type: 'spawn',
                general: generalName,
                color: faction,
                location: location,
                count: count  // Show the ORIGINAL card count, not just what fit
            });
        }
        
        // Add taint crystal if:
        // 1. We hit 3rd red minion, OR
        // 2. There's overflow (would exceed 3 total)
        
        let sourceTaintData = null;
        if (willTaint) {
            if (!this.taintCrystals[location]) {
                this.taintCrystals[location] = 0;
            }
            this.taintCrystals[location]++;
            this.taintCrystalsRemaining--;
            
            const generalName = this.generals.find(g => g.color === faction)?.name || 'Unknown';
            
            sourceTaintData = {
                type: 'taint',
                location: location,
                count: this.taintCrystals[location],
                remaining: this.taintCrystalsRemaining,
                general: generalName,
                color: faction,
                wouldBeMinions: count,
                minionsPlaced: minionsToPlace,
                reason: wouldBe3rdRedMinion ? '3rd red minion' : 'location at max (3 minions)'
            };
            
            // Only push standalone taint if NOT an overrun (overrun will embed it)
            if (!isOverrun) {
                darknessEvents.push(sourceTaintData);
            }
        }
        
        // OVERRUN: When a 4th minion would be added, spread 1 minion of same color to all connected locations (except inns)
        // Monarch City NEVER triggers overruns
        if (isOverrun && !suppressOverrun && !isMonarchCity && !this.overrunsDisabled) {
            const connectedLocations = this.getConnectedLocations(location);
            const overrunSpread = [];
            
            connectedLocations.forEach(connectedLoc => {
                const connectedData = this.locationCoords[connectedLoc];
                // Skip inns
                if (connectedData && connectedData.inn) return;
                
                // Initialize minions if needed
                if (!this.minions[connectedLoc]) {
                    this.minions[connectedLoc] = { red: 0, blue: 0, green: 0, black: 0 };
                }
                
                const connectedTotal = Object.values(this.minions[connectedLoc]).reduce((a, b) => a + b, 0);
                // Monarch City can hold 4 minions (5 = lose), all other locations max 3
                const maxCapacity = connectedLoc === 'Monarch City' ? 4 : 3;
                
                let addedMinion = false;
                let addedTaint = false;
                
                // Check if any tokens of this faction remain
                let factionTotal = 0;
                for (const loc in this.minions) {
                    factionTotal += (this.minions[loc][faction] || 0);
                }
                
                if (factionTotal >= 25) {
                    // No tokens left - can't place, but don't trigger loss from overrun spread
                } else if (connectedTotal < maxCapacity) {
                    // Has space and tokens available - add the minion
                    this.minions[connectedLoc][faction]++;
                    addedMinion = true;
                }
                
                // If location was already at max or this push would exceed, add taint crystal (not for Monarch City under 4)
                if (connectedTotal >= maxCapacity) {
                    if (this.taintCrystalsRemaining > 0 && connectedLoc !== 'Monarch City') {
                        if (!this.taintCrystals[connectedLoc]) {
                            this.taintCrystals[connectedLoc] = 0;
                        }
                        this.taintCrystals[connectedLoc]++;
                        this.taintCrystalsRemaining--;
                        addedTaint = true;
                    }
                }
                
                overrunSpread.push({
                    location: connectedLoc,
                    addedMinion: addedMinion,
                    addedTaint: addedTaint,
                    color: faction,
                    taintRemaining: addedTaint ? this.taintCrystalsRemaining : null
                });
            });
            
            if (overrunSpread.length > 0) {
                const generalName = this.generals.find(g => g.color === faction)?.name || 'Unknown';
                this.addLog(`OVERRUN at ${location}! ${faction} minions spread to ${overrunSpread.length} connected locations`);
                overrunSpread.forEach(s => {
                    if (s.addedMinion) this.addLog(`  → +1 ${s.color} minion at ${s.location}`);
                    if (s.addedTaint) this.addLog(`  → Taint Crystal placed at ${s.location} (overrun spillover)`);
                });
                darknessEvents.push({
                    type: 'overrun',
                    sourceLocation: location,
                    color: faction,
                    general: generalName,
                    sourceTaint: sourceTaintData,
                    spread: overrunSpread
                });
            }
        } else if (isOverrun && !isMonarchCity && this.overrunsDisabled) {
            // Overruns disabled: no spread, but still push taint event if applicable
            this.addLog(`⚙️ Overrun would have triggered at ${location} — disabled by settings`);
            if (sourceTaintData) {
                darknessEvents.push(sourceTaintData);
            }
        }
    },
    
    processGeneralMovement(generalColor, minionCount, targetLocation, darknessEvents) {
        const general = this.generals.find(g => g.color === generalColor);
        if (!general) {
            // General doesn't exist
            return;
        }
        
        if (general.defeated) {
            // General is defeated - add event to show in modal
            this.addLog(`✓ ${general.name} card drawn but general already defeated (no movement)`);
            
            darknessEvents.push({
                type: 'general_defeated',
                general: general.name,
                color: general.color,
                minionCount: minionCount,
                targetLocation: targetLocation
            });
            return;
        }
        
        // Major Wounds: General cannot advance
        const wound = this.generalWounds[general.color];
        if (wound && wound.type === 'major') {
            this.addLog(`🚫 ${general.name} has Major Wounds and cannot advance! (stays at ${general.location})`);
            
            darknessEvents.push({
                type: 'major_wound_blocked',
                general: general.name,
                color: general.color,
                minionCount: minionCount,
                targetLocation: targetLocation,
                currentLocation: general.location
            });
            
            // Minions still spawn at the target location even if general doesn't move
            if (minionCount > 0) {
                const spawnLoc = targetLocation === 'Next Location' ? general.location : targetLocation;
                this.processMinionPlacement(general.color, minionCount, spawnLoc, darknessEvents);
            }
            return;
        }
        
        if (targetLocation === 'Monarch City') {
            // Special case: General attempts to reach Monarch City
            // Check if Monarch City is the NEXT step on their colored path
            const nextLocationOnPath = this.getColoredPathTowardMonarchCity(general);
            
            if (nextLocationOnPath === 'Monarch City') {
                // GAME OVER - General reached Monarch City!
                const oldLocation = general.location;
                general.location = 'Monarch City';
                
                // Add to game log FIRST
                this.addLog(`💀 ${general.name} reaches Monarch City from ${oldLocation}! (${minionCount} ${general.color} minions spawned)`);
                
                // Add general movement event BEFORE minion placement
                darknessEvents.push({
                    type: 'monarch_city_reached',
                    general: general.name,
                    color: general.color,
                    from: oldLocation,
                    to: 'Monarch City',
                    minionCount: minionCount
                });
                
                // THEN place minions at Monarch City (general moved successfully)
                if (minionCount > 0) {
                    this.processMinionPlacement(general.color, minionCount, 'Monarch City', darknessEvents, true);
                }
                
                // Defer game over - will be checked when Night modal closes
                this.pendingLossCheck = true;
            } else {
                // Monarch City is not the next step - general does NOT move, NO minions placed
                this.addLog(`🛑 ${general.name} DOES NOT ADVANCE: Monarch City not next on ${general.color} path (currently at ${general.location})`);
                
                darknessEvents.push({
                    type: 'advance_failed',
                    general: general.name,
                    color: general.color,
                    location: general.location,
                    attemptedLocation: 'Monarch City',
                    minionCount: minionCount,
                    reason: 'Monarch City not next on path'
                });
            }
        } else if (targetLocation === 'Next Location') {
            // Skip movement for test generals
            if (general.isTestGeneral) {
                this.addLog(`🐰 ${general.name} (test general) does not move`);
                // Still place minions at current location
                if (minionCount > 0) {
                    this.processMinionPlacement(general.color, minionCount, general.location, darknessEvents);
                }
            } else {
                // Move general one step along colored path toward Monarch City
                const nextLoc = this.getColoredPathTowardMonarchCity(general);
                
                if (nextLoc) {
                    const oldLocation = general.location;
                    general.location = nextLoc;
                    
                    // Add to game log FIRST
                    this.addLog(`🚨 ${general.name} ADVANCES to Next Location: ${oldLocation} → ${nextLoc} (${minionCount} ${general.color} minions spawned)`);
                    
                    // Add general movement event BEFORE minion placement
                    darknessEvents.push({
                        type: 'advance',
                        general: general.name,
                        color: general.color,
                        from: oldLocation,
                        to: nextLoc,
                        minionCount: minionCount,
                        isWildCard: true  // Flag for "Next Location" wild card
                    });
                    
                    // THEN place minions at new location (general moved successfully)
                    if (minionCount > 0) {
                        this.processMinionPlacement(general.color, minionCount, nextLoc, darknessEvents, true);
                    }
                } else {
                    // Cannot move - general does NOT move, NO minions placed
                    this.addLog(`🛑 ${general.name} DOES NOT ADVANCE: No valid path from ${general.location}`);
                    
                    darknessEvents.push({
                        type: 'advance_failed',
                        general: general.name,
                        color: general.color,
                        location: general.location,
                        minionCount: minionCount,
                        reason: 'No valid path'
                    });
                }
            }
        } else {
            // Skip movement for test generals
            if (general.isTestGeneral) {
                this.addLog(`🐰 ${general.name} (test general) does not move`);
                // Still place minions at current location
                if (minionCount > 0) {
                    this.processMinionPlacement(general.color, minionCount, general.location, darknessEvents);
                }
            } else {
                // Specific location - check if it's the NEXT step on the colored path
                const nextLocationOnPath = this.getColoredPathTowardMonarchCity(general);
                
                if (nextLocationOnPath === targetLocation) {
                    // This IS the next step on the path - general can move!
                    const oldLocation = general.location;
                    general.location = targetLocation;
                    
                    // Add to game log FIRST
                    this.addLog(`🚨 ${general.name} ADVANCES: ${oldLocation} → ${targetLocation} (${minionCount} ${general.color} minions spawned)`);
                    
                    // Add general movement event BEFORE minion placement
                    darknessEvents.push({
                        type: 'general_move',
                        general: general.name,
                        color: general.color,
                        from: oldLocation,
                        to: targetLocation,
                        minionCount: minionCount
                    });
                    
                    // THEN place minions at new location (general moved successfully)
                    if (minionCount > 0) {
                        this.processMinionPlacement(general.color, minionCount, targetLocation, darknessEvents, true);
                    }
                } else {
                    // This is NOT the next step - general doesn't move, NO minions placed
                    this.addLog(`🛑 ${general.name} DOES NOT ADVANCE: ${targetLocation} not next on ${general.color} path (currently at ${general.location})`);
                    
                    darknessEvents.push({
                        type: 'movement_blocked',
                        general: general.name,
                        color: general.color,
                        currentLocation: general.location,
                        attemptedLocation: targetLocation,
                        nextOnPath: nextLocationOnPath,
                        minionCount: minionCount,
                        reason: `${targetLocation} is not next on ${general.color} path (next: ${nextLocationOnPath || 'none'})`
                    });
                }
            }
        }
    },
    
    canReachMonarchCity(general) {
        // Check if general is one move away from Monarch City via colored path
        const nextLocation = this.getColoredPathTowardMonarchCity(general);
        return nextLocation === 'Monarch City';
    },
    
    getColoredPathTowardMonarchCity(general) {
        // General can ONLY move on paths that match their color
        // Must move toward Monarch City along these colored paths
        
        if (general.location === 'Monarch City') return null;
        
        const connections = this.getAllConnections();
        const adjacent = [];
        
        // Find adjacent locations
        connections.forEach(([loc1, loc2]) => {
            if (loc1 === general.location) adjacent.push(loc2);
            if (loc2 === general.location) adjacent.push(loc1);
        });
        
        // Filter to only colored paths for this general
        // Check the original connections data from renderMap
        const coloredAdjacent = [];
        const allConnectionsWithColor = [
            ['Dark Woods', 'Golden Oak Forest', 'black'],
            ['Dark Woods', 'Windy Pass', 'black'],
            ['Blood Flats', 'Scorpion Canyon', 'red'],
            ['Blood Flats', 'Raven Forest', 'red'],
            ['Scorpion Canyon', 'Raven Forest', 'red'],
            ['Windy Pass', 'Rock Bridge Pass', 'black'],
            ['Windy Pass', 'Sea Bird Port', 'black'],
            ['Rock Bridge Pass', 'Sea Bird Port', 'black'],
            ['Brookdale Village', 'Sea Bird Port', 'black'],
            ['Brookdale Village', 'Father Oak Forest', 'black'],
            ['Raven Forest', 'Pleasant Hill', 'red'],
            ['Raven Forest', 'Angel Tear Falls', 'red'],
            ['Sea Bird Port', 'Father Oak Forest', 'black'],
            ['Pleasant Hill', 'Father Oak Forest', 'black'],
            ['Pleasant Hill', 'Angel Tear Falls', 'red'],
            ['Father Oak Forest', 'Wolf Pass', 'black'],
            ['Father Oak Forest', 'Monarch City', 'black'],
            ['Angel Tear Falls', 'Dragon\'s Teeth Range', 'red'],
            ['Angel Tear Falls', 'Bounty Bay', 'red'],
            ['Angel Tear Falls', 'Fire River', 'red'],
            ['Wolf Pass', 'Orc Valley', 'green'],
            ['Monarch City', 'Bounty Bay', 'red'],
            ['Monarch City', 'Orc Valley', 'green'],
            ['Monarch City', 'Greenleaf Village', 'blue'],
            ['Bounty Bay', 'Greenleaf Village', 'red'],
            ['Bounty Bay', 'Mermaid Harbor', 'red'],
            ['Orc Valley', 'Dancing Stone', 'green'],
            ['Orc Valley', 'Eagle Peak Pass', 'green'],
            ['Orc Valley', 'Whispering Woods', 'green'],
            ['Dancing Stone', 'Greenleaf Village', 'blue'],
            ['Greenleaf Village', 'Ancient Ruins', 'blue'],
            ['Greenleaf Village', 'Mountains of Mist', 'blue'],
            ['Eagle Peak Pass', 'Whispering Woods', 'green'],
            ['Eagle Peak Pass', 'Amarak Peak', 'green'],
            ['Ancient Ruins', 'Heaven\'s Glade', 'blue'],
            ['McCorm Highlands', 'Amarak Peak', 'green'],
            ['Amarak Peak', 'Ghost Marsh', 'green'],
            ['Amarak Peak', 'Thorny Woods', 'green'],
            ['Heaven\'s Glade', 'Thorny Woods', 'blue'],
            ['Heaven\'s Glade', 'Blizzard Mountains', 'blue'],
            ['Blizzard Mountains', 'Withered Hills', 'blue']
        ];
        
        // Find colored paths from current location matching general's color
        allConnectionsWithColor.forEach(([loc1, loc2, color]) => {
            if (color === general.color) {
                if (loc1 === general.location && adjacent.includes(loc2)) {
                    coloredAdjacent.push(loc2);
                } else if (loc2 === general.location && adjacent.includes(loc1)) {
                    coloredAdjacent.push(loc1);
                }
            }
        });
        
        if (coloredAdjacent.length === 0) return null;
        
        // From colored adjacent locations, find closest to Monarch City
        const monarchCoords = this.locationCoords['Monarch City'];
        let closestLoc = null;
        let minDistance = Infinity;
        
        coloredAdjacent.forEach(loc => {
            const coords = this.locationCoords[loc];
            if (coords) {
                const dist = Math.sqrt(Math.pow(coords.x - monarchCoords.x, 2) + Math.pow(coords.y - monarchCoords.y, 2));
                if (dist < minDistance) {
                    minDistance = dist;
                    closestLoc = loc;
                }
            }
        });
        
        return closestLoc;
    },
    
    getAdjacentLocations(location) {
        // Get all locations connected to this one
        const connections = this.getAllConnections();
        const adjacent = [];
        
        connections.forEach(([loc1, loc2]) => {
            if (loc1 === location && loc2 !== location) adjacent.push(loc2);
            if (loc2 === location && loc1 !== location) adjacent.push(loc1);
        });
        
        return [...new Set(adjacent)]; // Remove duplicates
    },
    
    getAllConnections() {
        // Return connections from Excel data (just location pairs for pathfinding)
        return [
            ['Dark Woods', 'Golden Oak Forest'], ['Dark Woods', 'Windy Pass'], ['Golden Oak Forest', 'Rock Bridge Pass'],
            ['Eagle Nest Inn', 'Enchanted Glade'], ['Enchanted Glade', 'Unicorn Forest'], ['Enchanted Glade', 'Rock Bridge Pass'],
            ['Unicorn Forest', 'Blood Flats'], ['Unicorn Forest', 'Brookdale Village'], ['Blood Flats', 'Scorpion Canyon'],
            ['Blood Flats', 'Brookdale Village'], ['Blood Flats', 'Raven Forest'], ['Scorpion Canyon', 'Raven Forest'],
            ['Windy Pass', 'Rock Bridge Pass'], ['Windy Pass', 'Sea Bird Port'], ['Rock Bridge Pass', 'Brookdale Village'],
            ['Rock Bridge Pass', 'Sea Bird Port'], ['Brookdale Village', 'Sea Bird Port'], ['Brookdale Village', 'Pleasant Hill'],
            ['Brookdale Village', 'Father Oak Forest'], ['Raven Forest', 'Pleasant Hill'], ['Raven Forest', 'Angel Tear Falls'],
            ['Sea Bird Port', 'Father Oak Forest'], ['Pleasant Hill', 'Father Oak Forest'], ['Pleasant Hill', 'Angel Tear Falls'],
            ['Minotaur Forest', 'Seagaul Lagoon'], ['Minotaur Forest', 'Wolf Pass'], ['Father Oak Forest', 'Wolf Pass'],
            ['Father Oak Forest', 'Monarch City'], ['Angel Tear Falls', 'Dragon\'s Teeth Range'], ['Angel Tear Falls', 'Bounty Bay'],
            ['Angel Tear Falls', 'Fire River'], ['Seagaul Lagoon', 'Wolf Pass'], ['Wolf Pass', 'Monarch City'],
            ['Wolf Pass', 'Orc Valley'], ['Monarch City', 'Bounty Bay'], ['Monarch City', 'Orc Valley'],
            ['Monarch City', 'Dancing Stone'], ['Monarch City', 'Greenleaf Village'], ['Bounty Bay', 'Greenleaf Village'],
            ['Bounty Bay', 'Mermaid Harbor'], ['Gryphon Forest', 'Seagaul Lagoon'], ['Gryphon Forest', 'Gryphon Inn'],
            ['Gryphon Forest', 'Serpent Swamp'], ['Orc Valley', 'Dancing Stone'], ['Orc Valley', 'Eagle Peak Pass'],
            ['Orc Valley', 'Whispering Woods'], ['Dancing Stone', 'Greenleaf Village'], ['Dancing Stone', 'Whispering Woods'],
            ['Greenleaf Village', 'Ancient Ruins'], ['Greenleaf Village', 'Mountains of Mist'], ['Mermaid Harbor', 'Fire River'],
            ['Mermaid Harbor', 'Land of Amazons'], ['Mermaid Harbor', 'Crystal Hills'], ['Mermaid Harbor', 'Wyvern Forest'],
            ['Fire River', 'Crystal Hills'], ['Eagle Peak Pass', 'Whispering Woods'], ['Eagle Peak Pass', 'Amarak Peak'],
            ['Serpent Swamp', 'McCorm Highlands'], ['Whispering Woods', 'Ancient Ruins'], ['Whispering Woods', 'Heaven\'s Glade'],
            ['Ancient Ruins', 'Heaven\'s Glade'], ['Mountains of Mist', 'Land of Amazons'], ['Mountains of Mist', 'Withered Hills'],
            ['Land of Amazons', 'Wyvern Forest'], ['Land of Amazons', 'Cursed Plateau'], ['Crystal Hills', 'Wyvern Forest'],
            ['McCorm Highlands', 'Amarak Peak'], ['Amarak Peak', 'Ghost Marsh'], ['Amarak Peak', 'Thorny Woods'],
            ['Heaven\'s Glade', 'Thorny Woods'], ['Heaven\'s Glade', 'Blizzard Mountains'], ['Wyvern Forest', 'Cursed Plateau'],
            ['Blizzard Mountains', 'Withered Hills'], ['Withered Hills', 'Cursed Plateau'], ['Chimera Inn', 'Withered Hills']
        ];
    },
    
    getPathTowardMonarchCity(fromLocation) {
        if (fromLocation === 'Monarch City') return null;
        
        const adjacent = this.getAdjacentLocations(fromLocation);
        const monarchCoords = this.locationCoords['Monarch City'];
        
        let closestLoc = null;
        let minDistance = Infinity;
        
        adjacent.forEach(loc => {
            const coords = this.locationCoords[loc];
            if (coords) {
                const dist = Math.sqrt(Math.pow(coords.x - monarchCoords.x, 2) + Math.pow(coords.y - monarchCoords.y, 2));
                if (dist < minDistance) {
                    minDistance = dist;
                    closestLoc = loc;
                }
            }
        });
        
        return closestLoc;
    },
    
    showDarknessSpreadCard(events) {
        const content = document.getElementById('darkness-content');
        
        // Store events to show AFTER modal closes
        if (this.showingDarknessOnMap) {
            this.pendingDarknessEffects = events;
        }
        
        let html = '<div style="margin: 20px 0;">';
        
        events.forEach(event => {
            if (event.type === 'nothing') {
                html += `<div style="text-align: center; padding: 30px; color: #d4af37; font-size: 1.2em;">
                    ${event.message}
                </div>`;
                this.addLog('Darkness spreads... but nothing happens.');
                return;
            }
            
            const colorStyle = event.color ? `color: ${this.getGeneralColor(event.color)};` : '';
            
            if (event.type === 'card_separator') {
                const modeText = event.generalOnly ? 'General Advance Only' : 'Full Card';
                html += `<div style="text-align: center; margin: 10px 0; border-bottom: 1px solid #555; padding-bottom: 5px;">
                    <strong>Card ${event.cardNum}/${event.totalCards}</strong> (${modeText})
                </div>`;
            } else if (event.type === 'general_only_notice') {
                html += `<div class="combat-log-entry" style="border-color: #fbbf24; background: rgba(251,191,36,0.1);">
                    <span style="color: #fbbf24;">⏭️ Minion placements skipped (General Advance Only)</span>
                </div>`;
            } else if (event.type === 'spawn') {
                html += `<div class="combat-log-entry" style="border-color: ${this.getGeneralColor(event.color)}; background: rgba(239,68,68,0.1);">
                    <strong style="${colorStyle}">${event.general}'s</strong> forces: <strong>${event.count}</strong> ${event.color} minion${event.count > 1 ? 's' : ''} spawn at <strong>${event.location}</strong>
                </div>`;
                this.addLog(`Darkness: ${event.count} ${event.color} minion(s) spawn at ${event.location} (${event.general})`);
            } else if (event.type === 'taint') {
                html += `<div class="combat-log-entry" style="border-color: #9333ea; background: rgba(147,51,234,0.2);">
                    <strong style="${colorStyle}">${event.general}'s</strong> forces would spawn <strong>${event.wouldBeMinions}</strong> ${event.color} minion${event.wouldBeMinions > 1 ? 's' : ''} at <strong>${event.location}</strong><br>
                    <strong style="color: #9333ea; font-size: 1.1em;">BUT THE LAND IS CORRUPTED!</strong><br>
                    <strong>Taint Crystal placed instead</strong>
                </div>`;
                this.addLog(`Darkness: ${event.wouldBeMinions} ${event.color} minion(s) would spawn at ${event.location} BUT taint crystal placed instead! (${event.remaining} remaining)`);
            } else if (event.type === 'overrun') {
                let overrunDetails = '';
                // Source taint
                if (event.sourceTaint) {
                    const st = event.sourceTaint;
                    const notPlaced = st.wouldBeMinions - st.minionsPlaced;
                    const notPlacedText = notPlaced > 0 ? `${notPlaced} ${st.color} minion(s) <span style="color: #ef4444; font-weight: bold;">NOT placed</span>` : '';
                    overrunDetails += `${st.general}: ${notPlacedText} at ${st.location} - Taint Crystal placed<br>`;
                }
                // Spread
                event.spread.forEach(s => {
                    if (s.addedMinion && !s.addedTaint) {
                        overrunDetails += `${event.general}: 1 ${s.color} minion → ${s.location}<br>`;
                    } else if (s.addedTaint) {
                        overrunDetails += `${event.general}: 1 ${s.color} minion <span style="color: #ef4444; font-weight: bold;">NOT placed</span> → ${s.location} - Taint Crystal placed<br>`;
                    }
                });
                html += `<div class="combat-log-entry" style="border-color: #ef4444; background: rgba(239,68,68,0.2); border-width: 2px;">
                    <strong style="color: #ef4444; font-size: 1.1em;">OVERRUN at ${event.sourceLocation}!</strong><br>
                    <span style="color: #fbbf24;">${event.general} minions spread to connected locations:</span><br>
                    <div style="margin-top: 5px;">${overrunDetails}</div>
                </div>`;
                if (event.sourceTaint) this.addLog(`Overrun: Taint Crystal placed at ${event.sourceLocation}`);
                event.spread.forEach(s => {
                    if (s.addedMinion) this.addLog(`Overrun: +1 ${s.color} minion at ${s.location}`);
                    if (s.addedTaint) this.addLog(`Overrun: Taint Crystal placed at ${s.location}`);
                });
            } else if (event.type === 'advance') {
                const wildCardNote = event.isWildCard ? '<br><span style="color: #fbbf24; font-size: 0.9em;">(Card: Next Location)</span>' : '';
                html += `<div class="combat-log-entry" style="border-color: ${this.getGeneralColor(event.color)}; background: rgba(220,38,38,0.2);">
                    <strong style="${colorStyle}; font-size: 1.1em;">${event.general} ADVANCES!</strong><br>From <strong>${event.from}</strong> to <strong>${event.to}</strong>${wildCardNote}
                </div>`;
                this.addLog(`Darkness: ${event.general} advances from ${event.from} to ${event.to}${event.isWildCard ? ' (Next Location)' : ''}`);
            } else if (event.type === 'general_move') {
                const wildCardNote = event.isWildCard ? '<br><span style="color: #fbbf24; font-size: 0.9em;">(Card: Next Location)</span>' : '';
                html += `<div class="combat-log-entry" style="border-color: ${this.getGeneralColor(event.color)}; background: rgba(220,38,38,0.2);">
                    <strong style="${colorStyle}; font-size: 1.1em;">${event.general} MOVES!</strong><br>From <strong>${event.from}</strong> to <strong>${event.to}</strong>${wildCardNote}
                </div>`;
                this.addLog(`Darkness: ${event.general} moves from ${event.from} to ${event.to}${event.isWildCard ? ' (Next Location)' : ''}`);
            } else if (event.type === 'monarch_city_reached') {
                html += `<div class="combat-log-entry" style="border-color: #dc2626; background: rgba(220,38,38,0.4); border-width: 3px;">
                    <strong style="color: #dc2626; font-size: 1.3em;">💀 CATASTROPHE! ${event.general} HAS REACHED MONARCH CITY! 💀</strong><br>
                    <span style="font-size: 1.1em;">From <strong>${event.from}</strong> to <strong>MONARCH CITY</strong></span><br>
                    <strong style="color: #ef4444;">THE REALM HAS FALLEN!</strong>
                </div>`;
                this.addLog(`GAME OVER: ${event.general} has reached Monarch City!`);
            } else if (event.type === 'advance_failed') {
                html += `<div class="combat-log-entry" style="border-color: ${this.getGeneralColor(event.color)}; background: rgba(100,100,100,0.2);">
                    <strong style="${colorStyle}; font-size: 1.1em;">⛔ ${event.general} MOVEMENT FAILED!</strong><br>
                    At <strong>${event.location}</strong> - No valid ${event.color} path toward Monarch City
                </div>`;
                this.addLog(`Darkness: ${event.general} cannot advance (no valid ${event.color} path from ${event.location})`);
            } else if (event.type === 'general_defeated') {
                html += `<div class="combat-log-entry" style="border-color: #4ade80; background: rgba(74,222,128,0.2);">
                    <strong style="${colorStyle}; font-size: 1.1em;">✓ ${event.general} DEFEATED!</strong><br>
                    <span style="color: #4ade80;">No generals advance - general already defeated!</span><br>
                    <span style="color: #999; font-size: 0.9em;">Card called for ${event.minionCount} minion${event.minionCount !== 1 ? 's' : ''} → ${event.targetLocation}</span>
                </div>`;
                this.addLog(`Darkness: ${event.general} card drawn but general already defeated - no movement`);
            } else if (event.type === 'major_wound_blocked') {
                html += `<div class="combat-log-entry" style="border-color: #ef4444; background: rgba(239,68,68,0.15);">
                    <strong style="${colorStyle}; font-size: 1.1em;">🚫 ${event.general} — Major Wounds</strong><br>
                    <span style="color: #ef4444;">General cannot advance due to Major Wounds!</span><br>
                    <span style="color: #999; font-size: 0.9em;">Stays at ${event.currentLocation} (minions still placed)</span>
                </div>`;
            }
        });
        
        html += '</div>';
        content.innerHTML = html;
        document.getElementById('darkness-modal').classList.add('active');
    },
    
    showDarknessEffectsOnMap(events) {
        const effectsLayer = document.getElementById('effects-layer');
        if (!effectsLayer) return;
        
        effectsLayer.innerHTML = ''; // Clear previous effects
        
        // Show next hero pulse
        this.showNextHeroPulse();
        
        events.forEach((event, index) => {
            setTimeout(() => {
                if (event.type === 'spawn') {
                    this.showSpawnEffect(event.location, event.color);
                } else if (event.type === 'taint') {
                    this.showTaintEffect(event.location);
                } else if (event.type === 'overrun') {
                    this.showTaintEffect(event.sourceLocation);
                    event.spread.forEach((s, si) => {
                        setTimeout(() => {
                            if (s.addedMinion) this.showSpawnEffect(s.location, s.color);
                            if (s.addedTaint) this.showTaintEffect(s.location);
                        }, (si + 1) * 300);
                    });
                } else if (event.type === 'advance' || event.type === 'general_move' || event.type === 'monarch_city_reached') {
                    this.showAdvanceEffect(event.from, event.to, event.color);
                }
            }, index * 1000); // Stagger effects by 1 second each
        });
    },
    
    showNextHeroPulse() {
        // Determine who's next
        const nextPlayerIndex = (this.currentPlayerIndex + 1) % this.heroes.length;
        const nextHero = this.heroes[nextPlayerIndex];
        
        if (!nextHero) return;
        
        const coords = this.locationCoords[nextHero.location];
        if (!coords) return;
        
        // Calculate hero's actual token position (same logic as renderTokens)
        const heroRadius = 20;
        
        // Count how many heroes at this location
        const heroesHere = this.heroes.filter(h => h.location === nextHero.location);
        const heroIndexAtLocation = heroesHere.indexOf(nextHero);
        
        // Quadrant positions based on player order
        const quadrantOffsets = [
            { x: -heroRadius, y: -heroRadius },  // Top-left
            { x: heroRadius, y: -heroRadius },   // Top-right
            { x: -heroRadius, y: heroRadius },   // Bottom-left
            { x: heroRadius, y: heroRadius }     // Bottom-right
        ];
        
        const offset = quadrantOffsets[heroIndexAtLocation] || { x: 0, y: 0 };
        
        // Calculate hero's actual position
        const heroX = coords.x + offset.x;
        const heroY = coords.y + offset.y;
        
        const effectsLayer = document.getElementById('effects-layer');
        
        // Create golden pulsing circle around the next hero's actual position
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', heroX);
        circle.setAttribute('cy', heroY);
        circle.setAttribute('r', '25'); // Slightly larger than hero token (20px)
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', '#ffd700'); // Gold
        circle.setAttribute('stroke-width', '5');
        circle.setAttribute('opacity', '0.9');
        
        // Animate with CSS - make it pulse continuously
        circle.style.animation = 'pulse-ring 1.5s ease-out infinite';
        
        effectsLayer.appendChild(circle);
        
        // Remove after 10 seconds
        setTimeout(() => circle.remove(), 10000);
    },
    
    showCurrentHeroPulse() {
        // Show pulse for the current active hero
        const currentHero = this.heroes[this.currentPlayerIndex];
        
        if (!currentHero) return;
        
        const coords = this.locationCoords[currentHero.location];
        if (!coords) return;
        
        // Calculate hero's actual token position (same logic as renderTokens)
        const heroRadius = 20;
        
        // Count how many heroes at this location
        const heroesHere = this.heroes.filter(h => h.location === currentHero.location);
        const heroIndexAtLocation = heroesHere.indexOf(currentHero);
        
        // Quadrant positions based on player order
        const quadrantOffsets = [
            { x: -heroRadius, y: -heroRadius },  // Top-left
            { x: heroRadius, y: -heroRadius },   // Top-right
            { x: -heroRadius, y: heroRadius },   // Bottom-left
            { x: heroRadius, y: heroRadius }     // Bottom-right
        ];
        
        const offset = quadrantOffsets[heroIndexAtLocation] || { x: 0, y: 0 };
        
        // Calculate hero's actual position
        const heroX = coords.x + offset.x;
        const heroY = coords.y + offset.y;
        
        const effectsLayer = document.getElementById('effects-layer');
        
        // Create golden pulsing circle around the current hero's actual position
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', heroX);
        circle.setAttribute('cy', heroY);
        circle.setAttribute('r', '25'); // Slightly larger than hero token (20px)
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', '#ffd700'); // Gold
        circle.setAttribute('stroke-width', '5');
        circle.setAttribute('opacity', '0.9');
        
        // Animate with CSS - make it pulse continuously
        circle.style.animation = 'pulse-ring 1.5s ease-out infinite';
        
        effectsLayer.appendChild(circle);
        
        // Remove after 10 seconds
        setTimeout(() => circle.remove(), 10000);
    },
    
    showSpawnEffect(location, color) {
        const coords = this.locationCoords[location];
        if (!coords) return;
        
        const effectsLayer = document.getElementById('effects-layer');
        
        // Calculate minion token position using same logic as renderTokens
        const locationRadius = coords.type === 'inn' ? 24 : 35;
        
        const angleOffset = locationRadius * Math.sqrt(2) / 2;
        
        // Minion positions based on color (matching renderTokens)
        const colorPositions = {
            'black': { baseX: -angleOffset, baseY: -angleOffset },     // Top-left
            'green': { baseX: angleOffset, baseY: -angleOffset },      // Top-right
            'blue': { baseX: angleOffset, baseY: angleOffset },        // Bottom-right
            'red': { baseX: -angleOffset, baseY: angleOffset }         // Bottom-left
        };
        
        const pos = colorPositions[color];
        if (!pos) return;
        
        const minionX = coords.x + pos.baseX;
        const minionY = coords.y + pos.baseY;
        
        // Create pulsing circle around the minion token
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', minionX);
        circle.setAttribute('cy', minionY);
        circle.setAttribute('r', '12'); // Start at minion radius
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', this.getGeneralColor(color));
        circle.setAttribute('stroke-width', '4');
        circle.setAttribute('opacity', '0.9');
        
        // Animate with CSS - make it pulse continuously
        circle.style.animation = 'pulse-ring 1.5s ease-out infinite';
        
        effectsLayer.appendChild(circle);
        
        // Remove after 7 seconds (multiple pulses)
        setTimeout(() => circle.remove(), 7000);
    },
    
    showTaintEffect(location) {
        const coords = this.locationCoords[location];
        if (!coords) return;
        
        const effectsLayer = document.getElementById('effects-layer');
        
        const locationRadius = coords.type === 'inn' ? 24 : 35;
        
        // Taint crystal is at top edge
        const taintY = coords.y - locationRadius;
        
        // Create pulsing purple circle around the taint crystal
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', coords.x);
        circle.setAttribute('cy', taintY);
        circle.setAttribute('r', '12'); // Start at crystal size
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', '#9333ea'); // Purple for taint
        circle.setAttribute('stroke-width', '4');
        circle.setAttribute('opacity', '0.9');
        
        // Animate with CSS - make it pulse continuously
        circle.style.animation = 'pulse-ring 1.5s ease-out infinite';
        
        effectsLayer.appendChild(circle);
        
        // Remove after 10 seconds (multiple pulses)
        setTimeout(() => circle.remove(), 7000);
    },
    
    showAdvanceEffect(fromLocation, toLocation, color) {
        const fromCoords = this.locationCoords[fromLocation];
        const toCoords = this.locationCoords[toLocation];
        if (!fromCoords || !toCoords) return;
        
        const effectsLayer = document.getElementById('effects-layer');
        
        // Use location centers (not general token offsets)
        const fromX = fromCoords.x;
        const fromY = fromCoords.y;
        const toX = toCoords.x;
        const toY = toCoords.y;
        
        // Calculate arrow path
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);
        
        // Shorten arrow to not overlap location circles
        const startX = fromX + Math.cos(angle) * 35;
        const startY = fromY + Math.sin(angle) * 35;
        const endX = toX - Math.cos(angle) * 35;
        const endY = toY - Math.sin(angle) * 35;
        
        // Create pulsing circle at FROM location (where general was)
        const fromCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        fromCircle.setAttribute('cx', fromX);
        fromCircle.setAttribute('cy', fromY);
        fromCircle.setAttribute('r', '20');
        fromCircle.setAttribute('fill', 'none');
        fromCircle.setAttribute('stroke', '#ef4444'); // Red for "from"
        fromCircle.setAttribute('stroke-width', '3');
        fromCircle.setAttribute('opacity', '0.6');
        fromCircle.style.animation = 'pulse-ring 1.5s ease-out infinite';
        effectsLayer.appendChild(fromCircle);
        
        // Create pulsing circle at TO location (where general is now)
        const toCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        toCircle.setAttribute('cx', toX);
        toCircle.setAttribute('cy', toY);
        toCircle.setAttribute('r', '20');
        toCircle.setAttribute('fill', 'none');
        toCircle.setAttribute('stroke', this.getGeneralColor(color)); // General's color
        toCircle.setAttribute('stroke-width', '4');
        toCircle.setAttribute('opacity', '0.9');
        toCircle.style.animation = 'pulse-ring 1.5s ease-out infinite';
        effectsLayer.appendChild(toCircle);
        
        // Create arrow line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', startX);
        line.setAttribute('y1', startY);
        line.setAttribute('x2', endX);
        line.setAttribute('y2', endY);
        line.setAttribute('stroke', '#ef4444');
        line.setAttribute('stroke-width', '8');
        line.setAttribute('opacity', '0.8');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        
        // Create arrowhead marker if it doesn't exist
        let defs = document.querySelector('#game-map defs');
        if (!document.getElementById('arrowhead')) {
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead');
            marker.setAttribute('markerWidth', '3');  // Reduced from 10 to 3 (30%)
            marker.setAttribute('markerHeight', '3'); // Reduced from 10 to 3 (30%)
            marker.setAttribute('refX', '1.5');       // Reduced from 5 to 1.5 (30%)
            marker.setAttribute('refY', '0.9');       // Reduced from 3 to 0.9 (30%)
            marker.setAttribute('orient', 'auto');
            
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 3 0.9, 0 1.8'); // Reduced from '0 0, 10 3, 0 6' (30%)
            polygon.setAttribute('fill', '#ef4444');
            
            marker.appendChild(polygon);
            defs.appendChild(marker);
        }
        
        effectsLayer.appendChild(line);
        
        // Stay visible for 10 seconds
        setTimeout(() => {
            fromCircle.remove();
            toCircle.remove();
            line.remove();
        }, 10000);
    },
    
    closeDarknessModal() {
        document.getElementById('darkness-modal').classList.remove('active');
        
        // If was showing on map, NOW show the visual effects
        if (this.showingDarknessOnMap) {
            this.showingDarknessOnMap = false;
            
            // Check if there are any actual events (not just "nothing" or "all is quiet")
            const hasRealEvents = this.pendingDarknessEffects && 
                                 this.pendingDarknessEffects.some(e => e.type !== 'nothing' && e.type !== 'all_quiet');
            
            if (hasRealEvents) {
                // Show visual effects now that user has read the text
                if (this.pendingDarknessEffects) {
                    this.showDarknessEffectsOnMap(this.pendingDarknessEffects);
                    this.pendingDarknessEffects = null;
                }
                
                // Move to next turn immediately - animations continue in background
                this.completeMapTurnEnd();
            } else {
                // No real events, just "nothing happened" - skip delay
                this.pendingDarknessEffects = null;
                this.completeMapTurnEnd();
            }
        }
    },
    
    closeGroupPenaltyModal() {
        console.log('=== closeGroupPenaltyModal CALLED ===');
        document.getElementById('group-penalty-modal').classList.remove('active');
        
        // Apply the stored penalty results
        if (this.pendingGroupPenaltyResults) {
            console.log('=== Applying penalties to', this.pendingGroupPenaltyResults.length, 'heroes ===');
            const general = this.pendingGroupPenaltyGeneral || { name: 'General' };
            
            this.pendingGroupPenaltyResults.forEach((result, index) => {
                const hero = result.hero;
                
                // Skip Eagle Rider in Sky Attack - fully protected
                if (result.skyAttackProtected) {
                    this.addLog(`☁️ ${hero.name}: Sky Attack — No penalties!`);
                    return;
                }
                
                // Skip War Banner of Valor - fully protected
                if (result.warBannerProtected) {
                    this.addLog(`🚩 ${hero.name}: War Banner of Valor — No penalties!`);
                    return;
                }
                
                console.log(`\n=== Processing hero ${index + 1}: ${hero.name} ===`);
                console.log('Wounds to take:', result.woundsTaken);
                console.log('Cards to lose:', result.cardsToLose);
                console.log('Hero has cards:', hero.cards.length);
                console.log('Current player index:', this.currentPlayerIndex);
                console.log('This hero index:', this.heroes.indexOf(hero));
                
                // Apply wounds
                hero.health -= result.woundsTaken;
                if (hero.health < 0) hero.health = 0;
                this.addLog(`${hero.name} takes ${result.woundsTaken} wound(s) from group defeat`);
                
                // Check death
                if (hero.health <= 0) {
                    this.addLog(`💀 ${hero.name} died from group penalty!`);
                    const heroIndex = this.heroes.indexOf(hero);
                    this.heroDeathContext = 'combat';
                    this.heroDefeated(heroIndex);
                    return; // Skip card loss if dead
                }
                
                // Handle card loss with modal for active player
                const heroGlobalIndex = this.heroes.indexOf(hero);
                const isActivePlayer = (heroGlobalIndex === this.currentPlayerIndex);
                
                if (result.cardsToLose === 'all') {
                    if (hero.cards.length > 0) {
                        const count = hero.cards.length;
                        hero.cards = [];
                        this.heroDiscardPile += count;
                        this.addLog(`${hero.name} loses ALL ${count} cards!`);
                    } else if (isActivePlayer) {
                        // Show modal even with 0 cards to acknowledge penalty
                        const reasonText = `Group defeated by ${general.name}`;
                        this.showCardDiscardModal(0, reasonText);
                    }
                } else if (result.cardsToLose > 0) {
                    const actualLoss = Math.min(result.cardsToLose, hero.cards.length);
                    
                    // For group attacks, ALL heroes need player to choose cards
                    // Queue them up for sequential processing
                    if (actualLoss > 0) {
                        const reasonText = `${hero.name} - Group defeated by ${general.name}${result.cardRoll ? ` (Rolled [${result.cardRoll}])` : ''}`;
                        
                        // Add to pending queue (will be processed sequentially)
                        if (!this.pendingCardDiscardQueue) {
                            this.pendingCardDiscardQueue = [];
                        }
                        this.pendingCardDiscardQueue.push({
                            heroIndex: heroGlobalIndex,
                            numCards: actualLoss,
                            reason: reasonText
                        });
                    } else {
                        // Hero has 0 cards - just log
                        this.addLog(`${hero.name} has no cards to discard`);
                    }
                }
            });
            
            this.renderHeroes();
            this.updateGameStatus();
            
            // Store retreat info for showing after ALL card discards
            // Filter out Eagle Rider in Sky Attack from retreat
            console.log('=== Setting up retreat ===');
            console.log('pendingGroupPenaltyRetreat:', this.pendingGroupPenaltyRetreat ? 'EXISTS' : 'NULL');
            if (this.pendingGroupPenaltyRetreat) {
                // Exclude sky-attacking Eagle Rider from retreat
                const retreatHeroes = this.pendingGroupPenaltyRetreat.heroes.filter(h => {
                    if (h.name === 'Eagle Rider' && this.eagleRiderAttackStyle === 'sky') {
                        this.addLog(`☁️ Eagle Rider's Sky Attack — does not retreat!`);
                        return false;
                    }
                    return true;
                });
                
                if (retreatHeroes.length > 0) {
                    this.pendingGroupPenaltyRetreat.heroes = retreatHeroes;
                    console.log('Retreat heroes:', retreatHeroes.map(h => h.name));
                    this.pendingRetreat = this.pendingGroupPenaltyRetreat;
                } else {
                    console.log('No heroes need to retreat (all protected by Sky Attack)');
                }
            }
            
            // Clear pending results
            this.pendingGroupPenaltyResults = null;
            this.pendingGroupPenaltyGeneral = null;
            this.pendingGroupPenaltyRetreat = null;
            
            // Clear group attack state now that penalties are applied
            this.groupAttack = null;
            
            // Restore original active player if this was a solo-from-group attack
            if (this.soloAttackOriginalPlayer !== undefined) {
                console.log('=== Restoring original player after solo-from-group penalty ===');
                console.log('Changing from:', this.currentPlayerIndex, 'to:', this.soloAttackOriginalPlayer);
                this.currentPlayerIndex = this.soloAttackOriginalPlayer;
                this.soloAttackOriginalPlayer = undefined;
            }
            
            // Process card discard queue sequentially (one hero at a time)
            if (this.pendingCardDiscardQueue && this.pendingCardDiscardQueue.length > 0) {
                console.log('=== Starting card discard queue ===', this.pendingCardDiscardQueue.length, 'heroes');
                
                // Store the ORIGINAL active player BEFORE processing queue
                this.originalPlayerBeforeQueue = this.currentPlayerIndex;
                console.log('=== Storing original player before queue:', this.originalPlayerBeforeQueue);
                
                this.processNextCardDiscard();
            } else {
                // No card discards needed - check for retreat
                if (this.pendingRetreat && !document.getElementById('card-discard-modal').classList.contains('active')) {
                    this.showRetreatModal();
                }
            }
        }
    },
    
    processNextCardDiscard() {
        console.log('=== processNextCardDiscard called ===');
        console.log('Queue length:', this.pendingCardDiscardQueue ? this.pendingCardDiscardQueue.length : 0);
        
        if (!this.pendingCardDiscardQueue || this.pendingCardDiscardQueue.length === 0) {
            // All done - restore ORIGINAL player and show retreat if needed
            console.log('=== Card discard queue empty - checking for retreat ===');
            console.log('pendingRetreat:', this.pendingRetreat ? 'EXISTS' : 'NULL');
            if (this.pendingRetreat) {
                console.log('Retreat heroes:', this.pendingRetreat.heroes.map(h => h.name));
            }
            
            this.pendingCardDiscardQueue = null;
            
            // Restore the ORIGINAL active player from BEFORE the queue started
            if (this.originalPlayerBeforeQueue !== undefined) {
                console.log('=== Restoring ORIGINAL player after queue:', this.originalPlayerBeforeQueue);
                this.currentPlayerIndex = this.originalPlayerBeforeQueue;
                this.originalPlayerBeforeQueue = undefined;
            }
            
            if (this.pendingRetreat) {
                console.log('=== Calling showRetreatModal ===');
                this.showRetreatModal();
            } else {
                console.log('=== No retreat to show ===');
            }
            return;
        }
        
        // Get next hero's card discard
        const nextDiscard = this.pendingCardDiscardQueue[0];
        console.log('=== Processing card discard for hero index:', nextDiscard.heroIndex);
        
        // Temporarily change currentPlayerIndex to this hero for the modal
        this.tempPlayerIndex = this.currentPlayerIndex; // Store current (for this iteration)
        this.currentPlayerIndex = nextDiscard.heroIndex;
        
        // Show modal for this hero
        this.showCardDiscardModal(nextDiscard.numCards, nextDiscard.reason);
    },
    
    showRetreatModal() {
        if (!this.pendingRetreat) return;
        
        console.log('=== showRetreatModal START ===');
        console.log('currentPlayerIndex:', this.currentPlayerIndex);
        console.log('Current hero:', this.heroes[this.currentPlayerIndex].name);
        
        const heroes = this.pendingRetreat.heroes;
        const generalName = this.pendingRetreat.generalName;
        
        const content = document.getElementById('retreat-content');
        content.innerHTML = `
            <div style="text-align: center; margin: 20px 0;">
                <div style="font-size: 1.2em; color: #ef4444; font-weight: bold; margin-bottom: 15px;">
                    Failed to defeat ${generalName}!
                </div>
                <div style="color: #d4af37; margin-bottom: 20px;">
                    ${heroes.length > 1 ? 'All heroes' : 'Hero'} must retreat to Monarch City
                </div>
                <div style="background: rgba(239,68,68,0.2); padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <div style="font-weight: bold; color: #ffd700; margin-bottom: 10px;">
                        ${heroes.length > 1 ? 'Retreating Heroes:' : 'Retreating Hero:'}
                    </div>
                    ${heroes.map(h => `
                        <div style="margin: 5px 0; font-size: 1.1em;">
                            ${h.symbol} ${h.name}
                            <span style="color: #999; font-size: 0.9em;">(from ${h.location})</span>
                        </div>
                    `).join('')}
                </div>
                <div style="color: #d4af37; font-size: 0.9em; margin-top: 15px;">
                    ${heroes.length > 1 ? 'All heroes have' : 'Hero has'} been moved to Monarch City
                </div>
            </div>
        `;
        
        // Actually move the heroes
        heroes.forEach(hero => {
            const oldLocation = hero.location;
            hero.location = 'Monarch City';
            this.addLog(`${hero.name} retreats from ${oldLocation} to Monarch City`);
        });
        
        this.renderTokens();
        this.renderHeroes();
        this.updateMapStatus();
        
        console.log('=== showRetreatModal AFTER RENDER ===');
        console.log('currentPlayerIndex:', this.currentPlayerIndex);
        console.log('Current hero:', this.heroes[this.currentPlayerIndex].name);
        
        document.getElementById('retreat-modal').classList.add('active');
    },
    
    closeRetreatModal() {
        console.log('=== closeRetreatModal CALLED ===');
        console.log('currentPlayerIndex:', this.currentPlayerIndex);
        console.log('Current hero:', this.heroes[this.currentPlayerIndex].name);
        
        document.getElementById('retreat-modal').classList.remove('active');
        this.pendingRetreat = null;
        
        // Update ALL map UI elements after retreat (hero is now at Monarch City)
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            console.log('=== Updating full map UI after retreat ===');
            this.updateMapStatus();
            this.updateMovementButtons();
            this.updateActionButtons();
        }
        
        console.log('=== closeRetreatModal END ===');
        console.log('currentPlayerIndex:', this.currentPlayerIndex);
    },
    
    completeMapTurnEnd() {
        // Move to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.heroes.length;
        
        // Actions = hero's current health
        const nextHero = this.heroes[this.currentPlayerIndex];
        this.actionsRemaining = nextHero.health;
        this._applyFreshMountBonus(nextHero);
        this._applyMountainLoreBonus(nextHero);
        this._applyElfSupportBonus(nextHero);
        // Apply quest bonuses (e.g. Boots of Speed +2 actions)
        const questBonus = this._getQuestActionBonus(nextHero);
        if (questBonus > 0) {
            this.actionsRemaining += questBonus;
            this.addLog(`📜 Boots of Speed: ${nextHero.name} gains +${questBonus} actions!`);
        }
        this.rumorsUsedThisTurn = 0;
        this.wizardTeleportUsedThisTurn = false;
        
        this.addLog(`--- ${nextHero.name}'s turn (${this.actionsRemaining} actions) ---`);
        this.updateGameStatus();
        this.renderHeroes();
        this.renderTokens();
        
        // Update map display if open - DIRECT update
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            this.updateMapStatus();
            
            // Update movement buttons for new hero's cards and actions
            this.updateMovementButtons();
            this.updateActionButtons();
        }
        
        // Eagle Rider: Show attack style selection at start of turn
        this._checkEagleRiderTurnStart();
    },
    
    // Eagle Rider Attack Style system
});
