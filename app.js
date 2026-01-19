// 1. SUPABASE CONNECTION (APKI KEYS)
const SUPABASE_URL = 'https://kozmxgymkitcbevtufgz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sMp15iZ3aHBEz44x6YzISA_3fihZSgX';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let userId = null;
let userEmail = "";
let coins = 0;

// 2. INITIALIZE APP
async function initApp() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        userId = user.id;
        userEmail = user.email;
        console.log("User Logged In:", userEmail);
        await syncAllData();
        
        // Loop: Taki balance kabhi hide na ho (Every 2 Seconds)
        setInterval(updateMasterUI, 2000); 
    } else {
        if (!window.location.pathname.includes('login.html')) {
            window.location.replace('login.html');
        }
    }
}

// 3. SYNC DATA FROM DATABASE (Profiles, Withdrawals, etc.)
async function syncAllData() {
    try {
        // Profiles table se coins fetch karein
        let { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        // Agar user database mein nahi hai toh naya record banayein
        if (!profile) {
            console.log("Creating new profile...");
            const { data: newProfile, error: insError } = await supabaseClient
                .from('profiles')
                .insert([{ id: userId, email: userEmail, coins: 0 }])
                .select().single();
            
            if (insError) throw insError;
            profile = newProfile;
        }

        coins = profile.coins || 0;
        updateMasterUI();

        // Agar wallet page par hain toh history load karein
        if (document.getElementById('history-container')) {
            loadWithdrawHistory();
        }

    } catch (err) {
        console.error("Sync Error:", err.message);
    }
}

// 4. MASTER UI UPDATE (FORCE BALANCE VISIBILITY)
function updateMasterUI() {
    // Sabhi possible Balance IDs jo aapne HTML mein use kiye hain
    const coinIDs = ['p-coins', 'wallet-coins', 'home-coins', 'gift-coins', 'wallet-coins-display'];
    
    coinIDs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = coins;
            
            // Hidden issue fix: Forcefully CSS properties apply karein
            el.classList.remove('hidden');
            el.style.setProperty('display', 'inline-block', 'important');
            el.style.setProperty('visibility', 'visible', 'important');
            el.style.setProperty('opacity', '1', 'important');

            // Parent container ko bhi check karein
            if (el.parentElement) {
                el.parentElement.classList.remove('hidden');
                el.parentElement.style.display = 'flex';
                el.parentElement.style.visibility = 'visible';
            }
        }
    });

    // Email & User Info Display
    const emailEl = document.getElementById('p-email') || document.getElementById('user-name');
    if (emailEl) {
        emailEl.innerText = userEmail;
        emailEl.classList.remove('hidden');
    }

    // Money value in Wallet (100 coins = 1 rupee logic)
    const moneyVal = document.getElementById('money-val');
    if (moneyVal) {
        moneyVal.innerText = (coins / 100).toFixed(2);
    }
}

// 5. WITHDRAWAL PROCESS (UPI ID KE SAATH)
async function processWithdrawRequest(coinAmount, upiId) {
    try {
        if (coins < coinAmount) {
            alert("Bhai balance kam hai!");
            return false;
        }

        // Coins minus karein
        const { error: updErr } = await supabaseClient
            .from('profiles')
            .update({ coins: coins - coinAmount })
            .eq('id', userId);

        if (updErr) throw updErr;

        // Withdrawal request save karein (UPI ID payment_id column mein jayegi)
        const { error: withdrawError } = await supabaseClient
            .from('withdrawals')
            .insert([{ 
                user_id: userId, 
                amount: coinAmount, 
                status: 'pending',
                method: 'UPI',
                payment_id: upiId 
            }]);

        if (withdrawError) throw withdrawError;

        // Balance update karein
        coins -= coinAmount;
        updateMasterUI();
        loadWithdrawHistory();
        return true;

    } catch (err) {
        alert("Transaction Failed: " + err.message);
        return false;
    }
}

// 6. LOAD HISTORY (Wallet Page)
async function loadWithdrawHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;

    const { data, error } = await supabaseClient
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: false });

    if (data && data.length > 0) {
        container.innerHTML = data.map(item => `
            <div class="bg-white p-4 rounded-2xl flex justify-between items-center mb-3 shadow-sm border border-gray-100">
                <div>
                    <p class="text-xs font-bold uppercase">₹${item.amount / 100} Withdrawal</p>
                    <p class="text-[9px] text-gray-400 font-bold">${new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <span class="text-[9px] font-black uppercase px-3 py-1 rounded-full ${item.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}">
                    ${item.status}
                </span>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p class="text-center text-[10px] text-gray-400 font-bold">NO HISTORY FOUND</p>';
    }
}

// 7. REWARD SYSTEM (Gift Codes / Ads)
async function addCoins(amount) {
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

// 8. LOGOUT
async function handleLogout() {
    if (confirm("Logout karna chahte hain?")) {
        await supabaseClient.auth.signOut();
        window.location.replace('login.html');
    }
}

// Start the engine
initApp();
        
