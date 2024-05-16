//---------------- Configurações iniciais ----------------//
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { Client } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// configuração do middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Middleware para analisar JSON

// configura o body-parser para analisar solicitação POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// configura a sessão
app.use(session({
  secret: 'secretkey', // chave para assinar a sessão
  resave: false,
  saveUninitialized: false
}));

// Configurações de conexão com o banco de dados local
// const client = new Client({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'Carrinho',
//   password: 'admin',
//   port: 5432, // porta padrão do PostgreSQL
// });

// Configurações de conexão com o banco de dados Railway.app
const client = new Client({
  user: 'postgres',
  host: 'viaduct.proxy.rlwy.net',
  database: 'railway',
  password: 'FlGiIsgFiyUjMUQIWyIDDWXhXwrVISpS',
  port: 35747, // porta padrão do PostgreSQL
});

client.connect() // conecta ao banco de dados
  .then(() => console.log('Conexão com o banco de dados estabelecida com sucesso'))
  .catch(err => console.error('Erro ao conectar ao banco de dados', err));


  // Middleware de autenticação
function autenticacaoMiddleware(req, res, next) {
  // verifica se o usuário está autenticado
  if (req.session && req.session.usuario) {
      // se autenticado, permite acesso à próxima rota
      next();
  } else {
      // se não autenticado, redireciona para a página de login
      if (req.originalUrl === '/carrinho' || req.originalUrl === '/consulta') {
          res.redirect('/login-page');
      } else {
          res.sendStatus(401); // não autorizado
      }
  }
}

 
// Middleware de autenticação
function autenticacaoMiddleware(req, res, next) {
  // Verifica se o usuário está autenticado
  if (req.session && req.session.usuario) {
      // Se autenticado, permite acesso à próxima rota
      next();
  } else {
      // Se não autenticado, redireciona para a página de login
      if (req.originalUrl === '/carrinho' || req.originalUrl === '/consulta') {
          res.redirect('/login-page');
      } else {
          res.sendStatus(401); // não autorizado
      }
  }
}

// Middleware de verificação de permissão de administrador
function checkAdminPermission(req, res, next) {
  // se autenticado e tentando acessar a página de admin
  if (req.originalUrl === '/admin-page') {
      const username = req.session.usuario; // nome de usuário da sessão

      // verifica se o usuário tem permissão de administrador
      const query = `SELECT permissao FROM usuarios WHERE usuario = '${username}'`;

      client.query(query, (err, result) => {
          if (err) {
              console.error('Erro ao consultar permissão:', err);
              res.sendStatus(500); // erro interno do servidor
              return;
          }

          // verifica se o usuário tem permissão de administrador
          if (result.rows.length > 0 && result.rows[0].permissao === 'admin') {
              // se for administrador, permite o acesso à página de admin
              next();
          } else {
              // se não for administrador, nega o acesso
              res.sendStatus(401); // não autorizado
          }
      });
  } else {
      next(); // se não estiver tentando acessar a página de admin, passa para o próximo middleware
  }
}


// client.query(
//   'ALTER TABLE itens_tabela RENAME TO itens_carrinho;',
// )


//---------------- Rotas de funcionalidades ----------------//

// define uma rota para consultar compras
app.get('/consultar-compras', async (req, res) => {

  const data = req.query.data; // data da solicitação
  const usuario = req.session.usuario; // usuario logado

  try {
      // consulta a tabela para obter todas as informações da mesma data
      const query = 'SELECT * FROM itens_carrinho WHERE data = $1 AND usuario = $2';
      const { rows } = await client.query(query, [data, usuario]);

      // envia a lista de compras como resposta
      res.json(rows);
  } catch (error) {
      console.error('Erro ao consultar compras:', error);
      res.status(500).json({ error: 'Erro ao consultar compras' });
  }
});

// validação de login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
      const result = await client.query('SELECT * FROM usuarios WHERE usuario = $1 AND senha = $2', [username, password]);
      if (result.rows.length > 0) {
          // credenciais válidas
          const permissao = result.rows[0].permissao; // Obtém a permissão do usuário do banco de dados
          req.session.usuario = username; // Define o nome de usuário na sessão
          req.session.permissao = permissao; // Define a permissão na sessão
          res.status(200).json({ permissao: permissao }); // Envia a permissão como resposta
          console.log(permissao)
      } else {
          // credenciais inválidas
          res.sendStatus(401);
      }
  } catch (error) {
      console.error('Erro ao fazer login:', error);
      res.sendStatus(500); // erro interno do servidor
  }
});



