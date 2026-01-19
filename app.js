// CONFIGURATION
const SUPABASE_URL = 'https://kozmxgymkitcbevtufgz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sMp15iZ3aHBEz44x6YzISA_3fihZSgX';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let userId = null;
let userEmail = "";
let coins = 0;

// 1. INITIALIZE APP
async function initApp() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        userId = user.id;
        userEmail = user.email;
        await syncAllData();
        
        // Har 2 second mein UI refresh karein taaki hidden na ho
        setInterval(updateMasterUI, 2000); 
    } else {
        if (!window.location.pathname.includes('login.html')) {
            window.location.replace('login.html');
        }
    }
}

// 2. SYNC DATA FROM PROFILES TABLE
async function syncAllData() {
    try {
        let { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (!profile) {
            const { data: newProfile } = await supabaseClient
                .from('profiles')
                .insert([{ id: userId, email: userEmail, coins: 0 }])
                .select().single();
            profile = newProfile;
        }

        coins = profile.coins || 0;
        updateMasterUI();

    } catch (err) {
        console.error("Sync Error:", err.message);
    }
}

// 3. MASTER UI UPDATE (Force Visibility Fix)
function updateMasterUI() {
    // Sabhi possible Balance IDs
    const coinIDs = ['p-coins', 'wallet-coins', 'home-coins', 'gift-coins', 'wallet-coins-display', 'balance-text'];
    
    coinIDs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = coins;
            
            // Hidden issue ko jadh se khatam karne ke liye:
            el.classList.remove('hidden'); 
            el.style.setProperty('display', 'inline-block', 'important');
            el.style.setProperty('visibility', 'visible', 'important');
            el.style.setProperty('opacity', '1', 'important');

            // Parent container ko bhi show karo
            if (el.parentElement) {
                el.parentElement.classList.remove('hidden');
                el.parentElement.style.display = 'flex';
                el.parentElement.style.visibility = 'visible';
            }
        }
    });

    // Email & UID Update
    const userDisplay = document.getElementById('user-name') || document.getElementById('p-email');
    if (userDisplay) {
        userDisplay.innerText = userEmail;
        userDisplay.classList.remove('hidden');
    }
}

// 4. ADD COINS FUNCTION (Call this for rewards/ads)
async function addRewardCoins(amount) {
    const { error } = await supabaseClient
        .from('profiles')
        .update({ coins: coins + amount })
        .eq('id', userId);

    if (!error) {
        coins += amount;
        updateMasterUI();
        return true;
    }
    return false;
}

initApp();
