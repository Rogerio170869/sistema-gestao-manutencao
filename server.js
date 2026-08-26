const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./manutencao.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao SQLite:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// Criar tabela incluindo colunas para datas de abertura e conclusão
db.run(`
    CREATE TABLE IF NOT EXISTS chamados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        os TEXT,
        equipamento TEXT,
        tipo TEXT,
        prioridade TEXT,
        status TEXT,
        data_abertura TEXT,
        data_conclusao TEXT
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

// 2. Rota para criar chamado com data_abertura automática (POST)
app.post('/api/chamados', (req, res) => {
    const { equipamento, tipo, prioridade } = req.body;
    const status = 'Aberto';
    const dataAbertura = new Date().toISOString(); // Formato ISO para facilitarmos cálculos

    const sql = `INSERT INTO chamados (equipamento, tipo, prioridade, status, data_abertura, data_conclusao) VALUES (?, ?, ?, ?, ?, NULL)`;
    db.run(sql, [equipamento, tipo, prioridade, status, dataAbertura], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const idInserido = this.lastID;
        const osFormatada = String(idInserido).padStart(3, '0');

        db.run(`UPDATE chamados SET os = ? WHERE id = ?`, [osFormatada, idInserido], (errUpdate) => {
            if (errUpdate) {
                res.status(500).json({ error: errUpdate.message });
                return;
            }
            res.status(201).json({ 
                id: idInserido, 
                os: osFormatada, 
                equipamento, 
                tipo, 
                prioridade, 
                status, 
                data_abertura: dataAbertura, 
                data_conclusao: null 
            });
        });
    });
});

// 3. Rota para alterar status e registrar data_conclusao ao encerrar (PUT)
app.put('/api/chamados/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    let dataConclusao = null;
    if (status === 'Concluído') {
        dataConclusao = new Date().toISOString();
    }

    const sql = `UPDATE chamados SET status = ?, data_conclusao = CASE WHEN ? = 'Concluído' THEN ? ELSE NULL END WHERE id = ?`;
    db.run(sql, [status, status, dataConclusao, id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id, status, data_conclusao: dataConclusao });
    });
});

// 4. Rota para deletar chamado (DELETE)
app.delete('/api/chamados/:id', (req, res) => {
    const { id } = req.params;

    const sql = `DELETE FROM chamados WHERE id = ?`;
    db.run(sql, [os = id], function (err) {
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