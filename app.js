// 1. SUPABASE CONFIGURATION
const SUPABASE_URL = 'https://kozmxgymkitcbevtufgz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sMp15iZ3aHBEz44x6YzISA_3fihZSgX';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.coins = 0; // Global access ke liye
let userId = null;
let userEmail = "";

// 2. APP INITIALIZATION
async function initApp() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        userId = user.id;
        userEmail = user.email;
        console.log("Logged in as:", userEmail);
        
        // Sabhi data load karein
        await syncUserData();
        
        // FORCE BALANCE VISIBILITY: Har 1.5 second mein UI refresh karein
        setInterval(refreshGlobalUI, 1500); 
    } else {
        // Agar user logged in nahi hai aur login page par nahi hai, toh redirect karein
        if (!window.location.pathname.includes('login.html')) {
            window.location.replace('login.html');
        }
    }
}

// 3. SYNC DATA (Profiles Table)
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

        window.coins = profile.coins || 0;
        refreshGlobalUI();

        // Agar Wallet page par hain toh history load karein
        if (document.getElementById('history-container')) {
            loadWithdrawHistory();
        }
    } catch (err) {
        console.error("Sync Error:", err.message);
    }
}

// 4. REFRESH ALL UI ELEMENTS (Balance & User Info)
function refreshGlobalUI() {
    // Sabhi balance dikhane wali IDs
    const coinIDs = ['p-coins', 'wallet-coins', 'home-coins', 'gift-coins', 'wallet-coins-display'];
    
    coinIDs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = window.coins;
            el.classList.remove('hidden');
            el.style.display = 'inline-block';
        }
    });

    // Money Value (100 coins = ₹1)
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

// 5. WITHDRAWAL FUNCTION (FIXED FOR ADMIN PANEL & UPI_ID ERROR)
async function processWithdrawRequest(coinAmt, upi) {
    try {
        if (window.coins < coinAmt) {
            alert("Balance kam hai!");
            return false;
        }

        // A. Profile se coins minus karein
        const { error: updErr } = await supabaseClient
            .from('profiles')
            .update({ coins: window.coins - coinAmt })
            .eq('id', userId);

        if (updErr) throw updErr;

        // B. Withdrawal table mein record dalo (upi_id column fix)
        const { error: withdrawError } = await supabaseClient
            .from('withdrawals')
            .insert([{ 
                user_id: userId, 
                amount: coinAmt, 
                status: 'pending',
                method: 'UPI',
                upi_id: upi // Aapke database column ke hisaab se
            }]);

        if (withdrawError) throw withdrawError;

        window.coins -= coinAmt;
        refreshGlobalUI();
        loadWithdrawHistory();
        return true;

    } catch (err) {
        alert("Transaction Fail: " + err.message);
        return false;
    }
}

// 6. WITHDRAWAL HISTORY
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
            <div class="bg-white p-4 rounded-2xl flex justify-between items-center mb-3 shadow-sm border border-gray-100">
                <div>
                    <p class="text-xs font-black italic">₹${item.amount / 100} PAYOUT</p>
                    <p class="text-[8px] text-gray-400 font-bold uppercase">${new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <span class="text-[9px] font-black uppercase px-3 py-1 rounded-full ${item.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}">
                    ${item.status}
                </span>
            </div>
        `).join('');
    }
}

// 7. GIFT CODE / REWARD FUNCTION
async function applyGiftCode(code) {
    // Pehle check karein code valid hai ya nahi (Table: gift_codes)
    try {
        const { data: gift, error } = await supabaseClient
            .from('gift_codes')
            .select('*')
            .eq('code', code)
            .eq('is_used', false)
            .maybeSingle();

        if (!gift) {
            alert("Invalid or Used Code!");
            return false;
        }

        // Coins add karein profiles table mein
        const { error: updErr } = await supabaseClient
            .from('profiles')
            .update({ coins: window.coins + gift.amount })
            .eq('id', userId);

        if (updErr) throw updErr;

        // Code ko used mark karein
        await supabaseClient.from('gift_codes').update({ is_used: true }).eq('id', gift.id);

        window.coins += gift.amount;
        refreshGlobalUI();
        alert(`Mubarak ho! ${gift.amount} coins mil gaye.`);
        return true;
    } catch (e) {
        alert("Error: " + e.message);
    }
}

// 8. LOGOUT FUNCTION
async function handleLogout() {
    if (confirm("Logout karna chahte hain?")) {
        await supabaseClient.auth.signOut();
        window.location.replace('login.html');
    }
}

// START APP
initApp();
