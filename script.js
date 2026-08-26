const API_URL = 'http://localhost:3000/api/chamados';

let chamados = [];

// Aguarda o HTML carregar completamente antes de interagir com o DOM
document.addEventListener('DOMContentLoaded', () => {
    const formEquipamento = document.getElementById('form-equipamento');
    const formChamado = document.getElementById('form-chamado');

    // 1. Ouvinte para o Cadastro de Equipamentos
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

    // 2. Ouvinte para Abertura de Chamado via API REST (POST)
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

    // Carregar chamados assim que a página é aberta
    carregarChamadosDaAPI();
});

// 3. Buscar chamados da API REST (GET)
async function carregarChamadosDaAPI() {
    try {
        const resposta = await fetch(API_URL);
        chamados = await resposta.json();
        filtrarChamados();
    } catch (erro) {
        console.error('Erro ao buscar chamados da API:', erro);
    }
}

// Formatar datas para exibição legível (DD/MM/AAAA HH:mm)
function formatarData(isoString) {
    if (!isoString) return '-';
    const data = new Date(isoString);
    return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// 4. Atualizar os números do Dashboard de Indicadores (incluindo MTTR)
function atualizarDashboard() {
    const totalElemento = document.getElementById('total-chamados');
    const pendentesElemento = document.getElementById('pendentes-chamados');
    const concluidosElemento = document.getElementById('concluidos-chamados');
    const mttrElemento = document.getElementById('mttr-chamados');

    if (!totalElemento) return;

    const total = chamados.length;
    const chamadosConcluidos = chamados.filter(c => c.status === 'Concluído');
    const concluidosCount = chamadosConcluidos.length;
    const pendentesCount = total - concluidosCount;

    // Cálculo do MTTR (Tempo Médio para Reparo em Horas)
    let mttrTexto = '0h';
    if (concluidosCount > 0) {
        const totalHoras = chamadosConcluidos.reduce((acc, c) => {
            if (c.data_abertura && c.data_conclusao) {
                const diffMs = new Date(c.data_conclusao) - new Date(c.data_abertura);
                return acc + (diffMs / (1000 * 60 * 60)); // Converte milissegundos para horas
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
}

// 5. Desenhar as linhas da tabela no HTML
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
                <button onclick="excluirChamado(${chamado.id})" style="background-color: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Excluir</button>
            </td>
        `;

        tabelaChamados.appendChild(novaLinha);
    });

    atualizarDashboard();
}

// 6. Atualizar Status via API (PUT)
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

// 7. Excluir Chamado via API (DELETE)
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

// 8. Pesquisar e Filtrar Chamados (Texto, Status e Período de Datas)
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
        dataFim.setHours(23, 59, 59, 999); // Incluir todo o dia de término
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

// 9. Exportar tabela para arquivo CSV
function exportarCSV() {
    if (chamados.length === 0) {
        alert("Não há chamados para exportar!");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "OS,Data Abertura,Equipamento,Tipo,Prioridade,Status\n";

    chamados.forEach(c => {
        const os = c.os || String(c.id).padStart(3, '0');
        const dataFormatada = formatarData(c.data_abertura);
        csvContent += `"${os}","${dataFormatada}","${c.equipamento}","${c.tipo}","${c.prioridade}","${c.status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_manutencao.csv");
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
}