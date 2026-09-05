const request = require('supertest');
const app = require('./server');
const jwt = require('jsonwebtoken');
describe('Health Check', () => {
test('deve impedir operador de excluir chamado', async () => {

    const loginOperador = await request(app)
        .post('/api/login')
        .send({
            usuario: 'operador',
            senha: '123456'
        });

    const loginGestor = await request(app)
        .post('/api/login')
        .send({
            usuario: 'admin',
            senha: '123456'
        });

    const criado = await request(app)
        .post('/api/chamados')
        .set('Authorization', `Bearer ${loginGestor.body.token}`)
        .send({
            equipamento: 'Chamado teste exclusão autorização',
            tipo: 'Corretiva',
            prioridade: 'Alta'
        });

    expect(criado.statusCode).toBe(201);

    const id = criado.body.id;

    const resposta = await request(app)
        .delete(`/api/chamados/${id}`)
        .set('Authorization', `Bearer ${loginOperador.body.token}`);

    expect(resposta.statusCode).toBe(403);

    expect(resposta.body.error)
        .toBe('Acesso negado. Apenas gestores podem realizar esta operação.');

});
    test('deve retornar status 200 e serviço OK', async () => {

        const response = await request(app)
            .get('/api/health');

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            status: 'ok',
            servico: 'sistema-gestao-manutencao'
        });

    });

});

describe('Login', () => {
    test('deve rejeitar token JWT inválido', async () => {
    const response = await request(app)
        .get('/api/chamados')
        .set('Authorization', 'Bearer token-invalido');

    expect(response.statusCode).toBe(401);
});
    test('deve rejeitar acesso sem token', async () => {
    const response = await request(app)
        .get('/api/chamados');

    expect(response.statusCode).toBe(401);
});
    test('deve retornar um token JWT no login', async () => {
    const response = await request(app)
        .post('/api/login')
        .send({ usuario: 'admin', senha: '123456' });

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(typeof response.body.token).toBe('string');
    expect(response.body.token.split('.')).toHaveLength(3);
});
test('deve autenticar usuário com senha armazenada em bcrypt', async () => {

    const response = await request(app)
        .post('/api/login')
        .send({
            usuario: 'admin',
            senha: '123456'
        });

    expect(response.statusCode).toBe(200);

    expect(response.body.message)
        .toBe('Login realizado com sucesso');

    expect(response.body.usuario.usuario)
        .toBe('admin');

    expect(response.body.usuario.perfil)
        .toBe('gestor');

});
    test('deve realizar login com usuário válido', async () => {

        const response = await request(app)
            .post('/api/login')
            .send({
                usuario: 'operador',
                senha: '123456'
            });

        expect(response.statusCode).toBe(200);

        expect(response.body.message)
            .toBe('Login realizado com sucesso');

        expect(response.body.usuario.usuario)
            .toBe('operador');

        expect(response.body.usuario.perfil)
            .toBe('operador');

    });

    test('deve rejeitar login com senha inválida', async () => {

        const response = await request(app)
            .post('/api/login')
            .send({
                usuario: 'operador',
                senha: 'senha-errada'
            });

        expect(response.statusCode).toBe(401);

        expect(response.body.error)
            .toBe('Usuário ou senha inválidos.');

    });

    test('deve rejeitar login sem usuário e senha', async () => {

        const response = await request(app)
            .post('/api/login')
            .send({});

        expect(response.statusCode).toBe(400);

        expect(response.body.error)
            .toBe('Usuário e senha são obrigatórios.');

    });
test('não deve retornar a senha no login', async () => {

    const response = await request(app)
        .post('/api/login')
        .send({
            usuario: 'operador',
            senha: '123456'
        });

    expect(response.statusCode).toBe(200);

    expect(response.body.usuario.senha)
        .toBeUndefined();

});

describe('Chamados', () => {
 test('deve rejeitar exclusão com ID inválido', async () => {
    const login = await request(app)
    .post('/api/login')
    .send({
        usuario: 'admin',
        senha: '123456'
    });
const response = await request(app)
    .delete('/api/chamados/abc')
    .set('Authorization', `Bearer ${login.body.token}`);

    expect(response.statusCode).toBe(400);

    expect(response.body.error)
        .toBe('ID do chamado inválido.');
});   
test('deve retornar 404 ao atualizar chamado inexistente', async () => {

    const login = await request(app)
        .post('/api/login')
        .send({
            usuario: 'admin',
            senha: '123456'
        });

    const response = await request(app)
        .put('/api/chamados/999999')
        .set('Authorization', `Bearer ${login.body.token}`)
        .send({
            status: 'Em andamento'
        });

    expect(response.statusCode).toBe(404);

    expect(response.body.error)
        .toBe('Chamado não encontrado.');

});
test('deve rejeitar atualização com ID inválido', async () => {

    const login = await request(app)
        .post('/api/login')
        .send({
            usuario: 'admin',
            senha: '123456'
        });

    const response = await request(app)
        .put('/api/chamados/abc')
        .set('Authorization', `Bearer ${login.body.token}`)
        .send({
            status: 'Em andamento'
        });

    expect(response.statusCode).toBe(400);

    expect(response.body.error)
        .toBe('ID do chamado inválido.');

});
test('deve rejeitar chamado sem prioridade', async () => {

    const loginConsulta = await request(app)
    .post('/api/login')
    .send({
        usuario: 'admin',
        senha: '123456'
    });
const login = await request(app)
    .post('/api/login')
    .send({
        usuario: 'admin',
        senha: '123456'
    });
const response = await request(app)
    .post('/api/chamados')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
        equipamento: 'Equipamento sem prioridade',
        tipo: 'Corretiva'
    });

    expect(response.statusCode).toBe(400);

    expect(response.body.error)
        .toBe('O campo prioridade é obrigatório.');

});
    test('deve rejeitar chamado sem tipo', async () => {

  const login = await request(app)
    .post('/api/login')
    .send({
        usuario: 'admin',
        senha: '123456'
    });

const response = await request(app)
    .post('/api/chamados')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
        equipamento: 'Equipamento sem tipo',
        prioridade: 'Alta'
    });

    expect(response.statusCode).toBe(400);

    expect(response.body.error)
        .toBe('O campo tipo é obrigatório.');

});
    test('deve registrar data de conclusão ao concluir chamado', async () => {

        const login = await request(app)
    .post('/api/login')
    .send({
        usuario: 'admin',
        senha: '123456'
    });

const criado = await request(app)
    .post('/api/chamados')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
        equipamento: 'Equipamento para conclusão',
        tipo: 'Corretiva',
        prioridade: 'Alta'
    });

        expect(criado.statusCode).toBe(201);

        const id = criado.body.id;

        const atualizado = await request(app)
    .put(`/api/chamados/${id}`)
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
        status: 'Concluído'
    });

        expect(atualizado.statusCode).toBe(200);

