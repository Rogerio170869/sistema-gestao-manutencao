const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Conexão com o banco de dados
const db = new sqlite3.Database('./manutencao.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao SQLite:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// Tabela estruturada com ID autoincremento e campo OS formatado
db.run(`
    CREATE TABLE IF NOT EXISTS chamados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        os TEXT,
        equipamento TEXT,
        tipo TEXT,
        prioridade TEXT,
        status TEXT
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

    // Insere o chamado e usa a chave primaria ID para formatar a OS
    const sql = `INSERT INTO chamados (equipamento, tipo, prioridade, status) VALUES (?, ?, ?, ?)`;
    db.run(sql, [equipamento, tipo, prioridade, status], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const idInserido = this.lastID;
        const osFormatada = String(idInserido).padStart(3, '0');

        // Atualiza a OS com base no ID autoincrementado
        db.run(`UPDATE chamados SET os = ? WHERE id = ?`, [osFormatada, idInserido], (errUpdate) => {
            if (errUpdate) {
                res.status(500).json({ error: errUpdate.message });
                return;
            }
            res.status(201).json({ id: idInserido, os: osFormatada, equipamento, tipo, prioridade, status });
        });
    });
});

// 3. Rota para alterar status (PUT)
app.put('/api/chamados/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const sql = `UPDATE chamados SET status = ? WHERE id = ?`;
    db.run(sql, [status, id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id, status });
    });
});

// 4. Rota para deletar chamado (DELETE)
app.delete('/api/chamados/:id', (req, res) => {
    const { id } = req.params;

    const sql = `DELETE FROM chamados WHERE id = ?`;
    db.run(sql, [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ mensagem: 'Chamado excluído com sucesso' });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});