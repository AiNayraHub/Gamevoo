// 1. SUPABASE CONNECTION (Fixed with your Keys)
const SUPABASE_URL = 'https://kozmxgymkitcbevtufgz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sMp15iZ3aHBEz44x6YzISA_3fihZSgX';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let userId = null;
let userEmail = "";
let coins = 0;

// 2. AUTH & INITIALIZATION
async function initApp() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        userId = user.id;
        userEmail = user.email;
        console.log("User Logged In:", userEmail);
        await syncProfileData(); // Profiles table se data fetch karo
    } else {
        if (!window.location.pathname.includes('login.html')) {
            window.location.replace('login.html');
        }
    }
}

// 3. PROFILES TABLE SYNC (Fixed Table Name)
async function syncProfileData() {
    try {
        // 'profiles' table se data uthana
        let { data, error } = await supabaseClient
            .from('profiles') // <--- Yahan 'profiles' table add kar diya hai
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        // Agar profiles mein user nahi hai toh naya record banayein
        if (!data) {
            console.log("Creating new profile for user...");
            const { data: newProfile, error: insertError } = await supabaseClient
                .from('profiles')
                .insert([{ id: userId, email: userEmail, coins: 0 }])
                .select()
                .single();
            
            if (insertError) throw insertError;
            data = newProfile;
        }

        if (data) {
            coins = data.coins || 0;
            updateUI(); // UI show karo
        }
    } catch (err) {
        console.error("Profile Fetch Error:", err.message);
    }
}

// 4. UI UPDATE (Hidden Issue Fix)
function updateUI() {
    const coinIDs = ['p-coins', 'wallet-coins', 'home-coins', 'gift-coins'];
    
    coinIDs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = coins;
            
            // Hidden issue fix: Force visibility
            el.classList.remove('hidden');
            el.style.display = 'inline-block';
            el.style.visibility = 'visible';
            el.style.opacity = '1';

            // Parent ko bhi show karo
            if (el.parentElement) {
                el.parentElement.classList.remove('hidden');
                el.parentElement.style.display = 'flex';
            }
        }
    });

    // Email update
    const emailElements = ['p-email', 'user-name'];
    emailElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = userEmail;
            el.classList.remove('hidden');
        }
    });
}

// 5. MODIFY COINS (For Rewards & Wallet)
async function modifyCoins(amount, type = 'add') {
    let newBalance = (type === 'add') ? (coins + amount) : (coins - amount);
    if (newBalance < 0) {
        alert("Balance bahut kam hai!");
        return false;
    }

    const { error } = await supabaseClient
        .from('profiles') // <--- profiles table mein update
        .update({ coins: newBalance })
        .eq('id', userId);

    if (!error) {
        coins = newBalance;
        updateUI();
        return true;
    } else {
        alert("Update Error: " + error.message);
        return false;
    }
}

// Logout function
async function handleLogout() {
    if (confirm("Logout karna chahte hain?")) {
        await supabaseClient.auth.signOut();
        window.location.replace('login.html');
    }
}

// Initialize
initApp();
