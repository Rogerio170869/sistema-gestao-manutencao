const API_URL = 'http://localhost:3000/api/chamados';

const formEquipamento = document.getElementById('form-equipamento');
const formChamado = document.getElementById('form-chamado');
const tabelaChamados = document.querySelector('#lista-chamados tbody');

let chamados = [];

// 1. Carregar chamados da API REST (GET)
async function carregarChamadosDaAPI() {
    try {
        const resposta = await fetch(API_URL);
        chamados = await resposta.json();
        filtrarChamados();
    } catch (erro) {
        console.error('Erro ao conectar com a API:', erro);
    }
}

// 2. Atualizar indicadores do Dashboard
function atualizarDashboard() {
    const total = chamados.length;
    const concluidos = chamados.filter(c => c.status === 'Concluído').length;
    const pendentes = total - concluidos;

    document.getElementById('total-chamados').textContent = total;
    document.getElementById('pendentes-chamados').textContent = pendentes;
    document.getElementById('concluidos-chamados').textContent = concluidos;
}

// 3. Renderizar a tabela na tela
function renderizarTabela(listaParaExibir = chamados) {
    tabelaChamados.innerHTML = '';

    listaParaExibir.forEach((chamado) => {
        const novaLinha = document.createElement('tr');

        novaLinha.innerHTML = `
            <td>${chamado.os}</td>
            <td>${chamado.equipamento}</td>
            <td>${chamado.tipo}</td>
            <td>${chamado.prioridade}</td>
            <td>
                <select onchange="alterarStatus('${chamado.os}', this.value)">
                    <option value="Aberto" ${chamado.status === 'Aberto' ? 'selected' : ''}>Aberto</option>
                    <option value="Em Andamento" ${chamado.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                    <option value="Concluído" ${chamado.status === 'Concluído' ? 'selected' : ''}>Concluído</option>
                </select>
            </td>
            <td>
                <button onclick="excluirChamado('${chamado.os}')" style="background-color: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Excluir</button>
            </td>
        `;

        tabelaChamados.appendChild(novaLinha);
    });

    atualizarDashboard();
}

// 4. Cadastro de Equipamento (Preenche automaticamente o campo do chamado)
formEquipamento.addEventListener('submit', function (event) {
    event.preventDefault();

    const nome = document.getElementById('nome-equipamento').value;
    const tag = document.getElementById('tag-equipamento').value;

    document.getElementById('equipamento-chamado').value = `${nome} (${tag})`;

    alert(`Equipamento "${nome}" selecionado! Agora preencha os detalhes do chamado abaixo.`);
    formEquipamento.reset();
});

// 5. Cadastrar Novo Chamado via API (POST)
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
        }
    } catch (erro) {
        console.error('Erro ao abrir chamado:', erro);
    }
});

// 6. Alterar Status via API (PUT)
async function alterarStatus(os, novoStatus) {
    try {
        const resposta = await fetch(`${API_URL}/${os}`, {
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
async function excluirChamado(os) {
    if (confirm(`Tem certeza que deseja excluir a OS #${os}?`)) {
        try {
            const resposta = await fetch(`${API_URL}/${os}`, {
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

// 8. Filtrar localmente
function filtrarChamados() {
    const termoBusca = document.getElementById('filtro-busca').value.toLowerCase();
    const statusFiltro = document.getElementById('filtro-status').value;

    const chamadosFiltrados = chamados.filter(chamado => {
        const atendeTexto = chamado.equipamento.toLowerCase().includes(termoBusca);
        const atendeStatus = statusFiltro === 'todos' || chamado.status === statusFiltro;
        return atendeTexto && atendeStatus;
    });

    renderizarTabela(chamadosFiltrados);
}

// 9. Exportar CSV
function exportarCSV() {
    if (chamados.length === 0) {
        alert("Não há chamados para exportar!");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "OS,Equipamento,Tipo,Prioridade,Status\n";

    chamados.forEach(c => {
        csvContent += `"${c.os}","${c.equipamento}","${c.tipo}","${c.prioridade}","${c.status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_manutencao.csv");
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
}

// Carregar dados iniciais
carregarChamadosDaAPI();