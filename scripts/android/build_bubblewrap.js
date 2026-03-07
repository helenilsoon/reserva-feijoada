const { spawn } = require('child_process');

/*
Configuration values for Bubblewrap Build
*/
const config = {
    password: 'reserva123',
    keyPassword: 'reserva123'
};

const prompts = [
    { name: 'license', pattern: /Accept\? \(y\/N\):/, answer: 'y' },
    { name: 'pass1', pattern: /\? Password for the Key Store:/, answer: config.password },
    { name: 'keyPass1', pattern: /\? Password for the Key:/, answer: config.keyPassword }
].map(p => ({ ...p, matched: false }));

const bubblewrap = spawn('bubblewrap', ['build'], {
    stdio: ['pipe', 'pipe', 'inherit'],
    shell: true
});

let outputBuffer = '';

bubblewrap.stdout.on('data', (data) => {
    const chunk = data.toString();
    outputBuffer += chunk;
    console.log(chunk);

    // Try to match any prompt
    for (let i = 0; i < prompts.length; i++) {
        const p = prompts[i];
        // For passwords, we might need to handle them multiple times if Gradle asks again, 
        // but usually once per build is enough for Bubblewrap's wrapper.
        // Actually, let's allow multiple matches for passwords just in case.
        if (p.pattern.test(outputBuffer)) {
            if (p.name === 'license' && p.matched) continue; // Only accept license once

            console.log(`[Automation] Match found for "${p.name}": ${p.pattern}`);
            bubblewrap.stdin.write(p.answer + '\n');
            p.matched = true;
            outputBuffer = '';
            break;
        }
    }
});

bubblewrap.on('close', (code) => {
    console.log(`Bubblewrap build process exited with code ${code}`);
    process.exit(code);
});
