// 1. SUPABASE CONNECTION CONFIG
const SUPABASE_URL = 'https://kozmxgymkitcbevtufgz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sMp15iZ3aHBEz44x6YzISA_3fihZSgX';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.coins = 0; // Global balance variable
let userId = null;
let userEmail = "";

// 2. APP INITIALIZATION (Sabse pehle ye chalega)
async function initApp() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        userId = user.id;
        userEmail = user.email;
        console.log("Logged in as:", userEmail);
        
        // Profiles table se coins aur data fetch karein
        await syncUserData();
        
        // Loop: Har 1.5 second mein UI refresh karein taaki balance hide na ho
        setInterval(refreshGlobalUI, 1500); 
    } else {
        // Agar user login nahi hai aur kisi security wale page par hai
        if (!window.location.pathname.includes('login.html')) {
            window.location.replace('login.html');
        }
    }
}

// 3. DATA SYNC (Profiles Table se coins uthana)
async function syncUserData() {
    try {
        let { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (!profile) {
            // Naya user hai toh profile banayein
            const { data: newP } = await supabaseClient
                .from('profiles')
                .insert([{ id: userId, email: userEmail, coins: 0 }])
                .select().single();
            profile = newP;
        }

        window.coins = Number(profile.coins || 0);
        refreshGlobalUI();

        // Wallet page history load karein
        if (document.getElementById('history-container')) {
            loadWithdrawHistory();
        }
    } catch (err) {
        console.error("Sync Error:", err.message);
    }
}

// 4. GLOBAL UI REFRESH (Har page ka balance update)
function refreshGlobalUI() {
    const coinIDs = ['p-coins', 'wallet-coins', 'home-coins', 'gift-coins', 'wallet-coins-display'];
    
    coinIDs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = window.coins;
            el.classList.remove('hidden'); 
            el.style.setProperty('display', 'inline-block', 'important');
        }
    });

    // Money Value in ₹ (100 coins = ₹1)
    const moneyVal = document.getElementById('money-val');
    if (moneyVal) {
        moneyVal.innerText = (window.coins / 100).toFixed(2);
    }

    // Email Display
    const emailEls = ['p-email', 'user-name', 'user-display-email'];
    emailEls.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = userEmail;
    });
}

// 5. WITHDRAWAL LOGIC (UPI & Admin Panel Fix)
async function processWithdrawRequest(coinAmt, upi) {
    try {
        if (window.coins < coinAmt) {
            alert("Insufficient Balance!");
            return false;
        }

        // A. Minus coins from profiles
        const { error: updErr } = await supabaseClient
            .from('profiles')
            .update({ coins: window.coins - coinAmt })
            .eq('id', userId);

        if (updErr) throw updErr;

        // B. Add to withdrawals table (upi_id column)
        const { error: withdrawError } = await supabaseClient
            .from('withdrawals')
            .insert([{ 
                user_id: userId, 
                amount: coinAmt, 
                status: 'pending',
                method: 'UPI',
                upi_id: upi 
            }]);

        if (withdrawError) throw withdrawError;

        window.coins -= coinAmt;
        refreshGlobalUI();
        loadWithdrawHistory();
        return true;

    } catch (err) {
        alert("Transaction Failed: " + err.message);
        return false;
    }
}

// 6. GIFT CODE REDEEM (Undefined Fix - uses 'reward' column)
async function processGiftRedeem(code) {
    try {
        // A. Fetch from gift_codes
        const { data: gift, error: giftErr } = await supabaseClient
            .from('gift_codes')
            .select('*')
            .eq('code', code)
            .maybeSingle();

        if (giftErr || !gift) {
            return { success: false, message: "Invalid Gift Code!" };
        }

        // Check if data has reward
        const bonusAmount = Number(gift.reward); // FIXED: Matching your SQL column 'reward'
        
        if (isNaN(bonusAmount)) {
            return { success: false, message: "Invalid reward amount in database." };
        }

        // B. Check if already used by this user
        const { data: used } = await supabaseClient
            .from('redeemed_codes')
            .select('*')
            .eq('user_id', userId)
            .eq('code_text', code)
            .maybeSingle();

        if (used) {
            return { success: false, message: "You have already used this code!" };
        }

        // C. Update Coins
        const { error: updErr } = await supabaseClient
            .from('profiles')
            .update({ coins: window.coins + bonusAmount })
            .eq('id', userId);

        if (updErr) throw updErr;

        // D. Mark as Redeemed
        await supabaseClient.from('redeemed_codes').insert([
            { user_id: userId, code_text: code }
        ]);

        window.coins += bonusAmount;
        refreshGlobalUI();

        return { success: true, amount: bonusAmount };

    } catch (err) {
        console.error(err);
        return { success: false, message: "Server Error!" };
    }
}

// 7. LOAD WITHDRAWAL HISTORY
async function loadWithdrawHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;

    const { data } = await supabaseClient
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: false });

    if (data && data.length > 0) {
        container.innerHTML = data.map(item => `
            <div class="bg-white p-4 rounded-2xl flex justify-between items-center mb-3 shadow-sm border border-slate-100">
                <div class="text-left">
                    <p class="text-[11px] font-black italic text-slate-700">₹${item.amount / 100} PAYOUT</p>
                    <p class="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">${new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <span class="text-[9px] font-black uppercase px-3 py-1 rounded-full ${item.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}">
                    ${item.status}
                </span>
            </div>
        `).join('');
    }
}

// 8. LOGOUT
async function handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
        await supabaseClient.auth.signOut();
        window.location.replace('login.html');
    }
}

// BOOTSTRAP APP
initApp();
                
