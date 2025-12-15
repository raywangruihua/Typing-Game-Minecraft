const workersDomain = "typing-game-leaderboard-worker.raywangruihua.workers.dev";

async function init() {
    const quotes = await readTextfile("text/quotes/minecraft-end-poem.txt");
    let words = [];
    let numWords = 0;
    let wordIndex = 0;
    let startTime = Date.now();

    let statusElement = document.getElementById("status");
    const quoteElement = document.getElementById("quote");
    const messageElement = document.getElementById("message");
    let nameElement = document.getElementById("name");
    const dialogElement = document.getElementById("dialog");
    const typedValueElement = document.getElementById("typed-value");

    statusElement.innerHTML = await randomStatus();
    nameElement.value = localStorage.getItem("name");

    loadLeaderboard();

    document.getElementById("start").addEventListener("click", startGame);

    async function randomStatus() {
        const statusIndex = Math.floor(Math.random() * 373);
        const statuses = await readTextfile("text/splash/splashes.txt");
        return statuses[statusIndex];
    }

    function startGame() {
        const quoteIndex = Math.floor(Math.random() * quotes.length);
        const quote = quotes[quoteIndex];

        words = quote.split(" ");
        numWords = words.length;
        wordIndex = 0;

        const spanWords = words.map(function(word) { return `<span>${word} </span>`});
        quoteElement.innerHTML = spanWords.join("");
        quoteElement.childNodes[0].className = "highlight";
        messageElement.innerText = "";

        typedValueElement.value = "";
        typedValueElement.disabled = false;
        typedValueElement.addEventListener("input", handleType);
        typedValueElement.focus();

        startTime = new Date().getTime();
    }

    function handleType() {
        const currentWord = words[wordIndex];
        const typedValue = typedValueElement.value;

        if (typedValue === currentWord && wordIndex === words.length - 1) {
            endGame();
        } else if (typedValue.endsWith(" ") && typedValue.trim() === currentWord) {
            // highlight next word
            typedValueElement.value = "";
            wordIndex++;
            quoteElement.childNodes[wordIndex-1].className = "";
            quoteElement.childNodes[wordIndex].className = "highlight";
        } else if (currentWord.startsWith(typedValue)) {
            // don't do anything if typed correctly so far
            typedValueElement.className = "";
        } else {
            // highlight error if typed wrongly
            typedValueElement.className = "error";
        }
    }

    function endGame() {
        // get elapsed time in seconds
        const elapsedTime = (new Date().getTime() - startTime) / 1000;

        // disable type input until new game
        typedValueElement.disabled = true;
        typedValueElement.removeEventListener("input", handleType);

        // score submission
        dialogElement.open = true;
        document.getElementById("success").innerText = `Congratulations! You finished in ${elapsedTime} seconds.`;
        nameElement.value = localStorage.getItem("name");
        document.getElementById("submit").addEventListener("click", () => {
            localStorage.setItem("name", nameElement.value);
            submitScore();
            dialogElement.open = false;
        });



        async function submitScore() {
            let name = localStorage.getItem("name");
            let wpm = numWords / (elapsedTime / 60);
            const result = await fetch(`https://${workersDomain}/score`, {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({ name, wpm, elapsedTime })
            });
            if (!result.ok) throw new Error("Score submit failed");

            loadLeaderboard();
        }
    }
}

async function readTextfile(url) {
    const result = await fetch(url);
    if (!result.ok) throw new Error(`Failed to fetch ${url}: ${result.status}`);

    const text = await result.text();
    return text.split(/\r?\n/);
}

async function loadLeaderboard() {
    const result = await fetch(`https://${workersDomain}/leaderboard?limit=5`);
    if (!result.ok) throw new Error("Failed to load leaderboard");
    const scores = await result.json();

    renderLeaderboard(scores);
}

function renderLeaderboard(scores) {
    const ol = document.getElementById("leaderboard");
    ol.innerHTML = "";

    for (const s of scores) {
        const li = document.createElement("li");
        li.textContent = `${s.name} | WPM: ${s.wpm} | Time: ${s.time}`;
        ol.appendChild(li);
    }
}

init().catch(console.error);