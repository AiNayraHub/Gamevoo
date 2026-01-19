// 1. SUPABASE CONNECTION (APKI KEYS ADDED)
const SUPABASE_URL = 'https://kozmxgymkitcbevtufgz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sMp15iZ3aHBEz44x6YzISA_3fihZSgX';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Global Variables
let userId = null;
let userEmail = "";
let coins = 0;

// 2. AUTH & DATABASE INITIALIZATION
async function initApp() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        userId = user.id;
        userEmail = user.email;
        console.log("Connected to Supabase:", userEmail);
        await syncUserData(); // User ka data database se load karo
    } else {
        // Agar user logged in nahi hai toh login.html par bhejo
        if (!window.location.pathname.includes('login.html')) {
            window.location.replace('login.html');
        }
    }
}

// 3. SYNC DATA (users_data Table se data lena aur naya user banana)
async function syncUserData() {
    try {
        let { data, error } = await supabaseClient
            .from('users_data')
            .select('*')
            .eq('id', userId)
            .single();

        // Agar user database table mein nahi hai (Naya User)
        if (error && error.code === 'PGRST116') {
            const { data: newUser, error: createError } = await supabaseClient
                .from('users_data')
                .insert([{ id: userId, email: userEmail, coins: 0 }])
                .select()
                .single();
            
            if (createError) throw createError;
            data = newUser;
        }

        if (data) {
            coins = data.coins;
            updateGlobalUI(); // Poori website ki UI update karo
        }
    } catch (err) {
        console.error("Database Sync Error:", err.message);
    }
}

// 4. GLOBAL UI UPDATE (Coins, Email aur ID har page par set karna)
function updateGlobalUI() {
    // Coins update (Sari HTML files ke IDs cover kiye hain)
    const coinIDs = ['p-coins', 'wallet-coins', 'home-coins', 'gift-coins'];
    coinIDs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = coins;
    });

    // Email update
    const emailIDs = ['p-email', 'user-name'];
    emailIDs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = userEmail;
    });

    // UID update
    const uidIDs = ['p-uid', 'p-full-uid'];
    uidIDs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Short ID for display, Full ID for profile
            el.innerText = (id === 'p-uid') ? "UID: " + userId.substring(0, 10) : userId;
        }
    });
}

// 5. MODIFY COINS (Add or Subtract with Database Sync)
async function modifyCoins(amount, type = 'add') {
    let newBalance = (type === 'add') ? (coins + amount) : (coins - amount);

    if (newBalance < 0) {
        alert("Balance bahut kam hai!");
        return false;
    }

    const { error } = await supabaseClient
        .from('users_data')
        .update({ coins: newBalance })
        .eq('id', userId);

    if (!error) {
        coins = newBalance;
        updateGlobalUI();
        console.log(`${amount} coins ${type}ed successfully!`);
        return true;
    } else {
        alert("Database Error: " + error.message);
        return false;
    }
}

// 6. LOGOUT FUNCTION
async function handleLogout() {
    if (confirm("Kya aap sach mein Logout karna chahte hain?")) {
        const { error } = await supabaseClient.auth.signOut();
        if (!error) {
            console.log("Logout successful");
            window.location.replace('login.html');
        } else {
            alert("Logout Error: " + error.message);
        }
    }
}

// Start Engine
initApp();
    
