// Selecionando os elementos do formulário e da tabela
const formChamado = document.querySelector('#novo-chamado form');
const tabelaChamados = document.querySelector('#lista-chamados tbody');

// Contador para gerar o número da Ordem de Serviço (OS)
let contadorOS = 2;

// Adicionando evento de envio ao formulário de chamados
formChamado.addEventListener('submit', function (event) {
    // Impede o recarregamento padrão da página
    event.preventDefault();

    // Capturando os valores dos campos
    const equipamento = document.getElementById('equipamento-chamado').value;
    const tipo = document.getElementById('tipo-manutencao').value;
    const prioridade = document.getElementById('prioridade').value;

    // Formatando o número da OS com zeros à esquerda (ex: 002)
    const numeroOS = String(contadorOS).padStart(3, '0');

    // Criando uma nova linha para a tabela (tr)
    const novaLinha = document.createElement('tr');

    // Inserindo as células (td) com os dados
    novaLinha.innerHTML = `
        <td>${numeroOS}</td>
        <td>${equipamento}</td>
        <td>${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</td>
        <td>${prioridade.charAt(0).toUpperCase() + prioridade.slice(1)}</td>
        <td>Aberto</td>
    `;

    // Adicionando a nova linha na tabela
    tabelaChamados.appendChild(novaLinha);

    // Incrementando o contador de OS
    contadorOS++;

    // Limpando os campos do formulário
    formChamado.reset();
});