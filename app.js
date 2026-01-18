const SB_URL = 'https://kozmxgymkitcbevtufgz.supabase.co';
const SB_KEY = 'sb_publishable_sMp15iZ3aHBEz44x6YzISA_3fihZSgX';
const supabase = supabase.createClient(SB_URL, SB_KEY);

let userId = null;
let coins = 0;

// Initialize User and Coins
async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        userId = user.id;
        // Database se coins fetch karein
        let { data, error } = await supabase
            .from('profiles')
            .select('coins')
            .eq('id', userId)
            .single();

        if (data) {
            coins = parseInt(data.coins) || 0;
            syncUI();
        } else if (error) {
            console.log("Fetch Error:", error.message);
        }
    } else {
        // Agar login nahi hai toh login page par bhejein
        if(!window.location.href.includes('login.html')) {
            window.location.href = "login.html";
        }
    }
}

// Global UI Sync Function
function syncUI() {
    const ids = ['header-coins', 'home-coins', 'coin-display', 'coin-display-wallet', 'profile-coins', 'current-coins-ui'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerText = coins;
    });
    
    // Wallet money calculation
    const moneyEl = document.getElementById('money-display');
    if(moneyEl) moneyEl.innerText = (coins / 100).toFixed(2);
}

// Database Update Function (Yehi data save karta hai)
async function addCoins(amount) {
    if (!userId) {
        alert("Pehle login karein!");
        return;
    }

    let newTotal = parseInt(coins) + parseInt(amount);
    
    const { data, error } = await supabase
        .from('profiles')
        .update({ coins: newTotal })
        .eq('id', userId)
        .select(); // Select lagane se confirm hota hai ki update hua

    if (error) {
        console.error("Update Error:", error.message);
        alert("Data save nahi hua: " + error.message);
    } else {
        coins = newTotal;
        syncUI();
        console.log("Coins updated in DB:", newTotal);
    }
}

init();
