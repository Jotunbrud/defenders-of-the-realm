// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Game Setup Modal
// Shown between splash screen and hero selection.
// Handles game mode selection and expansion toggles.
// ═══════════════════════════════════════════════════════════════

Object.assign(game, {

    // ── State ──────────────────────────────────────────────────
    gameMode: 'normal',           // 'easy' | 'normal' | 'hard'
    activeExpansions: new Set(),  // set of expansion keys

    // ── Mode-specific rule options (display only for now) ──────
    EASY_RULES: [
        { key: 'easy_darkness',  label: 'During setup, instead of drawing 3 &amp; 3 Darkness Spreads Cards (total 6), only draw 2 &amp; 2 (24 minions instead of 30).' },
        { key: 'easy_no_penalty', label: 'Players suffer no penalty if they lose a battle against a General.' },
        { key: 'easy_3_cards',   label: 'Start the game with 3 Hero Cards per player.' },
        { key: 'easy_life',      label: 'Add 1 Life Token to each hero.' },
    ],
    HARD_RULES: [
        { key: 'hard_overrun',   label: 'Allow Overruns and Tainting on the game set up.' },
        { key: 'hard_life',      label: 'Reduce hero Life Tokens by 1.' },
        { key: 'hard_specials',  label: 'Remove 1 to 6 Purple (Special) Hero Cards — the more you remove, the more difficult the game.' },
        { key: 'hard_quiet',     label: 'Remove some or all of the All is Quiet cards from the Darkness Spreads deck.' },
        { key: 'hard_minions',   label: 'Remove 5 minions of each enemy type.' },
    ],
    activeRules: new Set(),
    EXPANSIONS: {
        hero_expansion: {
            label: 'Hero Expansion',
            description: 'Adds 3 new heroes to the playable roster.',
            heroes: ['Barbarian', 'Errant Paladin', 'Noble Dwarf'],
        },
        // Future expansions go here
    },

    // ── Show / hide ────────────────────────────────────────────
    showGameSetupModal() {
        this._renderGameSetupModal();
        document.getElementById('game-setup-modal').classList.add('active');
    },

    _renderGameSetupModal() {
        // ── Game Mode pills ──
        const modes = [
            { key: 'easy',   label: 'Easy'   },
            { key: 'normal', label: 'Normal' },
            { key: 'hard',   label: 'Hard'   },
        ];
        const modeHTML = modes.map(m => {
            const sel = this.gameMode === m.key;
            const selStyle = sel
                ? 'border:2px solid #d4af37;background:rgba(212,175,55,0.2);box-shadow:0 0 8px rgba(212,175,55,0.35);'
                : 'border:2px solid #8b7355;background:rgba(92,61,46,0.06);';
            return `<div onclick="game.selectGameMode('${m.key}')" id="mode-pill-${m.key}"
                style="${selStyle}border-radius:8px;padding:10px 18px;cursor:pointer;
                       font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;
                       color:#3d2b1f;transition:all 0.15s;flex:1;text-align:center">
                ${m.label}
            </div>`;
        }).join('');

        // ── Expansion rows ──
        const expansionHTML = Object.entries(this.EXPANSIONS).map(([key, exp]) => {
            const checked = this.activeExpansions.has(key);
            const heroList = exp.heroes
                ? `<div class="modal-desc-text" style="font-size:0.75em;color:#8b7355;margin-top:3px">
                       Includes: ${exp.heroes.join(', ')}
                   </div>`
                : '';
            const cbStyle = checked
                ? `background:#6d28a8;border:2px solid #6d28a8;`
                : `background:transparent;border:2px solid #8b7355;`;
            return `
                <div onclick="game.toggleExpansion('${key}')"
                     style="display:flex;align-items:flex-start;gap:12px;padding:10px;
                            border:1px solid rgba(139,115,85,0.3);border-radius:8px;
                            background:rgba(92,61,46,0.06);cursor:pointer;margin-bottom:8px;
                            transition:all 0.15s">
                    <span id="exp-check-${key}"
                          style="display:inline-flex;align-items:center;justify-content:center;
                                 width:20px;height:20px;${cbStyle}border-radius:3px;
                                 flex-shrink:0;font-size:0.85em;font-weight:900;color:#fff;margin-top:2px">
                        ${checked ? '✓' : ''}
                    </span>
                    <div>
                        <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;
                                    font-size:0.88em;color:#3d2b1f">${exp.label}</div>
                        <div class="modal-desc-text" style="font-size:0.78em;color:#5c3d2e;margin-top:2px">
                            ${exp.description}
                        </div>
                        ${heroList}
                    </div>
                </div>`;
        }).join('');

        document.getElementById('game-setup-mode-section').innerHTML = modeHTML;
        document.getElementById('game-setup-expansion-section').innerHTML = expansionHTML
            || `<div class="modal-desc-text" style="font-size:0.82em;color:#8b7355">No expansions available.</div>`;
        this._renderRuleOptions();
    },

    // ── Rule options rendering ─────────────────────────────────
    _renderRuleOptions() {
        const container = document.getElementById('game-setup-rules-section');
        if (!container) return;

        const rules = this.gameMode === 'easy' ? this.EASY_RULES
                    : this.gameMode === 'hard' ? this.HARD_RULES
                    : null;

        if (!rules) {
            container.style.display = 'none';
            return;
        }

        const isHard = this.gameMode === 'hard';
        const checkColor = isHard ? '#b91c1c' : '#15803d';
        const bannerLabel = isHard ? 'Hard Mode Options' : 'Easy Mode Options';

        const rowsHTML = rules.map(r => {
            const checked = this.activeRules.has(r.key);
            const cbStyle = checked
                ? `background:${checkColor};border:2px solid ${checkColor};`
                : `background:transparent;border:2px solid #8b7355;`;
            return `<div onclick="game.toggleRule('${r.key}')"
                         style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;
                                border-bottom:1px solid rgba(139,115,85,0.2);cursor:pointer">
                        <span id="rule-check-${r.key}"
                              style="display:inline-flex;align-items:center;justify-content:center;
                                     width:18px;height:18px;${cbStyle}border-radius:3px;
                                     flex-shrink:0;font-size:0.75em;font-weight:900;color:#fff;margin-top:1px">
                            ${checked ? '✓' : ''}
                        </span>
                        <div class="modal-desc-text" style="font-size:0.8em;color:#3d2b1f;line-height:1.5">
                            ${r.label}
                        </div>
                    </div>`;
        }).join('');

        container.innerHTML = `
            <div class="parchment-box" style="margin-top:10px">
                <div class="parchment-banner">
                    <span class="hero-banner-name" style="font-size:0.9em">${bannerLabel}</span>
                </div>
                <div style="margin-top:6px">${rowsHTML}</div>
            </div>`;
        container.style.display = 'block';
    },

    toggleRule(key) {
        const checkColor = this.gameMode === 'hard' ? '#b91c1c' : '#15803d';
        const el = document.getElementById(`rule-check-${key}`);
        if (this.activeRules.has(key)) {
            this.activeRules.delete(key);
            if (el) { el.textContent = ''; el.style.background = 'transparent'; el.style.border = '2px solid #8b7355'; }
        } else {
            this.activeRules.add(key);
            if (el) { el.textContent = '✓'; el.style.background = checkColor; el.style.border = `2px solid ${checkColor}`; }
        }
    },

    // ── Game mode selection ────────────────────────────────────
    selectGameMode(mode) {
        this.gameMode = mode;
        this.activeRules = new Set(); // reset rule selections on mode change
        // Update pill highlights
        ['easy', 'normal', 'hard'].forEach(m => {
            const el = document.getElementById(`mode-pill-${m}`);
            if (!el) return;
            if (m === mode) {
                el.style.border = '2px solid #d4af37';
                el.style.background = 'rgba(212,175,55,0.2)';
                el.style.boxShadow = '0 0 8px rgba(212,175,55,0.35)';
            } else {
                el.style.border = '2px solid #8b7355';
                el.style.background = 'rgba(92,61,46,0.06)';
                el.style.boxShadow = '';
            }
        });
        this._renderRuleOptions();
    },
    toggleExpansion(key) {
        const check = document.getElementById(`exp-check-${key}`);
        if (this.activeExpansions.has(key)) {
            this.activeExpansions.delete(key);
            if (check) { check.textContent = ''; check.style.background = 'transparent'; check.style.border = '2px solid #8b7355'; }
        } else {
            this.activeExpansions.add(key);
            if (check) { check.textContent = '✓'; check.style.background = '#6d28a8'; check.style.border = '2px solid #6d28a8'; }
        }
    },

    // ── Confirm setup → show hero selection ───────────────────
    confirmGameSetup() {
        // Apply expansion heroes to game.heroes (add if not already present)
        if (this.activeExpansions.has('hero_expansion') && typeof EXPANSION_HEROES_DATA !== 'undefined') {
            EXPANSION_HEROES_DATA.forEach(expHero => {
                const already = this.heroes.some(h => h.name === expHero.name);
                if (!already) this.heroes.push(JSON.parse(JSON.stringify(expHero)));
            });
        } else {
            // Remove expansion heroes if unchecked (reset to base)
            if (typeof EXPANSION_HEROES_DATA !== 'undefined') {
                const expNames = EXPANSION_HEROES_DATA.map(h => h.name);
                this.heroes = this.heroes.filter(h => !expNames.includes(h.name));
            }
        }

        // Apply game mode settings (placeholder — modes defined later)
        // this._applyGameMode(this.gameMode);

        document.getElementById('game-setup-modal').classList.remove('active');
        document.getElementById('setup-modal').classList.add('active');
        this.renderSetupScreen();
    },
});
