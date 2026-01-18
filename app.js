const SB_URL = 'https://kozmxgymkitcbevtufgz.supabase.co';
const SB_KEY = 'sb_publishable_sMp15iZ3aHBEz44x6YzISA_3fihZSgX';
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let userId = null;
let coins = 0;

async function init() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        userId = user.id;
        // Upsert logic: Data nahi hai toh khud ban jayega
        const { data, error } = await supabaseClient
            .from('profiles')
            .upsert({ id: userId, email: user.email }, { onConflict: 'id' })
            .select().single();
        
        if (data) {
            coins = parseInt(data.coins) || 0;
            if (data.status === 'blocked') {
                alert("Account Blocked!");
                logout();
            }
            syncUI();
        }
    } else {
        if (!window.location.href.includes('login.html')) window.location.href = "login.html";
    }
}

function syncUI() {
    const ids = ['header-coins', 'home-coins', 'wallet-coins', 'profile-coins', 'money-display'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = id === 'money-display' ? (coins / 100).toFixed(2) : coins;
    });
}

async function addCoins(amt) {
    if (!userId) return;
    let newTotal = coins + amt;
    const { error } = await supabaseClient.from('profiles').update({ coins: newTotal }).eq('id', userId);
    if (!error) {
        coins = newTotal;
        syncUI();
        return true;
    }
    return false;
}

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
}

init();
