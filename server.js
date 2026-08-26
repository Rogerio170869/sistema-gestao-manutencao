const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Conexão com o banco de dados SQLite (cria o arquivo 'manutencao.db' se não existir)
const db = new sqlite3.Database('./manutencao.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao SQLite:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// Criar a tabela de chamados caso não exista
db.run(`
    CREATE TABLE IF NOT EXISTS chamados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        os TEXT UNIQUE,
        equipamento TEXT,
        tipo TEXT,
        prioridade TEXT,
        status TEXT
    )
`);

// 1. Rota para listar todos os chamados (GET)
app.get('/api/chamados', (req, res) => {
    db.all('SELECT * FROM chamados', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 2. Rota para criar um novo chamado (POST)
app.post('/api/chamados', (req, res) => {
    const { equipamento, tipo, prioridade } = req.body;

    // Buscar o último registro para gerar a próxima OS
    db.get('SELECT COUNT(*) as total FROM chamados', [], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const proximaOS = String(row.total + 1).padStart(3, '0');
        const status = 'Aberto';

        const sql = `INSERT INTO chamados (os, equipamento, tipo, prioridade, status) VALUES (?, ?, ?, ?, ?)`;
        const params = [proximaOS, equipamento, tipo, prioridade, status];

        db.run(sql, params, function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ os: proximaOS, equipamento, tipo, prioridade, status });
        });
    });
});

// 3. Rota para alterar status do chamado (PUT)
app.put('/api/chamados/:os', (req, res) => {
    const { os } = req.params;
    const { status } = req.body;

    const sql = `UPDATE chamados SET status = ? WHERE os = ?`;
    db.run(sql, [status, os], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ os, status });
    });
});

// 4. Rota para deletar um chamado (DELETE)
app.delete('/api/chamados/:os', (req, res) => {
    const { os } = req.params;

    const sql = `DELETE FROM chamados WHERE os = ?`;
    db.run(sql, [os], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ mensagem: 'Chamado excluído com sucesso' });
    });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});