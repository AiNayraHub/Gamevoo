const SB_URL = 'https://kozmxgymkitcbevtufgz.supabase.co';
const SB_KEY = 'sb_publishable_sMp15iZ3aHBEz44x6YzISA_3fihZSgX';
const supabase = supabase.createClient(SB_URL, SB_KEY);

let userId = null;
let coins = 0;

async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        userId = user.id;
        if(document.getElementById('user-email')) document.getElementById('user-email').innerText = user.email;
        loadData();
    } else {
        if(!window.location.href.includes('login.html')) window.location.href = "login.html";
    }
}

async function loadData() {
    let { data } = await supabase.from('profiles').select('coins').eq('id', userId).single();
    if (data) {
        coins = data.coins;
        syncUI();
    }
}

function syncUI() {
    if(document.getElementById('coin-display')) document.getElementById('coin-display').innerText = coins;
    if(document.getElementById('coin-display-wallet')) document.getElementById('coin-display-wallet').innerText = coins;
    if(document.getElementById('money-display')) document.getElementById('money-display').innerText = (coins/100).toFixed(2);
    if(document.getElementById('profile-coins')) document.getElementById('profile-coins').innerText = coins;
    if(document.getElementById('home-coins')) document.getElementById('home-coins').innerText = coins;
}

async function addCoins(n) {
    coins += n;
    syncUI();
    await supabase.from('profiles').update({ coins: coins }).eq('id', userId);
    alert(n + " Coins Added!");
}

async function claimCode() {
    const code = document.getElementById('gift-code').value;
    if(code === "GAMEVOO100") {
        addCoins(100);
    } else {
        alert("Invalid Code!");
    }
}

async function logout() {
    await supabase.auth.signOut();
    window.location.href = "login.html";
}

init();

