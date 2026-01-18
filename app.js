const SB_URL = 'https://kozmxgymkitcbevtufgz.supabase.co';
const SB_KEY = 'sb_publishable_sMp15iZ3aHBEz44x6YzISA_3fihZSgX';
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let userId = null;
let coins = 0;

// 1. Initialize User & Sync Data
async function init() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (user) {
        userId = user.id;
        console.log("User Logged In:", userId);

        // Database se data lao
        let { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code === "PGRST116") {
            // Agar profile nahi hai toh Nayi Profile banao
            console.log("Profile not found, creating new...");
            const { data: newData, error: createError } = await supabaseClient
                .from('profiles')
                .insert([{ id: userId, email: user.email, coins: 0 }])
                .select()
                .single();
            
            if (newData) coins = 0;
            if (createError) console.error("Creation Error:", createError.message);
        } else if (data) {
            coins = parseInt(data.coins) || 0;
            console.log("Data Loaded! Coins:", coins);
        }
        
        syncUI();
    } else {
        if(!window.location.href.includes('login.html')) {
            window.location.href = "login.html";
        }
    }
}

// 2. Add Coins Function (With Database Force Sync)
async function addCoins(amount) {
    if (!userId) return alert("Please Login!");

    let newTotal = Number(coins) + Number(amount);
    
    // Database Update
    const { error } = await supabaseClient
        .from('profiles')
        .update({ coins: newTotal })
        .eq('id', userId);

    if (error) {
        console.error("Save Error:", error.message);
        alert("Database Error: Data save nahi hua! Check RLS Settings.");
    } else {
        coins = newTotal;
        syncUI();
        console.log("Successfully saved to DB:", newTotal);
    }
}

// 3. UI Update
function syncUI() {
    const elements = ['header-coins', 'home-coins', 'coin-display', 'coin-display-wallet', 'profile-coins', 'test-coins'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerText = coins;
    });
}

// Start
init();
