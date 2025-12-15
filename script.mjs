async function readQuotes(url) {
    const result = await fetch(url);
    if (!result.ok) throw new Error(`Failed to fetch ${url}: ${result.status}`);

    const text = await result.text();
    return text.split(/\r?\n/);
}

async function init() {
    const workersDomain = "typing-game-leaderboard-worker.raywangruihua.workers.dev";
    const quotes = await readQuotes("./text/minecraft-end-poem.txt");
    let words = [];
    let num;
    let wordIndex = 0;
    let startTime = Date.now();

    const quoteElement = document.getElementById("quote");
    const messageElement = document.getElementById("message");
    const nameElement = document.getElementById("name");
    const dialogElement = document.getElementById("dialog");
    const typedValueElement = document.getElementById("typed-value");

    loadLeaderboard();
    document.getElementById("start").addEventListener("click", startGame);

    async function loadLeaderboard() {
        const res = await fetch(`https://${workersDomain}/leaderboard?limit=10`);
        if (!res.ok) throw new Error("Failed to load leaderboard");
        const scores = await res.json();

        renderLeaderboard(scores);
    }

    function renderLeaderboard(scores) {
        const ol = document.getElementById("leaderboard");
        ol.innerHTML = "";

        for (const s of scores) {
            const li = document.createElement("li");
            li.textContent = `${s.name} | WPM: ${s.wpm} | Time: ${s.elapsedTime}`;
            ol.appendChild(li);
        }
    }

    function startGame() {
        const quoteIndex = Math.floor(Math.random() * quotes.length);
        const quote = quotes[quoteIndex];

        words = quote.split(" ");
        num = words.length;
        wordIndex = 0;

        const spanWords = words.map(function(word) { return `<span>${word} </span>`});
        quoteElement.innerHTML = spanWords.join("");
        quoteElement.childNodes[0].className = "highlight";
        messageElement.innerText = "";

        typedValueElement.value = "";
        typedValueElement.disabled = false;
        typedValueElement.addEventListener("input", handleTyping);
        typedValueElement.focus();

        startTime = new Date().getTime();
    }

    function handleTyping() {
        const currentWord = words[wordIndex];
        const typedValue = typedValueElement.value;

        if (typedValue === currentWord && wordIndex === words.length - 1) {
            const elapsedTime = (new Date().getTime() - startTime) / 1000;
            document.getElementById("success").innerText = `CONGRATULATIONS! You finished in ${elapsedTime} seconds.`;
            dialogElement.open = true;
            if (localStorage.getItem("name") != "") { nameElement.disabled = true; }
            typedValueElement.disabled = true;
            typedValueElement.removeEventListener("input", handleTyping);
            document.getElementById("submit").addEventListener("click", () => {
                localStorage.setItem("name", nameElement.value);
                submitScore(elapsedTime);
                dialogElement.open = false;
            });
        } else if (typedValue.endsWith(" ") && typedValue.trim() === currentWord) {
            typedValueElement.value = "";
            wordIndex++;
            for (const wordElement of quoteElement.childNodes) {
                wordElement.className = "";
            }
            quoteElement.childNodes[wordIndex].className = "highlight";
        } else if (currentWord.startsWith(typedValue)) {
            typedValueElement.className = "";
        } else {
            typedValueElement.className = "error";
        }
    }

    async function submitScore(time) {
        let name = localStorage.getItem("name");
        let wpm = num / (time / 60);
        const res = await fetch(`https://${workersDomain}/score`, {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({ name, wpm, time })
        });
        if (!res.ok) throw new Error("Score submit failed");
    }
}

init().catch(console.error);