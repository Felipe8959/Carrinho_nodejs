function entrar() {
    event.preventDefault(); // evita o envio do formulário normalmente

    const username = document.getElementById('registro-username').value;
    const password = document.getElementById('registro-password').value;
    const ipAddress = window.location.hostname;
    console.log(ipAddress);

    // envia os dados de login para o servidor
    fetch(`http://${ipAddress}:3000/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username, password: password })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Credenciais inválidas');
        }
        // armazena o nome de usuário na sessão após um login bem-sucedido
        sessionStorage.setItem('usuario', username);
        // redireciona o usuário para outra página após o login bem-sucedido
        window.location.href = '/carrinho';
    })
    .catch(error => {
        alert('Usuário ou senha inválidos' + error.message);
        console.error('Erro ao fazer login:', error);
    });
}


function registrar() {
    const username = document.getElementById('registro-username').value;
    const password = document.getElementById('registro-password').value;
    const email = document.getElementById('registro-email').value;
    const ipAddress = window.location.hostname;

    // envia os dados de registro para o servidor
    fetch(`http://${ipAddress}:3000/registro`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username, password: password, email: email })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao registrar usuário');
        }
        alert('Usuário registrado com sucesso');
        // redireciona o usuário para a página de login após o registro bem-sucedido
        window.location.href = '/';
    })
    .catch(error => {
        alert('Erro ao registrar usuário: ' + error.message);
        console.error('Erro ao registrar usuário:', error);
    });
}

// verifica se o usuário está autenticado e atualiza a navbar
function atualizarNavbar() {
    const usuario = sessionStorage.getItem('usuario');
    console.log('usuário recuperado da sessão:', usuario);
    if (usuario) {
        document.getElementById('navbarUsername').textContent = usuario;
        document.getElementById('navbarUsername').style.display = 'inline';
        document.getElementById('logoutButton').style.display = 'inline';
        document.getElementById('loginButton').style.display = 'none';
        document.getElementById('irCarrinho').style.display = 'inline';
        document.getElementById('irConsulta').style.display = 'inline';
    } else {
        document.getElementById('navbarUsername').style.display = 'none';
        document.getElementById('logoutButton').style.display = 'none';
        document.getElementById('loginButton').style.display = 'inline';
        document.getElementById('irCarrinho').style.display = 'none';
        document.getElementById('irConsulta').style.display = 'none';
    }
}

// chamar a função para atualizar a navbar quando o HTML e o CSS forem completamente carregados
document.addEventListener('DOMContentLoaded', function() {
    atualizarNavbar();
});


// adiciona evento de clique ao botão de logout
document.getElementById('logoutButton').addEventListener('click', function() {
    // remove o usuário da sessão
    sessionStorage.removeItem('usuario');
    // atualiza a navbar
    atualizarNavbar();
    // redireciona para a página de login
    window.location.href = '/login-page';
});