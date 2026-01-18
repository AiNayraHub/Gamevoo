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
            // Agar profile row nahi hai toh banao
            await supabaseClient.from('profiles').upsert([{ id: userId, email: userEmail, coins: 0 }]);
        }
        syncEverywhere();
    } else {
        if (!window.location.href.includes('login.html')) window.location.href = "login.html";
    }
}

function syncEverywhere() {
    // 1. Coins update karo har jagah
    const coinElements = ['home-coins', 'wallet-coins', 'profile-coins', 'header-coins', 'current-coins-ui'];
    coinElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = coins;
    });

    // 2. Email ID update karo Profile page par
    const emailElements = ['user-email-display'];
    emailElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = userEmail;
    });

    // 3. Rupees calculation (₹1 = 100 coins)
    const moneyEl = document.getElementById('money-display');
    if (moneyEl) moneyEl.innerText = (coins / 100).toFixed(2);
}

init();
    
