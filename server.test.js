const request = require('supertest');
const app = require('./server');

describe('Health Check', () => {

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

});

describe('Chamados', () => {
 test('deve rejeitar exclusão com ID inválido', async () => {

    const response = await request(app)
        .delete('/api/chamados/abc');

    expect(response.statusCode).toBe(400);

    expect(response.body.error)
        .toBe('ID do chamado inválido.');

});   
    test('deve retornar 404 ao atualizar chamado inexistente', async () => {

    const response = await request(app)
        .put('/api/chamados/999999')
        .send({
            status: 'Em andamento'
        });

    expect(response.statusCode).toBe(404);

    expect(response.body.error)
        .toBe('Chamado não encontrado.');

});
test('deve rejeitar atualização com ID inválido', async () => {

    const response = await request(app)
        .put('/api/chamados/abc')
        .send({
            status: 'Em andamento'
        });

    expect(response.statusCode).toBe(400);

    expect(response.body.error)
        .toBe('ID do chamado inválido.');

});    
test('deve rejeitar chamado sem prioridade', async () => {

    const response = await request(app)
        .post('/api/chamados')
        .send({
            equipamento: 'Equipamento sem prioridade',
            tipo: 'Corretiva'
        });

    expect(response.statusCode).toBe(400);

    expect(response.body.error)
        .toBe('O campo prioridade é obrigatório.');

});
    test('deve rejeitar chamado sem tipo', async () => {

    const response = await request(app)
        .post('/api/chamados')
        .send({
            equipamento: 'Equipamento sem tipo',
            prioridade: 'Alta'
        });

    expect(response.statusCode).toBe(400);

    expect(response.body.error)
        .toBe('O campo tipo é obrigatório.');

});
    test('deve registrar data de conclusão ao concluir chamado', async () => {

        const criado = await request(app)
            .post('/api/chamados')
            .send({
                equipamento: 'Equipamento para conclusão',
                tipo: 'Corretiva',
                prioridade: 'Alta'
            });

        expect(criado.statusCode).toBe(201);

        const id = criado.body.id;

        const atualizado = await request(app)
            .put('/api/chamados/' + id)
            .send({
                status: 'Concluído'
            });

        expect(atualizado.statusCode).toBe(200);

        const consulta = await request(app)
            .get('/api/chamados');

        expect(consulta.statusCode).toBe(200);

        const chamado = consulta.body.find(item => item.id === id);

        expect(chamado).toBeDefined();
        expect(chamado.status).toBe('Concluído');
        expect(chamado.data_conclusao).toBeDefined();
        expect(chamado.data_conclusao).not.toBeNull();

    });

    test('deve retornar 404 ao excluir chamado inexistente', async () => {

        const response = await request(app)
            .delete('/api/chamados/999999');

        expect(response.statusCode).toBe(404);

        expect(response.body.error)
            .toBe('Chamado não encontrado.');

    });

    test('deve excluir um chamado existente', async () => {

        const criado = await request(app)
            .post('/api/chamados')
            .send({
                equipamento: 'Equipamento para exclusão',
                tipo: 'Corretiva',
                prioridade: 'Baixa'
            });

        expect(criado.statusCode).toBe(201);

        const id = criado.body.id;

        const response = await request(app)
            .delete('/api/chamados/' + id);

        expect(response.statusCode).toBe(200);

        expect(response.body.message)
            .toBe('Chamado excluído com sucesso!');

    });

    test('deve rejeitar status inválido ao atualizar chamado', async () => {

        const criado = await request(app)
            .post('/api/chamados')
            .send({
                equipamento: 'Equipamento teste status',
                tipo: 'Corretiva',
                prioridade: 'Baixa'
            });

        expect(criado.statusCode).toBe(201);

        const id = criado.body.id;

        const response = await request(app)
            .put('/api/chamados/' + id)
            .send({
                status: 'Status inexistente'
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.error)
            .toContain('Status inválido');

    });

    test('deve atualizar um chamado existente', async () => {

        const criado = await request(app)
            .post('/api/chamados')
            .send({
                equipamento: 'Motor para atualização',
                tipo: 'Preventiva',
                prioridade: 'Média'
            });

        expect(criado.statusCode).toBe(201);

        const id = criado.body.id;

        const response = await request(app)
            .put('/api/chamados/' + id)
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

        const response = await request(app)
            .get('/api/chamados');

        expect(response.statusCode).toBe(200);

        expect(Array.isArray(response.body))
            .toBe(true);

    });

    test('deve rejeitar chamado sem equipamento', async () => {

        const response = await request(app)
            .post('/api/chamados')
            .send({
                tipo: 'Corretiva',
                prioridade: 'Alta'
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.error)
            .toBe('O campo equipamento é obrigatório.');

    });

    test('deve criar um chamado válido', async () => {

        const response = await request(app)
            .post('/api/chamados')
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
