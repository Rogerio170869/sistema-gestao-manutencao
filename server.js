require('dotenv').config();

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ===============================
// GERAR TOKEN JWT
// ===============================

function gerarToken(usuario) {

    return jwt.sign(
        {
            id: usuario.id,
            usuario: usuario.usuario,
            perfil: usuario.perfil
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '8h'
        }
    );

}

// ===============================
// AUTENTICAÇÃO JWT
// ===============================

function autenticarToken(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            error: 'Token não informado.'
        });
    }

    const partes = authHeader.split(' ');

    if (partes.length !== 2 || partes[0] !== 'Bearer') {
        return res.status(401).json({
            error: 'Token inválido.'
        });
    }

    const token = partes[1];

    try {

        const usuario = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.usuario = usuario;

        next();

    } catch (error) {

        return res.status(401).json({
            error: 'Token inválido ou expirado.'
        });

    }

}

// ===============================
// CONFIGURAÇÃO DO EXPRESS
// ===============================

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ===============================
// CONEXÃO COM O BANCO DE DADOS
// ===============================

const db = new sqlite3.Database('./manutencao.db', (err) => {

    if (err) {

        console.error(
            'Erro ao conectar ao SQLite:',
            err.message
        );

    } else {

        console.log(
            'Conectado ao banco de dados SQLite.'
        );

    }

});

// ===============================
// INICIALIZAÇÃO DAS TABELAS
// ===============================

