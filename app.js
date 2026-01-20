// 1. SUPABASE CONNECTION
const SUPABASE_URL = 'https://kozmxgymkitcbevtufgz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sMp15iZ3aHBEz44x6YzISA_3fihZSgX';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.coins = 0; // Global balance access
let userId = null;
let userEmail = "";

// 2. APP INITIALIZATION
async function initApp() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        userId = user.id;
        userEmail = user.email;
        console.log("Logged in as:", userEmail);
        
        // Database se profiles table ka data load karein
        await syncUserData();
        
        // Force Visibility: Har 1.5 second mein check karo ki balance dikh raha hai ya nahi
        setInterval(refreshGlobalUI, 1500); 
    } else {
        // Agar user login nahi hai aur kisi aur page par hai, toh login par bhejo
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
            // Agar profile nahi hai (Naya User), toh create karein
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

// 4. REFRESH GLOBAL UI (Sabhi pages ke liye)
function refreshGlobalUI() {
    // Balance update karne wali IDs
    const coinIDs = ['p-coins', 'wallet-coins', 'home-coins', 'gift-coins', 'wallet-coins-display'];
    
    coinIDs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = window.coins;
            el.classList.remove('hidden'); // Tailwind hidden fix
            el.style.setProperty('display', 'inline-block', 'important');
        }
    });

    // ₹ Value (100 coins = ₹1)
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

// 5. WITHDRAWAL FUNCTION (UPI & Admin Panel Fix)
async function processWithdrawRequest(coinAmt, upi) {
    try {
        if (window.coins < coinAmt) {
            alert("Insufficient Balance!");
            return false;
        }

        // A. Profile se coins minus karein
        const { error: updErr } = await supabaseClient
            .from('profiles')
            .update({ coins: window.coins - coinAmt })
            .eq('id', userId);

        if (updErr) throw updErr;

        // B. Withdrawal record create karein (upi_id column fix)
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

// 6. GIFT CODE REDEEM (Undefined Fix & English Dialogue)
async function processGiftRedeem(code) {
    try {
        // A. Code validity check karein
        const { data: gift, error } = await supabaseClient
            .from('gift_codes')
            .select('*')
            .eq('code', code)
            .maybeSingle();

        if (error || !gift) {
            return { success: false, message: "This code is invalid or does not exist." };
        }

        // B. Check karein user ne pehle toh use nahi kiya
        const { data: alreadyRedeemed } = await supabaseClient
            .from('redeemed_codes')
            .select('*')
            .eq('user_id', userId)
            .eq('code_text', code)
            .maybeSingle();

        if (alreadyRedeemed) {
            return { success: false, message: "You have already claimed this gift code!" };
        }

        // C. Coins add karein
        const { error: updErr } = await supabaseClient
            .from('profiles')
            .update({ coins: window.coins + gift.amount })
            .eq('id', userId);

        if (updErr) throw updErr;

        // D. Redemption record karein
        await supabaseClient.from('redeemed_codes').insert([
            { user_id: userId, code_text: code }
        ]);

        window.coins += gift.amount;
        refreshGlobalUI();

        return { success: true, amount: gift.amount };

    } catch (err) {
        return { success: false, message: err.message };
    }
}

// 7. WITHDRAWAL HISTORY
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
            <div class="bg-white p-4 rounded-2xl flex justify-between items-center mb-3 shadow-sm border border-gray-50">
                <div class="text-left">
                    <p class="text-[11px] font-black italic text-slate-700">₹${item.amount / 100} PAYOUT</p>
                    <p class="text-[8px] font-bold text-slate-400 uppercase">${new Date(item.created_at).toLocaleDateString()}</p>
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

// INITIALIZE APP
initApp();
                    
