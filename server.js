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

// Criar tabela e garantir que as novas colunas existam
db.serialize(() => {
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

    // Adiciona as colunas caso a tabela antiga não as tenha
    db.run(`ALTER TABLE chamados ADD COLUMN tecnico TEXT`, () => {});
    db.run(`ALTER TABLE chamados ADD COLUMN descricao_solucao TEXT`, () => {});
});
// 1. Listar chamados (GET)
app.get('/api/chamados', (req, res) => {
    db.all('SELECT * FROM chamados ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 2. Criar chamado (POST)
app.post('/api/chamados', (req, res) => {
    const { equipamento, tipo, prioridade } = req.body;
    const status = 'Aberto';
    const dataAbertura = new Date().toISOString();

    const sql = `INSERT INTO chamados (equipamento, tipo, prioridade, status, data_abertura, data_conclusao, tecnico, descricao_solucao) VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL)`;
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
                data_conclusao: null,
                tecnico: null,
                descricao_solucao: null
            });
        });
    });
});

// 3. Atualizar status, técnico e solução (PUT)
app.put('/api/chamados/:id', (req, res) => {
    const { id } = req.params;
    const { status, tecnico, descricao_solucao } = req.body;

    // Se estiver apenas alterando o status pelo <select> rápido da tabela
    if (status !== undefined && tecnico === undefined) {
        let dataConclusao = status === 'Concluído' ? new Date().toISOString() : null;
        const sql = `UPDATE chamados SET status = ?, data_conclusao = CASE WHEN ? = 'Concluído' THEN ? ELSE NULL END WHERE id = ?`;
        db.run(sql, [status, status, dataConclusao, id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, status, data_conclusao: dataConclusao });
        });
        return;
    }

    // Atualização completa via Modal de Edição
    let dataConclusao = status === 'Concluído' ? new Date().toISOString() : null;
    const sql = `
        UPDATE chamados 
        SET status = ?, 
            tecnico = ?, 
            descricao_solucao = ?, 
            data_conclusao = CASE WHEN ? = 'Concluído' THEN COALESCE(data_conclusao, ?) ELSE NULL END 
        WHERE id = ?
    `;

    db.run(sql, [status, tecnico, descricao_solucao, status, dataConclusao, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id, status, tecnico, descricao_solucao, data_conclusao: dataConclusao });
    });
});

// 4. Deletar chamado (DELETE)
app.delete('/api/chamados/:id', (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM chamados WHERE id = ?`;
    db.run(sql, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensagem: 'Chamado excluído com sucesso' });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});