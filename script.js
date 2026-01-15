import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ✅ YOUR SUPABASE DETAILS
const SUPABASE_URL = "https://kozmxgymkitcbevtufgz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_sMp15iZ3aHBEz44x6YzISA_3fihZSgX";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginScreen = document.getElementById("loginScreen");
const homeScreen = document.getElementById("homeScreen");
const coinCount = document.getElementById("coinCount");
const loginBtn = document.getElementById("loginBtn");

let userId = null;
let coins = 0;

// 🔐 LOGIN (ANONYMOUS)
loginBtn.addEventListener("click", async () => {
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    alert("Login failed");
    return;
  }

  userId = data.user.id;

  // check user in database
  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (!existingUser) {
    await supabase.from("users").insert({
      id: userId,
      name: "Guest",
      coins: 0,
    });
  } else {
    coins = existingUser.coins;
  }

  coinCount.innerText = coins;

  loginScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
});

// 🪙 EARN COINS
window.earnCoins = async () => {
  coins += 5;
  coinCount.innerText = coins;

  await supabase
    .from("users")
    .update({ coins })
    .eq("id", userId);
};
