const API_URL = 'http://localhost:3000/api';

let chamados = [];
let usuarioLogado = null;
let chartTiposInstance = null;
let chartPrioridadesInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    verificarSessao();

    const formLogin = document.getElementById('form-login');
    const formEquipamento = document.getElementById('form-equipamento');
    const formChamado = document.getElementById('form-chamado');
    const formModalEdicao = document.getElementById('form-modal-edicao');

    if (formLogin) {
        formLogin.addEventListener('submit', async function (event) {
            event.preventDefault();
            const usuarioInput = document.getElementById('login-usuario').value;
            const senhaInput = document.getElementById('login-senha').value;

            try {
                const resposta = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario: usuarioInput, senha: senhaInput })
                });

                if (resposta.ok) {
                    const dados = await resposta.json();
                    usuarioLogado = dados.usuario;
                    sessionStorage.setItem('usuario_gestao_manutencao', JSON.stringify(usuarioLogado));
                    iniciarSistema();
                } else {
                    alert('Usuário ou senha incorretos.');
                }
            } catch (erro) {
                console.error('Erro no login:', erro);
                alert('Erro de conexão com o servidor.');
            }
        });
    }

    if (formEquipamento) {
        formEquipamento.addEventListener('submit', function (event) {
            event.preventDefault();
            const nome = document.getElementById('nome-equipamento').value;
            const tag = document.getElementById('tag-equipamento').value;

            const campoEquipamentoChamado = document.getElementById('equipamento-chamado');
            if (campoEquipamentoChamado) {
                campoEquipamentoChamado.value = `${nome} (${tag})`;
            }

            alert(`Equipamento "${nome}" preenchido na abertura de chamado abaixo!`);
            formEquipamento.reset();
        });
    }

    if (formChamado) {
        formChamado.addEventListener('submit', async function (event) {
            event.preventDefault();

            const equipamentoInput = document.getElementById('equipamento-chamado').value;
            const tipoInput = document.getElementById('tipo-manutencao').value;
            const prioridadeInput = document.getElementById('prioridade').value;

            const novoChamado = {
                equipamento: equipamentoInput,
                tipo: tipoInput,
                prioridade: prioridadeInput
            };

            try {
                const resposta = await fetch(`${API_URL}/chamados`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoChamado)
                });

                if (resposta.ok) {
                    formChamado.reset();
                    carregarChamadosDaAPI();
                } else {
                    alert('Erro ao salvar chamado no servidor.');
                }
            } catch (erro) {
                console.error('Erro de conexão ao abrir chamado:', erro);
            }
        });
    }

    if (formModalEdicao) {
        formModalEdicao.addEventListener('submit', async function (event) {
            event.preventDefault();

            const id = document.getElementById('modal-chamado-id').value;
            const tecnico = document.getElementById('modal-tecnico').value;
            const status = document.getElementById('modal-status').value;
            const descricao_solucao = document.getElementById('modal-solucao').value;

            try {
                const resposta = await fetch(`${API_URL}/chamados/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tecnico, status, descricao_solucao })
                });

                if (resposta.ok) {
                    fecharModal();
                    await carregarChamadosDaAPI();
                } else {
                    alert('Erro ao salvar alterações do chamado.');
                }
            } catch (erro) {
                console.error('Erro ao atualizar chamado:', erro);
            }
        });
    }
});

function verificarSessao() {
    const usuarioSalvo = sessionStorage.getItem('usuario_gestao_manutencao');
    if (usuarioSalvo) {
        usuarioLogado = JSON.parse(usuarioSalvo);
        iniciarSistema();
    }
}

function iniciarSistema() {
    document.getElementById('container-login').style.display = 'none';
    document.getElementById('conteudo-sistema').style.display = 'block';

    const infoUsuario = document.getElementById('usuario-logado-info');
    if (infoUsuario) {
        infoUsuario.textContent = `${usuarioLogado.nome} (${usuarioLogado.perfil.toUpperCase()})`;
    }

    carregarChamadosDaAPI();
}

function fazerLogout() {
    sessionStorage.removeItem('usuario_gestao_manutencao');
    usuarioLogado = null;
    location.reload();
}

async function carregarChamadosDaAPI() {
    try {
        const resposta = await fetch(`${API_URL}/chamados`);
        chamados = await resposta.json();
        filtrarChamados();
    } catch (erro) {
        console.error('Erro ao buscar chamados da API:', erro);
    }
}

function formatarData(isoString) {
    if (!isoString) return '-';
    const data = new Date(isoString);
    return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function atualizarDashboard(listaParaExibir = chamados) {
    const totalElemento = document.getElementById('total-chamados');
    const pendentesElemento = document.getElementById('pendentes-chamados');
    const concluidosElemento = document.getElementById('concluidos-chamados');
    const mttrElemento = document.getElementById('mttr-chamados');

    if (!totalElemento) return;

    const total = listaParaExibir.length;
    const chamadosConcluidos = listaParaExibir.filter(c => c.status === 'Concluído');
    const concluidosCount = chamadosConcluidos.length;
    const pendentesCount = total - concluidosCount;

    let mttrTexto = '0h';
    if (concluidosCount > 0) {
        const totalHoras = chamadosConcluidos.reduce((acc, c) => {
            if (c.data_abertura && c.data_conclusao) {
                const diffMs = new Date(c.data_conclusao) - new Date(c.data_abertura);
                return acc + (diffMs / (1000 * 60 * 60));
            }
            return acc;
        }, 0);

        const mttrMedio = (totalHoras / concluidosCount).toFixed(1);
        mttrTexto = `${mttrMedio}h`;
    }

    totalElemento.textContent = total;
    pendentesElemento.textContent = pendentesCount;
    concluidosElemento.textContent = concluidosCount;
    if (mttrElemento) mttrElemento.textContent = mttrTexto;

    renderizarGraficos(listaParaExibir);
}

function renderizarGraficos(dados) {
    const ctxTipos = document.getElementById('chartTipos');
    const ctxPrioridades = document.getElementById('chartPrioridades');

    if (!ctxTipos || !ctxPrioridades) return;

    const corretiva = dados.filter(c => c.tipo === 'Corretiva').length;
    const preventiva = dados.filter(c => c.tipo === 'Preventiva').length;
    const preditiva = dados.filter(c => c.tipo === 'Preditiva').length;

    const alta = dados.filter(c => c.prioridade === 'Alta').length;
    const media = dados.filter(c => c.prioridade === 'Média').length;
    const baixa = dados.filter(c => c.prioridade === 'Baixa').length;

    if (chartTiposInstance) chartTiposInstance.destroy();
    if (chartPrioridadesInstance) chartPrioridadesInstance.destroy();

    chartTiposInstance = new Chart(ctxTipos, {
        type: 'doughnut',
        data: {
            labels: ['Corretiva', 'Preventiva', 'Preditiva'],
            datasets: [{
                data: [corretiva, preventiva, preditiva],
                backgroundColor: ['#ef4444', '#3b82f6', '#10b981']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    chartPrioridadesInstance = new Chart(ctxPrioridades, {
        type: 'bar',
        data: {
            labels: ['Alta', 'Média', 'Baixa'],
            datasets: [{
                label: 'Chamados',
                data: [alta, media, baixa],
                backgroundColor: ['#dc2626', '#f59e0b', '#84cc16']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function renderizarTabela(listaParaExibir = chamados) {
    const tabelaChamados = document.querySelector('#lista-chamados tbody');
    if (!tabelaChamados) return;

    tabelaChamados.innerHTML = '';
    const isGestor = usuarioLogado && usuarioLogado.perfil === 'gestor';

    listaParaExibir.forEach((chamado) => {
        const novaLinha = document.createElement('tr');
        const osFormatada = chamado.os || String(chamado.id).padStart(3, '0');

        const tecnicoExibicao = chamado.tecnico && chamado.tecnico.trim() !== '' 
            ? chamado.tecnico 
            : '<span style="color:#9ca3af;">Não atribuído</span>';

        // Badge de Prioridade
        let badgePrioridade = chamado.prioridade;
        if (chamado.prioridade === 'Alta') badgePrioridade = `<span class="badge badge-alta">Alta</span>`;
        if (chamado.prioridade === 'Média') badgePrioridade = `<span class="badge badge-media">Média</span>`;
        if (chamado.prioridade === 'Baixa') badgePrioridade = `<span class="badge badge-baixa">Baixa</span>`;

        let celulaStatus = chamado.status;
        let botoesAcao = '<span style="color:#9ca3af; font-size: 12px;">Apenas Leitura</span>';

        if (isGestor) {
            celulaStatus = `
                <select id="status-chamado-${chamado.id}" name="status_chamado_${chamado.id}" onchange="alterarStatus(${chamado.id}, this.value)">
                    <option value="Aberto" ${chamado.status === 'Aberto' ? 'selected' : ''}>Aberto</option>
                    <option value="Em Andamento" ${chamado.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                    <option value="Concluído" ${chamado.status === 'Concluído' ? 'selected' : ''}>Concluído</option>
                </select>
            `;

            botoesAcao = `
                <button onclick="abrirModalEdicao(${chamado.id})" style="background-color: #2563eb; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Editar</button>
                <button onclick="excluirChamado(${chamado.id})" style="background-color: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Excluir</button>
            `;
        } else {
            if (chamado.status === 'Concluído') celulaStatus = `<span class="badge badge-concluido">Concluído</span>`;
            if (chamado.status === 'Em Andamento') celulaStatus = `<span class="badge badge-andamento">Em Andamento</span>`;
            if (chamado.status === 'Aberto') celulaStatus = `<span class="badge badge-aberto">Aberto</span>`;
        }

        novaLinha.innerHTML = `
            <td><strong>#${osFormatada}</strong></td>
            <td>${formatarData(chamado.data_abertura)}</td>
            <td>${chamado.equipamento}</td>
            <td>${tecnicoExibicao}</td>
            <td>${chamado.tipo}</td>
            <td>${badgePrioridade}</td>
            <td>${celulaStatus}</td>
            <td>${botoesAcao}</td>
        `;

        tabelaChamados.appendChild(novaLinha);
    });

    atualizarDashboard(listaParaExibir);
}

function abrirModalEdicao(id) {
    const chamado = chamados.find(c => c.id === id);
    if (!chamado) return;

    document.getElementById('modal-chamado-id').value = chamado.id;
    document.getElementById('modal-os-titulo').textContent = chamado.os || String(chamado.id).padStart(3, '0');
    document.getElementById('modal-tecnico').value = chamado.tecnico || '';
    document.getElementById('modal-status').value = chamado.status || 'Aberto';
    document.getElementById('modal-solucao').value = chamado.descricao_solucao || '';

    const modal = document.getElementById('modal-edicao');
    if (modal) modal.style.display = 'flex';
}

function fecharModal() {
    const modal = document.getElementById('modal-edicao');
    if (modal) modal.style.display = 'none';
}

async function alterarStatus(id, novoStatus) {
    try {
        const resposta = await fetch(`${API_URL}/chamados/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus })
        });

        if (resposta.ok) {
            carregarChamadosDaAPI();
        }
    } catch (erro) {
        console.error('Erro ao alterar status:', erro);
    }
}

