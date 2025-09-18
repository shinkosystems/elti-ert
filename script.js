// 1. Configurar o cliente Supabase - Use suas chaves e URL reais
const supabaseUrl = 'https://qazjyzqptdcnuezllbpr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhemp5enFwdGRjbnVlemxsYnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NDEyMDY4NTQsImV4cCI6MjA2NDEyMDY4NTQxMjE1Mn0.H6v1HUH-LkHDH-WaaLQyN8GMeNLk0V27VJzHuXHin9M';
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// Referência ao elemento do editor
const editor = document.getElementById('editor');

// --- LÓGICA DO HINT TEXT ---
editor.addEventListener('focus', () => {
    if (editor.textContent.trim() === 'Digite aqui') {
        editor.textContent = '';
    }
});

editor.addEventListener('blur', () => {
    if (editor.textContent.trim() === '') {
        editor.textContent = 'Digite aqui';
    }
});

// Funções para manipulação de texto
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
    editor.innerHTML = '<p>Digite aqui</p>';
}

// NOVO: Função para obter parâmetros da URL
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

const lessonId = getUrlParameter('lesson_id');

// --- LÓGICA DE SALVAR O HTML (AGORA COM UPDATE) ---
document.getElementById('saveHtmlButton').addEventListener('click', async () => {
    if (!lessonId) {
        alert("Erro: ID da aula não encontrado. Certifique-se de que a aula foi criada primeiro.");
        return;
    }

    const fullContent = editor.innerHTML;

    if (fullContent.trim() === '<p>Digite aqui</p>' || fullContent.trim() === 'Digite aqui') {
        alert("O editor está vazio. Digite algum conteúdo para salvar.");
        return;
    }

    const { data, error } = await supabase
        .from('aulaplus')
        .update({
            grammarphtml: fullContent
        })
        .eq('id', lessonId); // Atualiza a linha com o ID correspondente

    if (error) {
        console.error('Erro ao salvar o HTML no Supabase:', error.message);
        alert('Ocorreu um erro ao salvar o HTML.');
    } else {
        console.log('HTML salvo com sucesso:', data);
        alert('O conteúdo da aula foi salvo com sucesso!');
        clearEditor();
    }
});

// --- LÓGICA DE SALVAR PALAVRAS E SIGNIFICADOS ---
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