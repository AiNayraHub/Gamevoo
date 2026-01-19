// SUPABASE CONFIG
const SUPABASE_URL = 'https://kozmxgymkitcbevtufgz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sMp15iZ3aHBEz44x6YzISA_3fihZSgX';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let userId = null;
let userEmail = "";
let coins = 0;

// APP START
async function initApp() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        userId = user.id;
        userEmail = user.email;
        console.log("User found:", userEmail);
        await syncData();
    } else {
        if (!window.location.pathname.includes('login.html')) {
            window.location.replace('login.html');
        }
    }
}

// DATA SYNC LOGIC
async function syncData() {
    try {
        let { data, error } = await supabaseClient
            .from('users_data')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (!data) {
            console.log("Creating new record...");
            const { data: newData, error: insertError } = await supabaseClient
                .from('users_data')
                .insert([{ id: userId, email: userEmail, coins: 0 }])
                .select()
                .single();
            
            if (insertError) throw insertError;
            data = newData;
        }

        coins = data.coins || 0;
        updateUI(); // UI update call karein

    } catch (err) {
        console.error("Critical Error:", err.message);
    }
}

// UI UPDATE FUNCTION (FIXED: Balance visibility guaranteed)
function updateUI() {
    const coinIDs = ['p-coins', 'wallet-coins', 'home-coins', 'gift-coins'];
    
    coinIDs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = coins;
            // Forcefully make sure balance is visible
            el.style.display = 'inline-block'; 
            if(el.parentElement) el.parentElement.style.display = 'flex';
        }
    });

    const emailIDs = ['p-email', 'user-name'];
    emailIDs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = userEmail;
    });
}

// REWARD/COIN MODIFIER
async function modifyCoins(amount, type = 'add') {
    let newBalance = (type === 'add') ? (coins + amount) : (coins - amount);
    if (newBalance < 0) {
        alert("Balance kam hai!");
        return false;
    }

    const { error } = await supabaseClient
        .from('users_data')
        .update({ coins: newBalance })
        .eq('id', userId);

    if (!error) {
        coins = newBalance;
        updateUI(); // Data add hote hi UI refresh
        return true;
    } else {
        alert("Update Error: " + error.message);
        return false;
    }
}

initApp();
                
