let wordsMaster = [];
let shuffledWords = [];
let userAnswers = {};
let answerStatus = {};
let currentFilterLessons = new Set();
let favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
let currentQuestionIndex = 0;
let showFavoritesOnly = false;

const escapeHtml = (str) => {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

const shuffleArray = (arr) => {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

function updateShuffledList() {
    let filtered = wordsMaster.filter(word => currentFilterLessons.has(word.lesson));
    shuffledWords = shuffleArray(filtered);
}

function getCurrentWords() {
    if (!showFavoritesOnly) return shuffledWords;
    return shuffledWords.filter(word => favorites[word.uid]);
}

function renderLessonCheckboxes(lessons) {
    const container = document.getElementById('lessonCheckboxes');
    container.innerHTML = '';
    lessons.forEach(lesson => {
        const label = document.createElement('label');
        label.className = 'flex items-center gap-2 cursor-pointer group';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'custom-checkbox';
        checkbox.checked = true;
        checkbox.value = lesson;
        
        checkbox.addEventListener('change', e => {
            if (e.target.checked) currentFilterLessons.add(lesson);
            else currentFilterLessons.delete(lesson);
            updateShuffledList();
            currentQuestionIndex = 0;
            renderCards();
        });

        const span = document.createElement('span');
        span.className = 'text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors';
        span.textContent = `課程 ${lesson}`;

        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
    });
}

function renderCards() {
    const container = document.getElementById('cardsContainer');
    const words = getCurrentWords();
    const counterEl = document.getElementById('wordCounter');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');

    if (words.length === 0) {
        counterEl.textContent = '0 / 0';
        progressFill.style.width = '0%';
        progressPercent.textContent = '0%';
        container.innerHTML = `
            <div class="glass-card rounded-3xl p-12 text-center shadow-sm">
                <div class="text-4xl mb-4">Empty</div>
                <p class="text-slate-500">${showFavoritesOnly ? '目前沒有收藏的單字喔！' : '請至少選擇一個課程進行練習。'}</p>
            </div>
        `;
        return;
    }

    if (currentQuestionIndex >= words.length) currentQuestionIndex = 0;

    const progress = ((currentQuestionIndex + 1) / words.length) * 100;
    counterEl.textContent = `第 ${currentQuestionIndex + 1} / ${words.length} 題`;
    progressFill.style.width = `${progress}%`;
    progressPercent.textContent = `${Math.round(progress)}%`;

    const word = words[currentQuestionIndex];
    const uid = word.uid;
    const isFav = favorites[uid];
    const status = answerStatus[uid];

    const displaySentence = (word.sentence || '').replace(
        /([a-zA-Z]*_{3,}[a-zA-Z]*)/g, 
        match => `<span class="blank-highlight">${match}</span>`
    );

    container.innerHTML = `
        <div class="word-card glass-card rounded-3xl p-8 shadow-xl relative overflow-hidden">
            
            <button id="favoriteBtn" class="absolute top-6 right-6 text-2xl transition-transform active:scale-125 ${isFav ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-200'}">
                ${isFav ? '★' : '☆'}
            </button>

            <div class="mb-4">
                <span class="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Lesson ${word.lesson}
                </span>
            </div>

            <div class="sentence text-xl md:text-2xl font-medium text-slate-800 leading-relaxed mb-8">
                ${displaySentence}
            </div>

            <div class="space-y-4">
                <div class="flex flex-col md:flex-row gap-3">
                    <input 
                        type="text" 
                        id="answerInput" 
                        class="flex-1 px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-lg font-semibold"
                        placeholder="在此輸入答案..."
                        value="${escapeHtml(userAnswers[uid] || '')}"
                        autocomplete="off"
                    >
                    <button id="checkBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95">
                        檢查
                    </button>
                </div>

                <div class="flex items-center justify-between">
                    <div id="feedback" class="text-sm font-bold flex items-center gap-2 ${status === 'correct' ? 'text-emerald-500' : status === 'incorrect' ? 'text-red-500' : 'text-slate-400'}">
                        ${status === 'correct' ? '<span>✓</span> 太棒了！回答正確' : status === 'incorrect' ? '<span>✕</span> 再試一次，加油！' : '<span>✎</span> 請輸入單字'}
                    </div>
                    <button id="showAnswerBtn" class="text-xs font-semibold text-slate-400 hover:text-slate-600 underline decoration-dotted">
                        偷看答案
                    </button>
                </div>
            </div>

            <!-- Navigation -->
            <div class="flex justify-between mt-10 pt-6 border-t border-slate-50">
                <button id="prevBtn" class="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold transition-colors ${currentQuestionIndex === 0 ? 'opacity-0 pointer-events-none' : ''}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    上一題
                </button>
                <button id="nextBtn" class="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold transition-colors">
                    ${currentQuestionIndex === words.length - 1 ? '從頭開始' : '下一題'}
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
            </div>
        </div>
    `;

    const input = document.getElementById('answerInput');
    input.focus();
    
    input.addEventListener('input', e => {
        userAnswers[uid] = e.target.value;
        answerStatus[uid] = null;
    });

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('checkBtn').click();
    });

    document.getElementById('checkBtn').onclick = () => {
        const isCorrect = input.value.trim().toLowerCase() === word.answer.trim().toLowerCase();
        answerStatus[uid] = isCorrect ? 'correct' : 'incorrect';
        renderCards();
    };

    document.getElementById('showAnswerBtn').onclick = () => {
        input.value = word.answer;
        userAnswers[uid] = word.answer;
        input.focus();
    };

    document.getElementById('favoriteBtn').onclick = () => {
        favorites[uid] = !favorites[uid];
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderCards();
    };

    document.getElementById('prevBtn').onclick = () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderCards();
        }
    };

    document.getElementById('nextBtn').onclick = () => {
        if (currentQuestionIndex < words.length - 1) {
            currentQuestionIndex++;
        } else {
            currentQuestionIndex = 0;
        }
        renderCards();
    };
}

