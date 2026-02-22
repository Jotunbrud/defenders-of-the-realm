// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Location Data
// Location coordinates and connection graph
// ═══════════════════════════════════════════════════════════════

// Location coordinates on the board (SVG coordinates: 0-1000 width, 0-700 height)
// 2012 Rules - 4 factions: Red (Orcs), Blue (Dragons), Green (Demons), Black (Undead)
// Monarch City (radius 40) needs 90px+ from all other locations (10px clearance)
// Other locations (radius 30) need 80px+ from each other (10px clearance)
const LOCATION_COORDS = {
    // Excel Data Integration - 45 Locations with improved spacing (min 90px between centers)
    // Properties: x, y, id, type, faction, chest, magicGate, inn
    
    'Monarch City': { x: 496, y: 370, id: 20, type: 'city', faction: 'purple', chest: true, magicGate: false, inn: false },
    
    // Starting General Locations - Corrected positions
    'Dark Woods': { x: 77, y: 60, id: 1, type: 'general', faction: 'black', chest: false, magicGate: false, inn: false }, // Undead (Black/Varkolak) - Top-Left - Moved right 30px (was 30)
    'Scorpion Canyon': { x: 124, y: 622, id: 7, type: 'general', faction: 'red', chest: false, magicGate: false, inn: false }, // Demons (Red/Balazarg) - Bottom-Left
    'Thorny Woods': { x: 932, y: 214, id: 41, type: 'general', faction: 'green', chest: false, magicGate: false, inn: false }, // Orcs (Green/Gorgutt) - Top-Right
    'Blizzard Mountains': { x: 908, y: 318, id: 42, type: 'general', faction: 'blue', chest: false, magicGate: false, inn: false }, // Dragons (Blue/Sapphire) - Bottom-Right
    
    // Inner Ring (connected to Monarch City) - well spaced
    'Father Oak Forest': { x: 388, y: 316, id: 15, type: 'normal', faction: 'green', chest: false, magicGate: false, inn: false },
    'Wolf Pass': { x: 476, y: 220, id: 19, type: 'normal', faction: 'blue', chest: false, magicGate: false, inn: false },
    'Bounty Bay': { x: 514, y: 475, id: 21, type: 'normal', faction: 'blue', chest: true, magicGate: false, inn: false },
    'Orc Valley': { x: 569, y: 208, id: 24, type: 'normal', faction: 'red', chest: false, magicGate: false, inn: false },
    'Dancing Stone': { x: 596, y: 314, id: 25, type: 'normal', faction: 'black', chest: false, magicGate: true, inn: false },
    'Greenleaf Village': { x: 627, y: 406, id: 26, type: 'normal', faction: 'green', chest: false, magicGate: false, inn: false },
    
    // Northwest Quadrant (Black/Undead area)
    'Golden Oak Forest': { x: 95, y: 170, id: 2, type: 'normal', faction: 'green', chest: false, magicGate: false, inn: false },
    'Windy Pass': { x: 214, y: 82, id: 8, type: 'normal', faction: 'red', chest: false, magicGate: false, inn: false }, // Moved right 30px (was 194)
    'Sea Bird Port': { x: 322, y: 226, id: 12, type: 'normal', faction: 'black', chest: true, magicGate: false, inn: false },
    'Mountains of Mist': { x: 760, y: 443, id: 33, type: 'normal', faction: 'blue', chest: false, magicGate: false, inn: false }, // Moved up 40px (was 497)
    
    // Northeast Quadrant (Red/Orc area)
    'Blood Flats': { x: 120, y: 507, id: 6, type: 'normal', faction: 'red', chest: false, magicGate: false, inn: false },
    'Raven Forest': { x: 252, y: 530, id: 11, type: 'normal', faction: 'green', chest: false, magicGate: false, inn: false },
    'Pleasant Hill': { x: 333, y: 429, id: 13, type: 'normal', faction: 'red', chest: true, magicGate: false, inn: false },
    'Unicorn Forest': { x: 99, y: 411, id: 5, type: 'normal', faction: 'green', chest: false, magicGate: false, inn: false },
    'Brookdale Village': { x: 263, y: 353, id: 10, type: 'normal', faction: 'black', chest: false, magicGate: false, inn: false },
    
    // Southeast Quadrant (Blue/Dragon area - middle right)
    'Dragon\'s Teeth Range': { x: 380, y: 628, id: 17, type: 'normal', faction: 'blue', chest: false, magicGate: false, inn: false },
    'Amarak Peak': { x: 846, y: 158, id: 37, type: 'normal', faction: 'blue', chest: false, magicGate: false, inn: false },
    'Eagle Peak Pass': { x: 654, y: 168, id: 29, type: 'normal', faction: 'blue', chest: false, magicGate: false, inn: false }, // Moved up 60px (was 212)
    'Ghost Marsh': { x: 892, y: 60, id: 40, type: 'normal', faction: 'red', chest: false, magicGate: false, inn: false },
    
    // Southwest Quadrant (Green/Demon area - bottom left)
    'Heaven\'s Glade': { x: 824, y: 267, id: 38, type: 'normal', faction: 'green', chest: false, magicGate: false, inn: false },
    'Ancient Ruins': { x: 752, y: 341, id: 32, type: 'normal', faction: 'red', chest: false, magicGate: false, inn: false },
    'Whispering Woods': { x: 723, y: 244, id: 31, type: 'normal', faction: 'green', chest: false, magicGate: false, inn: false }, // Moved right 30px (was 642)
    'McCorm Highlands': { x: 777, y: 74, id: 36, type: 'normal', faction: 'black', chest: true, magicGate: false, inn: false },
    'Serpent Swamp': { x: 685, y: 57, id: 30, type: 'normal', faction: 'red', chest: false, magicGate: false, inn: false },
    'Cursed Plateau': { x: 918, y: 532, id: 45, type: 'normal', faction: 'red', chest: false, magicGate: false, inn: false },
    
    // Middle Ring Locations - well spaced
    'Rock Bridge Pass': { x: 200, y: 236, id: 9, type: 'normal', faction: 'blue', chest: false, magicGate: false, inn: false },
    'Enchanted Glade': { x: 106, y: 310, id: 4, type: 'normal', faction: 'black', chest: false, magicGate: false, inn: false }, // Swapped with Eagle Nest Inn
    'Angel Tear Falls': { x: 415, y: 539, id: 16, type: 'normal', faction: 'black', chest: false, magicGate: false, inn: false },
    'Fire River': { x: 595, y: 630, id: 28, type: 'normal', faction: 'black', chest: false, magicGate: false, inn: false },
    'Mermaid Harbor': { x: 634, y: 544, id: 27, type: 'normal', faction: 'black', chest: true, magicGate: false, inn: false }, // Moved up 30px (was 583)
    'Land of Amazons': { x: 788, y: 538, id: 34, type: 'normal', faction: 'black', chest: true, magicGate: false, inn: false }, // Moved up 40px (was 555)
    'Wyvern Forest': { x: 842, y: 620, id: 39, type: 'normal', faction: 'green', chest: false, magicGate: false, inn: false },
    'Crystal Hills': { x: 720, y: 628, id: 35, type: 'normal', faction: 'blue', chest: false, magicGate: false, inn: false },
    'Minotaur Forest': { x: 398, y: 135, id: 14, type: 'normal', faction: 'green', chest: false, magicGate: false, inn: false }, // Moved left 30px (was 350)
    'Seagaul Lagoon': { x: 488, y: 74, id: 18, type: 'normal', faction: 'blue', chest: false, magicGate: false, inn: false },
    'Gryphon Forest': { x: 582, y: 60, id: 22, type: 'normal', faction: 'green', chest: false, magicGate: false, inn: false }, // Moved down 30px (was 50)
    
    // Outer Ring Locations
    'Eagle Nest Inn': { x: 49, y: 250, id: 3, type: 'inn', faction: 'purple', chest: false, magicGate: false, inn: true }, // Swapped with Enchanted Glade
    'Gryphon Inn': { x: 586, y: 145, id: 23, type: 'inn', faction: 'purple', chest: false, magicGate: false, inn: true }, // Moved down 30px (was 121)
    'Chimera Inn': { x: 869, y: 397, id: 44, type: 'inn', faction: 'purple', chest: false, magicGate: false, inn: true },
    'Withered Hills': { x: 934, y: 411, id: 43, type: 'normal', faction: 'red', chest: false, magicGate: false, inn: false }
};

