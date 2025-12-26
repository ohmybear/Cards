// KONFIGURACJA
const AVAILABLE_DECKS = {
    "Myśl jak każdy!": "mysl_jak_kazdy.json",
    "Myśl jak każdy! (bez jokerów)": "mysl_jak_kazdy_bez_jokerow.json" ,
    "Myśl jak każdy! (jokery)": "mysl_jak_kazdy_jokery.json" ,
    // Dodaj tu swoje talie
};

class CardDeck {
    constructor(panelId) {
        this.panel = document.getElementById(panelId);
        
        // 1. Przypisanie elementów HTML (TO MUSI ZOSTAĆ!)
        this.deckSelect = this.panel.querySelector('.deck-select');
        this.replacementToggle = this.panel.querySelector('.replacement-toggle');
        this.animToggle = this.panel.querySelector('.anim-toggle');
        this.cardArea = this.panel.querySelector('.card-area');
        this.statusDisplay = this.panel.querySelector('.deck-status');
        
        // Przyciski nawigacji
        this.prevBtn = this.panel.querySelector('.prev-btn');
        this.nextBtn = this.panel.querySelector('.next-btn');

        // 2. Zmienne stanu
        this.originalCards = [];
        this.currentCards = [];
        this.history = []; 
        this.historyIndex = -1;
        this.isAnimating = false;

        // 3. Generowanie listy talii z globalnej zmiennej
        this.deckSelect.innerHTML = '<option value="" disabled selected>Wybierz talię...</option>';

        // Pętla pobiera dane z AVAILABLE_DECKS z góry pliku
        for (const [name, filename] of Object.entries(AVAILABLE_DECKS)) {
            const option = document.createElement('option');
            option.value = filename;
            option.textContent = name;
            this.deckSelect.appendChild(option);
        }
        
        // 4. Uruchomienie
        this.init();
    }

    init() {
        // ... (stare listenery) ...
        this.deckSelect.addEventListener('change', (e) => this.loadDeck(e.target.value));
        this.cardArea.addEventListener('click', () => this.drawCard());
        this.replacementToggle.addEventListener('change', () => this.resetDeckState());
        
        // NOWE: Listenery do przycisków
        this.prevBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Żeby kliknięcie nie wywołało losowania karty
            this.navigate(-1);
        });
        
        this.nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigate(1);
        });
    }

    async loadDeck(filename) {
        try {
            const response = await fetch(`./decks/${filename}`);
            if (!response.ok) throw new Error("Błąd");
            
            const data = await response.json();
            this.originalCards = data;
            this.resetDeckState();
            
            this.cardArea.innerHTML = '<div class="card-placeholder">Talia gotowa.<br>Kliknij, aby losować!</div>';
        } catch (error) {
            console.error(error);
            this.cardArea.innerHTML = '<div class="card-placeholder" style="color: #e74c3c">Błąd pliku!</div>';
        }
    }

    resetDeckState() {
        this.currentCards = [...this.originalCards];
        
        // NOWE: Reset historii
        this.history = [];
        this.historyIndex = -1;
        this.updateNavButtons();
        
        this.updateStatus();
    }