async function init() {
    try {
        const response = await fetch('word.json');
        if (!response.ok) throw new Error('File not found');
        const data = await response.json();
        wordsMaster = data.map((word, index) => ({
            ...word,
            uid: `word_${index}`,
            sentence: word.sentence || ''
        }));
    } catch (err) {
        console.warn("無法讀取 word.json，載入範例資料中...");
        // 範例模擬資料
        wordsMaster = [
            { lesson: "1", answer: "apple", sentence: "I eat an _____ every morning.", uid: "w1" },
            { lesson: "1", answer: "banana", sentence: "The monkey is peeling a _____.", uid: "w2" },
            { lesson: "2", answer: "cat", sentence: "The _____ is sleeping on the mat.", uid: "w3" },
            { lesson: "2", answer: "dog", sentence: "My _____ loves to bark at mailmen.", uid: "w4" }
        ];
    }

    const lessons = [...new Set(wordsMaster.map(w => w.lesson))].sort((a,b) => a-b);
    lessons.forEach(l => currentFilterLessons.add(l));

    renderLessonCheckboxes(lessons);
    updateShuffledList();
    renderCards();
}

// 全域控制按鈕
document.getElementById('shuffleBtn').onclick = () => {
    updateShuffledList();
    currentQuestionIndex = 0;
    renderCards();
};

document.getElementById('favoriteViewBtn').onclick = () => {
    showFavoritesOnly = !showFavoritesOnly;
    currentQuestionIndex = 0;
    document.getElementById('favText').textContent = showFavoritesOnly ? '全部模式' : '收藏模式';
    document.getElementById('favIcon').textContent = showFavoritesOnly ? '★' : '☆';
    document.getElementById('favoriteViewBtn').classList.toggle('bg-yellow-50', showFavoritesOnly);
    renderCards();
};

document.getElementById('resetAllBtn').onclick = () => {
    if(confirm("確定要重設所有輸入嗎？")) {
        userAnswers = {};
        answerStatus = {};
        renderCards();
    }
};

init();