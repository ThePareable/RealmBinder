<template>
  <div class="join-game-page">
    <div class="join-game-container">
      <div class="join-game-header">
        <h1>Oyuna Katıl</h1>
        <p>{{ game?.name }} oyununa davet edildiniz</p>
      </div>

      <div class="join-game-content">
        <!-- Game Info -->
        <div class="game-info-section">
          <h3>Oyun Bilgileri</h3>
          <div class="game-details">
            <div class="detail-item">
              <span class="detail-label">Oyun Adı:</span>
              <span class="detail-value">{{ game?.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Açıklama:</span>
              <span class="detail-value">{{ game?.description || 'Açıklama yok' }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Oluşturulma:</span>
              <span class="detail-value">{{ formatDate(game?.created_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Join Form -->
        <div class="join-form-section">
          <h3>Oyuna Katıl</h3>
          <p>Bu oyuna katılmak için giriş yapın veya kayıt olun:</p>
          
          <div class="join-actions">
            <button @click="joinAsPlayer" class="join-btn primary" :disabled="joining">
              {{ joining ? 'Katılıyor...' : 'Oyuncu Olarak Katıl' }}
            </button>
            <button @click="loginFirst" class="join-btn secondary">
              Önce Giriş Yap
            </button>
          </div>
        </div>

        <!-- Error/Success Messages -->
        <div v-if="message" class="message-section" :class="messageType">
          <p>{{ message }}</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Oyun bilgileri yükleniyor...</p>
        </div>

        <!-- Error State -->
        <div v-if="error" class="error-state">
          <div class="error-icon">❌</div>
          <h3>Oyun Bulunamadı</h3>
          <p>{{ error }}</p>
          <button @click="goToHome" class="action-btn">
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { supabase } from '../utils/supabase'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const game = ref(null)
const loading = ref(true)
const joining = ref(false)
const error = ref(null)
const message = ref('')
const messageType = ref('')

// Load game data
const loadGame = async () => {
  try {
    loading.value = true
    error.value = null
    
    const { data, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', route.params.id)
      .single()

    if (gameError) {
      error.value = 'Bu oyun bulunamadı veya artık mevcut değil.'
      return
    }

    game.value = data
  } catch (err) {
    console.error('Oyun yüklenirken hata:', err)
    error.value = 'Oyun yüklenirken bir hata oluştu.'
  } finally {
    loading.value = false
  }
}

// Join as player
const joinAsPlayer = async () => {
  if (!user.value) {
    showMessage('Oyuna katılmak için önce giriş yapmalısınız.', 'error')
    return
  }

  try {
    joining.value = true
    
    // Check if user is already in the game
    const { data: existingUser, error: checkError } = await supabase
      .from('game_users')
      .select('*')
      .eq('game_id', route.params.id)
      .eq('user_id', user.value.id)
      .single()

    if (existingUser) {
      showMessage('Bu oyuna zaten katılmışsınız!', 'success')
      setTimeout(() => {
        router.push(`/game/${route.params.id}`)
      }, 2000)
      return
    }

    // Add user to game
    const { error: joinError } = await supabase
      .from('game_users')
      .insert({
        game_id: route.params.id,
        user_id: user.value.id,
        role: 'player'
      })

    if (joinError) throw joinError

    showMessage('Oyuna başarıyla katıldınız!', 'success')
    setTimeout(() => {
      router.push(`/game/${route.params.id}`)
    }, 2000)

  } catch (err) {
    console.error('Oyuna katılırken hata:', err)
    showMessage('Oyuna katılırken bir hata oluştu.', 'error')
  } finally {
    joining.value = false
  }
}

// Login first
const loginFirst = () => {
  router.push('/login')
}

// Go to home
const goToHome = () => {
  router.push('/')
}

// Show message
const showMessage = (msg, type) => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
    messageType.value = ''
  }, 5000)
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  loadGame()
})
</script>

<style scoped>
.join-game-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #2A2A2A 100%);
  padding: 20px;
}

.join-game-container {
  max-width: 600px;
  margin: 0 auto;
}

.join-game-header {
  text-align: center;
  margin-bottom: 40px;
}

.join-game-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 8px;
  background: linear-gradient(45deg, #DAA520, #FFD700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.join-game-header p {
  font-size: 1.1rem;
  color: #B0BEC5;
  margin: 0;
}

.join-game-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.game-info-section,
.join-form-section {
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(218, 165, 32, 0.3);
  border-radius: 16px;
  padding: 24px;
}

.game-info-section h3,
.join-form-section h3 {
  color: #FFFFFF;
  margin-bottom: 12px;
  font-size: 1.3rem;
}

.game-info-section p,
.join-form-section p {
  color: #B0BEC5;
  margin-bottom: 20px;
  font-size: 0.95rem;
}

.game-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  color: #B0BEC5;
  font-size: 0.9rem;
  font-weight: 500;
}

.detail-value {
  color: #FFFFFF;
  font-size: 0.9rem;
}

.join-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.join-btn {
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.join-btn.primary {
  background: linear-gradient(45deg, #8B4513, #DAA520);
  color: #FFFFFF;
}

.join-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.join-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
}

.join-btn.primary:hover:not(:disabled) {
  box-shadow: 0 6px 18px rgba(218, 165, 32, 0.3);
}

.join-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message-section {
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.message-section.success {
  background: rgba(76, 175, 80, 0.2);
  border: 1px solid rgba(76, 175, 80, 0.4);
  color: #4CAF50;
}

.message-section.error {
  background: rgba(244, 67, 54, 0.2);
  border: 1px solid rgba(244, 67, 54, 0.4);
  color: #F44336;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #B0BEC5;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(218, 165, 32, 0.3);
  border-top: 3px solid #DAA520;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 60px 20px;
  color: #B0BEC5;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 24px;
}

.error-state h3 {
  color: #FFFFFF;
  margin-bottom: 12px;
  font-size: 1.5rem;
}

.error-state p {
  margin-bottom: 32px;
  font-size: 1rem;
}

.action-btn {
  background: linear-gradient(45deg, #8B4513, #DAA520);
  color: #FFFFFF;
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(218, 165, 32, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .join-game-container {
    padding: 0 16px;
  }
  
  .join-game-header h1 {
    font-size: 2rem;
  }
  
  .join-actions {
    gap: 16px;
  }
}
</style> 