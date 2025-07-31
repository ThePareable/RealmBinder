<template>
  <div class="home-page">
    <div class="home-container">
      <div class="home-card">
        <div class="home-header">
          <div class="logo">
            <img src="../assets/logo_white.png" alt="Realm Binder" class="logo-image" />
          </div>
          <p class="home-subtitle">
            {{ user ? 'Hoş geldiniz!' : 'Dünyanızı yönetmeye başlayın' }}
          </p>
        </div>

        <div class="home-content">
          <div v-if="!user" class="guest-content">
            <p class="home-description">
              Dünyanızı yönetmeye başlamak için giriş yapın veya kayıt olun.
            </p>

            <!-- Tab System -->
            <div class="auth-tabs">
              <button class="tab-button" :class="{ active: activeTab === 'login' }" @click="activeTab = 'login'">
                Giriş Yap
              </button>
              <button class="tab-button" :class="{ active: activeTab === 'register' }" @click="activeTab = 'register'">
                Kayıt Ol
              </button>
            </div>

            <!-- Auth Forms Container -->
            <div class="auth-forms-container" :data-active-tab="activeTab">
              <!-- Login Form -->
              <div class="auth-form" :class="{ active: activeTab === 'login' }" data-tab="login">
                <div class="form-group">
                  <label class="form-label">E-posta veya Kullanıcı Adı</label>
                  <input v-model="loginEmailOrUsername" type="text" class="form-input"
                    placeholder="E-posta veya kullanıcı adınız" :disabled="loading" />
                </div>

                <div class="form-group">
                  <label class="form-label">Şifre</label>
                  <input v-model="loginPassword" type="password" class="form-input" placeholder="Şifreniz"
                    :disabled="loading" />
                </div>

                <button class="auth-button" @click="handleLogin" :disabled="loading">
                  {{ loading ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
                </button>
              </div>

              <!-- Register Form -->
              <div class="auth-form" :class="{ active: activeTab === 'register' }" data-tab="register">
                <div class="form-group">
                  <label class="form-label">Kullanıcı Adı</label>
                  <input v-model="registerDisplayName" type="text" class="form-input" placeholder="Kullanıcı adınız"
                    :disabled="loading" />
                </div>

                <div class="form-group">
                  <label class="form-label">E-posta</label>
                  <input v-model="registerEmail" type="email" class="form-input" placeholder="ornek@email.com"
                    :disabled="loading" />
                </div>

                <div class="form-group">
                  <label class="form-label">Şifre</label>
                  <input v-model="registerPassword" type="password" class="form-input" placeholder="Şifreniz"
                    :disabled="loading" />
                </div>

                <div class="form-group">
                  <label class="form-label">Şifre Tekrar</label>
                  <input v-model="registerConfirmPassword" type="password" class="form-input"
                    placeholder="Şifrenizi tekrar girin" :disabled="loading" />
                </div>

                <button class="auth-button" @click="handleRegister" :disabled="loading">
                  {{ loading ? 'Hesap oluşturuluyor...' : 'Hesap oluştur' }}
                </button>
              </div>
            </div>
          </div>

          <div v-else class="user-content">
            <p class="home-description">
              Hoş geldiniz, {{ user.user_metadata?.display_name }}!
            </p>

            <div class="button-group">
              <button class="home-button primary" @click="viewMyGames">
                Oyunlarım
              </button>
              <button class="home-button secondary" @click="createGame">
                Yeni Oyun Oluştur
              </button>
            </div>

            <div class="user-actions">
              <button class="logout-button" @click="handleLogout">
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>


      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { supabase } from '../utils/supabase'

const router = useRouter()
const { user, loading, signOut, signInWithUsernameOrEmail, createUserMapping } = useAuth()

// Tab state
const activeTab = ref('login')

// Login form data
const loginEmailOrUsername = ref('')
const loginPassword = ref('')

// Register form data
const registerDisplayName = ref('')
const registerEmail = ref('')
const registerPassword = ref('')
const registerConfirmPassword = ref('')

const createGame = () => {
  router.push('/create-game')
}

const viewMyGames = () => {
  router.push('/my-games')
}

const joinGame = () => {
  // TODO: Oyuna katılma sayfasına yönlendir
  alert('Oyuna katılma özelliği yakında eklenecek!')
}

const handleLogout = async () => {
  await signOut()
  router.push('/')
}

// Login handler
const handleLogin = async () => {
  if (!loginEmailOrUsername.value || !loginPassword.value) {
    alert('Lütfen e-posta/kullanıcı adı ve şifre alanlarını doldurun.')
    return
  }

  try {
    const { data, error } = await signInWithUsernameOrEmail(
      loginEmailOrUsername.value,
      loginPassword.value
    )

    if (error) {
      throw error
    }

    console.log('Giriş başarılı:', data.user)
    // Form'ları temizle
    loginEmailOrUsername.value = ''
    loginPassword.value = ''

  } catch (error) {
    console.error('Giriş hatası:', error)
    alert('Giriş hatası: ' + error.message)
  }
}

// Register handler
const handleRegister = async () => {
  // Form validasyonu
  if (!registerDisplayName.value || !registerEmail.value || !registerPassword.value || !registerConfirmPassword.value) {
    alert('Lütfen tüm alanları doldurun.')
    return
  }

  if (registerPassword.value !== registerConfirmPassword.value) {
    alert('Şifreler eşleşmiyor!')
    return
  }

  if (registerPassword.value.length < 6) {
    alert('Şifre en az 6 karakter olmalıdır.')
    return
  }

  try {
    // Kullanıcı kaydı
    const { data, error } = await supabase.auth.signUp({
      email: registerEmail.value,
      password: registerPassword.value,
      options: {
        data: {
          display_name: registerDisplayName.value
        }
      }
    })

    if (error) {
      throw error
    }

    console.log('Kayıt başarılı:', data.user)

    // Mapping oluştur
    if (data.user) {
      await createUserMapping(data.user.id, registerDisplayName.value, registerEmail.value)
    }

    alert('Hesabınız başarıyla oluşturuldu! E-posta adresinizi kontrol edin.')

    // Form'ları temizle
    registerDisplayName.value = ''
    registerEmail.value = ''
    registerPassword.value = ''
    registerConfirmPassword.value = ''

    // Login tab'ına geç
    activeTab.value = 'login'

  } catch (error) {
    console.error('Kayıt hatası:', error)
    alert('Kayıt hatası: ' + error.message)
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #2A2A2A 100%);
  background-image: url('../assets/9jGzye.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  will-change: auto;
}

.home-container {
  width: 100%;
  max-width: 450px;
}

.home-card {
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(12px);
  border: 5px solid rgba(218, 165, 32, 0.4);
  border-radius: 2vh;
  padding: 30px 30px 50px 30px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  will-change: transform, box-shadow;
}

.home-header {
  text-align: center;
  margin-bottom: 24px;
}

.logo {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.logo-image {
  height: 20vh;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
  transition: all 0.3s ease;
}

.logo-image:hover {
  transform: scale(1.05);
  filter: drop-shadow(0 4px 12px rgba(218, 165, 32, 0.2));
}

.home-title {
  font-size: 32px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
  background: linear-gradient(45deg, #DAA520, #FFD700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.home-subtitle {
  font-size: 16px;
  color: #B0BEC5;
  margin: 0;
}

.home-content {
  margin-bottom: 24px;
}

.home-description {
  font-size: 14px;
  color: #E0E0E0;
  text-align: center;
  margin-bottom: 24px;
  line-height: 1.5;
}

/* Tab System */
.auth-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 4px;
}

.tab-button {
  flex: 1;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #B0BEC5;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease, box-shadow 0.15s ease;
  position: relative;
  overflow: hidden;
  will-change: color, box-shadow;
  transform: translateZ(0);
}

.tab-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #8B4513, #DAA520);
  transition: left 0.15s ease;
  z-index: -1;
  will-change: left;
}

.tab-button.active {
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(218, 165, 32, 0.3);
}

.tab-button.active::before {
  left: 0;
}

.tab-button:hover:not(.active) {
  color: #FFFFFF;
}

.tab-button:hover:not(.active)::before {
  left: 0;
  opacity: 0.3;
}

/* Auth Forms Container */
.auth-forms-container {
  position: relative;
  overflow: hidden;
  min-height: 220px;
  transition: min-height 0.2s ease;
  will-change: min-height;
  transform: translateZ(0);
  padding-bottom: 10px;
}

.auth-forms-container[data-active-tab="register"] {
  min-height: 385px;
}

/* Auth Forms */
.auth-form {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  opacity: 0;
  transform: translateX(100%) translateZ(0);
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
  will-change: transform, opacity;
  padding-bottom: 30px;
}

.auth-form.active {
  opacity: 1;
  transform: translateX(0) translateZ(0);
  pointer-events: auto;
}

.auth-form:not(.active) {
  opacity: 0;
  transform: translateX(-100%) translateZ(0);
  transition: opacity 0.1s ease, transform 0.1s ease;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #E0E0E0;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 14px;
  transition: border-color 0.2s ease, background-color 0.2s ease;
  box-sizing: border-box;
  will-change: border-color, background-color;
}

.form-input:focus {
  outline: none;
  border-color: #DAA520;
  background: rgba(255, 255, 255, 0.08);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: #9E9E9E;
}

.auth-button {
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(45deg, #8B4513, #DAA520);
  border: none;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  margin-bottom: 15px;
}

.auth-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(218, 165, 32, 0.3);
}

.auth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.user-actions {
  text-align: center;
}

.logout-button {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #B0BEC5;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
}



@media (max-width: 480px) {
  .home-card {
    padding: 24px;
  }

  .home-title {
    font-size: 28px;
  }

  .auth-tabs {
    flex-direction: column;
    gap: 4px;
  }

  .tab-button {
    padding: 10px 12px;
    font-size: 13px;
  }
}

@media (min-width: 768px) {
  .auth-tabs {
    max-width: 300px;
    margin-left: auto;
    margin-right: auto;
  }
}
</style>