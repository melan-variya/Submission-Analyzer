chrome.runtime.onMessage.addListener((message) => {
    // if (message.type === "problemInfo") {
        const { contestId, problemIndex } = message;

        document.getElementById("contestId").textContent = `Contest ID: ${contestId}`;
        document.getElementById("problemIndex").textContent = `Problem Index: ${problemIndex}`;
    // }
});