// logout de usuário
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          console.error('Erro ao finalizar a sessão:', err);
          res.sendStatus(500); // erro interno do servidor
          return;
      }
      res.redirect('/'); // redireciona para a página inicial após logout
  });
});

// registro de novos usuários
app.post('/registro', async (req, res) => {
  const { username, password, email, permissao } = req.body;
  try {
      // verifica se o usuário já existe no banco de dados
      const userExists = await client.query('SELECT * FROM usuarios WHERE usuario = $1', [username]);
      if (userExists.rows.length > 0) {
          // se o usuário já existe, retornar erro
          return res.status(400).json({ error: 'Usuário já registrado' });
      }
      // se o usuário não existe, insere no banco de dados
      await client.query('INSERT INTO usuarios (usuario, senha, email, permissao) VALUES ($1, $2, $3, $4)', [username, password, email, permissao]);
      res.sendStatus(201); // responde com sucesso
  } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      res.sendStatus(500); // erro interno do servidor
  }
});

// salvar os itens no banco de dados
app.post('/salvarItens', (req, res) => {
  const { itens, limite } = req.body;
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const data = year + '-' + (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day;
  const usuario = req.session.usuario;

  // inserir cada item na tabela do banco de dados
  itens.forEach(item => {
    const query = {
      text: 'INSERT INTO itens_carrinho (produto, preco, limite, quantidade, data, usuario) VALUES ($1, $2, $3, $4, $5, $6)',
      values: [item.produto, item.preco, limite, item.quantidade, data, usuario]
    };

    client.query(query, (err, result) => {
      if (err) {
        console.error('Erro ao inserir item:', err);
      }
    });
  });

  res.sendStatus(200); // responde OK
});




// rota para adicionar usuário
app.post('/add-user', async (req, res) => {
  const { username, password, email, permission } = req.body;
  try {
      // insere o novo usuário no banco de dados
      await client.query('INSERT INTO usuarios (usuario, senha, email, permissao) VALUES ($1, $2, $3, $4)', [username, password, email, permission]);
      res.sendStatus(200); // sucesso
  } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      res.sendStatus(500); // erro interno do servidor
  }
});

// rota para listar usuários
app.get('/list-users', async (req, res) => {
  try {
      // consulta todos os usuários no banco de dados
      const result = await client.query('SELECT usuario, senha, email, permissao FROM usuarios');
      const users = result.rows;
      res.json(users); // lista de usuários como JSON
  } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.sendStatus(500); // erro interno do servidor
  }
});

// rota para editar um usuário
app.put('/edit-user/:usuario', async (req, res) => {
  const { usuario } = req.params;
  const { newUsername, newPassword, newEmail, newPermission } = req.body;

  try {
      // atualiza os detalhes do usuário no banco de dados
      await client.query('UPDATE usuarios SET usuario = $1, senha = $2, email = $3, permissao = $4 WHERE usuario = $5', [newUsername, newPassword, newEmail, newPermission, usuario]);
      res.sendStatus(200); // sucesso
  } catch (error) {
      console.error('Erro ao editar usuário:', error);
      res.sendStatus(500); // erro interno do servidor
  }
});



// rota para remover um usuário
app.delete('/remove-user/:usuario', async (req, res) => {
  const { usuario } = req.params;

  try {
      // remove o usuário do banco de dados
      await client.query('DELETE FROM usuarios WHERE usuario = $1', [usuario]);
      res.sendStatus(200); // sucesso
  } catch (error) {
      console.error('Erro ao remover usuário:', error);
      res.sendStatus(500); // erro interno do servidor
  }
});



//---------------- Rotas de redirecionamento ----------------//
// página de login
app.get('/login-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// página de cadastro
app.get('/cadastro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cadastro.html'));
});

// carrinho protegida pelo middleware de autenticação
app.get('/carrinho', autenticacaoMiddleware, function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'carrinho.html'));
});

// página de admin
app.get('/admin-page', checkAdminPermission, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// consulta protegida pelo middleware de autenticação
app.get('/consulta', autenticacaoMiddleware, function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'consulta.html'));
});

// página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});