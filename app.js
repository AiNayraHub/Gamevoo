const SB_URL = 'https://kozmxgymkitcbevtufgz.supabase.co';
const SB_KEY = 'sb_publishable_sMp15iZ3aHBEz44x6YzISA_3fihZSgX';
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let userId = null;
let userEmail = "";
let coins = 0;

async function init() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        userId = session.user.id;
        userEmail = session.user.email;
        
        // Profiles table se data fetch karo
        let { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (data) {
            coins = parseInt(data.coins) || 0;
        } else {
            // Nayi profile banao agar nahi hai
            await supabaseClient.from('profiles').upsert([{ id: userId, email: userEmail, coins: 0 }]);
            coins = 0;
        }
        updateAllUI();
    } else {
        if (!window.location.href.includes('login.html')) window.location.href = "login.html";
    }
}

async function addCoins(amt) {
    if (!userId) return;
    let newTotal = Number(coins) + Number(amt);
    
    const { error } = await supabaseClient
        .from('profiles')
        .update({ coins: newTotal })
        .eq('id', userId);

    if (!error) {
        coins = newTotal;
        updateAllUI();
        return true;
    }
    return false;
}

function updateAllUI() {
    const ids = ['header-coins', 'home-coins', 'wallet-coins', 'profile-coins', 'current-coins-ui'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = coins;
    });

    const emailEl = document.getElementById('user-email-display');
    if (emailEl) emailEl.innerText = userEmail;

    const moneyEl = document.getElementById('money-display');
    if (moneyEl) moneyEl.innerText = (coins / 100).toFixed(2);
}

init();
