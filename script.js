// Seleção de elementos do DOM
const formEquipamento = document.getElementById('form-equipamento');
const formChamado = document.getElementById('form-chamado');
const tabelaChamados = document.querySelector('#lista-chamados tbody');

// Carregar chamados e equipamentos salvos do localStorage
let chamados = JSON.parse(localStorage.getItem('chamados_manutencao')) || [];
let equipamentos = JSON.parse(localStorage.getItem('equipamentos_manutencao')) || [];

// Salvar no LocalStorage
function salvarChamadosNoStorage() {
    localStorage.setItem('chamados_manutencao', JSON.stringify(chamados));
}

function salvarEquipamentosNoStorage() {
    localStorage.setItem('equipamentos_manutencao', JSON.stringify(equipamentos));
}

// Atualizar Indicadores do Dashboard
function atualizarDashboard() {
    const total = chamados.length;
    const concluidos = chamados.filter(c => c.status === 'Concluído').length;
    const pendentes = total - concluidos;

    document.getElementById('total-chamados').textContent = total;
    document.getElementById('pendentes-chamados').textContent = pendentes;
    document.getElementById('concluidos-chamados').textContent = concluidos;
}

// Renderizar a tabela de chamados
function renderizarTabela(listaParaExibir = chamados) {
    tabelaChamados.innerHTML = '';

    listaParaExibir.forEach((chamado) => {
        const indexReal = chamados.findIndex(c => c.os === chamado.os);
        const novaLinha = document.createElement('tr');

        novaLinha.innerHTML = `
            <td>${chamado.os}</td>
            <td>${chamado.equipamento}</td>
            <td>${chamado.tipo}</td>
            <td>${chamado.prioridade}</td>
            <td>
                <select onchange="alterarStatus(${indexReal}, this.value)">
                    <option value="Aberto" ${chamado.status === 'Aberto' ? 'selected' : ''}>Aberto</option>
                    <option value="Em Andamento" ${chamado.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                    <option value="Concluído" ${chamado.status === 'Concluído' ? 'selected' : ''}>Concluído</option>
                </select>
            </td>
            <td>
                <button onclick="excluirChamado(${indexReal})" style="background-color: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Excluir</button>
            </td>
        `;

        tabelaChamados.appendChild(novaLinha);
    });

    atualizarDashboard();
}

// Cadastro de Equipamento
formEquipamento.addEventListener('submit', function (event) {
    event.preventDefault();

    const nome = document.getElementById('nome-equipamento').value;
    const tag = document.getElementById('tag-equipamento').value;
    const setor = document.getElementById('setor-equipamento').value;

    const novoEquipamento = { nome, tag, setor };
    equipamentos.push(novoEquipamento);
    salvarEquipamentosNoStorage();

    // Auto-preenche o campo de equipamento no formulário de chamado
    document.getElementById('equipamento-chamado').value = `${nome} (${tag})`;

    alert(`Equipamento "${nome}" cadastrado com sucesso!`);
    formEquipamento.reset();
});

// Abertura de Ordem de Serviço (Chamado)
formChamado.addEventListener('submit', function (event) {
    event.preventDefault();

    const equipamentoInput = document.getElementById('equipamento-chamado').value;
    const tipoInput = document.getElementById('tipo-manutencao').value;
    const prioridadeInput = document.getElementById('prioridade').value;

    // Calcula a próxima OS considerando o maior valor existente ou o total do array
    const proximaOS = String(chamados.length + 1).padStart(3, '0');

    const novoChamado = {
        os: proximaOS,
        equipamento: equipamentoInput,
        tipo: tipoInput,
        prioridade: prioridadeInput,
        status: 'Aberto'
    };

    chamados.push(novoChamado);
    salvarChamadosNoStorage();
    filtrarChamados();

    formChamado.reset();
});

// Filtros
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

// Alterar Status
function alterarStatus(index, novoStatus) {
    chamados[index].status = novoStatus;
    salvarChamadosNoStorage();
    filtrarChamados();
}

// Excluir Chamado Individual
function excluirChamado(index) {
    if (confirm('Tem certeza que deseja excluir esta Ordem de Serviço?')) {
        chamados.splice(index, 1);
        salvarChamadosNoStorage();
        filtrarChamados();
    }
}

// Exportar relatório em CSV
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

// Limpar todos os chamados
function limparTodosChamados() {
    if (confirm("ATENÇÃO: Tem certeza que deseja apagar TODOS os chamados registrados?")) {
        chamados = [];
        localStorage.removeItem('chamados_manutencao');
        filtrarChamados();
    }
}

// Inicialização da tela
renderizarTabela();