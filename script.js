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
    // Nota: O editor.innerHTML é usado aqui porque o Supabase pode retornar texto
    // que foi originalmente salvo como HTML (ou puro).
    if (!lessonId) {
        editor.innerHTML = '<p>Digite aqui...</p>';
        return;
    }

    const { data, error } = await supabase
        .from('aulaplus')
        .select('readingphtml')
        .eq('id', lessonId)
        .single();

    if (error) {
        console.error('Erro ao carregar o conteúdo inicial:', error.message);
        editor.innerHTML = '<p>Erro ao carregar o conteúdo. Digite aqui...</p>';
    } else if (data && data.readingphtml) {
        // Se a coluna tiver valor, exibe o conteúdo.
        // Se você estava salvando HTML, use innerHTML. Se agora for salvar SÓ texto
        // você pode precisar ajustar como o FlutterFlow/APP interpreta este campo.
        editor.innerHTML = data.readingphtml; 
    } else {
        editor.innerHTML = '<p>Digite aqui...</p>';
    }
}

// Executa a função de carregamento ao iniciar o script
document.addEventListener('DOMContentLoaded', loadInitialContent);


// --- LÓGICA DO HINT TEXT (AJUSTADA PARA FUNCIONAR COM O SALVAMENTO DE TEXTO PURO) ---
const HINT_HTML = '<p>Digite aqui...</p>';
const HINT_TEXT_PURA = 'Digite aqui...';

editor.addEventListener('focus', () => {
    // Verifica o innerHTML e o innerText para cobrir diferentes estados
    if (editor.innerHTML.trim() === HINT_HTML || editor.innerText.trim() === HINT_TEXT_PURA) {
        editor.innerHTML = '';
    }
});

editor.addEventListener('blur', () => {
    // Se estiver vazio (sem tags ou texto)
    if (editor.innerHTML.trim() === '' || editor.innerHTML.trim() === '<p></p>') {
        editor.innerHTML = HINT_HTML;
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
    editor.innerHTML = HINT_HTML;
}


// =========================================================
// --- LÓGICA DE SALVAR O HTML (AGORA SALVA APENAS TEXTO PURO) ---
// =========================================================
document.getElementById('saveHtmlButton').addEventListener('click', async () => {
    if (!lessonId) {
        alert("Erro: ID da aula não encontrado. O conteúdo não pode ser salvo.");
        return;
    }

    // *** MUDANÇA CRÍTICA: PEGANDO O TEXTO PURO ***
    const fullContent = editor.innerText.trim();
    const hintText = HINT_TEXT_PURA;

    // Condição para evitar salvar o hint text
    if (fullContent === hintText) {
        alert("O editor está vazio. Digite algum conteúdo para salvar.");
        return;
    }

    const { data, error } = await supabase
        .from('aulaplus')
        .update({
            // Salva a string de texto puro (sem tags)
            readingphtml: fullContent 
        })
        .eq('id', lessonId); 

    if (error) {
        console.error('Erro ao salvar o texto puro no Supabase:', error.message);
        alert('Ocorreu um erro ao salvar o texto.');
    } else {
        console.log('Texto puro salvo com sucesso:', data);
        alert('O conteúdo da aula foi salvo com sucesso!');
    }
});

// --- LÓGICA DE SALVAR PALAVRAS E SIGNIFICADOS (MANTIDA) ---
document.getElementById('saveMemoryHackButton').addEventListener('click', async () => {
    const rawText = editor.innerText;
    const extractedUnderlines = findUnderlinedText(rawText);
    const extractedAsterisks = findAsteriskText(rawText);
    // ... (restante da sua lógica, que já usa innerText)
    // ...

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


// =========================================================
// --- LÓGICA PARA LIMPAR TEXTO COLADO (MANTIDA) ---
// =========================================================
editor.addEventListener('paste', function (e) {
    // 1. Previne a ação de colagem padrão do navegador (que insere a formatação)
    e.preventDefault();

    // 2. Obtém o conteúdo de texto puro da área de transferência
    const text = (e.clipboardData || window.clipboardData)
        .getData('text/plain');

    // 3. Insere o texto puro na posição atual do cursor
    document.execCommand('insertText', false, text);
});

// Nota: O bloco keydown para o Enter foi removido, pois o foco agora é
// salvar o texto puro (innerText), o que elimina tags de qualquer forma.