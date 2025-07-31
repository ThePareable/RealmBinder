<template>
  <div class="my-games-page">
    <div class="my-games-container">
      <div class="my-games-header">
        <h1>Oyunlarım</h1>
        <p>Katıldığınız oyunları görüntüleyin ve yönetin</p>
        <button @click="loadUserGames" class="refresh-btn" :disabled="loading">
          {{ loading ? 'Yükleniyor...' : 'Yenile' }}
        </button>
      </div>

      <div class="games-grid">
        <div v-for="game in userGames" :key="game.id" class="game-card" @click="joinGame(game)">
          <div class="game-card-header">
            <h3>{{ game.name }}</h3>
            <div class="game-header-actions">
              <span class="game-role" :class="game.role">{{ game.role === 'gm' ? 'GM' : 'Oyuncu' }}</span>
              <button class="game-menu-btn" @click.stop="toggleGameMenu(game.id)"
                :class="{ active: activeMenu === game.id }">
                ⋮
              </button>
            </div>
          </div>

          <!-- Game Menu Dropdown -->
          <div v-if="activeMenu === game.id" class="game-menu-dropdown" @click.stop>
            <div class="game-menu-item" @click="joinGame(game)">
              <span class="menu-icon">🎮</span>
              Oyuna Katıl
            </div>
            <div class="game-menu-item" @click="inviteToGame(game)">
              <span class="menu-icon">📧</span>
              Davet Et
            </div>
            <div v-if="game.role === 'gm'" class="game-menu-item delete" @click="deleteGame(game)">
              <span class="menu-icon">🗑️</span>
              Oyunu Sil
            </div>
            <div v-else class="game-menu-item leave" @click="leaveGame(game)">
              <span class="menu-icon">🚪</span>
              Oyundan Çık
            </div>
          </div>

          <div class="game-card-content">
            <p class="game-description">{{ game.description || 'Açıklama yok' }}</p>
            <div class="game-stats">
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
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { supabase } from '../utils/supabase'

const router = useRouter()
const { user } = useAuth()

const userGames = ref([])
const loading = ref(true)
const activeMenu = ref(null) // For context menu

// Load user's games
const loadUserGames = async () => {
  try {
    loading.value = true
    console.log('Loading games for user:', user.value?.id)

    // First, let's check if the user exists and is authenticated
    if (!user.value || !user.value.id) {
      console.error('User not authenticated')
      userGames.value = []
      return
    }

    // Try a simpler query first to see what's in the game_users table
    const { data: userGamesData, error: userGamesError } = await supabase
      .from('game_users')
      .select('*')
      .eq('user_id', user.value.id)

    console.log('User games data (simple query):', userGamesData)
    console.log('User games error:', userGamesError)

    if (userGamesError) {
      console.error('Error fetching user games:', userGamesError)
      throw userGamesError
    }

    if (!userGamesData || userGamesData.length === 0) {
      console.log('No games found for user')
      userGames.value = []
      return
    }

    // Now get the full game details
    const gameIds = userGamesData.map(ug => ug.game_id)
    console.log('Game IDs to fetch:', gameIds)

    const { data: gamesData, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .in('id', gameIds)

    console.log('Games data:', gamesData)
    console.log('Games error:', gamesError)

    if (gamesError) {
      console.error('Error fetching games:', gamesError)
      throw gamesError
    }

    // Combine the data
    userGames.value = userGamesData.map(userGame => {
      const game = gamesData.find(g => g.id === userGame.game_id)
      if (!game) {
        console.warn('Game not found for ID:', userGame.game_id)
        return null
      }
      return {
        id: game.id,
        name: game.name,
        description: game.description,
        created_at: game.created_at,
        role: userGame.role
      }
    }).filter(Boolean) // Remove null values

    console.log('Final transformed games:', userGames.value)

  } catch (error) {
    console.error('Oyunlar yüklenirken hata:', error)
  } finally {
    loading.value = false
  }
}

// Watch for user authentication state changes
watch(user, (newUser, oldUser) => {
  console.log('User state changed:', { newUser: newUser?.id, oldUser: oldUser?.id })
  if (newUser && newUser.id) {
    console.log('User authenticated, loading games...')
    loadUserGames()
  } else if (!newUser) {
    console.log('User not authenticated, clearing games')
    userGames.value = []
    loading.value = false
  }
}, { immediate: true })

// Join game
const joinGame = (game) => {
  router.push(`/game/${game.id}`)
}

// Create new game
const createNewGame = () => {
  router.push('/create-game')
}

// Leave game
const leaveGame = async (game) => {
  if (!user.value || !user.value.id) {
    console.error('User not authenticated')
    return
  }

  try {
    const { error } = await supabase
      .from('game_users')
      .delete()
      .eq('user_id', user.value.id)
      .eq('game_id', game.id)

    if (error) {
      console.error('Error leaving game:', error)
      throw error
    }

    console.log('User left game:', game.id)
    loadUserGames() // Reload games to update UI
  } catch (error) {
    console.error('Oyundan çıkarken hata:', error)
  }
}

// Delete game (only for GM)
const deleteGame = async (game) => {
  if (!user.value || !user.value.id) {
    console.error('User not authenticated')
    return
  }

  if (game.role !== 'gm') {
    console.error('Only GM can delete the game')
    return
  }

  if (confirm('Bu oyunu silmek istediğinize emin misiniz?')) {
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', game.id)

      if (error) {
        console.error('Error deleting game:', error)
        throw error
      }

      console.log('Game deleted:', game.id)
      loadUserGames() // Reload games to update UI
      router.push('/my-games') // Redirect to my-games page
    } catch (error) {
      console.error('Oyun silinirken hata:', error)
    }
  }
}