drawCard() {
        // Blokada jeśli trwa animacja
        if (this.isAnimating) return;
        
        // Sprawdzenie czy są karty
        if (this.currentCards.length === 0) {
            this.cardArea.innerHTML = '<div class="card-placeholder">Koniec talii!<br>Zresetuj lub zmień opcje.</div>';
            return;
        }
        
        // --- TU BRAKOWAŁO TEJ LINII ---
        // Losujemy liczbę od 0 do liczby kart w talii
        const randomIndex = Math.floor(Math.random() * this.currentCards.length);
        // ------------------------------
        
        const drawnCard = this.currentCards[randomIndex];

        // Jeśli tryb bez zwracania, usuwamy kartę z puli
        if (!this.replacementToggle.checked) {
            this.currentCards.splice(randomIndex, 1);
        }

        // --- LOGIKA HISTORII ---
        
        // 1. Jeśli cofnęliśmy się w historii, ucinamy "przyszłość"
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        // 2. Dodajemy nową kartę na koniec
        this.history.push(drawnCard);
        this.historyIndex = this.history.length - 1;

        // 3. Aktualizujemy przyciski
        this.updateNavButtons();

        // -----------------------

        // Wyświetlanie (z animacją lub bez)
        if (this.animToggle.checked) {
            this.playLongAnimation(drawnCard);
        } else {
            this.renderCard(drawnCard, 'animate-flip');
        }

        this.updateStatus();
    }
    // Funkcja obsługująca przyciski Wstecz (-1) i Dalej (+1)
    navigate(direction) {
        const newIndex = this.historyIndex + direction;

        // Zabezpieczenie przed wyjściem poza zakres
        if (newIndex >= 0 && newIndex < this.history.length) {
            this.historyIndex = newIndex;
            const cardToShow = this.history[this.historyIndex];
            
            // Renderujemy kartę (bez długiej animacji tasowania, bo to tylko podgląd)
            this.renderCard(cardToShow, 'animate-flip');
            this.updateNavButtons();
        }
    }

    // Funkcja włączająca/wyłączająca przyciski
    updateNavButtons() {
        // Przycisk Wstecz aktywny tylko, jeśli index > 0
        this.prevBtn.disabled = this.historyIndex <= 0;
        
        // Przycisk Dalej aktywny tylko, jeśli nie jesteśmy na końcu historii
        this.nextBtn.disabled = this.historyIndex >= this.history.length - 1;
    }

    playLongAnimation(cardData) {
        this.isAnimating = true;

        // 1. Pokaż "rewers" karty i uruchom trzęsienie
        this.cardArea.innerHTML = '<div class="card animate-shuffle"></div>';

        // 2. Po zakończeniu animacji (800ms zgodnie z CSS) pokaż wynik
        setTimeout(() => {
            this.renderCard(cardData, 'animate-flip');
            this.isAnimating = false;
        }, 800);
    }

renderCard(cardData, animationClass) {
        this.cardArea.innerHTML = '';

        const cardEl = document.createElement('div');
        cardEl.classList.add('card');
        
        if (animationClass) cardEl.classList.add(animationClass);
        
        // Atrybuty treści i wyglądu
        cardEl.textContent = cardData.content;
        
        if (cardData.backgroundColor) {
            cardEl.style.setProperty('--card-bg', cardData.backgroundColor || '#fff');
            //cardEl.style.backgroundColor = cardData.backgroundColor;
            // Opcjonalne: automatyczny kolor ramki dla bardzo ciemnych kart
            if (['#000000', 'black', '#000'].includes(cardData.backgroundColor)) {
                cardEl.style.borderColor = '#333';
            }
        }

        if (cardData.textColor) {
            cardEl.style.color = cardData.textColor;
        }

        // Najpierw dodajemy kartę do DOM (żeby przeglądarka mogła obliczyć jej wymiary)
        this.cardArea.appendChild(cardEl);

        // TERAZ dopasowujemy tekst (wywołujemy nową funkcję)
        this.fitText(cardEl);
    }

    // Nowa funkcja do skalowania tekstu
    fitText(element) {
        let fontSize = 1.6; // Startowy rozmiar (taki sam jak w CSS)
        const minSize = 0.8; // Minimalny rozmiar, poniżej którego nie schodzimy
        const step = 0.1;   // O ile zmniejszamy w każdym kroku

        // Resetujemy rozmiar na sztywno przed obliczeniami
        element.style.fontSize = `${fontSize}rem`;

        // Pętla: dopóki tekst jest wyższy niż karta (scrollHeight > clientHeight)
        // LUB szerszy niż karta (scrollWidth > clientWidth)
        // I dopóki nie osiągnęliśmy rozmiaru minimalnego...
        while (
            (element.scrollHeight > element.clientHeight || 
             element.scrollWidth > element.clientWidth) && 
            fontSize > minSize
        ) {
            fontSize -= step;
            element.style.fontSize = `${fontSize}rem`;
        }
    }

    updateStatus() {
        this.statusDisplay.textContent = `Pozostało: ${this.currentCards.length} / ${this.originalCards.length}`;
    }
}

// Inicjalizacja
const panel1 = new CardDeck('panel-1');
const panel2 = new CardDeck('panel-2');

const toggleBtn = document.getElementById('toggle-split-btn');
const panel2El = document.getElementById('panel-2');
const appContainer = document.getElementById('app-container');

toggleBtn.addEventListener('click', () => {
    panel2El.classList.toggle('hidden');
    appContainer.classList.toggle('split-view');
    appContainer.classList.toggle('single-view'); // opcjonalne klasy do CSS jeśli potrzebne
});
