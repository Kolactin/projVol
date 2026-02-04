document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO DA APLICAÇÃO ---
    // --- ESTADO DA APLICAÇÃO ---
    let players = [];
    let scoreboardHistory = [];
    let gameTimeline = [];
    let pendingAction = null;
    let selectedPlayerIdForAction = null; // [NEW] Track who was clicked on court

    // --- ELEMENTOS DO DOM ---
    const form = document.getElementById('add-player-form');
    const startersBox = document.querySelector('.starters-box');
    const reservesList = document.getElementById('reserves-list');
    const tableBodies = { ata: document.querySelector('#table-ata tbody'), lev: document.querySelector('#table-lev tbody'), def: document.querySelector('#table-def tbody') };
    const timelineFeed = document.getElementById('timeline-feed');
    const placarContainer = document.getElementById('placar-container');
    const courtPositions = document.querySelectorAll('.court-position'); // [NEW] Court positions
    const tabBtns = document.querySelectorAll('.tab-btn'); // [NEW] Tabs
    const tabContents = document.querySelectorAll('.tab-content'); // [NEW] Tabs
    const btnAddCasa = document.getElementById('btn-add-casa');
    const btnAddFora = document.getElementById('btn-add-fora');
    const btnRemoveLast = document.getElementById('btn-remove-last');
    const btnResetPlacar = document.getElementById('btn-reset-placar');
    const btnSaveGame = document.getElementById('btn-save-game');
    const btnLoadGame = document.getElementById('btn-load-game');
    const fileLoader = document.getElementById('file-loader');
    const btnNewGame = document.getElementById('btn-new-game');
    const actionModal = document.getElementById('action-detail-modal');
    const actionModalOptions = document.getElementById('action-modal-options');
    const actionModalCancelBtn = document.getElementById('action-modal-cancel-btn');
    const settingMapModal = document.getElementById('setting-map-modal');
    const settingModalOptions = document.getElementById('setting-modal-options');
    const settingModalCancelBtn = document.getElementById('setting-modal-cancel-btn');

    // --- DEFINIÇÃO DAS AÇÕES (com o novo botão A+L) ---
    // --- DEFINIÇÃO DAS AÇÕES (Expandida e Universal) ---
    const commonActions = [
        { label: 'Passe A', type: 'success', stat: 'passes', substat: 'passesCertos', description: 'Passe Perfeito (A)' },
        { label: 'Passe B', type: 'warning', stat: 'passes', substat: 'passesQuebrados', description: 'Passe Quebrado (B)' }, // New substat needed? For now just track as pass
        { label: 'Passe Erro', type: 'error', stat: 'passes', description: 'Erro de Passe' },
        { label: 'Defesa A', type: 'success', stat: 'defesas', substat: 'defesasCertas', description: 'Defesa Perfeita' },
        { label: 'Defesa Erro', type: 'error', stat: 'defesas', description: 'Erro de Defesa' },
        { label: 'Levant. Certo', type: 'success', stat: 'levantamentos', substat: 'levantamentosCertos', description: 'Bom levantamento' },
        { label: 'Levant. Erro', type: 'error', stat: 'levantamentos', description: 'Erro de Levantamento' },
    ];

    const attackActions = [
        { label: 'Ataque Kill', type: 'success', stat: 'ataques', substat: 'ataquesCertos', description: 'Ataque Ponto (Kill)', requiresTarget: true },
        { label: 'Ataque Erro', type: 'error', stat: 'ataques', description: 'Erro de Ataque' },
        { label: 'Bloqueio Kill', type: 'success', stat: 'bloqueios', substat: 'bloqueiosCertos', description: 'Bloqueio Ponto' },
        { label: 'Bloqueio Erro', type: 'error', stat: 'bloqueios', description: 'Erro de Bloqueio (Toque na rede/fora)' },
        { label: 'Saque', type: 'success', stat: 'saques', description: 'Saque em jogo', requiresTarget: true },
        { label: 'Saque Erro', type: 'error', stat: 'saques', description: 'Erro de Saque' },
    ];

    // Libero cannot attack, serve, or block. Everyone else can do everything.
    const playerActions = {
        universal: [...commonActions, ...attackActions],
        libero: [...commonActions] // Libero limited
    };

    // --- LÓGICA (Funções de salvamento, carregamento, lógica de jogo) ---
    const saveState = () => { const gameState = { players, scoreboardHistory, gameTimeline }; localStorage.setItem('voleiScoutState', JSON.stringify(gameState)); };
    const loadState = () => { const savedStateJSON = localStorage.getItem('voleiScoutState'); if (savedStateJSON) { const savedState = JSON.parse(savedStateJSON); players = savedState.players || []; scoreboardHistory = savedState.scoreboardHistory || []; gameTimeline = savedState.gameTimeline || []; } };
    const exportGameToFile = () => { const gameState = { players, scoreboardHistory, gameTimeline }; const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gameState, null, 2)); const downloadAnchorNode = document.createElement('a'); downloadAnchorNode.setAttribute("href", dataStr); downloadAnchorNode.setAttribute("download", `scout_volei_${new Date().toISOString().slice(0, 10)}.json`); document.body.appendChild(downloadAnchorNode); downloadAnchorNode.click(); downloadAnchorNode.remove(); };
    const importGameFromFile = (event) => { const reader = new FileReader(); reader.onload = (e) => { try { const loadedState = JSON.parse(e.target.result); if (loadedState.players && loadedState.scoreboardHistory && loadedState.gameTimeline) { players = loadedState.players; scoreboardHistory = loadedState.scoreboardHistory; gameTimeline = loadedState.gameTimeline; saveState(); renderAll(); alert('Jogo carregado com sucesso!'); } else { alert('Arquivo inválido ou corrompido.'); } } catch (error) { alert('Erro ao ler o arquivo.'); console.error("Erro ao carregar o jogo:", error); } }; reader.readAsText(event.target.files[0]); };
    const startNewGame = () => { if (confirm("Você tem certeza que quer apagar TODOS os jogadores e dados da partida?")) { players = []; scoreboardHistory = []; gameTimeline = []; saveState(); renderAll(); } };
    const handleAddPlayer = (event) => { event.preventDefault(); const nameInput = document.getElementById('player-name-input'); const name = nameInput.value.trim(); const functionRadio = document.querySelector('input[name="funcao"]:checked'); const positionRadio = document.querySelector('input[name="posicao"]:checked'); if (!name || !functionRadio || !positionRadio) { alert('Por favor, preencha nome, função e posição inicial.'); return; } players.push({ id: `player-${Date.now()}`, name, funcao: functionRadio.value, posicao: positionRadio.value, stats: { ataques: 0, ataquesCertos: 0, saques: 0, saquesCertos: 0, passes: 0, passesCertos: 0, levantamentos: 0, levantamentosCertos: 0, defesas: 0, defesasCertas: 0, bloqueios: 0, bloqueiosCertos: 0, levantamentosPorQualidade: { '6m': 0, '7m': 0, '8m': 0, '9m': 0 } } }); saveState(); renderAll(); form.reset(); nameInput.focus(); };
    const initiateSubstitution = (reservePlayerId) => { const reservePlayer = players.find(p => p.id === reservePlayerId); if (!reservePlayer) return; const starters = players.filter(p => p.posicao.startsWith('P')).map(s => `${s.posicao}: ${s.name}`).join('\n'); const promptMessage = `Substituir com ${reservePlayer.name}.\n\nTitulares:\n${starters}\n\nDigite a posição (ex: P1):`; const targetPositionInput = prompt(promptMessage); if (!targetPositionInput) return; const targetPosition = targetPositionInput.trim().toUpperCase(); if (!['P1', 'P2', 'P3', 'P4', 'P5', 'P6'].includes(targetPosition)) { alert('Posição inválida.'); return; } const frontRowPositions = ['P4', 'P3', 'P2']; if (reservePlayer.funcao === 'libero' && frontRowPositions.includes(targetPosition)) { alert('Ação inválida! O líbero não pode entrar em uma posição de ataque (P4, P3 ou P2).'); return; } const starterPlayer = players.find(p => p.posicao === targetPosition); if (!starterPlayer) { alert(`Não há jogador na posição ${targetPosition}.`); return; } const substitutionAction = { description: `⇄ Substituição: ${reservePlayer.name} (entra) ↔ ${starterPlayer.name} (sai)`, isStat: false }; starterPlayer.posicao = 'Reserva'; reservePlayer.posicao = targetPosition; addTimelineEntry(substitutionAction); saveState(); renderAll(); };
    const updatePlayerStat = (playerId, stat, substat, description, targetPosition = null, settingQuality = null) => {
        const player = players.find(p => p.id === playerId);
        if (!player) return;
        player.stats[stat]++;
        if (substat) player.stats[substat]++;
        if (settingQuality && player.stats.levantamentosPorQualidade) {
            player.stats.levantamentosPorQualidade[settingQuality]++;
        }
        let actionDescription = `${description} de ${player.name} (${player.posicao})`;
        if (targetPosition) {
            actionDescription += ` na ${targetPosition} adversária`;
        }
        if (settingQuality) {
            actionDescription += ` (Levantamento: ${settingQuality})`;
        }

        // [NEW] Auto-Scoring Logic
        // Check 1: Is it an Error? -> Point for Opponent
        const isError = description.toLowerCase().includes('erro') || description.includes('⨉');
        // Check 2: Is it a Point (Kill/Ace/Block Point)? -> Point for Home
        const isPoint = (substat === 'ataquesCertos' && description.includes('Kill')) ||
            (substat === 'saquesCertos' && description.includes('Ace')) ||
            (substat === 'bloqueiosCertos' && description.includes('Ponto'));

        const actionData = { description: actionDescription, isStat: true, playerId, stat, substat };
        addTimelineEntry(actionData);
        saveState();
        renderStatsTables();

        // Trigger Score updates asynchronously to allow UI to render the action first
        setTimeout(() => {
            if (isPoint) {
                addScorePoint('Casa');
            } else if (isError) {
                addScorePoint('Fora');
            }
        }, 100);
    };
    const openActionDetailModal = (actionDetails) => { pendingAction = actionDetails; const allButtons = actionModalOptions.querySelectorAll('button'); const isBlockAction = pendingAction.stat === 'bloqueios'; allButtons.forEach(button => { const pos = button.dataset.targetPos; if (isBlockAction) { if (['P2', 'P3', 'P4'].includes(pos)) { button.style.display = 'inline-block'; } else { button.style.display = 'none'; } } else { button.style.display = 'inline-block'; } }); actionModal.classList.remove('hidden'); };
    const closeActionDetailModal = () => { actionModal.classList.add('hidden'); pendingAction = null; };
    const openSettingMapModal = (actionDetails) => { pendingAction = actionDetails; settingMapModal.classList.remove('hidden'); };
    const closeSettingMapModal = () => { settingMapModal.classList.add('hidden'); pendingAction = null; };
    const handleActionTargetSelection = (event) => { const targetPosition = event.target.closest('button').dataset.targetPos; if (targetPosition && pendingAction) { const { playerId, stat, substat, description, settingQuality } = pendingAction; updatePlayerStat(playerId, stat, substat, description, targetPosition, settingQuality); } closeActionDetailModal(); };
    const handleSettingMapSelection = (event) => { const quality = event.target.closest('button').dataset.quality; if (quality && pendingAction) { const setter = players.find(p => p.funcao === 'levantador' && p.posicao.startsWith('P')); if (setter) { setter.stats.levantamentos++; setter.stats.levantamentosCertos++; if (setter.stats.levantamentosPorQualidade) { setter.stats.levantamentosPorQualidade[quality]++; } } pendingAction.settingQuality = quality; closeSettingMapModal(); openActionDetailModal(pendingAction); } else { closeSettingMapModal(); } };
    const addTimelineEntry = (actionData) => { const casaPontos = scoreboardHistory.filter(p => p === 'Casa').length; const foraPontos = scoreboardHistory.filter(p => p === 'Fora').length; const currentScore = `${casaPontos} x ${foraPontos}`; const lastRally = gameTimeline[gameTimeline.length - 1]; if (!lastRally || lastRally.score !== currentScore) { gameTimeline.push({ id: `rally-${Date.now()}`, score: currentScore, actions: [actionData] }); } else { lastRally.actions.push(actionData); } renderTimeline(); };
    const addScorePoint = (team) => { const lastPoint = scoreboardHistory[scoreboardHistory.length - 1]; if (team === 'Casa' && lastPoint === 'Fora') { rotatePlayers(); } const pointAction = { description: `>>> Ponto para ${team}! <<<`, isStat: false }; addTimelineEntry(pointAction); scoreboardHistory.push(team); saveState(); renderScoreboard(); };
    const removeLastScorePoint = () => { if (scoreboardHistory.length === 0) return; const pointToRemove = scoreboardHistory[scoreboardHistory.length - 1]; const previousPoint = scoreboardHistory[scoreboardHistory.length - 2]; const shouldUndoRotation = (pointToRemove === 'Casa' && previousPoint === 'Fora'); const lastRally = gameTimeline[gameTimeline.length - 1]; if (lastRally && lastRally.actions.some(action => action.description.includes(`Ponto para ${pointToRemove}`))) { for (const action of lastRally.actions) { if (action.isStat) { const player = players.find(p => p.id === action.playerId); if (player) { player.stats[action.stat]--; if (action.substat) { player.stats[action.substat]--; } } } } gameTimeline.pop(); } if (shouldUndoRotation) { undoRotation(); } scoreboardHistory.pop(); saveState(); renderAll(); };
    const resetScoreboard = () => { if (confirm("Tem certeza que deseja zerar o placar, a timeline E TODAS as estatísticas dos jogadores?")) { scoreboardHistory = []; gameTimeline = []; players.forEach(player => { player.stats = { ataques: 0, ataquesCertos: 0, saques: 0, saquesCertos: 0, passes: 0, passesCertos: 0, levantamentos: 0, levantamentosCertos: 0, defesas: 0, defesasCertas: 0, bloqueios: 0, bloqueiosCertos: 0, levantamentosPorQualidade: { '6m': 0, '7m': 0, '8m': 0, '9m': 0 } }; }); saveState(); renderAll(); } };
    const rotatePlayers = () => {
        const oldPositions = {};
        players.forEach(player => { if (player.posicao.startsWith('P')) oldPositions[player.posicao] = player; });
        if (Object.keys(oldPositions).length < 6) return;

        // 1. Check Libero Exit (P5 -> P4) - ALREADY EXISTING LOGIC (Refined)
        // Actually rotation happens P5 moves to P4. If P5 was Libero, he must leave.
        const playerInP5 = oldPositions['P5'];
        if (playerInP5 && playerInP5.funcao === 'libero') {
            const substituteCentral = players.find(p => p.funcao === 'central' && p.posicao === 'Reserva');
            if (substituteCentral) {
                // Swap Logic
                const subDesc = `⇄ Libero Sai: ${substituteCentral.name} (entra) ↔ ${playerInP5.name} (sai)`;
                addTimelineEntry({ description: subDesc, isStat: false });
                playerInP5.posicao = 'Reserva';
                substituteCentral.posicao = 'P5';
                oldPositions['P5'] = substituteCentral; // Update map so rotation uses the new guy
            }
        }

        // 2. Perform Physical Rotation
        if (oldPositions.P1) oldPositions.P1.posicao = 'P6';
        if (oldPositions.P2) oldPositions.P2.posicao = 'P1';
        if (oldPositions.P3) oldPositions.P3.posicao = 'P2';
        if (oldPositions.P4) oldPositions.P4.posicao = 'P3';
        if (oldPositions.P5) oldPositions.P5.posicao = 'P4';
        if (oldPositions.P6) oldPositions.P6.posicao = 'P5';

        // 3. Check Libero Entry (Central moved P1 -> P6)
        // Who is now in P6? The one who WAS in P1.
        const playerNowInP6 = oldPositions['P1']; // Because P1 moved to P6
        if (playerNowInP6 && playerNowInP6.funcao === 'central') {
            const reserveLibero = players.find(p => p.funcao === 'libero' && p.posicao === 'Reserva');
            if (reserveLibero) {
                const subDesc = `⇄ Libero Entra: ${reserveLibero.name} (entra) ↔ ${playerNowInP6.name} (sai)`;
                addTimelineEntry({ description: subDesc, isStat: false });
                playerNowInP6.posicao = 'Reserva';
                reserveLibero.posicao = 'P6';
            }
        }

        const rotationAction = { description: "--- Rodízio Realizado ---", isStat: false };
        addTimelineEntry(rotationAction);
        saveState();
        renderRoster();
        renderCourt(); // Force court update
    };
    const undoRotation = () => { const currentPositions = {}; players.forEach(player => { if (player.posicao.startsWith('P')) currentPositions[player.posicao] = player; }); if (Object.keys(currentPositions).length < 6) return; if (currentPositions.P2) currentPositions.P2.posicao = 'P1'; if (currentPositions.P3) currentPositions.P3.posicao = 'P2'; if (currentPositions.P4) currentPositions.P4.posicao = 'P3'; if (currentPositions.P5) currentPositions.P5.posicao = 'P4'; if (currentPositions.P6) currentPositions.P6.posicao = 'P5'; if (currentPositions.P1) currentPositions.P1.posicao = 'P6'; };

    // --- RENDERIZAÇÃO ---
    const renderRoster = () => {
        // No longer rendering "Starters List" text box, as we have the visual court.
        // Only rendering Reserves (Bench)
        if (!reservesList) return;
        reservesList.innerHTML = '';

        const reserves = players.filter(p => p.posicao === 'Reserva');
        if (reserves.length === 0) {
            reservesList.innerHTML = '<span style="color:var(--color-text-secondary); font-size:0.8rem;">Banco vazio</span>';
        } else {
            reserves.forEach(player => {
                const reserveChip = document.createElement('div');
                reserveChip.className = 'reserve-player clickable-reserve';
                reserveChip.dataset.playerId = player.id;
                reserveChip.textContent = `${player.name} (${player.funcao})`;
                reservesList.appendChild(reserveChip);
            });
        }
    };
    const renderStatsTables = () => { if (!tableBodies.ata) return; tableBodies.ata.innerHTML = ''; if (tableBodies.lev) tableBodies.lev.innerHTML = ''; if (tableBodies.def) tableBodies.def.innerHTML = ''; players.forEach(player => { const s = player.stats; let rowHtml = ''; let targetTableBody = null; switch (player.funcao) { case 'central': case 'ponteiro': case 'oposto': const totalAtacante = s.ataques + s.saques + s.passes + s.bloqueios; const acertosAtacante = s.ataquesCertos + s.saquesCertos + s.passesCertos + s.bloqueiosCertos; const percAtacante = totalAtacante > 0 ? ((acertosAtacante / totalAtacante) * 100).toFixed(1) + '%' : '0%'; rowHtml = `<tr><td>${player.name}</td><td>${player.funcao}</td><td>${s.ataques}</td><td>${s.ataquesCertos}</td><td>X</td><td>${s.saques}</td><td>${s.saquesCertos}</td><td>${s.passes}</td><td>${s.passesCertos}</td><td>${percAtacante}</td></tr>`; targetTableBody = tableBodies.ata; break; case 'levantador': const totalLev = s.levantamentos + s.saques; const acertosLev = s.levantamentosCertos + s.saquesCertos; const percLev = totalLev > 0 ? ((acertosLev / totalLev) * 100).toFixed(1) + '%' : '0%'; rowHtml = `<tr><td>${player.name}</td><td>${s.levantamentos}</td><td>${s.levantamentosCertos}</td><td>X</td><td>${s.ataques}</td><td>${s.ataquesCertos}</td><td>${s.saques}</td><td>${s.saquesCertos}</td><td>${percLev}</td></tr>`; targetTableBody = tableBodies.lev; break; case 'libero': const totalLibero = s.defesas + s.passes; const acertosLibero = s.defesasCertas + s.passesCertos; const percLibero = totalLibero > 0 ? ((acertosLibero / totalLibero) * 100).toFixed(1) + '%' : '0%'; rowHtml = `<tr><td>${player.name}</td><td>${s.defesas}</td><td>${s.defesasCertas}</td><td>X</td><td>${s.passes}</td><td>${s.passesCertos}</td><td>${s.levantamentos}</td><td>${s.levantamentosCertos}</td><td>${percLibero}</td></tr>`; targetTableBody = tableBodies.def; break; } if (targetTableBody && rowHtml) targetTableBody.innerHTML += rowHtml; }); };
    const renderTimeline = () => { if (!timelineFeed) return; if (gameTimeline.length === 0) { timelineFeed.innerHTML = `<p class="timeline-empty">Nenhum ponto registrado ainda.</p>`; return; } timelineFeed.innerHTML = ''; gameTimeline.forEach(rally => { const entryDiv = document.createElement('div'); entryDiv.className = 'timeline-entry'; const header = `<div class="timeline-header"><span class="timeline-score">${rally.score}</span></div>`; const actionsList = rally.actions.map(action => `<li>${action.description}</li>`).join(''); const actionsHtml = `<ul class="timeline-actions">${actionsList}</ul>`; entryDiv.innerHTML = header + actionsHtml; timelineFeed.appendChild(entryDiv); }); };
    const renderScoreboard = () => {
        if (!placarContainer) return;
        const casaPontos = scoreboardHistory.filter(p => p === 'Casa').length;
        const foraPontos = scoreboardHistory.filter(p => p === 'Fora').length;

        placarContainer.innerHTML = `
            <div class="placar-team score-home">
                <div class="score-digit">${casaPontos.toString().padStart(2, '0')}</div>
                <div class="team-label">CASA</div>
            </div>
            <div class="placar-team score-away">
                <div class="score-digit">${foraPontos.toString().padStart(2, '0')}</div>
                <div class="team-label">FORA</div>
            </div>
        `;
    };

    const renderCourt = () => {
        const courtDiv = document.querySelector('.court');
        if (!courtDiv) return;

        // Clean up ONLY players that are no longer in the list (or reset) but keep persistent ones
        // actually simplest strategy for smooth rotation: 
        // 1. Find or Create a DIV for each player in 'players' who has a "P" position.
        // 2. Update their Class to match the position (e.g. "p4").
        // 3. Remove DIVs for players who are now "Reserva" IF they were previously on court (or just hide them).

        // Remove players who are reserves
        const existingTokens = document.querySelectorAll('.player-token');
        existingTokens.forEach(token => {
            const pId = token.dataset.playerId;
            const stillInMemory = players.find(p => p.id === pId);
            if (!stillInMemory || stillInMemory.posicao === 'Reserva') {
                token.remove();
            }
        });

        // Add/Update starters
        const starters = players.filter(p => p.posicao.startsWith('P'));
        starters.forEach(player => {
            let token = document.querySelector(`.player-token[data-player-id="${player.id}"]`);
            if (!token) {
                token = document.createElement('div');
                token.className = 'player-token court-position';
                token.dataset.playerId = player.id;
                token.onclick = () => openCourtActionModal(player); // Click to open actions
                courtDiv.appendChild(token);
            }

            // Update Visuals
            token.innerHTML = `
                <span class="p-pos">${player.posicao}</span>
                <span class="p-name">${player.name}</span>
            `;
            token.title = `${player.name} (${player.funcao})`;

            // Remove old position classes and add new one
            ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].forEach(c => token.classList.remove(c));
            token.classList.add(player.posicao.toLowerCase()); // e.g. "p1"
        });
    };

    const openCourtActionModal = (player) => {
        selectedPlayerIdForAction = player.id;
        const modal = document.createElement('div');
        modal.id = 'court-action-modal';
        modal.className = 'modal-overlay';

        let actionsToRender = player.funcao === 'libero' ? playerActions.libero : playerActions.universal;

        const buttonsHtml = actionsToRender.map(action => `
            <button class="btn action-btn ${action.type === 'success' ? 'btn-success' : (action.type === 'warning' ? 'btn-warning' : 'btn-error')}"
                data-stat="${action.stat}"
                data-substat="${action.substat || ''}"
                data-desc="${action.description}"
                data-req-target="${action.requiresTarget || false}">
                ${action.label}
            </button>
        `).join('');

        modal.innerHTML = `
            <div class="modal-content">
                <h3>Ação: ${player.name}</h3>
                <div class="action-grid-large">
                    ${buttonsHtml}
                </div>
                <button class="btn btn-secondary" onclick="document.getElementById('court-action-modal').remove()">Cancelar</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Add Listeners to these new buttons
        modal.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { stat, substat, desc, reqTarget } = e.target.dataset;
                document.getElementById('court-action-modal').remove();

                if (reqTarget === 'true') {
                    // Re-use existing target modal logic
                    pendingAction = { playerId: selectedPlayerIdForAction, stat, substat, description: desc };
                    openActionDetailModal(pendingAction);
                } else {
                    updatePlayerStat(selectedPlayerIdForAction, stat, substat, desc);
                }
            });
        });
    };
    const renderAll = () => { renderRoster(); renderStatsTables(); renderScoreboard(); renderTimeline(); renderCourt(); };

    // --- CONECTORES DE EVENTOS ---
    if (form) form.addEventListener('submit', handleAddPlayer);
    if (reservesList) reservesList.addEventListener('click', e => { const target = e.target.closest('.clickable-reserve'); if (target) initiateSubstitution(target.dataset.playerId); });
    if (startersBox) startersBox.addEventListener('click', e => {
        const starterCard = e.target.closest('.starter-player');
        const actionButton = e.target.closest('.action-btn');
        if (actionButton) {
            e.stopPropagation();
            const { playerId, stat, substat, description, requiresTarget, requiresSettingMap } = actionButton.dataset;
            if (requiresSettingMap === 'true') {
                openSettingMapModal({ playerId, stat, substat, description, requiresTarget });
            } else if (requiresTarget === 'true') {
                openActionDetailModal({ playerId, stat, substat, description });
            } else {
                updatePlayerStat(playerId, stat, substat, description);
            }
            return;
        }
        if (starterCard) { const isActive = starterCard.classList.contains('active'); document.querySelectorAll('.starter-player.active').forEach(card => card.classList.remove('active')); if (!isActive) { starterCard.classList.add('active'); } }
    });
    if (actionModalOptions) actionModalOptions.addEventListener('click', handleActionTargetSelection);
    if (actionModalCancelBtn) actionModalCancelBtn.addEventListener('click', closeActionDetailModal);
    if (settingModalOptions) settingModalOptions.addEventListener('click', handleSettingMapSelection);
    if (settingModalCancelBtn) settingModalCancelBtn.addEventListener('click', closeSettingMapModal);
    if (btnAddCasa) btnAddCasa.addEventListener('click', () => addScorePoint('Casa'));
    if (btnAddFora) btnAddFora.addEventListener('click', () => addScorePoint('Fora'));
    if (btnRemoveLast) btnRemoveLast.addEventListener('click', removeLastScorePoint);
    if (btnResetPlacar) btnResetPlacar.addEventListener('click', resetScoreboard);
    if (btnSaveGame) btnSaveGame.addEventListener('click', exportGameToFile);
    if (btnLoadGame) btnLoadGame.addEventListener('click', () => fileLoader.click());
    if (fileLoader) fileLoader.addEventListener('change', importGameFromFile);
    if (btnNewGame) btnNewGame.addEventListener('click', startNewGame);

    // [NEW] Tabs Logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active to current
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });

    // --- INICIALIZAÇÃO ---
    loadState();
    renderAll();
});