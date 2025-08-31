// Referências aos elementos da página
const descricaoSearch = document.getElementById('descricao-search');
const statusSearch = document.getElementById('status-search');
const formTask = document.getElementById('form-task');
const formTaskFields = formTask.querySelectorAll('input, select, textarea');
const modal = new bootstrap.Modal(document.getElementById('exampleModal'));
const buttonOpenModal = document.getElementById('btn-modal');

// Lista de tarefas
let tarefas = [];

// Lista de prioridades
const prioridadesList = {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta'
};

// Cores para cada prioridade
const prioridadesColors = {
    baixa: '#007c08',
    media: '#dd9100',
    alta: '#d30000'
};

// Formata a data e verifica se está atrasada
const formatDateAndIsAtrasada = (dateStr) => {
    const date = new Date(`${dateStr} 00:00`);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return [`${d}/${m}/${y}`, (date - new Date()) < 0];
};

// Salva tarefas no LocalStorage
const backupTasks = () => {
    localStorage.setItem('tasks', JSON.stringify(tarefas));
};

// Carrega tarefas do LocalStorage
const loadTasks = () => {
    let tasksStr = localStorage.getItem('tasks');
    tarefas = JSON.parse(tasksStr) || [];
};

// Filtra a lista, deixando apenas os registros que contém em seu titulo a descrição buscada
const getFilteredTasks = (tasks) => {
    return tasks.filter((t) => {
        return t.titulo.trim().toLowerCase().includes(descricaoSearch.value.trim().toLowerCase()) &&
            (statusSearch.value === '' || t.concluida === (statusSearch.value === 'concluidas'));
    });
}

// Ordena a lista por ordem de vencimento crescente
const getOrdenedTasks = (tasks) => {
    return tasks.sort((a, b) => {
        let dateA = new Date(`${a.data_vencimento} 00:00`);
        let dateB = new Date(`${b.data_vencimento} 00:00`);
        return dateA - dateB;
    });
}

// Renderiza a lista de tarefas na tela
const renderTasks = () => {
    backupTasks();

    // Filtra a lista, deixando apenas os registros que contém em seu titulo a descrição buscada
    let filteredTasks = getFilteredTasks(tarefas);

    // Ordena a lista por ordem de vencimento crescente
    let ordenedTask = getOrdenedTasks(filteredTasks);

    const taskContainer = document.getElementById('tasks-container');
    taskContainer.innerHTML = '';
    
    // Percorre a lista de tarefas, renderizando os elementos que cada tarefa tem
    ordenedTask.forEach((tarefa) => {
        const [dataVencimentoFormatada, isAtrasado] = formatDateAndIsAtrasada(tarefa.data_vencimento);
        
        const taskDiv = document.createElement('div');
        taskDiv.className = 'd-flex task mb-3' + (tarefa.concluida ? ' concluida' : '');

        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'd-flex ms-4 me-4';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = tarefa.concluida;
        checkbox.addEventListener('change', (e) => {
            tarefa.concluida = e.target.checked;
            renderTasks();
        });

        const contentDiv = document.createElement('div');
        contentDiv.style.width = '80%';

        const title = document.createElement('p');
        title.className = 'fw-bold task-title';
        title.textContent = tarefa.titulo;

        const prioridade = document.createElement('p');
        // Define cor do texto da prioridade
        const colorPrioridade = tarefa.concluida ? 'black' : prioridadesColors[tarefa.prioridade];

        //Define cor do texto da data de vencimento
        const colorData = isAtrasado && !tarefa.concluida ? prioridadesColors['alta'] : 'black';
        prioridade.className = 'task-priority';
        prioridade.innerHTML = `<span style="color: ${colorPrioridade}">Prioridade ${prioridadesList[tarefa.prioridade]}</span> - Vencimento: <span style="color: ${colorData}">${dataVencimentoFormatada}</span>`;

        const divActions = document.createElement('div');
        divActions.className = 'd-flex align-items-center';

        const buttonEdit = document.createElement('button');
        buttonEdit.className = 'btn';
        buttonEdit.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
        buttonEdit.addEventListener('click', () => {
            openForm(tarefa);
        });

        const buttonRemove = document.createElement('button');
        buttonRemove.className = 'btn';
        buttonRemove.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        buttonRemove.addEventListener('click', () => {
            let index = tarefas.indexOf(tarefa);
            tarefas.splice(index, 1);
            renderTasks();
        });

        // Adiciona elementos em seus respectivos pais
        checkboxDiv.appendChild(checkbox);
        contentDiv.appendChild(title);
        contentDiv.appendChild(prioridade);
        divActions.appendChild(buttonEdit);
        divActions.appendChild(buttonRemove);

        taskDiv.appendChild(checkboxDiv);
        taskDiv.appendChild(contentDiv);
        taskDiv.appendChild(divActions);
        taskContainer.appendChild(taskDiv);
    });
};

// Limpa o formulário
const clearForm = () => {
    formTask.classList.remove('was-validated');
    formTaskFields.forEach((field) => {
        field.value = '';
    });
};

// Fecha o formulário
const closeForm = () => {
    clearForm();
    modal.hide();
};

// Abre o formulário (edição ou criação)
const openForm = (tarefa = null) => {
    // Se tarefa não for nula, preenche o formulário com os dados da tarefa que se está editandp
    if (tarefa) {
        const index = tarefas.indexOf(tarefa);
        const tarefaIndexada = { ...tarefa, index };

        formTaskFields.forEach((field) => {
            field.value = tarefaIndexada[field.name];
        });
    }
    modal.show();
};

// Salva a tarefa
const saveTask = () => {
    let data = {};
    let valid = true;

    formTaskFields.forEach((field) => {
        // Verifica se o campo é obrigatório e está vazio
        if (field.required && field.value === '') {
            formTask.classList.add('was-validated');
            valid = false;
            return;
        }
        data[field.name] = field.value;
    });

    // Se for falso, retorna, para parar a execução do salvamento
    if (!valid) return;

    // Verifica em qual index serão guardados os dados
    let index = data.index !== '' ? data.index : tarefas.length;
    
    // Adiciona os dados na lista
    tarefas[index] = {
        ...data,
        concluida: tarefas[index]?.concluida ?? false,
    };

    // Limpa o formulário
    closeForm();

    // Renderiza a lista de tarefas novamente
    renderTasks();
};

// Preenche o select de prioridades
for (prioridade in prioridadesList) {
    const selectPrioridade = document.getElementById('prioridade');
    const opt = document.createElement('option');
    opt.text = prioridadesList[prioridade];
    opt.value = prioridade;
    selectPrioridade.appendChild(opt);
}

// Eventos
descricaoSearch.addEventListener('input', renderTasks);
statusSearch.addEventListener('change', renderTasks);
document.getElementById('save-modal').addEventListener('click', saveTask);
buttonOpenModal.addEventListener('click', () => openForm());
document.querySelectorAll('.close-modal').forEach(el => el.addEventListener('click', closeForm));

// Inicialização
loadTasks();
// Renderiza lista de tarefas
renderTasks();