async function excluirChamado(id) {
    if (confirm(`Tem certeza que deseja excluir o chamado #${id}?`)) {
        try {
            const resposta = await fetch(`${API_URL}/chamados/${id}`, {
                method: 'DELETE'
            });

            if (resposta.ok) {
                carregarChamadosDaAPI();
            }
        } catch (erro) {
            console.error('Erro ao excluir chamado:', erro);
        }
    }
}

function filtrarChamados() {
    const campoBusca = document.getElementById('filtro-busca');
    const campoStatus = document.getElementById('filtro-status');
    const campoDataInicio = document.getElementById('filtro-data-inicio');
    const campoDataFim = document.getElementById('filtro-data-fim');

    const termoBusca = campoBusca ? campoBusca.value.toLowerCase() : '';
    const statusFiltro = campoStatus ? campoStatus.value : 'todos';
    const dataInicio = campoDataInicio && campoDataInicio.value ? new Date(campoDataInicio.value) : null;
    const dataFim = campoDataFim && campoDataFim.value ? new Date(campoDataFim.value) : null;

    if (dataFim) {
        dataFim.setHours(23, 59, 59, 999);
    }

    const chamadosFiltrados = chamados.filter(chamado => {
        const atendeTexto = chamado.equipamento ? chamado.equipamento.toLowerCase().includes(termoBusca) : true;
        const atendeStatus = statusFiltro === 'todos' || chamado.status === statusFiltro;

        let atendeData = true;
        if (chamado.data_abertura) {
            const dataChamado = new Date(chamado.data_abertura);
            if (dataInicio && dataChamado < dataInicio) atendeData = false;
            if (dataFim && dataChamado > dataFim) atendeData = false;
        }

        return atendeTexto && atendeStatus && atendeData;
    });

    renderizarTabela(chamadosFiltrados);
}