// Invite to game (placeholder)
const inviteToGame = (game) => {
  console.log('Invite to game:', game.id)
  alert('Davet sistemi henüz geliştirilmedi. Bu özellik şimdilik kullanılamaz.')
}

// Toggle game menu
const toggleGameMenu = (gameId) => {
  activeMenu.value = activeMenu.value === gameId ? null : gameId
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
  console.log('MyGames component mounted')
  console.log('Current user:', user.value)
  // Don't call loadUserGames here - let the watcher handle it

  // Close menu when clicking outside
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.game-menu-btn') && !event.target.closest('.game-menu-dropdown')) {
      activeMenu.value = null
    }
  })
})
</script>

<style scoped>
.my-games-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #2A2A2A 100%);
  background-image: url('../assets/9jGzye.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  padding: 20px;
  will-change: auto;
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
  font-size: 2rem;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 8px;
  background: linear-gradient(45deg, #DAA520, #FFD700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.my-games-header p {
  font-size: 1rem;
  color: #B0BEC5;
  margin: 0 0 16px 0;
}

.refresh-btn {
  background: linear-gradient(45deg, #8B4513, #DAA520);
  color: #FFFFFF;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(218, 165, 32, 0.3);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  border: 5px solid rgba(218, 165, 32, 0.4);
  border-radius: 2vh;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
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

.game-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 1001;
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

.game-menu-btn {
  background: none;
  border: none;
  color: #B0BEC5;
  font-size: 1.2rem;
  cursor: pointer;
  transition: color 0.3s ease;
  position: relative;
  z-index: 1001;
  padding: 8px;
  border-radius: 4px;
}

.game-menu-btn:hover {
  color: #DAA520;
}

.game-menu-btn.active {
  color: #DAA520;
}

.game-menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-width: 180px;
  padding: 8px 0;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.game-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  color: #B0BEC5;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.game-menu-item:hover {
  background: rgba(218, 165, 32, 0.1);
  color: #DAA520;
}

.game-menu-item.delete {
  color: #FF6B6B;
}

.game-menu-item.delete:hover {
  background: rgba(255, 107, 107, 0.1);
  color: #FF6B6B;
}

.game-menu-item.leave {
  color: #66BB6A;
}

.game-menu-item.leave:hover {
  background: rgba(102, 187, 106, 0.1);
  color: #66BB6A;
}

.menu-icon {
  font-size: 1.1rem;
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
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
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