db.serialize(() => {

    // ===============================
    // TABELA DE CHAMADOS
    // ===============================

    db.run(`
        CREATE TABLE IF NOT EXISTS chamados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            os TEXT,
            equipamento TEXT NOT NULL,
            tipo TEXT NOT NULL,
            prioridade TEXT NOT NULL,
            status TEXT NOT NULL,
            data_abertura TEXT NOT NULL,
            data_conclusao TEXT,
            tecnico TEXT,
            descricao_solucao TEXT
        )
    `, (err) => {

        if (err) {

            console.error(
                'Erro ao criar tabela chamados:',
                err.message
            );

        }

    });

    // ===============================
    // TABELA DE USUÁRIOS
    // ===============================

    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            nome TEXT NOT NULL,
            perfil TEXT NOT NULL
        )
    `, (err) => {

        if (err) {

            console.error(
                'Erro ao criar tabela usuarios:',
                err.message
            );

            return;
        }

        // ===============================
        // USUÁRIOS PADRÃO
        // ===============================

        bcrypt.hash(
            '123456',
            10,
            (hashErr, hashSenha) => {

                if (hashErr) {

                    console.error(
                        'Erro ao gerar hash das senhas padrão:',
                        hashErr.message
                    );

                    return;
                }

                // Usuário operador
                db.run(
                    `
                    INSERT OR IGNORE INTO usuarios
                    (usuario, senha, nome, perfil)
                    VALUES (?, ?, ?, ?)
                    `,
                    [
                        'operador',
                        hashSenha,
                        'Operador de Produção',
                        'operador'
                    ]
                );

                // Usuário administrador
                db.run(
                    `
                    INSERT OR IGNORE INTO usuarios
                    (usuario, senha, nome, perfil)
                    VALUES (?, ?, ?, ?)
                    `,
                    [
                        'admin',
                        hashSenha,
                        'Gestor de Manutenção',
                        'gestor'
                    ]
                );

            }
        );

    });

});

// ===============================
// VALIDAÇÃO DE CHAMADO
// ===============================

function validarChamado(body) {

    const {
        equipamento,
        tipo,
        prioridade
    } = body || {};

    if (!equipamento || !String(equipamento).trim()) {

        return 'O campo equipamento é obrigatório.';

    }

    if (!tipo || !String(tipo).trim()) {

        return 'O campo tipo é obrigatório.';

    }

    if (!prioridade || !String(prioridade).trim()) {

        return 'O campo prioridade é obrigatório.';

    }

    return null;

}

// ===============================
// HEALTH CHECK
// ===============================

app.get('/api/health', (req, res) => {

    res.json({
        status: 'ok',
        servico: 'sistema-gestao-manutencao'
    });

});

// ===============================
// LOGIN
// ===============================

app.post('/api/login', (req, res) => {

    const {
        usuario,
        senha
    } = req.body || {};

    if (!usuario || !senha) {

        return res.status(400).json({
            error: 'Usuário e senha são obrigatórios.'
        });

    }

    db.get(
        `
        SELECT id, usuario, senha, nome, perfil
        FROM usuarios
        WHERE usuario = ?
        `,
        [
            String(usuario).trim()
        ],
        (err, row) => {

            if (err) {

                console.error(
                    'Erro no login:',
                    err.message
                );

                return res.status(500).json({
                    error:
                        'Erro interno ao realizar login.'
                });

            }

            if (!row) {

                return res.status(401).json({
                    error:
                        'Usuário ou senha inválidos.'
                });

            }

            const senhaArmazenada = row.senha;

            // ===============================
            // SENHA COM BCRYPT
            // ===============================

            if (senhaArmazenada.startsWith('$2')) {

                bcrypt.compare(
                    senha,
                    senhaArmazenada,
                    (compareErr, senhaValida) => {

                        if (compareErr) {

                            console.error(
                                'Erro ao verificar senha:',
                                compareErr.message
                            );

                            return res.status(500).json({
                                error:
                                    'Erro interno ao realizar login.'
                            });

                        }

                        if (!senhaValida) {

                            return res.status(401).json({
                                error:
                                    'Usuário ou senha inválidos.'
                            });

                        }

                        const usuarioAutenticado = {

                            id: row.id,
                            usuario: row.usuario,
                            nome: row.nome,
                            perfil: row.perfil

                        };

                        const token =
                            gerarToken(
                                usuarioAutenticado
                            );

                        return res.json({

                            message:
                                'Login realizado com sucesso',

                            usuario:
                                usuarioAutenticado,

                            token

                        });

                    }
                );

                return;

            }

            // ===============================
            // COMPATIBILIDADE COM SENHA ANTIGA
            // ===============================

            if (senhaArmazenada !== senha) {

                return res.status(401).json({
                    error:
                        'Usuário ou senha inválidos.'
                });

            }

            // ===============================
            // CONVERTE SENHA ANTIGA PARA BCRYPT
            // ===============================

            bcrypt.hash(
                senha,
                10,
                (hashErr, novaSenhaHash) => {

                    if (hashErr) {

                        console.error(
                            'Erro ao gerar hash da senha:',
                            hashErr.message
                        );

                        return res.status(500).json({
                            error:
                                'Erro interno ao proteger a senha.'
                        });

                    }

                    db.run(
                        `
                        UPDATE usuarios
                        SET senha = ?
                        WHERE id = ?
                        `,
                        [
                            novaSenhaHash,
                            row.id
                        ],
                        (updateErr) => {

                            if (updateErr) {

                                console.error(
                                    'Erro ao atualizar senha:',
                                    updateErr.message
                                );

                                return res.status(500).json({
                                    error:
                                        'Erro interno ao atualizar a senha.'
                                });

                            }

                            const usuarioAutenticado = {

                                id: row.id,
                                usuario: row.usuario,
                                nome: row.nome,
                                perfil: row.perfil

                            };

                            const token =
                                gerarToken(
                                    usuarioAutenticado
                                );

                            return res.json({

                                message:
                                    'Login realizado com sucesso',

                                usuario:
                                    usuarioAutenticado,

                                token

                            });

                        }
                    );

                }
            );

        }
    );

});

// ===============================
// LISTAR CHAMADOS
// PROTEGIDO POR JWT
// ===============================

app.get(
    '/api/chamados',
    autenticarToken,
    (req, res) => {

        db.all(
            `
            SELECT *
            FROM chamados
            ORDER BY id DESC
            `,
            [],
            (err, rows) => {

                if (err) {

                    console.error(
                        'Erro ao listar chamados:',
                        err.message
                    );

                    return res.status(500).json({
                        error:
                            'Erro ao consultar chamados.'
                    });

                }

                return res.json(rows);

            }
        );

    }
);

// ===============================
// CRIAR CHAMADO
// ===============================

app.post('/api/chamados', autenticarToken, (req, res) => {

    const erroValidacao =
        validarChamado(req.body);

    if (erroValidacao) {

        return res.status(400).json({
            error: erroValidacao
        });

    }

    const {
        equipamento,
        tipo,
        prioridade
    } = req.body;

    const status = 'Aberto';

    const data_abertura =
        new Date().toISOString();

    db.run(
        `
        INSERT INTO chamados
        (
            equipamento,
            tipo,
            prioridade,
            status,
            data_abertura
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            String(equipamento).trim(),
            String(tipo).trim(),
            String(prioridade).trim(),
            status,
            data_abertura
        ],
        function (err) {

            if (err) {

                console.error(
                    'Erro ao criar chamado:',
                    err.message
                );

                return res.status(500).json({
                    error:
                        'Erro ao criar chamado.'
                });

            }

            const idGerado =
                this.lastID;

            const os =
                String(idGerado).padStart(3, '0');

            db.run(
                `
                UPDATE chamados
                SET os = ?
                WHERE id = ?
                `,
                [
                    os,
                    idGerado
                ],
                (updateErr) => {

                    if (updateErr) {

                        console.error(
                            'Erro ao gerar OS:',
                            updateErr.message
                        );

                        return res.status(500).json({
                            error:
                                'Chamado criado, mas houve erro ao gerar a OS.'
                        });

                    }

                    return res.status(201).json({

                        id: idGerado,

                        os,

                        equipamento:
                            String(equipamento).trim(),

                        tipo:
                            String(tipo).trim(),

                        prioridade:
                            String(prioridade).trim(),

                        status,

                        data_abertura

                    });

                }
            );

        }
    );

});