// Location connections - defines which locations are connected by paths
const LOCATION_CONNECTIONS = {
    'Amarak Peak': ['Eagle Peak Pass', 'McCorm Highlands', 'Ghost Marsh', 'Thorny Woods'],
    'Ancient Ruins': ['Greenleaf Village', 'Whispering Woods', 'Heaven\'s Glade'],
    'Angel Tear Falls': ['Raven Forest', 'Pleasant Hill', 'Dragon\'s Teeth Range', 'Bounty Bay', 'Fire River'],
    'Blizzard Mountains': ['Heaven\'s Glade', 'Withered Hills'],
    'Blood Flats': ['Unicorn Forest', 'Scorpion Canyon', 'Brookdale Village', 'Raven Forest'],
    'Bounty Bay': ['Angel Tear Falls', 'Monarch City', 'Greenleaf Village', 'Mermaid Harbor'],
    'Brookdale Village': ['Unicorn Forest', 'Blood Flats', 'Rock Bridge Pass', 'Sea Bird Port', 'Pleasant Hill', 'Father Oak Forest'],
    'Chimera Inn': ['Withered Hills'],
    'Crystal Hills': ['Mermaid Harbor', 'Fire River', 'Wyvern Forest'],
    'Cursed Plateau': ['Land of Amazons', 'Wyvern Forest', 'Withered Hills'],
    'Dancing Stone': ['Monarch City', 'Orc Valley', 'Greenleaf Village', 'Whispering Woods'],
    'Dark Woods': ['Golden Oak Forest', 'Windy Pass'],
    'Dragon\'s Teeth Range': ['Angel Tear Falls'],
    'Eagle Nest Inn': ['Enchanted Glade'],
    'Eagle Peak Pass': ['Orc Valley', 'Whispering Woods', 'Amarak Peak'],
    'Enchanted Glade': ['Eagle Nest Inn', 'Unicorn Forest', 'Rock Bridge Pass'],
    'Father Oak Forest': ['Brookdale Village', 'Sea Bird Port', 'Pleasant Hill', 'Wolf Pass', 'Monarch City'],
    'Fire River': ['Angel Tear Falls', 'Mermaid Harbor', 'Crystal Hills'],
    'Ghost Marsh': ['Amarak Peak'],
    'Golden Oak Forest': ['Dark Woods', 'Rock Bridge Pass'],
    'Greenleaf Village': ['Monarch City', 'Bounty Bay', 'Dancing Stone', 'Ancient Ruins', 'Mountains of Mist'],
    'Gryphon Forest': ['Seagaul Lagoon', 'Gryphon Inn', 'Serpent Swamp'],
    'Gryphon Inn': ['Gryphon Forest'],
    'Heaven\'s Glade': ['Whispering Woods', 'Ancient Ruins', 'Thorny Woods', 'Blizzard Mountains'],
    'Land of Amazons': ['Mermaid Harbor', 'Mountains of Mist', 'Wyvern Forest', 'Cursed Plateau'],
    'McCorm Highlands': ['Serpent Swamp', 'Amarak Peak'],
    'Mermaid Harbor': ['Bounty Bay', 'Fire River', 'Land of Amazons', 'Crystal Hills', 'Wyvern Forest'],
    'Minotaur Forest': ['Seagaul Lagoon', 'Wolf Pass'],
    'Monarch City': ['Father Oak Forest', 'Wolf Pass', 'Bounty Bay', 'Orc Valley', 'Dancing Stone', 'Greenleaf Village'],
    'Mountains of Mist': ['Greenleaf Village', 'Land of Amazons', 'Withered Hills'],
    'Orc Valley': ['Wolf Pass', 'Monarch City', 'Dancing Stone', 'Eagle Peak Pass', 'Whispering Woods'],
    'Pleasant Hill': ['Brookdale Village', 'Raven Forest', 'Father Oak Forest', 'Angel Tear Falls'],
    'Raven Forest': ['Blood Flats', 'Scorpion Canyon', 'Pleasant Hill', 'Angel Tear Falls'],
    'Rock Bridge Pass': ['Golden Oak Forest', 'Enchanted Glade', 'Windy Pass', 'Brookdale Village', 'Sea Bird Port'],
    'Scorpion Canyon': ['Blood Flats', 'Raven Forest'],
    'Sea Bird Port': ['Windy Pass', 'Rock Bridge Pass', 'Brookdale Village', 'Father Oak Forest'],
    'Seagaul Lagoon': ['Minotaur Forest', 'Wolf Pass', 'Gryphon Forest'],
    'Serpent Swamp': ['Gryphon Forest', 'McCorm Highlands'],
    'Thorny Woods': ['Amarak Peak', 'Heaven\'s Glade'],
    'Unicorn Forest': ['Enchanted Glade', 'Blood Flats', 'Brookdale Village'],
    'Whispering Woods': ['Dancing Stone', 'Eagle Peak Pass', 'Ancient Ruins', 'Heaven\'s Glade', 'Orc Valley'],
    'Windy Pass': ['Dark Woods', 'Rock Bridge Pass', 'Sea Bird Port'],
    'Withered Hills': ['Mountains of Mist', 'Blizzard Mountains', 'Cursed Plateau', 'Chimera Inn'],
    'Wolf Pass': ['Minotaur Forest', 'Father Oak Forest', 'Seagaul Lagoon', 'Monarch City', 'Orc Valley'],
    'Wyvern Forest': ['Mermaid Harbor', 'Land of Amazons', 'Crystal Hills', 'Cursed Plateau']
};
