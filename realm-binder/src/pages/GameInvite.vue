<template>
  <div class="invite-page">
    <div class="invite-container">
      <div class="invite-header">
        <h1>Oyun Daveti</h1>
        <p>{{ game?.name }} oyununa davet gönderin</p>
      </div>

      <div class="invite-content">
        <!-- Invite Link Section -->
        <div class="invite-section">
          <h3>Davet Linki</h3>
          <p>Bu linki arkadaşlarınızla paylaşın:</p>
          
          <div class="invite-link-container">
            <input 
              :value="inviteLink" 
              readonly 
              class="invite-link-input"
              ref="inviteLinkInput"
            />
            <button @click="copyInviteLink" class="copy-btn">
              {{ copied ? 'Kopyalandı!' : 'Kopyala' }}
            </button>
          </div>
        </div>

        <!-- Email Invite Section -->
        <div class="invite-section">
          <h3>E-posta ile Davet Et</h3>
          <p>E-posta adresini girerek davet gönderin:</p>
          
          <div class="email-invite-form">
            <input 
              v-model="inviteEmail" 
              type="email" 
              placeholder="E-posta adresi"
              class="email-input"
            />
            <button @click="sendEmailInvite" :disabled="!inviteEmail || sending" class="send-btn">
              {{ sending ? 'Gönderiliyor...' : 'Davet Gönder' }}
            </button>
          </div>
        </div>

        <!-- Game Info Section -->
        <div class="invite-section">
          <h3>Oyun Bilgileri</h3>
          <div class="game-info">
            <div class="info-item">
              <span class="info-label">Oyun Adı:</span>
              <span class="info-value">{{ game?.name }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Açıklama:</span>
              <span class="info-value">{{ game?.description || 'Açıklama yok' }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">Oluşturulma:</span>
              <span class="info-value">{{ formatDate(game?.created_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="invite-actions">
          <button @click="goToGame" class="action-btn primary">
            Oyuna Dön
          </button>
          <button @click="goToMyGames" class="action-btn secondary">
            Oyunlarım
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { supabase } from '../utils/supabase'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const game = ref(null)
const inviteEmail = ref('')
const sending = ref(false)
const copied = ref(false)
const inviteLinkInput = ref(null)

// Generate invite link
const inviteLink = computed(() => {
  if (!game.value) return ''
  return `${window.location.origin}/join-game/${game.value.id}`
})

// Load game data
const loadGame = async () => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', route.params.id)
      .single()

    if (error) throw error
    game.value = data
  } catch (error) {
    console.error('Oyun yüklenirken hata:', error)
  }
}

// Copy invite link
const copyInviteLink = async () => {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Link kopyalanırken hata:', error)
  }
}

// Send email invite
const sendEmailInvite = async () => {
  if (!inviteEmail.value.trim()) return

  try {
    sending.value = true
    
    // TODO: Implement email sending functionality
    // For now, just show success message
    alert(`${inviteEmail.value} adresine davet gönderildi!`)
    inviteEmail.value = ''
    
  } catch (error) {
    console.error('Davet gönderilirken hata:', error)
    alert('Davet gönderilirken bir hata oluştu.')
  } finally {
    sending.value = false
  }
}

// Navigation functions
const goToGame = () => {
  router.push(`/game/${route.params.id}`)
}

const goToMyGames = () => {
  router.push('/my-games')
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
.invite-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #2A2A2A 100%);
  padding: 20px;
}

.invite-container {
  max-width: 800px;
  margin: 0 auto;
}

.invite-header {
  text-align: center;
  margin-bottom: 40px;
}

.invite-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 8px;
  background: linear-gradient(45deg, #DAA520, #FFD700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.invite-header p {
  font-size: 1.1rem;
  color: #B0BEC5;
  margin: 0;
}

.invite-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.invite-section {
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(218, 165, 32, 0.3);
  border-radius: 16px;
  padding: 24px;
}

.invite-section h3 {
  color: #FFFFFF;
  margin-bottom: 12px;
  font-size: 1.3rem;
}

.invite-section p {
  color: #B0BEC5;
  margin-bottom: 20px;
  font-size: 0.95rem;
}

.invite-link-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.invite-link-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  color: #FFFFFF;
  font-size: 0.9rem;
  font-family: monospace;
}

.invite-link-input:focus {
  outline: none;
  border-color: #DAA520;
}

.copy-btn {
  background: linear-gradient(45deg, #8B4513, #DAA520);
  color: #FFFFFF;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.copy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(218, 165, 32, 0.3);
}

.email-invite-form {
  display: flex;
  gap: 12px;
  align-items: center;
}

.email-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  color: #FFFFFF;
  font-size: 0.9rem;
}

.email-input:focus {
  outline: none;
  border-color: #DAA520;
}

.email-input::placeholder {
  color: #9E9E9E;
}

.send-btn {
  background: linear-gradient(45deg, #8B4513, #DAA520);
  color: #FFFFFF;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(218, 165, 32, 0.3);
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.game-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #B0BEC5;
  font-size: 0.9rem;
  font-weight: 500;
}

.info-value {
  color: #FFFFFF;
  font-size: 0.9rem;
}

.invite-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.action-btn {
  padding: 14px 28px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.primary {
  background: linear-gradient(45deg, #8B4513, #DAA520);
  color: #FFFFFF;
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
}

.action-btn.primary:hover {
  box-shadow: 0 6px 18px rgba(218, 165, 32, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .invite-container {
    padding: 0 16px;
  }
  
  .invite-header h1 {
    font-size: 2rem;
  }
  
  .invite-link-container,
  .email-invite-form {
    flex-direction: column;
    gap: 12px;
  }
  
  .invite-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}
</style> 