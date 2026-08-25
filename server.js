const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Banco de dados em memória temporário
let chamados = [
    {
        os: '001',
        equipamento: 'Torno CNC (EQ-001)',
        tipo: 'Corretiva',
        prioridade: 'Alta',
        status: 'Em Andamento'
    }
];

// 1. Rota para listar todos os chamados (GET)
app.get('/api/chamados', (req, res) => {
    res.json(chamados);
});

// 2. Rota para criar novo chamado (POST)
app.post('/api/chamados', (req, res) => {
    const { equipamento, tipo, prioridade } = req.body;
    
    const proximaOS = String(chamados.length + 1).padStart(3, '0');
    const novoChamado = {
        os: proximaOS,
        equipamento,
        tipo,
        prioridade,
        status: 'Aberto'
    };

    chamados.push(novoChamado);
    res.status(201).json(novoChamado);
});

// 3. Rota para atualizar status do chamado (PUT)
app.put('/api/chamados/:os', (req, res) => {
    const { os } = req.params;
    const { status } = req.body;

    const chamado = chamados.find(c => c.os === os);
    if (chamado) {
        chamado.status = status;
        return res.json(chamado);
    }
    res.status(404).json({ mensagem: 'Chamado não encontrado' });
});

// 4. Rota para deletar chamado (DELETE)
app.delete('/api/chamados/:os', (req, res) => {
    const { os } = req.params;
    chamados = chamados.filter(c => c.os !== os);
    res.json({ mensagem: 'Chamado excluído com sucesso' });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});