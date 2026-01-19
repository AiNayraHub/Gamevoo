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
        console.log("Logged In as:", userEmail);
        
        // Database se data load karein
        await syncProfileData();
        
        // Har 1.5 second mein check karo ki balance hide to nahi hua
        setInterval(forceBalanceVisibility, 1500); 
    } else {
        if (!window.location.pathname.includes('login.html')) {
            window.location.replace('login.html');
        }
    }
}

// 3. SYNC PROFILE DATA (Table: profiles)
async function syncProfileData() {
    try {
        let { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        // Agar profile table mein user nahi hai toh naya banayein
        if (!profile) {
            console.log("New User: Creating profile record...");
            const { data: newProfile, error: insError } = await supabaseClient
                .from('profiles')
                .insert([{ id: userId, email: userEmail, coins: 0 }])
                .select().single();
            
            if (insError) throw insError;
            profile = newProfile;
        }

        // Coins set karein
        coins = profile.coins || 0;
        forceBalanceVisibility();

        // Agar Wallet Page hai toh history bhi dikhao
        if (document.getElementById('history-container')) {
            loadWithdrawHistory();
        }

    } catch (err) {
        console.error("Sync Error:", err.message);
    }
}

// 4. FORCE BALANCE VISIBILITY (Hidden issue ka pakka ilaj)
function forceBalanceVisibility() {
    const coinIDs = ['p-coins', 'wallet-coins', 'home-coins', 'gift-coins', 'wallet-coins-display'];
    
    coinIDs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = coins; // Balance value set karein
            
            // CSS se hide karne ki koshish ko block karein
            el.classList.remove('hidden');
            el.style.setProperty('display', 'inline-block', 'important');
            el.style.setProperty('visibility', 'visible', 'important');
            el.style.setProperty('opacity', '1', 'important');

            // Parent (baap) element ko bhi force-show karein
            if (el.parentElement) {
                el.parentElement.classList.remove('hidden');
                el.parentElement.style.display = 'flex';
                el.parentElement.style.visibility = 'visible';
            }
        }
    });

    // User details update
    const emailEl = document.getElementById('p-email') || document.getElementById('user-name');
    if (emailEl) {
        emailEl.innerText = userEmail;
        emailEl.classList.remove('hidden');
    }

    // Money value in Wallet (100 coins = ₹1)
    const moneyVal = document.getElementById('money-val');
    if (moneyVal) {
        moneyVal.innerText = (coins / 100).toFixed(2);
    }
}

// 5. WITHDRAWAL REQUEST (UPI ID ke saath)
async function processWithdrawRequest(coinAmount, upiId) {
    try {
        if (coins < coinAmount) {
            alert("Bhai, balance kam hai!");
            return false;
        }

        // 1. Coins minus karein (Table: profiles)
        const { error: updErr } = await supabaseClient
            .from('profiles')
            .update({ coins: coins - coinAmount })
            .eq('id', userId);

        if (updErr) throw updErr;

        // 2. Request save karein (Table: withdrawals)
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

        // Success: Balance local update aur UI refresh
        coins -= coinAmount;
        forceBalanceVisibility();
        loadWithdrawHistory();
        return true;

    } catch (err) {
        alert("Transaction Fail: " + err.message);
        return false;
    }
}

// 6. HISTORY LOAD (Wallet Page ke liye)
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
            <div class="bg-white p-4 rounded-2xl flex justify-between items-center mb-3 shadow-sm border border-gray-50">
                <div class="text-left">
                    <p class="text-[11px] font-black italic text-slate-700">₹${item.amount / 100} PAYOUT</p>
                    <p class="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">${new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <span class="text-[9px] font-black uppercase px-3 py-1 rounded-full ${item.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}">
                    ${item.status}
                </span>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p class="text-center text-[10px] text-slate-400 font-bold uppercase italic mt-10">No History Found</p>';
    }
}

// 7. GIFT CODE / REWARD LOGIC
async function addRewardCoins(amount) {
    const { error } = await supabaseClient
        .from('profiles')
        .update({ coins: coins + amount })
        .eq('id', userId);

    if (!error) {
        coins += amount;
        forceBalanceVisibility();
        return true;
    }
    return false;
}

// 8. LOGOUT
async function handleLogout() {
    if (confirm("Logout Karein?")) {
        await supabaseClient.auth.signOut();
        window.location.replace('login.html');
    }
}

// Initialization Start
initApp();
                        
