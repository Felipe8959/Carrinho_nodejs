$(document).ready(function() {
    // função para adicionar usuário
    $('#addUserForm').submit(function(event) {
        event.preventDefault(); // evita o envio do formulário normalmente

        // valores dos campos do formulário
        const username = $('#username').val();
        const password = $('#password').val();
        const email = $('#email').val();
        const permission = $('#permission').val();

        // envia os dados do novo usuário para o servidor apenas se o botão estiver como 'adicionar'
        if ($('#addUserButton').text() === 'Adicionar') {
            $.post('/add-user', { username: username, password: password, email: email, permission: permission })
                .done(function(response) {
                    // limpa os campos do formulário após adicionar o usuário
                    $('#username').val('');
                    $('#password').val('');
                    $('#email').val('');
                    $('#permission').val('user');

                    // atualiza a lista de usuários após adicionar o usuário
                    listarUsuarios();

                    alert(`Usuário ${username} cadastrado`)
                })
                .fail(function(error) {
                    console.error('Erro ao adicionar usuário:', error);
                    alert('Erro ao adicionar usuário. Por favor, tente novamente.');
                });
        }

    });

    // função para listar usuários
    function listarUsuarios() {
        // limpa a lista de usuários antes de atualizar
        $('#userList').empty();
    
        // obtém a lista de usuários do servidor
        $.get('/list-users')
            .done(function(users) {
                //adiciona cada usuário à tabela
                users.forEach(function(user) {
                    $('#userList').append(`<tr>
                        <td>${user.usuario}</td>
                        <td>${user.permissao}</td>
                        <td>
                        <button class="btn btn-primary btn-sm" onclick="editarUsuario('${user.usuario}', '${user.senha}', '${user.email}', '${user.permissao}')">
                            <i class="fas fa-edit"></i> <!-- Ícone de lápis para editar -->
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="removerUsuario('${user.usuario}')">
                            <i class="fas fa-trash-alt"></i> <!-- Ícone de lixeira para remover -->
                        </button>
                        </td>                    
                    </tr>`);
                
                });
            })
            .fail(function(error) {
                console.error('Erro ao obter lista de usuários:', error);
                alert('Erro ao obter lista de usuários. Por favor, tente novamente.');
            });
    }
    
    // chama a função para listar usuários quando a página é carregada
    listarUsuarios();

});

// função para remover usuário
function removerUsuario(usuario) {
    // confirmação do usuário antes de remover
    if (confirm(`Tem certeza de que deseja remover o usuário '${usuario}'?`)) {
        // envia a solicitação para remover o usuário para o servidor
        $.ajax({
            url: `/remove-user/${usuario}`,
            method: 'DELETE',
            success: function(response) {
                // atualiza a lista de usuários após remover o usuário
                location.reload();
                listarUsuarios();
            },
            error: function(error) {
                console.error('Erro ao remover usuário:', error);
                alert('Erro ao remover usuário. Por favor, tente novamente.');
            }
        });
    }
}



// função para preencher o formulário de adição de usuário com os detalhes do usuário selecionado para edição
function editarUsuario(usuario, senha, email, permissao) {
    $('#username').val(usuario);
    $('#password').val(senha);
    $('#email').val(email);
    $('#permission').val(permissao);
    window.scrollTo(0,document.body.scrollHeight);
    // altera o texto e a função do botão para "Salvar edição"
    $('#addUserButton').text('Salvar edição').off('click').on('click', function() {
        salvarEdicao(usuario);
        alert('Usuário editado com sucesso!');
        location.reload();
        listarUsuarios(); // atualiza a lista de usuários na interface
    });
}

// função para salvar a edição do usuário
function salvarEdicao(usuario) {
    const newUsername = $('#username').val();
    const newPassword = $('#password').val();
    const newEmail = $('#email').val();
    const newPermission = $('#permission').val();

    // envia uma solicitação ao servidor para atualizar os detalhes do usuário
    $.ajax({
        url: `/edit-user/${usuario}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ usuario: usuario, newUsername: newUsername, newPassword: newPassword, newEmail: newEmail, newPermission: newPermission }),
        success: function(response) {
            // limpa os campos do formulário após a edição ser salva com sucesso
            $('#username').val('');
            $('#password').val('');
            $('#email').val('');
            $('#permission').val('user');
            $('#addUserButton').text('Adicionar').off('click').on('click'); // restaura o botão "Adicionar"
        },
        error: function(error) {
            console.error('Erro ao salvar edição:', error);
            alert('Erro ao salvar edição. Por favor, tente novamente.');
        }
    });
}