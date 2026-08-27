const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Conexão com o banco de dados SQLite
const db = new sqlite3.Database('./manutencao.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao SQLite:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// Criar tabela incluindo colunas de técnico e solução
db.run(`
    CREATE TABLE IF NOT EXISTS chamados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        os TEXT,
        equipamento TEXT,
        tipo TEXT,
        prioridade TEXT,
        status TEXT,
        data_abertura TEXT,
        data_conclusao TEXT,
        tecnico TEXT,
        descricao_solucao TEXT
    )
`);

// 1. Rota para listar chamados (GET)
app.get('/api/chamados', (req, res) => {
    db.all('SELECT * FROM chamados ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 2. Rota para criar chamado (POST)
app.post('/api/chamados', (req, res) => {
    const { equipamento, tipo, prioridade } = req.body;
    const status = 'Aberto';
    const data_abertura = new Date().toISOString();

    db.run(
        `INSERT INTO chamados (equipamento, tipo, prioridade, status, data_abertura) VALUES (?, ?, ?, ?, ?)`,
        [equipamento, tipo, prioridade, status, data_abertura],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            const idGerado = this.lastID;
            const os = String(idGerado).padStart(3, '0');

            db.run(`UPDATE chamados SET os = ? WHERE id = ?`, [os, idGerado], (updateErr) => {
                if (updateErr) {
                    res.status(500).json({ error: updateErr.message });
                    return;
                }
                res.status(201).json({ id: idGerado, os, equipamento, tipo, prioridade, status, data_abertura });
            });
        }
    );
});

// 3. Rota para atualizar chamado (PUT)
app.put('/api/chamados/:id', (req, res) => {
    const { id } = req.params;
    const { status, tecnico, descricao_solucao } = req.body;

    db.get('SELECT * FROM chamados WHERE id = ?', [id], (err, row) => {
        if (err || !row) {
            res.status(404).json({ error: 'Chamado não encontrado.' });
            return;
        }

        const novoStatus = status !== undefined ? status : row.status;
        const novoTecnico = tecnico !== undefined ? tecnico : row.tecnico;
        const novaSolucao = descricao_solucao !== undefined ? descricao_solucao : row.descricao_solucao;
        
        let data_conclusao = row.data_conclusao;
        if (novoStatus === 'Concluído' && !row.data_conclusao) {
            data_conclusao = new Date().toISOString();
        } else if (novoStatus !== 'Concluído') {
            data_conclusao = null;
        }

        db.run(
            `UPDATE chamados SET status = ?, tecnico = ?, descricao_solucao = ?, data_conclusao = ? WHERE id = ?`,
            [novoStatus, novoTecnico, novaSolucao, data_conclusao, id],
            function (updateErr) {
                if (updateErr) {
                    res.status(500).json({ error: updateErr.message });
                    return;
                }
                res.json({ message: 'Chamado atualizado com sucesso!' });
            }
        );
    });
});

// 4. Rota para excluir chamado (DELETE)
app.delete('/api/chamados/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM chamados WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Chamado excluído com sucesso!' });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});