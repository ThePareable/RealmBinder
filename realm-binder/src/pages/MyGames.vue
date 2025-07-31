<template>
  <div class="my-games-page">
    <div class="my-games-container">
      <div class="my-games-header">
        <h1>Oyunlarım</h1>
        <p>Katıldığınız oyunları görüntüleyin ve yönetin</p>
      </div>

      <div class="games-grid">
        <div 
          v-for="game in userGames" 
          :key="game.id" 
          class="game-card"
          @click="joinGame(game)"
        >
          <div class="game-card-header">
            <h3>{{ game.name }}</h3>
            <span class="game-role" :class="game.role">{{ game.role === 'gm' ? 'GM' : 'Oyuncu' }}</span>
          </div>
          
          <div class="game-card-content">
            <p class="game-description">{{ game.description || 'Açıklama yok' }}</p>
            <div class="game-stats">
              <span class="stat">
                <span class="stat-icon">👥</span>
                {{ game.player_count || 0 }} Oyuncu
              </span>
              <span class="stat">
                <span class="stat-icon">📅</span>
                {{ formatDate(game.created_at) }}
              </span>
            </div>
          </div>
          
          <div class="game-card-actions">
            <button class="join-btn" @click.stop="joinGame(game)">
              Oyuna Katıl
            </button>
          </div>
        </div>

        <!-- Create New Game Card -->
        <div class="game-card create-new" @click="createNewGame">
          <div class="create-new-content">
            <div class="create-new-icon">+</div>
            <h3>Yeni Oyun Oluştur</h3>
            <p>Yeni bir DnD oyunu başlatın</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Oyunlarınız yükleniyor...</p>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && userGames.length === 0" class="empty-state">
        <div class="empty-icon">🎲</div>
        <h3>Henüz oyuna katılmamışsınız</h3>
        <p>İlk oyununuzu oluşturmak için aşağıdaki butona tıklayın</p>
        <button class="create-first-game-btn" @click="createNewGame">
          İlk Oyununuzu Oluşturun
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { supabase } from '../utils/supabase'

const router = useRouter()
const { user } = useAuth()

const userGames = ref([])
const loading = ref(true)

// Load user's games
const loadUserGames = async () => {
  try {
    loading.value = true
    
    const { data, error } = await supabase
      .from('game_users')
      .select(`
        role,
        games (
          id,
          name,
          description,
          created_at,
          player_count
        )
      `)
      .eq('user_id', user.value.id)

    if (error) throw error

    // Transform the data to a more usable format
    userGames.value = data.map(item => ({
      id: item.games.id,
      name: item.games.name,
      description: item.games.description,
      created_at: item.games.created_at,
      player_count: item.games.player_count,
      role: item.role
    }))

  } catch (error) {
    console.error('Oyunlar yüklenirken hata:', error)
  } finally {
    loading.value = false
  }
}

// Join game
const joinGame = (game) => {
  router.push(`/game/${game.id}`)
}

// Create new game
const createNewGame = () => {
  router.push('/create-game')
}

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  loadUserGames()
})
</script>

<style scoped>
.my-games-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #2A2A2A 100%);
  padding: 20px;
}

.my-games-container {
  max-width: 1200px;
  margin: 0 auto;
}

.my-games-header {
  text-align: center;
  margin-bottom: 40px;
}

.my-games-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 8px;
  background: linear-gradient(45deg, #DAA520, #FFD700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.my-games-header p {
  font-size: 1.1rem;
  color: #B0BEC5;
  margin: 0;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.game-card {
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(218, 165, 32, 0.3);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.game-card:hover {
  transform: translateY(-4px);
  border-color: rgba(218, 165, 32, 0.6);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
}

.game-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.game-card-header h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0;
  flex: 1;
}

.game-role {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.game-role.gm {
  background: linear-gradient(45deg, #8B4513, #DAA520);
  color: #FFFFFF;
}

.game-role.player {
  background: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.game-card-content {
  margin-bottom: 20px;
}

.game-description {
  color: #B0BEC5;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.game-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #9E9E9E;
}

.stat-icon {
  font-size: 1rem;
}

.game-card-actions {
  display: flex;
  justify-content: flex-end;
}

.join-btn {
  background: linear-gradient(45deg, #8B4513, #DAA520);
  color: #FFFFFF;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.join-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(218, 165, 32, 0.3);
}

/* Create New Game Card */
.create-new {
  border: 2px dashed rgba(218, 165, 32, 0.4);
  background: rgba(26, 26, 26, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.create-new:hover {
  border-color: rgba(218, 165, 32, 0.8);
  background: rgba(26, 26, 26, 0.9);
}

.create-new-content {
  text-align: center;
}

.create-new-icon {
  font-size: 3rem;
  color: #DAA520;
  margin-bottom: 16px;
}

.create-new h3 {
  color: #FFFFFF;
  margin-bottom: 8px;
}

.create-new p {
  color: #B0BEC5;
  font-size: 0.9rem;
}

/* Loading State */
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

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #B0BEC5;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 24px;
}

.empty-state h3 {
  color: #FFFFFF;
  margin-bottom: 12px;
  font-size: 1.5rem;
}

.empty-state p {
  margin-bottom: 32px;
  font-size: 1rem;
}

.create-first-game-btn {
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

.create-first-game-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(218, 165, 32, 0.4);
}

/* Responsive Design */
@media (max-width: 768px) {
  .games-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .my-games-header h1 {
    font-size: 2rem;
  }
  
  .game-card {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .my-games-page {
    padding: 16px;
  }
  
  .my-games-header h1 {
    font-size: 1.8rem;
  }
  
  .game-stats {
    flex-direction: column;
    gap: 8px;
  }
}
</style> 