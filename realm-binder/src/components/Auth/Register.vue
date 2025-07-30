<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <div class="logo">RB BETA</div>
          <h1 class="register-title">Kayıt Ol</h1>
          <p class="register-subtitle">Yeni bir dünya yaratın...</p>
        </div>
        
        <div class="register-form">
          <div class="form-group">
            <label class="form-label">Kullanıcı Adı</label>
            <input 
              v-model="displayName"
              type="text" 
              class="form-input"
              placeholder="Kullanıcı adınız"
              :disabled="loading"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">E-posta (İsteğe bağlı)</label>
            <input 
              v-model="email"
              type="email" 
              class="form-input"
              placeholder="ornek@email.com (isteğe bağlı)"
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
          
          <div class="form-group">
            <label class="form-label">Şifre Tekrar</label>
            <input 
              v-model="confirmPassword"
              type="password" 
              class="form-input"
              placeholder="Şifrenizi tekrar girin"
              :disabled="loading"
            />
          </div>
          
          <button 
            class="register-button"
            @click="handleRegister"
            :disabled="loading"
          >
            {{ loading ? 'Hesap oluşturuluyor...' : 'Hesap oluştur' }}
          </button>
        </div>
        
        <div class="register-footer">
          <p class="footer-text">
            Zaten hesabınız var mı? 
            <a href="#" class="footer-link" @click="$router.push('/login')">
              Giriş yap
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
import { supabase } from '../../utils/supabase'

const router = useRouter()
const { createUserMapping } = useAuth()

const displayName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

const handleRegister = async () => {
  // Form validasyonu
  if (!displayName.value || !password.value || !confirmPassword.value) {
    alert('Lütfen kullanıcı adı ve şifre alanlarını doldurun.')
    return
  }

  if (password.value !== confirmPassword.value) {
    alert('Şifreler eşleşmiyor!')
    return
  }

  if (password.value.length < 6) {
    alert('Şifre en az 6 karakter olmalıdır.')
    return
  }

  loading.value = true
  
  try {
    // E-posta adresi varsa kullan, yoksa kullanıcı adını e-posta olarak kullan
    const loginEmail = email.value || `${displayName.value}@realmbinder.local`
    
    // Kullanıcı kaydı
    const { data, error } = await supabase.auth.signUp({
      email: loginEmail,
      password: password.value,
      options: {
        data: {
          display_name: displayName.value
        }
      }
    })

    if (error) {
      throw error
    }

    console.log('Kayıt başarılı:', data.user)
    
    // Mapping oluştur
    if (data.user) {
      await createUserMapping(data.user.id, displayName.value, loginEmail)
    }
    
    if (email.value) {
      alert('Hesabınız başarıyla oluşturuldu! E-posta adresinizi kontrol edin.')
    } else {
      alert('Hesabınız başarıyla oluşturuldu! Kullanıcı adınızla giriş yapabilirsiniz.')
    }
    
    router.push('/login')
  } catch (error) {
    console.error('Kayıt hatası:', error)
    alert('Kayıt hatası: ' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #2A2A2A 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-container {
  width: 100%;
  max-width: 400px;
}

.register-card {
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(218, 165, 32, 0.4);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
}

.register-header {
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

.register-title {
  font-size: 28px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.register-subtitle {
  font-size: 16px;
  color: #B0BEC5;
  margin: 0;
}

.register-form {
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 20px;
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

.register-button {
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

.register-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(218, 165, 32, 0.3);
}

.register-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.register-footer {
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
  .register-card {
    padding: 24px;
  }
  
  .register-title {
    font-size: 24px;
  }
}
</style>