// Função para gerar Relatório Visual em PDF
function exportarCSV() {
    if (chamados.length === 0) {
        alert("Não há chamados para exportar!");
        return;
    }

    // Criar elemento container do relatório
    const elemento = document.createElement('div');
    elemento.id = 'relatorio-pdf-temp';
    elemento.style.position = 'fixed';
    elemento.style.left = '-9999px'; // Esconde fora da tela para não piscar para o usuário
    elemento.style.top = '0';
    elemento.style.width = '1000px';
    elemento.style.backgroundColor = '#ffffff';
    elemento.style.padding = '30px';
    elemento.style.fontFamily = 'Arial, sans-serif';
    elemento.style.color = '#333333';

    const dataAtual = new Date().toLocaleDateString('pt-BR');

    let linhasTabela = '';
    chamados.forEach(c => {
        const os = c.os || String(c.id).padStart(3, '0');
        const dataFormatada = formatarData(c.data_abertura);
        const tecnico = c.tecnico || "Não atribuído";
        const solucao = c.descricao_solucao || "-";

        // Cores suaves para o PDF
        let corPrioridade = '#059669'; // verde
        if (c.prioridade === 'Alta') corPrioridade = '#dc2626'; // vermelho
        if (c.prioridade === 'Média') corPrioridade = '#d97706'; // amarelo

        linhasTabela += `
            <tr style="border-bottom: 1px solid #e5e7eb; font-size: 12px;">
                <td style="padding: 10px 8px;"><strong>#${os}</strong></td>
                <td style="padding: 10px 8px;">${dataFormatada}</td>
                <td style="padding: 10px 8px;">${c.equipamento}</td>
                <td style="padding: 10px 8px;">${tecnico}</td>
                <td style="padding: 10px 8px;">${c.tipo}</td>
                <td style="padding: 10px 8px; color: ${corPrioridade}; font-weight: bold;">${c.prioridade}</td>
                <td style="padding: 10px 8px;">${c.status}</td>
                <td style="padding: 10px 8px;">${solucao}</td>
            </tr>
        `;
    });

    elemento.innerHTML = `
        <div style="margin-bottom: 25px; border-bottom: 3px solid #1e3a8a; padding-bottom: 12px;">
            <h1 style="color: #1e3a8a; font-size: 24px; margin: 0 0 5px 0;">Relatório de Manutenção Industrial</h1>
            <p style="color: #6b7280; font-size: 13px; margin: 0;">
                Data de emissão: <strong>${dataAtual}</strong> | 
                Emitido por: <strong>${usuarioLogado ? usuarioLogado.nome : 'Sistema'}</strong>
            </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
                <tr style="background-color: #1e3a8a; color: #ffffff; font-size: 12px;">
                    <th style="padding: 10px 8px;">OS</th>
                    <th style="padding: 10px 8px;">Abertura</th>
                    <th style="padding: 10px 8px;">Equipamento</th>
                    <th style="padding: 10px 8px;">Técnico</th>
                    <th style="padding: 10px 8px;">Tipo</th>
                    <th style="padding: 10px 8px;">Prioridade</th>
                    <th style="padding: 10px 8px;">Status</th>
                    <th style="padding: 10px 8px;">Solução</th>
                </tr>
            </thead>
            <tbody>
                ${linhasTabela}
            </tbody>
        </table>
    `;

    // Adiciona o elemento ao corpo do documento para que o html2canvas consiga renderizá-lo
    document.body.appendChild(elemento);

    const opcoes = {
        margin: [10, 10, 10, 10],
        filename: `Relatorio_Manutencao_${dataAtual.replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, logging: false, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    // Gera o PDF e remove o elemento temporário do DOM
    html2pdf().set(opcoes).from(elemento).save().then(() => {
        document.body.removeChild(elemento);
    });
}