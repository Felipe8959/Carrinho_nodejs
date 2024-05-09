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
  password: 'znzhQiPlvOyHqTDAjzdzLjAKBbdHvGZB',
  port: 53960, // porta padrão do PostgreSQL
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
          req.session.usuario = username; // define o nome de usuário na sessão
          res.sendStatus(200);
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
  const { username, password, email } = req.body;
  try {
      // verifica se o usuário já existe no banco de dados
      const userExists = await client.query('SELECT * FROM usuarios WHERE usuario = $1', [username]);
      if (userExists.rows.length > 0) {
          // se o usuário já existe, retornar erro
          return res.status(400).json({ error: 'Usuário já registrado' });
      }
      // se o usuário não existe, insere no banco de dados
      await client.query('INSERT INTO usuarios (usuario, senha, email) VALUES ($1, $2, $3)', [username, password, email]);
      res.sendStatus(201); // responde com sucesso
  } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      res.sendStatus(500); // erro interno do servidor
  }
});

// salvar os itens no banco de dados
app.post('/salvarItens', (req, res) => {
  const { itens, limite } = req.body;
  const data = new Date().toISOString().split('T')[0]; // data de hoje
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

  res.sendStatus(200); // responde OK ao cliente
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