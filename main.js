// --- CONFIGURATION ---
const CONFIG = {
    prompt: '<span style="color:var(--green)">sudo@uteejacob:~$</span>',
    bootSpeed: 500,
    matrixSpeed: 30
};

const COMMANDS = {
    help: "Available commands: [bio] [skills] [projects] [contact] [cv] [hire] [clear]",
    bio: "NAME: Utee Jacob\nROLE: Backend [Python] Developer\nMISSION: Building secure, scalable digital ecosystems.",
    skills: "FRONTEND:          [######----] 65%\nBACKEND(Python):   [#########-] 90%\nSECURITY:          [########--] 80%\nDIGITAL MARKETING: [########--] 80%",
    projects: "1. Project_Alpha: Encrypted Messaging\n2. Cyber_Scan: Network Tool\n3. Portfolio_OS: This Terminal\n4. AI Ethics: Research and Development",
    contact: `
EMAIL:    <a href='mailto:uteejacob@gmail.com' class='term-link'>uteejacob@gmail.com</a>
WHATSAPP: <a href='https://wa.me/23055106320' target='_blank' class='term-link'>+23055106320</a>
PHONE:    <a href='tel:+2349027915935' class='term-link'>+2349027915935</a>
GITHUB:   <a href='https://github.com/Utee' target='_blank' class='term-link'>github.com/Utee</a>`,
    cv: "ACCESSING SECURE ARCHIVE... Initializing download for Utee_Jacob_CV.pdf",
    matrix: "SIGNAL OVERLOAD: Accessing the Source Code...",
    hire: "Redirecting to encrypted contact portal... Opening Mail Client."
};

// --- MATRIX BACKGROUND ---
const initMatrix = () => {
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#%&*^@";
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const rainDrops = Array.from({ length: columns }).fill(1);

    const draw = () => {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#0F0"; 
        ctx.font = fontSize + "px monospace";

        for (let i = 0; i < rainDrops.length; i++) {
            const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
            ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);
            if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) rainDrops[i] = 0;
            rainDrops[i]++;
        }
    };
    setInterval(draw, CONFIG.matrixSpeed);
};



// --- ANIMATION HELPERS ---
const showLoadingBar = (callback) => {
    let progress = 0;
    const barLength = 20;
    const barDiv = document.createElement('div');
    output.appendChild(barDiv);

    const interval = setInterval(() => {
        progress++;
        const filled = Math.round((progress / 100) * barLength);
        const empty = barLength - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        
        barDiv.innerHTML = `[${bar}] ${progress}%`;
        output.scrollTop = output.scrollHeight;

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                barDiv.innerHTML += " - COMPLETED";
                callback(); 
            }, 500);
        }
    }, 20); 
};

// --- TERMINAL ENGINE ---
const output = document.getElementById('output');
const input = document.getElementById('cmd-input');
let history = [];
let historyIndex = -1;

const printToTerminal = (text, isCommand = false) => {
    const div = document.createElement('div');
    div.innerHTML = isCommand ? `${CONFIG.prompt} ${text}` : text;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
};

const executeCommand = (cmd) => {
    const val = cmd.toLowerCase().trim();
    
    if (val === 'clear') {
        output.innerHTML = '';
        return;
    }

    if (COMMANDS[val]) {
        printToTerminal(COMMANDS[val]);
    } else {
        printToTerminal(`Command not found: ${val}. Type 'help' for available commands.`);
        return;
    }

    switch(val) {
        case 'cv':
            showLoadingBar(() => {
                const link = document.createElement('a');
                link.href = 'assets/Utee_Jacob_CV.pdf';
                link.download = 'Utee_Jacob_CV.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
            break;
            
        case 'hire':
            setTimeout(() => {
                window.location.href = "mailto:uteejacob@gmail.com?subject=Hiring Inquiry for Utee Jacob";
            }, 1000);
            break;

        case 'matrix':
    // 1. Speed up the Matrix Rain
    const originalSpeed = CONFIG.matrixSpeed;
    CONFIG.matrixSpeed = 5; 
    initMatrix(); // Re-initialize with new speed

    // 2. Add a glitch effect to the terminal via CSS
    output.style.textShadow = "2px 2px 10px #00FF41, -2px -2px 10px #ff0000";
    output.classList.add('glitch-animation');

    // 3. Reset after 5 seconds
    setTimeout(() => {
        CONFIG.matrixSpeed = 30;
        initMatrix();
        output.style.textShadow = "0 0 8px var(--green)";
        output.classList.remove('glitch-animation');
        printToTerminal("System stabilized. Reality restored.");
    }, 5000);
    break;
    }
};

// --- EVENT LISTENERS ---
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const val = input.value;
        if (val) {
            printToTerminal(val, true);
            executeCommand(val);
            history.push(val);
            historyIndex = history.length;
        }
        input.value = '';
    } else if (e.key === 'ArrowUp') {
        if (historyIndex > 0) {
            historyIndex--;
            input.value = history[historyIndex];
        }
    } else if (e.key === 'Tab') {
        e.preventDefault();
        const current = input.value.toLowerCase();
        const match = Object.keys(COMMANDS).find(c => c.startsWith(current));
        if (match) input.value = match;
    }
});

// --- INITIALIZATION ---
const boot = () => {
    initMatrix();
    const bootLines = [
        "Initializing Utee_Jacob_OS [v1.0.2]...",
        "Loading Kernel Modules...",
        "Establishing Matrix Uplink...",
        "Ready."
    ];
    
    bootLines.forEach((line, index) => {
        setTimeout(() => printToTerminal(line), index * CONFIG.bootSpeed);
    });
};

window.onload = boot;