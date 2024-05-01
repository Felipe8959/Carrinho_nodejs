//---------------- Configurações iniciais ----------------//
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { Client } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Middleware para analisar JSON

// Configurar o body-parser para analisar corpos de solicitação POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configurar a sessão
app.use(session({
  secret: 'secretkey', // Chave secreta para assinar a sessão, pode ser qualquer string
  resave: false,
  saveUninitialized: false
}));

// Configurações de conexão com o banco de dados
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'Carrinho',
  password: 'admin',
  port: 5432, // Porta padrão do PostgreSQL
});

client.connect() // Conectar ao banco de dados
  .then(() => console.log('Conexão com o banco de dados estabelecida com sucesso'))
  .catch(err => console.error('Erro ao conectar ao banco de dados', err));

  
// Middleware de Autenticação
function autenticacaoMiddleware(req, res, next) {
  // Verificar se o usuário está autenticado
  if (req.session && req.session.usuario) {
      // Se autenticado, permitir acesso à próxima rota
      next();
  } else {
      // Se não autenticado, redirecionar para a página de login
      if (req.originalUrl === '/carrinho' || req.originalUrl === '/consulta') {
          res.redirect('/login-page');
      } else {
          res.sendStatus(401); // Não autorizado
      }
  }
}


//---------------- Rotas de funcionalidades ----------------//
// Definir uma rota para consultar compras
app.get('/consultar-compras', async (req, res) => {
  // Obter a data da solicitação
  const data = req.query.data;

  try {
      // Consultar a tabela 'itens_tabela' para obter todas as informações da mesma data
      const query = 'SELECT * FROM itens_carrinho WHERE data = $1';
      const { rows } = await client.query(query, [data]);

      // Enviar a lista de compras como resposta
      res.json(rows);
  } catch (error) {
      console.error('Erro ao consultar compras:', error);
      res.status(500).json({ error: 'Erro ao consultar compras' });
  }
});

// Validação de login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
      const result = await client.query('SELECT * FROM usuarios WHERE usuario = $1 AND senha = $2', [username, password]);
      if (result.rows.length > 0) {
          // Credenciais válidas
          req.session.usuario = username; // Definir o nome de usuário na sessão
          res.sendStatus(200);
      } else {
          // Credenciais inválidas
          res.sendStatus(401);
      }
  } catch (error) {
      console.error('Erro ao fazer login:', error);
      res.sendStatus(500); // Erro interno do servidor
  }
});


// logout de usuário
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          console.error('Erro ao finalizar a sessão:', err);
          res.sendStatus(500); // Erro interno do servidor
          return;
      }
      res.redirect('/'); // Redireciona para a página inicial após logout
  });
});

// registro de novos usuários
app.post('/registro', async (req, res) => {
  const { username, password, email } = req.body;
  try {
      // Verificar se o usuário já existe no banco de dados
      const userExists = await client.query('SELECT * FROM usuarios WHERE usuario = $1', [username]);
      if (userExists.rows.length > 0) {
          // Se o usuário já existe, retornar erro
          return res.status(400).json({ error: 'Usuário já registrado' });
      }
      // Se o usuário não existe, inserir no banco de dados
      await client.query('INSERT INTO usuarios (usuario, senha, email) VALUES ($1, $2, $3)', [username, password, email]);
      res.sendStatus(201); // Responder com sucesso
  } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      res.sendStatus(500); // Erro interno do servidor
  }
});

// salvar os itens no banco de dados
app.post('/salvarItens', (req, res) => {
  const { itens, limite } = req.body;
  const data = new Date().toISOString().split('T')[0]; // Obtém a data de hoje no formato 'YYYY-MM-DD'
  const usuario = req.session.usuario;

  // Inserir cada item na tabela do banco de dados
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

  res.sendStatus(200); // Responde OK ao cliente
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

// carrinho protegida pelo middleware de autenticação
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