// KONFIGURACJA
const AVAILABLE_DECKS = [
    { name: "Myśl jak każdy!", file: "mysl_jak_kazdy.json" },
    { name: "Myśl jak każdy! (bez jokerów)", file: "mysl_jak_kazdy_bez_jokerow.json" },
    { name: "Myśl jak każdy! (jokery)", file: "mysl_jak_kazdy_jokery.json" },
    // Dodaj tu swoje talie
];

class CardDeck {
    constructor(panelId) {
        this.panel = document.getElementById(panelId);
        this.deckSelect = this.panel.querySelector('.deck-select');
        this.replacementToggle = this.panel.querySelector('.replacement-toggle');
        this.animToggle = this.panel.querySelector('.anim-toggle'); // Nowy checkbox
        this.cardArea = this.panel.querySelector('.card-area');
        this.statusDisplay = this.panel.querySelector('.deck-status');
        
        this.originalCards = [];
        this.currentCards = [];
        this.isAnimating = false; // Blokada klikania
        
        this.init();
    }

    init() {
        AVAILABLE_DECKS.forEach(deck => {
            const option = document.createElement('option');
            option.value = deck.file;
            option.textContent = deck.name;
            this.deckSelect.appendChild(option);
        });

        this.deckSelect.addEventListener('change', (e) => this.loadDeck(e.target.value));
        this.cardArea.addEventListener('click', () => this.drawCard());
        this.replacementToggle.addEventListener('change', () => this.resetDeckState());
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
        this.updateStatus();
    }

    drawCard() {
        // Zabezpieczenie przed klikaniem w trakcie animacji
        if (this.isAnimating) return;
        
        if (this.currentCards.length === 0) {
            if (this.originalCards.length === 0) return;
            
            this.cardArea.innerHTML = `
                <div class="card" style="background-color: #f1f2f6; color: #95a5a6;">
                    Koniec kart!<br>Kliknij, aby przetasować.
                </div>`;
            this.currentCards = [...this.originalCards];
            return;
        }

        const randomIndex = Math.floor(Math.random() * this.currentCards.length);
        const drawnCard = this.currentCards[randomIndex];

        if (!this.replacementToggle.checked) {
            this.currentCards.splice(randomIndex, 1);
        }

        // Sprawdź czy użytkownik chce długą animację
        if (this.animToggle.checked) {
            this.playLongAnimation(drawnCard);
        } else {
            this.renderCard(drawnCard, 'animate-flip');
        }

        this.updateStatus();
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
            cardEl.style.backgroundColor = cardData.backgroundColor;
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