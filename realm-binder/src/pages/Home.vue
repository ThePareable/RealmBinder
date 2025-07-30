<template>
  <div class="home-page">
    <div class="home-container">
      <div class="home-card">
        <div class="home-header">
          <div class="logo">RB BETA</div>
          <h1 class="home-title">RealmBinder</h1>
          <p class="home-subtitle">
            {{ user ? 'Hoş geldiniz!' : 'DnD dünyanızı yönetmeye başlayın' }}
          </p>
        </div>
        
        <div class="home-content">
          <div v-if="!user" class="guest-content">
            <p class="home-description">
              DnD dünyanızı yönetmeye başlamak için giriş yapın veya kayıt olun.
            </p>
            
            <div class="button-group">
              <button class="home-button primary" @click="$router.push('/login')">
                Giriş Yap
              </button>
              <button class="home-button secondary" @click="$router.push('/register')">
                Kayıt Ol
              </button>
            </div>
          </div>
          
          <div v-else class="user-content">
            <p class="home-description">
              Hoş geldiniz, {{ user.user_metadata?.display_name || user.email }}!
            </p>
            
            <div class="button-group">
              <button class="home-button primary" @click="createGame">
                Yeni Oyun Oluştur
              </button>
              <button class="home-button secondary" @click="joinGame">
                Oyuna Katıl
              </button>
            </div>
            
            <div class="user-actions">
              <button class="logout-button" @click="handleLogout">
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
        
        <div class="home-footer">
          <p class="footer-text">
            {{ user 
              ? 'DnD dünyanızı haritalar, wiki sayfaları ve karakter kağıtları ile yönetin'
              : 'DnD dünyanızı haritalar, wiki sayfaları ve karakter kağıtları ile yönetin'
            }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { user, loading, signOut } = useAuth()

const createGame = () => {
  router.push('/create-game')
}

const joinGame = () => {
  // TODO: Oyuna katılma sayfasına yönlendir
  alert('Oyuna katılma özelliği yakında eklenecek!')
}

const handleLogout = async () => {
  await signOut()
  router.push('/')
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #2A2A2A 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.home-container {
  width: 100%;
  max-width: 450px;
}

.home-card {
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(218, 165, 32, 0.4);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
}

.home-header {
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
  margin-bottom: 32px;
}

.home-description {
  font-size: 16px;
  color: #E0E0E0;
  text-align: center;
  margin-bottom: 32px;
  line-height: 1.6;
}

.button-group {
  display: flex;
  gap: 16px;
  flex-direction: column;
  margin-bottom: 24px;
}

.home-button {
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.home-button.primary {
  background: linear-gradient(45deg, #8B4513, #DAA520);
  color: #FFFFFF;
}

.home-button.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.home-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
}

.home-button.primary:hover {
  box-shadow: 0 6px 18px rgba(218, 165, 32, 0.3);
}

.home-button.secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
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

.home-footer {
  text-align: center;
}

.footer-text {
  font-size: 14px;
  color: #9E9E9E;
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 480px) {
  .home-card {
    padding: 24px;
  }
  
  .home-title {
    font-size: 28px;
  }
  
  .button-group {
    gap: 12px;
  }
}

@media (min-width: 768px) {
  .button-group {
    flex-direction: row;
  }
  
  .home-button {
    flex: 1;
  }
}
</style>