document.addEventListener('DOMContentLoaded', () => {
    let players = [];
    let scoreboardHistory = [];
    let gameTimeline = [];

    const form = document.getElementById('add-player-form');
    const startersBox = document.querySelector('.starters-box');
    const reservesList = document.getElementById('reserves-list');
    const tableBodies = {
        ata: document.querySelector('#table-ata tbody'),
        lev: document.querySelector('#table-lev tbody'),
        def: document.querySelector('#table-def tbody'),
    };
    const timelineFeed = document.getElementById('timeline-feed');
    const placarContainer = document.getElementById('placar-container');
    const btnAddCasa = document.getElementById('btn-add-casa');
    const btnAddFora = document.getElementById('btn-add-fora');
    const btnRemoveLast = document.getElementById('btn-remove-last');
    const btnResetPlacar = document.getElementById('btn-reset-placar');
    const btnExportExcel = document.getElementById('btn-export-excel');
    
    // --- DEFINIÇÃO DAS AÇÕES POR FUNÇÃO ---
    const playerActions = {
        atacante: [
            { label: 'A ✓', type: 'success', stat: 'ataques', substat: 'ataquesCertos', description: 'Ataque Certo' },
            { label: 'A ⨉', type: 'error', stat: 'ataques', description: 'Ataque errado' },
            { label: 'B ✓', type: 'success', stat: 'bloqueios', substat: 'bloqueiosCertos', description: 'Bloqueio' },
            { label: 'S ✓', type: 'success', stat: 'saques', substat: 'saquesCertos', description: 'Bom saque' },
            { label: 'S ⨉', type: 'error', stat: 'saques', description: 'Erro de Saque' },
            { label: 'P ✓', type: 'success', stat: 'passes', substat: 'passesCertos', description: 'Bom passe' },
            { label: 'P ⨉', type: 'error', stat: 'passes', description: 'Erro de Passe' },
        ],
        levantador: [
            { label: 'L ✓', type: 'success', stat: 'levantamentos', substat: 'levantamentosCertos', description: 'Bom levantamento' },
            { label: 'L ⨉', type: 'error', stat: 'levantamentos', description: 'Levantamento ruim' },
            { label: 'S ✓', type: 'success', stat: 'saques', substat: 'saquesCertos', description: 'Bom saque' },
            { label: 'S ⨉', type: 'error', stat: 'saques', description: 'Erro de Saque' },
        ],
        libero: [
            { label: 'P ✓', type: 'success', stat: 'passes', substat: 'passesCertos', description: 'Bom passe' },
            { label: 'P ⨉', type: 'error', stat: 'passes', description: 'Passe ruim' },
        ]
    };

    // --- LÓGICA ---
    const handleAddPlayer = (event) => {
        event.preventDefault();
        const nameInput = document.getElementById('player-name-input');
        const name = nameInput.value.trim();
        const functionRadio = document.querySelector('input[name="funcao"]:checked');
        const positionRadio = document.querySelector('input[name="posicao"]:checked');
        if (!name || !functionRadio || !positionRadio) {
            alert('Por favor, preencha nome, função e posição inicial.'); return;
        }
        players.push({
            id: `player-${Date.now()}`, name, funcao: functionRadio.value, posicao: positionRadio.value,
            stats: {
                ataques: 0, ataquesCertos: 0, saques: 0, saquesCertos: 0, passes: 0, passesCertos: 0,
                levantamentos: 0, levantamentosCertos: 0, defesas: 0, defesasCertas: 0, bloqueios: 0, bloqueiosCertos: 0,
            }
        });
        renderAll();
        form.reset(); nameInput.focus();
    };

    const initiateSubstitution = (reservePlayerId) => { 
    const reservePlayer = players.find(p => p.id === reservePlayerId);
        if (!reservePlayer) return;
        const starters = players.filter(p => p.posicao.startsWith('P')).map(s => `${s.posicao}: ${s.name}`).join('\n');
        const promptMessage = `Substituir com ${reservePlayer.name}.\n\nTitulares:\n${starters}\n\nDigite a posição (ex: P1):`;
        const targetPositionInput = prompt(promptMessage);
        if (!targetPositionInput) return;
        const targetPosition = targetPositionInput.trim().toUpperCase();
        if (!['P1', 'P2', 'P3', 'P4', 'P5', 'P6'].includes(targetPosition)) {
            alert('Posição inválida.'); return;
        }
        const starterPlayer = players.find(p => p.posicao === targetPosition);
        if (!starterPlayer) {
            alert(`Não há jogador na posição ${targetPosition}.`); return;
        }
        starterPlayer.posicao = 'Reserva';
        reservePlayer.posicao = targetPosition;
        renderAll();
    };

    const updatePlayerStat = (playerId, stat, substat, description) => { 
        const player = players.find(p => p.id === playerId);
        if (!player) return;
        player.stats[stat]++;
        if (substat) player.stats[substat]++;
        const actionDescription = `${description} de ${player.name} (${player.posicao})`;
        addTimelineEntry(actionDescription);
        renderStatsTables();
    };
    
    const addTimelineEntry = (description) => { 
        const casaPontos = scoreboardHistory.filter(p => p === 'Casa').length;
        const foraPontos = scoreboardHistory.filter(p => p === 'Fora').length;
        const currentScore = `${casaPontos} x ${foraPontos}`;
        const lastRally = gameTimeline[gameTimeline.length - 1];
        if (!lastRally || lastRally.score !== currentScore) {
            gameTimeline.push({ id: `rally-${Date.now()}`, score: currentScore, actions: [description] });
        } else {
            lastRally.actions.push(description);
        }
        renderTimeline();
    };
    
    const addScorePoint = (team) => {
        addTimelineEntry(`>>> Ponto para ${team}! <<<`);
        scoreboardHistory.push(team);
        renderScoreboard();
    };

    const removeLastScorePoint = () => {
        const lastPoint = scoreboardHistory[scoreboardHistory.length - 1]; 
        // Remove a última entrada da timeline somente se ela foi uma marcação de ponto
        const lastRally = gameTimeline[gameTimeline.length - 1];
        if (lastRally && lastRally.actions.some(action => action.includes(`Ponto para ${lastPoint}`))) {
            gameTimeline.pop();
        }
        
        scoreboardHistory.pop(); // Remove o ponto do placar
        renderScoreboard();
        renderTimeline(); // Renderiza a timeline atualizada
    };

    const resetScoreboard = () => {
        scoreboardHistory = []; // Zera o placar
        gameTimeline = []; // Zera a timeline
        renderScoreboard();
        renderTimeline(); // Renderiza a timeline vazia
    };

    // --- RENDERIZAÇÃO ---
    const renderRoster = () => { 
        if (!startersBox || !reservesList) return;
        startersBox.innerHTML = '<h3>Titulares</h3>';
        reservesList.innerHTML = '';
        for (let i = 1; i <= 6; i++) {
            const pos = `P${i}`;
            const player = players.find(p => p.posicao === pos);
            const name = player ? `${player.name} (${player.funcao})` : '-';
            const starterDiv = document.createElement('div');
            starterDiv.className = 'starter-player';
            starterDiv.dataset.position = pos;
            starterDiv.innerHTML = `<p><strong>${pos}:</strong> <span>${name}</span></p><div class="actions"></div>`;
            startersBox.appendChild(starterDiv);
            if (player) {
                const actionsContainer = starterDiv.querySelector('.actions');
                let actionGroup = ['central', 'ponteiro', 'oposto'].includes(player.funcao) ? 'atacante' : player.funcao;
                playerActions[actionGroup].forEach(action => {
                    const button = document.createElement('button');
                    button.className = `btn action-btn ${action.type === 'success' ? 'btn-success' : 'btn-error'}`;
                    button.textContent = action.label;
                    button.title = action.title || action.description;
                    button.dataset.playerId = player.id;
                    button.dataset.stat = action.stat;
                    if (action.substat) button.dataset.substat = action.substat;
                    if (action.description) button.dataset.description = action.description;
                    actionsContainer.appendChild(button);
                });
            }
        }
        players.filter(p => p.posicao === 'Reserva').forEach(player => {
            const reserveElement = document.createElement('div');
            reserveElement.className = 'reserve-player clickable-reserve';
            reserveElement.dataset.playerId = player.id;
            reserveElement.textContent = `${player.name} (${player.funcao})`;
            reservesList.appendChild(reserveElement);
        });
    };

    const renderStatsTables = () => { 
        if (!tableBodies.ata || !tableBodies.lev || !tableBodies.def) return;
        tableBodies.ata.innerHTML = ''; tableBodies.lev.innerHTML = ''; tableBodies.def.innerHTML = '';
        players.forEach(player => {
            const s = player.stats; let rowHtml = ''; let targetTableBody = null;
            switch (player.funcao) {
                case 'central': case 'ponteiro': case 'oposto':
                    const totalAtacante = s.ataques + s.saques + s.passes;
                    const acertosAtacante = s.ataquesCertos + s.saquesCertos + s.passesCertos;
                    const percAtacante = totalAtacante > 0 ? ((acertosAtacante / totalAtacante) * 100).toFixed(1) + '%' : '0%';
                    rowHtml = `<tr><td>${player.name}</td><td>${player.funcao}</td><td>${s.ataques}</td><td>${s.ataquesCertos}</td><td>X</td><td>${s.saques}</td><td>${s.saquesCertos}</td><td>${s.passes}</td><td>${s.passesCertos}</td><td>${percAtacante}</td></tr>`;
                    targetTableBody = tableBodies.ata;
                    break;
                case 'levantador':
                    const totalLev = s.levantamentos + s.saques;
                    const acertosLev = s.levantamentosCertos + s.saquesCertos;
                    const percLev = totalLev > 0 ? ((acertosLev / totalLev) * 100).toFixed(1) + '%' : '0%';
                    rowHtml = `<tr><td>${player.name}</td><td>${s.levantamentos}</td><td>${s.levantamentosCertos}</td><td>X</td><td>${s.ataques}</td><td>${s.ataquesCertos}</td><td>${s.saques}</td><td>${s.saquesCertos}</td><td>${percLev}</td></tr>`;
                    targetTableBody = tableBodies.lev;
                    break;
                case 'libero':
                    const totalLibero = s.defesas + s.passes;
                    const acertosLibero = s.defesasCertas + s.passesCertos;
                    const percLibero = totalLibero > 0 ? ((acertosLibero / totalLibero) * 100).toFixed(1) + '%' : '0%';
                    rowHtml = `<tr><td>${player.name}</td><td>${s.defesas}</td><td>${s.defesasCertas}</td><td>X</td><td>${s.passes}</td><td>${s.passesCertos}</td><td>${s.levantamentos}</td><td>${s.levantamentosCertos}</td><td>${percLibero}</td></tr>`;
                    targetTableBody = tableBodies.def;
                    break;
            }
            if(targetTableBody && rowHtml) targetTableBody.innerHTML += rowHtml;
        });
    };

    const renderTimeline = () => { 
        if (!timelineFeed) return;
        if (gameTimeline.length === 0) {
            timelineFeed.innerHTML = `<p class="timeline-empty">Nenhum ponto registrado ainda.</p>`; return;
        }
        timelineFeed.innerHTML = '';
        gameTimeline.forEach(rally => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'timeline-entry';
            const header = `<div class="timeline-header"><span class="timeline-score">${rally.score}</span></div>`;
            const actionsList = rally.actions.map(action => `<li>${action}</li>`).join('');
            const actionsHtml = `<ul class="timeline-actions">${actionsList}</ul>`;
            entryDiv.innerHTML = header + actionsHtml;
            timelineFeed.appendChild(entryDiv);
        });
    };
    
    const renderScoreboard = () => {  
        if (!placarContainer) return;
        placarContainer.innerHTML = '';
        scoreboardHistory.forEach(point => {
            const square = document.createElement('div');
            square.classList.add('quadrado');
            square.classList.add(point === 'Casa' ? 'casa' : 'fora');
            placarContainer.appendChild(square);
        });
    };

    const renderAll = () => { renderRoster(); renderStatsTables(); renderScoreboard(); renderTimeline(); };

    // --- CONECTORES DE EVENTOS ---
    if(form) form.addEventListener('submit', handleAddPlayer);
    if(reservesList) reservesList.addEventListener('click', e => {
        const target = e.target.closest('.clickable-reserve');
        if(target) initiateSubstitution(target.dataset.playerId);
    });
    if(startersBox) startersBox.addEventListener('click', e => {
        const target = e.target.closest('.action-btn');
        if(target) {
            const { playerId, stat, substat, description } = target.dataset;
            updatePlayerStat(playerId, stat, substat, description);
        }
    });
    if(btnAddCasa) btnAddCasa.addEventListener('click', () => addScorePoint('Casa'));
    if(btnAddFora) btnAddFora.addEventListener('click', () => addScorePoint('Fora'));
    if(btnRemoveLast) btnRemoveLast.addEventListener('click', removeLastScorePoint);
    if(btnResetPlacar) btnResetPlacar.addEventListener('click', resetScoreboard);

    // --- INICIALIZAÇÃO ---
    renderAll();
});