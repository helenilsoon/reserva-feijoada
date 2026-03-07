const { spawn } = require('child_process');

/*
Configuration values for Bubblewrap Init
*/
const config = {
    domain: '', // Enter
    urlPath: '', // Enter
    appName: 'Reserva Feijoada',
    shortName: 'Feijoada',
    appId: 'com.reservafeijoada.twa',
    versionCode: '', // Enter
    displayMode: '', // Enter
    orientation: '', // Enter
    statusBarColor: '', // Enter
    splashColor: '', // Enter
    iconUrl: '', // Enter
    maskableIconUrl: '', // Enter
    monochromeIconUrl: '', // Enter
    playBilling: 'N',
    geolocation: 'N',
    createKeystore: 'Y',
    keystorePath: '', // Enter
    keyAlias: '', // Enter
    password: 'reserva123',
    confirmPassword: 'reserva123',
    fullName: 'Reserva Feijoada',
    orgUnit: 'Sabor',
    org: 'Sabor & Tradicao',
    city: 'Braganca Paulista',
    state: 'Sao Paulo',
    country: 'BR',
    confirmDn: 'yes',
    keyPassword: 'reserva123',
    confirmKeyPassword: 'reserva123'
};

const prompts = [
    { name: 'domain', pattern: /\? Domain:/, answer: config.domain },
    { name: 'urlPath', pattern: /\? URL path:/, answer: config.urlPath },
    { name: 'appName', pattern: /\? Application name:/, answer: config.appName },
    { name: 'shortName', pattern: /\? Short name:/, answer: config.shortName },
    { name: 'appId', pattern: /\? Application ID:/, answer: config.appId },
    { name: 'versionCode', pattern: /\? Starting version code/, answer: config.versionCode },
    { name: 'displayMode', pattern: /\? Display mode:/, answer: config.displayMode },
    { name: 'orientation', pattern: /\? Orientation:/, answer: config.orientation },
    { name: 'statusBarColor', pattern: /\? Status bar color:/, answer: config.statusBarColor },
    { name: 'splashColor', pattern: /\? Splash screen color:/, answer: config.splashColor },
    { name: 'iconUrl', pattern: /\? Icon URL:/, answer: config.iconUrl },
    { name: 'maskableIconUrl', pattern: /\? Maskable icon URL:/, answer: config.maskableIconUrl },
    { name: 'monochromeIconUrl', pattern: /\? Monochrome icon URL:/, answer: config.monochromeIconUrl },
    { name: 'playBilling', pattern: /\? Include support for Play Billing/, answer: config.playBilling },
    { name: 'geolocation', pattern: /\? Request geolocation permission/, answer: config.geolocation },
    { name: 'twaConfirm', pattern: /Is that correct\?/, answer: 'Y' },
    { name: 'createKeystore', pattern: /\? Do you want to create one now/, answer: config.createKeystore },
    { name: 'keystorePath', pattern: /\? Key store location:/, answer: config.keystorePath },
    { name: 'keyAlias', pattern: /\? Key name:/, answer: config.keyAlias },
    { name: 'pass1', pattern: /\? Password for the Key Store/, answer: config.password },
    { name: 'pass2', pattern: /\? Confirm password for the Key Store/, answer: config.confirmPassword },
    { name: 'fullName', pattern: /\? First and Last names/, answer: config.fullName },
    { name: 'orgUnit', pattern: /\? Organizational Unit/, answer: config.orgUnit },
    { name: 'org', pattern: /\? Organization/, answer: config.org },
    { name: 'city', pattern: /\? City or Locality/, answer: config.city },
    { name: 'state', pattern: /\? State or Province/, answer: config.state },
    { name: 'country', pattern: /\? Country \(2 letter code\):/, answer: config.country },
    { name: 'confirmDn', pattern: /Is .* correct\?/, answer: config.confirmDn },
    { name: 'keyPass1', pattern: /\? Password for the Key:/, answer: config.keyPassword },
    { name: 'keyPass2', pattern: /\? Confirm password for the Key:/, answer: config.confirmKeyPassword }
].map(p => ({ ...p, matched: false }));

const bubblewrap = spawn('bubblewrap', ['init', '--manifest=https://reserva-feijoada.vercel.app/manifest.json'], {
    stdio: ['pipe', 'pipe', 'inherit'],
    shell: true
});

let outputBuffer = '';

bubblewrap.stdout.on('data', (data) => {
    const chunk = data.toString();
    outputBuffer += chunk;
    console.log(chunk);

    // Try to match any prompt that hasn't been matched yet
    for (let i = 0; i < prompts.length; i++) {
        const p = prompts[i];
        if (!p.matched && p.pattern.test(outputBuffer)) {
            console.log(`[Automation] Match found for "${p.name}" (index ${i}): ${p.pattern}`);
            console.log(`[Automation] Answering with: "SECRET"`);

            bubblewrap.stdin.write(p.answer + '\n');
            p.matched = true;

            // Clear buffer partially or fully
            // Actually, we should only clear the matched part, but since prompts are usually separate chunks or ends of chunks, resetting is mostly okay.
            outputBuffer = '';
            break;
        }
    }
});

bubblewrap.on('close', (code) => {
    console.log(`Bubblewrap process exited with code ${code}`);
    process.exit(code);
});
