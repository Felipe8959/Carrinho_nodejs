let items = [];
let total = 0;

function addItem() {
    const itemName = document.getElementById('itemName').value;
    let itemPrice = document.getElementById('itemPrice').value.replace(/\D/g, ''); // remove tudo exceto números
    itemPrice = parseFloat(itemPrice) / 100; // converte para número e divide por 100 para obter o valor em R$
    const itemQuantity = parseInt(document.getElementById('itemQuantity').value);

    if (!itemName || isNaN(itemPrice) || isNaN(itemQuantity)) {
        alert("Insira informações válidas.");
        return;
    }

    const item = {
        name: itemName,
        price: itemPrice,
        quantity: itemQuantity
    };

    items.push(item);
    renderItems();
}

function deleteItem(index) {
    items.splice(index, 1);
    renderItems();
}

function renderItems() {
    const itemList = document.getElementById('itemList');
    itemList.innerHTML = '';

    let itemCount = 0;
    total = 0;

    items.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>R$ ${item.price.toFixed(2).replace('.', ',')}</td>
            <td>${item.quantity}</td>
            <td>
                <button onclick="deleteItem(${index})" class="btn btn-danger"><i class="fas fa-trash"></i></button>
            </td>
        `;
        itemList.appendChild(row);

        total += item.price * item.quantity;
        itemCount += item.quantity;
    });

    let limit = document.getElementById('limit').value;
    // remove o R$ e outros caracteres não numéricos
    limit = parseFloat(limit.replace(/[^\d.,]/g, '').replace(',', '.'));
    const totalElement = document.getElementById('total');
    const percentage = (total / limit) * 100;

    totalElement.textContent = 'R$ ' + total.toFixed(2).replace('.', ',');

    if (total >= limit) {
        totalElement.style.color = 'red';
    } else if (percentage >= 60) {
        totalElement.style.color = 'orange';
    } else {
        totalElement.style.color = 'green';
    }

    document.getElementById('itemCount').textContent = itemCount + " un";
}

function clearItems() {
    items = [];
    renderItems();
}

function formatInput(inputId) {
    // formatação automática do preço enquanto o usuário digita
    document.getElementById(inputId).addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, ''); // remove tudo exceto números
        value = (value / 100).toFixed(2); // converte centavos em reais e limita a 2 casas decimais
        e.target.value = 'R$ ' + value.replace('.', ','); // adiciona o símbolo de moeda e substitui o ponto decimal por vírgula
    });

    // valida para garantir que apenas números e um único ponto decimal sejam inseridos
    document.getElementById(inputId).addEventListener('keypress', function(e) {
        if (e.key === '.' && e.target.value.includes('.')) {
            e.preventDefault(); // impede a inserção de mais de um ponto decimal
        }
    });
}

formatInput('itemPrice');
formatInput('limit');

document.getElementById('limit').addEventListener('input', function() {
    renderItems();
});


// Salvar informações no banco de dados
document.getElementById('salvarBtn').addEventListener('click', function() {
    const rows = document.querySelectorAll('#itemList tr');
    const limite = parseFloat(document.getElementById('limit').value.trim().replace('R$', '').replace(',', '.'));
    const itens = [];
    const ipAddress = window.location.hostname;

    rows.forEach(row => {
        const columns = row.querySelectorAll('td');
        const item = {
            produto: columns[0].textContent.trim(),
            preco: parseFloat(columns[1].textContent.trim().replace('R$', '').replace(',', '.')),
            quantidade: parseInt(columns[2].textContent.trim())
        };
        itens.push(item);
    });

    // envia os dados para o servidor
    // fetch(`http://${ipAddress}:3000/salvarItens`, {
    fetch(`/salvarItens`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itens: itens, limite: limite })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao salvar itens');
        }
        alert('Itens salvos com sucesso');
        clearItems();
    })
    .catch(error => console.log('Erro ao salvar itens:', error));
});