const loginConsulta = await request(app)
    .post('/api/login')
    .send({
        usuario: 'admin',
        senha: '123456'
    });

const consulta = await request(app)
    .get('/api/chamados')
    .set('Authorization', `Bearer ${loginConsulta.body.token}`);

        expect(consulta.statusCode).toBe(200);

        const chamado = consulta.body.find(item => item.id === id);

        expect(chamado).toBeDefined();
        expect(chamado.status).toBe('Concluído');
        expect(chamado.data_conclusao).toBeDefined();
        expect(chamado.data_conclusao).not.toBeNull();

    });

    test('deve retornar 404 ao excluir chamado inexistente', async () => {

        const login = await request(app)
    .post('/api/login')
    .send({
        usuario: 'admin',
        senha: '123456'
    });

const response = await request(app)
    .delete('/api/chamados/999999')
    .set('Authorization', `Bearer ${login.body.token}`);

        expect(response.statusCode).toBe(404);

        expect(response.body.error)
            .toBe('Chamado não encontrado.');

    });

    test('deve excluir um chamado existente', async () => {

        const login = await request(app)
    .post('/api/login')
    .send({
        usuario: 'admin',
        senha: '123456'
    });

const criado = await request(app)
    .post('/api/chamados')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
        equipamento: 'Equipamento para exclusão',
        tipo: 'Corretiva',
        prioridade: 'Baixa'
    });

        expect(criado.statusCode).toBe(201);

        const id = criado.body.id;

        const response = await request(app)
            .delete('/api/chamados/' + id)
            .set('Authorization', `Bearer ${login.body.token}`);

        expect(response.statusCode).toBe(200);

        expect(response.body.message)
            .toBe('Chamado excluído com sucesso!');

    });

    test('deve rejeitar status inválido ao atualizar chamado', async () => {
const login = await request(app)
    .post('/api/login')
    .send({
        usuario: 'admin',
        senha: '123456'
    });
        const criado = await request(app)
    .post('/api/chamados')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
        equipamento: 'Equipamento teste status',
        tipo: 'Corretiva',
        prioridade: 'Baixa'
    });

        expect(criado.statusCode).toBe(201);

        const id = criado.body.id;

        const response = await request(app)
            .put('/api/chamados/' + id)
            .set('Authorization', `Bearer ${login.body.token}`)
            .send({
                status: 'Status inexistente'
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.error)
            .toContain('Status inválido');

    });

    test('deve atualizar um chamado existente', async () => {
const login = await request(app)
    .post('/api/login')
    .send({
        usuario: 'admin',
        senha: '123456'
    });
            const criado = await request(app)
            .post('/api/chamados')
            .set('Authorization', `Bearer ${login.body.token}`)
            .send({
                equipamento: 'Motor para atualização',
                tipo: 'Preventiva',
                prioridade: 'Média'
            });

        expect(criado.statusCode).toBe(201);

        const id = criado.body.id;

        const response = await request(app)
            .put('/api/chamados/' + id)
            .set('Authorization', `Bearer ${login.body.token}`)
            .send({
                status: 'Em andamento',
                tecnico: 'Rogerio',
                descricao_solucao: 'Verificação inicial'
            });

        expect(response.statusCode).toBe(200);

        expect(response.body.message)
            .toBe('Chamado atualizado com sucesso!');

        expect(response.body.id)
            .toBe(id);

    });

    test('deve listar os chamados', async () => {

const login = await request(app)
    .post('/api/login')
    .send({
        usuario: 'admin',
        senha: '123456'
    });
const loginConsulta = await request(app)
    .post('/api/login')
    .send({
        usuario: 'admin',
        senha: '123456'
    });
const response = await request(app)
    .get('/api/chamados')
    .set('Authorization', `Bearer ${loginConsulta.body.token}`);

        expect(response.statusCode).toBe(200);

        expect(Array.isArray(response.body))
            .toBe(true);

    });

    test('deve rejeitar chamado sem equipamento', async () => {
const login = await request(app)
    .post('/api/login')
    .send({
        usuario: 'admin',
        senha: '123456'
    });
        const response = await request(app)
    .post('/api/chamados')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
                tipo: 'Corretiva',
                prioridade: 'Alta'
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.error)
            .toBe('O campo equipamento é obrigatório.');

    });

    test('deve criar um chamado válido', async () => {
const login = await request(app)
    .post('/api/login')
    .send({
        usuario: 'admin',
        senha: '123456'
    });
        const response = await request(app)
    .post('/api/chamados')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
                equipamento: 'Motor de teste',
                tipo: 'Corretiva',
                prioridade: 'Alta'
            });

        expect(response.statusCode).toBe(201);

        expect(response.body.id).toBeDefined();

        expect(response.body.os).toMatch(/^\d{3}$/);

        expect(response.body.equipamento)
            .toBe('Motor de teste');

        expect(response.body.tipo)
            .toBe('Corretiva');

        expect(response.body.prioridade)
            .toBe('Alta');

        expect(response.body.status)
            .toBe('Aberto');

    });

});
test('deve limpar data de conclusão ao voltar chamado para andamento', async () => {
const login = await request(app)
    .post('/api/login')
    .send({
        usuario: 'admin',
        senha: '123456'
    });
const criado = await request(app)
    .post('/api/chamados')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
            equipamento: 'Equipamento transição status',
            tipo: 'Corretiva',
            prioridade: 'Alta'
        });

    expect(criado.statusCode).toBe(201);

    const id = criado.body.id;

    const concluido = await request(app)
    .put(`/api/chamados/${id}`)
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
        status: 'Concluído'
    });

    expect(concluido.statusCode).toBe(200);

    const andamento = await request(app)
    .put(`/api/chamados/${id}`)
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
        status: 'Em andamento'
    });

    expect(andamento.statusCode).toBe(200);
    const consulta = await request(app)
    .get('/api/chamados')
    .set('Authorization', `Bearer ${login.body.token}`);

    const chamado = consulta.body.find(item => item.id === id);

    expect(chamado).toBeDefined();
    expect(chamado.status).toBe('Em andamento');
    expect(chamado.data_conclusao).toBeNull();

});
test('deve atualizar tecnico e descricao da solução do chamado', async () => {
const login = await request(app)
    .post('/api/login')
    .send({
        usuario: 'admin',
        senha: '123456'
    });
    const criado = await request(app)
        .post('/api/chamados')
        .set('Authorization', `Bearer ${login.body.token}`)
        .send({
            equipamento: 'Equipamento atualização técnico',
            tipo: 'Corretiva',
            prioridade: 'Média'
        });

    expect(criado.statusCode).toBe(201);

    const id = criado.body.id;

    const atualizado = await request(app)
        .put(`/api/chamados/${id}`)
        .set('Authorization', `Bearer ${login.body.token}`)
        .send({
            tecnico: 'Técnico Teste',
            descricao_solucao: 'Foi realizada a substituição do componente.'
        });

    expect(atualizado.statusCode).toBe(200);



const consulta = await request(app)
    .get('/api/chamados')
    .set('Authorization', `Bearer ${login.body.token}`);

    const chamado = consulta.body.find(item => item.id === id);

    expect(chamado).toBeDefined();
    expect(chamado.tecnico).toBe('Técnico Teste');
    expect(chamado.descricao_solucao)
        .toBe('Foi realizada a substituição do componente.');

});
test('deve rejeitar atualização sem nenhum campo informado', async () => {
const login = await request(app)
    .post('/api/login')
    .send({
        usuario: 'admin',
        senha: '123456'
    });
    const criado = await request(app)
        .post('/api/chamados')
        .set('Authorization', `Bearer ${login.body.token}`)
        .send({
            equipamento: 'Equipamento teste atualização vazia',
            tipo: 'Corretiva',
            prioridade: 'Média'
        });

    expect(criado.statusCode).toBe(201);

    const id = criado.body.id;

    const resposta = await request(app)
        .put(`/api/chamados/${id}`)
        .set('Authorization', `Bearer ${login.body.token}`)
        .send({});

    expect(resposta.statusCode).toBe(400);
    expect(resposta.body.error)
        .toBe('Informe pelo menos um campo para atualizar.');

});


