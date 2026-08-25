const formChamado = document.querySelector('#novo-chamado form');
const tabelaChamados = document.querySelector('#lista-chamados tbody');

let chamados = JSON.parse(localStorage.getItem('chamados_manutencao')) || [];

function salvarChamadosNoStorage() {
    localStorage.setItem('chamados_manutencao', JSON.stringify(chamados));
}

// Função para atualizar os cards do Dashboard
function atualizarDashboard() {
    const total = chamados.length;
    const concluidos = chamados.filter(c => c.status === 'Concluído').length;
    const pendentes = total - concluidos;

    document.getElementById('total-chamados').textContent = total;
    document.getElementById('pendentes-chamados').textContent = pendentes;
    document.getElementById('concluidos-chamados').textContent = concluidos;
}

// Função para renderizar a tabela com suporte a filtros
function renderizarTabela(listaParaExibir = chamados) {
    tabelaChamados.innerHTML = '';

    if (chamados.length === 0) {
        chamados.push({
            os: '001',
            equipamento: 'Torno CNC (EQ-001)',
            tipo: 'Corretiva',
            prioridade: 'Alta',
            status: 'Em Andamento'
        });
        salvarChamadosNoStorage();
    }

    listaParaExibir.forEach((chamado) => {
        // Encontrar o índice real no array principal
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
                <button onclick="excluirChamado(${indexReal})" style="background-color: #ef4444; padding: 5px 10px;">Excluir</button>
            </td>
        `;

        tabelaChamados.appendChild(novaLinha);
    });

    atualizarDashboard();
}

// Função para filtrar chamados por texto e por status
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

function alterarStatus(index, novoStatus) {
    chamados[index].status = novoStatus;
    salvarChamadosNoStorage();
    filtrarChamados(); // Re-aplica filtros mantendo a tela atualizada
}

function excluirChamado(index) {
    if (confirm('Tem certeza que deseja excluir esta Ordem de Serviço?')) {
        chamados.splice(index, 1);
        salvarChamadosNoStorage();
        filtrarChamados();
    }
}

formChamado.addEventListener('submit', function (event) {
    event.preventDefault();

    const equipamentoInput = document.getElementById('equipamento-chamado').value;
    const tipoInput = document.getElementById('tipo-manutencao').value;
    const prioridadeInput = document.getElementById('prioridade').value;

    const proximaOS = String(chamados.length + 1).padStart(3, '0');

    const novoChamado = {
        os: proximaOS,
        equipamento: equipamentoInput,
        tipo: tipoInput.charAt(0).toUpperCase() + tipoInput.slice(1),
        prioridade: prioridadeInput.charAt(0).toUpperCase() + prioridadeInput.slice(1),
        status: 'Aberto'
    };

    chamados.push(novoChamado);
    salvarChamadosNoStorage();
    filtrarChamados();

    formChamado.reset();
});

renderizarTabela();