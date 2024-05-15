function entrar() {
    event.preventDefault(); // evita o envio do formulário normalmente

    const username = document.getElementById('registro-username').value;
    const password = document.getElementById('registro-password').value;
    const ipAddress = window.location.hostname;
    console.log(ipAddress);

    // envia os dados de login para o servidor
    // fetch(`http://${ipAddress}:3000/login`, {
    fetch(`/login`, {
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
        // armazena o nome de usuário e permissão na sessão após um login bem-sucedido
        response.json().then(data => {
            const permissao = data.permissao;
            sessionStorage.setItem('usuario', username);
            sessionStorage.setItem('permissao', permissao);
            // redireciona o usuário para outra página após o login bem-sucedido
            window.location.href = '/';
        });
    })
    .catch(error => {
        alert('Usuário ou senha inválidos ' + error.message);
        console.error('Erro ao fazer login: ', error);
    });
}


function registrar() {
    const username = $('#registro-username').val();
    const password = $('#registro-password').val();
    const email = $('#registro-email').val();
    const permissao = 'user';

    $.post('/registro', { username, password, email, permissao })
        .done(function(response) {
            // limpa os campos do formulário
            $('#registro-username').val('');
            $('#registro-password').val('');
            $('#registro-email').val('');
            
            alert('Usuário registrado com sucesso');

            // página inicial
            window.location.href = '/login-page';
        })
        .fail(function(error) {
            console.error('Erro ao adicionar usuário:', error);
            if (error.statusText === "error") {
                alert('Erro ao se comunicar com o servidor. Verifique sua conexão de internet e tente novamente.');
            } else {
                alert('Erro ao adicionar usuário. Por favor, tente novamente.');
            }
        });
}

// adiciona evento de clique ao botão de logout
document.getElementById('logoutButton').addEventListener('click', function() {
    // remove o usuário da sessão
    window.location.href = '/';
    sessionStorage.removeItem('usuario');
    // atualiza a navbar
    atualizarNavbar();
    // redireciona para a página de login
    // window.location.href = '/';
});