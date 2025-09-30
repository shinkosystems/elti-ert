// 1. Configurar o cliente Supabase - Use suas chaves e URL reais
const supabaseUrl = 'https://qazjyzqptdcnuezllbpr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhemp5enFwdGRjbnVlemxsYnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NDY4NTQsImV4cCI6MjA2NDEyMjg1NH0.H6v1HUH-LkHDH-WaaLQyN8GMeNLk0V27VJzHuXHin9M';
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// Referência ao elemento do editor
const editor = document.getElementById('editor');

// --- FUNÇÃO CORRIGIDA: Obtém ID do Parâmetro de Consulta (?id=) ---
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    // Decodifica o valor e remove as aspas duplas, caso o FlutterFlow as inclua
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' ')).replace(/"/g, ''); 
}

// O lessonId agora é buscado usando o nome do parâmetro 'id'
const lessonId = getUrlParameter('id'); 

// DEBUG: Remova esta linha após confirmar o funcionamento
console.log("ID da Aula Recebido (Query Param 'id'):", lessonId); 


// --- FUNÇÃO DE CARREGAMENTO CONDICIONAL ---
async function loadInitialContent() {
    // Se não houver ID (null), apenas mostra o hint text.
    if (!lessonId) {
        editor.innerHTML = '<p>Digite aqui...</p>';
        return;
    }

    // Busca o valor atual de 'readingphtml' na tabela aulaplus
    const { data, error } = await supabase
        .from('aulaplus')
        .select('readingphtml')
        .eq('id', lessonId)
        .single();

    if (error) {
        console.error('Erro ao carregar o conteúdo inicial:', error.message);
        editor.innerHTML = '<p>Erro ao carregar o conteúdo. Digite aqui...</p>';
    } else if (data && data.readingphtml) {
        // Se a coluna tiver valor, exibe o conteúdo salvo.
        editor.innerHTML = data.readingphtml;
    } else {
        // Se a coluna for NULL ou vazia, exibe o hint text.
        editor.innerHTML = '<p>Digite aqui...</p>';
    }
}

// Executa a função de carregamento ao iniciar o script
document.addEventListener('DOMContentLoaded', loadInitialContent);


// --- LÓGICA DO HINT TEXT ---
editor.addEventListener('focus', () => {
    const hintText = '<p>Digite aqui...</p>';
    if (editor.innerHTML.trim() === hintText || editor.innerHTML.trim() === 'Digite aqui...') {
        editor.innerHTML = '';
    }
});

editor.addEventListener('blur', () => {
    const hintText = '<p>Digite aqui...</p>';
    if (editor.innerHTML.trim() === '' || editor.innerHTML.trim() === '<p></p>') {
        editor.innerHTML = hintText;
    }
});


// Funções auxiliares (mantidas)
function formatDoc(command, value = null) {
    if (command === 'createLink') {
        const url = prompt('Insira o URL:');
        if (url) {
            document.execCommand(command, false, url);
        }
    } else {
        document.execCommand(command, false, value);
    }
}

function findUnderlinedText(text) {
    const regex = /_([^_]+)_/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        matches.push(match[1]);
    }
    return matches;
}

function findAsteriskText(text) {
    const regex = /\*([^*]+)\*/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        matches.push(match[1]);
    }
    return matches;
}

function clearEditor() {
    editor.innerHTML = '<p>Digite aqui...</p>';
}


// --- LÓGICA DE SALVAR O HTML ---
document.getElementById('saveHtmlButton').addEventListener('click', async () => {
    if (!lessonId) {
        alert("Erro: ID da aula não encontrado. O conteúdo não pode ser salvo.");
        return;
    }

    const fullContent = editor.innerHTML;
    const hintText = '<p>Digite aqui...</p>';

    // Condição para evitar salvar o hint text
    if (fullContent.trim() === hintText || fullContent.trim() === 'Digite aqui...') {
        alert("O editor está vazio. Digite algum conteúdo para salvar.");
        return;
    }

    const { data, error } = await supabase
        .from('aulaplus')
        .update({
            readingphtml: fullContent
        })
        .eq('id', lessonId); 

    if (error) {
        console.error('Erro ao salvar o HTML no Supabase:', error.message);
        alert('Ocorreu um erro ao salvar o HTML.');
    } else {
        console.log('HTML salvo com sucesso:', data);
        alert('O conteúdo da aula foi salvo com sucesso!');
    }
});

// --- LÓGICA DE SALVAR PALAVRAS E SIGNIFICADOS (MANTIDA) ---
document.getElementById('saveMemoryHackButton').addEventListener('click', async () => {
    const rawText = editor.innerText;
    const extractedUnderlines = findUnderlinedText(rawText);
    const extractedAsterisks = findAsteriskText(rawText);

    if (extractedUnderlines.length === 0 || extractedAsterisks.length === 0) {
        alert("O texto precisa ter palavras entre underlines e asteriscos para salvar.");
        return;
    }
    if (extractedUnderlines.length !== extractedAsterisks.length) {
        alert("O número de palavras com underline e asterisco não corresponde. Verifique seu texto.");
        return;
    }

    const dataToInsert = extractedUnderlines.map((word, index) => ({
        palavra: word,
        significado: extractedAsterisks[index]
    }));

    const { data, error } = await supabase
        .from('memoryhack')
        .insert(dataToInsert);

    if (error) {
        console.error('Erro ao salvar no Supabase:', error.message);
        alert('Ocorreu um erro ao salvar o texto.');
    } else {
        console.log('Dados salvos com sucesso:', data);
        alert('As partes do texto foram salvas com sucesso!');
        clearEditor();
    }
});

function formatFontSize() {
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    const selectedSize = fontSizeSelect.value;
    document.execCommand('fontSize', false, selectedSize);
}