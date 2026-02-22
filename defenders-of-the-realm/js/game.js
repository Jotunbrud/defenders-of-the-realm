// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Core Game State
// Central game object with state variables
// Methods are added by system and UI modules via Object.assign()
// ═══════════════════════════════════════════════════════════════

const game = {
    // Game state
    currentPlayerIndex: 0,
    actionsRemaining: 5,
    rumorsUsedThisTurn: 0,
    loseConditionsDisabled: {},
    overrunsDisabled: false,
    warTrackerLocked: false,
    defeatList: [],
    pendingMinionExhaustion: null,
    warStatus: 'early', // 'early', 'mid', 'late'
    wizardTeleportUsedThisTurn: false,
    showingDarknessOnMap: false,
    pendingDarknessEffects: null,
    selectedCardsForAttack: [],
    selectedGeneralForAttack: null,
    eagleRiderAttackStyle: null, // 'sky' or 'ground'
    eagleRiderRerollUsed: false,
    dwarfDragonSlayerUsed: false,
    rangedAttack: false,
    archeryTargeting: false,
    wizardWisdomRedraw: false,
    eagleRiderFreshMountPending: false,
    shapeshiftForm: null, // 'black', 'blue', 'green', 'red', or null
    ambushMinionUsed: false,
    ambushGeneralUsed: false,
    activeMovement: null,
    questUseMode: null,

    // Data from data modules
    locationCoords: LOCATION_COORDS,
    locationConnections: LOCATION_CONNECTIONS,
    heroes: JSON.parse(JSON.stringify(HEROES_DATA)), // Deep copy for mutable state
    generals: JSON.parse(JSON.stringify(GENERALS_DATA)),

    selectedHeroes: [],

    // General wound tracking
    generalWounds: {},

    // Minions by location
    minions: {},
    taintCrystals: {},
    taintCrystalsRemaining: 12,
    _originalMagicGates: new Set(),

    // Discard piles
    heroDiscardPile: 0,
    darknessDiscardPile: 0,
    questDiscardPile: 0,
    playedSpecialCards: [],

    gameLog: [],
    draggedToken: null,
};

// Expose game to window scope for onclick handlers
window.game = game;
