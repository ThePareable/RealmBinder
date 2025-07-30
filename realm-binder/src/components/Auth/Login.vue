<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo">RB BETA</div>
          <h1 class="login-title">Giriş Yap</h1>
          <p class="login-subtitle">Dünyalarınız bekliyor...</p>
        </div>
        
        <div class="login-form">
          <div class="form-group">
            <label class="form-label">E-posta veya Kullanıcı Adı</label>
            <input 
              v-model="emailOrUsername"
              type="text" 
              class="form-input"
              placeholder="E-posta veya kullanıcı adınız"
              :disabled="loading"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">Şifre</label>
            <input 
              v-model="password"
              type="password" 
              class="form-input"
              placeholder="Şifreniz"
              :disabled="loading"
            />
          </div>
          
          <button 
            class="login-button"
            @click="handleLogin"
            :disabled="loading"
          >
            {{ loading ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
          </button>
        </div>
        
        <div class="login-footer">
          <p class="footer-text">
            Hesabınız yok mu? 
            <a href="#" class="footer-link" @click="$router.push('/register')">
              Kayıt ol
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const router = useRouter()
const { signInWithUsernameOrEmail } = useAuth()

const emailOrUsername = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!emailOrUsername.value || !password.value) {
    alert('Lütfen e-posta/kullanıcı adı ve şifre alanlarını doldurun.')
    return
  }

  loading.value = true
  
  try {
    const { data, error } = await signInWithUsernameOrEmail(
      emailOrUsername.value,
      password.value
    )

    if (error) {
      throw error
    }

    console.log('Giriş başarılı:', data.user)
    router.push('/')
    
  } catch (error) {
    console.error('Giriş hatası:', error)
    alert('Giriş hatası: ' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #2A2A2A 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(218, 165, 32, 0.4);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  font-size: 14px;
  font-weight: 600;
  color: #DAA520;
  margin-bottom: 24px;
  letter-spacing: 1px;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.login-subtitle {
  font-size: 16px;
  color: #B0BEC5;
  margin: 0;
}

.login-form {
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #E0E0E0;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 16px;
  transition: all 0.3s ease;
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

.login-button {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(45deg, #8B4513, #DAA520);
  border: none;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(218, 165, 32, 0.3);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.login-footer {
  text-align: center;
}

.footer-text {
  font-size: 14px;
  color: #B0BEC5;
  margin: 0;
}

.footer-link {
  color: #DAA520;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.footer-link:hover {
  color: #FFD700;
}

@media (max-width: 480px) {
  .login-card {
    padding: 24px;
  }
  
  .login-title {
    font-size: 24px;
  }
}
</style>
