document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO DA APLICAÇÃO ---
    let players = [];
    let scoreboardHistory = [];
    let gameTimeline = [];
    let pendingAction = null;

    // --- ELEMENTOS DO DOM ---
    const form = document.getElementById('add-player-form');
    const startersBox = document.querySelector('.starters-box');
    const reservesList = document.getElementById('reserves-list');
    const tableBodies = { ata: document.querySelector('#table-ata tbody'), lev: document.querySelector('#table-lev tbody'), def: document.querySelector('#table-def tbody') };
    const timelineFeed = document.getElementById('timeline-feed');
    const placarContainer = document.getElementById('placar-container');
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
    
    // --- DEFINIÇÃO DAS AÇÕES POR FUNÇÃO ---
    const playerActions = {
        atacante: [
            { label: 'A ✓', type: 'success', stat: 'ataques', substat: 'ataquesCertos', description: 'Ataque Certo', requiresTarget: true, requiresSettingMap: true },
            { label: 'A ⨉', type: 'error', stat: 'ataques', description: 'Ataque errado' },
            { label: 'B ✓', type: 'success', stat: 'bloqueios', substat: 'bloqueiosCertos', description: 'Bloqueio', requiresTarget: true },
            { label: 'S ✓', type: 'success', stat: 'saques', substat: 'saquesCertos', description: 'Bom saque', requiresTarget: true },
            { label: 'S ⨉', type: 'error', stat: 'saques', description: 'Erro de Saque' },
            { label: 'P ✓', type: 'success', stat: 'passes', substat: 'passesCertos', description: 'Bom passe' },
            { label: 'P ⨉', type: 'error', stat: 'passes', description: 'Erro de Passe' },
        ],
        levantador: [
            { label: 'L ✓', type: 'success', stat: 'levantamentos', substat: 'levantamentosCertos', description: 'Bom levantamento' },
            { label: 'L ⨉', type: 'error', stat: 'levantamentos', description: 'Levantamento ruim' },
            { label: 'S ✓', type: 'success', stat: 'saques', substat: 'saquesCertos', description: 'Bom saque', requiresTarget: true },
            { label: 'S ⨉', type: 'error', stat: 'saques', description: 'Erro de Saque' },
        ],
        libero: [
            { label: 'P ✓', type: 'success', stat: 'passes', substat: 'passesCertos', description: 'Bom passe' },
            { label: 'P ⨉', type: 'error', stat: 'passes', description: 'Passe ruim' },
        ]
    };

    // --- SALVAR E CARREGAR ESTADO ---
    const saveState = () => { const gameState = { players, scoreboardHistory, gameTimeline }; localStorage.setItem('voleiScoutState', JSON.stringify(gameState)); };
    const loadState = () => { const savedStateJSON = localStorage.getItem('voleiScoutState'); if (savedStateJSON) { const savedState = JSON.parse(savedStateJSON); players = savedState.players || []; scoreboardHistory = savedState.scoreboardHistory || []; gameTimeline = savedState.gameTimeline || []; } };
    const exportGameToFile = () => { const gameState = { players, scoreboardHistory, gameTimeline }; const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gameState, null, 2)); const downloadAnchorNode = document.createElement('a'); downloadAnchorNode.setAttribute("href", dataStr); downloadAnchorNode.setAttribute("download", `scout_volei_${new Date().toISOString().slice(0,10)}.json`); document.body.appendChild(downloadAnchorNode); downloadAnchorNode.click(); downloadAnchorNode.remove(); };
    const importGameFromFile = (event) => { const reader = new FileReader(); reader.onload = (e) => { try { const loadedState = JSON.parse(e.target.result); if (loadedState.players && loadedState.scoreboardHistory && loadedState.gameTimeline) { players = loadedState.players; scoreboardHistory = loadedState.scoreboardHistory; gameTimeline = loadedState.gameTimeline; saveState(); renderAll(); alert('Jogo carregado com sucesso!'); } else { alert('Arquivo inválido ou corrompido.'); } } catch (error) { alert('Erro ao ler o arquivo.'); console.error("Erro ao carregar o jogo:", error); } }; reader.readAsText(event.target.files[0]); };

    // --- LÓGICA ---
    const startNewGame = () => { if (confirm("Você tem certeza que quer apagar TODOS os jogadores e dados da partida?")) { players = []; scoreboardHistory = []; gameTimeline = []; saveState(); renderAll(); } };
    const handleAddPlayer = (event) => { event.preventDefault(); const nameInput = document.getElementById('player-name-input'); const name = nameInput.value.trim(); const functionRadio = document.querySelector('input[name="funcao"]:checked'); const positionRadio = document.querySelector('input[name="posicao"]:checked'); if (!name || !functionRadio || !positionRadio) { alert('Por favor, preencha nome, função e posição inicial.'); return; } players.push({ id: `player-${Date.now()}`, name, funcao: functionRadio.value, posicao: positionRadio.value, stats: { ataques: 0, ataquesCertos: 0, saques: 0, saquesCertos: 0, passes: 0, passesCertos: 0, levantamentos: 0, levantamentosCertos: 0, defesas: 0, defesasCertas: 0, bloqueios: 0, bloqueiosCertos: 0, levantamentosPorQualidade: { '6m': 0, '7m': 0, '8m': 0, '9m': 0 } } }); saveState(); renderAll(); form.reset(); nameInput.focus(); };
    const initiateSubstitution = (reservePlayerId) => { const reservePlayer = players.find(p => p.id === reservePlayerId); if (!reservePlayer) return; const starters = players.filter(p => p.posicao.startsWith('P')).map(s => `${s.posicao}: ${s.name}`).join('\n'); const promptMessage = `Substituir com ${reservePlayer.name}.\n\nTitulares:\n${starters}\n\nDigite a posição (ex: P1):`; const targetPositionInput = prompt(promptMessage); if (!targetPositionInput) return; const targetPosition = targetPositionInput.trim().toUpperCase(); if (!['P1', 'P2', 'P3', 'P4', 'P5', 'P6'].includes(targetPosition)) { alert('Posição inválida.'); return; } const frontRowPositions = ['P4', 'P3', 'P2']; if (reservePlayer.funcao === 'libero' && frontRowPositions.includes(targetPosition)) { alert('Ação inválida! O líbero não pode entrar em uma posição de ataque (P4, P3 ou P2).'); return; } const starterPlayer = players.find(p => p.posicao === targetPosition); if (!starterPlayer) { alert(`Não há jogador na posição ${targetPosition}.`); return; } const substitutionAction = { description: `⇄ Substituição: ${reservePlayer.name} (entra) ↔ ${starterPlayer.name} (sai)`, isStat: false }; starterPlayer.posicao = 'Reserva'; reservePlayer.posicao = targetPosition; addTimelineEntry(substitutionAction); saveState(); renderAll(); };
    const updatePlayerStat = (playerId, stat, substat, description, targetPosition = null, settingQuality = null) => { const player = players.find(p => p.id === playerId); if (!player) return; player.stats[stat]++; if (substat) player.stats[substat]++; if (settingQuality && player.stats.levantamentosPorQualidade) { player.stats.levantamentosPorQualidade[settingQuality]++; } let actionDescription = `${description} de ${player.name} (${player.posicao})`; if (targetPosition) { actionDescription += ` na ${targetPosition} adversária`; } if (settingQuality) { actionDescription += ` (Levantamento: ${settingQuality})`; } const actionData = { description: actionDescription, isStat: true, playerId, stat, substat }; addTimelineEntry(actionData); saveState(); renderStatsTables(); };
    const openActionDetailModal = (actionDetails) => {
        pendingAction = actionDetails;
        const allButtons = actionModalOptions.querySelectorAll('button');
        const isBlockAction = pendingAction.stat === 'bloqueios';
        allButtons.forEach(button => {
            const pos = button.dataset.targetPos;
            if (isBlockAction) {
                if (['P2', 'P3', 'P4'].includes(pos)) {
                    button.style.display = 'inline-block';
                } else {
                    button.style.display = 'none';
                }
            } else {
                button.style.display = 'inline-block';
            }
        });
        actionModal.classList.remove('hidden');
    };
    const closeActionDetailModal = () => { actionModal.classList.add('hidden'); pendingAction = null; };
    const handleActionTargetSelection = (event) => { const targetPosition = event.target.closest('button').dataset.targetPos; if (targetPosition && pendingAction) { const { playerId, stat, substat, description, requiresSettingMap } = pendingAction; if (requiresSettingMap === 'true' && (players.find(p=>p.id === playerId)?.funcao === 'ponteiro' || players.find(p=>p.id === playerId)?.funcao === 'oposto')) { openSettingMapModal(pendingAction, targetPosition); } else { updatePlayerStat(playerId, stat, substat, description, targetPosition); } } closeActionDetailModal(); };
    const openSettingMapModal = (actionDetails, targetPosition = null) => { pendingAction = { ...actionDetails, targetPosition }; settingMapModal.classList.remove('hidden'); };
    const closeSettingMapModal = () => { settingMapModal.classList.add('hidden'); pendingAction = null; };
    const handleSettingMapSelection = (event) => { const quality = event.target.closest('button').dataset.quality; if (quality && pendingAction) { const { playerId, stat, substat, description, targetPosition } = pendingAction; const setter = players.find(p => p.funcao === 'levantador' && p.posicao.startsWith('P')); if (setter) { setter.stats.levantamentos++; setter.stats.levantamentosCertos++; if (setter.stats.levantamentosPorQualidade) { setter.stats.levantamentosPorQualidade[quality]++; } saveState(); } updatePlayerStat(playerId, stat, substat, description, targetPosition, quality); } closeSettingMapModal(); };
    const addTimelineEntry = (actionData) => { const casaPontos = scoreboardHistory.filter(p => p === 'Casa').length; const foraPontos = scoreboardHistory.filter(p => p === 'Fora').length; const currentScore = `${casaPontos} x ${foraPontos}`; const lastRally = gameTimeline[gameTimeline.length - 1]; if (!lastRally || lastRally.score !== currentScore) { gameTimeline.push({ id: `rally-${Date.now()}`, score: currentScore, actions: [actionData] }); } else { lastRally.actions.push(actionData); } renderTimeline(); };
    const addScorePoint = (team) => { const lastPoint = scoreboardHistory[scoreboardHistory.length - 1]; if (team === 'Casa' && lastPoint === 'Fora') { rotatePlayers(); } const pointAction = { description: `>>> Ponto para ${team}! <<<`, isStat: false }; addTimelineEntry(pointAction); scoreboardHistory.push(team); saveState(); renderScoreboard(); };
    const removeLastScorePoint = () => { if (scoreboardHistory.length === 0) return; const pointToRemove = scoreboardHistory[scoreboardHistory.length - 1]; const previousPoint = scoreboardHistory[scoreboardHistory.length - 2]; const shouldUndoRotation = (pointToRemove === 'Casa' && previousPoint === 'Fora'); const lastRally = gameTimeline[gameTimeline.length - 1]; if (lastRally && lastRally.actions.some(action => action.description.includes(`Ponto para ${pointToRemove}`))) { for (const action of lastRally.actions) { if (action.isStat) { const player = players.find(p => p.id === action.playerId); if (player) { player.stats[action.stat]--; if (action.substat) { player.stats[action.substat]--; } } } } gameTimeline.pop(); } if (shouldUndoRotation) { undoRotation(); } scoreboardHistory.pop(); saveState(); renderAll(); };
    const resetScoreboard = () => { if (confirm("Tem certeza que deseja zerar o placar e a timeline? Os jogadores NÃO serão removidos.")) { scoreboardHistory = []; gameTimeline = []; saveState(); renderAll(); } };
    const rotatePlayers = () => { const oldPositions = {}; players.forEach(player => { if (player.posicao.startsWith('P')) oldPositions[player.posicao] = player; }); if (Object.keys(oldPositions).length < 6) { return; } const playerInP5 = oldPositions['P5']; if (playerInP5 && playerInP5.funcao === 'libero') { const substituteCentral = players.find(p => p.funcao === 'central' && p.posicao === 'Reserva'); if (!substituteCentral) { const warningAction = { description: `--- Tentativa de rodízio falhou: Líbero (${playerInP5.name}) na P5 sem um Central reserva para substituir. ---`, isStat: false }; addTimelineEntry(warningAction); return; } const subDescription = { description: `⇄ Sub. Automática: ${substituteCentral.name} (entra) ↔ ${playerInP5.name} (sai)`, isStat: false }; addTimelineEntry(subDescription); playerInP5.posicao = 'Reserva'; substituteCentral.posicao = 'P5'; oldPositions['P5'] = substituteCentral; } if (oldPositions.P1) oldPositions.P1.posicao = 'P6'; if (oldPositions.P2) oldPositions.P2.posicao = 'P1'; if (oldPositions.P3) oldPositions.P3.posicao = 'P2'; if (oldPositions.P4) oldPositions.P4.posicao = 'P3'; if (oldPositions.P5) oldPositions.P5.posicao = 'P4'; if (oldPositions.P6) oldPositions.P6.posicao = 'P5'; const rotationAction = { description: "--- Rodízio Realizado ---", isStat: false }; addTimelineEntry(rotationAction); saveState(); renderRoster(); };
    const undoRotation = () => { const currentPositions = {}; players.forEach(player => { if (player.posicao.startsWith('P')) currentPositions[player.posicao] = player; }); if (Object.keys(currentPositions).length < 6) return; if (currentPositions.P2) currentPositions.P2.posicao = 'P1'; if (currentPositions.P3) currentPositions.P3.posicao = 'P2'; if (currentPositions.P4) currentPositions.P4.posicao = 'P3'; if (currentPositions.P5) currentPositions.P5.posicao = 'P4'; if (currentPositions.P6) currentPositions.P6.posicao = 'P5'; if (currentPositions.P1) currentPositions.P1.posicao = 'P6'; };

    // --- RENDERIZAÇÃO ---
    const renderRoster = () => {
        if (!startersBox || !reservesList) return;
        startersBox.innerHTML = '<h3>Titulares</h3>';
        reservesList.innerHTML = '';
        const starters = players.filter(p => p.posicao.startsWith('P')).sort((a, b) => a.posicao.localeCompare(b.posicao));
        if (starters.length > 0) {
            starters.forEach(player => {
                const starterDiv = document.createElement('div');
                starterDiv.className = 'starter-player';
                starterDiv.dataset.playerId = player.id;
                starterDiv.innerHTML = `<div class="starter-player-info">${player.name}<span>(${player.funcao} - ${player.posicao})</span></div><div class="actions"></div>`;
                startersBox.appendChild(starterDiv);
                const actionsContainer = starterDiv.querySelector('.actions');
                let actionGroup = ['central', 'ponteiro', 'oposto'].includes(player.funcao) ? 'atacante' : player.funcao;
                if(playerActions[actionGroup]) {
                    playerActions[actionGroup].forEach(action => {
                        const isBlockAction = action.stat === 'bloqueios';
                        const isFrontRow = ['P2', 'P3', 'P4'].includes(player.posicao);
                        if (!isBlockAction || (isBlockAction && isFrontRow)) {
                            const button = document.createElement('button');
                            button.className = `btn action-btn ${action.type === 'success' ? 'btn-success' : 'btn-error'}`;
                            button.textContent = action.label;
                            button.title = action.title || action.description;
                            button.dataset.playerId = player.id;
                            button.dataset.stat = action.stat;
                            if (action.substat) button.dataset.substat = action.substat;
                            if (action.description) button.dataset.description = action.description;
                            if (action.requiresTarget) button.dataset.requiresTarget = 'true';
                            if (action.requiresSettingMap) button.dataset.requiresSettingMap = 'true';
                            actionsContainer.appendChild(button);
                        }
                    });
                }
            });
        } else {
            startersBox.innerHTML += `<p class="timeline-empty">Nenhum titular definido.</p>`;
        }
        players.filter(p => p.posicao === 'Reserva').forEach(player => { const reserveElement = document.createElement('div'); reserveElement.className = 'reserve-player clickable-reserve'; reserveElement.dataset.playerId = player.id; reserveElement.textContent = `${player.name} (${player.funcao})`; reservesList.appendChild(reserveElement); });
    };
    const renderStatsTables = () => { if (!tableBodies.ata) return; tableBodies.ata.innerHTML = ''; if (tableBodies.lev) tableBodies.lev.innerHTML = ''; if (tableBodies.def) tableBodies.def.innerHTML = ''; players.forEach(player => { const s = player.stats; let rowHtml = ''; let targetTableBody = null; switch (player.funcao) { case 'central': case 'ponteiro': case 'oposto': const totalAtacante = s.ataques + s.saques + s.passes + s.bloqueios; const acertosAtacante = s.ataquesCertos + s.saquesCertos + s.passesCertos + s.bloqueiosCertos; const percAtacante = totalAtacante > 0 ? ((acertosAtacante / totalAtacante) * 100).toFixed(1) + '%' : '0%'; rowHtml = `<tr><td>${player.name}</td><td>${player.funcao}</td><td>${s.ataques}</td><td>${s.ataquesCertos}</td><td>X</td><td>${s.saques}</td><td>${s.saquesCertos}</td><td>${s.passes}</td><td>${s.passesCertos}</td><td>${percAtacante}</td></tr>`; targetTableBody = tableBodies.ata; break; case 'levantador': const totalLev = s.levantamentos + s.saques; const acertosLev = s.levantamentosCertos + s.saquesCertos; const percLev = totalLev > 0 ? ((acertosLev / totalLev) * 100).toFixed(1) + '%' : '0%'; rowHtml = `<tr><td>${player.name}</td><td>${s.levantamentos}</td><td>${s.levantamentosCertos}</td><td>X</td><td>${s.ataques}</td><td>${s.ataquesCertos}</td><td>${s.saques}</td><td>${s.saquesCertos}</td><td>${percLev}</td></tr>`; targetTableBody = tableBodies.lev; break; case 'libero': const totalLibero = s.defesas + s.passes; const acertosLibero = s.defesasCertas + s.passesCertos; const percLibero = totalLibero > 0 ? ((acertosLibero / totalLibero) * 100).toFixed(1) + '%' : '0%'; rowHtml = `<tr><td>${player.name}</td><td>${s.defesas}</td><td>${s.defesasCertas}</td><td>X</td><td>${s.passes}</td><td>${s.passesCertos}</td><td>${s.levantamentos}</td><td>${s.levantamentosCertos}</td><td>${percLibero}</td></tr>`; targetTableBody = tableBodies.def; break; } if(targetTableBody && rowHtml) targetTableBody.innerHTML += rowHtml; }); };
    const renderTimeline = () => { if (!timelineFeed) return; if (gameTimeline.length === 0) { timelineFeed.innerHTML = `<p class="timeline-empty">Nenhum ponto registrado ainda.</p>`; return; } timelineFeed.innerHTML = ''; gameTimeline.forEach(rally => { const entryDiv = document.createElement('div'); entryDiv.className = 'timeline-entry'; const header = `<div class="timeline-header"><span class="timeline-score">${rally.score}</span></div>`; const actionsList = rally.actions.map(action => `<li>${action.description}</li>`).join(''); const actionsHtml = `<ul class="timeline-actions">${actionsList}</ul>`; entryDiv.innerHTML = header + actionsHtml; timelineFeed.appendChild(entryDiv); }); };
    const renderScoreboard = () => { if (!placarContainer) return; placarContainer.innerHTML = ''; scoreboardHistory.forEach(point => { const square = document.createElement('div'); square.classList.add('quadrado'); square.classList.add(point === 'Casa' ? 'casa' : 'fora'); placarContainer.appendChild(square); }); };
    const renderAll = () => { renderRoster(); renderStatsTables(); renderScoreboard(); renderTimeline(); };

    // --- CONECTORES DE EVENTOS ---
    if(form) form.addEventListener('submit', handleAddPlayer);
    if(reservesList) reservesList.addEventListener('click', e => { const target = e.target.closest('.clickable-reserve'); if(target) initiateSubstitution(target.dataset.playerId); });
    if(startersBox) startersBox.addEventListener('click', e => {
        const starterCard = e.target.closest('.starter-player');
        const actionButton = e.target.closest('.action-btn');
        if (actionButton) {
            e.stopPropagation();
            const { playerId, stat, substat, description, requiresTarget, requiresSettingMap } = actionButton.dataset;
            const player = players.find(p => p.id === playerId);
            if (!player) return;
            const isFrontRowHitterAttack = ( requiresSettingMap === 'true' && (player.funcao === 'ponteiro' || player.funcao === 'oposto') && ['P2', 'P3', 'P4'].includes(player.posicao) );
            if (isFrontRowHitterAttack) {
                openSettingMapModal({ playerId, stat, substat, description, requiresTarget });
            } else if (requiresTarget === 'true') {
                openActionDetailModal({ playerId, stat, substat, description, requiresSettingMap: 'false' });
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
    if(btnAddCasa) btnAddCasa.addEventListener('click', () => addScorePoint('Casa'));
    if(btnAddFora) btnAddFora.addEventListener('click', () => addScorePoint('Fora'));
    if(btnRemoveLast) btnRemoveLast.addEventListener('click', removeLastScorePoint);
    if(btnResetPlacar) btnResetPlacar.addEventListener('click', resetScoreboard);
    if(btnSaveGame) btnSaveGame.addEventListener('click', exportGameToFile);
    if(btnLoadGame) btnLoadGame.addEventListener('click', () => fileLoader.click());
    if(fileLoader) fileLoader.addEventListener('change', importGameFromFile);
    if(btnNewGame) btnNewGame.addEventListener('click', startNewGame);

    // --- INICIALIZAÇÃO ---
    loadState();
    renderAll();
});