const SB_URL = 'https://kozmxgymkitcbevtufgz.supabase.co';
const SB_KEY = 'sb_publishable_sMp15iZ3aHBEz44x6YzISA_3fihZSgX';
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let userId = null;
let userEmail = "";
let coins = 0;

// 1. SYSTEM INITIALIZE (Login, Profile Create, & Block Check)
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
            // ADMIN BLOCK CHECK: Agar admin ne block kiya hai toh turant bahar phenko
            if (data.status === 'blocked') {
                alert("Your account has been suspended by Admin!");
                await supabaseClient.auth.signOut();
                window.location.href = "login.html";
                return;
            }
            coins = parseInt(data.coins) || 0;
        } else {
            // Agar database mein row nahi hai toh turant banao
            await supabaseClient.from('profiles').upsert([{ id: userId, email: userEmail, coins: 0 }]);
            coins = 0;
        }
        updateAllUI();
    } else {
        // Login protect: Agar user logged in nahi hai toh sirf login ya index page hi khulega
        const p = window.location.pathname;
        if (!p.includes('login.html') && !p.includes('index.html') && p !== '/') {
            window.location.href = "login.html";
        }
    }
}

// 2. UNIVERSAL COIN ADDER (Adds to DB & Local)
async function addCoins(amt) {
    if (!userId) return false;
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
    console.error("Sync Error:", error.message);
    return false;
}

// 3. UI SYNCHRONIZER (Updates every HTML page automatically)
function updateAllUI() {
    // Coins update karne ke liye saari IDs
    const ids = ['header-coins', 'home-coins', 'wallet-coins', 'profile-coins', 'current-coins-ui', 'test-coins'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = coins;
    });

    // Profile page par email dikhane ke liye
    const emailEl = document.getElementById('user-email-display');
    if (emailEl) emailEl.innerText = userEmail;

    // Wallet money (₹1 = 100 coins)
    const moneyEl = document.getElementById('money-display');
    if (moneyEl) moneyEl.innerText = (coins / 100).toFixed(2);
}

// 4. GIFT CODE SYSTEM (Connects to Admin Panel)
async function redeemGiftCode(inputCode) {
    if (!userId) return { success: false, msg: "Please Login First!" };

    // Database se code check karo
    const { data, error } = await supabaseClient
        .from('gift_codes')
        .select('*')
        .eq('code', inputCode.toUpperCase())
        .single();

    if (error || !data) {
        return { success: false, msg: "Invalid or Expired Code!" };
    }

    // Reward add karo
    const reward = parseInt(data.reward);
    const ok = await addCoins(reward);
    
    if (ok) {
        return { success: true, msg: `Mubarak ho! +${reward} coins mile.` };
    } else {
        return { success: false, msg: "Syncing Error!" };
    }
}

// Run the engine
init();
    
