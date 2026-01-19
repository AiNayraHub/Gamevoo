// CONFIGURATION
const SUPABASE_URL = 'https://kozmxgymkitcbevtufgz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sMp15iZ3aHBEz44x6YzISA_3fihZSgX';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let userId = null;
let userEmail = "";
let coins = 0;

// INITIALIZE APP
async function initApp() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        userId = user.id;
        userEmail = user.email;
        await syncAllData();
    } else {
        if (!window.location.pathname.includes('login.html')) {
            window.location.replace('login.html');
        }
    }
}

// SYNC ALL TABLES DATA
async function syncAllData() {
    try {
        // 1. Fetch Profile & Coins
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

        // 2. Update UI across all pages
        updateMasterUI();

        // 3. If on Wallet Page, Load History
        if (document.getElementById('history-container') || document.getElementById('history-list')) {
            loadWithdrawHistory();
        }

    } catch (err) {
        console.error("Sync Error:", err.message);
    }
}

// MASTER UI UPDATE (Har HTML element ko handle karega)
function updateMasterUI() {
    // Coins Update
    const coinIDs = ['p-coins', 'wallet-coins', 'home-coins', 'gift-coins', 'wallet-coins-display'];
    coinIDs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = coins;
            el.classList.remove('hidden'); // Hidden fix
            el.style.display = 'inline-block';
        }
    });

    // Email & User ID Update
    const infoIDs = {
        'p-email': userEmail,
        'user-name': userEmail.split('@')[0],
        'p-uid': "UID: " + userId.substring(0, 10),
        'p-full-uid': userId
    };

    for (let id in infoIDs) {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = infoIDs[id];
            el.classList.remove('hidden');
        }
    }
}

// WITHDRAWAL LOGIC (For wallet.html)
async function requestWithdraw(rsAmount, coinCost) {
    if (coins < coinCost) return alert("Paisa kam hai bhai!");

    const { error: updErr } = await supabaseClient
        .from('profiles')
        .update({ coins: coins - coinCost })
        .eq('id', userId);

    if (!updErr) {
        await supabaseClient.from('withdrawals').insert([
            { user_id: userId, amount: coinCost, status: 'pending' }
        ]);
        alert(`₹${rsAmount} Withdrawal Request Sent!`);
        syncAllData();
    }
}

// HISTORY LOGIC (For wallet.html)
async function loadWithdrawHistory() {
    const { data, error } = await supabaseClient
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: false });

    const container = document.getElementById('history-container') || document.getElementById('history-list');
    if (container && data) {
        container.innerHTML = data.map(tr => `
            <div class="bg-white p-4 rounded-2xl flex justify-between items-center mb-3 shadow-sm border border-gray-100">
                <div>
                    <p class="text-sm font-bold">₹${tr.amount/100} Withdrawal</p>
                    <p class="text-[10px] text-gray-400">${new Date(tr.created_at).toLocaleDateString()}</p>
                </div>
                <span class="text-[10px] font-bold uppercase px-3 py-1 rounded-full ${tr.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}">
                    ${tr.status}
                </span>
            </div>
        `).join('');
    }
}

// LOGOUT
async function handleLogout() {
    if (confirm("Logout?")) {
        await supabaseClient.auth.signOut();
        window.location.replace('login.html');
    }
}

initApp();
            