// ===============================
// ATUALIZAR CHAMADO
// ===============================

app.put('/api/chamados/:id', (req, res) => {

    const {
        id
    } = req.params;

    // Validação do ID
    if (!/^\d+$/.test(id)) {

        return res.status(400).json({
            error:
                'ID do chamado inválido.'
        });

    }

    const {
        status,
        tecnico,
        descricao_solucao
    } = req.body || {};

    // Pelo menos um campo
    if (
        status === undefined &&
        tecnico === undefined &&
        descricao_solucao === undefined
    ) {

        return res.status(400).json({
            error:
                'Informe pelo menos um campo para atualizar.'
        });

    }

    // Técnico não pode ficar vazio
    if (
        tecnico !== undefined &&
        !String(tecnico).trim()
    ) {

        return res.status(400).json({
            error:
                'O campo tecnico não pode ficar vazio.'
        });

    }

    // Solução não pode ficar vazia
    if (
        descricao_solucao !== undefined &&
        !String(descricao_solucao).trim()
    ) {

        return res.status(400).json({
            error:
                'O campo descricao_solucao não pode ficar vazio.'
        });

    }

    db.get(
        `
        SELECT *
        FROM chamados
        WHERE id = ?
        `,
        [id],
        (err, row) => {

            if (err) {

                console.error(
                    'Erro ao consultar chamado:',
                    err.message
                );

                return res.status(500).json({
                    error:
                        'Erro ao consultar chamado.'
                });

            }

            if (!row) {

                return res.status(404).json({
                    error:
                        'Chamado não encontrado.'
                });

            }

            const novoStatus =
                status !== undefined
                    ? String(status).trim()
                    : row.status;

            const novoTecnico =
                tecnico !== undefined
                    ? String(tecnico).trim()
                    : row.tecnico;

            const novaSolucao =
                descricao_solucao !== undefined
                    ? String(descricao_solucao).trim()
                    : row.descricao_solucao;

            // Status permitidos
            const statusPermitidos = [
                'Aberto',
                'Em andamento',
                'Concluído',
                'Cancelado'
            ];

            if (!statusPermitidos.includes(novoStatus)) {

                return res.status(400).json({

                    error:
                        `Status inválido. Use: ${statusPermitidos.join(', ')}.`

                });

            }

            // ===============================
            // CONTROLE DA DATA DE CONCLUSÃO
            // ===============================

            let data_conclusao =
                row.data_conclusao;

            if (
                novoStatus === 'Concluído' &&
                !row.data_conclusao
            ) {

                data_conclusao =
                    new Date().toISOString();

            } else if (
                novoStatus !== 'Concluído'
            ) {

                data_conclusao = null;

            }

            db.run(
                `
                UPDATE chamados
                SET
                    status = ?,
                    tecnico = ?,
                    descricao_solucao = ?,
                    data_conclusao = ?
                WHERE id = ?
                `,
                [
                    novoStatus,
                    novoTecnico || null,
                    novaSolucao || null,
                    data_conclusao,
                    id
                ],
                function (updateErr) {

                    if (updateErr) {

                        console.error(
                            'Erro ao atualizar chamado:',
                            updateErr.message
                        );

                        return res.status(500).json({
                            error:
                                'Erro ao atualizar chamado.'
                        });

                    }

                    return res.json({

                        message:
                            'Chamado atualizado com sucesso!',

                        id:
                            Number(id)

                    });

                }
            );

        }
    );

});

// ===============================
// EXCLUIR CHAMADO
// ===============================

app.delete('/api/chamados/:id', (req, res) => {

    const {
        id
    } = req.params;

    if (!/^\d+$/.test(id)) {

        return res.status(400).json({
            error:
                'ID do chamado inválido.'
        });

    }

    db.run(
        `
        DELETE FROM chamados
        WHERE id = ?
        `,
        [id],
        function (err) {

            if (err) {

                console.error(
                    'Erro ao excluir chamado:',
                    err.message
                );

                return res.status(500).json({
                    error:
                        'Erro ao excluir chamado.'
                });

            }

            if (this.changes === 0) {

                return res.status(404).json({
                    error:
                        'Chamado não encontrado.'
                });

            }

            return res.json({

                message:
                    'Chamado excluído com sucesso!'

            });

        }
    );

});

// ===============================
// ROTA NÃO ENCONTRADA
// ===============================

app.use((req, res) => {

    res.status(404).json({
        error:
            'Rota não encontrada.'
    });

});

// ===============================
// ERRO INTERNO
// ===============================

app.use((err, req, res, next) => {

    console.error(
        'Erro não tratado:',
        err
    );

    res.status(500).json({
        error:
            'Erro interno do servidor.'
    });

});

// ===============================
// INICIAR SERVIDOR
// ===============================

if (require.main === module) {

    app.listen(PORT, () => {

        console.log(
            `Servidor rodando na porta ${PORT}`
        );

    });

}

// ===============================
// EXPORTAÇÃO PARA TESTES
// ===============================

module.exports = app;