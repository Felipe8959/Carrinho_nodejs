function entrar() {
    event.preventDefault(); // Evita o envio do formulário normalmente

    const username = document.getElementById('registro-username').value;
    const password = document.getElementById('registro-password').value;
    const ipAddress = window.location.hostname;
    console.log(ipAddress);

    // Enviar os dados de login para o servidor
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
        // Armazenar o nome de usuário na sessão após um login bem-sucedido
        sessionStorage.setItem('usuario', username);
        // Redirecionar o usuário para outra página após o login bem-sucedido
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

    // Enviar os dados de registro para o servidor
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
        // Redirecionar o usuário para a página de login após o registro bem-sucedido
        window.location.href = '/';
    })
    .catch(error => {
        alert('Erro ao registrar usuário: ' + error.message);
        console.error('Erro ao registrar usuário:', error);
    });
}

// Verificar se o usuário está autenticado e atualizar a navbar
function atualizarNavbar() {
    const usuario = sessionStorage.getItem('usuario');
    console.log('Usuário recuperado da sessão:', usuario); // Adicione este console.log para verificar se o usuário está sendo recuperado corretamente
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

// Chamar a função para atualizar a navbar quando o HTML e o CSS forem completamente carregados
document.addEventListener('DOMContentLoaded', function() {
    atualizarNavbar();
});


// Adicionar evento de clique ao botão de logout
document.getElementById('logoutButton').addEventListener('click', function() {
    // Remover o usuário da sessão
    sessionStorage.removeItem('usuario');
    // Atualizar a navbar
    atualizarNavbar();
    // Redirecionar para a página de login
    window.location.href = '/login-page';
});