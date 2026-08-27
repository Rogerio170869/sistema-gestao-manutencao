const API_URL = 'http://localhost:3000/api/chamados';

let chamados = [];
let chartTiposInstance = null;
let chartPrioridadesInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    const formEquipamento = document.getElementById('form-equipamento');
    const formChamado = document.getElementById('form-chamado');
    const formModalEdicao = document.getElementById('form-modal-edicao');

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
                const resposta = await fetch(API_URL, {
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
                alert('Servidor fora do ar! Verifique se o "node server.js" está rodando.');
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
                const resposta = await fetch(`${API_URL}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tecnico, status, descricao_solucao })
                });

                if (resposta.ok) {
                    fecharModal();
                    carregarChamadosDaAPI();
                } else {
                    alert('Erro ao salvar alterações do chamado.');
                }
            } catch (erro) {
                console.error('Erro ao atualizar chamado:', erro);
            }
        });
    }

    carregarChamadosDaAPI();
});

async function carregarChamadosDaAPI() {
    try {
        const resposta = await fetch(API_URL);
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

    listaParaExibir.forEach((chamado) => {
        const novaLinha = document.createElement('tr');
        const osFormatada = chamado.os || String(chamado.id).padStart(3, '0');

        novaLinha.innerHTML = `
            <td>${osFormatada}</td>
            <td>${formatarData(chamado.data_abertura)}</td>
            <td>${chamado.equipamento}</td>
            <td>${chamado.tecnico || '<span style="color:#9ca3af;">Não atribuído</span>'}</td>
            <td>${chamado.tipo}</td>
            <td>${chamado.prioridade}</td>
            <td>
                <select onchange="alterarStatus(${chamado.id}, this.value)">
                    <option value="Aberto" ${chamado.status === 'Aberto' ? 'selected' : ''}>Aberto</option>
                    <option value="Em Andamento" ${chamado.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                    <option value="Concluído" ${chamado.status === 'Concluído' ? 'selected' : ''}>Concluído</option>
                </select>
            </td>
            <td>
                <button onclick="abrirModalEdicao(${chamado.id})" style="background-color: #2563eb; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Editar</button>
                <button onclick="excluirChamado(${chamado.id})" style="background-color: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Excluir</button>
            </td>
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
        const resposta = await fetch(`${API_URL}/${id}`, {
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
            const resposta = await fetch(`${API_URL}/${id}`, {
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

function exportarCSV() {
    if (chamados.length === 0) {
        alert("Não há chamados para exportar!");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "OS,Data Abertura,Equipamento,Técnico,Tipo,Prioridade,Status,Solução\n";

    chamados.forEach(c => {
        const os = c.os || String(c.id).padStart(3, '0');
        const dataFormatada = formatarData(c.data_abertura);
        const tecnico = c.tecnico || "Não atribuído";
        const solucao = c.descricao_solucao ? c.descricao_solucao.replace(/"/g, '""') : "";
        csvContent += `"${os}","${dataFormatada}","${c.equipamento}","${tecnico}","${c.tipo}","${c.prioridade}","${c.status}","${solucao}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_manutencao.csv");
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
}