test('deve rejeitar tecnico vazio na atualização', async () => {
    const login = await request(app)
        .post('/api/login')
        .send({
            usuario: 'admin',
            senha: '123456'
        });

    const criado = await request(app)
        .post('/api/chamados')
        .set('Authorization', `Bearer ${login.body.token}`)
        .send({
            equipamento: 'Equipamento teste técnico vazio',
            tipo: 'Corretiva',
            prioridade: 'Média'
        });

    expect(criado.statusCode).toBe(201);

    const id = criado.body.id;

    const resposta = await request(app)
        .put(`/api/chamados/${id}`)
        .set('Authorization', `Bearer ${login.body.token}`)
        .send({
            tecnico: '   '
        });

        expect(resposta.body.error)
        .toBe('O campo tecnico não pode ficar vazio.');

});  // fecha "deve rejeitar tecnico vazio na atualização"
test('deve impedir operador de alterar chamado', async () => {
    const loginOperador = await request(app)
        .post('/api/login')
        .send({
            usuario: 'operador',
            senha: '123456'
        });

    const loginGestor = await request(app)
        .post('/api/login')
        .send({
            usuario: 'admin',
            senha: '123456'
        });

    const criado = await request(app)
        .post('/api/chamados')
        .set('Authorization', `Bearer ${loginGestor.body.token}`)
        .send({
            equipamento: 'Chamado teste autorização',
            tipo: 'Corretiva',
            prioridade: 'Alta'
        });

    expect(criado.statusCode).toBe(201);

    const id = criado.body.id;

    const resposta = await request(app)
        .put(`/api/chamados/${id}`)
        .set('Authorization', `Bearer ${loginOperador.body.token}`)
        .send({
            status: 'Em andamento'
        });

    expect(resposta.statusCode).toBe(403);

    expect(resposta.body.error)
        .toBe('Acesso negado. Apenas gestores podem realizar esta operação.');

});
});