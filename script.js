// Selecionando elementos do DOM
const formChamado = document.querySelector('#novo-chamado form');
const tabelaChamados = document.querySelector('#lista-chamados tbody');

// Carregar chamados salvos do localStorage ou iniciar com um array vazio
let chamados = JSON.parse(localStorage.getItem('chamados_manutencao')) || [];

// Função para salvar a lista de chamados no localStorage
function salvarChamadosNoStorage() {
    localStorage.setItem('chamados_manutencao', JSON.stringify(chamados));
}

// Função para renderizar/exibir todos os chamados na tabela
function renderizarTabela() {
    // Limpa a tabela atual
    tabelaChamados.innerHTML = '';

    // Se não houver chamados no array, mostra chamado padrão da Semana 1 como exemplo inicial
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

    // Percorre a lista de chamados e cria as linhas da tabela
    chamados.forEach((chamado, index) => {
        const novaLinha = document.createElement('tr');

        novaLinha.innerHTML = `
            <td>${chamado.os}</td>
            <td>${chamado.equipamento}</td>
            <td>${chamado.tipo}</td>
            <td>${chamado.prioridade}</td>
            <td>
                <select onchange="alterarStatus(${index}, this.value)">
                    <option value="Aberto" ${chamado.status === 'Aberto' ? 'selected' : ''}>Aberto</option>
                    <option value="Em Andamento" ${chamado.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                    <option value="Concluído" ${chamado.status === 'Concluído' ? 'selected' : ''}>Concluído</option>
                </select>
            </td>
        `;

        tabelaChamados.appendChild(novaLinha);
    });
}

// Função para alterar o status de um chamado
function alterarStatus(index, novoStatus) {
    chamados[index].status = novoStatus;
    salvarChamadosNoStorage();
}

// Evento de submissão do formulário para adicionar novo chamado
formChamado.addEventListener('submit', function (event) {
    event.preventDefault();

    // Capturando os dados dos campos
    const equipamentoInput = document.getElementById('equipamento-chamado').value;
    const tipoInput = document.getElementById('tipo-manutencao').value;
    const prioridadeInput = document.getElementById('prioridade').value;

    // Gerando o número da nova OS
    const proximaOS = String(chamados.length + 1).padStart(3, '0');

    // Formatando valores para exibição bonita
    const novoChamado = {
        os: proximaOS,
        equipamento: equipamentoInput,
        tipo: tipoInput.charAt(0).toUpperCase() + tipoInput.slice(1),
        prioridade: prioridadeInput.charAt(0).toUpperCase() + prioridadeInput.slice(1),
        status: 'Aberto'
    };

    // Adiciona ao array e salva
    chamados.push(novoChamado);
    salvarChamadosNoStorage();

    // Atualiza a exibição na tabela
    renderizarTabela();

    // Limpa o formulário
    formChamado.reset();
});

// Carrega os chamados assim que a página é aberta
renderizarTabela();